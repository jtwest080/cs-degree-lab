import React, { useState } from 'react';
import Markdown from './Markdown.jsx';
import CodeEditor from './CodeEditor.jsx';
import TestResults from './TestResults.jsx';
import { toLines } from './Exercise.jsx';
import { testCode } from '../lib/runner.js';
import { PASS_MARK, logActivity, update, useProgress } from '../lib/progress.js';
import { enrollLesson } from '../lib/srs.js';

/** A multiple-choice question. Used by quizzes and by the review page. */
export function MultipleChoice({ q, name, value, onChange, graded }) {
  return (
    <div className="mcq">
      <Markdown text={q.question} />
      <div className="options" role="radiogroup">
        {q.options.map((opt, i) => {
          let cls = 'option';
          if (graded && i === q.answer) cls += ' correct';
          else if (graded && i === value) cls += ' wrong';
          else if (value === i) cls += ' selected';
          return (
            <label key={i} className={cls}>
              <input
                type="radio"
                name={name}
                checked={value === i}
                disabled={graded}
                onChange={() => onChange(i)}
              />
              <Markdown text={String(opt)} inline />
            </label>
          );
        })}
      </div>
      {graded && q.explanation && (
        <div className={`explain ${value === q.answer ? 'ok' : 'bad'}`}>
          <strong>{value === q.answer ? 'Correct. ' : 'Not quite. '}</strong>
          <Markdown text={q.explanation} inline />
        </div>
      )}
    </div>
  );
}

/**
 * End-of-lesson quiz. Passing (80%+) unlocks the next lesson and adds the
 * questions to the spaced repetition review deck.
 */
export default function Quiz({ lesson, language }) {
  const progress = useProgress();
  const lp = progress.lessons[lesson.id] || {};
  const questions = lesson.quiz || [];
  const [answers, setAnswers] = useState({});
  const [codes, setCodes] = useState({});
  const [graded, setGraded] = useState(null); // { score, codeResults }
  const [grading, setGrading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const answeredAll = questions.every((q, i) => q.type === 'code' || answers[i] !== undefined);

  const submit = async () => {
    setGrading(true);
    const codeResults = {};
    let correct = 0;
    for (const [i, q] of questions.entries()) {
      if (q.type === 'mcq') {
        if (answers[i] === q.answer) correct++;
      } else {
        const r = await testCode(language, {
          code: codes[i] ?? q.starter ?? '',
          tests: q.tests,
          stdin: toLines(q.testInput),
          prelude: q.prelude ?? lesson.prelude ?? '',
        });
        codeResults[i] = r;
        if (r.results.length && r.results.every((t) => t.passed)) correct++;
      }
    }
    const score = questions.length ? correct / questions.length : 1;
    setGraded({ score, correct, codeResults });
    setGrading(false);
    update((s) => {
      const l = (s.lessons[lesson.id] ||= { quizBest: 0, quizPassed: false, exercises: {} });
      l.quizBest = Math.max(l.quizBest || 0, score);
      l.quizAttempts = (l.quizAttempts || 0) + 1;
      if (score >= PASS_MARK && !l.quizPassed) {
        l.quizPassed = true;
        l.completedAt = Date.now();
        enrollLesson(s, lesson);
      }
      logActivity(s);
    });
  };

  const retake = () => {
    setAnswers({});
    setGraded(null);
    setAttempt(attempt + 1);
  };

  return (
    <div className="quiz">
      <p className="muted">
        {questions.length} questions. Score {Math.round(PASS_MARK * 100)}% or higher to pass and unlock the next lesson.
        {lp.quizPassed && ` You've already passed (best: ${Math.round((lp.quizBest || 0) * 100)}%).`}
      </p>
      <ol className="quiz-list">
        {questions.map((q, i) => (
          <li key={`${attempt}-${i}`} className="card quiz-q">
            {q.type === 'mcq' ? (
              <MultipleChoice
                q={q}
                name={`${lesson.id}-q${i}-${attempt}`}
                value={answers[i]}
                onChange={(v) => setAnswers({ ...answers, [i]: v })}
                graded={!!graded}
              />
            ) : (
              <div className="code-q">
                <span className="tag">Coding question</span>
                <Markdown text={q.question} />
                <CodeEditor
                  storageKey={`${lesson.id}/quiz/${i}`}
                  initialCode={q.starter || ''}
                  language={language}
                  prelude={q.prelude ?? lesson.prelude ?? ''}
                  defaultStdin={toLines(q.testInput).join('\n')}
                  onCodeChange={(c) => setCodes((prev) => ({ ...prev, [i]: c }))}
                  resultSlot={graded && <TestResults result={graded.codeResults[i]} />}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
      {!graded ? (
        <button className="btn btn-primary big" disabled={!answeredAll || grading} onClick={submit}>
          {grading ? 'Grading…' : answeredAll ? 'Submit quiz' : 'Answer every question to submit'}
        </button>
      ) : (
        <div className={`quiz-result ${graded.score >= PASS_MARK ? 'pass' : 'fail'}`}>
          <div className="score">{Math.round(graded.score * 100)}%</div>
          <div>
            <strong>
              {graded.score >= PASS_MARK
                ? 'Passed! The next lesson is unlocked, and these questions will come back in Review.'
                : `You got ${graded.correct} of ${questions.length}. You need ${Math.round(PASS_MARK * 100)}% to pass.`}
            </strong>
            {graded.score < PASS_MARK && (
              <p>Read the explanations above, revisit the parts of the lesson they point to, then try again.</p>
            )}
          </div>
          <button className="btn" onClick={retake}>Retake quiz</button>
        </div>
      )}
    </div>
  );
}
