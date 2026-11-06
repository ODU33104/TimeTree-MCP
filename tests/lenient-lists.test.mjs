// One malformed item in a TimeTree list must not fail the whole list. Synthetic data only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { TimeTreeAPIClient } from '../.test-dist/client/api.js';
import { createListCalendarsTool } from '../.test-dist/tools/calendar-tools.js';
import { createGetEventsTool, createGetUpdatedEventsTool } from '../.test-dist/tools/event-tools.js';
import { createListMemosTool } from '../.test-dist/tools/memo-tools.js';
import { createListEventCommentsTool } from '../.test-dist/tools/comment-tools.js';
import {
  createGetCalendarMembersTool,
  createGetCalendarVirtualMembersTool,
} from '../.test-dist/tools/calendar-metadata-tools.js';
import { toolResult } from '../.test-dist/tools/index.js';
import { parseListLenient, skippedItemsFields } from '../.test-dist/utils/lenient-list.js';
import {
  CalendarListItemSchema,
  CalendarSchema,
  EventListItemSchema,
  EventSchema,
} from '../.test-dist/types/timetree.js';
import { z } from 'zod';

const validator = new AjvJsonSchemaValidator();

function makeClient(http) {
  return new TimeTreeAPIClient({
    isAuthenticated: () => true,
    authenticate: async () => {},
    getHttpClient: () => http,
  });
}

function makeEvent(overrides = {}) {
  return {
    id: overrides.uuid ?? 'event-1',
    uuid: 'event-1',
    calendar_id: 123,
    title: 'Standup',
    all_day: false,
    start_at: 1,
    end_at: 2,
    start_timezone: 'UTC',
    end_timezone: 'UTC',
    category: 1,
    label_id: 1,
    alerts: [],
    recurrences: [],
    attendees: [],
    attachment: null,
    created_at: 1,
    updated_at: 2,
    ...overrides,
  };
}

/** Run fn and return its result together with everything written to stderr (the logger's output). */
async function withStderr(fn) {
  const lines = [];
  const original = console.error;
  console.error = (...args) => lines.push(args.join(' '));
  try {
    const value = await fn();
    return { value, log: lines.join('\n') };
  } finally {
    console.error = original;
  }
}

// ---------------------------------------------------------------------------
// parseListLenient and the shared helpers
// ---------------------------------------------------------------------------

test('parseListLenient keeps valid items, counts the rest, and logs field paths only', async () => {
  const tally = { skipped: 0 };
  const { value, log } = await withStderr(() =>
    parseListLenient(
      z.object({ id: z.number(), name: z.string() }),
      [{ id: 1, name: 'ok' }, { id: 'SECRET-ID-VALUE', name: 3 }, { id: 3, name: 'fine' }],
      'things',
      tally
    )
  );
  assert.deepEqual(value, [{ id: 1, name: 'ok' }, { id: 3, name: 'fine' }]);
  assert.equal(tally.skipped, 1);
  assert.match(log, /things\.1\.id/);
  assert.match(log, /things\.1\.name/);
  assert.doesNotMatch(log, /SECRET-ID-VALUE/);
});

test('parseListLenient logs nothing and leaves the tally alone when every item is valid', async () => {
  const tally = { skipped: 0 };
  const { value, log } = await withStderr(() => parseListLenient(z.number(), [1, 2], 'nums', tally));
  assert.deepEqual(value, [1, 2]);
  assert.equal(tally.skipped, 0);
  assert.equal(log, '');
});

test('skippedItemsFields adds nothing when no item was left out', () => {
  assert.deepEqual(skippedItemsFields(0), {});
  const fields = skippedItemsFields(2);
  assert.equal(fields.skipped_items, 2);
  assert.match(fields.skipped_items_note, /2 item/);
  assert.match(fields.skipped_items_note, /2 件/);
});

test('write responses keep the strict schemas, while list items accept null label and alias', () => {
  const calendar = { id: 1, name: 'cal', alias_code: null };
  assert.equal(CalendarSchema.safeParse(calendar).success, false);
  assert.equal(CalendarListItemSchema.parse(calendar).alias_code, undefined);
  const event = makeEvent({ label_id: null });
  assert.equal(EventSchema.safeParse(event).success, false);
  assert.equal(EventListItemSchema.parse(event).label_id, undefined);
});

