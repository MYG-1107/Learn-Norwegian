(() => {
  'use strict';
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((error) => {
        // The core learning site remains usable if offline caching cannot be registered.
        console.info('Offline cache not enabled in this browser.', error);
      });
    });
  }
})();
