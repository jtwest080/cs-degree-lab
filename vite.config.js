import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CONTENT = path.resolve('content');

// Lesson content lives in /content as YAML files (human-friendly, multi-line
// code blocks). This tiny plugin converts each .yaml file to JSON at build
// time, so the app only ever sees plain structured data.
// Full lessons and projects are loaded on demand (one small chunk each), so
// the main bundle only carries this index: what the dashboard, progress
// tracking and review deck need (titles, exercise ids, quiz questions).
const INDEX_ID = 'virtual:content-index';

function lessonSummary(file, data) {
  return {
    file,
    id: data.id,
    title: data.title,
    minutes: data.minutes,
    objective: data.objective,
    language: data.language,
    exercises: (data.exercises || []).map((e) => ({ id: e.id, title: e.title, difficulty: e.difficulty })),
    quiz: (data.quiz || []).map((q) => (q.type === 'mcq' ? q : { type: q.type })),
    review: data.review,
  };
}

function buildIndex() {
  const index = {};
  for (const folder of fs.readdirSync(CONTENT).filter((f) => /^unit-\d+$/.test(f)).sort()) {
    const dir = path.join(CONTENT, folder);
    const files = fs.readdirSync(dir).filter((f) => /^lesson-.*\.yaml$/.test(f)).sort();
    const lessons = files.map((f) => lessonSummary(f, yaml.load(fs.readFileSync(path.join(dir, f), 'utf8'))));
    const projectPath = path.join(dir, 'project.yaml');
    const project = fs.existsSync(projectPath)
      ? { title: yaml.load(fs.readFileSync(projectPath, 'utf8')).title }
      : null;
    index[folder] = { lessons, project };
  }
  return index;
}

function yamlContent() {
  return {
    name: 'yaml-content',
    resolveId(id) {
      return id === INDEX_ID ? '\0' + INDEX_ID : null;
    },
    load(id) {
      if (id !== '\0' + INDEX_ID) return null;
      this.addWatchFile(CONTENT);
      return `export default ${JSON.stringify(buildIndex())};`;
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(CONTENT) && file.endsWith('.yaml')) {
        const mod = server.moduleGraph.getModuleById('\0' + INDEX_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
    },
    transform(src, id) {
      if (!id.endsWith('.yaml')) return null;
      const data = yaml.load(src, { filename: id });
      return { code: `export default ${JSON.stringify(data)};`, map: null };
    },
  };
}

// After each build, write dist/sw.js: a service worker that stores every file
// of this build so the installed app works offline. Its version is a hash of
// the files, so a new build (say, a new unit) installs as an update.
function serviceWorker() {
  let outDir = 'dist';
  return {
    name: 'service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const skip = new Set(['sw.js', 'artifact.html', 'pyodide/python_stdlib.zip']);
      const files = [];
      const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else files.push(path.relative(outDir, full).split(path.sep).join('/'));
        }
      };
      walk(outDir);
      const precache = files.filter((f) => !skip.has(f)).sort();
      const hash = crypto.createHash('sha256');
      for (const f of precache) hash.update(f).update(fs.readFileSync(path.join(outDir, f)));
      const version = hash.digest('hex').slice(0, 12);
      const template = fs.readFileSync(path.resolve('src/sw-template.js'), 'utf8');
      fs.writeFileSync(
        path.join(outDir, 'sw.js'),
        template.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(['./', ...precache])),
      );
    },
  };
}

export default defineConfig({
  // Relative base so the built app works from any folder or static host.
  base: './',
  plugins: [react(), yamlContent(), serviceWorker()],
  // Classic (IIFE) workers can use importScripts() to load the Pyodide runtime.
  worker: { format: 'iife' },
  // CodeMirror makes the main bundle large; that's fine for a learning app.
  build: { chunkSizeWarningLimit: 1500 },
});
