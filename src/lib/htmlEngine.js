// Runs HTML, CSS and JavaScript in a sandboxed iframe (no access to the app,
// its storage or the network origin). Used for the web development unit.
// This file has no imports so scripts/verify_html.mjs can load it in a browser.

const HARNESS = `<script>
(function () {
  var send = function (m) { parent.postMessage(Object.assign({ __lab: window.__labId }, m), '*'); };
  var fmt = function (v) { if (typeof v === 'string') return v; try { return JSON.stringify(v); } catch (e) { return String(v); } };
  window.__logs = [];
  ['log', 'info', 'warn', 'error'].forEach(function (k) {
    console[k] = function () { var t = Array.prototype.map.call(arguments, fmt).join(' '); window.__logs.push(t); send({ type: 'log', text: t }); };
  });
  window.__lp = 0;
  window.__guard = function () { if (++window.__lp > 200000) { window.__lp = 0; throw new Error('Infinite loop stopped: a loop ran more than 200,000 times.'); } };
  window.addEventListener('error', function (e) { send({ type: 'error', text: (e.message || 'Error') }); window.__errors = (window.__errors || []).concat(e.message); });
  window.addEventListener('unhandledrejection', function (e) { var m = String(e.reason && e.reason.message || e.reason); send({ type: 'error', text: m }); window.__errors = (window.__errors || []).concat(m); });
  var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  window.addEventListener('message', function (ev) {
    var d = ev.data; if (!d || d.__lab !== window.__labId || d.cmd !== 'test') return;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var css = function (el, p) { return getComputedStyle(typeof el === 'string' ? document.querySelector(el) : el).getPropertyValue(p); };
    var fire = function (el, type, init) { el = typeof el === 'string' ? document.querySelector(el) : el; el.dispatchEvent(new Event(type, Object.assign({ bubbles: true, cancelable: true }, init))); };
    var click = function (el) { el = typeof el === 'string' ? document.querySelector(el) : el; el.click(); };
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); };
    var assert = function (c, m) { if (!c) throw new Error(m || 'Assertion failed'); };
    var output = window.__logs.join('\\n') + (window.__logs.length ? '\\n' : '');
    new AsyncFunction('$', '$$', 'css', 'fire', 'click', 'wait', 'assert', 'output', 'source', 'errors', '"use strict";\\n' + d.code)
      ($, $$, css, fire, click, wait, assert, output, d.source, window.__errors || [])
      .then(function () { send({ type: 'result', ok: true }); }, function (e) { send({ type: 'result', ok: false, message: String(e && e.message || e) }); });
  });
  window.addEventListener('load', function () { setTimeout(function () { send({ type: 'ready' }); }, 30); });
})();
<\/script>`;

// Insert a counter into every loop body of inline scripts so a runaway loop
// throws instead of freezing the page. Loops without braces are not guarded.
function guardLoops(js) {
  return js
    .replace(/\b(for|while)\s*\(([^()]|\([^()]*\))*\)\s*\{/g, (m) => m + '__guard();')
    .replace(/\bdo\s*\{/g, (m) => m + '__guard();');
}

export function buildDoc(code, id) {
  const guarded = code.replace(/(<script(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, body, c) => a + guardLoops(body) + c);
  const idScript = `<script>window.__labId=${JSON.stringify(id)};<\/script>`;
  const head = idScript + HARNESS;
  if (/<head[\s>]/i.test(guarded)) return guarded.replace(/<head[^>]*>/i, (m) => m + head);
  if (/<html[\s>]/i.test(guarded)) return guarded.replace(/<html[^>]*>/i, (m) => m + '<head>' + head + '</head>');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}</head><body>${guarded}</body></html>`;
}

let counter = 0;

function mount(code, { visible = false, container = null } = {}) {
  const id = `lab${Date.now()}_${++counter}`;
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
  frame.srcdoc = buildDoc(code, id);
  if (!visible) frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:600px;border:0';
  (container || document.body).appendChild(frame);
  return { id, frame };
}

/** Live preview for the editor. Returns { frame, logs(), dispose() } and calls onLog for console lines. */
export function preview(code, container, onMessage) {
  const { id, frame } = mount(code, { visible: true, container });
  const handler = (ev) => { if (ev.data && ev.data.__lab === id) onMessage?.(ev.data); };
  window.addEventListener('message', handler);
  return { frame, dispose() { window.removeEventListener('message', handler); frame.remove(); } };
}

function oneTest(code, test, timeoutMs) {
  return new Promise((resolve) => {
    const { id, frame } = mount(code);
    const logs = []; const errors = [];
    let done = false; let timer;
    const finish = (r) => { if (done) return; done = true; clearTimeout(timer); window.removeEventListener('message', handler); frame.remove(); resolve({ ...r, logs, errors }); };
    const handler = (ev) => {
      const d = ev.data; if (!d || d.__lab !== id) return;
      if (d.type === 'log') logs.push(d.text);
      else if (d.type === 'error') errors.push(d.text);
      else if (d.type === 'ready') frame.contentWindow.postMessage({ __lab: id, cmd: 'test', code: test.code, source: code }, '*');
      else if (d.type === 'result') finish({ passed: d.ok, message: d.message || '' });
    };
    window.addEventListener('message', handler);
    timer = setTimeout(() => finish({ passed: false, message: 'Timed out: the page took too long (an endless loop or a promise that never finishes?).' }), timeoutMs);
  });
}

/** Run once and report console output and script errors. */
export function runHtml(code, timeoutMs = 4000) {
  return oneTest(code, { code: '' }, timeoutMs).then((r) => ({ output: r.logs.map((l) => l + '\n').join(''), error: r.errors[0] || (r.passed ? null : r.message) }));
}

/** Each test gets a fresh copy of the page. Test bodies are JavaScript that throw to fail. */
export async function testHtml(code, tests, timeoutMs = 5000) {
  const base = await runHtml(code, timeoutMs);
  const results = [];
  for (const t of tests) {
    const r = await oneTest(code, t, timeoutMs);
    results.push({ name: t.name, passed: r.passed, message: r.message });
  }
  return { output: base.output, error: base.error, results };
}
