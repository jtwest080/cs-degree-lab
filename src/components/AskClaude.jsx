import React, { useMemo, useState } from 'react';
import { getState } from '../lib/progress.js';

// "Ask Claude": packs the part of the lesson the learner is stuck on (and
// their code for an exercise) into a ready-made message, copies it, and opens
// Claude in a new tab. Nothing is sent anywhere by the app itself, and no API
// key or paid service is needed: the learner uses their own Claude account.

const CLAUDE_URL = 'https://claude.ai/new';
// Long links get cut off by browsers, so very long messages are only copied.
const MAX_LINK_CHARS = 6000;

function partsOf(lesson, unit) {
  const code = getState().code || {};
  const parts = [
    {
      key: 'objective',
      label: 'Learning objective',
      text: `Learning objective:\n${lesson.objective}${lesson.outcomes ? '\n' + lesson.outcomes.map((o) => `- ${o}`).join('\n') : ''}`,
    },
    ...lesson.sections.map((s, i) => ({ key: `section-${i}`, label: s.heading, text: `## ${s.heading}\n\n${s.body}` })),
    ...lesson.examples.map((ex, i) => ({
      key: `example-${i}`,
      label: `Example ${i + 1}: ${ex.title}`,
      text: `Worked example: ${ex.title}\n\n${ex.intro || ''}\n\`\`\`\n${ex.code}\`\`\`\nOutput:\n\`\`\`\n${ex.output || ''}\`\`\``,
    })),
    ...lesson.exercises.map((ex, i) => {
      const mine = code[`${lesson.id}/ex/${ex.id}`];
      return {
        key: `exercise-${i}`,
        label: `Exercise ${i + 1}: ${ex.title}`,
        exercise: true,
        text:
          `Exercise: ${ex.title}\n\n${ex.prompt}\n` +
          (mine && mine !== ex.starter ? `\nMy code so far:\n\`\`\`\n${mine}\n\`\`\`` : `\nStarter code:\n\`\`\`\n${ex.starter || ''}\`\`\``),
      };
    }),
    { key: 'summary', label: 'Summary', text: `Summary:\n${lesson.summary.map((s) => `- ${s}`).join('\n')}` },
  ];
  return parts.map((p) => ({ ...p, text: `(Unit ${unit.number}: ${unit.title}, Lesson ${lesson.number}: ${lesson.title})\n\n${p.text}` }));
}

function buildMessage(part, question) {
  const ask = question.trim() || (part.exercise
    ? "I'm stuck on this exercise. Please give me a hint that helps me work it out myself, without giving me the full answer."
    : 'Please explain this to me in simpler words, with an everyday example, and check my understanding with one quick question at the end.');
  return (
    "I'm a complete beginner working through a computer science course. Here is the part I'm on:\n\n" +
    `${part.text}\n\n` +
    `My question: ${ask}`
  );
}

export default function AskClaude({ lesson, unit }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('section-0');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const parts = useMemo(() => (open ? partsOf(lesson, unit) : []), [open, lesson, unit]);
  const part = parts.find((p) => p.key === choice) || parts[0];

  const message = part ? buildMessage(part, question) : '';
  const tooLong = message.length > MAX_LINK_CHARS;
  const link = tooLong ? CLAUDE_URL : `${CLAUDE_URL}?q=${encodeURIComponent(message)}`;

  // A real link (not window.open) so it works inside the hosted preview too.
  // Copying happens as well, in case Claude opens with an empty message box.
  const copy = () => {
    const done = (copied) =>
      setStatus(
        tooLong
          ? copied ? 'That part is long, so paste it into Claude yourself: it is copied.' : 'Copying was blocked. Open "Show message" and copy it by hand.'
          : copied ? 'Opened Claude. If the message box is empty, paste: it is copied.' : 'Opened Claude.',
      );
    try {
      navigator.clipboard.writeText(message).then(() => done(true), () => done(false));
    } catch {
      done(false);
    }
  };

  if (!open) {
    return (
      <button className="ask-claude-fab btn btn-primary" onClick={() => setOpen(true)}>
        ✦ Ask Claude
      </button>
    );
  }

  return (
    <div className="ask-claude-panel card" role="dialog" aria-label="Ask Claude">
      <div className="ask-claude-head">
        <h3>Ask Claude about this lesson</h3>
        <button className="btn-ghost small" onClick={() => { setOpen(false); setStatus(''); }} aria-label="Close">✕</button>
      </div>
      <label className="ask-claude-field">
        <span>What are you looking at?</span>
        <select value={part?.key} onChange={(e) => { setChoice(e.target.value); setStatus(''); }}>
          {parts.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </label>
      <label className="ask-claude-field">
        <span>Your question (optional)</span>
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={part?.exercise ? 'Leave blank to ask for a hint, not the answer' : 'Leave blank to ask for a simpler explanation'}
        />
      </label>
      <div className="ask-claude-actions">
        <a className="btn btn-primary" href={link} target="_blank" rel="noopener noreferrer" onClick={copy}>Open in Claude ↗</a>
        <details>
          <summary>Show message</summary>
          <pre className="ask-claude-preview">{message}</pre>
        </details>
      </div>
      {status && <p className="muted small">{status}</p>}
      <p className="muted small">Opens claude.ai in a new tab with your own Claude account. The app itself never sends anything.</p>
    </div>
  );
}
