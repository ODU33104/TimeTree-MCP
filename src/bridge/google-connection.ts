/**
 * Local desktop Google OAuth session manager.
 *
 * Starts an ephemeral HTTP loopback callback and holds OAuth secrets only in
 * process memory. No credentials enter MCP tool results, logs, or files.
 * Intended for local stdio MCP clients, not hosted/remote clients.
 */
import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  startGoogleOAuth, completeGoogleOAuth, refreshGoogleOAuth,
  GOOGLE_CALENDAR_LIST_SCOPE, GOOGLE_EVENTS_READ_SCOPE,
  type GoogleOAuthAttempt, type GoogleOAuthTokens, type OAuthFetch,
} from './google-oauth.js';

export class GoogleNotConnectedError extends Error {
  constructor() {
    super('Google Calendar is not connected');
    this.name = 'GoogleNotConnectedError';
  }
}

export class GoogleOAuthConfigurationError extends Error {
  constructor() {
    super('Google OAuth client ID is not configured');
    this.name = 'GoogleOAuthConfigurationError';
  }
}

const AUTH_TIMEOUT_MS = 5 * 60_000;
const CALLBACK_PATH = '/timetree-mcp/google-oauth/callback';

export type GoogleConnectionState = {
  configured: boolean;
  connected: boolean;
  authorizationPending: boolean;
  expiresAtMs: number | null;
  grantedScopes: string[];
};

export type GoogleConnectionStart = {
  authorizationUrl: string;
  expiresAtMs: number;
  notice: string;
};

export interface GoogleConnection {
  status(): GoogleConnectionState;
  begin(): Promise<GoogleConnectionStart>;
  accessToken(): Promise<string>;
  disconnect(): void;
}

type Pending = {
  attempt: GoogleOAuthAttempt;
  server: Server;
  port: number;
  timer: NodeJS.Timeout;
};

export class GoogleLocalConnection implements GoogleConnection {
  private pending: Pending | null = null;
  private tokens: GoogleOAuthTokens | null = null;
  private refreshInFlight: Promise<string> | null = null;
  private generation = 0;

  constructor(
    private readonly clientId: string | undefined,
    private readonly clientSecret?: string,
    private readonly oauthFetch?: OAuthFetch,
  ) {}

  status(): GoogleConnectionState {
    return {
      configured: typeof this.clientId === 'string' && this.clientId.length > 0,
      connected: this.tokens !== null,
      authorizationPending: this.pending !== null,
      expiresAtMs: this.tokens?.expiresAtMs ?? null,
      grantedScopes: [...(this.tokens?.grantedScopes ?? [])],
    };
  }

