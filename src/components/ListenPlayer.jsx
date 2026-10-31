import React, { useEffect, useRef, useState } from 'react';
import { chunks, collectBlocks, englishVoices, speechSupported } from '../lib/readAloud.js';

const SPEEDS = [0.8, 1, 1.25, 1.5, 1.75];
const PREFS_KEY = 'cs-degree-lab:listen';

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
}
function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* preferences are a convenience; ignore storage errors */
  }
}

/** "Listen" button for the lesson header, plus the player bar while reading. */
export default function ListenPlayer({ lessonId }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [voices, setVoices] = useState([]);
  const [prefs, setPrefs] = useState(loadPrefs);
  const blocks = useRef([]);
  const run = useRef(0); // bumps whenever playback restarts, so stale callbacks stop

  useEffect(() => {
    if (!speechSupported) return undefined;
    const refresh = () => setVoices(englishVoices());
    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh);
  }, []);

  // Stop talking when leaving the lesson.
  useEffect(() => () => stop(), [lessonId]);

  useEffect(() => {
    document.body.classList.toggle('listening', active);
    return () => document.body.classList.remove('listening');
  }, [active]);

  if (!speechSupported) return null;

  const mark = (i) => {
    document.querySelectorAll('.reading-now').forEach((el) => el.classList.remove('reading-now'));
    const block = blocks.current[i];
    if (!block) return;
    block.el.classList.add('reading-now');
    block.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const speakFrom = (i, current = prefs) => {
    const synth = window.speechSynthesis;
    const id = ++run.current;
    synth.cancel();
    if (i >= blocks.current.length) {
      setPlaying(false);
      mark(-1);
      return;
    }
    setIndex(i);
    setPlaying(true);
    mark(i);
    const parts = chunks(blocks.current[i].text);
    const voice = voices.find((v) => v.voiceURI === current.voice) || voices[0];
    parts.forEach((part, n) => {
      const u = new SpeechSynthesisUtterance(part);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'en-GB';
      u.rate = current.rate || 1;
      if (n === parts.length - 1) {
        u.onend = () => {
          if (run.current === id) speakFrom(i + 1, current);
        };
      }
      synth.speak(u);
    });
  };

  const start = () => {
    blocks.current = collectBlocks();
    setTotal(blocks.current.length);
    setActive(true);
    speakFrom(0);
  };

  function stop() {
    run.current++;
    if (speechSupported) window.speechSynthesis.cancel();
    document.querySelectorAll('.reading-now').forEach((el) => el.classList.remove('reading-now'));
    setPlaying(false);
    setActive(false);
  }

  const pause = () => {
    run.current++;
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  const change = (next) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    savePrefs(merged);
    if (playing) speakFrom(index, merged);
  };

  return (
    <>
      <button className="btn listen-btn" onClick={active ? stop : start}>
        {active ? '■ Stop reading' : '🔊 Listen to this lesson'}
      </button>
      {active && (
        <div className="listen-bar" role="region" aria-label="Read aloud">
          <div className="listen-controls">
            <button className="btn-ghost" onClick={() => speakFrom(Math.max(0, index - 1))} aria-label="Previous paragraph">⏮</button>
            {playing ? (
              <button className="btn btn-primary listen-play" onClick={pause} aria-label="Pause">❚❚</button>
            ) : (
              <button className="btn btn-primary listen-play" onClick={() => speakFrom(index)} aria-label="Play">▶</button>
            )}
            <button className="btn-ghost" onClick={() => speakFrom(index + 1)} aria-label="Next paragraph">⏭</button>
            <span className="listen-pos muted small">{Math.min(index + 1, total)} / {total}</span>
          </div>
          <div className="listen-settings">
            <select value={prefs.rate || 1} onChange={(e) => change({ rate: Number(e.target.value) })} aria-label="Speed">
              {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
            </select>
            {voices.length > 1 && (
              <select value={prefs.voice || voices[0]?.voiceURI} onChange={(e) => change({ voice: e.target.value })} aria-label="Voice">
                {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
              </select>
            )}
            <button className="btn-ghost" onClick={stop} aria-label="Close player">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
