import React from 'react';

export default function TestResults({ result }) {
  if (!result) return null;
  const passed = result.results.filter((r) => r.passed).length;
  const total = result.results.length;
  const all = passed === total;
  return (
    <div className={`tests ${all ? 'tests-pass' : 'tests-fail'}`} aria-live="polite">
      <div className="tests-head">
        {all ? '✓ All tests passed!' : `${passed} of ${total} tests passed`}
      </div>
      {result.error && <pre className="error-text">{result.error}</pre>}
      <ul>
        {result.results.map((r, i) => (
          <li key={i} className={r.passed ? 'pass' : 'fail'}>
            <span className="mark">{r.passed ? '✓' : '✗'}</span>
            <span>
              {r.name}
              {!r.passed && r.message && <pre className="test-msg">{r.message}</pre>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
