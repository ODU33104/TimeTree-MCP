/**
 * Diagnostic Tools for MCP
 * check_connection reports, in one call, whether the server can sign in to TimeTree,
 * which version runs, whether an update is available, and what to do next.
 */

import type { TimeTreeAPIClient } from '../client/api.js';
import { RELEASES_URL, SERVER_VERSION } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { fetchLatestVersion, isNewerVersion } from '../utils/update-check.js';
import { READ_ONLY } from './shared-schemas.js';

export interface CheckConnectionOptions {
  /** Replaces the global fetch for the update check (tests only). */
  fetchImpl?: typeof fetch;
}

const SIGN_IN_FAILED_MESSAGE =
  'TimeTree にサインインできませんでした。メールアドレスかパスワードが正しくないか、TimeTree に接続できませんでした。 ' +
  'Could not sign in to TimeTree. The email or password may be incorrect, or TimeTree could not be reached.';

const SIGN_IN_FAILED_NEXT_STEP =
  'MCP の設定（Claude Desktop なら拡張機能の設定）で TimeTree のメールアドレスとパスワードを確認し、サーバーを再起動してから check_connection をもう一度実行してください。 ' +
  'Check the TimeTree email and password in your MCP settings (the extension settings in Claude Desktop), restart the server, and run check_connection again.';

const UPDATE_NEXT_STEP_MCPB =
  `${RELEASES_URL} から最新の timetree-mcp .mcpb をダウンロードして開き、拡張機能を入れ直してください。 ` +
  `Download the latest timetree-mcp .mcpb from ${RELEASES_URL} and open it to reinstall the extension.`;

const UPDATE_NEXT_STEP_NPX =
  `インストールコマンドのリリースタグ（github:ODU33104/TimeTree-MCP#vX.Y.Z）を最新版に変えて入れ直し、Claude Code を再起動してください。 ` +
  `Change the release tag in the install command (github:ODU33104/TimeTree-MCP#vX.Y.Z) to the latest release, add the server again, and restart Claude Code. ${RELEASES_URL}`;

const UPDATE_NEXT_STEP_GIT =
  'TimeTree-MCP のフォルダで git pull origin main && npm ci && npm run build を実行し、MCP クライアントを再起動してください。 ' +
  'In the TimeTree-MCP folder, run git pull origin main && npm ci && npm run build, then restart the MCP client.';

const READ_ONLY_NEXT_STEP =
  '読み取り専用モード（TIMETREE_READ_ONLY=true）です。予定・メモなどを作成・変更・削除するツールは使えません。 ' +
  'Read-only mode (TIMETREE_READ_ONLY=true) is on, so tools that create, change, or delete data are unavailable.';

const OK_NEXT_STEP = '問題は見つかりませんでした。 No problems found.';

export function createCheckConnectionTool(apiClient: TimeTreeAPIClient, options: CheckConnectionOptions = {}) {
  return {
    name: 'check_connection',
    description:
      'Check the setup in one call: whether sign-in to TimeTree works, the server version, whether an update is ' +
      'available, and whether read-only mode is on. Read-only. Returns the next step to take when something fails. ' +
      'Call this first when a tool does not work.',
    annotations: READ_ONLY,
    outputSchema: {
      type: 'object',
      properties: {
        server_version: { type: 'string' },
        read_only_mode: { type: 'boolean' },
        sign_in: { type: 'string', enum: ['ok', 'failed'] },
        sign_in_message: { type: 'string', description: 'Present only when sign_in is failed' },
        calendars_count: { type: 'number', description: 'Present only when sign-in succeeded and the calendars could be read' },
        latest_version: { type: ['string', 'null'] },
        update_available: { type: 'boolean' },
        update_check: { type: 'string', enum: ['ok', 'disabled', 'failed'] },
        next_step: { type: 'string' },
      },
      required: [
        'server_version',
        'read_only_mode',
        'sign_in',
        'latest_version',
        'update_available',
        'update_check',
        'next_step',
      ],
    },
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler: async () => {
      logger.info('Tool: check_connection called');

      // Started first so the update check runs while sign-in is in progress. It never throws.
      const updateCheckEnabled = process.env.TIMETREE_UPDATE_CHECK !== 'false';
      const latestPromise = updateCheckEnabled ? fetchLatestVersion(options.fetchImpl) : null;

      const readOnlyMode = process.env.TIMETREE_READ_ONLY === 'true';

      let signIn: 'ok' | 'failed' = 'ok';
      try {
        await apiClient.signIn();
      } catch {
        signIn = 'failed';
        logger.warn('Tool: check_connection sign-in failed');
      }

      let calendarsCount: number | undefined;
      if (signIn === 'ok') {
        try {
          calendarsCount = (await apiClient.getCalendars()).length;
        } catch {
          logger.warn('Tool: check_connection could not read calendars');
        }
      }

      const latestVersion = latestPromise ? await latestPromise : null;
      const updateCheck: 'ok' | 'disabled' | 'failed' = !updateCheckEnabled ? 'disabled' : latestVersion ? 'ok' : 'failed';
      const updateAvailable = latestVersion !== null && isNewerVersion(latestVersion, SERVER_VERSION);

      let nextStep: string;
      if (signIn === 'failed') {
        nextStep = SIGN_IN_FAILED_NEXT_STEP;
      } else if (updateAvailable) {
        const source = process.env.TIMETREE_INSTALL_SOURCE;
        nextStep = source === 'mcpb' ? UPDATE_NEXT_STEP_MCPB : source === 'npx' ? UPDATE_NEXT_STEP_NPX : UPDATE_NEXT_STEP_GIT;
      } else if (readOnlyMode) {
        nextStep = READ_ONLY_NEXT_STEP;
      } else {
        nextStep = OK_NEXT_STEP;
      }

      const result = {
        server_version: SERVER_VERSION,
        read_only_mode: readOnlyMode,
        sign_in: signIn,
        ...(signIn === 'failed' ? { sign_in_message: SIGN_IN_FAILED_MESSAGE } : {}),
        ...(calendarsCount !== undefined ? { calendars_count: calendarsCount } : {}),
        latest_version: latestVersion,
        update_available: updateAvailable,
        update_check: updateCheck,
        next_step: nextStep,
      };

      logger.info('Tool: check_connection completed', { sign_in: signIn, update_check: updateCheck });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  };
}
