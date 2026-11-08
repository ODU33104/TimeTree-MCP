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
</style>
</head>
<body>
<main>
<h1>TimeTree Calendar Bridge</h1>
<p class="sub" id="subtitle">Read-only preview · No events have been changed</p>
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
  window.parent.postMessage({
    jsonrpc:'2.0', id:1, method:'ui/initialize',
    params:{ protocolVersion:'2026-01-26', appInfo:{ name:'timetree-calendar-bridge', version:'0.1.0' }, appCapabilities:{} }
  }, '*');
})();
</script>
</body>
</html>`;
