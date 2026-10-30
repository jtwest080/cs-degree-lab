// Spaced repetition (a simple Leitner system).
//
// When you pass a lesson quiz, its multiple-choice questions become review
// "cards". Each card sits in a box. Answer correctly and it moves up a box
// and waits longer before coming back; answer wrong and it drops to box 0.
// Reviewing just before you would forget is what makes memory stick.
import { allLessons, lessonById } from './content.js';
import { logActivity } from './progress.js';

const DAY = 24 * 60 * 60 * 1000;
export const INTERVALS_DAYS = [1, 3, 7, 16, 35, 90];

/** Review cards for a lesson: its quiz MCQs plus any extra `review` items. */
export function cardsForLesson(lesson) {
  const quiz = (lesson.quiz || []).map((q, i) => ({ ...q, cardId: `${lesson.id}:quiz:${i}` }));
  const extra = (lesson.review || []).map((q, i) => ({ type: 'mcq', ...q, cardId: `${lesson.id}:review:${i}` }));
  return [...quiz, ...extra]
    .filter((q) => q.type === 'mcq')
    .map((q) => ({ ...q, lessonId: lesson.id }));
}

/** Called when a lesson quiz is first passed: schedule its cards for tomorrow. */
export function enrollLesson(s, lesson) {
  for (const card of cardsForLesson(lesson)) {
    if (!s.srs[card.cardId]) s.srs[card.cardId] = { box: 0, due: Date.now() + DAY };
  }
}

function allCards() {
  return allLessons.flatMap(cardsForLesson);
}

export function dueCards(s, now = Date.now()) {
  return allCards().filter((c) => s.srs[c.cardId] && s.srs[c.cardId].due <= now);
}

/** Cards from passed lessons, for optional extra practice even when nothing is due. */
export function practiceCards(s) {
  return allCards().filter((c) => s.srs[c.cardId]);
}

export function recordReview(s, cardId, correct) {
  const card = s.srs[cardId] || { box: 0 };
  const box = correct ? Math.min(card.box + 1, INTERVALS_DAYS.length - 1) : 0;
  s.srs[cardId] = { box, due: Date.now() + INTERVALS_DAYS[correct ? box : 0] * DAY, last: Date.now() };
  logActivity(s);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function lessonTitleForCard(card) {
  const l = lessonById[card.lessonId];
  return l ? `${l.number} ${l.title}` : '';
}
