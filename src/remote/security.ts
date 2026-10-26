/** Security boundary for an unofficial, self-hosted remote MCP endpoint. */
import { timingSafeEqual } from 'node:crypto';
import { isToolAllowed } from '../utils/tool-access.js';

export type RemotePolicy = {
  bearerToken: string;
  allowedOrigins: ReadonlySet<string>;
  allowWrites: boolean;
  maxBodyBytes: number;
};

export function loadRemotePolicy(env: NodeJS.ProcessEnv = process.env): RemotePolicy {
  const token = env.TIMETREE_REMOTE_BEARER_TOKEN ?? '';
  if (Buffer.byteLength(token, 'utf8') < 32) {
    throw new Error('TIMETREE_REMOTE_BEARER_TOKEN must contain at least 32 UTF-8 bytes');
  }
  const origins = (env.TIMETREE_REMOTE_ALLOWED_ORIGINS ?? '')
    .split(',').map((value) => value.trim()).filter(Boolean);
  if (origins.some((value) => value === '*' || value === 'null' || !/^https:\/\/[^/]+$/.test(value))) {
    throw new Error('Allowed origins must be explicit HTTPS origins; wildcards are forbidden');
  }
  const maxBodyBytes = Number(env.TIMETREE_REMOTE_MAX_BODY_BYTES ?? 1048576);
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1024 || maxBodyBytes > 10485760) {
    throw new Error('Invalid TIMETREE_REMOTE_MAX_BODY_BYTES');
  }
  return {
    bearerToken: token,
    allowedOrigins: new Set(origins),
    allowWrites: env.TIMETREE_REMOTE_ALLOW_WRITES === 'true',
    maxBodyBytes,
  };
}

export function authorizeRemoteRequest(
  headers: { authorization?: string; origin?: string },
  policy: RemotePolicy,
): 200 | 401 | 403 {
  if (headers.origin !== undefined && !policy.allowedOrigins.has(headers.origin)) return 403;
  const authorization = headers.authorization ?? '';
  const prefix = 'Bearer ';
  if (!authorization.startsWith(prefix)) return 401;
  const provided = Buffer.from(authorization.slice(prefix.length), 'utf8');
  const expected = Buffer.from(policy.bearerToken, 'utf8');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return 401;
  return 200;
}

export function isRemoteToolAllowed(
  name: string,
  allowWrites: boolean,
): boolean {
  if (allowWrites) return true;
  return /^(list_|get_|search_)/.test(name);
}
