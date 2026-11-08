/**
 * Dependency-free MCP Apps view. This resource is optional: every Bridge
 * operation also returns complete ordinary MCP text and structured content.
 * No provider token, TimeTree credential or private calendar URL enters HTML.
 */
export const BRIDGE_APP_URI = 'ui://timetree-mcp/calendar-bridge.html';
export const BRIDGE_APP_MIME = 'text/html;profile=mcp-app';

export const BRIDGE_APP_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TimeTree Calendar Bridge</title>
<style>
  :root { color-scheme: light dark; font-family: system-ui, -apple-system, sans-serif; }
  body { margin: 0; padding: 16px; color: CanvasText; background: Canvas; }
  h1 { margin: 0 0 4px; font-size: 1.12rem; }
  .sub { margin: 0 0 16px; font-size: .8rem; opacity: .75; }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .stat { background: color-mix(in srgb, CanvasText 5%, Canvas); border: 1px solid color-mix(in srgb, CanvasText 18%, Canvas); border-radius: 10px; padding: 12px 8px; text-align: center; }
  .num { font-size: 1.6rem; font-weight: 650; font-variant-numeric: tabular-nums; }
  .small { display: block; font-size: .7rem; opacity: .75; }
  section { margin-top: 16px; }
  h2 { font-size: .9rem; }
  .warn { padding: 10px 12px; border-radius: 8px; border: 1px solid #b17727; margin: 8px 0; font-size: .82rem; }
  ul { padding-left: 18px; }
  li { padding: 7px 0; border-bottom: 1px solid color-mix(in srgb, CanvasText 12%, Canvas); overflow-wrap: anywhere; font-size: .82rem; }
  .chip { display: inline-block; padding: 3px 7px; border-radius: 12px; border: 1px solid currentColor; font-size: .7rem; margin-right: 5px; }
  button { background: transparent; border: 1px solid currentColor; color: inherit; padding: 7px 12px; border-radius: 8px; cursor: pointer; margin: 4px 5px 4px 0; }
  button[aria-pressed="true"] { font-weight: 750; background: color-mix(in srgb, CanvasText 11%, Canvas); }
  #empty { margin-top: 18px; font-size: .86rem; }
  .fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 8px; }
  label { display: block; font-size: .78rem; margin-bottom: 4px; }
  select, input { box-sizing: border-box; width: 100%; padding: 8px; border: 1px solid color-mix(in srgb, CanvasText 30%, Canvas); border-radius: 8px; background: Canvas; color: CanvasText; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  #uiStatus { font-size: .8rem; overflow-wrap: anywhere; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
</head>
<body>
<main>
<h1>TimeTree Calendar Bridge</h1>
<p class="sub" id="subtitle">Read-only preview · No events have been changed</p>
<section aria-label="Build migration preview">
<h2>Select calendars</h2>
<button type="button" id="loadCalendars">Load calendars</button>
<button type="button" id="connectGoogle">Connect Google (local)</button>
<p id="uiStatus" aria-live="polite">Loading calendars requires a compatible MCP Apps host.</p>
<p id="googleLink"></p>
<div class="fields">
<div><label for="sourceCalendar">TimeTree source</label><select id="sourceCalendar" aria-label="TimeTree source"><option value="">Select…</option></select></div>
<div><label for="googleCalendar">Google destination</label><select id="googleCalendar" aria-label="Google destination"><option value="">Select…</option></select></div>
<div><label for="fromDate">From (UTC)</label><input type="date" id="fromDate"></div>
<div><label for="toDate">Until (UTC, exclusive)</label><input type="date" id="toDate"></div>
<div><label for="privacy">Privacy</label><select id="privacy"><option value="full">Full event details</option><option value="busy">Busy only</option></select></div>
</div>
<button type="button" id="compare" disabled>Compare — read only</button>
</section>
<div class="grid" aria-label="Export summary">
  <div class="stat"><div class="num" id="create">—</div><span class="small">Create</span></div>
  <div class="stat"><div class="num" id="skip">—</div><span class="small">Skip</span></div>
  <div class="stat"><div class="num" id="blocked">—</div><span class="small">Blocked</span></div>
</div>
<section id="warnings" aria-live="polite"></section>
<section id="listSection" hidden>
<h2>Proposed changes</h2>
<div role="group" aria-label="Filter actions">
<button id="showAll" aria-pressed="true">All</button>
<button id="showCreate" aria-pressed="false">Create</button>
<button id="showSkip" aria-pressed="false">Skip</button>
</div>
<ul id="actions"></ul>
</section>
<p id="empty" aria-live="polite">Waiting for a Calendar Bridge tool result…</p>
</main>
<script>
(() => {
  'use strict';
  let current = null;
  let filter = 'all';
  let rpcId = 100;
  const awaiting = new Map();
  let sourceLoaded = false;
  let googleLoaded = false;
  function notify(value) { set('uiStatus', value); }
  function callReadTool(name, args, kind) {
    // Only these bounded tools can be called by this UI.
    if (!['list_calendars', 'list_google_calendars', 'preview_google_calendar_bridge', 'connect_google_calendar'].includes(name)) return;
    const id = rpcId++;
    awaiting.set(id, kind);
    window.parent.postMessage({
      jsonrpc: '2.0', id, method: 'tools/call',
      params: { name, arguments: args }
    }, '*');
  }
  function decodeResult(reply) {
    if (!reply || reply.isError) return null;
    if (reply.structuredContent && typeof reply.structuredContent === 'object') return reply.structuredContent;
    try {
      return JSON.parse(reply.content.find(x => x.type === 'text')?.text ?? 'null');
    } catch { return null; }
  }
  function fillSelect(id, items, nameField) {
    const select = el(id);
    select.replaceChildren(new Option('Select…', ''));
    for (const item of items.slice(0, 200)) {
      if (typeof item.id !== 'string' || typeof item[nameField] !== 'string') continue;
      select.appendChild(new Option(item[nameField], item.id));
    }
  }
  function onRpcResult(kind, message) {
    const data = decodeResult(message.result);
    if (!data) { notify('Unable to complete the requested operation. Check the MCP client response.'); return; }
    if (kind === 'source') {
      sourceLoaded = Array.isArray(data.calendars);
      if (sourceLoaded) fillSelect('sourceCalendar', data.calendars, 'name');
    } else if (kind === 'google') {
      googleLoaded = Array.isArray(data.calendars);
      if (googleLoaded) fillSelect('googleCalendar', data.calendars, 'name');
    } else if (kind === 'connect') {
      if (typeof data.authorization_url === 'string') {
        try {
          const url = new URL(data.authorization_url);
          if (url.origin === 'https://accounts.google.com') {
            const link = document.createElement('a');
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Open Google authorization on this computer';
            el('googleLink').replaceChildren(link);
          }
        } catch { /* Invalid provider URL is not rendered. */ }
      }
      notify('Finish authorization in a browser on this computer, then load calendars again.');
    } else if (kind === 'preview') {
      current = data;
      render();
      notify(data.ready ? 'Preview complete. No changes were applied.' : 'Preview requires review. No changes were applied.');
    }
    el('compare').disabled = !(sourceLoaded && googleLoaded);
    if (kind === 'source' || kind === 'google') {
      notify(sourceLoaded && googleLoaded ? 'Choose both calendars and a date range to compare.' : 'Select calendars after both lists finish loading.');
    }
  }

  const el = id => document.getElementById(id);
  const set = (id, value) => { el(id).textContent = String(value); };
  function appendText(parent, tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = String(value);
    if (className) node.className = className;
    parent.appendChild(node);
    return node;
  }
  function render() {
    if (!current) return;
    const plan = current.plan;
    const actions = Array.isArray(plan?.actions) ? plan.actions : [];
    const totals = plan?.totals ?? {};
    set('create', typeof totals.create === 'number' ? totals.create : current.event_count ?? 0);
    set('skip', typeof totals.skip === 'number' ? totals.skip : 0);
    set('blocked', typeof current.blocked === 'number' ? current.blocked : 0);
    set('subtitle', current.ics_content
      ? 'ICS backup ready · No events have been changed'
      : 'Read-only migration preview · No events have been changed');
    const warningNode = el('warnings');
    warningNode.replaceChildren();
    if (Array.isArray(current.warnings)) {
      current.warnings.slice(0, 12).forEach(w => appendText(warningNode, 'p', w, 'warn'));
    }
    if (current.ready === false) appendText(warningNode, 'p', 'Not ready to apply: review blocked events and destination snapshot.', 'warn');
    const container = el('actions');
    container.replaceChildren();
    actions.filter(a => filter === 'all' || a.kind === filter).slice(0, 250).forEach(action => {
      const item = document.createElement('li');
      appendText(item, 'span', action.kind === 'create' ? 'CREATE' : 'SKIP', 'chip');
      const event = action.event ?? {};
      appendText(item, 'span', action.kind === 'create' ? event.title ?? '(untitled)' : action.reason ?? 'Skipped');
      container.appendChild(item);
    });
    el('listSection').hidden = actions.length === 0;
    set('empty', actions.length || current.ics_content ? '' : 'No changes in this range.');
  }
  function receiveResult(message) {
    const raw = message.params;
    if (!raw || raw.isError) return;
    let data = raw.structuredContent;
    if (!data && Array.isArray(raw.content)) {
      try { data = JSON.parse(raw.content.find(x => x.type === 'text')?.text ?? 'null'); } catch { return; }
    }
    if (data && typeof data === 'object' && (data.plan || data.ics_content)) {
      current = data;
      render();
    }
  }
  window.addEventListener('message', event => {
    if (event.source !== window.parent || !event.data || event.data.jsonrpc !== '2.0') return;
    const message = event.data;
    if (message.id === 1 && (message.result || message.error)) {
      if (message.result) window.parent.postMessage({ jsonrpc:'2.0', method:'ui/notifications/initialized' }, '*');
      else set('empty', 'This host does not support the MCP Apps handshake.');
    }
    if (message.id !== undefined && awaiting.has(message.id)) {
      const kind = awaiting.get(message.id);
      awaiting.delete(message.id);
      onRpcResult(kind, message);
    }
    if (message.method === 'ui/notifications/tool-result') receiveResult(message);
    if (message.method === 'ui/resource-teardown' && message.id !== undefined) {
      window.parent.postMessage({ jsonrpc:'2.0', id: message.id, result:{} }, '*');
    }
  });
  for (const [button, kind] of [['showAll','all'],['showCreate','create'],['showSkip','skip']]) {
    el(button).addEventListener('click', () => {
      filter = kind;
      for (const id of ['showAll','showCreate','showSkip']) el(id).setAttribute('aria-pressed', String(id === button));
      render();
    });
  }
  el('loadCalendars').addEventListener('click', () => {
    sourceLoaded = false; googleLoaded = false;
    el('compare').disabled = true;
    notify('Loading TimeTree and Google calendars…');
    callReadTool('list_calendars', {}, 'source');
    callReadTool('list_google_calendars', {}, 'google');
  });
  el('connectGoogle').addEventListener('click', () => {
    el('googleLink').replaceChildren();
    notify('Opening local Google authorization…');
    callReadTool('connect_google_calendar', {}, 'connect');
  });
  el('compare').addEventListener('click', () => {
    const calendar = el('sourceCalendar').value;
    const google = el('googleCalendar').value;
    const from = el('fromDate').value;
    const to = el('toDate').value;
    const startMs = Date.parse(from + 'T00:00:00Z');
    const endMs = Date.parse(to + 'T00:00:00Z');
    if (!calendar || !google || !Number.isFinite(startMs) || !Number.isFinite(endMs) ||
        endMs <= startMs || endMs - startMs > 366 * 86400000) {
      notify('Select both calendars and a valid UTC date range of at most 366 days.');
      return;
    }
    notify('Comparing calendars — no changes will be made…');
    callReadTool('preview_google_calendar_bridge', {
      calendar_id: calendar, google_calendar_id: google,
      start_at: startMs, end_at: endMs, privacy: el('privacy').value
    }, 'preview');
  });
  const today = new Date();
  el('fromDate').value = today.toISOString().slice(0, 10);
  el('toDate').value = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  window.parent.postMessage({
    jsonrpc:'2.0', id:1, method:'ui/initialize',
    params:{ protocolVersion:'2026-01-26', appInfo:{ name:'timetree-calendar-bridge', version:'0.1.0' }, appCapabilities:{} }
  }, '*');
})();
</script>
</body>
</html>`;
