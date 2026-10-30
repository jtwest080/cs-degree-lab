// Runs learner code for any supported language and enforces a time limit.
//
// Python runs in a Web Worker with Pyodide. If the code takes too long (for
// example an accidental infinite loop) we terminate the worker and start a
// fresh one, then report a friendly timeout error.
import PythonWorker from '../workers/python.worker.js?worker';
import JsWorker from '../workers/js.worker.js?worker';
import { createPythonEngine } from './pythonEngine.js';

const LOCAL_PYODIDE = new URL('pyodide/', document.baseURI).href;
const CDN_PYODIDE = 'https://cdn.jsdelivr.net/npm/pyodide@0.26.4/';
const TIME_LIMIT_MS = { run: 10000, test: 15000 };

const listeners = new Set();
let pythonStatus = 'idle'; // idle | loading | ready | error

function setStatus(s) {
  pythonStatus = s;
  listeners.forEach((fn) => fn(s));
}

/** Subscribe to Python loading status changes. Returns an unsubscribe function. */
export function onPythonStatus(fn) {
  listeners.add(fn);
  fn(pythonStatus);
  return () => listeners.delete(fn);
}

class WorkerRunner {
  constructor(makeWorker, initPayload) {
    this.makeWorker = makeWorker;
    this.initPayload = initPayload;
    this.worker = null;
    this.pending = new Map();
    this.nextId = 1;
    this.ready = null;
  }

  start() {
    if (this.ready) return this.ready;
    this.worker = this.makeWorker();
    this.worker.onmessage = (e) => {
      const { id, ok, result, error } = e.data;
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      clearTimeout(p.timer);
      ok ? p.resolve(result) : p.reject(new Error(error));
    };
    this.worker.onerror = (e) => {
      e.preventDefault?.();
      this.pending.forEach((p) => p.reject(new Error(e.message || 'Worker failed to start')));
      this.pending.clear();
    };
    this.ready = this.send('init', this.initPayload(), 120000);
    return this.ready;
  }

  send(type, payload, timeLimit) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.restart();
        reject(new TimeoutError(timeLimit));
      }, timeLimit);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type, payload });
    });
  }

  restart() {
    this.worker?.terminate();
    this.pending.forEach((p) => { clearTimeout(p.timer); p.reject(new Error('Runner restarted')); });
    this.pending.clear();
    this.worker = null;
    this.ready = null;
  }

  async exec(type, payload) {
    await this.start();
    return this.send(type, payload, TIME_LIMIT_MS[type]);
  }
}

class TimeoutError extends Error {
  constructor(ms) {
    super(
      `Time limit exceeded: your code ran for more than ${ms / 1000} seconds and was stopped.\n` +
      'This usually means a loop that never ends. Check that your loop condition eventually becomes False.\n' +
      'If the tests use a lot of data, it can also mean your approach is too slow: look for nested loops, ' +
      'or hidden ones such as `in` on a list.'
    );
    this.isTimeout = true;
  }
}

// ---------------------------------------------------------------- Python ---

let pyIndexURL = LOCAL_PYODIDE;
const python = new WorkerRunner(() => new PythonWorker(), () => ({ indexURL: pyIndexURL }));
let mainThreadEngine = null; // only used if Web Workers are unavailable

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}

async function startPython() {
  if (pythonStatus === 'ready') return;
  setStatus('loading');
  // Try, in order: worker + bundled runtime, worker + CDN runtime, main thread.
  const attempts = [
    async () => { pyIndexURL = LOCAL_PYODIDE; await python.start(); },
    async () => { python.restart(); pyIndexURL = CDN_PYODIDE; await python.start(); },
    async () => {
      python.restart();
      let base = LOCAL_PYODIDE;
      try {
        await loadScript(base + 'pyodide.js');
      } catch {
        base = CDN_PYODIDE;
        await loadScript(base + 'pyodide.js');
      }
      mainThreadEngine = createPythonEngine(window.loadPyodide, base);
      await mainThreadEngine.init();
    },
  ];
  let lastErr;
  for (const attempt of attempts) {
    try {
      await attempt();
      setStatus('ready');
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  setStatus('error');
  throw lastErr;
}

/** Start downloading Python in the background (called when a lesson opens). */
export function preloadPython() {
  startPython().catch(() => {});
}

// ------------------------------------------------------------ JavaScript ---

const js = new WorkerRunner(() => new JsWorker(), () => ({}));

// ---------------------------------------------------------------- public ---

/**
 * Run a program. Returns { output, error }.
 * @param {'python'|'javascript'} language
 */
export async function runCode(language, { code, stdin = [], prelude = '' }) {
  try {
    if (language === 'javascript') return await js.exec('run', { code });
    await startPython();
    if (mainThreadEngine) return await mainThreadEngine.run({ code, stdin, prelude });
    return await python.exec('run', { code, stdin, prelude });
  } catch (e) {
    return { output: '', error: e.message };
  }
}

/**
 * Run a program against a list of tests. Returns
 * { output, error, results: [{ name, passed, message }] }.
 */
export async function testCode(language, { code, tests, stdin = [], prelude = '' }) {
  try {
    if (language === 'javascript') return await js.exec('test', { code, tests });
    await startPython();
    if (mainThreadEngine) return await mainThreadEngine.test({ code, tests, stdin, prelude });
    return await python.exec('test', { code, tests, stdin, prelude });
  } catch (e) {
    return {
      output: '',
      error: e.message,
      results: tests.map((t) => ({ name: t.name, passed: false, message: e.isTimeout ? 'Timed out.' : 'Could not run.' })),
    };
  }
}
