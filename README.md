# CS Degree Lab

An interactive, university-level computer science course that runs entirely in your browser. It starts from zero (what is a bit?) and is designed to go as deep as a four-year CS degree, in 18 units. See [CURRICULUM.md](CURRICULUM.md) for what's written so far.

Every lesson has a learning objective, a full explanation with analogies, worked examples explained line by line, an in-browser code editor, 3 to 5 auto-tested exercises with hints and locked solutions, a common-mistakes section, a summary, and a quiz. Pass a quiz with 80% or more to unlock the next lesson.

Python runs locally in the browser via [Pyodide](https://pyodide.org) (Python compiled to WebAssembly). No account, server or paid service is needed, and progress is saved in your browser.

## Running it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install        # also copies the Python runtime into public/pyodide
npm run dev        # start a local dev server, then open the URL it prints
```

To build a static site you can host anywhere (or open from a local web server):

```bash
npm run build      # output goes to dist/
npm run preview    # serve dist/ locally to check it
```

The built site uses relative paths and hash URLs, so `dist/` can be uploaded to any static host (GitHub Pages, Netlify, an S3 bucket) without configuration. Because browsers block WebAssembly and workers on `file://` URLs, open it through a web server rather than by double-clicking `index.html`.

## App versions

Every push to `main` runs two GitHub Actions workflows:

- **Installable web app** (`.github/workflows/deploy.yml`): builds the site and publishes it to GitHub Pages. The site has a web app manifest and a service worker (`src/sw-template.js`, filled in by `vite.config.js` with every built file), so it can be added to a phone's home screen or installed from Chrome or Edge on a computer, and it works offline. When a new version is published, the open app shows a "new version is ready" banner.
- **Desktop app** (`.github/workflows/desktop.yml`): wraps the same build in Electron (`desktop/`) and attaches `CS-Degree-Lab-Setup.exe` (Windows) and `CS-Degree-Lab-Mac.dmg` (Mac) to the "Desktop app" release. The installers aren't code-signed, so Windows and macOS warn the first time they're opened.

To try the desktop app locally: `npm run build && rm -rf desktop/web && cp -r dist desktop/web && cd desktop && npm install && npm start`.

## Checking the content

```bash
npm run verify
```

This runs every lesson through two checkers:

- `scripts/verify_content.py` (desktop Python): checks each lesson has every required section, every worked example prints exactly the output the lesson shows, every reference solution passes its tests, every starter does *not* already pass, quiz answers are valid, and glossary terms point at real lessons.
- `scripts/verify_pyodide.mjs` (Node + Pyodide): reruns the solutions, starters and examples in the exact Python runtime the browser uses.

Run it after editing any lesson.

## Project layout

```text
content/                 lesson content (YAML), separate from the code
  curriculum.yaml        the 18 units: titles, summaries, topics
  unit-01/
    lesson-01-*.yaml     one file per lesson, ordered by file name
    project.yaml         the unit project
    glossary.yaml        terms introduced in the unit
src/
  App.jsx                routes between pages (hash router)
  components/            Dashboard, LessonView, CodeEditor, Exercise, Quiz,
                         Review, Glossary, ProjectView, Settings, ...
  lib/
    content.js           loads and assembles all content
    progress.js          progress store (localStorage) and mastery gating
    srs.js               spaced repetition (Leitner boxes)
    runner.js            runs code in workers with a time limit
    harness.py           Python test harness used by the browser and the verifier
  workers/               Python (Pyodide) and JavaScript sandboxes
scripts/                 content verifiers and the Pyodide copy step
```

## Adding a lesson

Create `content/unit-NN/lesson-XX-short-name.yaml`. Lessons are ordered by file name, so number them. YAML is used because it keeps multi-line code readable; it's converted to JSON at build time. The fields:

```yaml
id: u3-lists                 # unique id, used in URLs and progress
title: Lists
minutes: 45
objective: Markdown text
outcomes: [list of Markdown strings]
prelude: optional hidden Python run before examples, playground, exercises
                             (it can also create sample files for file lessons)
sections:                    # the explanation
  - heading: ...
    body: Markdown (blockquotes starting **Tip**, **Note**, **Warning**,
          **Analogy**, **Why**, **Key idea** or **Deep dive** become callouts)
examples:
  - title: ...
    intro: Markdown
    code: |
      python code
    stdin: optional input lines
    output: exact expected output (checked by the verifier)
    lines: [{line: "1-2", note: Markdown}]
playground: {prompt: Markdown, code: ..., stdin: ...}
exercises:                   # 3 to 5
  - id: unique-within-lesson
    title: ...
    difficulty: 1-3
    prompt: Markdown
    starter: code
    testInput: input lines for the main test run (optional)
    tests:
      - name: shown to the learner
        code: |
          assert ..., "helpful message"
    hints: [revealed one at a time]
    slowStarter: true          # optional: the starter is deliberately too slow
                               # (the browser Pyodide check skips running it)
    solution: code (unlocked after the first check)
    explanation: Markdown
commonMistakes: [{title, explanation, wrong?, right?}]
summary: [Markdown strings]
next: Markdown
quiz:
  - {type: mcq, question, options, answer: index, explanation}
  - {type: code, question, starter, tests, solution}
```

Test code runs after the learner's code, with access to all their variables and functions plus:

- `output`: everything the program printed
- `run(*lines)`: rerun the program with new input lines and return its output
- `source`: the learner's code as text
- `capture(f, *args)`: call `f` and return `(printed_text, return_value)`
- `uses_loop()`: True if the learner's code contains a `for`/`while` loop or a comprehension (comments and strings are ignored)

Add any new terms to the unit's `glossary.yaml`, then run `npm run verify`.

## How progress works

Progress (passed quizzes, solved exercises, code you've typed, review schedule) is saved automatically in your browser's localStorage. Use **Settings → Download backup** to move it to another browser or device. **Settings → Preview mode** unlocks everything for browsing ahead.

Passing a quiz adds its multiple-choice questions to your review deck. Cards come back after 1, 3, 7, 16, 35 and 90 days as you keep answering them correctly, and drop back to 1 day when you miss one.
