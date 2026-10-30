import React from 'react';
import { highlight } from '../lib/highlight.js';

/** Read-only highlighted code with optional line numbers. */
export default function CodeBlock({ code, language = 'python', numbered = false }) {
  const lines = (code || '').replace(/\n$/, '').split('\n');
  if (!numbered) {
    return (
      <pre className="code-block">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlight(code || '', language) }} />
      </pre>
    );
  }
  return (
    <pre className="code-block numbered">
      <code className="hljs">
        {lines.map((line, i) => (
          <span className="code-line" key={i}>
            <span className="ln" aria-hidden="true">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: highlight(line, language) || ' ' }} />
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}
