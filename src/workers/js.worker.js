/* Sandboxed JavaScript runner. Code runs inside a Web Worker, which has no
   access to the page, its storage, or the DOM. console.log is captured; timers
   run on a virtual clock and fetch talks to a pretend in-memory API. */
import { execute, runTests } from '../lib/jsEngine.js';

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  if (type === 'init') return self.postMessage({ id, ok: true, result: null });
  if (type === 'run') return self.postMessage({ id, ok: true, result: await execute(payload.code) });
  if (type === 'test') return self.postMessage({ id, ok: true, result: await runTests(payload.code, payload.tests) });
};
