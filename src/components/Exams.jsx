import React, { useEffect, useRef, useState } from 'react';
import { MultipleChoice } from './Quiz.jsx';
import { href } from '../lib/router.js';
import { logActivity, update, useProgress } from '../lib/progress.js';
import { cardsForLesson, shuffle } from '../lib/srs.js';
import { lessonById, units } from '../lib/content.js';

const PRESETS = [
  { id: 'quick', label: 'Quick quiz', count: 15, blurb: '15 questions, 22 minutes' },
  { id: 'midterm', label: 'Midterm', count: 30, blurb: '30 questions, 45 minutes' },
  { id: 'final', label: 'Final exam', count: 50, blurb: '50 questions, 75 minutes' },
];
const SECONDS_PER_QUESTION = 90;

const fmt = (s) => {
  const m = Math.floor(Math.max(0, s) / 60);
  return `${m}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
};

/** Pick `count` questions spread evenly across the chosen units. */
function buildExam(unitNumbers, count) {
  const pools = unitNumbers.map((n) => {
    const u = units.find((x) => x.number === n);
    return shuffle(u.lessons.flatMap(cardsForLesson));
  });
  const picked = [];
  let round = 0;
  while (picked.length < count && pools.some((p) => p.length > round)) {
    for (const p of pools) {
      if (p[round] && picked.length < count) picked.push(p[round]);
    }
    round++;
  }
  return shuffle(picked);
}

/**
 * Timed exams. Questions come from the lesson quizzes of the units you pick,
 * mixed together. No feedback until you submit, and the clock auto-submits.
 */
export default function Exams() {
  const progress = useProgress();
  const available = units.filter((u) => u.available);
  const studied = available.filter((u) => u.lessons.some((l) => progress.lessons[l.id]?.quizPassed));
  const [chosen, setChosen] = useState(() => new Set(studied.map((u) => u.number)));
  const [preset, setPreset] = useState('midterm');
  const [exam, setExam] = useState(null); // { questions, answers, endAt, total, title }
  const [result, setResult] = useState(null);
  const [now, setNow] = useState(Date.now());
  const submitted = useRef(false);

  const toggle = (n) => {
    const next = new Set(chosen);
    if (next.has(n)) next.delete(n); else next.add(n);
    setChosen(next);
  };

  const start = (overrideUnits) => {
    const nums = overrideUnits || [...chosen].sort((a, b) => a - b);
    const p = PRESETS.find((x) => x.id === preset);
    const questions = buildExam(nums, p.count);
    if (questions.length === 0) return;
    const total = questions.length * SECONDS_PER_QUESTION;
    submitted.current = false;
    setResult(null);
    setExam({ questions, answers: {}, endAt: Date.now() + total * 1000, total, title: p.label, units: nums });
    setNow(Date.now());
    window.scrollTo(0, 0);
  };

  const submit = (auto) => {
    if (!exam || submitted.current) return;
    submitted.current = true;
    const byUnit = {};
    let score = 0;
    exam.questions.forEach((q, i) => {
      const unit = lessonById[q.lessonId]?.unitNumber;
      byUnit[unit] ||= { right: 0, total: 0 };
      byUnit[unit].total++;
      if (exam.answers[i] === q.answer) {
        score++;
        byUnit[unit].right++;
      }
    });
    const used = Math.min(exam.total, Math.round((Date.now() - (exam.endAt - exam.total * 1000)) / 1000));
    const record = { date: Date.now(), title: exam.title, score, total: exam.questions.length, seconds: used, byUnit, auto: !!auto };
    update((s) => {
      s.exams = [record, ...(s.exams || [])].slice(0, 30);
      logActivity(s);
    });
    setResult({ ...record, exam });
    setExam(null);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (!exam) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [exam]);

  const left = exam ? Math.ceil((exam.endAt - now) / 1000) : 0;
  useEffect(() => {
    if (exam && left <= 0) submit(true);
  }, [exam, left]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Taking an exam ----
  if (exam) {
    const answered = Object.keys(exam.answers).length;
    return (
      <div className="page narrow">
        <div className={`exam-bar ${left < 120 ? 'low' : ''}`} role="timer" aria-live="off">
          <strong>{exam.title}</strong>
          <span>{answered} / {exam.questions.length} answered</span>
          <span className="exam-clock">{fmt(left)}</span>
        </div>
        {exam.questions.map((q, i) => (
          <div className="card exam-q" key={q.cardId}>
            <div className="muted small">Question {i + 1}</div>
            <MultipleChoice q={q} name={`exam-${i}`} value={exam.answers[i]} graded={false}
              onChange={(v) => setExam({ ...exam, answers: { ...exam.answers, [i]: v } })} />
          </div>
        ))}
        <div className="review-actions">
          <button className="btn btn-primary big" onClick={() => submit(false)}>
            Submit exam{answered < exam.questions.length ? ` (${exam.questions.length - answered} unanswered)` : ''}
          </button>
          <button className="btn-ghost" onClick={() => { if (window.confirm('Leave without submitting? This attempt will not be saved.')) { submitted.current = true; setExam(null); } }}>
            Abandon
          </button>
        </div>
      </div>
    );
  }

  // ---- Results ----
  if (result) {
    const pct = Math.round((100 * result.score) / result.total);
    const rows = Object.entries(result.byUnit)
      .map(([n, r]) => ({ n: Number(n), ...r, pct: Math.round((100 * r.right) / r.total) }))
      .sort((a, b) => a.pct - b.pct);
    const weak = rows.filter((r) => r.pct < 70).map((r) => r.n);
    return (
      <div className="page narrow">
        <h1>{result.title} results</h1>
        <p className="big-num">{result.score} / {result.total} ({pct}%)</p>
        <p>
          {pct >= 90 ? 'Excellent. You really know this material.' : pct >= 70 ? 'A solid pass.' : 'Not there yet. That is what exams are for: the weak units below tell you where to study.'}
          {' '}Time used: {fmt(result.seconds)}{result.auto ? ' (time ran out)' : ''}.
        </p>
        <h2>By unit</h2>
        <div className="card">
          {rows.map((r) => (
            <div className="exam-unit" key={r.n}>
              <span>Unit {r.n}: {units.find((u) => u.number === r.n)?.title}</span>
              <span className="exam-meter" aria-hidden="true"><span style={{ width: `${r.pct}%` }} /></span>
              <span>{r.right}/{r.total}</span>
            </div>
          ))}
        </div>
        <div className="review-actions">
          <button className="btn btn-primary" onClick={() => start(result.exam.units)}>Retake with new questions</button>
          {weak.length > 0 && <button className="btn" onClick={() => start(weak)}>Drill weak units ({weak.join(', ')})</button>}
          <button className="btn-ghost" onClick={() => setResult(null)}>Back to exams</button>
        </div>
        <h2>Your answers</h2>
        {result.exam.questions.map((q, i) => (
          <div className="card exam-q" key={q.cardId}>
            <div className="muted small">Question {i + 1} · <a href={href.lesson(q.lessonId)}>{lessonById[q.lessonId]?.title}</a></div>
            <MultipleChoice q={q} name={`done-${i}`} value={result.exam.answers[i]} graded onChange={() => {}} />
          </div>
        ))}
      </div>
    );
  }

  // ---- Setup ----
  const history = progress.exams || [];
  const total = [...chosen].reduce((n, k) => n + units.find((u) => u.number === k).lessons.flatMap(cardsForLesson).length, 0);
  const p = PRESETS.find((x) => x.id === preset);
  return (
    <div className="page narrow">
      <h1>Exams</h1>
      <p>
        Practice under real conditions: questions from many units mixed together, a countdown clock and no feedback
        until you submit. Exams that mix topics are harder than lesson quizzes, because you must recognize which idea
        a question is about. That is exactly the skill that sticks.
      </p>
      <div className="card">
        <h2>1. Choose a format</h2>
        <div className="exam-presets">
          {PRESETS.map((x) => (
            <label key={x.id} className={`option ${preset === x.id ? 'selected' : ''}`}>
              <input type="radio" name="preset" checked={preset === x.id} onChange={() => setPreset(x.id)} />
              <span><strong>{x.label}</strong> <span className="muted">{x.blurb}</span></span>
            </label>
          ))}
        </div>
        <h2>2. Choose what is covered</h2>
        <p className="small">
          <button className="btn" onClick={() => setChosen(new Set(studied.map((u) => u.number)))}>Units I have studied</button>{' '}
          <button className="btn" onClick={() => setChosen(new Set(available.map((u) => u.number)))}>Everything</button>{' '}
          <button className="btn" onClick={() => setChosen(new Set())}>Clear</button>
        </p>
        <div className="exam-units">
          {available.map((u) => (
            <label key={u.number} className="exam-unit-pick">
              <input type="checkbox" checked={chosen.has(u.number)} onChange={() => toggle(u.number)} />
              <span>Unit {u.number}: {u.title}</span>
            </label>
          ))}
        </div>
        <p>
          <button className="btn btn-primary big" disabled={chosen.size === 0} onClick={() => start()}>
            Start {p.label.toLowerCase()}
          </button>{' '}
          <span className="muted small">{chosen.size === 0 ? 'Pick at least one unit.' : `${Math.min(p.count, total)} questions from ${chosen.size} unit${chosen.size > 1 ? 's' : ''}.`}</span>
        </p>
      </div>
      {history.length > 0 && (
        <>
          <h2>Past attempts</h2>
          <div className="card">
            {history.map((h) => (
              <div className="exam-unit" key={h.date}>
                <span>{new Date(h.date).toLocaleDateString()} · {h.title}</span>
                <span>{h.score}/{h.total} ({Math.round((100 * h.score) / h.total)}%)</span>
                <span className="muted">{fmt(h.seconds)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
