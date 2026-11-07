// Runs C programs with PicoC, a small C interpreter compiled to WebAssembly
// (vendored in src/vendor/picoc.js, MIT licence, from the picoc-js package).
// Each run uses a fresh interpreter, so programs never share memory.
import { picoc } from '../vendor/picoc.js';

class Quit {
  constructor(status) { this.status = status; }
}

// PicoC prints each line of text without its newline, and reports mistakes
// (a source line, a caret and "file.c:LINE:COL message") through the same
// channel. Split those apart.
function finish(lines, err, status, failure) {
  const raw = lines.slice();
  const at = raw.findIndex((l) => /file\.c:\d+:\d+/.test(l));
  let error = failure;
  let shown = raw;
  if (at >= 0) {
    const m = raw[at].match(/file\.c:(\d+):(\d+)\s*(.*)$/);
    const start = Math.max(0, at - 2);
    shown = raw.slice(0, start);
    error = `Line ${m[1]}, column ${m[2]}: ${m[3] || 'error'}\n` + raw.slice(start, at).join('\n');
    if (!status) status = 1;
  }
  const stderr = err.join('\n').trim();
  if (!error && stderr) error = stderr;
  if (!error && status !== 0) error = `The program ended with exit code ${status}.`;
  const output = shown.map((l) => l + '\n').join('');
  return { output, error, status };
}

/** Run a C program. Resolves to { output, error, status }. */
export function runC(source) {
  return new Promise((resolve) => {
    const out = [];
    const err = [];
    let pc;
    let quitStatus = null;
    try {
      pc = picoc({
        printErr: (s) => { if (!/^exception thrown/.test(s)) err.push(s); },
        quit: (status) => { if (quitStatus === null) quitStatus = status; throw new Quit(status); },
      });
    } catch (e) {
      return resolve({ output: '', error: String(e && e.message ? e.message : e), status: 1 });
    }
    pc.onRuntimeInitialized = () => {
      let status = 0;
      let failure = null;
      try {
        pc.runc(source, (s) => out.push(s));
      } catch (e) {
        if (quitStatus !== null) status = quitStatus;
        else failure = String(e && e.message ? e.message : e);
      }
      resolve(finish(out, err, status, failure));
    };
  });
}

/** Evaluate one test body against a finished run. Throwing means failure. */
function check(code, run, source) {
  try {
    // eslint-disable-next-line no-new-func
    new Function('output', 'status', 'error', 'source', `"use strict";\n${code}`)(
      run.output, run.status, run.error, source
    );
    return { passed: true, message: '' };
  } catch (e) {
    return { passed: false, message: e.message || String(e) };
  }
}

/**
 * Run a program against tests. A test body is JavaScript that can read
 * `output`, `status`, `error` and `source` and throws to fail. A test can add
 * `append` (extra C code, such as a main() that calls the learner's
 * functions); then that combined program is the one checked.
 */
export async function testC(code, tests) {
  const base = await runC(code);
  const results = [];
  for (const t of tests) {
    // The learner's own main() is renamed so the test's main() takes over.
    const run = t.append ? await runC(`${code.replace(/\bint\s+main\s*\(/, 'int learner_main(')}\n${t.append}`) : base;
    if (run.error && !t.allowError) {
      results.push({ name: t.name, passed: false, message: run.error.split('\n')[0] });
    } else {
      results.push({ name: t.name, ...check(t.code, run, code) });
    }
  }
  return { output: base.output, error: base.error, results };
}
