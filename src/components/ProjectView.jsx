import React, { useState } from 'react';
import Markdown from './Markdown.jsx';
import CodeEditor from './CodeEditor.jsx';
import CodeBlock from './CodeBlock.jsx';
import TestResults from './TestResults.jsx';
import { toLines } from './Exercise.jsx';
import { unitByNumber, units, useProject } from '../lib/content.js';
import { href } from '../lib/router.js';
import { testCode } from '../lib/runner.js';
import { isProjectUnlocked, logActivity, update, useProgress } from '../lib/progress.js';

/**
 * A unit project: a larger program that combines the unit's ideas. The
 * checklist mixes automatic items (ticked by tests) with self-check items
 * (good habits a test can't verify, like "I commented my code").
 */
export default function ProjectView({ unitNumber }) {
  const progress = useProgress();
  const unit = unitByNumber(unitNumber);
  const { project: full, error } = useProject(unitNumber);
  const project = full || unit?.project;
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  if (!project) return <div className="page narrow"><h1>Project not found</h1></div>;
  const language = project.language || unit.language || 'python';
  const ps = progress.projects[unitNumber] || { checklist: {}, attempts: 0 };

  if (!isProjectUnlocked(progress, unit)) {
    return (
      <div className="page narrow locked-page">
        <div className="lock-icon" aria-hidden="true">🔒</div>
        <h1>Unit {unit.number} project: {project.title}</h1>
        <p>Master every lesson in Unit {unit.number} (pass each quiz) to unlock this project.</p>
        <a className="btn" href={href.dashboard()}>Back to dashboard</a>
      </div>
    );
  }

  if (!full) {
    return (
      <div className="page narrow">
        <h1>Unit {unit.number} project: {project.title}</h1>
        {error
          ? <p>This project couldn't be loaded. Check your connection and <button className="btn" onClick={() => location.reload()}>try again</button>.</p>
          : <p className="muted">Loading project…</p>}
      </div>
    );
  }

  const passedTests = new Set(ps.passedTests || []);
  const manualItems = project.checklist.filter((c) => !c.test);
  const allManual = manualItems.every((_, i) => ps.checklist[i]);

  const save = (fn) => update((s) => { fn((s.projects[unitNumber] ||= { checklist: {}, attempts: 0 }), s); });

  const check = async (code) => {
    setChecking(true);
    const r = await testCode(language, {
      code, tests: project.tests, stdin: toLines(project.testInput), prelude: project.prelude || '',
    });
    setResult(r);
    setChecking(false);
    save((p, s) => {
      p.attempts = (p.attempts || 0) + 1;
      p.passedTests = r.results.filter((t) => t.passed).map((t) => t.name);
      p.testsPassed = r.results.length > 0 && r.results.every((t) => t.passed);
      p.passed = p.testsPassed && manualItems.every((_, i) => p.checklist[i]);
      logActivity(s);
    });
  };

  const toggleManual = (i) =>
    save((p) => {
      p.checklist[i] = !p.checklist[i];
      p.passed = !!p.testsPassed && manualItems.every((_, j) => p.checklist[j]);
    });

  const nextUnit = units.find((u) => u.number === unit.number + 1);

  return (
    <div className="page project">
      <div className="eyebrow">Unit {unit.number} project</div>
      <h1>{project.title}</h1>
      {ps.passed && <span className="done-tag big">★ Project complete</span>}
      <Markdown text={project.brief} />

      {project.steps && (
        <section>
          <h2>Build it step by step</h2>
          <ol className="steps">
            {project.steps.map((s, i) => (
              <li key={i}><strong>{s.title}</strong><Markdown text={s.body} /></li>
            ))}
          </ol>
        </section>
      )}

      <section className="card checklist">
        <h2>Checklist</h2>
        <ul>
          {(() => {
            let manualIndex = -1;
            return project.checklist.map((c, i) => {
              if (c.test) {
                const ok = passedTests.has(c.test);
                return (
                  <li key={i} className={ok ? 'ok' : ''}>
                    <span className="mark">{ok ? '✓' : '○'}</span> {c.text} <span className="muted small">(checked by tests)</span>
                  </li>
                );
              }
              manualIndex += 1;
              const mi = manualIndex;
              return (
                <li key={i}>
                  <label className="check">
                    <input type="checkbox" checked={!!ps.checklist[mi]} onChange={() => toggleManual(mi)} /> {c.text}
                    <span className="muted small"> (self-check)</span>
                  </label>
                </li>
              );
            });
          })()}
        </ul>
        {ps.testsPassed && !allManual && <p className="muted">All tests pass. Tick the self-check items once you're honestly happy with them.</p>}
      </section>

      <section>
        <h2>Your code</h2>
        <CodeEditor
          storageKey={`project-${unitNumber}`}
          initialCode={project.starter}
          language={language}
          prelude={project.prelude || ''}
          defaultStdin={toLines(project.stdin ?? project.testInput).join('\n')}
          minHeight="320px"
          extraButtons={(code) => (
            <button className="btn btn-primary" onClick={() => check(code)} disabled={checking}>
              {checking ? 'Running tests…' : '✓ Run project tests'}
            </button>
          )}
          resultSlot={<TestResults result={result} />}
        />
      </section>

      {project.stretch && (
        <section className="card">
          <h2>Stretch goals</h2>
          <p className="muted">Optional, untested, and the best way to make this project your own.</p>
          <ul>{project.stretch.map((s, i) => <li key={i}><Markdown text={s} inline /></li>)}</ul>
        </section>
      )}

      {project.solution && (
        <section>
          <button className="btn-ghost" disabled={!ps.testsPassed && (ps.attempts || 0) < 3} onClick={() => setShowSolution(!showSolution)}>
            {ps.testsPassed || (ps.attempts || 0) >= 3
              ? showSolution ? 'Hide reference solution' : '🔓 Compare with a reference solution'
              : '🔒 Reference solution (unlocks after the tests pass or 3 attempts)'}
          </button>
          {showSolution && <CodeBlock code={project.solution} language={language} />}
        </section>
      )}

      <nav className="lesson-nav">
        <a className="btn" href={href.dashboard()}>← Dashboard</a>
        {nextUnit?.available && nextUnit.lessons[0] && (
          <a className="btn btn-primary" href={href.lesson(nextUnit.lessons[0].id)}>Start Unit {nextUnit.number} →</a>
        )}
      </nav>
    </div>
  );
}
