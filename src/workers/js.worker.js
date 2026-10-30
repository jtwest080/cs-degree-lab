/* Sandboxed JavaScript runner. Code runs inside a Web Worker, which has no
   access to the page, its storage, or the DOM. console.log is captured. */

function format(value) {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function execute(code, extra = '') {
  const lines = [];
  const fakeConsole = {
    log: (...a) => lines.push(a.map(format).join(' ')),
    error: (...a) => lines.push(a.map(format).join(' ')),
    warn: (...a) => lines.push(a.map(format).join(' ')),
  };
  let error = null;
  try {
    // eslint-disable-next-line no-new-func
    new Function('console', `"use strict";\n${code}\n;${extra}`)(fakeConsole);
  } catch (e) {
    error = `${e.name}: ${e.message}`;
  }
  const output = lines.join('\n') + (lines.length ? '\n' : '');
  return { output, error };
}

self.onmessage = (event) => {
  const { id, type, payload } = event.data;
  if (type === 'init') return self.postMessage({ id, ok: true, result: null });
  if (type === 'run') return self.postMessage({ id, ok: true, result: execute(payload.code) });
  if (type === 'test') {
    const base = execute(payload.code);
    if (base.error) {
      const results = payload.tests.map((t) => ({
        name: t.name, passed: false,
        message: 'Your code stopped with an error before this test could run.',
      }));
      return self.postMessage({ id, ok: true, result: { ...base, results } });
    }
    const results = payload.tests.map((t) => {
      // Each test re-runs the learner's code, then the test body, which can
      // read `output` and call the learner's functions. Throw to fail.
      const wrapped = `const output = ${JSON.stringify(base.output)};\n${t.code}`;
      const r = execute(payload.code, wrapped);
      return { name: t.name, passed: !r.error, message: r.error || '' };
    });
    return self.postMessage({ id, ok: true, result: { ...base, results } });
  }
};
