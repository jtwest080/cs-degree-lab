import React, { useMemo, useState } from 'react';
import Markdown from './Markdown.jsx';
import { glossary } from '../lib/content.js';
import { href } from '../lib/router.js';

export default function Glossary({ initialQuery = '' }) {
  const [q, setQ] = useState(initialQuery);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return glossary;
    // Matches in the term itself rank above matches in the definition.
    const inTerm = glossary.filter((t) => t.term.toLowerCase().includes(needle));
    const inDef = glossary.filter((t) => !inTerm.includes(t) && t.definition.toLowerCase().includes(needle));
    return [...inTerm, ...inDef];
  }, [q]);

  return (
    <div className="page narrow">
      <h1>Glossary</h1>
      <p className="muted">{glossary.length} terms so far, each linked to the lesson that introduces it.</p>
      <input
        className="search"
        type="search"
        placeholder="Search terms and definitions…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <dl className="glossary">
        {results.map((t) => (
          <div key={t.term} className="gloss-item">
            <dt>{t.term}</dt>
            <dd>
              <Markdown text={t.definition} inline />
              {t.lessonNumber && (
                <a className="gloss-link" href={href.lesson(t.lesson)}> Lesson {t.lessonNumber}</a>
              )}
            </dd>
          </div>
        ))}
        {results.length === 0 && <p>No terms match “{q}”.</p>}
      </dl>
    </div>
  );
}
