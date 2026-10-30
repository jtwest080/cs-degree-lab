# Test harness that runs inside Pyodide (Python compiled to WebAssembly).
#
# It runs the learner's code in a fresh namespace, captures everything it
# prints, feeds input() from a list of lines, and runs exercise tests against
# the result. Test code can use these names:
#   output      - everything the learner's program printed
#   run(*lines) - re-run the learner's program with new input lines; returns output
#   source      - the learner's source code as a string
#   capture(f, *args) - call f(*args) and return (what it printed, what it returned)
#   uses_loop()  - True if the code contains a for/while loop or a comprehension
#                  (ignores comments and strings, unlike searching `source`)
#   plus every variable and function the learner defined.

import ast
import builtins
import io
import linecache
import sys
import traceback

USER_FILE = "<your code>"
MAX_OUTPUT = 200_000


class _LimitedOutput(io.StringIO):
    """A StringIO that refuses to grow forever (protects against print loops)."""

    def write(self, s):
        if self.tell() + len(s) > MAX_OUTPUT:
            raise RuntimeError(
                "Your program printed too much output (over 200,000 characters). "
                "Is there a loop that never stops?"
            )
        return super().write(s)


def _make_input(lines, out, echo):
    feed = [str(x) for x in lines]

    def _input(prompt=""):
        out.write(str(prompt))
        if not feed:
            raise EOFError(
                "input() was called but there are no more input lines. "
                "Type the input your program needs into the Input box, one value per line."
            )
        value = feed.pop(0)
        if echo:
            out.write(value + "\n")
        return value

    return _input


def _format_error(err):
    """Build a beginner-friendly traceback that only shows the learner's lines."""
    if isinstance(err, SyntaxError) and err.filename == USER_FILE:
        text = (err.text or "").rstrip("\n")
        caret = ""
        if err.offset and text:
            caret = "\n    " + " " * (err.offset - 1) + "^"
        return f"  Line {err.lineno}\n    {text}{caret}\n{type(err).__name__}: {err.msg}"
    frames = [f for f in traceback.extract_tb(err.__traceback__) if f.filename == USER_FILE]
    lines = ["Traceback (most recent call last):"] if frames else []
    for f in frames:
        where = "" if f.name == "<module>" else f", in {f.name}"
        lines.append(f"  Line {f.lineno}{where}")
        if f.line:
            lines.append(f"    {f.line.strip()}")
    lines.append(f"{type(err).__name__}: {err}")
    return "\n".join(lines)


def _execute(src, inputs=(), prelude="", echo=True):
    """Run src in a fresh namespace. Returns (namespace, printed_output, error_text_or_None)."""
    out = _LimitedOutput()
    ns = {"__name__": "__main__", "__builtins__": builtins}
    linecache.cache[USER_FILE] = (len(src), None, src.splitlines(True), USER_FILE)
    old = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = out
    error = None
    try:
        if prelude:
            exec(compile(prelude, "<prelude>", "exec"), ns)
        ns["input"] = _make_input(inputs, out, echo)
        exec(compile(src, USER_FILE, "exec"), ns)
    except BaseException as e:  # includes SystemExit and KeyboardInterrupt
        error = _format_error(e)
    finally:
        sys.stdout, sys.stderr = old
    return ns, out.getvalue(), error


def _uses_loop(src):
    loops = (ast.For, ast.While, ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)
    try:
        return any(isinstance(node, loops) for node in ast.walk(ast.parse(src)))
    except SyntaxError:
        return False


def run_program(src, inputs, prelude=""):
    _, output, error = _execute(src, inputs, prelude, echo=True)
    return {"output": output, "error": error}


def run_tests(src, tests, inputs=(), prelude=""):
    ns, output, error = _execute(src, inputs, prelude, echo=False)
    if error:
        return {
            "output": output,
            "error": error,
            "results": [
                {"name": t["name"], "passed": False,
                 "message": "Your code stopped with an error before this test could run (see the error above)."}
                for t in tests
            ],
        }

    def run(*lines):
        _, out, err = _execute(src, lines, prelude, echo=False)
        if err:
            raise RuntimeError(f"With input {list(lines)!r} your program crashed:\n{err}")
        return out

    def capture(fn, *args, **kwargs):
        buf = _LimitedOutput()
        saved = sys.stdout
        sys.stdout = buf
        try:
            value = fn(*args, **kwargs)
        finally:
            sys.stdout = saved
        return buf.getvalue(), value

    results = []
    for t in tests:
        env = dict(ns)
        env.update(output=output, run=run, source=src, capture=capture,
                   uses_loop=lambda: _uses_loop(src))
        old = sys.stdout
        sys.stdout = _LimitedOutput()  # tests may call learner functions that print
        try:
            exec(compile(t["code"], "<test>", "exec"), env)
            results.append({"name": t["name"], "passed": True, "message": ""})
        except AssertionError as e:
            results.append({"name": t["name"], "passed": False, "message": str(e) or "The check did not pass."})
        except BaseException as e:
            results.append({"name": t["name"], "passed": False, "message": f"{type(e).__name__}: {e}"})
        finally:
            sys.stdout = old
    return {"output": output, "error": None, "results": results}
