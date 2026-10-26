import test from "node:test";
import assert from "node:assert/strict";
import { previewBatch, executeConfirmedBatch } from "../.test-dist/features/batch/preview.js";
const op = { action: "delete", calendarId: "cal_1", eventId: "evt_1", before: { title: "Old" } };
test("requires confirmation before any destructive execution", async () => {
  const preview = previewBatch([op]);
  let calls = 0;
  await assert.rejects(executeConfirmedBatch(preview, undefined, async () => { calls++; }));
  assert.equal(calls, 0);
  const result = await executeConfirmedBatch(preview, preview.confirmationToken, async () => { calls++; return "ok"; });
  assert.equal(result.completed, 1);
  assert.equal(calls, 1);
});
test("rejects malformed and ambiguous mutations", () => {
  assert.throws(() => previewBatch([]));
  assert.throws(() => previewBatch([{ action: "delete", calendarId: "x", eventId: "y" }]));
  assert.throws(() => previewBatch([{ action: "update", calendarId: "x", eventId: "y", after: {} }]));
});
test("stops after partial failure and reports completed count", async () => {
  const p = previewBatch([{ action: "create", calendarId: "c", after: { title: "A" } }, { action: "delete", calendarId: "c", eventId: "e", before: {} }, { action: "create", calendarId: "c", after: {} }]);
  let calls = 0;
  const r = await executeConfirmedBatch(p, p.confirmationToken, async () => { if (++calls === 2) throw Error("secret"); return "ok"; });
  assert.equal(r.completed, 1);
  assert.equal(r.failedAt, 1);
  assert.equal(calls, 2);
  assert.doesNotMatch(r.error, /secret/);
});
test("snapshot isolates caller mutations", () => {
  const original = { action: "create", calendarId: "c", after: { title: "A" } };
  const p = previewBatch([original]);
  original.after.title = "B";
  assert.equal(p.changes[0].after.title, "A");
});
