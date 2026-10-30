import React, { useState } from 'react';
import { MultipleChoice } from './Quiz.jsx';
import { href } from '../lib/router.js';
import { update, useProgress } from '../lib/progress.js';
import { INTERVALS_DAYS, dueCards, lessonTitleForCard, practiceCards, recordReview, shuffle } from '../lib/srs.js';

const SESSION_SIZE = 10;

/**
 * Spaced repetition review. Questions from lessons you've passed come back
 * after 1, 3, 7, 16, 35, then 90 days, each time you answer them correctly.
 */
export default function Review() {
  const progress = useProgress();
  const [session, setSession] = useState(null); // { cards, i, answer, graded, correct, practice }

  const due = dueCards(progress);
  const pool = practiceCards(progress);

  const start = (practice) => {
    const cards = shuffle(practice ? pool : due).slice(0, SESSION_SIZE);
    setSession({ cards, i: 0, answer: undefined, graded: false, correct: 0, practice });
  };

  if (!session) {
    return (
      <div className="page narrow">
        <h1>Review</h1>
        <p>
          Your brain forgets on a predictable curve, and reviewing just before you would forget is the most efficient
          way to remember for good. When you pass a lesson quiz, its questions join your review deck. Answer a card
          correctly and it waits longer before returning ({INTERVALS_DAYS.join(', ')} days). Miss it and it comes back tomorrow.
        </p>
        <div className="card review-start">
          {due.length > 0 ? (
            <>
              <h2>{due.length} card{due.length > 1 ? 's' : ''} due</h2>
              <button className="btn btn-primary big" onClick={() => start(false)}>
                Start review ({Math.min(due.length, SESSION_SIZE)} cards)
              </button>
            </>
          ) : (
            <h2>Nothing due right now. Nice work.</h2>
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
      </div>
    );
  }

  const card = session.cards[session.i];
  if (!card) {
    return (
      <div className="page narrow">
        <h1>Session complete</h1>
        <p className="big-num">{session.correct} / {session.cards.length} correct</p>
        <p>{session.correct === session.cards.length ? 'Perfect recall.' : 'The cards you missed will come back tomorrow.'}</p>
        <button className="btn" onClick={() => setSession(null)}>Back to review</button>{' '}
        <a className="btn btn-primary" href={href.dashboard()}>Dashboard</a>
      </div>
    );
  }

  const check = () => {
    const correct = session.answer === card.answer;
    if (!session.practice) update((s) => recordReview(s, card.cardId, correct));
    setSession({ ...session, graded: true, correct: session.correct + (correct ? 1 : 0) });
  };

  return (
    <div className="page narrow">
      <div className="review-progress muted">
        Card {session.i + 1} of {session.cards.length} {session.practice && '· extra practice'} · from {lessonTitleForCard(card)}
      </div>
      <div className="card">
        <MultipleChoice
          key={card.cardId}
          q={card}
          name={card.cardId}
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
