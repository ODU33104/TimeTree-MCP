/**
 * Google installed-desktop OAuth 2.0 + PKCE primitives.
 * The caller must keep state and codeVerifier in process memory, never in
 * chat transcripts, tool results, or logs. No token persistence is performed.
 *
 * This is an OAuth building block, NOT an exposed MCP login workflow.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const GOOGLE_CALENDAR_LIST_SCOPE =
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly';
export const GOOGLE_EVENTS_READ_SCOPE =
  'https://www.googleapis.com/auth/calendar.events.readonly';
export const GOOGLE_EVENTS_WRITE_SCOPE =
  'https://www.googleapis.com/auth/calendar.events';

export type GoogleOAuthScope =
  | typeof GOOGLE_CALENDAR_LIST_SCOPE
  | typeof GOOGLE_EVENTS_READ_SCOPE
  | typeof GOOGLE_EVENTS_WRITE_SCOPE;

export type GoogleOAuthAttempt = {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeVerifier: string;
  scopes: GoogleOAuthScope[];
};

export type GoogleOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAtMs: number;
  grantedScopes: string[];
};

export type OAuthFetch = (
  url: string,
  init: { method: 'POST'; headers: Record<string, string>; body: string; signal: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const fetchOAuth: OAuthFetch = (url, init) => fetch(url, init);

function required(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid ' + name);
  return value;
}

function loopbackRedirect(uri: string): string {
  const url = new URL(uri);
  if (url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !url.port || Number(url.port) < 1024 || Number(url.port) > 65535 ||
    url.username || url.password || url.hash || url.search) {
    throw new Error('Google OAuth requires an explicit desktop loopback redirect');
  }
  return url.toString();
}

function allowedScopes(scopes: readonly GoogleOAuthScope[]): GoogleOAuthScope[] {
  const allowed = new Set<string>([
    GOOGLE_CALENDAR_LIST_SCOPE, GOOGLE_EVENTS_READ_SCOPE, GOOGLE_EVENTS_WRITE_SCOPE,
  ]);
  if (!scopes.length || scopes.some(scope => !allowed.has(scope))) {
    throw new Error('Unsupported Google OAuth scope');
  }
  return Array.from(new Set(scopes));
}

export function startGoogleOAuth(
  clientId: string,
  redirectUri: string,
  scopes: readonly GoogleOAuthScope[] = [GOOGLE_CALENDAR_LIST_SCOPE, GOOGLE_EVENTS_READ_SCOPE],
): GoogleOAuthAttempt {
  required(clientId, 'OAuth client ID');
  const redirect = loopbackRedirect(redirectUri);
  const requestedScopes = allowedScopes(scopes);
  const state = randomBytes(24).toString('base64url');
  const codeVerifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: requestedScopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });
  return {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?' + params,
    clientId, redirectUri: redirect, state, codeVerifier, scopes: requestedScopes,
  };
}

function parseToken(json: unknown): GoogleOAuthTokens {
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('Invalid Google token response');
  const item = json as Record<string, unknown>;
  const accessToken = required(item.access_token, 'access token');
  const expiresIn = item.expires_in;
  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0 || expiresIn > 86_400) {
    throw new Error('Invalid Google token expiry');
  }
  if (item.refresh_token !== undefined && typeof item.refresh_token !== 'string') {
    throw new Error('Invalid Google refresh token');
  }
  return {
    accessToken,
    ...(typeof item.refresh_token === 'string' && item.refresh_token
      ? { refreshToken: item.refresh_token }
      : {}),
    expiresAtMs: Date.now() + expiresIn * 1000,
    grantedScopes: typeof item.scope === 'string' ? item.scope.split(' ').filter(Boolean) : [],
  };
}

async function exchange(
  params: URLSearchParams,
  fetcher: OAuthFetch,
): Promise<GoogleOAuthTokens> {
  let response;
  try {
    response = await fetcher('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: params.toString(),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error('Google token endpoint is unavailable');
  }
  if (!response.ok) throw new Error('Google OAuth token exchange failed (HTTP ' + response.status + ')');
  let json: unknown;
  try { json = await response.json(); } catch { throw new Error('Invalid Google OAuth JSON'); }
  return parseToken(json);
}

/**
 * Exchanges an authorization code only after a constant-time state check.
 * The calling loopback server must reject repeated callbacks and clear the
 * attempt immediately after this call, regardless of success.
 */
export async function completeGoogleOAuth(
  attempt: GoogleOAuthAttempt,
  authorizationCode: string,
  returnedState: string,
  opts: { clientSecret?: string; fetcher?: OAuthFetch } = {},
): Promise<GoogleOAuthTokens> {
  required(authorizationCode, 'OAuth code');
  const received = typeof returnedState === 'string' ? Buffer.from(returnedState) : Buffer.alloc(0);
  const expected = Buffer.from(attempt.state);
  if (!received.length || received.length !== expected.length ||
      !timingSafeEqual(received, expected)) {
    throw new Error('Google OAuth state mismatch');
  }
  const params = new URLSearchParams({
    client_id: attempt.clientId,
    redirect_uri: attempt.redirectUri,
    grant_type: 'authorization_code',
    code: authorizationCode,
    code_verifier: attempt.codeVerifier,
  });
  if (opts.clientSecret) params.set('client_secret', opts.clientSecret);
  return exchange(params, opts.fetcher ?? fetchOAuth);
}

export async function refreshGoogleOAuth(
  clientId: string,
  refreshToken: string,
  opts: { clientSecret?: string; fetcher?: OAuthFetch } = {},
): Promise<GoogleOAuthTokens> {
  const params = new URLSearchParams({
    client_id: required(clientId, 'OAuth client ID'),
    refresh_token: required(refreshToken, 'refresh token'),
    grant_type: 'refresh_token',
  });
  if (opts.clientSecret) params.set('client_secret', opts.clientSecret);
  return exchange(params, opts.fetcher ?? fetchOAuth);
}
