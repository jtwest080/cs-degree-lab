/* Web Worker that runs Python off the main thread, so an infinite loop in a
   learner's code can never freeze the page (the runner simply terminates
   this worker and starts a fresh one). */
import { createPythonEngine } from '../lib/pythonEngine.js';

let engine = null;

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  try {
    if (type === 'init') {
      // eslint-disable-next-line no-undef
      importScripts(payload.indexURL + 'pyodide.js');
      // eslint-disable-next-line no-undef
      engine = createPythonEngine(self.loadPyodide, payload.indexURL);
      await engine.init();
      self.postMessage({ id, ok: true, result: null });
      return;
    }
    const result = await engine[type](payload);
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message ? err.message : err) });
  }
};
