export type EventTemplate = { title: string; durationMinutes: number; timezone: string; description?: string; recurrence?: { frequency: "daily" | "weekly"; count: number } };
export type PlannedEvent = { title: string; start: string; end: string; description?: string };
const validZone = (zone: string): boolean => { try { new Intl.DateTimeFormat("en-US", { timeZone: zone }); return true; } catch { return false; } };
export function validateTemplate(value: EventTemplate): void {
  if (!value || typeof value.title !== "string" || !value.title.trim() || value.title.length > 200) throw new Error("Invalid template title");
  if (!Number.isInteger(value.durationMinutes) || value.durationMinutes < 1 || value.durationMinutes > 1440) throw new Error("Invalid duration");
  if (!value.timezone || !validZone(value.timezone)) throw new Error("Invalid timezone");
  if (value.description !== undefined && (typeof value.description !== "string" || value.description.length > 10000)) throw new Error("Invalid description");
  if (value.recurrence && (!["daily", "weekly"].includes(value.recurrence.frequency) || !Number.isInteger(value.recurrence.count) || value.recurrence.count < 1 || value.recurrence.count > 100)) throw new Error("Invalid recurrence");
}
export function previewTemplate(template: EventTemplate, startIso: string): ReadonlyArray<PlannedEvent> {
  validateTemplate(template);
  if (typeof startIso !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(startIso)) throw new Error("Start must include a UTC offset");
  const start = new Date(startIso);
  if (!Number.isFinite(start.getTime())) throw new Error("Invalid start");
  const count = template.recurrence?.count ?? 1;
  const step = template.recurrence?.frequency === "weekly" ? 7 : 1;
  const output: PlannedEvent[] = [];
  for (let i = 0; i < count; i++) {
    const begin = new Date(start.getTime());
    begin.setUTCDate(begin.getUTCDate() + i * step);
    const end = new Date(begin.getTime() + template.durationMinutes * 60000);
    output.push(Object.freeze({ title: template.title.trim(), start: begin.toISOString(), end: end.toISOString(), ...(template.description === undefined ? {} : { description: template.description }) }));
  }
  return Object.freeze(output);
}
// Deliberately no calendar mutation: a separate permission-gated consumer must confirm this preview.
