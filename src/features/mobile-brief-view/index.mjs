/** Read-only mobile formatter for already-authorized synthetic briefing items. No provider calls. */
export function formatMobileBrief(snapshot, {locale='ja-JP',timezone='Asia/Tokyo',maxItems=5}={}) {
  if (!['ja-JP','en-US'].includes(locale)) throw new Error('Unsupported locale');
  if (!Number.isInteger(maxItems)||maxItems<1||maxItems>20) throw new Error('Invalid maxItems');
  let fmt;
  try { fmt=new Intl.DateTimeFormat(locale,{timeZone:timezone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}); }
  catch { throw new Error('Invalid timezone'); }
  if (!snapshot||!Array.isArray(snapshot.items)||!Array.isArray(snapshot.requestedCalendarIds)||!Array.isArray(snapshot.authorizedCalendarIds)) throw new Error('Invalid snapshot');
  const requested=new Set(snapshot.requestedCalendarIds),authorized=new Set(snapshot.authorizedCalendarIds);
  if ([...requested,...authorized].some(id=>typeof id!=='string'||!id)||[...authorized].some(id=>!requested.has(id))) throw new Error('Invalid scope');
  if (!Number.isSafeInteger(snapshot.fetchedAt)) throw new Error('Unknown freshness');
  if (typeof snapshot.complete!=='boolean'||typeof snapshot.stale!=='boolean') throw new Error('Unknown completeness');
  const ja=locale==='ja-JP',partial=!snapshot.complete||requested.size!==authorized.size;
  const lines=[ja?'予定の要約（読み取り専用）':'Schedule summary (read only)',(ja?'対象カレンダー: ':'Calendars checked: ')+authorized.size+'/'+requested.size,(ja?'取得: ':'Fetched: ')+fmt.format(snapshot.fetchedAt)];
  if (partial) lines.push(ja?'一部の予定は未確認です':'Some calendars or results were not checked');
  if (snapshot.stale) lines.push(ja?'古い情報です。現在の予定とは限りません':'Stale snapshot; not necessarily current');
  const items=snapshot.items.map(item=>{
    if (!item||typeof item.calendarId!=='string'||!Number.isSafeInteger(item.at)||!['upcoming','conflict','prepare'].includes(item.kind)) throw new Error('Invalid item');
    if (!authorized.has(item.calendarId)) throw new Error('Unauthorized calendar item');
    return item;
  }).sort((a,b)=>a.at-b.at||a.kind.localeCompare(b.kind));
  if (!items.length) lines.push(ja?'確認した範囲に予定はありません':'No events in the checked scope');
  for (const item of items.slice(0,maxItems)) {
    const label=item.kind==='conflict'?(ja?'予定の重複':'Schedule conflict'):item.kind==='prepare'?(ja?'準備の目安':'Preparation reminder'):(ja?'予定あり':'Scheduled event');
    lines.push(fmt.format(item.at)+' — '+label);
  }
  if (items.length>maxItems) lines.push(ja?'ほか'+(items.length-maxItems)+'件（省略）':(items.length-maxItems)+' more (omitted)');
  return {text:lines.join('\n'),partial,stale:snapshot.stale,displayedCount:Math.min(items.length,maxItems),truncated:items.length>maxItems};
}
