// Runs SQL with SQLite (sql.js: SQLite compiled to WebAssembly, wasm inlined so
// it works offline and in Node). Every run uses a fresh in-memory database:
// first the lesson's `prelude` (tables and rows), then the learner's SQL.
import initSqlJs from 'sql.js/dist/sql-wasm-inline.js';

let SQLP = null;
const getSQL = () => (SQLP ||= initSqlJs());

/** Plain-text table, like the sqlite3 shell in column mode. */
export function formatTable(columns, rows) {
  const cell = (v) => (v === null || v === undefined ? 'NULL' : String(v));
  const body = rows.map((r) => r.map(cell));
  const widths = columns.map((c, i) => Math.max(c.length, ...body.map((r) => r[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join(' | ').trimEnd();
  return [line(columns), widths.map((w) => '-'.repeat(w)).join('-+-'), ...body.map(line)].join('\n') + '\n';
}

function lastResult(db, sql) {
  // db.exec returns one entry per statement that produced rows
  const res = db.exec(sql);
  return res.length ? res[res.length - 1] : null;
}

/** Run SQL. Resolves to { output, error, columns, rows, db? }. */
export async function runSql(source, prelude = '', keep = false) {
  const SQL = await getSQL();
  const db = new SQL.Database();
  try {
    if (prelude) db.exec(prelude);
  } catch (e) {
    db.close();
    return { output: '', error: 'Setup failed: ' + e.message, columns: [], rows: [] };
  }
  let out = { output: '', error: null, columns: [], rows: [] };
  try {
    const r = lastResult(db, source);
    if (r && r.columns.join() === 'id,parent,notused,detail') {
      // EXPLAIN QUERY PLAN: only the readable detail is stable between SQLite versions
      r.columns = ['plan']; r.values = r.values.map((v) => [v[3]]);
    }
    if (r) out = { output: formatTable(r.columns, r.values), error: null, columns: r.columns, rows: r.values };
    else out.output = '(no rows returned)\n';
  } catch (e) {
    out = { output: '', error: e.message, columns: [], rows: [] };
  }
  if (keep) out.db = db; else db.close();
  return out;
}

/**
 * Run SQL against tests. A test body is JavaScript that can read `output`,
 * `error`, `columns`, `rows`, `source` and call `query(sql)` (returns an array
 * of row arrays from the learner's finished database). It throws to fail.
 */
export async function testSql(code, tests, prelude = '') {
  const r = await runSql(code, prelude, true);
  const query = (sql) => {
    if (!r.db) throw new Error('No database to query: fix the error first.');
    const res = r.db.exec(sql);
    return res.length ? res[res.length - 1].values : [];
  };
  const show = (v) => JSON.stringify(v);
  // expectRows(expected, ordered = true): the result must have exactly these rows.
  const expectRows = (expected, ordered = true) => {
    const key = (row) => show(row);
    const got = ordered ? r.rows.map(key) : r.rows.map(key).sort();
    const want = ordered ? expected.map(key) : expected.map(key).sort();
    if (show(got) !== show(want)) {
      throw new Error(`Expected ${expected.length} row(s) ${show(expected).slice(0, 300)} but got ${r.rows.length} row(s) ${show(r.rows).slice(0, 300)}`);
    }
  };
  // expectColumns(['name', 'gpa']): the result columns must have these names.
  const expectColumns = (expected) => {
    if (show(r.columns) !== show(expected)) throw new Error(`Expected columns ${show(expected)} but got ${show(r.columns)}`);
  };
  const results = [];
  for (const t of tests) {
    if (r.error && !t.allowError) {
      results.push({ name: t.name, passed: false, message: r.error.split('\n')[0] });
      continue;
    }
    try {
      // eslint-disable-next-line no-new-func
      new Function('output', 'error', 'columns', 'rows', 'source', 'query', 'expectRows', 'expectColumns', `"use strict";\n${t.code}`)(
        r.output, r.error, r.columns, r.rows, code, query, expectRows, expectColumns
      );
      results.push({ name: t.name, passed: true, message: '' });
    } catch (e) {
      results.push({ name: t.name, passed: false, message: e.message || String(e) });
    }
  }
  r.db?.close();
  return { output: r.output, error: r.error, results };
}
