/**
 * Tool Registration
 * Exports all MCP tools for the TimeTree server.
 */

import { createSearchAcrossCalendarsTool, createFindAvailableSlotsTool, createDetectEventConflictsTool } from './ux-read-tools.js';
import type { TimeTreeAPIClient } from '../client/api.js';
import { createCreateCalendarTool, createGetCurrentUserTool, createListCalendarsTool } from './calendar-tools.js';
import {
  createCreateVirtualMemberTool,
  createDeleteVirtualMemberTool,
  createGetCalendarLabelsTool,
  createGetCalendarMembersTool,
  createGetCalendarVirtualMembersTool,
  createUpdateCalendarLabelsTool,
  createUpdateVirtualMemberTool,
} from './calendar-metadata-tools.js';
import {
  createAddEventCommentTool,
  createDeleteEventCommentTool,
  createGetEventCommentImageTool,
  createListEventCommentsTool,
  createUpdateEventCommentTool,
} from './comment-tools.js';
import {
  createCopyEventTool,
  createCreateEventTool,
  createUpdateEventTool,
  createDeleteEventTool,
} from './event-crud-tools.js';
import { createDeleteEventOccurrenceTool, createUpdateEventOccurrenceTool } from './recurring-event-tools.js';
import { createGetEventsTool, createGetUpdatedEventsTool } from './event-tools.js';
import { createExportCalendarBridgeIcsTool, createPreviewCalendarBridgeTool } from './bridge-tools.js';
import { createPreviewGoogleCalendarBridgeTool } from './google-bridge-tools.js';
import { GoogleLocalConnection, type GoogleConnection } from '../bridge/google-connection.js';
import { GoogleCalendarApi } from '../bridge/google-api.js';
import {
  createConnectGoogleCalendarTool,
  createGoogleConnectionStatusTool,
  createDisconnectGoogleCalendarTool,
  createListGoogleCalendarsTool,
  createGetGoogleCalendarEventsTool,
} from './google-tools.js';

import { createGetHolidaysTool } from './holiday-tools.js';
import { createGetRecentActivityTool } from './activity-tools.js';
import { createCheckConnectionTool } from './diagnostic-tools.js';
import {
  createCreateMemoTool,
  createDeleteMemoTool,
  createListMemosTool,
  createUpdateMemoTool,
} from './memo-tools.js';

export function registerTools(
  apiClient: TimeTreeAPIClient,
  googleDependencies?: {
    connection: GoogleConnection;
    api: Pick<GoogleCalendarApi, 'listCalendars' | 'listEvents'>;
  },
) {
  const googleConnection = googleDependencies?.connection ??
    new GoogleLocalConnection(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const googleApi = googleDependencies?.api ??
    new GoogleCalendarApi(() => googleConnection.accessToken());

  return [
    createCheckConnectionTool(apiClient),
    createListCalendarsTool(apiClient),
    createCreateCalendarTool(apiClient),
    createGetCurrentUserTool(apiClient),
    createGetEventsTool(apiClient),
    createSearchAcrossCalendarsTool(apiClient),
    createFindAvailableSlotsTool(apiClient),
    createDetectEventConflictsTool(apiClient),
    createGetUpdatedEventsTool(apiClient),
    createPreviewCalendarBridgeTool(apiClient),
    createExportCalendarBridgeIcsTool(apiClient),
    createPreviewGoogleCalendarBridgeTool(apiClient, googleConnection, googleApi),
    createConnectGoogleCalendarTool(googleConnection),
    createGoogleConnectionStatusTool(googleConnection),
    createListGoogleCalendarsTool(googleConnection, googleApi),
    createGetGoogleCalendarEventsTool(googleConnection, googleApi),
    createDisconnectGoogleCalendarTool(googleConnection),
    createCreateEventTool(apiClient),
    createUpdateEventTool(apiClient),
    createDeleteEventTool(apiClient),
    createUpdateEventOccurrenceTool(apiClient),
    createDeleteEventOccurrenceTool(apiClient),
    createCopyEventTool(apiClient),
    createListMemosTool(apiClient),
    createCreateMemoTool(apiClient),
    createUpdateMemoTool(apiClient),
    createDeleteMemoTool(apiClient),
    createAddEventCommentTool(apiClient),
    createListEventCommentsTool(apiClient),
    createGetEventCommentImageTool(apiClient),
    createUpdateEventCommentTool(apiClient),
    createDeleteEventCommentTool(apiClient),
    createGetCalendarLabelsTool(apiClient),
    createUpdateCalendarLabelsTool(apiClient),
    createGetCalendarMembersTool(apiClient),
    createGetCalendarVirtualMembersTool(apiClient),
    createCreateVirtualMemberTool(apiClient),
    createUpdateVirtualMemberTool(apiClient),
    createDeleteVirtualMemberTool(apiClient),
    createGetHolidaysTool(apiClient),
    createGetRecentActivityTool(apiClient),
  ];
}

/**
 * Tools that declare an outputSchema also return their JSON as structuredContent, which
 * MCP requires to match that schema. Error results carry no structured content.
 */
export function toolResult<T extends { content: Array<{ type: string; text?: string }>; isError?: boolean }>(
  tool: { outputSchema?: unknown },
  result: T
): T & { structuredContent?: Record<string, unknown> } {
  if (!tool.outputSchema || result.isError || result.content[0]?.type !== 'text' || typeof result.content[0].text !== 'string') {
    return result;
  }
  return { ...result, structuredContent: JSON.parse(result.content[0].text) };
}
