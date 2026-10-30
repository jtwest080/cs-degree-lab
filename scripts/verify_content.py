#!/usr/bin/env python3
"""Checks every lesson file so broken content never reaches a learner.

For each lesson it verifies that:
  * all required sections exist (objective, explanation, examples, 3-5
    exercises, hints, solutions, quiz, common mistakes, summary, next)
  * every worked example runs, and prints exactly the output the lesson shows
  * every exercise's reference solution passes all of its tests
  * every exercise's starter code does NOT already pass (so tests test something)
  * quiz answers point at a real option, coding questions are solvable
  * unit project solutions pass their tests
  * glossary terms point to real lessons

It uses the same harness (src/lib/harness.py) that runs in the browser.

Usage:  python3 scripts/verify_content.py [unit-folder ...]
"""
import importlib.util
import os
import pathlib
import signal
import sys
import tempfile

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("harness", ROOT / "src/lib/harness.py")
harness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harness)

errors, warnings = [], []


def lines(v):
    if v is None or v == "":
        return []
    if isinstance(v, list):
        return [str(x) for x in v]
    return str(v).rstrip("\n").split("\n")


STARTER_TIME_LIMIT = 10  # seconds


class StarterTooSlow(Exception):
    pass


def _too_slow(signum, frame):
    signal.alarm(1)  # keep interrupting: the harness catches this and moves on to the next test
    raise StarterTooSlow("starter ran out of time")


def check_solvable(where, item, lang, default_prelude=""):
    if lang != "python":
        return
    for key in ("tests", "solution"):
        if not item.get(key):
            errors.append(f"{where}: missing '{key}'")
            return
    inputs = lines(item.get("testInput"))
    prelude = item.get("prelude", default_prelude)
    r = harness.run_tests(item["solution"], item["tests"], inputs, prelude)
    failed = [t for t in r["results"] if not t["passed"]]
    if r["error"] or failed:
        errors.append(f"{where}: reference solution FAILS\n      error={r['error']}\n      " +
                      "\n      ".join(f"{t['name']}: {t['message']}" for t in failed))
    starter = item.get("starter", "")
    # Some starters are deliberately slow (the exercise is to make them fast),
    # so give the starter a time limit, like the browser does; a timeout counts as failing.
    signal.signal(signal.SIGALRM, _too_slow)
    signal.alarm(STARTER_TIME_LIMIT)
    try:
        r = harness.run_tests(starter, item["tests"], inputs, prelude)
    finally:
        signal.alarm(0)
    if r["results"] and all(t["passed"] for t in r["results"]):
        errors.append(f"{where}: starter code already passes every test")


def require(where, obj, keys):
    for k in keys:
        if not obj.get(k):
            errors.append(f"{where}: missing '{k}'")


def check_lesson(path, unit_lang, ids):
    data = yaml.safe_load(path.read_text())
    lid = data.get("id", path.name)
    where = f"{path.parent.name}/{path.name}"
    if lid in ids:
        errors.append(f"{where}: duplicate lesson id {lid}")
    ids.add(lid)
    lang = data.get("language", unit_lang)
    require(where, data, ["id", "title", "objective", "sections", "examples", "exercises",
                          "commonMistakes", "summary", "next", "quiz"])

    for i, ex in enumerate(data.get("examples", [])):
        require(f"{where} example {i+1}", ex, ["title", "code"])
        if not ex.get("lines"):
            warnings.append(f"{where} example {i+1}: no line-by-line notes")
        ex_lang = ex.get("language", lang)
        if ex_lang == "python" and ex.get("runnable", True):
            r = harness.run_program(ex["code"], lines(ex.get("stdin")), data.get("prelude", ""))
            if r["error"] and not ex.get("expectError"):
                errors.append(f"{where} example {i+1} raises:\n{r['error']}")
            # Trailing spaces are invisible on screen, so ignore them when comparing.
            def norm(t):
                return "\n".join(l.rstrip() for l in str(t).rstrip("\n").split("\n"))
            if "output" in ex and norm(r["output"]) != norm(ex["output"]):
                errors.append(f"{where} example {i+1}: shown output differs from real output\n"
                              f"      shown: {ex['output']!r}\n      real:  {r['output']!r}")

    exs = data.get("exercises", [])
    if not 3 <= len(exs) <= 5:
        errors.append(f"{where}: has {len(exs)} exercises (need 3-5)")
    seen = set()
    for i, ex in enumerate(exs):
        w = f"{where} exercise {i+1} ({ex.get('id')})"
        require(w, ex, ["id", "title", "prompt", "tests", "hints", "solution", "explanation"])
        if ex.get("id") in seen:
            errors.append(f"{w}: duplicate id")
        seen.add(ex.get("id"))
        check_solvable(w, ex, lang, data.get("prelude", ""))

    quiz = data.get("quiz", [])
    if len(quiz) < 4:
        errors.append(f"{where}: quiz has only {len(quiz)} questions")
    if not any(q.get("type") == "code" for q in quiz):
        warnings.append(f"{where}: quiz has no coding question")
    for i, q in enumerate(quiz):
        w = f"{where} quiz {i+1}"
        if q.get("type") == "mcq":
            require(w, q, ["question", "options", "explanation"])
            if not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < len(q.get("options", [])):
                errors.append(f"{w}: answer index invalid")
        elif q.get("type") == "code":
            check_solvable(w, q, lang, data.get("prelude", ""))
        else:
            errors.append(f"{w}: unknown type {q.get('type')}")
    for i, m in enumerate(data.get("commonMistakes", [])):
        require(f"{where} mistake {i+1}", m, ["title", "explanation"])
    return data


def main():
    curriculum = yaml.safe_load((ROOT / "content/curriculum.yaml").read_text())
    # Lessons about files create files; keep them out of the repository.
    os.chdir(tempfile.mkdtemp(prefix="cs-degree-verify-"))
    only = set(sys.argv[1:])
    ids, count = set(), 0
    all_ids = set()
    for unit in curriculum["units"]:
        folder = ROOT / "content" / f"unit-{unit['number']:02d}"
        if not folder.exists():
            continue
        lang = unit.get("language", "python")
        for p in sorted(folder.glob("lesson-*.yaml")):
            all_ids.add(yaml.safe_load(p.read_text()).get("id"))
        if only and folder.name not in only:
            continue
        for p in sorted(folder.glob("lesson-*.yaml")):
            check_lesson(p, lang, ids)
            count += 1
        proj = folder / "project.yaml"
        if proj.exists():
            data = yaml.safe_load(proj.read_text())
            w = f"{folder.name}/project.yaml"
            require(w, data, ["title", "brief", "checklist", "starter", "tests"])
            check_solvable(w, data, data.get("language", lang))
            names = {t["name"] for t in data.get("tests", [])}
            for c in data.get("checklist", []):
                if c.get("test") and c["test"] not in names:
                    errors.append(f"{w}: checklist refers to unknown test '{c['test']}'")
        elif unit.get("number") and list(folder.glob("lesson-*.yaml")):
            warnings.append(f"{folder.name}: no project.yaml")
    for g in sorted((ROOT / "content").glob("unit-*/glossary.yaml")):
        for t in yaml.safe_load(g.read_text()).get("terms", []):
            if t.get("lesson") not in all_ids:
                errors.append(f"{g.parent.name}/glossary.yaml: term '{t.get('term')}' points to unknown lesson {t.get('lesson')}")

    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print(f"\nChecked {count} lessons: {len(errors)} errors, {len(warnings)} warnings.")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
