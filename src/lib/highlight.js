// Syntax highlighting for code shown in lesson text (not the editor).
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import c from 'highlight.js/lib/languages/c';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import x86asm from 'highlight.js/lib/languages/x86asm';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('c', c);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('asm', x86asm);
hljs.registerLanguage('text', plaintext);

export function highlight(code, lang) {
  const language = hljs.getLanguage(lang) ? lang : 'text';
  return hljs.highlight(code, { language }).value;
}
