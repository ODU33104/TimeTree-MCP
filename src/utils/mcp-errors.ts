import { z } from 'zod';
import { SERVER_VERSION } from '../config/config.js';

export type ErrorCode =
  | 'AUTH_FAILED'
  | 'GOOGLE_NOT_CONNECTED'
  | 'GOOGLE_NOT_CONFIGURED'
  | 'GOOGLE_AUTH'
  | 'GOOGLE_API'
  | 'GOOGLE_WRITE_UNCERTAIN'
  | 'UPSTREAM_FORMAT'
  | 'NETWORK'
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'UNKNOWN';

type Issue = {
  code: string;
  path: PropertyKey[];
};

type ClassifiedError = {
  code: ErrorCode;
  detail?: string;
  paths?: string[];
  reasons?: Array<{
    nameJa: string;
    nameEn: string;
    reasonJa: string;
    reasonEn: string;
  }>;
};

type ToolErrorResult = {
  isError: true;
  content: [{ type: 'text'; text: string }];
};

const ISSUE_URL =
  'https://github.com/ODU33104/TimeTree-MCP/issues';

const SAFE_SEGMENT = /^[A-Za-z_][A-Za-z0-9_]{0,39}$/;

const MAX_ITEMS = 3;
const MAX_CAUSE_DEPTH = 5;

export class InvalidInputError extends Error {
  readonly issues: ReadonlyArray<Issue>;

  constructor(issues: ReadonlyArray<Issue>) {
    super('Invalid tool input');
    this.name = 'InvalidInputError';
    this.issues = issues;
  }
}

export function parseToolInput<T extends z.ZodType>(
  schema: T,
  args: unknown,
): z.output<T> {
  const result = schema.safeParse(args);

  if (!result.success) {
    throw new InvalidInputError(
      result.error.issues.map((issue) => ({
        code: issue.code,
        path: [...issue.path],
      })),
    );
  }

  return result.data;
}

/** A tool-argument problem written by this server: argument name and reasons only, never the value. */
export class InvalidArgumentError extends Error {
  constructor(
    readonly argument: string,
    readonly reasonJa: string,
    readonly reasonEn: string,
  ) {
    super('Invalid tool argument');
    this.name = 'InvalidArgumentError';
  }
}

function asRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function getField(
  value: unknown,
  key: string,
): unknown {
  const record = asRecord(value);
  if (!record) return undefined;

  try {
    return record[key];
  } catch {
    return undefined;
  }
}

function safePath(path: readonly PropertyKey[]): string {
  let result = '';

  for (const segment of path) {
    if (
      typeof segment === 'number' &&
      Number.isSafeInteger(segment) &&
      segment >= 0
    ) {
      result += `[${segment}]`;
      continue;
    }

    const part =
      typeof segment === 'string' &&
      SAFE_SEGMENT.test(segment)
        ? segment
        : '*';

    result += result.length === 0 ? part : `.${part}`;
  }

  return result;
}

function extractIssues(error: unknown): Issue[] {
  const raw = getField(error, 'issues');

  if (!Array.isArray(raw)) {
    return [];
  }

  const issues: Issue[] = [];

  for (const item of raw) {
    const code = getField(item, 'code');
    const path = getField(item, 'path');

    if (typeof code !== 'string' || !Array.isArray(path)) {
      continue;
    }

    const safeSegments: PropertyKey[] = [];

    for (const segment of path) {
      if (
        typeof segment === 'string' ||
        typeof segment === 'number' ||
        typeof segment === 'symbol'
      ) {
        safeSegments.push(segment);
      } else {
        safeSegments.push('*');
      }
    }

    issues.push({
      code,
      path: safeSegments,
    });
  }

  return issues;
}

function uniquePaths(issues: readonly Issue[]): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();

  for (const issue of issues) {
    const path = safePath(issue.path);

    if (!path || seen.has(path)) {
      continue;
    }

    seen.add(path);
    paths.push(path);

    if (paths.length >= MAX_ITEMS) {
      break;
    }
  }

  return paths;
}

function issueReason(code: string): {
  ja: string;
  en: string;
} {
  switch (code) {
    case 'too_small':
      return {
        ja: '短すぎます',
        en: 'too short',
      };

    case 'too_big':
      return {
        ja: '長すぎます',
        en: 'too long',
      };

    case 'invalid_value':
      return {
        ja: 'サポートされていない値です',
        en: 'unsupported value',
      };

    case 'unrecognized_keys':
      return {
        ja: '許可されていないフィールドです',
        en: 'unknown field',
      };

    default:
      return {
        ja: '必須項目が無いか、型が不正です',
        en: 'missing or wrong type',
      };
  }
}

