import test from "node:test";
import assert from "node:assert/strict";
import { planUndo } from "../.test-dist/features/undo/plan.js";

test("reverses confirmed operations without executing anything", () => {
  const plan = planUndo([
    { operationId: "one", kind: "create", calendarId: "cal", createdEventId: "new" },
    { operationId: "two", kind: "update", calendarId: "cal", eventId: "old", before: { title: "Before" } },
  ]);
  assert.deepEqual(plan.steps.map(s => s.kind), ["update", "delete"]);
  assert.equal(plan.atomic, false);
  assert.equal(plan.autoExecute, false);
  assert.ok(plan.steps.every(s => s.requiresReview));
});
test("unresolved remote IDs never produce unsafe deletion", () => {
  const plan = planUndo([{ operationId: "one", kind: "create", calendarId: "cal" }]);
  assert.equal(plan.steps.length, 0);
  assert.equal(plan.unresolved.length, 1);
});
test("restores deleted snapshot as a new create with warning", () => {
  const plan = planUndo([{ operationId: "del", kind: "delete", calendarId: "cal", eventId: "event", before: { title: "Saved" } }]);
  assert.equal(plan.steps[0].kind, "create");
  assert.match(plan.steps[0].warning, /new ID/);
});
test("idempotency keys are stable and duplicates are rejected", () => {
  const item = { operationId: "one", kind: "update", calendarId: "cal", eventId: "event", before: { title: "A" } };
  assert.equal(planUndo([item]).steps[0].idempotencyKey, planUndo([item]).steps[0].idempotencyKey);
  assert.throws(() => planUndo([item, item]), /duplicate/);
});
test("missing original snapshot cannot be compensated", () => {
  assert.equal(planUndo([{ operationId: "one", kind: "update", calendarId: "cal", eventId: "e" }]).unresolved.length, 1);
});