  async begin(): Promise<GoogleConnectionStart> {
    if (!this.clientId) throw new GoogleOAuthConfigurationError();
    if (this.pending) throw new Error('Google authorization is already pending');
    if (this.tokens) throw new Error('Disconnect the current Google account before authorizing another');
    this.generation++;

    const server = createServer((request, response) => {
      void this.handleCallback(request, response);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
          server.off('error', reject);
          resolve();
        });
      });
    } catch {
      server.close();
      throw new Error('Could not open a local Google OAuth callback port');
    }

    const address = server.address() as AddressInfo | null;
    if (!address || !address.port) {
      server.close();
      throw new Error('Local OAuth callback port unavailable');
    }
    const port = address.port;
    try {
      const attempt = startGoogleOAuth(
        this.clientId,
        'http://127.0.0.1:' + port + CALLBACK_PATH,
        [GOOGLE_CALENDAR_LIST_SCOPE, GOOGLE_EVENTS_READ_SCOPE],
      );
      const expiresAtMs = Date.now() + AUTH_TIMEOUT_MS;
      const timer = setTimeout(() => this.cancelPending(), AUTH_TIMEOUT_MS);
      timer.unref();
      this.pending = { attempt, server, port, timer };
      return {
        authorizationUrl: attempt.authorizationUrl,
        expiresAtMs,
        notice: 'Open the authorization URL in a browser on the SAME computer as the MCP server. Never paste the callback URL or authorization code into chat. The link expires after 5 minutes.',
      };
    } catch {
      server.close();
      throw new Error('Could not initialize local Google OAuth');
    }
  }

  private respond(response: ServerResponse, status: number, message: string): void {
    if (response.headersSent || response.writableEnded) return;
    response.writeHead(status, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'",
    });
    response.end(message);
  }

  private async handleCallback(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const pending = this.pending;
    if (!pending) return this.respond(response, 410, 'Authorization no longer active.');
    if (request.method !== 'GET' ||
      request.headers.host !== '127.0.0.1:' + pending.port) {
      return this.respond(response, 403, 'OAuth callback rejected.');
    }
    let url: URL;
    try {
      url = new URL(request.url ?? '/', 'http://127.0.0.1:' + pending.port);
    } catch {
      return this.respond(response, 400, 'Invalid OAuth callback.');
    }
    if (url.pathname !== CALLBACK_PATH) return this.respond(response, 404, 'Not found.');

    // Only the expected callback state consumes this attempt. Random probes
    // must not prevent the legitimate user from completing authorization.
    if (url.searchParams.get('state') !== pending.attempt.state) {
      return this.respond(response, 403, 'OAuth callback state mismatch.');
    }
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (!code && !error) return this.respond(response, 400, 'Missing authorization result.');

    this.cancelPending();
    const generation = this.generation;
    if (error) return this.respond(response, 400, 'Google authorization was denied or cancelled.');
    try {
      const next = await completeGoogleOAuth(pending.attempt, code!, pending.attempt.state, {
        ...(this.clientSecret ? { clientSecret: this.clientSecret } : {}),
        ...(this.oauthFetch ? { fetcher: this.oauthFetch } : {}),
      });
      if (this.generation !== generation) {
        return this.respond(response, 410, 'Authorization no longer active.');
      }
      // Granted scopes are drawn from the token response; do not silently
      // widen permissions when the user did not grant the requested scopes.
      if (!next.grantedScopes.includes(GOOGLE_CALENDAR_LIST_SCOPE) ||
        !next.grantedScopes.includes(GOOGLE_EVENTS_READ_SCOPE)) {
        this.tokens = null;
        return this.respond(response, 403, 'Google did not grant required read-only calendar permissions.');
      }
      this.tokens = next;
      return this.respond(response, 200, 'Google Calendar connected. Return to your MCP client.');
    } catch {
      this.tokens = null;
      return this.respond(response, 502, 'Google authorization failed. Restart from your MCP client.');
    }
  }

  private cancelPending(): void {
    const current = this.pending;
    this.pending = null;
    if (!current) return;
    clearTimeout(current.timer);
    current.server.close();
  }

  async accessToken(): Promise<string> {
    const current = this.tokens;
    if (!current) throw new GoogleNotConnectedError();
    if (current.expiresAtMs > Date.now() + 60_000) return current.accessToken;
    if (!current.refreshToken || !this.clientId) {
      this.tokens = null;
      throw new GoogleNotConnectedError();
    }
    if (!this.refreshInFlight) {
      this.refreshInFlight = (async () => {
        try {
          const updated = await refreshGoogleOAuth(this.clientId!, current.refreshToken!, {
            ...(this.clientSecret ? { clientSecret: this.clientSecret } : {}),
            ...(this.oauthFetch ? { fetcher: this.oauthFetch } : {}),
          });
          if (this.tokens !== current) throw new Error('Google Calendar authorization changed');
          this.tokens = {
            ...updated,
            refreshToken: updated.refreshToken ?? current.refreshToken,
            grantedScopes: updated.grantedScopes.length ? updated.grantedScopes : current.grantedScopes,
          };
          return this.tokens.accessToken;
        } catch {
          if (this.tokens === current) this.tokens = null;
          throw new GoogleNotConnectedError();
        }
      })().finally(() => { this.refreshInFlight = null; });
    }
    return this.refreshInFlight;
  }

  disconnect(): void {
    this.generation++;
    this.cancelPending();
    this.tokens = null;
  }
}
