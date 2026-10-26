/**
 * Read-only mode is an extra safety boundary for initial integrations.
 * Only explicitly allowlisted tools may run; newly added tools default to denied.
 */
const READ_ONLY_TOOLS = new Set([
  'list_calendars',
  'get_current_user',
  'get_events',
  'get_updated_events',
  'list_memos',
  'list_event_comments',
  'get_event_comment_image',
  'get_calendar_labels',
  'get_calendar_members',
  'get_calendar_virtual_members',
  'get_holidays',
  'get_recent_activity',
]);

export function isToolAllowed(name: string, readOnly: boolean): boolean {
  return !readOnly || READ_ONLY_TOOLS.has(name);
}