function inputReasons(
  issues: readonly Issue[],
): NonNullable<ClassifiedError['reasons']> {
  const reasons: NonNullable<ClassifiedError['reasons']> = [];
  const seen = new Set<string>();

  for (const issue of issues) {
    const path = safePath(issue.path);
    const reason = issueReason(issue.code);

    const nameJa = path || '引数の値';
    const nameEn = path || 'argument value';

    const key = `${nameEn}\u0000${reason.en}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    reasons.push({
      nameJa,
      nameEn,
      reasonJa: reason.ja,
      reasonEn: reason.en,
    });

    if (reasons.length >= MAX_ITEMS) {
      break;
    }
  }

  if (reasons.length === 0) {
    const reason = issueReason('invalid_type');

    reasons.push({
      nameJa: '引数の値',
      nameEn: 'argument value',
      reasonJa: reason.ja,
      reasonEn: reason.en,
    });
  }

  return reasons;
}

function genericInputReason(): NonNullable<
  ClassifiedError['reasons']
> {
  return [{
    nameJa: '引数の値',
    nameEn: 'argument value',
    reasonJa: '引数の値が不正です',
    reasonEn: "a value is invalid; check the tool's arguments",
  }];
}

function calendarInputReason(): NonNullable<
  ClassifiedError['reasons']
> {
  return [{
    nameJa: 'calendar_id',
    nameEn: 'calendar_id',
    reasonJa: 'カレンダーが見つかりません',
    reasonEn: 'calendar not found; use list_calendars for valid IDs',
  }];
}

function classifyOne(error: unknown): ClassifiedError | undefined {
  const safeMessage = getField(error, 'safeMessage');
  if (typeof safeMessage === 'string') {
    return { code: 'UNKNOWN', detail: redactIdentifiers(safeMessage) };
  }
  const name = getField(error, 'name');
  const statusCode = getField(error, 'statusCode');
  const code = getField(error, 'code');

  if (name === 'InvalidInputError') {
    return {
      code: 'INVALID_INPUT',
      reasons: inputReasons(extractIssues(error)),
    };
  }

  if (name === 'InvalidArgumentError') {
    const argument = String(getField(error, 'argument'));
    return {
      code: 'INVALID_INPUT',
      reasons: [{
        nameJa: argument,
        nameEn: argument,
        reasonJa: String(getField(error, 'reasonJa')),
        reasonEn: String(getField(error, 'reasonEn')),
      }],
    };
  }
  if (name === 'InvalidCalendarError') {
    return {
      code: 'INVALID_INPUT',
      reasons: calendarInputReason(),
    };
  }

  if (name === 'GoogleNotConnectedError') {
    return { code: 'GOOGLE_NOT_CONNECTED' };
  }
  if (name === 'GoogleOAuthConfigurationError') {
    return { code: 'GOOGLE_NOT_CONFIGURED' };
  }
  if (name === 'GoogleApiError') {
    const status = getField(error, 'status');
    return { code: status === 401 || status === 403 ? 'GOOGLE_AUTH' : 'GOOGLE_API' };
  }
  if (name === 'GoogleWriteUncertainError') {
    return { code: 'GOOGLE_WRITE_UNCERTAIN' };
  }

  if (
    name === 'AuthenticationError' ||
    statusCode === 401 ||
    statusCode === 403
  ) {
    return { code: 'AUTH_FAILED' };
  }

  if (name === 'ZodError') {
    return {
      code: 'UPSTREAM_FORMAT',
      paths: uniquePaths(extractIssues(error)),
    };
  }

  if (statusCode === 429) {
    return { code: 'RATE_LIMITED' };
  }

  if (code === 'NETWORK') {
    return { code: 'NETWORK' };
  }

  if (statusCode === 404) {
    return { code: 'NOT_FOUND' };
  }

  if (
    name === 'TimeTreeAPIError' &&
    statusCode === 400 &&
    getField(error, 'cause') == null
  ) {
    return {
      code: 'INVALID_INPUT',
      reasons: genericInputReason(),
    };
  }

  return undefined;
}

export function classifyError(error: unknown): ClassifiedError {
  const visited = new Set<unknown>();
  let current: unknown = error;

  for (let depth = 0; depth <= MAX_CAUSE_DEPTH; depth++) {
    if (current == null || visited.has(current)) {
      break;
    }

    visited.add(current);

    const classified = classifyOne(current);

    if (classified) {
      return classified;
    }

    current = getField(current, 'cause');
  }

  return { code: 'UNKNOWN' };
}

function errorMessages(
  classified: ClassifiedError,
): { ja: string; en: string } {
  switch (classified.code) {
    case 'GOOGLE_NOT_CONNECTED':
      return {
        ja: 'Googleカレンダーが未接続です。ローカルのMCPクライアントから connect_google_calendar を実行し、同じ端末のブラウザで認証してください。',
        en: 'Google Calendar is not connected. Run connect_google_calendar from your local MCP client and authorize in a browser on the same device.',
      };

    case 'GOOGLE_NOT_CONFIGURED':
      return {
        ja: 'Google認証の設定がありません。MCPサーバーの環境変数 GOOGLE_OAUTH_CLIENT_ID にGoogleのデスクトップ用OAuthクライアントIDを設定してください。',
        en: 'Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID to a desktop OAuth client ID in your local MCP server environment.',
      };

    case 'GOOGLE_AUTH':
      return {
        ja: 'Googleカレンダーの認証または権限が不足しています。接続状態とGoogle側のカレンダー共有権限を確認してください。',
        en: 'Google Calendar authorization or access permissions failed. Check the connection and calendar sharing permissions.',
      };

    case 'GOOGLE_API':
      return {
        ja: 'GoogleカレンダーAPIへの要求に失敗しました。Googleの接続、利用制限、カレンダーIDを確認してください。',
        en: 'Google Calendar API request failed. Check the connection, API quotas and calendar ID.',
      };

    case 'GOOGLE_WRITE_UNCERTAIN':
      return {
        ja: 'Googleへの書き込みの成否を確認できません。同期先で重複を照合するまで同じ作成操作を繰り返さないでください。',
        en: 'A Google write may have succeeded. Reconcile the destination before retrying the same creation.',
      };

    case 'AUTH_FAILED':
      return {
        ja: 'TimeTree へのサインインに失敗しました。拡張機能の設定（または環境変数）のメールアドレスとパスワードを確認してください。Google・Apple でログインしている場合は、TimeTree 側でメールとパスワードの設定が必要です。',
        en: 'Sign-in to TimeTree failed. Check the email and password in the extension settings (or environment variables). If you sign in to TimeTree with Google or Apple, first set an email and password for your account on TimeTree.',
      };

    case 'UPSTREAM_FORMAT': {
      const paths = classified.paths ?? [];

      const pathsJa = paths.length > 0
        ? paths.join(', ')
        : '不明';

      const pathsEn = paths.length > 0
        ? paths.join(', ')
        : 'unknown';

      return {
        ja: `TimeTree から想定外の形式のデータが返りました（項目: ${pathsJa}）。TimeTree 側の仕様変更の可能性があります。バージョン ${SERVER_VERSION} と、この文を添えて ${ISSUE_URL} に報告してください。`,
        en: `TimeTree returned data in an unexpected format (field: ${pathsEn}). TimeTree may have changed its API. Report it at ${ISSUE_URL} with version ${SERVER_VERSION} and this message.`,
      };
    }

    case 'NETWORK':
      return {
        ja: 'TimeTree への通信に失敗しました（ネットワークの接続またはタイムアウト）。接続を確認して、少し待ってから再実行してください。',
        en: 'The request to TimeTree failed (network error or timeout). Check your connection, wait a moment, and try again.',
      };

    case 'RATE_LIMITED':
      return {
        ja: 'TimeTree への要求が多すぎます（回数制限）。少し待ってから再実行してください。',
        en: 'Too many requests to TimeTree (rate limit). Wait a moment and try again.',
      };

    case 'INVALID_INPUT': {
      const reasons = classified.reasons ?? genericInputReason();

      const detailsJa = reasons
        .map((reason) => `${reason.nameJa}: ${reason.reasonJa}`)
        .join(', ');

      const detailsEn = reasons
        .map((reason) => `${reason.nameEn}: ${reason.reasonEn}`)
        .join(', ');

      return {
        ja: `引数が不正です（${detailsJa}）。値を直して再実行してください。`,
        en: `Invalid argument (${detailsEn}). Fix the value and try again.`,
      };
    }

    case 'NOT_FOUND':
      return {
        ja: '指定した項目が見つかりません。list_calendars や get_events で有効な ID を確認してください。',
        en: 'The requested item was not found. Check valid IDs with list_calendars or get_events.',
      };

    case 'UNKNOWN':
      return {
        ja: 'TimeTree の操作に失敗しました。詳細はサーバーのログを確認してください。',
        en: classified.detail ?? 'The TimeTree operation failed. See the server log for details.',
      };
  }
}

export function toolErrorResult(
  error: unknown,
  options?: { writeMayHaveSucceeded?: boolean },
): ToolErrorResult {
  const classified = classifyError(error);
  const messages = errorMessages(classified);

  const lines = [
    `[${classified.code}]`,
    `日本語: ${messages.ja}`,
    `English: ${messages.en}`,
  ];

  if (
    options?.writeMayHaveSucceeded === true &&
    classified.code !== 'AUTH_FAILED' &&
    classified.code !== 'INVALID_INPUT' &&
    classified.code !== 'NOT_FOUND'
  ) {
    lines.push(
      '日本語: 作成された可能性があります。再実行の前に list_calendars で確認してください。',
      'English: It may have been applied. Check with list_calendars before retrying.',
    );
  }

  return {
    isError: true,
    content: [{
      type: 'text',
      text: lines.join('\n'),
    }],
  };
}

export function safeToolErrorResult(
  error?: unknown,
): ToolErrorResult {
  return toolErrorResult(error);
}

/** Marks an error whose message this server wrote itself (no upstream text, no argument values). */
export function withSafeMessage<E extends Error>(error: E): E {
  Object.assign(error, { safeMessage: error.message });
  return error;
}

/** Identifiers (UUIDs, long tokens containing digits) are replaced so a self-written message never echoes a value. */
function redactIdentifiers(text: string): string {
  return text.replace(/[A-Za-z0-9_-]{12,}/g, (token) => {
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
    return uuidLike || /\d/.test(token) ? '<id>' : token;
  });
}
