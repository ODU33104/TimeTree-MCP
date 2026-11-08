/**
 * Read-only mode is an extra safety boundary for initial integrations.
 * Only explicitly allowlisted tools may run; newly added tools default to denied.
 */
const READ_ONLY_TOOLS = new Set([
  'check_connection',
  'list_calendars',
  'get_current_user',
  'get_events',
  'search_events_across_calendars',
  'find_available_slots',
  'detect_event_conflicts',
  'get_updated_events',
  'preview_calendar_bridge',
  'export_calendar_bridge_ics',
  'connect_google_calendar',
  'google_connection_status',
  'list_google_calendars',
  'get_google_calendar_events',
  'preview_google_calendar_bridge',
  'disconnect_google_calendar',
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
