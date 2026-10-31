import React from 'react';
import Markdown from './Markdown.jsx';
import CodeBlock from './CodeBlock.jsx';
import CodeEditor from './CodeEditor.jsx';
import Exercise from './Exercise.jsx';
import Quiz from './Quiz.jsx';
import AskClaude from './AskClaude.jsx';
import ListenPlayer from './ListenPlayer.jsx';
import { allLessons, languageOf, lessonById, unitByNumber, useLesson } from '../lib/content.js';
import { href } from '../lib/router.js';
import { isLessonUnlocked, isUnitComplete, lessonProgress, useProgress } from '../lib/progress.js';

/** A worked example: code with line numbers, then a line-by-line walkthrough. */
function Example({ ex, index, language, lessonId, prelude }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="example card">
      <h4>Example {index + 1}: {ex.title}</h4>
      {ex.intro && <Markdown text={ex.intro} />}
      <CodeBlock code={ex.code} language={ex.language || language} numbered />
      {ex.output && (
        <div className="output static">
          <div className="output-label">Output</div>
          <pre>{ex.output.replace(/\n$/, '')}</pre>
        </div>
      )}
      {ex.lines?.length > 0 && (
        <div className="line-notes">
          <div className="line-notes-title">Line by line</div>
          <dl>
            {ex.lines.map((l, i) => (
              <React.Fragment key={i}>
                <dt>{String(l.line).includes('-') ? 'Lines' : 'Line'} {l.line}</dt>
                <dd><Markdown text={l.note} inline /></dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      )}
      {ex.after && <Markdown text={ex.after} />}
      {(ex.language || language) !== 'text' && ex.runnable !== false && (
        <>
          <button className="btn-ghost" onClick={() => setOpen(!open)}>
            {open ? 'Hide editor' : '✎ Run and modify this example'}
          </button>
          {open && (
            <CodeEditor
              storageKey={`${lessonId}/example/${index}`}
              initialCode={ex.code}
              language={ex.language || language}
              prelude={prelude}
              defaultStdin={ex.stdin || ''}
            />
          )}
        </>
      )}
    </div>
  );
}

const TOC = [
  ['objective', 'Objective'],
  ['learn', 'Lesson'],
  ['examples', 'Worked examples'],
  ['playground', 'Try it'],
  ['practice', 'Practice'],
  ['mistakes', 'Common mistakes'],
  ['summary', 'Summary'],
  ['quiz', 'Quiz'],
];

export default function LessonView({ lessonId }) {
  const progress = useProgress();
  const { lesson: full, error } = useLesson(lessonId);
  const lesson = full || lessonById[lessonId];
  if (!lesson) {
    return (
      <div className="page narrow">
        <h1>Lesson not found</h1>
        <a href={href.dashboard()}>Back to dashboard</a>
      </div>
    );
  }
  const unit = unitByNumber(lesson.unitNumber);
  const language = languageOf(lesson);
  const idx = allLessons.findIndex((l) => l.id === lesson.id);
  const prev = allLessons[idx - 1];
  const next = allLessons[idx + 1];
  const lp = lessonProgress(progress, lesson.id);
  const solved = Object.values(lp.exercises).filter((e) => e.passed).length;

  if (!isLessonUnlocked(progress, lesson.id)) {
    return (
      <div className="page narrow locked-page">
        <div className="lock-icon" aria-hidden="true">🔒</div>
        <h1>{lesson.number} {lesson.title}</h1>
        <p>
          This lesson unlocks when you pass the quiz for <a href={href.lesson(prev.id)}>{prev.number} {prev.title}</a> with 80% or more.
          Each lesson builds on the one before it, so mastering it first will make this one much easier.
        </p>
        <a className="btn btn-primary" href={href.lesson(prev.id)}>Go to {prev.number}</a>
      </div>
    );
  }

  if (!full) {
    return (
      <div className="page narrow">
        <h1>{lesson.number} {lesson.title}</h1>
        {error
          ? <p>This lesson couldn't be loaded. Check your connection and <button className="btn" onClick={() => location.reload()}>try again</button>.</p>
          : <p className="muted">Loading lesson…</p>}
      </div>
    );
  }

  const lastInUnit = unit.lessons[unit.lessons.length - 1]?.id === lesson.id;

  return (
    <div className="lesson-layout">
      <aside className="toc">
        <a className="toc-unit" href={href.dashboard()}>← Unit {unit.number}: {unit.title}</a>
        <nav>
          {TOC.map(([id, label]) => (
            <a key={id} href={`#/lesson/${lesson.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }}>
              {label}
              {id === 'practice' && <span className="toc-count">{solved}/{lesson.exercises.length}</span>}
              {id === 'quiz' && lp.quizPassed && <span className="toc-count ok">✓</span>}
            </a>
          ))}
        </nav>
        <ol className="toc-lessons">
          {unit.lessons.map((l) => (
            <li key={l.id} className={l.id === lesson.id ? 'current' : ''}>
              {isLessonUnlocked(progress, l.id) ? (
                <a href={href.lesson(l.id)}>
                  {lessonProgress(progress, l.id).quizPassed ? '✓ ' : ''}{l.number} {l.title}
                </a>
              ) : (
                <span className="muted">🔒 {l.number} {l.title}</span>
              )}
            </li>
          ))}
        </ol>
      </aside>

      <article className="lesson">
        <header className="lesson-header">
          <div className="eyebrow">Unit {unit.number} · Lesson {lesson.number} · about {lesson.minutes || 30} min</div>
          <h1>{lesson.title}</h1>
          {lp.quizPassed && <span className="done-tag big">✓ Mastered ({Math.round(lp.quizBest * 100)}%)</span>}
          <div><ListenPlayer lessonId={lesson.id} /></div>
        </header>

        <section id="objective" className="objective card">
          <h2>Learning objective</h2>
          <Markdown text={lesson.objective} />
          {lesson.outcomes && (
            <>
              <p className="muted">By the end you will be able to:</p>
              <ul>{lesson.outcomes.map((o, i) => <li key={i}><Markdown text={o} inline /></li>)}</ul>
            </>
          )}
        </section>

        <section id="learn">
          {lesson.sections.map((s, i) => (
            <div className="lesson-section" key={i}>
              <h2>{s.heading}</h2>
              <Markdown text={s.body} />
            </div>
          ))}
        </section>

        <section id="examples">
          <h2>Worked examples</h2>
          {lesson.examples.map((ex, i) => (
            <Example key={i} ex={ex} index={i} language={language} lessonId={lesson.id} prelude={lesson.prelude || ''} />
          ))}
        </section>

        <section id="playground">
          <h2>Try it yourself</h2>
          <Markdown text={lesson.playground?.prompt || 'Experiment freely. Change the code, run it, and see what happens. You cannot break anything.'} />
          <CodeEditor
            storageKey={`${lesson.id}/playground`}
            initialCode={lesson.playground?.code || ''}
            language={language}
            prelude={lesson.prelude || ''}
            defaultStdin={lesson.playground?.stdin || ''}
            minHeight="180px"
          />
        </section>

        <section id="practice">
          <h2>Practice exercises</h2>
          <p className="muted">Each exercise is checked by automatic tests. Hints unlock one at a time; the full solution unlocks after you've checked your answer at least once.</p>
          {lesson.exercises.map((ex, i) => (
            <Exercise key={ex.id} lesson={lesson} exercise={ex} index={i} language={language} />
          ))}
        </section>

        <section id="mistakes">
          <h2>Common mistakes</h2>
          {lesson.commonMistakes.map((m, i) => (
            <div className="mistake card" key={i}>
              <h4>⚠ {m.title}</h4>
              <Markdown text={m.explanation} />
              {(m.wrong || m.right) && (
                <div className="wrong-right">
                  {m.wrong && (<div><div className="wr-label bad">Wrong</div><CodeBlock code={m.wrong} language={m.language || language} /></div>)}
                  {m.right && (<div><div className="wr-label ok">Right</div><CodeBlock code={m.right} language={m.language || language} /></div>)}
                </div>
              )}
            </div>
          ))}
        </section>

        <section id="summary" className="summary card">
          <h2>Summary</h2>
          <ul>{lesson.summary.map((s, i) => <li key={i}><Markdown text={s} inline /></li>)}</ul>
          <h3>Where this leads next</h3>
          <Markdown text={lesson.next} />
        </section>

        <section id="quiz">
          <h2>Lesson quiz</h2>
          <Quiz lesson={lesson} language={language} />
        </section>

        <nav className="lesson-nav">
          {prev ? <a className="btn" href={href.lesson(prev.id)}>← {prev.number} {prev.title}</a> : <span />}
          {lastInUnit ? (
            <span className="nav-right">
              {unit.project && (isUnitComplete(progress, unit) || progress.settings.unlockAll ? (
                <a className="btn btn-primary" href={href.project(unit.number)}>Unit {unit.number} project →</a>
              ) : (
                <span className="muted">Pass this quiz to unlock the Unit {unit.number} project</span>
              ))}
              {next && isLessonUnlocked(progress, next.id) && (
                <a className="btn" href={href.lesson(next.id)}>Unit {next.unitNumber}: {next.number} {next.title} →</a>
              )}
            </span>
          ) : next && isLessonUnlocked(progress, next.id) ? (
            <a className="btn btn-primary" href={href.lesson(next.id)}>{next.number} {next.title} →</a>
          ) : next ? (
            <span className="muted">Pass the quiz to unlock {next.number}</span>
          ) : <span />}
        </nav>
      </article>
      <AskClaude key={lesson.id} lesson={lesson} unit={unit} />
    </div>
  );
}
