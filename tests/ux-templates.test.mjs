import assert from "node:assert/strict";
import { test } from "node:test";
import { previewTemplate, validateTemplate } from "../dist/features/templates/index.js";
const base = { title: "Meeting", durationMinutes: 30, timezone: "Asia/Tokyo" };
test("preview does not mutate and returns correct duration", () => {
  const result = previewTemplate(base, "2026-10-26T09:00:00+09:00");
  assert.equal(result.length, 1);
  assert.equal(result[0].start, "2026-10-26T00:00:00.000Z");
  assert.equal(result[0].end, "2026-10-26T00:30:00.000Z");
  assert.ok(Object.isFrozen(result));
});
test("rejects invalid inputs", () => {
  assert.throws(() => validateTemplate({ ...base, durationMinutes: -1 }));
  assert.throws(() => validateTemplate({ ...base, timezone: "Invalid/Zone" }));
  assert.throws(() => previewTemplate(base, "2026-10-26T09:00:00"));
});
test("bounded weekly recurrence", () => {
  const result = previewTemplate({ ...base, recurrence: { frequency: "weekly", count: 2 } }, "2026-10-26T00:00:00Z");
  assert.equal(Date.parse(result[1].start) - Date.parse(result[0].start), 7 * 86400000);
  assert.throws(() => validateTemplate({ ...base, recurrence: { frequency: "daily", count: 101 } }));
});
