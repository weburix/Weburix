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
  window.addEventListener('error', (event) => record('error', event.message));
  window.addEventListener('unhandledrejection', (event) => record('promise', event.reason));
  window.setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      document.body?.classList.add('loaded');
      record('boot-timeout', 'Loader fallback used');
    }
  }, 2600);
})();
