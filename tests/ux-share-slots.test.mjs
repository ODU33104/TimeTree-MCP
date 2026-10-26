import { test } from "node:test";
import assert from "node:assert/strict";
import { createBusyOnlyExport, isShareExpired } from "../dist/features/share-slots/index.js";
const input = { consent: true, now: "2026-10-26T00:00:00Z", expiresAt: "2026-10-27T00:00:00Z", windowStart: "2026-10-26T00:00:00Z", windowEnd: "2026-10-27T00:00:00Z", busy: [] };
test("requires opt-in and valid expiration", () => {
  assert.throws(() => createBusyOnlyExport({ ...input, consent: false }));
  assert.throws(() => createBusyOnlyExport({ ...input, expiresAt: input.now }));
  assert.throws(() => createBusyOnlyExport({ ...input, expiresAt: "2026-12-26T00:00:00Z" }));
});
test("merges busy intervals without leaking event metadata", () => {
  const share = createBusyOnlyExport({ ...input, busy: [
    { start: "2026-10-26T10:00:00Z", end: "2026-10-26T11:00:00Z", title: "Private medical appointment", attendees: ["secret@example.com"] },
    { start: "2026-10-26T10:30:00Z", end: "2026-10-26T12:00:00Z" }
  ] });
  assert.equal(share.busy.length, 1);
  assert.equal(share.busy[0].end, "2026-10-26T12:00:00.000Z");
  assert.ok(!JSON.stringify(share).includes("Private"));
  assert.ok(!JSON.stringify(share).includes("secret@example.com"));
  assert.ok(isShareExpired(share, "2026-10-27T00:00:00Z"));
});
test("clips intervals and rejects ambiguous timestamps", () => {
  const share = createBusyOnlyExport({ ...input, busy: [{ start: "2026-10-25T23:00:00Z", end: "2026-10-26T01:00:00Z" }] });
  assert.equal(share.busy[0].start, input.windowStart.replace("Z", ".000Z"));
  assert.throws(() => createBusyOnlyExport({ ...input, now: "2026-10-26T00:00:00" }));
});
