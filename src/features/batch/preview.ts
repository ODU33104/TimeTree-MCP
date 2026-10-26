export type BatchAction = "create" | "update" | "delete";
export interface BatchOperation {
  action: BatchAction;
  calendarId: string;
  eventId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
export interface BatchPreview {
  readonly operations: readonly BatchOperation[];
  readonly changes: readonly { index: number; action: BatchAction; calendarId: string; eventId?: string; before?: Record<string, unknown>; after?: Record<string, unknown> }[];
  readonly requiresConfirmation: boolean;
  readonly confirmationToken: string;
}
const identifier = /^[A-Za-z0-9_-]{1,128}$/;
const safeObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
function clone(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
export function previewBatch(operations: readonly BatchOperation[]): BatchPreview {
  if (!Array.isArray(operations) || operations.length === 0 || operations.length > 100) {
    throw new Error("Batch must contain 1 to 100 operations");
  }
  const changes = operations.map((op, index) => {
    if (!op || !["create", "update", "delete"].includes(op.action)) throw new Error("Invalid batch action");
    if (!identifier.test(op.calendarId)) throw new Error("Invalid calendar identifier");
    if (op.action !== "create" && (!op.eventId || !identifier.test(op.eventId))) throw new Error("Event identifier required");
    if (op.action === "create" && (!safeObject(op.after) || op.before !== undefined || op.eventId !== undefined)) throw new Error("Invalid create operation");
    if (op.action === "update" && (!safeObject(op.after) || !safeObject(op.before))) throw new Error("Update requires before and after");
    if (op.action === "delete" && (!safeObject(op.before) || op.after !== undefined)) throw new Error("Delete requires before only");
    const before = op.before ? clone(op.before) : undefined;
    const after = op.after ? clone(op.after) : undefined;
    return { index, action: op.action, calendarId: op.calendarId, ...(op.eventId ? { eventId: op.eventId } : {}), ...(before ? { before } : {}), ...(after ? { after } : {}) };
  });
  const snapshot = changes.map(({ index: _index, ...rest }) => rest);
  return {
    operations: snapshot,
    changes,
    requiresConfirmation: true,
    confirmationToken: JSON.stringify(snapshot),
  };
}
export interface BatchExecutor {
  (operation: BatchOperation, index: number): Promise<unknown>;
}
export async function executeConfirmedBatch(
  preview: BatchPreview,
  confirmationToken: string | undefined,
  executor: BatchExecutor,
): Promise<{ completed: number; results: unknown[]; failedAt?: number; error?: string }> {
  if (!confirmationToken || confirmationToken !== preview.confirmationToken) throw new Error("Explicit confirmation required");
  if (JSON.stringify(preview.operations) !== preview.confirmationToken) throw new Error("Batch changed after preview");
  const results: unknown[] = [];
  for (let i = 0; i < preview.operations.length; i++) {
    try { results.push(await executor(preview.operations[i], i)); }
    catch { return { completed: i, results, failedAt: i, error: "Operation failed; remaining operations not executed" }; }
  }
  return { completed: results.length, results };
}
