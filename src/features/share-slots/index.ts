/** Privacy-preserving, explicit opt-in busy-only availability export. No network I/O. */
export type BusyInterval = Readonly<{ start: string; end: string }>;
export type ShareSlotsRequest = Readonly<{
  consent: boolean;
  now: string;
  expiresAt: string;
  windowStart: string;
  windowEnd: string;
  busy: ReadonlyArray<BusyInterval>;
}>;
export type ShareSlotsExport = Readonly<{
  version: 1;
  expiresAt: string;
  windowStart: string;
  windowEnd: string;
  busy: ReadonlyArray<BusyInterval>;
}>;
function instant(value: string): number {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error("An explicit ISO timestamp offset is required");
  const n = Date.parse(value);
  if (!Number.isFinite(n)) throw new Error("Invalid timestamp");
  return n;
}
export function createBusyOnlyExport(request: ShareSlotsRequest): ShareSlotsExport {
  if (!request || request.consent !== true) throw new Error("Explicit opt-in required");
  const now = instant(request.now);
  const expires = instant(request.expiresAt);
  const from = instant(request.windowStart);
  const to = instant(request.windowEnd);
  if (expires <= now || expires - now > 30 * 86400000) throw new Error("Expiration must be within 30 days");
  if (from >= to || to - from > 31 * 86400000) throw new Error("Invalid share window");
  if (!Array.isArray(request.busy) || request.busy.length > 10000) throw new Error("Invalid busy intervals");
  const intervals = request.busy.map(item => {
    const a = instant(item.start), b = instant(item.end);
    if (a >= b) throw new Error("Invalid busy interval");
    return { a: Math.max(a, from), b: Math.min(b, to) };
  }).filter(item => item.a < item.b).sort((a, b) => a.a - b.a || a.b - b.b);
  const merged: Array<{ a: number; b: number }> = [];
  for (const item of intervals) {
    const previous = merged[merged.length - 1];
    if (previous && item.a <= previous.b) previous.b = Math.max(previous.b, item.b);
    else merged.push({ ...item });
  }
  const busy = Object.freeze(merged.map(item => Object.freeze({ start: new Date(item.a).toISOString(), end: new Date(item.b).toISOString() })));
  return Object.freeze({ version: 1 as const, expiresAt: new Date(expires).toISOString(), windowStart: new Date(from).toISOString(), windowEnd: new Date(to).toISOString(), busy });
}
export function isShareExpired(share: ShareSlotsExport, now: string): boolean {
  return instant(now) >= instant(share.expiresAt);
}
