import { useEffect, useState } from 'react';
import { useProgress } from './progress.js';

/** True when the app is currently showing dark colours (explicit or via OS setting). */
export function useDarkMode() {
  const { settings } = useProgress();
  const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const [osDark, setOsDark] = useState(query ? query.matches : false);
  useEffect(() => {
    if (!query) return undefined;
    const fn = (e) => setOsDark(e.matches);
    query.addEventListener('change', fn);
    return () => query.removeEventListener('change', fn);
  }, [query]);
  return settings.theme === 'dark' || (settings.theme === 'system' && osDark);
}
