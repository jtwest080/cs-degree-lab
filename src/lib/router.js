// Minimal hash router: "#/lesson/u1-binary" -> { page: 'lesson', param: 'u1-binary' }.
// Hash URLs work on any static host (and from a downloaded folder) with no server config.
import { useEffect, useState } from 'react';

function parse() {
  const [, page = '', param = ''] = (window.location.hash || '#/').split('/');
  return { page: page || 'dashboard', param: decodeURIComponent(param) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const href = {
  dashboard: () => '#/',
  lesson: (id) => `#/lesson/${encodeURIComponent(id)}`,
  project: (unit) => `#/project/${unit}`,
  review: () => '#/review',
  glossary: (q) => (q ? `#/glossary/${encodeURIComponent(q)}` : '#/glossary'),
  settings: () => '#/settings',
};
