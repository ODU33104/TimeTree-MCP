/**
 * HTTP Client Wrapper
 * Provides a wrapper around native fetch with common headers, timeout, and error handling.
 */

import { TIMETREE_CONFIG } from '../config/config.js';
import { logger } from './logger.js';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface HttpClientOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export class HttpClient {
  private defaultTimeout: number;
  private sessionCookie?: string;
  private csrfToken?: string;

  constructor(options: HttpClientOptions = {}) {
    this.defaultTimeout = options.timeout || 30000;
  }

  setSessionCookie(cookie: string): void {
    this.sessionCookie = cookie;
  }

  getSessionCookie(): string | undefined {
    return this.sessionCookie;
  }

  clearSessionCookie(): void {
    this.sessionCookie = undefined;
  }

  setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  getCsrfToken(): string | undefined {
    return this.csrfToken;
  }

  clearCsrfToken(): void {
    this.csrfToken = undefined;
  }

  private buildHeaders(
    additionalHeaders?: Record<string, string>,
    requiresCsrf: boolean = false
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...TIMETREE_CONFIG.HEADERS,
      ...additionalHeaders,
    };

    if (this.sessionCookie) {
      headers['Cookie'] = `${TIMETREE_CONFIG.SESSION_COOKIE_NAME}=${this.sessionCookie}`;
    }

    if (requiresCsrf && this.csrfToken) {
      headers['x-csrf-token'] = this.csrfToken;
    }

    return headers;
  }

  async request<T>(
    url: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      timeout?: number;
      requiresCsrf?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, headers, timeout = this.defaultTimeout, requiresCsrf = false } = options;

    // Credentials must never be sent to an arbitrary or redirected host.
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid TimeTree API URL');
    }
    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'timetreeapp.com' ||
        parsedUrl.port || parsedUrl.username || parsedUrl.password) {
      throw new Error('Untrusted TimeTree API origin');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger.debug(`HTTP ${method}`);

      const response = await fetch(url, {
        method,
        headers: this.buildHeaders(headers, requiresCsrf),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        redirect: 'error', // Never forward credentials across redirects.
      });

      clearTimeout(timeoutId);

      // Extract session cookie from Set-Cookie header if present
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const sessionMatch = setCookie.match(/_session_id=([^;]+)/);
        if (sessionMatch) {
          this.sessionCookie = sessionMatch[1];
          logger.debug('Session cookie updated');
        }
      }

      // Extract CSRF token from response headers if present
      const csrfTokenHeader = response.headers.get('x-csrf-token');
      if (csrfTokenHeader) {
        this.csrfToken = csrfTokenHeader;
        logger.debug('CSRF token updated from response header');
      }

      // Handle non-2xx responses
      if (!response.ok) {
        logger.error(`HTTP request failed with status ${response.status}`);
        // Preserve only the numeric API error code used for session renewal.
        // Never keep arbitrary private response data on the thrown exception.
        let code: number | undefined;
        try {
          const raw = await response.text();
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && 'error' in parsed) {
            const errorField = (parsed as { error?: unknown }).error;
            if (errorField && typeof errorField === 'object' && 'code' in errorField) {
              const candidate = (errorField as { code?: unknown }).code;
              if (typeof candidate === 'number' && Number.isSafeInteger(candidate)) code = candidate;
            }
          }
        } catch {
          // Invalid or non-JSON response: no code.
        }

        throw new HttpError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
          code === undefined ? undefined : JSON.stringify({ error: { code } })
        );
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as any;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof HttpError) {
        throw error;
      }

      if ((error as any).name === 'AbortError') {
        logger.error('Request timeout', { timeout });
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      logger.error('Network error');
      throw new Error('Network request failed');
    }
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  async post<T>(
    url: string,
    body: any,
    headers?: Record<string, string>,
    requiresCsrf: boolean = true
  ): Promise<T> {
    return this.request<T>(url, { method: 'POST', body, headers, requiresCsrf });
  }

  async put<T>(
    url: string,
    body: any,
    headers?: Record<string, string>,
    requiresCsrf: boolean = false
  ): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body, headers, requiresCsrf });
  }

  async delete<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
    requiresCsrf: boolean = true
  ): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', body, headers, requiresCsrf });
  }
}
