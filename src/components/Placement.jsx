import React, { useState } from 'react';
import placement from '../../content/placement.yaml';
import { MultipleChoice } from './Quiz.jsx';
import { href } from '../lib/router.js';
import { loadLesson, lessonById } from '../lib/content.js';
import { PASS_MARK, lessonProgress, logActivity, update, useProgress } from '../lib/progress.js';
import { enrollLesson } from '../lib/srs.js';

const PASS = placement.passMark ?? PASS_MARK;

/** Lessons of a test that exist in this build and are not mastered yet. */
function pending(progress, test) {
  return test.skips.filter((id) => lessonById[id] && !lessonProgress(progress, id).quizPassed);
}

/**
 * Placement checks. A short quiz on material you may already know: pass it
 * and its lessons count as mastered (and join your review deck so that you
 * still refresh the facts). Miss it and you get pointers to what to study.
 */
export default function Placement() {
  const progress = useProgress();
  const [active, setActive] = useState(null); // { test, answers, result }

  const finish = (test, answers) => {
    const missed = [];
    let correct = 0;
    test.questions.forEach((q, i) => (answers[i] === q.answer ? correct++ : missed.push(i)));
    const score = correct / test.questions.length;
    const passed = score >= PASS;
    setActive({ test, answers, result: { score, correct, missed, passed } });
    if (passed) {
      const ids = pending(progress, test);
      update((s) => {
        for (const id of ids) {
          const l = (s.lessons[id] ||= { quizBest: 0, quizPassed: false, exercises: {} });
          l.quizPassed = true;
          l.placed = true;
          l.completedAt = Date.now();
        }
        s.placement = { ...(s.placement || {}), [test.id]: { score, at: Date.now() } };
        logActivity(s);
      });
      // Put the lessons' questions into the review deck so they are refreshed later.
      Promise.all(ids.map((id) => loadLesson(id).catch(() => null))).then((lessons) =>
        update((s) => lessons.filter(Boolean).forEach((lesson) => enrollLesson(s, lesson)))
      );
    } else {
      update((s) => {
        s.placement = { ...(s.placement || {}), [test.id]: { score, at: Date.now(), passed: false } };
      });
    }
  };

  if (!active) {
    return (
      <div className="page narrow">
        <h1>Placement checks</h1>
        <p>
          Already know some of this? Take a short check. Score {Math.round(PASS * 100)}% or more and the lessons it
          covers count as mastered, so you can move on. Their questions still join your Review deck, so the facts
          get refreshed. If you miss, you will see exactly which lessons to read. You are never locked out of any lesson.
        </p>
        {placement.tests.map((test) => {
          const left = pending(progress, test);
          const done = left.length === 0;
          const last = progress.placement?.[test.id];
          return (
            <div key={test.id} className="card review-start">
              <h2>{test.title}</h2>
              <p>{test.intro}</p>
              <p className="muted small">
                {test.questions.length} questions · skips {test.skips.filter((id) => lessonById[id]).length} lessons
                {last && !done ? ` · last try ${Math.round(last.score * 100)}%` : ''}
              </p>
              {done ? (
                <p><strong>✓ All of these lessons are already mastered.</strong></p>
              ) : (
                <button className="btn btn-primary" onClick={() => setActive({ test, answers: {}, result: null })}>
                  Start the check
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const { test, answers, result } = active;
  const answeredAll = test.questions.every((_, i) => answers[i] !== undefined);
  return (
    <div className="page narrow">
      <h1>Placement: {test.title}</h1>
      <ol className="quiz-list">
        {test.questions.map((q, i) => (
          <li key={i} className="card quiz-q">
            <MultipleChoice
              q={q}
              name={`${test.id}-${i}`}
              value={answers[i]}
              graded={!!result}
              onChange={(v) => setActive({ ...active, answers: { ...answers, [i]: v } })}
            />
          </li>
        ))}
      </ol>
      {!result ? (
        <button className="btn btn-primary big" disabled={!answeredAll} onClick={() => finish(test, answers)}>
          {answeredAll ? 'Submit' : 'Answer every question to submit'}
        </button>
      ) : (
        <div className={`quiz-result ${result.passed ? 'pass' : 'fail'}`}>
          <div className="score">{Math.round(result.score * 100)}%</div>
          <div>
            <strong>
              {result.passed
                ? `Placed out. ${test.skips.filter((id) => lessonById[id]).length} lessons now count as mastered, and you can start the next one.`
                : `You got ${result.correct} of ${test.questions.length}. You need ${Math.round(PASS * 100)}% to place out.`}
            </strong>
            {!result.passed && (
              <ul>
                {[...new Set(result.missed.map((i) => test.questions[i].lesson))].map((id) => (
                  <li key={id}>
                    Study <a href={href.lesson(id)}>{lessonById[id]?.number} {lessonById[id]?.title}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="btn" onClick={() => setActive(null)}>Back to placement</button>{' '}
          <a className="btn btn-primary" href={href.dashboard()}>Dashboard</a>
        </div>
      )}
    </div>
  );
}
