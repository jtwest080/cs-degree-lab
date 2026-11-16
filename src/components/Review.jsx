import React, { useState } from 'react';
import { MultipleChoice } from './Quiz.jsx';
import Markdown from './Markdown.jsx';
import { href } from '../lib/router.js';
import { streak, update, useProgress } from '../lib/progress.js';
import {
  INTERVALS_DAYS, boxCounts, dueCards, forecast, lessonTitleForCard, practiceCards, recordReview, reviewedToday, shuffle,
} from '../lib/srs.js';

const SIZES = [10, 20, 50];
const BOX_LABEL = ['New or missed', '1-day', '3-day', '1-week', '2-week', '5-week'];

/**
 * Daily review (spaced repetition). Questions from lessons you've passed come
 * back after 1, 3, 7, 16, 35, then 90 days, each time you answer correctly.
 * A card you miss is asked again at the end of the session (that second try
 * does not change the schedule) and comes back tomorrow.
 */
export default function Review() {
  const progress = useProgress();
  const [size, setSize] = useState(10);
  const [session, setSession] = useState(null); // { queue, total, i, answer, graded, correct, missed, practice }

  const due = dueCards(progress);
  const pool = practiceCards(progress);
  const fc = forecast(progress);
  const boxes = boxCounts(progress);
  const maxBox = Math.max(1, ...boxes);
  const doneToday = reviewedToday(progress);
  const days = streak(progress);

  const start = (practice) => {
    const queue = shuffle(practice ? pool : due).slice(0, size);
    setSession({ queue, total: queue.length, i: 0, answer: undefined, graded: false, correct: 0, missed: [], practice });
  };

  if (!session) {
    return (
      <div className="page narrow">
        <h1>Daily review</h1>
        <p>
          Your brain forgets on a predictable curve, and reviewing just before you would forget is the most efficient
          way to remember for good. When you pass a lesson quiz, its questions join your review deck. Answer a card
          correctly and it waits longer before returning ({INTERVALS_DAYS.join(', ')} days). Miss it and it comes back tomorrow.
          Ten minutes a day beats an hour once a week.
        </p>
        <section className="stats">
          <div className="stat"><div className="stat-num">{fc.due}</div><div className="stat-label">due now</div></div>
          <div className="stat"><div className="stat-num">{fc.tomorrow}</div><div className="stat-label">due within a day</div></div>
          <div className="stat"><div className="stat-num">{fc.week}</div><div className="stat-label">due this week</div></div>
          <div className="stat"><div className="stat-num">{doneToday}</div><div className="stat-label">reviewed today</div></div>
          <div className="stat"><div className="stat-num">{days}</div><div className="stat-label">day streak</div></div>
        </section>
        <div className="card review-start">
          {due.length > 0 ? (
            <>
              <h2>{due.length} card{due.length > 1 ? 's' : ''} due</h2>
              <p className="muted small">
                Session size:{' '}
                {SIZES.map((n) => (
                  <button key={n} className={`btn ${size === n ? 'btn-primary' : ''}`} onClick={() => setSize(n)} aria-pressed={size === n}>{n}</button>
                ))}
              </p>
              <button className="btn btn-primary big" onClick={() => start(false)}>
                Start review ({Math.min(due.length, size)} cards)
              </button>
            </>
          ) : (
            <h2>{doneToday > 0 ? 'All caught up for today. Nice work.' : 'Nothing due right now. Nice work.'}</h2>
          )}
          {pool.length > 0 ? (
            <p>
              <button className="btn" onClick={() => start(true)}>Extra practice (random cards)</button>
              <span className="muted small"> Extra practice doesn't change your schedule.</span>
            </p>
          ) : (
            <p className="muted">Pass your first lesson quiz to start building your deck. <a href={href.dashboard()}>Go to dashboard</a></p>
          )}
        </div>
        {pool.length > 0 && (
          <div className="card">
            <h2>Your deck: {pool.length} cards</h2>
            <p className="muted small">Cards move up a box each time you answer correctly. Box sizes:</p>
            {boxes.map((n, i) => (
              <div key={i} className="box-row">
                <span className="box-label">{BOX_LABEL[i]}</span>
                <div className="bar" aria-hidden="true"><div className="bar-fill" style={{ width: `${(n / maxBox) * 100}%` }} /></div>
                <span className="box-n">{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const card = session.queue[session.i];
  if (!card) {
    return (
      <div className="page narrow">
        <h1>Session complete</h1>
        <p className="big-num">{session.total - session.missed.length} / {session.total} right the first time</p>
        <p>
          {session.missed.length === 0
            ? 'Perfect recall.'
            : session.practice
              ? 'These are worth another look:'
              : 'These cards come back tomorrow. Worth a quick look now:'}
        </p>
        {session.missed.length > 0 && (
          <ul className="missed-list">
            {session.missed.map((c) => (
              <li key={c.cardId} className="card">
                <Markdown text={c.question} />
                <p><strong>Answer:</strong> <Markdown text={String(c.options[c.answer])} inline /></p>
                {c.explanation && <p className="muted"><Markdown text={c.explanation} inline /></p>}
                <a href={href.lesson(c.lessonId)} className="btn-ghost">Revisit lesson: {lessonTitleForCard(c)}</a>
              </li>
            ))}
          </ul>
        )}
        <button className="btn" onClick={() => setSession(null)}>Back to review</button>{' '}
        <a className="btn btn-primary" href={href.dashboard()}>Dashboard</a>
      </div>
    );
  }

  const check = () => {
    const right = session.answer === card.answer;
    if (!session.practice && !card.retry) update((s) => recordReview(s, card.cardId, right));
    let { queue, missed, correct } = session;
    if (!card.retry) {
      if (right) correct += 1;
      else {
        missed = [...missed, card];
        queue = [...queue, { ...card, retry: true }]; // ask it once more at the end
      }
    }
    setSession({ ...session, queue, missed, correct, graded: true });
  };

  return (
    <div className="page narrow">
      <div className="review-progress muted">
        Card {session.i + 1} of {session.queue.length} {session.practice && '· extra practice'} {card.retry && '· second try'} · from {lessonTitleForCard(card)}
      </div>
      <div className="card">
        <MultipleChoice
          key={card.cardId + (card.retry ? ':retry' : '')}
          q={card}
          name={card.cardId + (card.retry ? ':retry' : '')}
          value={session.answer}
          onChange={(v) => setSession({ ...session, answer: v })}
          graded={session.graded}
        />
      </div>
      <div className="review-actions">
        {!session.graded ? (
          <button className="btn btn-primary" disabled={session.answer === undefined} onClick={check}>Check</button>
        ) : (
          <button className="btn btn-primary" onClick={() => setSession({ ...session, i: session.i + 1, answer: undefined, graded: false })}>
            Next →
          </button>
        )}
        <a href={href.lesson(card.lessonId)} className="btn-ghost">Revisit lesson</a>
      </div>
    </div>
  );
}