// ---------------------------------------------------------------------------
// getCalendars and list_calendars
// ---------------------------------------------------------------------------

const goodCalendar = (id) => ({ id, name: `cal-${id}`, deactivated_at: null, calendar_users: [{ id: 1, user_id: 7, name: 'Alex', role: 1 }] });

test('getCalendars returns the valid calendars when one calendar is malformed', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async () => ({ calendars: [goodCalendar(1), { id: 2, name: null }, goodCalendar(3)], chunk: false, since: 0 }),
  });
  const calendars = await client.getCalendars(tally);
  assert.deepEqual(calendars.map((calendar) => calendar.id), [1, 3]);
  assert.equal(tally.skipped, 1);
});

test('getCalendars returns an empty list and a count when every calendar is malformed', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({ get: async () => ({ calendars: [{ id: 'x' }, null, { id: 2, name: null }] }) });
  assert.deepEqual(await client.getCalendars(tally), []);
  assert.equal(tally.skipped, 3);
});

test('getCalendars keeps a calendar when one of its members is malformed', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async () => ({
      calendars: [{
        id: 1,
        name: 'cal',
        calendar_users: [
          { id: 1, user_id: 7, name: 'Alex', role: 1 },
          { id: 'not-a-number', user_id: 'SECRET-USER-VALUE', name: 'Secret Member' },
        ],
      }],
    }),
  });
  const [calendar] = await client.getCalendars(tally);
  assert.equal(calendar.calendar_users.length, 1);
  assert.equal(calendar.calendar_users[0].name, 'Alex');
  assert.equal(tally.skipped, 1);
});

test('getCalendars fails when the calendars array itself is missing or not an array', async () => {
  for (const body of [{}, { calendars: 'nope' }]) {
    const client = makeClient({ get: async () => body });
    await assert.rejects(client.getCalendars(), /Failed to fetch calendars/);
  }
});

test('list_calendars adds skipped_items only when items were left out, and keeps the output schema valid', async () => {
  const tool = createListCalendarsTool(makeClient({
    get: async () => ({ calendars: [goodCalendar(1), { id: 2, name: null }] }),
  }));
  const withSkip = toolResult(tool, await tool.handler({}));
  assert.equal(withSkip.structuredContent.skipped_items, 1);
  assert.match(withSkip.structuredContent.skipped_items_note, /could not be read/);
  assert.equal(validator.getValidator(tool.outputSchema)(withSkip.structuredContent).valid, true);

  const clean = toolResult(tool, await createListCalendarsTool(makeClient({
    get: async () => ({ calendars: [goodCalendar(1)] }),
  })).handler({}));
  assert.equal('skipped_items' in clean.structuredContent, false);
  assert.equal('skipped_items_note' in clean.structuredContent, false);
});

// ---------------------------------------------------------------------------
// Members and virtual members
// ---------------------------------------------------------------------------

test('getCalendarMembers returns valid members and keeps the rest out of the response and logs', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async () => ({
      calendar_users: [
        { id: 1, user_id: 7, name: 'Alex', role: 1 },
        { id: 2, user_id: 'SECRET-USER-VALUE', name: 'Secret Member', role: 0 },
        { id: 3, user_id: 9, name: null, role: 0 },
      ],
    }),
  });
  const { value: members, log } = await withStderr(() => client.getCalendarMembers('1', tally));
  assert.deepEqual(members.map((member) => member.user_id), [7, 9]);
  assert.equal(tally.skipped, 1);
  assert.match(log, /calendar_users\.1\.user_id/);
  assert.doesNotMatch(log, /SECRET-USER-VALUE|Secret Member/);
});

test('getCalendarMembers returns an empty list when every member is malformed', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({ get: async () => ({ calendar_users: [{ id: 'a' }, { user_id: 1 }] }) });
  assert.deepEqual(await client.getCalendarMembers('1', tally), []);
  assert.equal(tally.skipped, 2);
});

test('getCalendarMembers fails when calendar_users is missing', async () => {
  const client = makeClient({ get: async () => ({}) });
  await assert.rejects(client.getCalendarMembers('1'), /Failed to fetch calendar members/);
});

