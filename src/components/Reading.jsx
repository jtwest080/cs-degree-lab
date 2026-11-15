import React, { useState } from 'react';
import reading from '../../content/reading.yaml';
import { update, useProgress } from '../lib/progress.js';
import { isUnitComplete } from '../lib/progress.js';
import { unitByNumber } from '../lib/content.js';

const KINDS = ['all', 'book', 'paper', 'article', 'course', 'tool'];

export default function Reading() {
  const progress = useProgress();
  const [kind, setKind] = useState('all');
  const [hideRead, setHideRead] = useState(false);
  const read = progress.reading || {};
  const items = reading.items
    .filter((r) => kind === 'all' || r.kind === kind)
    .filter((r) => !(hideRead && read[r.id]))
    .sort((a, b) => a.after - b.after);
  const total = reading.items.length;
  const done = reading.items.filter((r) => read[r.id]).length;

  const toggle = (id) =>
    update((s) => {
      s.reading ||= {};
      if (s.reading[id]) delete s.reading[id];
      else s.reading[id] = new Date().toISOString();
    });

  return (
    <div className="page narrow">
      <h1>Reading list</h1>
      <p className="muted">{reading.intro}</p>
      <p><strong>{done}</strong> of {total} read.</p>
      <div className="read-filters">
        {KINDS.map((k) => (
          <button key={k} className={`btn ${kind === k ? 'btn-primary' : ''}`} onClick={() => setKind(k)}>
            {k === 'all' ? 'All' : k[0].toUpperCase() + k.slice(1) + 's'}
          </button>
        ))}
        <label className="read-hide">
          <input type="checkbox" checked={hideRead} onChange={(e) => setHideRead(e.target.checked)} /> Hide read
        </label>
      </div>
      {items.map((r) => {
        const u = unitByNumber(r.after);
        const ready = !u || !u.available || isUnitComplete(progress, u);
        return (
          <div key={r.id} className={`card read-item ${read[r.id] ? 'is-read' : ''}`}>
            <label className="read-check">
              <input type="checkbox" checked={!!read[r.id]} onChange={() => toggle(r.id)} />
              <span className="visually-hidden">Mark “{r.title}” as read</span>
            </label>
            <div>
              <h3>
                {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> : r.title}
              </h3>
              <p className="muted small">
                {r.author} · {r.kind} · {r.free ? 'free online' : 'not free (try a library)'} · after Unit {r.after}{ready ? '' : ' (not finished yet)'}
              </p>
              <p>{r.why}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
