import assert from "node:assert/strict";
import { test } from "node:test";
import { previewMutations, verifyConfirmation, summarizePartialFailure } from "../dist/features/mutation-gate/index.js";
const actions = [{ operation: "delete", calendarId: "cal", eventId: "evt" }];
test("deny by default; requires exact token, digest, approval and unexpired timestamp", () => {
  const plan = previewMutations(actions, 1000, 2000);
  const valid = { approved: true, token: plan.confirmationToken, digest: plan.digest, now: 2000 };
  assert.equal(verifyConfirmation(plan, valid), true);
  assert.equal(verifyConfirmation(plan, { ...valid, approved: false }), false);
  assert.equal(verifyConfirmation(plan, { ...valid, now: 3000 }), false);
  assert.equal(verifyConfirmation(plan, { ...valid, token: "0".repeat(64) }), false);
  assert.equal(verifyConfirmation(plan, { ...valid, digest: "0".repeat(64) }), false);
});
test("plan cannot silently broaden and invalid operations fail closed", () => {
  const plan = previewMutations(actions, 1000);
  assert.equal(verifyConfirmation({ ...plan, actions: [{ ...actions[0], eventId: "other" }] }, { approved: true, token: plan.confirmationToken, digest: plan.digest, now: 1000 }), false);
  assert.throws(() => previewMutations([{ operation: "delete", calendarId: "cal" }], 1000));
  assert.throws(() => previewMutations([], 1000));
});
test("partial failures are explicit and duplicate outcomes rejected", () => {
  const plan = previewMutations([...actions, ...actions], 1000);
  const result = summarizePartialFailure(plan, [{ index: 0, success: true }, { index: 1, success: false }]);
  assert.deepEqual(result.completed, [0]);
  assert.deepEqual(result.failed, [1]);
  assert.equal(result.requiresManualRecovery, true);
  assert.throws(() => summarizePartialFailure(plan, [{ index: 0, success: true }, { index: 0, success: false }]));
});
