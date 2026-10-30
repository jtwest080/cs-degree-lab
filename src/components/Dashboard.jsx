import React, { useState } from 'react';
import Markdown from './Markdown.jsx';
import { courseIntro, units } from '../lib/content.js';
import { href } from '../lib/router.js';
import {
  isLessonUnlocked, isProjectUnlocked, lessonProgress, nextLesson, overallStats, streak, unitStats, useProgress,
} from '../lib/progress.js';
import { dueCards } from '../lib/srs.js';

function ProgressBar({ value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function UnitCard({ unit, progress, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const st = unitStats(progress, unit);
  const complete = unit.available && st.done === st.total;
  return (
    <section className={`unit card ${unit.available ? '' : 'planned'} ${complete ? 'complete' : ''}`}>
      <button className="unit-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="unit-num">{unit.number}</span>
        <span className="unit-title">
          <strong>{unit.title}</strong>
          <span className="muted small">
            {unit.available
              ? `${st.done}/${st.total} lessons mastered${unit.project ? (st.projectDone ? ' · project done' : ' · project') : ''}`
              : 'Coming in a later phase'}
          </span>
        </span>
        {unit.available && <ProgressBar value={st.done} total={st.total} />}
        <span className="chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="unit-body">
          <Markdown text={unit.summary} />
          {unit.available ? (
            <ol className="lesson-list">
              {unit.lessons.map((l) => {
                const lp = lessonProgress(progress, l.id);
                const unlocked = isLessonUnlocked(progress, l.id);
                const solved = Object.values(lp.exercises).filter((e) => e.passed).length;
                return (
                  <li key={l.id} className={lp.quizPassed ? 'passed' : unlocked ? 'open' : 'locked'}>
                    <span className="status" aria-hidden="true">{lp.quizPassed ? '✓' : unlocked ? '▶' : '🔒'}</span>
                    {unlocked ? <a href={href.lesson(l.id)}>{l.number} {l.title}</a> : <span>{l.number} {l.title}</span>}
                    <span className="muted small">
                      {solved}/{l.exercises.length} exercises
                      {lp.quizBest ? ` · quiz best ${Math.round(lp.quizBest * 100)}%` : ''}
                    </span>
                  </li>
                );
              })}
              {unit.project && (
                <li className={st.projectDone ? 'passed' : isProjectUnlocked(progress, unit) ? 'open' : 'locked'}>
                  <span className="status" aria-hidden="true">{st.projectDone ? '★' : isProjectUnlocked(progress, unit) ? '▶' : '🔒'}</span>
                  {isProjectUnlocked(progress, unit)
                    ? <a href={href.project(unit.number)}>Project: {unit.project.title}</a>
                    : <span>Project: {unit.project.title}</span>}
                  <span className="muted small">unlocks after every lesson in the unit</span>
                </li>
              )}
            </ol>
          ) : (
            <ul className="topics">{unit.topics?.map((t, i) => <li key={i}>{t}</li>)}</ul>
          )}
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const progress = useProgress();
  const stats = overallStats(progress);
  const next = nextLesson(progress);
  const due = dueCards(progress).length;
  const days = streak(progress);
  const started = stats.lessonsDone > 0 || Object.keys(progress.lessons).length > 0;
  const currentUnit = next ? next.unitNumber : 1;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>{started ? 'Welcome back.' : 'Learn computer science, from zero to a full degree.'}</h1>
          {!started && <Markdown text={courseIntro} />}
          <div className="hero-actions">
            {next && (
              <a className="btn btn-primary big" href={href.lesson(next.id)}>
                {started ? 'Continue' : 'Start'}: {next.number} {next.title} →
              </a>
            )}
            {due > 0 && <a className="btn big" href={href.review()}>Review {due} due card{due > 1 ? 's' : ''}</a>}
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="stat"><div className="stat-num">{stats.lessonsDone}<span>/{stats.lessonsTotal}</span></div><div className="stat-label">lessons mastered</div></div>
        <div className="stat"><div className="stat-num">{stats.exercisesDone}<span>/{stats.exercisesTotal}</span></div><div className="stat-label">exercises solved</div></div>
        <div className="stat"><div className="stat-num">{stats.projectsDone}<span>/{stats.projectsTotal}</span></div><div className="stat-label">unit projects</div></div>
        <div className="stat"><div className="stat-num">{days}</div><div className="stat-label">day streak</div></div>
        <div className="stat"><div className="stat-num">{due}</div><div className="stat-label">reviews due</div></div>
      </section>

      <h2 className="section-title">Your degree: 18 units</h2>
      <div className="units">
        {units.map((u) => (
          <UnitCard key={u.number} unit={u} progress={progress} defaultOpen={u.number === currentUnit} />
        ))}
      </div>
    </div>
  );
}
