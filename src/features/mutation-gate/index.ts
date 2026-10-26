import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type MutationAction = Readonly<{ operation: "create" | "update" | "delete"; calendarId: string; eventId?: string; payload?: unknown }>;
export type MutationPlan = Readonly<{ actions: ReadonlyArray<MutationAction>; digest: string; confirmationToken: string; expiresAt: number }>;
export type Confirmation = Readonly<{ approved: boolean; token: string; digest: string; now: number }>;
export type Outcome = Readonly<{ index: number; success: boolean; error?: string }>;
const MAX_ACTIONS = 100;
const MAX_TTL_MS = 15 * 60_000;
function canonical(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (typeof value === "object" && value !== null) {
    const object = value as Record<string, unknown>;
    const keys = Object.keys(object).sort();
    if (keys.some(key => key === "__proto__" || key === "constructor" || key === "prototype")) throw new Error("Unsafe payload key");
    return "{" + keys.map(key => JSON.stringify(key) + ":" + canonical(object[key])).join(",") + "}";
  }
  throw new Error("Unsupported payload value");
}
function validate(actions: ReadonlyArray<MutationAction>): void {
  if (!Array.isArray(actions) || actions.length < 1 || actions.length > MAX_ACTIONS) throw new Error("Invalid action count");
  for (const action of actions) {
    if (!action || !["create", "update", "delete"].includes(action.operation) || typeof action.calendarId !== "string" || !action.calendarId.trim()) throw new Error("Invalid action");
    if (action.operation !== "create" && (typeof action.eventId !== "string" || !action.eventId.trim())) throw new Error("Event ID required");
    if (action.operation !== "delete" && (action.payload === null || typeof action.payload !== "object" || Array.isArray(action.payload))) throw new Error("Object payload required");
    if (action.operation === "delete" && action.payload !== undefined) throw new Error("Delete must not include payload");
  }
}
function digest(actions: ReadonlyArray<MutationAction>): string { return createHash("sha256").update(canonical(actions)).digest("hex"); }
export function previewMutations(actions: ReadonlyArray<MutationAction>, now: number, ttlMs = 5 * 60_000): MutationPlan {
  validate(actions);
  if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > MAX_TTL_MS) throw new Error("Invalid confirmation lifetime");
  const copy = JSON.parse(canonical(actions)) as MutationAction[];
  return Object.freeze({ actions: Object.freeze(copy.map(a => Object.freeze(a))), digest: digest(copy), confirmationToken: randomBytes(32).toString("hex"), expiresAt: now + ttlMs });
}
export function verifyConfirmation(plan: MutationPlan, confirmation: Confirmation): boolean {
  if (!confirmation || confirmation.approved !== true || !Number.isSafeInteger(confirmation.now) || confirmation.now >= plan.expiresAt) return false;
  if (typeof confirmation.token !== "string" || !/^[a-f0-9]{64}$/.test(confirmation.token)) return false;
  if (typeof confirmation.digest !== "string" || !/^[a-f0-9]{64}$/.test(confirmation.digest)) return false;
  const actual = Buffer.from(confirmation.token, "hex"), expected = Buffer.from(plan.confirmationToken, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  if (confirmation.digest !== plan.digest) return false;
  try { validate(plan.actions); return digest(plan.actions) === plan.digest; } catch { return false; }
}
/** Pure planning only. The coordinator must add authenticated, single-use token storage before remote writes. */
export function summarizePartialFailure(plan: MutationPlan, outcomes: ReadonlyArray<Outcome>): Readonly<{ completed: number[]; failed: number[]; pending: number[]; requiresManualRecovery: boolean }> {
  if (!Array.isArray(outcomes)) throw new Error("Invalid outcomes");
  const seen = new Set<number>(), completed: number[] = [], failed: number[] = [];
  for (const item of outcomes) {
    if (!Number.isInteger(item.index) || item.index < 0 || item.index >= plan.actions.length || seen.has(item.index) || typeof item.success !== "boolean") throw new Error("Invalid outcome index");
    seen.add(item.index);
    (item.success ? completed : failed).push(item.index);
  }
  const pending = plan.actions.map((_, i) => i).filter(i => !seen.has(i));
  return Object.freeze({ completed, failed, pending, requiresManualRecovery: completed.length > 0 && (failed.length > 0 || pending.length > 0) });
}
