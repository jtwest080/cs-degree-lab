// Loads all curriculum content from /content (YAML files compiled to JSON at
// build time) and assembles it into one ordered structure the app can use.
//
// Adding a lesson = dropping a new lesson-XX-name.yaml into a unit folder.
// Files are ordered by file name, so number them.
//
// The main bundle holds only a summary of each lesson (see vite.config.js).
// Full lessons and projects load on demand with loadLesson / loadProject,
// or the useLesson / useProject hooks.
import { useEffect, useState } from 'react';
import curriculum from '../../content/curriculum.yaml';
import contentIndex from 'virtual:content-index';

const lessonLoaders = import.meta.glob('../../content/unit-*/lesson-*.yaml', { import: 'default' });
const projectLoaders = import.meta.glob('../../content/unit-*/project.yaml', { import: 'default' });
const glossaryFiles = import.meta.glob('../../content/unit-*/glossary.yaml', { eager: true, import: 'default' });

function folderOf(path) {
  return path.split('/').slice(-2)[0]; // e.g. "unit-01"
}

function byFolder(files) {
  const map = {};
  for (const [path, data] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    (map[folderOf(path)] ||= []).push(data);
  }
  return map;
}

const glossaryByFolder = byFolder(glossaryFiles);

export const units = curriculum.units.map((u) => {
  const folder = `unit-${String(u.number).padStart(2, '0')}`;
  const entry = contentIndex[folder] || { lessons: [], project: null };
  const lessons = entry.lessons.map((l, i) => ({
    ...l,
    folder,
    unitNumber: u.number,
    number: `${u.number}.${i + 1}`,
  }));
  const project = entry.project ? { ...entry.project, unitNumber: u.number } : null;
  return { ...u, folder, lessons, project, available: lessons.length > 0 };
});

export const courseTitle = curriculum.title;
export const courseIntro = curriculum.intro;

/** Every lesson in course order, across all units. */
export const allLessons = units.flatMap((u) => u.lessons);

export const lessonById = Object.fromEntries(allLessons.map((l) => [l.id, l]));

export function unitByNumber(n) {
  return units.find((u) => u.number === Number(n));
}

const cache = new Map();

function cached(key, load) {
  if (!cache.has(key)) {
    const p = load();
    p.catch(() => cache.delete(key)); // allow a retry after a network error
    cache.set(key, p);
  }
  return cache.get(key);
}

/** The full lesson (summary fields plus sections, examples, exercises, quiz). */
export function loadLesson(id) {
  const summary = lessonById[id];
  if (!summary) return Promise.reject(new Error(`Unknown lesson ${id}`));
  const loader = lessonLoaders[`../../content/${summary.folder}/${summary.file}`];
  return cached(`lesson:${id}`, () => loader().then((data) => ({ ...data, ...summary, exercises: data.exercises, quiz: data.quiz })));
}

/** The full project for a unit, or null if the unit has none. */
export function loadProject(unitNumber) {
  const unit = unitByNumber(unitNumber);
  const loader = unit && projectLoaders[`../../content/${unit.folder}/project.yaml`];
  if (!loader) return Promise.resolve(null);
  return cached(`project:${unit.number}`, () => loader().then((data) => ({ ...data, unitNumber: unit.number })));
}

function useLoaded(key, load) {
  const [state, setState] = useState({ key: null, value: null, error: null });
  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setState({ key, value, error: null }),
      (error) => live && setState({ key, value: null, error })
    );
    return () => { live = false; };
  }, [key]);
  return state.key === key ? state : { key, value: null, error: null };
}

/** { lesson, error }: lesson is null while it loads. */
export function useLesson(id) {
  const { value, error } = useLoaded(`lesson:${id}`, () => (lessonById[id] ? loadLesson(id) : Promise.resolve(null)));
  return { lesson: value, error };
}

/** { project, error }: project is null while it loads. */
export function useProject(unitNumber) {
  const { value, error } = useLoaded(`project:${unitNumber}`, () => loadProject(unitNumber));
  return { project: value, error };
}

/** All glossary terms, alphabetized, each linked to the lesson that introduces it. */
export const glossary = units
  .flatMap((u) => (glossaryByFolder[u.folder] || []).flatMap((g) => g.terms || []))
  .map((t) => ({ ...t, lessonTitle: lessonById[t.lesson]?.title, lessonNumber: lessonById[t.lesson]?.number }))
  .sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase()));

/** Language for a lesson's code: lesson override, else the unit default. */
export function languageOf(lesson) {
  return lesson.language || unitByNumber(lesson.unitNumber)?.language || 'python';
}
