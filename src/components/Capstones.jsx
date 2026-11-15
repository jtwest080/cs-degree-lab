import React from 'react';
import Markdown from './Markdown.jsx';
import capstones from '../../content/capstones.yaml';
import { href } from '../lib/router.js';
import { isUnitComplete, logActivity, update, useProgress } from '../lib/progress.js';
import { unitByNumber } from '../lib/content.js';

const LEVEL_NAMES = ['Not yet', 'Developing', 'Solid', 'Excellent'];
export const PASS_PERCENT = 75;

/** Percentage score from the chosen levels (0-3) weighted by each criterion. */
export function capstoneScore(project, scores = {}) {
  let got = 0;
  let max = 0;
  project.rubric.forEach((r, i) => {
    max += r.weight * 3;
    got += r.weight * (scores[i] ?? 0);
  });
  return max ? Math.round((got / max) * 100) : 0;
}

function isGraded(project, entry) {
  return project.rubric.every((_, i) => entry?.scores?.[i] !== undefined);
}

function unitReady(s, n) {
  const u = unitByNumber(n);
  return !u || !u.available || isUnitComplete(s, u);
}

export function CapstoneList() {
  const progress = useProgress();
  return (
    <div className="page narrow">
      <h1>Capstone projects</h1>
      <p className="muted">{capstones.intro}</p>
      {capstones.projects.map((p) => {
        const entry = progress.capstones?.[p.id];
        const graded = isGraded(p, entry);
        const score = capstoneScore(p, entry?.scores);
        const ready = unitReady(progress, p.after);
        return (
          <a key={p.id} className="card cap-card" href={href.capstone(p.id)}>
            <div className="cap-head">
              <h3>{p.title}</h3>
              {graded && (
                <span className={`badge ${score >= PASS_PERCENT ? 'badge-done' : ''}`}>
                  {score >= PASS_PERCENT ? 'Passed' : 'Try again'} · {score}%
                </span>
              )}
            </div>
            <p>{p.summary}</p>
            <p className="muted small">
              About {p.hours} hours · best after Unit {p.after}{ready ? '' : ' (not finished yet)'}
            </p>
          </a>
        );
      })}
    </div>
  );
}

export function CapstoneView({ id }) {
  const progress = useProgress();
  const p = capstones.projects.find((x) => x.id === id);
  if (!p) {
    return (
      <div className="page narrow">
        <p>That capstone does not exist.</p>
        <a href={href.capstones()}>Back to the capstones</a>
      </div>
    );
  }
  const entry = progress.capstones?.[p.id] || {};
  const score = capstoneScore(p, entry.scores);
  const graded = isGraded(p, entry);
  const ready = unitReady(progress, p.after);

  const setLevel = (i, level) =>
    update((s) => {
      s.capstones ||= {};
      const e = (s.capstones[p.id] ||= { scores: {}, notes: '' });
      e.scores[i] = level;
      if (p.rubric.every((_, k) => e.scores[k] !== undefined) && capstoneScore(p, e.scores) >= PASS_PERCENT && !e.passedAt) {
        e.passedAt = new Date().toISOString();
        logActivity(s);
      }
    });
  const setNotes = (text) =>
    update((s) => {
      s.capstones ||= {};
      (s.capstones[p.id] ||= { scores: {}, notes: '' }).notes = text;
    });

  return (
    <div className="page narrow">
      <p><a href={href.capstones()}>← All capstones</a></p>
      <h1>{p.title}</h1>
      <p className="muted">
        About {p.hours} hours · best after Unit {p.after}
        {ready ? '' : ' (you have not finished it yet, but you can still read the brief)'}
      </p>
      <Markdown text={p.brief} />
      <h2>What to hand in (to yourself)</h2>
      <ul>{p.deliverables.map((d) => <li key={d}><Markdown text={d} inline /></li>)}</ul>

      <h2>Grade yourself</h2>
      <p className="muted">
        Be honest and strict: nobody else sees this. For each row pick the description that matches
        your work best. Scoring {PASS_PERCENT}% or more passes; if you are below, the lowest rows tell you what to improve next.
      </p>
      {p.rubric.map((r, i) => (
        <fieldset key={r.criterion} className="rubric-row">
          <legend>{r.criterion} <span className="muted small">(weight {r.weight})</span></legend>
          {r.levels.map((text, level) => (
            <label key={level} className={`rubric-opt ${entry.scores?.[i] === level ? 'chosen' : ''}`}>
              <input
                type="radio"
                name={`${p.id}-${i}`}
                checked={entry.scores?.[i] === level}
                onChange={() => setLevel(i, level)}
              />
              <span><strong>{LEVEL_NAMES[level]}.</strong> {text}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <div className={`card cap-score ${graded && score >= PASS_PERCENT ? 'pass' : ''}`} role="status">
        <strong>Score: {score}%</strong>{' '}
        {!graded ? '(grade every row to finish)' : score >= PASS_PERCENT ? '· Passed. Well done!' : `· ${PASS_PERCENT - score} points to go. Improve your weakest rows and grade again.`}
      </div>

      <h2>Notes and reflection</h2>
      <label htmlFor="cap-notes" className="muted small">
        Where is your work? What went well? What would you do differently?
      </label>
      <textarea
        id="cap-notes"
        className="cap-notes"
        rows={6}
        value={entry.notes || ''}
        onChange={(e) => setNotes(e.target.value)}
      />
      <h3>Stretch goal</h3>
      <p>{p.stretch}</p>
    </div>
  );
}
