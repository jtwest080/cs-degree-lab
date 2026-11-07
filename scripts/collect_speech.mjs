// Lists every paragraph the Listen player reads, exactly as it reads them, by
// opening each lesson of the built app (dist/) in a headless browser.
// Writes speech.json: { "unit-01": { "<hash>": "<text>", ... }, ... }
// Usage: npm run build && node scripts/collect_speech.mjs
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import yaml from 'js-yaml';
import { chromium } from 'playwright';

const DIST = path.resolve('dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  const file = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
  if (!target.startsWith(DIST) || !fs.existsSync(target)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}/`;

const units = fs.readdirSync('content').filter((d) => /^unit-\d+$/.test(d)).sort();
const browser = await chromium.launch();
const context = await browser.newContext({ serviceWorkers: 'block' });
await context.addInitScript(() => localStorage.setItem('cs-degree-lab:progress:v1', JSON.stringify({ settings: { theme: 'light', unlockAll: true } })));

// A fresh page per lesson, with a few retries: the app also starts a Python
// worker in the background, which can occasionally slow the first render.
async function readLesson(id) {
  for (let attempt = 1; ; attempt++) {
    const page = await context.newPage();
    try {
      await page.goto(`${base}#/lesson/${id}`);
      await page.waitForSelector('#summary', { timeout: 60000 });
      return await page.evaluate(() => window.__csLabSpeech());
    } catch (err) {
      if (attempt === 3) throw err;
      console.log(`${id}: retrying (${err.message.split('\n')[0]})`);
    } finally {
      await page.close();
    }
  }
}

const speech = {};
let count = 0;
for (const unit of units) {
  speech[unit] = {};
  const files = fs.readdirSync(path.join('content', unit)).filter((f) => f.startsWith('lesson-')).sort();
  for (const f of files) {
    const { id } = yaml.load(fs.readFileSync(path.join('content', unit, f), 'utf8'));
    const blocks = await readLesson(id);
    if (!blocks.length) throw new Error(`No paragraphs found in ${id}`);
    for (const b of blocks) speech[unit][b.hash] = b.text;
    count += blocks.length;
    console.log(`${id}: ${blocks.length} paragraphs`);
  }
}
await browser.close();
server.close();
fs.writeFileSync('speech.json', JSON.stringify(speech, null, 1));
console.log(`Wrote speech.json: ${count} paragraphs in ${units.length} units`);