test('get_calendar_members outputs skipped_items and a null name for an unnamed member', async () => {
  const tool = createGetCalendarMembersTool(makeClient({
    get: async () => ({ calendar_users: [{ id: 1, user_id: 7, name: null, role: 0 }, { id: 'bad', user_id: 8 }] }),
  }));
  const result = toolResult(tool, await tool.handler({ calendar_id: '1' }));
  assert.equal(result.structuredContent.members[0].name, null);
  assert.equal(result.structuredContent.skipped_items, 1);
  assert.equal(validator.getValidator(tool.outputSchema)(result.structuredContent).valid, true);
});

test('getCalendarVirtualUsers returns valid members when one is malformed', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async () => ({
      calendar_virtual_users: [
        { id: '42', uuid: 'vm-1', name: 'Kid', account_type: 'child', calendar_id: 1 },
        { uuid: 'vm-2', name: 'no id' },
        { id: '43', uuid: 'vm-3', name: null },
      ],
    }),
  });
  const members = await client.getCalendarVirtualUsers('1', tally);
  assert.deepEqual(members.map((member) => member.uuid), ['vm-1', 'vm-3']);
  assert.equal(tally.skipped, 1);
});

test('getCalendarVirtualUsers fails when the array is missing and returns [] when all are malformed', async () => {
  await assert.rejects(makeClient({ get: async () => ({}) }).getCalendarVirtualUsers('1'), /Failed to fetch calendar virtual users/);
  const tally = { skipped: 0 };
  assert.deepEqual(await makeClient({ get: async () => ({ calendar_virtual_users: [{ name: 'x' }] }) }).getCalendarVirtualUsers('1', tally), []);
  assert.equal(tally.skipped, 1);
});

test('get_calendar_virtual_members reports skipped_items in its output', async () => {
  const tool = createGetCalendarVirtualMembersTool(makeClient({
    get: async () => ({ calendar_virtual_users: [{ id: '42', uuid: 'vm-1', name: 'Kid' }, { name: 'no id' }] }),
  }));
  const result = toolResult(tool, await tool.handler({ calendar_id: '1' }));
  assert.equal(result.structuredContent.total, 1);
  assert.equal(result.structuredContent.skipped_items, 1);
  assert.equal(validator.getValidator(tool.outputSchema)(result.structuredContent).valid, true);
});

// ---------------------------------------------------------------------------
// Events: get_events, get_updated_events, paging
// ---------------------------------------------------------------------------

test('getEventsByCalendar keeps valid events across pages when some events are malformed', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async (url) => {
      if (url.endsWith('since=0')) {
        return {
          chunk: true,
          since: 200,
          events: [makeEvent({ uuid: 'a', updated_at: 5 }), makeEvent({ uuid: 'bad', title: null })],
        };
      }
      return { chunk: false, since: 300, events: [makeEvent({ uuid: 'b', updated_at: 6 }), { uuid: 'bad2' }] };
    },
  });
  const events = await client.getEventsByCalendar('123', 0, tally);
  assert.deepEqual(events.map((event) => event.uuid).sort(), ['a', 'b']);
  assert.equal(tally.skipped, 2);
});

test('getEventsByCalendar returns an empty list when every event is malformed', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({ get: async () => ({ chunk: false, since: 0, events: [{ uuid: 'x' }, null] }) });
  assert.deepEqual(await client.getEventsByCalendar('123', 0, tally), []);
  assert.equal(tally.skipped, 2);
});

test('getEventsByCalendar still fails when the paging fields are invalid', async () => {
  const client = makeClient({ get: async () => ({ events: [] }) });
  await assert.rejects(client.getEventsByCalendar('123'), /Failed to sync events/);
});

test('getUpdatedEvents keeps deleted events and skips malformed ones', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async () => ({
      chunk: false,
      since: 0,
      events: [makeEvent({ uuid: 'gone', updated_at: 50, deactivated_at: 60 }), makeEvent({ uuid: 'bad', start_at: 'x' })],
    }),
  });
  const events = await client.getUpdatedEvents('123', 0, tally);
  assert.deepEqual(events.map((event) => [event.uuid, event.deactivated_at]), [['gone', 60]]);
  assert.equal(tally.skipped, 1);
});

