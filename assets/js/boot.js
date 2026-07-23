(() => {
  const root = document.documentElement;
  root.classList.add('weburix-js');
  window.__WEBURIX_ERRORS__ = [];
  const record = (type, detail) => {
    try {
      window.__WEBURIX_ERRORS__.push({ type, detail: String(detail || ''), time: Date.now() });
      if (window.__WEBURIX_ERRORS__.length > 20) window.__WEBURIX_ERRORS__.shift();
    } catch (_) {}
  };
  window.addEventListener('error', (event) => {
    const target = event.target;
    const resource = target && target !== window ? (target.currentSrc || target.src || target.href || target.tagName) : '';
    record(resource ? 'resource' : 'error', resource || event.message || 'Unknown runtime error');
  }, true);
  window.addEventListener('unhandledrejection', (event) => record('promise', event.reason || 'Unhandled promise rejection'));
  window.setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      document.body?.classList.add('loaded');
      record('boot-timeout', 'Loader fallback used');
    }
    if (!window.__WEBURIX_APP_READY__) {
      document.querySelectorAll('.reveal:not(.visible)').forEach((element) => element.classList.add('visible'));
      document.documentElement.classList.add('weburix-app-fallback');
      record('app-fallback', 'Main application did not signal ready; content was revealed safely');
    }
  }, 3200);
})();
