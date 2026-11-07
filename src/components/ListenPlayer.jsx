import React, { useEffect, useRef, useState } from 'react';
import { chunks, collectBlocks, englishVoices, hashText, loadRecordings, speechSupported } from '../lib/readAloud.js';

const SPEEDS = [0.8, 1, 1.25, 1.5, 1.75];
const PREFS_KEY = 'cs-degree-lab:listen';
const NATURAL = 'natural';

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

/**
 * "Listen" button for the lesson header, plus the player bar while reading.
 * Paragraphs with a recording are played with the natural voice; the rest
 * (or everything, if the learner picks a device voice) use speech synthesis.
 */
export default function ListenPlayer({ lessonId }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [voices, setVoices] = useState([]);
  const [natural, setNatural] = useState({ voice: null, map: new Map() });
  const [prefs, setPrefs] = useState(loadPrefs);
  const blocks = useRef([]);
  const audio = useRef(null);
  const run = useRef(0); // bumps whenever playback restarts, so stale callbacks stop

  useEffect(() => {
    loadRecordings().then(setNatural);
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

  const hasNatural = natural.map.size > 0;
  if (!speechSupported && !hasNatural) {
    return (
      <button className="btn listen-btn" disabled title="This browser has no built-in speech voices">
        🔊 Listen isn't available in this browser
      </button>
    );
  }

  const voiceChoice = prefs.voice && (prefs.voice !== NATURAL || hasNatural) ? prefs.voice : hasNatural ? NATURAL : voices[0]?.voiceURI;

  const mark = (i) => {
    document.querySelectorAll('.reading-now').forEach((el) => el.classList.remove('reading-now'));
    const block = blocks.current[i];
    if (!block) return;
    block.el.classList.add('reading-now');
    block.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const silence = () => {
    if (speechSupported) window.speechSynthesis.cancel();
    if (audio.current) {
      audio.current.onended = null;
      audio.current.onerror = null;
      audio.current.pause();
    }
  };

  const recordingFor = (i, current) => {
    if (current.voiceChoice !== NATURAL) return null;
    return natural.map.get(blocks.current[i]?.hash) || null;
  };

  const speakFrom = (i, current = { ...prefs, voiceChoice }) => {
    const id = ++run.current;
    silence();
    if (i >= blocks.current.length) {
      setPlaying(false);
      mark(-1);
      return;
    }
    setIndex(i);
    setPlaying(true);
    mark(i);
    const next = () => {
      if (run.current === id) speakFrom(i + 1, current);
    };

    const url = recordingFor(i, current);
    if (url) {
      const el = audio.current;
      el.src = url;
      el.playbackRate = current.rate || 1;
      el.onended = next;
      // A missing or unplayable file falls back to the device voice.
      el.onerror = () => {
        if (run.current === id) speakDevice(i, current, next);
      };
      el.play().catch(() => {
        if (run.current === id) speakDevice(i, current, next);
      });
      // Warm the cache for the next paragraph so there's no gap.
      const upcoming = recordingFor(i + 1, current);
      if (upcoming) fetch(upcoming).catch(() => {});
      return;
    }
    speakDevice(i, current, next);
  };

  const speakDevice = (i, current, next) => {
    if (!speechSupported) {
      next();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const parts = chunks(blocks.current[i].text);
    const voice = voices.find((v) => v.voiceURI === current.voiceChoice) || voices[0];
    parts.forEach((part, n) => {
      const u = new SpeechSynthesisUtterance(part);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'en-US';
      u.rate = current.rate || 1;
      if (n === parts.length - 1) u.onend = next;
      synth.speak(u);
    });
  };

  const start = () => {
    // Created inside the tap, so phones allow it to keep playing paragraph after paragraph.
    if (!audio.current) audio.current = new Audio();
    blocks.current = collectBlocks().map((b) => ({ ...b, hash: hashText(b.text) }));
    setTotal(blocks.current.length);
    setActive(true);
    speakFrom(0);
  };

  function stop() {
    run.current++;
    silence();
    document.querySelectorAll('.reading-now').forEach((el) => el.classList.remove('reading-now'));
    setPlaying(false);
    setActive(false);
  }

  const pause = () => {
    run.current++;
    silence();
    setPlaying(false);
  };

  const change = (update) => {
    const merged = { ...prefs, ...update };
    setPrefs(merged);
    savePrefs(merged);
    const choice = merged.voice && (merged.voice !== NATURAL || hasNatural) ? merged.voice : voiceChoice;
    if (playing) speakFrom(index, { ...merged, voiceChoice: choice });
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
            {(hasNatural ? 1 : 0) + voices.length > 1 && (
              <select value={voiceChoice} onChange={(e) => change({ voice: e.target.value })} aria-label="Voice">
                {hasNatural && <option value={NATURAL}>✨ {natural.voice}</option>}
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
