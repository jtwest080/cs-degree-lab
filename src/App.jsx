import React, { useEffect, useState } from 'react';
import { useRoute } from './lib/router.js';
import { useProgress } from './lib/progress.js';
import Layout from './components/Layout.jsx';
import Dashboard from './components/Dashboard.jsx';
import LessonView from './components/LessonView.jsx';
import ProjectView from './components/ProjectView.jsx';
import Review from './components/Review.jsx';
import Glossary from './components/Glossary.jsx';
import Settings from './components/Settings.jsx';
import { registerServiceWorker } from './lib/installApp.js';

export default function App() {
  const route = useRoute();
  const progress = useProgress();

  // Apply the theme: "system" follows the OS setting via CSS media queries.
  useEffect(() => {
    const t = progress.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }, [progress.settings.theme]);

  // When the installed app has downloaded a newer version (for example a new
  // unit), offer to reload rather than interrupting whatever is on screen.
  const [applyUpdate, setApplyUpdate] = useState(null);
  useEffect(() => registerServiceWorker((apply) => setApplyUpdate(() => apply)), []);

  let page;
  switch (route.page) {
    case 'lesson':
      page = <LessonView key={route.param} lessonId={route.param} />;
      break;
    case 'project':
      page = <ProjectView key={route.param} unitNumber={Number(route.param)} />;
      break;
    case 'review':
      page = <Review />;
      break;
    case 'glossary':
      page = <Glossary initialQuery={route.param} />;
      break;
    case 'settings':
      page = <Settings />;
      break;
    default:
      page = <Dashboard />;
  }
  return (
    <>
      <Layout route={route}>{page}</Layout>
      {applyUpdate && (
        <div className="update-banner" role="status">
          <span>A new version of CS Degree Lab is ready.</span>
          <button className="btn btn-primary" onClick={applyUpdate}>Reload</button>
          <button className="btn" onClick={() => setApplyUpdate(null)}>Later</button>
        </div>
      )}
    </>
  );
}
