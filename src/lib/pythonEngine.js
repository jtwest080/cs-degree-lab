// Shared Python engine used by the Web Worker (normal case) and by the
// main-thread fallback (if a browser blocks workers). It loads Pyodide,
// installs our test harness, and exposes run/test calls.
import harnessSource from './harness.py?raw';

export function createPythonEngine(loadPyodide, indexURL) {
  let ready = null;

  function init() {
    if (!ready) {
      ready = (async () => {
        // Our bundled copy ships the stdlib archive as .txt because some hosts
        // won't serve .zip files; the CDN copy keeps the original name.
        const local = !indexURL.includes('cdn.jsdelivr.net');
        const py = await loadPyodide(local ? { indexURL, stdLibURL: await stdlibFromBase64(indexURL) } : { indexURL });
        py.runPython(harnessSource);
        return py;
      })();
    }
    return ready;
  }

  function call(fnName, ...args) {
    return init().then((py) => {
      const fn = py.globals.get(fnName);
      const pyArgs = args.map((a) => py.toPy(a));
      const result = fn(...pyArgs);
      const js = result.toJs({ dict_converter: Object.fromEntries });
      result.destroy();
      pyArgs.forEach((a) => a.destroy && a.destroy());
      fn.destroy();
      return js;
    });
  }

  return {
    init,
    run: ({ code, stdin = [], prelude = '' }) => call('run_program', code, stdin, prelude),
    test: ({ code, tests, stdin = [], prelude = '' }) =>
      call('run_tests', code, tests.map((t) => ({ name: t.name, code: t.code })), stdin, prelude),
  };
}

// Fetches the base64 copy of the standard library archive and returns a blob:
// URL for it, falling back to the plain .zip if the text copy is missing.
async function stdlibFromBase64(indexURL) {
  try {
    const res = await fetch(indexURL + 'python_stdlib.b64.txt');
    if (!res.ok) throw new Error(res.status);
    const bin = atob((await res.text()).trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
  } catch {
    return indexURL + 'python_stdlib.zip';
  }
}
