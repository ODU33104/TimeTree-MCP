/** Deterministic, side-effect-free Japanese/English date expression normalizer. */
export type DateResolution =
  | { status: 'resolved'; date: string; timeZone: string; source: string }
  | { status: 'ambiguous'; reason: string; candidates?: string[] }
  | { status: 'unsupported'; reason: string };
export interface DateParseOptions { reference: string; timeZone: string; locale: 'ja' | 'en'; }
function dateParts(timestamp: number, timeZone: string): { year: number; month: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone, year:'numeric',month:'numeric',day:'numeric',weekday:'short'}).formatToParts(timestamp);
  const get = (type: string) => parts.find(p=>p.type===type)?.value ?? '';
  return {year:Number(get('year')),month:Number(get('month')),day:Number(get('day')),weekday:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday'))};
}
function iso(y:number,m:number,d:number): string | null {
  if (![y,m,d].every(Number.isInteger) || y<1 || y>9999 || m<1 || m>12 || d<1 || d>31) return null;
  const check = new Date(Date.UTC(y,m-1,d));
  return check.getUTCFullYear()===y && check.getUTCMonth()===m-1 && check.getUTCDate()===d
    ? `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;
}
function shift(date:{year:number;month:number;day:number},days:number):string {
  const d=new Date(Date.UTC(date.year,date.month-1,date.day+days));
  return iso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())!;
}
/** Returns a calendar date, never an invented time-of-day or UTC instant. */
export function normalizeDateExpression(input:string, options:DateParseOptions):DateResolution {
  if (!input || input.length>120) return {status:'unsupported',reason:'Empty or excessive expression'};
  if (!['ja','en'].includes(options.locale)) return {status:'unsupported',reason:'Unsupported locale'};
  try { new Intl.DateTimeFormat('en',{timeZone:options.timeZone}); } catch { return {status:'unsupported',reason:'Invalid time zone'}; }
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(options.reference) || !Number.isFinite(Date.parse(options.reference))) return {status:'unsupported',reason:'Reference requires explicit offset'};
  const text=input.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
  const today=dateParts(Date.parse(options.reference),options.timeZone);
  const resolved=(date:string):DateResolution=>({status:'resolved',date,timeZone:options.timeZone,source:input});
  const relative:Record<string,number>={ '今日':0,'きょう':0,'明日':1,'あした':1,'明後日':2,'あさって':2,'昨日':-1,'today':0,'tomorrow':1,'yesterday':-1,'day after tomorrow':2 };
  if (Object.hasOwn(relative,text)) return resolved(shift(today,relative[text]));
  const weekdays:Record<string,number>={日:0,月:1,火:2,水:3,木:4,金:5,土:6,sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
  const jp=/^(今週|来週)([日月火水木金土])(?:曜(?:日)?)?$/.exec(text);
  const en=/^(this|next) (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.exec(text);
  if (jp || en) {
    const week=jp?jp[1]:en![1];
    const target=weekdays[jp?jp[2]:en![2]];
    const mondayOffset=(today.weekday+6)%7;
    const targetOffset=(target+6)%7;
    const days=targetOffset-mondayOffset+((week==='来週'||week==='next')?7:0);
    if (days<0 && (week==='今週'||week==='this')) return {status:'ambiguous',reason:'Weekday already passed this week'};
    return resolved(shift(today,days));
  }
  const full=/^(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?$/.exec(text);
  if (full) { const d=iso(+full[1],+full[2],+full[3]); return d?resolved(d):{status:'unsupported',reason:'Invalid calendar date'}; }
  const monthDay=/^(\d{1,2})月(\d{1,2})日$/.exec(text);
  if (monthDay) {
    const candidates=[today.year,today.year+1].map(y=>iso(y,+monthDay[1],+monthDay[2])).filter((d):d is string=>!!d);
    return {status:'ambiguous',reason:'Year omitted',candidates};
  }
  if (/^\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?$/.test(text)) return {status:'ambiguous',reason:'Numeric date order or year is ambiguous'};
  if (/^(来週|next week|今度|soon|週末|this weekend)$/.test(text)) return {status:'ambiguous',reason:'Expression does not specify a unique calendar date'};
  return {status:'unsupported',reason:'Unrecognized expression; request explicit YYYY-MM-DD'};
}
