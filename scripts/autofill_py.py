#!/usr/bin/env python3
"""Fill `output: |` + AUTO placeholders in lesson files with the real output of each example.

Usage: python3 scripts/autofill_py.py content/unit-10/lesson-01-x.yaml [...]
"""
import re, subprocess, sys, tempfile, os, yaml

for path in sys.argv[1:]:
    text = open(path).read()
    data = yaml.safe_load(text)
    outs = []
    for ex in data.get('examples', []):
        if str(ex.get('output', '')).strip() == 'AUTO':
            with tempfile.TemporaryDirectory() as d:
                r = subprocess.run([sys.executable, '-I', '-c', ex['code']], capture_output=True, text=True, cwd=d, timeout=60)
            if r.returncode:
                print(f"ERROR in example '{ex['title']}':\n{r.stderr}")
                outs.append('ERROR\n')
            else:
                outs.append(r.stdout)
    it = iter(outs)
    def repl(m):
        o = next(it)
        body = ''.join((m.group(2) + l if l.strip() else '') + '\n' for l in o.rstrip('\n').split('\n'))
        return m.group(1) + body.rstrip('\n')
    new = re.sub(r'(output: \|\n)(\s+)AUTO', repl, text)
    open(path, 'w').write(new)
    for o in outs:
        print(o)