test('get_events outputs skipped_items and stays valid against its schema', async () => {
  const tool = createGetEventsTool(makeClient({
    get: async () => ({ chunk: false, since: 0, events: [makeEvent({ uuid: 'ok' }), makeEvent({ uuid: 'bad', title: null })] }),
  }));
  const result = toolResult(tool, await tool.handler({ calendar_id: '123' }));
  assert.equal(result.structuredContent.total, 1);
  assert.equal(result.structuredContent.skipped_items, 1);
  assert.equal(validator.getValidator(tool.outputSchema)(result.structuredContent).valid, true);
});

test('get_updated_events outputs skipped_items only when items were left out', async () => {
  const tool = createGetUpdatedEventsTool(makeClient({
    get: async () => ({ chunk: false, since: 0, events: [makeEvent({ uuid: 'ok', updated_at: 300 })] }),
  }));
  const result = toolResult(tool, await tool.handler({ calendar_id: '123', updated_after: 0 }));
  assert.equal(result.structuredContent.total, 1);
  assert.equal('skipped_items' in result.structuredContent, false);
});

// ---------------------------------------------------------------------------
// Memos and comments
// ---------------------------------------------------------------------------

test('getMemosByCalendar skips a malformed memo and keeps the others', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async () => ({
      chunk: false,
      since: 0,
      events: [
        makeEvent({ uuid: 'memo-1', category: 2, all_day: true }),
        makeEvent({ uuid: 'memo-bad', category: 2, title: undefined, all_day: 'yes' }),
        makeEvent({ uuid: 'event-1', category: 1 }),
      ],
    }),
  });
  const memos = await client.getMemosByCalendar('123', tally);
  assert.deepEqual(memos.map((memo) => memo.uuid), ['memo-1']);
  assert.equal(tally.skipped, 1);
});

test('list_memos outputs skipped_items and stays valid against its schema', async () => {
  const tool = createListMemosTool(makeClient({
    get: async () => ({
      chunk: false,
      since: 0,
      events: [makeEvent({ uuid: 'memo-1', category: 2, all_day: true }), makeEvent({ uuid: 'memo-bad', category: 2, all_day: 'yes' })],
    }),
  }));
  const result = toolResult(tool, await tool.handler({ calendar_id: '123' }));
  assert.equal(result.structuredContent.total, 1);
  assert.equal(result.structuredContent.skipped_items, 1);
  assert.equal(validator.getValidator(tool.outputSchema)(result.structuredContent).valid, true);
});

const goodComment = (id) => ({
  id, event_id: 'event-1', calendar_id: 123, type: 0, author_id: 7, author_type: 'user',
  attachment: { content: 'hello' }, created_at: 1, updated_at: 2,
});

test('listEventComments skips a malformed comment and keeps the others', async () => {
  const tally = { skipped: 0 };
  const client = makeClient({
    get: async () => ({ event_activities: [goodComment('c-1'), { type: 0, attachment: { content: 'SECRET-COMMENT-VALUE' } }, goodComment('c-2')] }),
  });
  const { value: comments, log } = await withStderr(() => client.listEventComments('123', 'event-1', tally));
  assert.deepEqual(comments.map((comment) => comment.id), ['c-1', 'c-2']);
  assert.equal(tally.skipped, 1);
  assert.match(log, /event_activities\.1\.id/);
  assert.doesNotMatch(log, /SECRET-COMMENT-VALUE/);
});

test('listEventComments returns [] when every comment is malformed and fails when the array is missing', async () => {
  const tally = { skipped: 0 };
  assert.deepEqual(await makeClient({ get: async () => ({ event_activities: [{ type: 0 }] }) }).listEventComments('123', 'event-1', tally), []);
  assert.equal(tally.skipped, 1);
  await assert.rejects(makeClient({ get: async () => ({}) }).listEventComments('123', 'event-1'), /Failed to list event comments/);
});

test('list_event_comments outputs skipped_items and stays valid against its schema', async () => {
  const tool = createListEventCommentsTool(makeClient({
    get: async () => ({ event_activities: [goodComment('c-1'), { type: 0 }] }),
  }));
  const result = toolResult(tool, await tool.handler({ calendar_id: '123', event_uuid: 'event-1' }));
  assert.equal(result.structuredContent.total, 1);
  assert.equal(result.structuredContent.skipped_items, 1);
  assert.equal(validator.getValidator(tool.outputSchema)(result.structuredContent).valid, true);
});
