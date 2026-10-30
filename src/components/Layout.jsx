import React, { useState } from 'react';
import { href } from '../lib/router.js';
import { update, useProgress } from '../lib/progress.js';
import { dueCards } from '../lib/srs.js';

const THEMES = ['system', 'light', 'dark'];
const THEME_LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' };

export default function Layout({ route, children }) {
  const progress = useProgress();
  const due = dueCards(progress).length;
  const [menuOpen, setMenuOpen] = useState(false);

  const cycleTheme = () =>
    update((s) => {
      s.settings.theme = THEMES[(THEMES.indexOf(s.settings.theme) + 1) % THEMES.length];
    });

  const link = (to, label, page, badge) => (
    <a href={to} className={route.page === page ? 'active' : ''} onClick={() => setMenuOpen(false)}>
      {label}
      {badge ? <span className="badge">{badge}</span> : null}
    </a>
  );

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href={href.dashboard()}>
          <span className="brand-mark" aria-hidden="true">01</span>
          <span>CS Degree Lab</span>
        </a>
        <button className="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <nav className={menuOpen ? 'open' : ''}>
          {link(href.dashboard(), 'Dashboard', 'dashboard')}
          {link(href.review(), 'Review', 'review', due)}
          {link(href.glossary(), 'Glossary', 'glossary')}
          {link(href.settings(), 'Settings', 'settings')}
          <button className="theme-btn" onClick={cycleTheme} title="Change theme (auto follows your device)">
            Theme: {THEME_LABEL[progress.settings.theme]}
          </button>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
