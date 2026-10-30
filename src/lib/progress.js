// Learner progress, saved automatically to localStorage.
//
// A tiny external store (no library needed): components read it with the
// useProgress() hook and change it with update(fn). Every change is saved.
import { useSyncExternalStore } from 'react';
import { allLessons, units } from './content.js';

const KEY = 'cs-degree-lab:progress:v1';
export const PASS_MARK = 0.8;

const emptyState = () => ({
  lessons: {}, // lessonId -> { quizBest, quizPassed, exercises: { exId: {...} }, completedAt }
  projects: {}, // unitNumber -> { checklist: {}, passed, code }
  srs: {}, // cardId -> { box, due }
  code: {}, // editorKey -> last code typed (so nothing is lost on reload)
  settings: { theme: 'system', unlockAll: false },
  activity: {}, // 'YYYY-MM-DD' -> number of things done that day
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

let state = load();
const subscribers = new Set();
let saveTimer = null;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked (private mode): progress lives in memory only */
    }
  }, 150);
}

/** Apply an immutable-style update: fn receives a deep copy and may mutate it. */
export function update(fn) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  save();
  subscribers.forEach((s) => s());
}

export function getState() {
  return state;
}

export function useProgress() {
  return useSyncExternalStore(
    (cb) => { subscribers.add(cb); return () => subscribers.delete(cb); },
    () => state
  );
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function logActivity(s) {
  s.activity[today()] = (s.activity[today()] || 0) + 1;
}

// ------------------------------------------------------------- queries ---

export function lessonProgress(s, id) {
  return s.lessons[id] || { quizBest: 0, quizPassed: false, exercises: {} };
}

/**
 * Mastery gating: the very first lesson is always open; every other lesson
 * opens once the lesson before it (in course order) has a passed quiz.
 */
export function isLessonUnlocked(s, id) {
  if (s.settings.unlockAll) return true;
  const i = allLessons.findIndex((l) => l.id === id);
  if (i <= 0) return i === 0;
  return lessonProgress(s, allLessons[i - 1].id).quizPassed;
}

export function isUnitComplete(s, unit) {
  return unit.lessons.length > 0 && unit.lessons.every((l) => lessonProgress(s, l.id).quizPassed);
}

export function isProjectUnlocked(s, unit) {
  return s.settings.unlockAll || isUnitComplete(s, unit);
}

export function unitStats(s, unit) {
  const done = unit.lessons.filter((l) => lessonProgress(s, l.id).quizPassed).length;
  return { done, total: unit.lessons.length, projectDone: !!s.projects[unit.number]?.passed };
}

export function overallStats(s) {
  const available = units.filter((u) => u.available);
  const lessonsDone = allLessons.filter((l) => lessonProgress(s, l.id).quizPassed).length;
  const exercisesTotal = allLessons.reduce((n, l) => n + (l.exercises?.length || 0), 0);
  const exercisesDone = allLessons.reduce(
    (n, l) => n + Object.values(lessonProgress(s, l.id).exercises).filter((e) => e.passed).length,
    0
  );
  const projectsDone = available.filter((u) => s.projects[u.number]?.passed).length;
  return { lessonsDone, lessonsTotal: allLessons.length, exercisesDone, exercisesTotal, projectsDone, projectsTotal: available.filter((u) => u.project).length };
}

/** The lesson the learner should do next (first unlocked lesson without a passed quiz). */
export function nextLesson(s) {
  return allLessons.find((l) => !lessonProgress(s, l.id).quizPassed && isLessonUnlocked(s, l.id)) || null;
}

export function streak(s) {
  let count = 0;
  const d = new Date();
  if (!s.activity[today()]) d.setDate(d.getDate() - 1); // today not done yet: count from yesterday
  while (s.activity[d.toISOString().slice(0, 10)]) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// ------------------------------------------------------- import/export ---

export function exportProgress() {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json) {
  const data = JSON.parse(json);
  if (typeof data !== 'object' || !data.lessons) throw new Error('That file does not look like a progress backup.');
  update((s) => Object.assign(s, emptyState(), data));
}

export function resetProgress() {
  update((s) => Object.assign(s, emptyState(), { settings: s.settings }));
}
