import React, { useState } from 'react';
import CodeEditor from './CodeEditor.jsx';
import Markdown from './Markdown.jsx';
import TestResults from './TestResults.jsx';
import CodeBlock from './CodeBlock.jsx';
import { testCode } from '../lib/runner.js';
import { logActivity, update, useProgress } from '../lib/progress.js';

const LEVELS = ['', 'Warm-up', 'Practice', 'Challenge', 'Stretch', 'Boss'];

/** Normalise input lines from YAML (string with newlines, list, or missing). */
export function toLines(v) {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v).replace(/\n$/, '').split('\n');
}

/**
 * One practice exercise: prompt, editor, automatic tests, hints revealed one
 * at a time, and a solution that unlocks only after the learner has tried.
 */
export default function Exercise({ lesson, exercise, index, language }) {
  const progress = useProgress();
  const state = progress.lessons[lesson.id]?.exercises?.[exercise.id] || {};
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const hintsShown = state.hintsShown || 0;
  const triedEnough = (state.attempts || 0) >= 1;

  const save = (fn) =>
    update((s) => {
      const l = (s.lessons[lesson.id] ||= { quizBest: 0, quizPassed: false, exercises: {} });
      const e = (l.exercises[exercise.id] ||= { attempts: 0, hintsShown: 0, passed: false });
      fn(e, s);
    });

  const check = async (code) => {
    setChecking(true);
    const r = await testCode(language, {
      code,
      tests: exercise.tests,
      stdin: toLines(exercise.testInput),
      prelude: exercise.prelude ?? lesson.prelude ?? '',
    });
    setResult(r);
    setChecking(false);
    const allPassed = r.results.length > 0 && r.results.every((t) => t.passed);
    save((e, s) => {
      e.attempts += 1;
      if (allPassed && !e.passed) {
        e.passed = true;
        logActivity(s);
      }
    });
  };

  return (
    <article className={`exercise card ${state.passed ? 'done' : ''}`} id={`ex-${exercise.id}`}>
      <header className="exercise-head">
        <span className="ex-num">Exercise {index + 1}</span>
        <span className={`level level-${exercise.difficulty || 1}`}>{LEVELS[exercise.difficulty || 1]}</span>
        <h4>{exercise.title}</h4>
        {state.passed && <span className="done-tag">✓ Solved</span>}
      </header>
      <Markdown text={exercise.prompt} />
      <CodeEditor
        storageKey={`${lesson.id}/ex/${exercise.id}`}
        initialCode={exercise.starter || ''}
        language={language}
        prelude={exercise.prelude ?? lesson.prelude ?? ''}
        defaultStdin={toLines(exercise.stdin ?? exercise.testInput).join('\n')}
        extraButtons={(code) => (
          <button className="btn btn-primary" onClick={() => check(code)} disabled={checking}>
            {checking ? 'Checking…' : '✓ Check answer'}
          </button>
        )}
        resultSlot={<TestResults result={result} />}
      />

      <div className="help-row">
        {exercise.hints?.length > 0 && (
          <button
            className="btn-ghost"
            disabled={hintsShown >= exercise.hints.length}
            onClick={() => save((e) => { e.hintsShown = Math.min(e.hintsShown + 1, exercise.hints.length); })}
          >
            {hintsShown >= exercise.hints.length
              ? 'No more hints'
              : `💡 Show hint ${hintsShown + 1} of ${exercise.hints.length}`}
          </button>
        )}
        <button
          className="btn-ghost"
          disabled={!triedEnough}
          title={triedEnough ? '' : 'Check your answer at least once to unlock the solution'}
          onClick={() => setShowSolution(!showSolution)}
        >
          {triedEnough ? (showSolution ? 'Hide solution' : '🔓 Show solution') : '🔒 Solution (try first)'}
        </button>
      </div>

      {hintsShown > 0 && (
        <ol className="hints">
          {exercise.hints.slice(0, hintsShown).map((h, i) => (
            <li key={i}><Markdown text={h} inline /></li>
          ))}
        </ol>
      )}

      {showSolution && triedEnough && (
        <div className="solution">
          <h5>Solution</h5>
          <CodeBlock code={exercise.solution} language={language} />
          {exercise.explanation && <Markdown text={exercise.explanation} />}
        </div>
      )}
    </article>
  );
}
