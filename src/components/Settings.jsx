import React, { useRef, useState } from 'react';
import { exportProgress, importProgress, resetProgress, update, useProgress } from '../lib/progress.js';

export default function Settings() {
  const progress = useProgress();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cs-degree-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      importProgress(await file.text());
      setMsg('Progress restored.');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="page narrow">
      <h1>Settings</h1>

      <section className="card setting">
        <h2>Theme</h2>
        <div className="seg">
          {['system', 'light', 'dark'].map((t) => (
            <button key={t} className={progress.settings.theme === t ? 'active' : ''} onClick={() => update((s) => { s.settings.theme = t; })}>
              {t === 'system' ? 'Match device' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="card setting">
        <h2>Your progress</h2>
        <p>Progress is saved automatically in this browser. To move it to another device or browser, download a backup and restore it there.</p>
        <button className="btn" onClick={download}>Download backup</button>{' '}
        <button className="btn" onClick={() => fileRef.current.click()}>Restore from backup</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={upload} />
        {msg && <p className="muted">{msg}</p>}
      </section>

      <section className="card setting">
        <h2>Preview mode</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={progress.settings.unlockAll}
            onChange={(e) => update((s) => { s.settings.unlockAll = e.target.checked; })}
          />
          Unlock every lesson and project (skips mastery gating)
        </label>
        <p className="muted small">Handy for browsing ahead. For real learning, leave this off: the gates make sure each lesson's foundation is solid.</p>
      </section>

      <section className="card setting danger">
        <h2>Reset</h2>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm('Erase all progress, saved code and review history? This cannot be undone.')) {
              resetProgress();
              setMsg('Progress reset.');
            }
          }}
        >
          Erase all progress
        </button>
      </section>
    </div>
  );
}
