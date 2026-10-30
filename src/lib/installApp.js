// Registers the service worker that makes the app installable and usable
// offline. It does nothing in development or where service workers aren't
// allowed (such as the hosted preview), so the app works the same either way.
export function registerServiceWorker(onUpdateReady) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  navigator.serviceWorker
    .register('./sw.js')
    .then((registration) => {
      const offer = (worker) => onUpdateReady(() => worker.postMessage('skip-waiting'));
      if (registration.waiting && navigator.serviceWorker.controller) offer(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          // Only an update if an older version is already running this page.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
        });
      });
      // Check for a new version each time the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    })
    .catch(() => {});
}
