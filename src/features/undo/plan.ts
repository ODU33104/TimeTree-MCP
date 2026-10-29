/** Offline compensation planner. No network calls and no automatic rollback. */
export type MutationKind = "create" | "update" | "delete";
export interface CompletedMutation {
  kind: MutationKind;
  calendarId: string;
  eventId?: string;
  /** Original event snapshot for update/delete. */
  before?: Record<string, unknown>;
  /** Submitted event data for create/update. */
  after?: Record<string, unknown>;
  /** Server-generated ID returned after create. */
  createdEventId?: string;
  /** Unique stable operation identifier supplied by caller. */
  operationId: string;
}
export interface CompensationStep {
  idempotencyKey: string;
  compensatesOperationId: string;
  kind: MutationKind;
  calendarId: string;
  eventId?: string;
  payload?: Record<string, unknown>;
  requiresReview: true;
  warning: string;
}
export interface UndoPlan {
  atomic: false;
  autoExecute: false;
  steps: CompensationStep[];
  unresolved: { operationId: string; reason: string }[];
}
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
function copy(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
/**
 * completed contains only confirmed successful operations, in execution order.
 * Uncertain remote outcomes must be reconciled before calling this function.
 */
export function planUndo(completed: readonly CompletedMutation[]): UndoPlan {
  if (!Array.isArray(completed) || completed.length > 100) throw new Error("Invalid completed operation list");
  const seen = new Set<string>();
  const steps: CompensationStep[] = [];
  const unresolved: UndoPlan["unresolved"] = [];
  for (const op of [...completed].reverse()) {
    if (!op || !validId(op.operationId) || !validId(op.calendarId) || seen.has(op.operationId)) {
      throw new Error("Invalid or duplicate operation ID");
    }
    seen.add(op.operationId);
    if (!["create", "update", "delete"].includes(op.kind)) throw new Error("Invalid mutation kind");
    const key = `undo:${op.operationId}`;
    const common = { idempotencyKey: key, compensatesOperationId: op.operationId, calendarId: op.calendarId, requiresReview: true as const };
    if (op.kind === "create") {
      if (!validId(op.createdEventId)) {
        unresolved.push({ operationId: op.operationId, reason: "Created event ID missing; reconcile server state" });
        continue;
      }
      steps.push({ ...common, kind: "delete", eventId: op.createdEventId, warning: "Confirm the created event still matches before deleting" });
    } else if (op.kind === "update") {
      if (!validId(op.eventId) || !record(op.before)) {
        unresolved.push({ operationId: op.operationId, reason: "Original event snapshot or ID missing" });
        continue;
      }
      steps.push({ ...common, kind: "update", eventId: op.eventId, payload: copy(op.before), warning: "Event may have changed remotely; verify version before restoring" });
    } else {
      if (!record(op.before)) {
        unresolved.push({ operationId: op.operationId, reason: "Deleted event snapshot missing" });
        continue;
      }
      steps.push({ ...common, kind: "create", payload: copy(op.before), warning: "Recreated event may receive a new ID; check recurrence and notifications" });
    }
  }
  return { atomic: false, autoExecute: false, steps, unresolved };
}
