/* SQL runner: SQLite (sql.js, WebAssembly) inside a Web Worker. */
import { runSql, testSql } from '../lib/sqlEngine.js';

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  try {
    if (type === 'init') { await runSql('SELECT 1'); return self.postMessage({ id, ok: true, result: null }); }
    if (type === 'run') {
      const r = await runSql(payload.code, payload.prelude || '');
      return self.postMessage({ id, ok: true, result: { output: r.output, error: r.error } });
    }
    if (type === 'test') {
      return self.postMessage({ id, ok: true, result: await testSql(payload.code, payload.tests, payload.prelude || '') });
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: e.message });
  }
};
