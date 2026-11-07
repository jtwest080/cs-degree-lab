import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentUnit } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { onPythonStatus, preloadPython, runCode } from '../lib/runner.js';
import { getState, update } from '../lib/progress.js';
import { useDarkMode } from '../lib/useDarkMode.js';

const LANGS = { python: () => python(), javascript: () => javascript(), c: () => cpp() };

/** Shows "Loading Python…" while the runtime downloads the first time. */
export function PythonStatus() {
  const [status, setStatus] = useState('idle');
  useEffect(() => onPythonStatus(setStatus), []);
  if (status === 'loading') return <span className="py-status">Loading Python (first time takes a few seconds)…</span>;
  if (status === 'error') return <span className="py-status error">Python failed to load. Check your connection and reload.</span>;
  return null;
}

/**
 * A code editor with a Run button and an output panel.
 *
 * Props:
 *  - storageKey: where to remember the learner's code between visits
 *  - initialCode: starting code (also used by "Reset")
 *  - language: 'python' | 'javascript'
 *  - prelude: hidden code that runs first (e.g. helper functions for an exercise)
 *  - defaultStdin: pre-filled input lines for programs that call input()
 *  - extraButtons: render-prop (code) => buttons placed beside Run (e.g. "Check")
 *  - onCodeChange: called with the latest code
 *  - resultSlot: extra content shown under the output (e.g. test results)
 */
export default function CodeEditor({
  storageKey,
  initialCode = '',
  language = 'python',
  prelude = '',
  defaultStdin = '',
  showStdin = false,
  extraButtons,
  onCodeChange,
  resultSlot,
  minHeight = '140px',
}) {
  const dark = useDarkMode();
  const saved = storageKey ? getState().code[storageKey] : undefined;
  const [code, setCode] = useState(saved ?? initialCode);
  const [stdin, setStdin] = useState(defaultStdin);
  const [stdinOpen, setStdinOpen] = useState(showStdin || Boolean(defaultStdin));
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (language === 'python') preloadPython();
  }, [language]);

  useEffect(() => {
    onCodeChange?.(code);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const extensions = useMemo(
    () => [LANGS[language]?.() ?? python(), indentUnit.of('    '), EditorView.lineWrapping],
    [language]
  );

  const handleChange = (value) => {
    setCode(value);
    if (storageKey) update((s) => { s.code[storageKey] = value; });
  };

  const run = async () => {
    setRunning(true);
    setResult(null);
    const lines = stdin === '' ? [] : stdin.replace(/\n$/, '').split('\n');
    const r = await runCode(language, { code, stdin: lines, prelude });
    setResult(r);
    setRunning(false);
  };

  const reset = () => {
    if (code !== initialCode && !window.confirm('Reset the editor to the starting code? Your changes will be lost.')) return;
    handleChange(initialCode);
    setResult(null);
  };

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <span className="lang-tag">{language === 'javascript' ? 'JavaScript' : language === 'c' ? 'C' : 'Python'}</span>
        <PythonStatus />
        <span className="spacer" />
        {language === 'python' && (
          <button className="btn-ghost small" onClick={() => setStdinOpen(!stdinOpen)} title="Provide lines for input()">
            {stdinOpen ? 'Hide input' : 'Input'}
          </button>
        )}
        <button className="btn-ghost small" onClick={reset}>Reset</button>
      </div>
      <CodeMirror
        value={code}
        onChange={handleChange}
        extensions={extensions}
        theme={dark ? oneDark : 'light'}
        minHeight={minHeight}
        basicSetup={{ foldGutter: false, highlightActiveLine: true, autocompletion: false }}
        aria-label="Code editor"
      />
      {stdinOpen && (
        <div className="stdin">
          <label>
            Input for <code>input()</code>, one line per call:
            <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} spellCheck={false} />
          </label>
        </div>
      )}
      <div className="editor-actions">
        <button className="btn" onClick={run} disabled={running}>
          {running ? 'Running…' : '▶ Run'}
        </button>
        {extraButtons?.(code)}
      </div>
      {result && (
        <div className="output" aria-live="polite">
          <div className="output-label">Output</div>
          {result.output ? <pre>{result.output}</pre> : !result.error && <pre className="muted">(no output)</pre>}
          {result.error && <pre className="error-text">{result.error}</pre>}
        </div>
      )}
      {resultSlot}
    </div>
  );
}
