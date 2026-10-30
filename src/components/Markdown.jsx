import React, { useMemo } from 'react';
import { Marked } from 'marked';
import { highlight } from '../lib/highlight.js';

// Lesson text is written in Markdown. Code fences are syntax highlighted, and
// blockquotes that start with **Tip**, **Note**, **Warning** or **Analogy**
// become coloured callout boxes.
const marked = new Marked({
  gfm: true,
  renderer: {
    code(code, lang) {
      const language = (lang || 'text').split(/\s/)[0];
      return `<pre class="code-block"><code class="hljs language-${language}">${highlight(code, language)}</code></pre>`;
    },
    blockquote(quote) {
      const m = quote.match(/^<p><strong>(Tip|Note|Warning|Analogy|Why|Key idea|Deep dive)\b/i);
      const kind = m ? m[1].toLowerCase().replace(/\s+/g, '-') : 'note';
      return `<blockquote class="callout callout-${kind}">${quote}</blockquote>`;
    },
  },
});

export default function Markdown({ text, inline = false, className = '' }) {
  const html = useMemo(
    () => (inline ? marked.parseInline(text || '') : marked.parse(text || '')),
    [text, inline]
  );
  const Tag = inline ? 'span' : 'div';
  return <Tag className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
