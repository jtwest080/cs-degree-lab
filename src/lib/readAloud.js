// Read-aloud for lessons, using the speech voices built into the device
// (the Web Speech API). It's free, needs no account, and works offline with
// most voices. The lesson is read straight from the page, one paragraph at a
// time, so the current paragraph can be highlighted as it's spoken.

const READ_FROM = ['#objective', '#learn', '#examples', '#mistakes', '#summary'];
const BLOCKS = 'h1, h2, h3, h4, p, li, blockquote, pre, table';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** The elements to read, in page order. Code and tables are announced, not read out. */
export function collectBlocks(root = document) {
  const blocks = [];
  for (const sel of READ_FROM) {
    const section = root.querySelector(sel);
    if (!section) continue;
    for (const el of section.querySelectorAll(BLOCKS)) {
      // Skip anything inside a block we already take whole (a paragraph in a
      // list item or callout), anything hidden, and editor/output widgets.
      if (el.parentElement.closest('li, blockquote, pre, table')) continue;
      if (el.closest('.output, .cm-editor, details:not([open]), .line-notes')) continue;
      const text = spokenText(el);
      if (text) blocks.push({ el, text });
    }
  }
  return blocks;
}

function spokenText(el) {
  const tag = el.tagName;
  if (tag === 'PRE') return 'Here is some code. Have a look at it on screen.';
  if (tag === 'TABLE') return 'There is a table here. Have a look at it on screen.';
  let text = el.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  text = text
    .replace(/\bO\(([^)]*)\)/g, 'big O of $1')
    .replace(/→/g, ' to ')
    .replace(/←/g, ' from ')
    .replace(/×/g, ' times ')
    .replace(/−/g, ' minus ')
    .replace(/≤/g, ' less than or equal to ')
    .replace(/≥/g, ' greater than or equal to ')
    .replace(/≠/g, ' not equal to ')
    .replace(/[⚠✓✗🔒]/gu, '')
    .replace(/`/g, '');
  return text;
}

/** Long paragraphs are split into sentences: some browsers cut off long utterances. */
export function chunks(text) {
  if (text.length < 220) return [text];
  return text.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [text];
}

/** English voices, the most natural-sounding first. */
export function englishVoices() {
  if (!speechSupported) return [];
  const score = (v) =>
    (/(natural|neural|premium|enhanced|siri|google)/i.test(v.name) ? 0 : 1) * 10 +
    (/en[-_](GB|US)/i.test(v.lang) ? 0 : 1) +
    (v.localService ? 0 : 0.5);
  return window.speechSynthesis
    .getVoices()
    .filter((v) => /^en/i.test(v.lang))
    .sort((a, b) => score(a) - score(b));
}

// ---------------------------------------------------------------- natural voice
// Recordings made with a neural voice (see scripts/make_voice.py) live in
// audio/<unit>/<hash>.m4a, one per paragraph, named by a hash of the exact text
// read. audio/index.json lists which exist; anything missing (new text, or
// no recordings published) falls back to the device's own voices.

/** cyrb53: a small, fast string hash. Used only to name recordings. */
export function hashText(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

let recordings = null;
/** Map of text hash → recording URL (empty if none are published). */
export function loadRecordings() {
  if (!recordings) {
    recordings = fetch('./audio/index.json')
      .then((r) => (r.ok ? r.json() : { files: {} }))
      .then((data) => {
        const map = new Map();
        for (const [unit, hashes] of Object.entries(data.files || {})) {
          for (const h of hashes) map.set(h, `./audio/${unit}/${h}.m4a`);
        }
        return { voice: data.voice || 'Natural voice', map };
      })
      .catch(() => ({ voice: null, map: new Map() }));
  }
  return recordings;
}

// The recording script reads the exact paragraphs the player will read.
if (typeof window !== 'undefined') {
  window.__csLabSpeech = () => collectBlocks().map((b) => ({ text: b.text, hash: hashText(b.text) }));
}
