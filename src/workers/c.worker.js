/* C runner. Programs run with PicoC (a small C interpreter compiled to
   WebAssembly) inside a Web Worker, so they cannot touch the page. */
import { runC, testC } from '../lib/cEngine.js';

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  if (type === 'init') return self.postMessage({ id, ok: true, result: null });
  if (type === 'run') {
    const r = await runC(payload.code);
    return self.postMessage({ id, ok: true, result: { output: r.output, error: r.error } });
  }
  if (type === 'test') {
    return self.postMessage({ id, ok: true, result: await testC(payload.code, payload.tests) });
  }
};
