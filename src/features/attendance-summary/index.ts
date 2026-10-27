/** Read-only, permission-scoped attendance association summaries. No RSVP semantics. */
export type Id = string | number;
export type EventSnapshot = { uuid: string; calendar_id: Id; attendees?: unknown; virtual_user_attendees?: unknown };
export type MemberSnapshot = { user_id: Id; name?: string; is_active?: boolean };
export type VirtualMemberSnapshot = { id: Id; name?: string; is_active?: boolean };
export type CalendarRoster = { calendar_id: Id; members?: readonly MemberSnapshot[]; virtual_members?: readonly VirtualMemberSnapshot[] };
export type Participant = { kind: 'account' | 'virtual'; label: string; status: 'known' | 'unknown' };
export type AttendanceSummary = { calendar_id: Id; event_uuid: string; account_count: number; virtual_count: number; participants: Participant[]; semantics: 'association_only' };
export type SummaryOptions = { allowedCalendarIds: readonly Id[]; anonymize?: boolean; maxParticipants?: number };

const key = (id: Id): string => String(id);
const validId = (value: unknown): value is Id =>
  (typeof value === 'string' && value.trim().length > 0) || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);

function ids(value: unknown, limit: number): Id[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > limit) throw new TypeError('Invalid participant list');
  const result: Id[] = [];
  const seen = new Set<string>();
  for (const id of value) {
    if (!validId(id)) throw new TypeError('Invalid participant ID');
    const k = key(id);
    if (!seen.has(k)) { result.push(id); seen.add(k); }
  }
  return result;
}

/** Caller must supply calendar IDs already authorized for the current principal. */
export function summarizeEventAttendance(
  event: EventSnapshot,
  roster: CalendarRoster | undefined,
  options: SummaryOptions,
): AttendanceSummary {
  if (!event || typeof event !== 'object' || !validId(event.calendar_id) || typeof event.uuid !== 'string' || !event.uuid.trim()) throw new TypeError('Invalid event');
  if (!options || typeof options !== 'object' || !Array.isArray(options.allowedCalendarIds) || !options.allowedCalendarIds.some(id => validId(id) && key(id) === key(event.calendar_id))) {
    throw new Error('Calendar access denied');
  }
  if (roster != null && (typeof roster !== 'object' || !validId(roster.calendar_id) || key(roster.calendar_id) !== key(event.calendar_id))) throw new Error('Roster calendar mismatch');
  const max = options.maxParticipants ?? 1000;
  if (!Number.isSafeInteger(max) || max < 1 || max > 1000) throw new RangeError('Invalid participant limit');
  const accountIds = ids(event.attendees, max);
  const virtualIds = ids(event.virtual_user_attendees, max);
  if (accountIds.length + virtualIds.length > max) throw new RangeError('Too many participants');
  // Validate the complete roster before reading or exposing any member data.
  const validateRoster = (value: unknown, idField: 'user_id' | 'id'): Array<{ name?: string; is_active?: boolean } & Record<string, unknown>> => {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > max) throw new TypeError('Invalid roster list');
    for (const member of value) {
      if (!member || typeof member !== 'object' || Array.isArray(member) || !validId(member[idField]) ||
          (member.name !== undefined && typeof member.name !== 'string') ||
          (member.is_active !== undefined && typeof member.is_active !== 'boolean')) {
        throw new TypeError('Invalid roster member');
      }
    }
    return value;
  };
  const members = validateRoster(roster?.members, 'user_id');
  const virtualMembers = validateRoster(roster?.virtual_members, 'id');
  if (members.length + virtualMembers.length > max) throw new RangeError('Too many roster members');
  const memberMap = new Map<string, MemberSnapshot>();
  const virtualMap = new Map<string, VirtualMemberSnapshot>();
  for (const member of members) memberMap.set(key(member.user_id as Id), member as MemberSnapshot);
  for (const member of virtualMembers) virtualMap.set(key(member.id as Id), member as VirtualMemberSnapshot);
  const participants: Participant[] = [];
  const append = (items: Id[], map: Map<string, { name?: string; is_active?: boolean }>, kind: Participant['kind']) => {
    for (const id of items) {
      const member = map.get(key(id));
      const known = !!member && member.is_active !== false;
      participants.push({ kind, status: known ? 'known' : 'unknown', label: options.anonymize !== false || !known ? 'Anonymous' : (typeof member.name === 'string' && member.name.trim() ? member.name : 'Unnamed') });
    }
  };
  append(accountIds, memberMap, 'account');
  append(virtualIds, virtualMap, 'virtual');
  return { calendar_id: event.calendar_id, event_uuid: event.uuid, account_count: accountIds.length, virtual_count: virtualIds.length, participants, semantics: 'association_only' };
}
