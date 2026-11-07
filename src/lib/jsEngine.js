// JavaScript execution used by the worker and by scripts/verify_js.mjs (no imports).
// Code runs inside an async function, so top-level `await` works. Timers use a
// virtual clock: setTimeout callbacks run in time order, instantly, and
// deterministically once the main code has finished. A small in-memory
// `fetch` serves a pretend API so asynchronous lessons need no network.

const format = (value) => {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return String(value);
  try { return JSON.stringify(value); } catch { return String(value); }
};

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const realTimeout = setTimeout;
const tick = () => new Promise((r) => realTimeout(r, 0));

function makeFetch(timers) {
  const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Ben' }];
  const respond = (status, body, delay) => new Promise((resolve) => {
    timers.add(() => resolve({
      ok: status >= 200 && status < 300, status,
      json: async () => JSON.parse(JSON.stringify(body)),
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    }), delay);
  });
  return (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const path = String(url).replace(/^https?:\/\/[^/]+/, '');
    if (path === '/api/users' && method === 'GET') return respond(200, users, 100);
    if (path === '/api/users' && method === 'POST') {
      let body; try { body = JSON.parse(options.body); } catch { return respond(400, { error: 'bad json' }, 50); }
      return respond(201, { id: 3, ...body }, 100);
    }
    const m = path.match(/^\/api\/users\/(\d+)$/);
    if (m && method === 'GET') { const u = users.find((x) => x.id === Number(m[1])); return respond(u ? 200 : 404, u || { error: 'not found' }, 50); }
    if (path === '/api/slow') return respond(200, { done: true }, 500);
    if (path === '/api/fail') return new Promise((_, reject) => timers.add(() => reject(new TypeError('Failed to fetch')), 50));
    return respond(404, { error: 'not found' }, 10);
  };
}

export async function execute(code, extra = '') {
  const lines = [];
  const log = (...a) => lines.push(a.map(format).join(' '));
  const fakeConsole = { log, error: log, warn: log, info: log };
  const queue = []; let now = 0; let seq = 0; let fired = 0; let pumping = false;
  // The pump runs timers one at a time on real macrotask boundaries, so every
  // promise reaction finishes before the next timer fires.
  const pump = () => {
    if (pumping) return;
    pumping = true;
    realTimeout(function step() {
      if (!queue.length) { pumping = false; return; }
      if (++fired > 5000) { queue.length = 0; pumping = false; return; }
      queue.sort((x, y) => x.at - y.at || x.order - y.order);
      const t = queue.shift(); now = t.at;
      if (t.every) { t.at = now + t.every; t.order = ++seq; queue.push(t); }
      try { t.fn(...t.args); } catch (e) { lines.push('Uncaught ' + e.name + ': ' + e.message); }
      realTimeout(step, 0);
    }, 0);
  };
  const timers = {
    add(fn, ms, interval = false, args = []) {
      const id = ++seq;
      queue.push({ id, at: now + Math.max(0, Number(ms) || 0), fn, args, order: id, every: interval ? Math.max(1, Number(ms) || 1) : 0 });
      pump();
      return id;
    },
  };
  const setTimeoutV = (fn, ms, ...args) => timers.add(fn, ms, false, args);
  const setIntervalV = (fn, ms, ...args) => timers.add(fn, ms, true, args);
  const clear = (id) => { const i = queue.findIndex((t) => t.id === id); if (i >= 0) queue.splice(i, 1); };
  const drain = async () => {
    await tick();
    while (queue.length || pumping) {
      if (fired > 5000) throw new Error('Too many timer callbacks: is there a setInterval that is never cleared?');
      await tick();
    }
  };
  const fetchV = makeFetch(timers);
  let error = null;
  try {
    const fn = new AsyncFunction('console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'fetch', '__drain', `"use strict";\n${code}\n;await __drain();\n${extra}`);
    await fn(fakeConsole, setTimeoutV, setIntervalV, clear, clear, fetchV, drain);
  } catch (e) {
    error = `${e.name}: ${e.message}`;
  }
  return { output: lines.join('\n') + (lines.length ? '\n' : ''), error };
}

export async function runTests(code, tests) {
  const base = await execute(code);
  if (base.error) {
    return { ...base, results: tests.map((t) => ({ name: t.name, passed: false, message: 'Your code stopped with an error before this test could run.' })) };
  }
  const results = [];
  for (const t of tests) {
    const r = await execute(code, `const output = ${JSON.stringify(base.output)};\n${t.code}`);
    results.push({ name: t.name, passed: !r.error, message: r.error || '' });
  }
  return { ...base, results };
}
