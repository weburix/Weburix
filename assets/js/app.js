(() => {
  const DEFAULT_LANG = 'de';
  const availableLanguages = ['de', 'en', 'sr'];
  const root = document.documentElement;
  root.classList.add('weburix-js');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  root.classList.toggle('weburix-motion-on', !reducedMotion);
  const saveData = Boolean(navigator.connection?.saveData);
  const lowPowerDevice = Number(navigator.deviceMemory || 8) <= 4 || Number(navigator.hardwareConcurrency || 8) <= 4;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches || false;
  root.classList.toggle('save-data', saveData);
  root.classList.toggle('low-power-device', lowPowerDevice);
  root.classList.toggle('coarse-pointer', coarsePointer);
  root.classList.toggle('short-viewport', window.innerHeight < 650);
  const loader = document.getElementById('loader');
  const navToggle = document.querySelector('.nav-toggle');
  const navPanel = document.querySelector('.nav-panel');
  const mobileNavMedia = window.matchMedia?.('(max-width: 1280px)');
  const languageButtons = document.querySelectorAll('[data-lang]');
  const languageMenu = document.querySelector('.language-menu');
  const languageCurrentFlag = document.querySelector('.language-current-flag');
  const languageCurrentCode = document.querySelector('.language-current-code');
  const yearEl = document.getElementById('year');
  const copyButton = document.getElementById('copy-email');
  const chatLauncher = document.getElementById('chat-launcher');
  const chatWidget = document.getElementById('chat-widget');
  const chatClose = document.getElementById('chat-close');
  const chatMessages = document.getElementById('chat-messages');
  const chatPrompts = document.getElementById('chat-prompts');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const cookieBanner = document.getElementById('cookie-banner');
  const backToTop = document.getElementById('back-to-top');
  const scrollProgress = document.getElementById('scroll-progress');
  const checkoutOptions = document.getElementById('checkout-options');
  const checkoutFilters = document.getElementById('checkout-filters');
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');
  const cartRequestButton = document.getElementById('cart-request');
  const cartClearButton = document.getElementById('cart-clear');
  const promoInput = document.getElementById('promo-code');
  const promoApplyButton = document.getElementById('promo-apply');
  const promoRemoveButton = document.getElementById('promo-remove');
  const promoStatusEl = document.getElementById('promo-status');
  const promoDiscountEl = document.getElementById('cart-discount');
  const FORM_CONFIG = {
    // Static hosting uses one explicit backend; no secret keys are stored in frontend code.
    recipient: 'info@weburix.com',
    formsubmitEndpoint: (window.WEBURIX_FORMSUBMIT_ENDPOINT || 'https://formsubmit.co/ajax/info@weburix.com')
  };
  const PAYMENT_LINKS = window.WEBURIX_PAYMENT_LINKS || {};
  const PROMOTION = window.WEBURIX_PROMOTION || {};
  const PROMO_CODES = window.WEBURIX_PROMO_CODES || {};
  const PROMO_CODE_KEY = 'weburix-promo-code';
  const SOCIALS = window.WEBURIX_SOCIALS || {};
  const CURRENCY_CONFIG = window.WEBURIX_CURRENCY || {};
  const CURRENCY_KEY = 'weburix-currency';
  const CONSENT_KEY = 'weburix-consent-v2';
  const CONSENT_VERSION = Number(window.WEBURIX_CONSENT_VERSION || 2);
  const UI_LABELS = {
    de: {
      mainNav: 'Hauptnavigation', pageNav: 'Seitennavigation', home: 'Weburix Startseite',
      menuOpen: 'Menü öffnen', menuClose: 'Menü schließen', language: 'Sprache auswählen',
      chatOpen: 'Weburix Support Chat öffnen', chatDialog: 'Weburix Support Chat', chatClose: 'Chat schließen',
      chatInput: 'Nachricht an den Weburix Assistant', send: 'Senden', backTop: 'Nach oben', loader: 'Weburix lädt'
    },
    en: {
      mainNav: 'Main navigation', pageNav: 'Page navigation', home: 'Weburix home page',
      menuOpen: 'Open menu', menuClose: 'Close menu', language: 'Choose language',
      chatOpen: 'Open Weburix support chat', chatDialog: 'Weburix support chat', chatClose: 'Close chat',
      chatInput: 'Message the Weburix Assistant', send: 'Send', backTop: 'Back to top', loader: 'Weburix is loading'
    },
    sr: {
      mainNav: 'Glavna navigacija', pageNav: 'Navigacija stranice', home: 'Weburix početna stranica',
      menuOpen: 'Otvori meni', menuClose: 'Zatvori meni', language: 'Izaberi jezik',
      chatOpen: 'Otvori Weburix chat za podršku', chatDialog: 'Weburix chat za podršku', chatClose: 'Zatvori chat',
      chatInput: 'Poruka za Weburix asistenta', send: 'Pošalji', backTop: 'Nazad na vrh', loader: 'Weburix se učitava'
    }
  };
  let activeLang = DEFAULT_LANG;
  let activeContent = WEBURIX_CONTENT[DEFAULT_LANG];
  let activeCurrency = (() => {
    try {
      const stored = localStorage.getItem(CURRENCY_KEY);
      if (['both', 'eur', 'rsd'].includes(stored)) return stored;
    } catch (_) {}
    return ['both', 'eur', 'rsd'].includes(CURRENCY_CONFIG.defaultSerbianMode) ? CURRENCY_CONFIG.defaultSerbianMode : 'both';
  })();
  let chatReturnFocus = null;
  let cookieReturnFocus = null;
  let activePromoCode = (() => {
    try { return String(sessionStorage.getItem(PROMO_CODE_KEY) || '').trim().toUpperCase(); } catch (_) { return ''; }
  })();

  function normalizeCartEntries(entries) {
    if (!Array.isArray(entries)) return [];
    const consolidated = new Map();
    entries.forEach((entry) => {
      if (!entry || typeof entry.id !== 'string') return;
      const id = entry.id.trim();
      const quantity = Math.floor(Number(entry.qty));
      if (!id || !Number.isFinite(quantity) || quantity <= 0) return;
      consolidated.set(id, Math.min(9, (consolidated.get(id) || 0) + quantity));
    });
    return [...consolidated].map(([id, qty]) => ({ id, qty }));
  }

  let cartItems = (() => {
    try {
      return normalizeCartEntries(JSON.parse(localStorage.getItem('weburix-cart') || '[]'));
    } catch (_) { return []; }
  })();

  let bootFinished = false;
  function finishBoot() {
    if (bootFinished) return;
    bootFinished = true;
    document.body.classList.add('loaded');
    window.requestAnimationFrame(() => {
      window.setTimeout(() => loader?.classList.add('hidden'), reducedMotion ? 40 : 240);
    });
  }
  if (document.readyState === 'complete') finishBoot();
  else {
    window.addEventListener('load', finishBoot, { once: true });
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(finishBoot, 700), { once: true });
  }
  window.setTimeout(finishBoot, 2200);

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function getValue(path, source) {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), source);
  }

  function updateInteractiveLabels() {
    const labels = UI_LABELS[activeLang] || UI_LABELS.de;
    document.querySelector('.site-header nav')?.setAttribute('aria-label', labels.mainNav);
    navPanel?.setAttribute('aria-label', labels.pageNav);
    document.querySelectorAll('a.brand, .footer-brand > a').forEach((link) => link.setAttribute('aria-label', labels.home));
    if (navToggle) navToggle.setAttribute('aria-label', navToggle.getAttribute('aria-expanded') === 'true' ? labels.menuClose : labels.menuOpen);
    languageMenu?.querySelector(':scope > summary')?.setAttribute('aria-label', labels.language);
    languageMenu?.querySelector('.language-menu-list')?.setAttribute('aria-label', labels.language);
    loader?.setAttribute('aria-label', labels.loader);
    chatLauncher?.setAttribute('aria-label', labels.chatOpen);
    chatWidget?.setAttribute('aria-label', labels.chatDialog);
    chatClose?.setAttribute('aria-label', labels.chatClose);
    chatInput?.setAttribute('aria-label', labels.chatInput);
    chatForm?.querySelector('button[type="submit"]')?.setAttribute('aria-label', labels.send);
    backToTop?.setAttribute('aria-label', labels.backTop);
  }


  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
  }


  function rsdRate() {
    const rate = Number(CURRENCY_CONFIG.rsdRate);
    return Number.isFinite(rate) && rate > 0 ? rate : 117.3829;
  }

  function parseEuroNumber(value) {
    const normalized = String(value || '').replace(/[.\s]/g, '').replace(',', '.');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function formatRsdNumber(euroAmount) {
    const step = Math.max(1, Number(CURRENCY_CONFIG.roundRsdTo) || 1);
    const value = Math.round((Number(euroAmount) * rsdRate()) / step) * step;
    try {
      return new Intl.NumberFormat('sr-Latn-RS', { maximumFractionDigits: 0 }).format(value);
    } catch (_) {
      return Math.round(value).toLocaleString('sr-RS');
    }
  }

  function currencyMode() {
    return activeLang === 'sr' ? activeCurrency : 'eur';
  }

  function formatPricePair(euroText, amount, suffix = '') {
    const mode = currencyMode();
    if (mode === 'eur') return euroText;
    const rsd = `≈ ${formatRsdNumber(amount)} RSD${suffix || ''}`;
    if (mode === 'rsd') return rsd;
    return `${euroText} · ${rsd}`;
  }

  function localizePriceText(value) {
    const text = String(value ?? '');
    if (activeLang !== 'sr' || !text.includes('€')) return text;

    // Match either a range such as 500–1.000 € or a single amount such as 44 €/mesečno.
    const pricePattern = /(\d[\d.\s]*)(?:\s*[–-]\s*(\d[\d.\s]*))?\s*€(\s*\/\s*(?:mesečno|mesec|sat|h|Std\.?|Monat|month|hour))?/gi;
    return text.replace(pricePattern, (full, first, second, suffix = '') => {
      if (second) {
        const firstAmount = parseEuroNumber(first);
        const secondAmount = parseEuroNumber(second);
        const euroRange = `${first.trim()}–${second.trim()} €${suffix}`;
        if (currencyMode() === 'eur') return euroRange;
        const rsdRange = `≈ ${formatRsdNumber(firstAmount)}–${formatRsdNumber(secondAmount)} RSD${suffix}`;
        return currencyMode() === 'rsd' ? rsdRange : `${euroRange} · ${rsdRange}`;
      }
      const amount = parseEuroNumber(first);
      const euro = `${first.trim()} €${suffix}`;
      return formatPricePair(euro, amount, suffix);
    });
  }

  function localized(value) {
    return localizePriceText(value);
  }

  function escapedLocalized(value) {
    return escapeHtml(localized(value));
  }

  function formatCartTotal(value, { markup = false } = {}) {
    const amount = Number(value) || 0;
    let euro;
    try {
      euro = new Intl.NumberFormat(activeLang === 'de' ? 'de-DE' : activeLang === 'sr' ? 'sr-Latn-RS' : 'en-US', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0
      }).format(amount);
    } catch (_) {
      euro = `${Math.round(amount).toLocaleString()} €`;
    }
    if (activeLang !== 'sr' || currencyMode() === 'eur') return euro;
    const rsd = `≈ ${formatRsdNumber(amount)} RSD`;
    if (currencyMode() === 'rsd') return rsd;
    return markup ? `${euro}<small class="currency-secondary">${rsd}</small>` : `${euro} · ${rsd}`;
  }

  function currencyUiLabels() {
    const rawDate = String(CURRENCY_CONFIG.rateDate || '');
    const dateParts = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const displayDate = dateParts ? `${dateParts[3]}.${dateParts[2]}.${dateParts[1]}.` : (rawDate || 'kurs ažuriran');
    return {
      title: 'Valuta',
      both: 'EUR + RSD',
      eur: 'Samo EUR',
      rsd: 'Samo RSD',
      note: `RSD iznosi su informativni, preračunati po kursu 1 EUR = ${String(rsdRate()).replace('.', ',')} RSD (${displayDate}). Ponuda i naplata se potvrđuju u EUR.`
    };
  }

  function ensureCurrencyMenu() {
    const language = document.querySelector('.language-menu');
    if (!language || document.querySelector('.currency-menu')) return;
    const labels = currencyUiLabels();
    const menu = document.createElement('details');
    menu.className = 'currency-menu';
    menu.hidden = true;
    menu.innerHTML = `
      <summary aria-label="${escapeHtml(labels.title)}">
        <span class="currency-current-symbol" aria-hidden="true">€+дин.</span>
        <span class="currency-current-code">EUR/RSD</span>
        <span class="currency-menu-arrow" aria-hidden="true">⌄</span>
      </summary>
      <div class="currency-menu-list" role="group" aria-label="${escapeHtml(labels.title)}">
        <button type="button" data-currency="both"><span aria-hidden="true">€ + дин.</span><strong>${escapeHtml(labels.both)}</strong></button>
        <button type="button" data-currency="eur"><span aria-hidden="true">€</span><strong>${escapeHtml(labels.eur)}</strong></button>
        <button type="button" data-currency="rsd"><span aria-hidden="true">дин.</span><strong>${escapeHtml(labels.rsd)}</strong></button>
      </div>`;
    language.insertAdjacentElement('afterend', menu);
    menu.addEventListener('toggle', () => {
      if (menu.open) {
        language.removeAttribute('open');
        closeMobileNav();
      }
    });
    menu.addEventListener('click', (event) => {
      const button = event.target.closest('[data-currency]');
      if (!button) return;
      const mode = button.dataset.currency;
      if (!['both', 'eur', 'rsd'].includes(mode)) return;
      activeCurrency = mode;
      try { localStorage.setItem(CURRENCY_KEY, mode); } catch (_) {}
      menu.removeAttribute('open');
      setLanguage(activeLang, { currencyRefresh: true });
    });
  }

  function updateCurrencyUI() {
    ensureCurrencyMenu();
    const menu = document.querySelector('.currency-menu');
    if (!menu) return;
    const visible = activeLang === 'sr';
    menu.hidden = !visible;
    menu.toggleAttribute('inert', !visible);
    if (!visible) menu.removeAttribute('open');
    const codes = { both: 'EUR/RSD', eur: 'EUR', rsd: 'RSD' };
    const symbols = { both: '€+дин.', eur: '€', rsd: 'дин.' };
    const code = menu.querySelector('.currency-current-code');
    const symbol = menu.querySelector('.currency-current-symbol');
    if (code) code.textContent = codes[activeCurrency] || codes.both;
    if (symbol) symbol.textContent = symbols[activeCurrency] || symbols.both;
    menu.querySelectorAll('[data-currency]').forEach((button) => {
      const active = button.dataset.currency === activeCurrency;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-currency-note]').forEach((node) => node.remove());
    if (!visible) return;
    const labels = currencyUiLabels();
    const anchors = [document.querySelector('[data-vat-notice]'), document.getElementById('checkout-options')].filter(Boolean);
    [...new Set(anchors)].forEach((anchor) => {
      const note = document.createElement('p');
      note.className = 'currency-rate-note reveal visible';
      note.dataset.currencyNote = '';
      note.textContent = labels.note;
      anchor.insertAdjacentElement('beforebegin', note);
    });
  }

  function isPromotionActive() {
    if (PROMOTION.enabled !== true) return false;
    const now = Date.now();
    const starts = PROMOTION.startsAt ? Date.parse(PROMOTION.startsAt) : NaN;
    const ends = PROMOTION.endsAt ? Date.parse(PROMOTION.endsAt) : NaN;
    // Safety rule: a promotion without a valid end date is never displayed.
    if (!Number.isFinite(ends)) return false;
    if (Number.isFinite(starts) && now < starts) return false;
    if (now > ends) return false;
    return true;
  }

  function promotionLabel() {
    const labels = PROMOTION.label || {};
    return String(labels[activeLang] || labels.de || `${Number(PROMOTION.percent || 10)}%`);
  }

  function promotionPriceMarkup(oldPrice) {
    if (!isPromotionActive() || !oldPrice) return '';
    return `<span class="promo-comparison"><del>${escapeHtml(oldPrice)}</del><small>${escapeHtml(promotionLabel())}</small></span>`;
  }

  function updatePromotionStatic() {
    const active = isPromotionActive();
    root.classList.toggle('promotion-active', active);
    const consultingOld = document.querySelector('[data-promo-consulting-old]');
    const consultingBlockOld = document.querySelector('[data-promo-consulting-block-old]');
    if (consultingOld) {
      consultingOld.hidden = !active;
      consultingOld.textContent = localized(activeContent.consulting?.oldPrice || '');
    }
    if (consultingBlockOld) {
      consultingBlockOld.hidden = !active;
      consultingBlockOld.textContent = localized(activeContent.consulting?.oldBlock || '');
    }
  }

  function readStoredLanguage() {
    try {
      const stored = localStorage.getItem('weburix-language');
      return availableLanguages.includes(stored) ? stored : '';
    } catch (_) { return ''; }
  }

  function browserLanguageFallback() {
    const language = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
    if (language.startsWith('de')) return 'de';
    if (/^(sr|hr|bs|mk|sl)/.test(language)) return 'sr';
    return 'en';
  }

  function languageForCountry(countryCode) {
    const code = String(countryCode || '').toUpperCase();
    if (['DE', 'AT'].includes(code)) return 'de';
    if (['RS', 'HR', 'BA', 'ME', 'MK', 'SI', 'XK'].includes(code)) return 'sr';
    return code ? 'en' : DEFAULT_LANG;
  }

  async function detectCountryCode() {
    if (window.WEBURIX_AUTO_LANGUAGE === false || !hasFunctionalConsent()) return '';
    try {
      const cached = sessionStorage.getItem('weburix-country');
      if (/^[A-Z]{2}$/.test(cached || '')) return cached;
    } catch (_) {}

    const endpoint = String(window.WEBURIX_GEO_ENDPOINT || 'https://api.country.is/');
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      }, 1800);
      if (!response.ok) return '';
      const data = await response.json();
      const country = String(data.country || '').toUpperCase();
      if (/^[A-Z]{2}$/.test(country)) {
        try { sessionStorage.setItem('weburix-country', country); } catch (_) {}
        return country;
      }
    } catch (_) {}
    return '';
  }

  async function resolveInitialLanguage() {
    const stored = readStoredLanguage();
    if (stored) return stored;
    const country = await detectCountryCode();
    return languageForCountry(country);
  }

  function setLanguage(lang, options = {}) {
    const nextLang = availableLanguages.includes(lang) ? lang : DEFAULT_LANG;
    activeLang = nextLang;
    activeContent = WEBURIX_CONTENT[nextLang];
    root.lang = nextLang === 'sr' ? 'sr-Latn' : nextLang;
    updateInteractiveLabels();

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = getValue(node.dataset.i18n, activeContent);
      if (typeof value === 'string') node.textContent = localized(value);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const value = getValue(node.dataset.i18nPlaceholder, activeContent);
      if (typeof value === 'string') node.setAttribute('placeholder', localized(value));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
      const value = getValue(node.dataset.i18nAriaLabel, activeContent);
      if (typeof value === 'string') node.setAttribute('aria-label', localized(value));
    });

    languageButtons.forEach((button) => {
      const isActive = button.dataset.lang === nextLang;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
      if (isActive) {
        const flag = button.querySelector('img');
        if (languageCurrentFlag && flag) languageCurrentFlag.src = flag.getAttribute('src');
        if (languageCurrentCode) languageCurrentCode.textContent = nextLang.toUpperCase();
      }
    });

    updateCurrencyUI();

    if (options.persist) {
      try { localStorage.setItem('weburix-language', nextLang); } catch (_) {}
    }

    renderCards('service-cards', activeContent.serviceCards, serviceCardTemplate);
    renderServiceTabs(activeContent.serviceTabs);
    renderCards('idea-cards', activeContent.ideas.items, ideaCardTemplate);
    renderCards('quality-cards', activeContent.quality?.items || [], qualityCardTemplate);
    renderSlogans(activeContent.slogans?.items || []);
    renderCards('results-grid', activeContent.results?.items || [], resultCardTemplate);
    renderCards('testimonial-grid', activeContent.testimonials?.items || [], testimonialTemplate);
    renderList('compliance-list', activeContent.compliance.list);
    renderCards('package-cards', activeContent.packageCards, packageCardTemplate);
    renderSupportPlans(activeContent.supportPlans);
    renderCourses(activeContent.courses);
    renderPriceList(activeContent.priceList);
    updatePromotionStatic();
    renderList('consulting-points', activeContent.consulting?.points || []);
    renderCards('package-example-grid', activeContent.packageExamples?.items || [], packageExampleTemplate);
    renderCheckout(activeContent.checkout);
    renderAddons(activeContent.addons.items);
    renderIntegrations(activeContent.integrations?.items || []);
    renderCards('process-steps', activeContent.processSteps, processStepTemplate);
    renderFAQ(activeContent.faqItems);
    renderSelects(activeContent.forms);
    renderServiceChecks(activeContent.forms.checkOptions);
    renderSeoFocus(activeContent.seoCheck?.focusOptions || []);
    renderChat(true);
    observeRevealElements();

    if (copyButton) copyButton.textContent = activeContent.contact.copy;
    updateCookieUI();
    updateSocialPlaceholders();
    updateVatNotice();
    updateCurrencyUI();
  }

  function renderCards(containerId, items, template) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(template).join('');
  }

  function renderList(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function renderAddons(items) {
    const container = document.getElementById('addon-grid');
    if (!container) return;
    container.innerHTML = items.map((item) => `<span>${escapeHtml(item)}</span>`).join('');
  }


  function renderIntegrations(items) {
    const container = document.getElementById('integration-grid');
    if (!container) return;
    container.innerHTML = items.map((item) => `
      <article class="integration-card tilt-card">
        <span>${escapeHtml(item.kicker)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`).join('');
  }

  function renderSlogans(items) {
    const container = document.getElementById('slogan-grid');
    if (!container) return;
    container.innerHTML = items.map((item, index) => `<span><i>${String(index + 1).padStart(2, '0')}</i>${escapeHtml(item)}</span>`).join('');
  }

  function resultCardTemplate(item) {
    return `<article class="result-card reveal tilt-card">
      <strong>${escapeHtml(item.value)}</strong>
      <span>${escapeHtml(item.label)}</span>
      <p>${escapeHtml(item.text)}</p>
    </article>`;
  }

  function testimonialTemplate(item) {
    return `<article class="testimonial-card reveal tilt-card">
      <p>${escapeHtml(item.quote)}</p>
      <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.role)}</span></div>
    </article>`;
  }

  function packageExampleTemplate(item) {
    const points = (item.includes || []).map((point) => `<li>${escapeHtml(point)}</li>`).join('');
    return `<article class="example-card reveal tilt-card">
      <span>${escapeHtml(item.for)}</span>
      <h3>${escapeHtml(item.name)}</h3>
      <ul>${points}</ul>
      <p>${escapeHtml(item.result)}</p>
    </article>`;
  }

  function renderCheckout(checkout) {
    if (!checkoutOptions || !checkout) return;
    const items = checkout.items || [];
    if (checkoutFilters) {
      const types = [...new Set(items.map((item) => item.type))];
      checkoutFilters.innerHTML = [`<button class="active" type="button" data-checkout-filter="all">${escapeHtml(checkout.allLabel || 'All')}</button>`, ...types.map((type) => `<button type="button" data-checkout-filter="${escapeHtml(type)}">${escapeHtml(type)}</button>`)].join('');
    }
    checkoutOptions.innerHTML = items.map((item) => `
      <article class="checkout-option tilt-card" data-checkout-option data-checkout-type="${escapeHtml(item.type)}">
        ${item.image ? `<img class="product-art checkout-art" src="${escapeHtml(item.image)}" alt="" width="320" height="200" loading="lazy" decoding="async">` : ''}
        <div class="checkout-option-top">
          <span>${escapeHtml(item.type)}</span>
          <div class="checkout-prices">${promotionPriceMarkup(localized(item.oldPriceLabel))}<strong>${escapedLocalized(item.priceLabel)}</strong></div>
        </div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.text)}</p>
        <button class="button button-soft" type="button" data-cart-add="${escapeHtml(item.id)}">${escapeHtml(checkout.addButton)}</button>
      </article>`).join('');
    renderCart();
  }

  function getCheckoutItemById(id) {
    return (activeContent.checkout?.items || []).find((item) => item.id === id);
  }

  function formatEuro(value) {
    return formatCartTotal(value);
  }

  function formatEuroMarkup(value) {
    return formatCartTotal(value, { markup: true });
  }

  function interpolateText(template, values = {}) {
    return String(template || '').replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  }

  function normalizePromoCode(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  }

  function getCartTotals() {
    return cartItems.reduce((sum, entry) => {
      const source = getCheckoutItemById(entry.id);
      const value = (Number(source?.price) || 0) * Number(entry.qty || 0);
      if (source?.billing === 'monthly') sum.monthly += value;
      else sum.oneTime += value;
      return sum;
    }, { oneTime: 0, monthly: 0 });
  }

  function findPromoDefinition(code) {
    if (PROMO_CODES.enabled !== true) return null;
    const normalized = normalizePromoCode(code);
    return (Array.isArray(PROMO_CODES.codes) ? PROMO_CODES.codes : []).find((item) => normalizePromoCode(item?.code) === normalized) || null;
  }

  function validatePromoCode(code, oneTimeSubtotal) {
    const normalized = normalizePromoCode(code);
    const definition = findPromoDefinition(normalized);
    if (!normalized || !definition) return { valid: false, code: normalized, reason: 'invalid' };
    const now = Date.now();
    const starts = definition.startsAt ? Date.parse(definition.startsAt) : NaN;
    const ends = definition.endsAt ? Date.parse(definition.endsAt) : NaN;
    if ((Number.isFinite(starts) && now < starts) || (Number.isFinite(ends) && now > ends)) {
      return { valid: false, code: normalized, definition, reason: 'expired' };
    }
    const minimum = Math.max(0, Number(definition.minOneTime) || 0);
    if (Number(oneTimeSubtotal) < minimum) {
      return { valid: false, code: normalized, definition, reason: 'minimum', minimum };
    }
    const percent = Math.min(100, Math.max(0, Number(definition.percent) || 0));
    const rawMaximum = Number(definition.maxDiscount);
    const maxDiscount = Number.isFinite(rawMaximum) && rawMaximum > 0 ? rawMaximum : Infinity;
    const discount = Math.min(maxDiscount, Math.round((Number(oneTimeSubtotal) * percent / 100) * 100) / 100);
    if (!discount) return { valid: false, code: normalized, definition, reason: 'invalid' };
    return { valid: true, code: normalized, definition, percent, discount };
  }

  function promoLabel(definition) {
    const labels = definition?.label || {};
    return String(labels[activeLang] || labels.de || definition?.code || '');
  }

  function setPromoStatus(message, type = '') {
    if (!promoStatusEl) return;
    promoStatusEl.textContent = localized(message || '');
    promoStatusEl.dataset.status = type;
  }

  function currentPromo(totals = getCartTotals()) {
    return activePromoCode ? validatePromoCode(activePromoCode, totals.oneTime) : null;
  }

  function applyPromoCode() {
    const totals = getCartTotals();
    const attempted = normalizePromoCode(promoInput?.value || '');
    const result = validatePromoCode(attempted, totals.oneTime);
    if (!result.valid) {
      const copy = activeContent.checkout || {};
      const message = result.reason === 'minimum'
        ? interpolateText(copy.promoMinimum, { minimum: formatEuro(result.minimum || 0) })
        : result.reason === 'expired' ? copy.promoExpired : copy.promoInvalid;
      if (result.reason === 'invalid') {
        activePromoCode = '';
        try { sessionStorage.removeItem(PROMO_CODE_KEY); } catch (_) {}
        renderCart();
      }
      setPromoStatus(message, 'error');
      return;
    }
    activePromoCode = result.code;
    try { sessionStorage.setItem(PROMO_CODE_KEY, activePromoCode); } catch (_) {}
    if (promoInput) promoInput.value = activePromoCode;
    renderCart(true);
  }

  function removePromoCode() {
    activePromoCode = '';
    try { sessionStorage.removeItem(PROMO_CODE_KEY); } catch (_) {}
    if (promoInput) promoInput.value = '';
    setPromoStatus('', '');
    renderCart(true);
    promoInput?.focus({ preventScroll: true });
  }

  function addToCart(id) {
    const source = getCheckoutItemById(id);
    if (!source) return;
    const existing = cartItems.find((item) => item.id === id);
    if (existing) existing.qty = Math.min(9, Math.max(1, Math.floor(Number(existing.qty) || 0) + 1));
    else cartItems.push({ id, qty: 1 });
    renderCart(true);
  }

  function changeCartQty(id, delta) {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) return;
    const nextQuantity = Math.floor(Number(item.qty) || 0) + Math.trunc(Number(delta) || 0);
    item.qty = Math.min(9, nextQuantity);
    if (item.qty <= 0) cartItems = cartItems.filter((entry) => entry.id !== id);
    renderCart(true);
  }

  function renderCart(pulse = false) {
    if (!cartItemsEl || !cartTotalEl || !cartCountEl || !cartEmptyEl) return;
    // Remove stale cart entries left behind after package/price changes.
    cartItems = cartItems.filter((entry) => getCheckoutItemById(entry.id));
    const totals = getCartTotals();
    let promo = currentPromo(totals);
    if (activePromoCode && promo?.reason === 'invalid') {
      activePromoCode = '';
      promo = null;
      try { sessionStorage.removeItem(PROMO_CODE_KEY); } catch (_) {}
      if (promoInput) promoInput.value = '';
      setPromoStatus('', '');
    }
    const oneTimeAfterDiscount = promo?.valid ? Math.max(0, totals.oneTime - promo.discount) : totals.oneTime;
    const count = cartItems.reduce((sum, entry) => sum + entry.qty, 0);
    cartCountEl.textContent = String(count);
    try { localStorage.setItem('weburix-cart', JSON.stringify(cartItems)); } catch (error) {}
    const parts = [];
    if (totals.oneTime) parts.push(`<span><small>${escapeHtml(activeContent.checkout.oneTimeLabel || '')}</small>${promo?.valid ? `<del>${formatEuroMarkup(totals.oneTime)}</del><b>${formatEuroMarkup(oneTimeAfterDiscount)}</b>` : formatEuroMarkup(totals.oneTime)}</span>`);
    if (totals.monthly) parts.push(`<span><small>${escapeHtml(activeContent.checkout.monthlyLabel || '')}</small>${formatEuroMarkup(totals.monthly)}</span>`);
    cartTotalEl.innerHTML = parts.length ? parts.join('') : `<span>${formatEuroMarkup(0)}</span>`;
    if (promoDiscountEl) {
      promoDiscountEl.hidden = !promo?.valid;
      promoDiscountEl.innerHTML = promo?.valid
        ? `<span>${escapeHtml(activeContent.checkout.promoSavings || '')}</span><strong>−${formatEuroMarkup(promo.discount)}</strong>`
        : '';
    }
    if (promoInput && activePromoCode && document.activeElement !== promoInput) promoInput.value = activePromoCode;
    if (promoRemoveButton) promoRemoveButton.hidden = !activePromoCode;
    if (promo?.valid) {
      const applied = interpolateText(activeContent.checkout.promoApplied, { code: promo.code, discount: formatEuro(promo.discount) });
      setPromoStatus(`${applied} ${promoLabel(promo.definition)}`.trim(), 'success');
    } else if (activePromoCode && promo?.reason === 'minimum') {
      setPromoStatus(interpolateText(activeContent.checkout.promoMinimum, { minimum: formatEuro(promo.minimum || 0) }), 'warning');
    } else if (activePromoCode && promo?.reason === 'expired') {
      setPromoStatus(activeContent.checkout.promoExpired, 'error');
    }
    cartEmptyEl.hidden = count > 0;
    cartItemsEl.innerHTML = cartItems.map((entry) => {
      const source = getCheckoutItemById(entry.id);
      if (!source) return '';
      const quantityLabels = activeLang === 'de'
        ? { decrease: 'Menge verringern', increase: 'Menge erhöhen' }
        : activeLang === 'sr'
          ? { decrease: 'Smanji količinu', increase: 'Povećaj količinu' }
          : { decrease: 'Decrease quantity', increase: 'Increase quantity' };
      const itemName = escapeHtml(source.name);
      return `<div class="cart-line">
        <div><strong>${itemName}</strong><span>${escapedLocalized(source.priceLabel)}</span></div>
        <div class="cart-qty">
          <button type="button" data-cart-qty="${escapeHtml(entry.id)}" data-delta="-1" aria-label="${quantityLabels.decrease}: ${itemName}">−</button>
          <span aria-live="polite">${entry.qty}</span>
          <button type="button" data-cart-qty="${escapeHtml(entry.id)}" data-delta="1" aria-label="${quantityLabels.increase}: ${itemName}">+</button>
        </div>
      </div>`;
    }).join('');
    const cart = document.getElementById('checkout-cart');
    if (pulse && cart) {
      cart.classList.remove('cart-pulse');
      void cart.offsetWidth;
      cart.classList.add('cart-pulse');
    }
  }

  function transferCartToRequest() {
    if (!cartItems.length) return;
    const form = document.getElementById('project-form');
    const message = form?.querySelector('textarea[name="message"]');
    const serviceSelect = form?.querySelector('select[name="service"]');
    if (!form || !message) return;
    const lines = cartItems.map((entry) => {
      const source = getCheckoutItemById(entry.id);
      return source ? `- ${source.name} (${localized(source.priceLabel)}) x ${entry.qty}` : '';
    }).filter(Boolean);
    const intro = activeContent.checkout.requestIntro || 'Selected services:';
    const promo = currentPromo();
    const promoLine = promo?.valid
      ? interpolateText(activeContent.checkout.promoLine, { code: promo.code, discount: formatEuro(promo.discount) })
      : '';
    message.value = `${intro}\n${lines.join('\n')}${promoLine ? `\n${promoLine}` : ''}`;
    message.classList.add('is-filled');
    if (serviceSelect) {
      const option = [...serviceSelect.options].find((opt) => /komplett|complete|gesamt|paket/i.test(opt.textContent));
      if (option) serviceSelect.value = option.value;
    }
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setFormStatus(form, activeContent.checkout.copiedToForm, 'success');
  }

  function renderSelects(forms) {
    const map = {
      service: forms.serviceOptions,
      budget: forms.budgetOptions,
      timeline: forms.timelineOptions,
      support: forms.supportOptions
    };
    document.querySelectorAll('[data-select]').forEach((select) => {
      const key = select.dataset.select;
      const previousValue = select.value;
      const previousIndex = select.selectedIndex;
      select.innerHTML = (map[key] || []).map((item) => `<option value="${escapedLocalized(item)}">${escapedLocalized(item)}</option>`).join('');
      if ([...select.options].some((option) => option.value === previousValue)) select.value = previousValue;
      else if (previousIndex >= 0 && previousIndex < select.options.length) select.selectedIndex = previousIndex;
    });
  }

  function renderServiceChecks(items) {
    const container = document.getElementById('service-checks');
    if (!container) return;
    const checkedIndexes = [...container.querySelectorAll('input[name="interests"]')]
      .map((input, index) => input.checked ? index : -1)
      .filter((index) => index >= 0);
    container.innerHTML = items.map((item, index) => {
      const id = `service-check-${activeLang}-${index}`;
      return `<label class="check-pill" for="${id}"><input id="${id}" name="interests" type="checkbox" value="${escapeHtml(item)}" ${checkedIndexes.includes(index) ? 'checked' : ''}><span>${escapeHtml(item)}</span></label>`;
    }).join('');
  }

  function renderSeoFocus(items) {
    const select = document.querySelector('[data-seo-focus]');
    if (!select) return;
    const previousValue = select.value;
    const previousIndex = select.selectedIndex;
    select.innerHTML = items.map((item, index) => `<option value="${index === 0 ? '' : escapeHtml(item)}" ${index === 0 ? 'disabled' : ''}>${escapeHtml(item)}</option>`).join('');
    if ([...select.options].some((option) => option.value === previousValue)) select.value = previousValue;
    else if (previousIndex >= 0 && previousIndex < select.options.length) select.selectedIndex = previousIndex;
    else select.value = '';
  }

  function serviceCardTemplate(item) {
    return `
      <article class="service-card reveal tilt-card">
        <span>${escapeHtml(item.icon)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
  }

  function ideaCardTemplate(item, index) {
    return `
      <article class="idea-card reveal tilt-card">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
  }

  function qualityCardTemplate(item, index) {
    return `
      <article class="quality-card reveal tilt-card">
        <span aria-hidden="true">→</span>
        <small>${String(index + 1).padStart(2, '0')}</small>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
  }

  function renderServiceTabs(items) {
    const container = document.getElementById('service-tabs');
    if (!container) return;
    const previousIndex = Number(container.querySelector('.tab-button.active')?.dataset.tabIndex);
    const activeIndex = Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < items.length ? previousIndex : 0;
    const buttons = items.map((item, index) => `<button class="tab-button ${index === activeIndex ? 'active' : ''}" id="service-tab-${index}" type="button" role="tab" data-tab-index="${index}" aria-selected="${index === activeIndex}" aria-controls="service-panel-${index}" tabindex="${index === activeIndex ? '0' : '-1'}">${escapeHtml(item.title)}</button>`).join('');
    const panels = items.map((item, index) => {
      const points = item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
      return `<article class="tab-panel ${index === activeIndex ? 'active' : ''}" id="service-panel-${index}" role="tabpanel" aria-labelledby="service-tab-${index}" aria-hidden="${index !== activeIndex}" data-tab-panel="${index}">
        <h3>${escapeHtml(item.heading)}</h3>
        <p>${escapeHtml(item.text)}</p>
        <ul>${points}</ul>
        ${item.link ? `<a class="text-link" href="${escapeHtml(item.link)}">${escapeHtml(item.linkLabel || 'Mehr erfahren')} <span aria-hidden="true">→</span></a>` : ''}
      </article>`;
    }).join('');
    container.innerHTML = `<div class="tab-buttons" role="tablist" aria-label="${escapeHtml(activeContent.services?.title || 'Leistungen')}">${buttons}</div><div class="tab-panels">${panels}</div>`;
  }

  function packageCardTemplate(item, index) {
    const features = item.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('');
    const extra = item.extra.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
    return `
      <article class="price-card reveal tilt-card ${item.featured ? 'featured' : ''}" data-price-card>
        ${item.featured ? `<div class="badge">${escapeHtml(activeContent.packages.popular)}</div>` : ''}
        ${item.image ? `<img class="product-art package-art" src="${escapeHtml(item.image)}" alt="" width="320" height="200" loading="lazy" decoding="async">` : ''}
        <div class="launch-price-tag">${escapeHtml(isPromotionActive() ? promotionLabel() : (activeContent.packages.saving || ''))}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="package-label">${escapeHtml(item.label)}</p>
        <div class="package-price">${promotionPriceMarkup(localized(item.oldPrice))}<strong>${escapedLocalized(item.price)}</strong></div>
        <ul>${features}</ul>
        <div class="price-extra" id="package-extra-${index}" aria-hidden="true">${extra}</div>
        <button class="button button-soft package-toggle" type="button" data-package-toggle aria-expanded="false" aria-controls="package-extra-${index}">${escapeHtml(activeContent.packages.details)}</button>
        <a href="#request" class="button button-primary">${escapeHtml(activeContent.packages.cta)}</a>
      </article>`;
  }

  function renderSupportPlans(section) {
    const container = document.getElementById('support-plan-grid');
    if (!container || !section) return;
    container.innerHTML = (section.items || []).map((item) => {
      const features = (item.features || []).map((feature) => `<li>${escapeHtml(feature)}</li>`).join('');
      return `<article class="support-plan reveal tilt-card ${item.featured ? 'featured' : ''}">
        ${item.featured ? `<div class="badge">${escapeHtml(section.popular)}</div>` : ''}
        <img class="product-art support-art" src="${escapeHtml(item.image)}" alt="" width="320" height="200" loading="lazy" decoding="async">
        <h3>${escapeHtml(item.name)}</h3>
        <div class="support-price">${promotionPriceMarkup(localized(item.oldPrice))}<strong>${escapedLocalized(item.price)}</strong><span>${escapeHtml(item.period)}</span></div>
        <ul>${features}</ul>
        <a class="button button-primary" href="#request">${escapeHtml(section.cta)}</a>
      </article>`;
    }).join('');
  }

  function renderCourses(section) {
    const container = document.getElementById('course-grid');
    if (!container || !section) return;
    container.innerHTML = (section.items || []).map((item) => {
      const points = (item.points || []).map((point) => `<li>${escapeHtml(point)}</li>`).join('');
      return `<article class="course-card reveal tilt-card">
        <img class="product-art course-art" src="${escapeHtml(item.image)}" alt="" width="320" height="200" loading="lazy" decoding="async">
        <div class="course-meta"><span>${escapeHtml(section.live)}</span><small>${escapeHtml(section.duration)}: ${escapeHtml(item.duration)}</small></div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.subtitle)}</p>
        <div class="course-price">${promotionPriceMarkup(localized(item.oldPrice))}<strong>${escapedLocalized(item.price)}</strong></div>
        <ul>${points}</ul>
        <a class="button button-soft" href="#request">${escapeHtml(section.cta)}</a>
      </article>`;
    }).join('');
  }

  function renderPriceList(section) {
    const container = document.getElementById('price-list-grid');
    if (!container || !section) return;
    container.innerHTML = (section.groups || []).map((group) => {
      const rows = (group.items || []).map((item) => `<div class="price-row"><span>${escapeHtml(item.name)}</span><div class="price-row-values">${promotionPriceMarkup(localized(item.oldPrice))}<strong>${escapedLocalized(item.price)}</strong></div></div>`).join('');
      return `<article class="price-list-card reveal"><h3>${escapeHtml(group.title)}</h3>${rows}</article>`;
    }).join('');
  }

  function processStepTemplate(item, index) {
    return `
      <article class="timeline-item reveal">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
  }

  function renderFAQ(items) {
    const container = document.getElementById('faq-list');
    if (!container) return;
    const previousOpen = [...container.querySelectorAll('.faq-item')].findIndex((item) => item.classList.contains('open'));
    const openIndex = previousOpen >= 0 && previousOpen < items.length ? previousOpen : 0;
    container.innerHTML = items.map((item, index) => `
      <article class="faq-item reveal ${index === openIndex ? 'open' : ''}">
        <button class="faq-question" id="faq-button-${index}" type="button" aria-expanded="${index === openIndex}" aria-controls="faq-answer-${index}">
          <span>${escapeHtml(item.q)}</span><i aria-hidden="true">+</i>
        </button>
        <div class="faq-answer" id="faq-answer-${index}" role="region" aria-labelledby="faq-button-${index}" aria-hidden="${index !== openIndex}"><p>${escapedLocalized(item.a)}</p></div>
      </article>`).join('');
    updateAccordionHeights(container);
  }

  function updateAccordionHeights(scope = document) {
    scope.querySelectorAll('.faq-item').forEach((item) => {
      const answer = item.querySelector('.faq-answer');
      if (!answer) return;
      answer.style.maxHeight = item.classList.contains('open') ? `${answer.scrollHeight}px` : '0px';
    });
    scope.querySelectorAll('.price-card').forEach((card) => {
      const extra = card.querySelector('.price-extra');
      if (!extra) return;
      extra.style.maxHeight = card.classList.contains('expanded') ? `${extra.scrollHeight}px` : '0px';
    });
  }

  function setFormStatus(form, message, type = '') {
    const status = form.querySelector('[data-form-status]');
    if (!status) return;
    status.textContent = localized(message || '');
    status.dataset.status = type;
    status.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  }

  function collectFormPayload(form) {
    const data = new FormData(form);
    data.set('form_type', form.dataset.formType || 'contact');
    data.set('display_currency', activeLang === 'sr' ? activeCurrency.toUpperCase() : 'EUR');
    data.set('billing_currency', String(CURRENCY_CONFIG.billingCurrency || 'EUR'));
    if (activeLang === 'sr') data.set('eur_rsd_rate', String(rsdRate()));
    const honeypot = `${data.get('website_url') || ''}${data.get('_honey') || ''}`.trim();
    if (honeypot) return { blocked: true };

    if (!form.checkValidity()) {
      form.reportValidity();
      return { invalid: true };
    }

    const labels = {
      name: activeContent.forms.name,
      email: activeContent.forms.email,
      company: activeContent.forms.company,
      website: activeContent.forms.website,
      url: activeContent.seoCheck?.url || 'URL',
      focus: activeContent.seoCheck?.focus || 'Fokus',
      service: activeContent.forms.service,
      budget: activeContent.forms.budget,
      timeline: activeContent.forms.timeline,
      support: activeContent.forms.support,
      interests: activeContent.forms.servicesNeeded,
      message: activeContent.forms.message,
      privacy: 'Datenschutz',
      newsletter_consent: activeContent.newsletter?.consent || 'Newsletter-Vormerkung',
      form_type: 'Typ'
    };

    data.set('language', activeLang);
    data.set('page_url', window.location.href);
    data.set('submitted_at', new Date().toISOString());
    if (cartItems.length && form.dataset.formType === 'project') {
      const summary = cartItems.map((entry) => {
        const item = getCheckoutItemById(entry.id);
        return item ? `${item.name} x ${entry.qty} (${item.priceLabel})` : '';
      }).filter(Boolean).join(' | ');
      if (summary) data.set('selected_services', summary);
      const promo = currentPromo();
      if (promo?.valid) {
        data.set('promo_code', promo.code);
        data.set('promo_discount', formatEuro(promo.discount));
      }
    }

    const grouped = {};
    for (const [key, value] of data.entries()) {
      if (key === 'website_url') continue;
      const cleaned = String(value).trim();
      if (!cleaned) continue;
      grouped[key] = grouped[key] ? `${grouped[key]}, ${cleaned}` : cleaned;
    }
    return { data, labels, grouped };
  }

  function prepareNativeFormSubmit(form, payload) {
    form.querySelectorAll('[data-native-submit-meta]').forEach((node) => node.remove());
    const excluded = new Set(['privacy', 'website_url']);
    for (const [key, value] of payload.data.entries()) {
      if (excluded.has(key) || form.elements.namedItem(key)) continue;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      input.dataset.nativeSubmitMeta = '';
      form.appendChild(input);
    }
  }

  function submitNativeForm(form, payload) {
    const endpoint = form.getAttribute('action') || '';
    if (!/^https:\/\/formsubmit\.co\//i.test(endpoint)) throw new Error('Invalid native form endpoint');
    prepareNativeFormSubmit(form, payload);
    const isWebPage = /^https?:$/i.test(window.location.protocol);
    const currentPage = isWebPage
      ? `${window.location.origin}${window.location.pathname}`
      : '';
    const sourceField = form.elements.namedItem('_url');
    const nextField = form.elements.namedItem('_next');
    // Keep the preconfigured public fallback URLs during file:// previews.
    if (isWebPage && sourceField) sourceField.value = currentPage;
    if (isWebPage && nextField) nextField.value = `${currentPage}?sent=1`;
    setFormStatus(form, activeContent.forms.nativeFallback || activeContent.forms.sending, 'loading');
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        try {
          HTMLFormElement.prototype.submit.call(form);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 80);
    });
  }

  async function fetchWithTimeout(url, options, timeoutMs = 12000) {
    const controller = 'AbortController' in window ? new AbortController() : null;
    let timer = 0;
    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => {
        controller?.abort();
        const error = new Error('Request timed out');
        error.name = 'AbortError';
        reject(error);
      }, timeoutMs);
    });
    try {
      return await Promise.race([
        fetch(url, { ...options, ...(controller ? { signal: controller.signal } : {}) }),
        timeout
      ]);
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function submitToFormSubmit(form, payload) {
    if (!/^https:\/\/formsubmit\.co\/ajax\//i.test(FORM_CONFIG.formsubmitEndpoint)) {
      throw new Error('Invalid FormSubmit endpoint');
    }
    const type = form.dataset.formType;
    const subjects = { project: 'Neue Weburix Projektanfrage', quick: 'Neue Weburix Kontaktanfrage', newsletter: 'Weburix Newsletter-Vormerkung', portal: 'Weburix Portal-Anfrage', 'seo-check': 'Weburix SEO-Kurzcheck' };
    payload.data.delete('website_url');
    payload.data.set('_subject', subjects[type] || 'Neue Weburix Anfrage');
    payload.data.set('_template', 'table');
    payload.data.set('_captcha', 'false');
    payload.data.set('_url', window.location.href.split('#')[0]);
    payload.data.delete('privacy');
    const response = await fetchWithTimeout(FORM_CONFIG.formsubmitEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload.data
    }, 15000);
    let result = null;
    try { result = await response.json(); } catch (_) {}
    const successValue = result?.success;
    const explicitSuccess = successValue === true || String(successValue).toLowerCase() === 'true';
    if (!response.ok || !explicitSuccess) {
      const error = new Error(result?.message || 'FormSubmit did not confirm delivery');
      if (/activate|activation|confirm|verify|verification/i.test(error.message)) error.code = 'FORMSUBMIT_ACTIVATION';
      throw error;
    }
    return result;
  }


  async function submitForm(form) {
    if (form.classList.contains('is-submitting')) return;
    const payload = collectFormPayload(form);
    if (payload.blocked) {
      setFormStatus(form, activeContent.forms.botBlocked, 'error');
      return;
    }
    if (payload.invalid) {
      setFormStatus(form, activeContent.forms.required, 'error');
      return;
    }

    setFormStatus(form, activeContent.forms.sending, 'loading');
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton?.setAttribute('disabled', 'disabled');
    submitButton?.setAttribute('aria-busy', 'true');
    form.classList.add('is-submitting');

    try {
      await submitToFormSubmit(form, payload);
      setFormStatus(form, activeContent.forms.apiSuccess, 'success');
      form.reset();
      form.querySelectorAll('.is-filled').forEach((field) => field.classList.remove('is-filled'));
      if (form.dataset.formType === 'project') { cartItems = []; renderCart(); }
    } catch (error) {
      console.warn(error);
      const activationNeeded = error && error.code === 'FORMSUBMIT_ACTIVATION';
      if (activationNeeded) {
        setFormStatus(form, activeContent.forms.activationNeeded || activeContent.forms.error, 'warning');
      } else {
        try {
          await submitNativeForm(form, payload);
        } catch (nativeError) {
          console.warn(nativeError);
          setFormStatus(form, activeContent.forms.error, 'error');
        }
      }
    } finally {
      submitButton?.removeAttribute('disabled');
      submitButton?.removeAttribute('aria-busy');
      form.classList.remove('is-submitting');
    }
  }


  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form-type]');
    if (!form) return;
    event.preventDefault();
    void submitForm(form).catch((error) => {
      console.warn(error);
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton?.removeAttribute('disabled');
      submitButton?.removeAttribute('aria-busy');
      form.classList.remove('is-submitting');
      setFormStatus(form, activeContent.forms.error, 'error');
    });
  });

  document.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-checkout-filter]');
    if (filterButton) {
      const filter = filterButton.dataset.checkoutFilter;
      checkoutFilters?.querySelectorAll('button').forEach((button) => button.classList.toggle('active', button === filterButton));
      checkoutOptions?.querySelectorAll('[data-checkout-option]').forEach((card) => {
        card.classList.toggle('filter-hidden', filter !== 'all' && card.dataset.checkoutType !== filter);
      });
    }
    const cartAdd = event.target.closest('[data-cart-add]');
    if (cartAdd) addToCart(cartAdd.dataset.cartAdd);

    const cartQty = event.target.closest('[data-cart-qty]');
    if (cartQty) changeCartQty(cartQty.dataset.cartQty, Number(cartQty.dataset.delta || 0));

    const paymentDemo = event.target.closest('[data-payment-demo]');
    if (paymentDemo) {
      const provider = paymentDemo.dataset.paymentDemo;
      const firstItem = cartItems.length === 1 ? cartItems[0] : null;
      const paymentKey = firstItem ? `${firstItem.id}:${provider}` : '';
      const link = paymentKey ? PAYMENT_LINKS[paymentKey] : '';
      if (link && /^https:\/\//i.test(link)) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        const form = document.getElementById('project-form');
        if (form) setFormStatus(form, activeContent.checkout.paymentDemo, 'loading');
        document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    const contactRoute = event.target.closest('[data-contact-route]');
    if (contactRoute) {
      const targetId = contactRoute.dataset.contactRoute === 'quick' ? 'quick-form' : 'project-form';
      const targetForm = document.getElementById(targetId);
      const serviceSelect = targetForm?.querySelector('select[name="service"]');
      const intent = contactRoute.dataset.contactIntent || '';
      if (serviceSelect && intent) {
        const intentTokens = {
          consulting: ['beratung', 'consult', 'savet'],
          support: ['support', 'betreuung', 'podrsk']
        };
        const tokens = intentTokens[intent] || [normalize(intent)];
        const option = [...serviceSelect.options].find((entry) => tokens.some((token) => normalize(entry.textContent).includes(token)));
        if (option) serviceSelect.value = option.value;
      }
      targetForm?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => targetForm?.querySelector('input:not([type="hidden"]), select, textarea')?.focus({ preventScroll: true }), reducedMotion ? 0 : 450);
    }

    const tabButton = event.target.closest('[data-tab-index]');
    if (tabButton) {
      const container = tabButton.closest('.service-tabs');
      const index = tabButton.dataset.tabIndex;
      container.querySelectorAll('.tab-button').forEach((button) => {
        const active = button.dataset.tabIndex === index;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.setAttribute('tabindex', active ? '0' : '-1');
      });
      container.querySelectorAll('.tab-panel').forEach((panel) => {
        const active = panel.dataset.tabPanel === index;
        panel.classList.toggle('active', active);
        panel.setAttribute('aria-hidden', String(!active));
        if (active) {
          panel.classList.remove('panel-pop');
          void panel.offsetWidth;
          panel.classList.add('panel-pop');
        }
      });
    }

    const packageToggle = event.target.closest('[data-package-toggle]');
    if (packageToggle) {
      const card = packageToggle.closest('[data-price-card]');
      const expanded = !card.classList.contains('expanded');
      card.classList.toggle('expanded', expanded);
      packageToggle.setAttribute('aria-expanded', String(expanded));
      packageToggle.textContent = expanded ? activeContent.packages.close : activeContent.packages.details;
      const extra = card.querySelector('.price-extra');
      if (extra) {
        extra.setAttribute('aria-hidden', String(!expanded));
        extra.style.maxHeight = expanded ? `${extra.scrollHeight}px` : '0px';
      }
    }

    const faqButton = event.target.closest('.faq-question');
    if (faqButton) {
      const item = faqButton.closest('.faq-item');
      const list = faqButton.closest('.faq-list');
      const willOpen = !item.classList.contains('open');
      list.querySelectorAll('.faq-item').forEach((faq) => {
        faq.classList.remove('open');
        faq.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        faq.querySelector('.faq-answer')?.setAttribute('aria-hidden', 'true');
      });
      item.classList.toggle('open', willOpen);
      faqButton.setAttribute('aria-expanded', String(willOpen));
      item.querySelector('.faq-answer')?.setAttribute('aria-hidden', String(!willOpen));
      updateAccordionHeights(list);
    }
  });

  document.addEventListener('keydown', (event) => {
    const tab = event.target.closest?.('[role="tab"]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const current = tabs.indexOf(tab);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  });

  function syncMobileNavAccessibility() {
    if (!navPanel) return;
    const compact = mobileNavMedia?.matches ?? window.innerWidth <= 1280;
    const open = navToggle?.getAttribute('aria-expanded') === 'true';
    const hidden = compact && !open;
    navPanel.toggleAttribute('inert', hidden);
    navPanel.setAttribute('aria-hidden', String(hidden));
  }

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (!isOpen) languageMenu?.removeAttribute('open');
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navPanel?.classList.toggle('open', !isOpen);
    document.body.classList.toggle('nav-open', !isOpen);
    syncMobileNavAccessibility();
    updateInteractiveLabels();
  });
  languageMenu?.addEventListener('toggle', () => {
    if (languageMenu.open) {
      closeMobileNav();
      document.querySelector('.currency-menu')?.removeAttribute('open');
    }
  });

  navPanel?.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    navPanel.querySelectorAll('.nav-more[open]').forEach((menu) => menu.removeAttribute('open'));
    closeMobileNav();
  });
  document.addEventListener('pointerdown', (event) => {
    document.querySelectorAll('.nav-more[open], .language-menu[open], .currency-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
    if (!document.body.classList.contains('nav-open')) return;
    if (event.target.closest('.nav-panel, .nav-toggle')) return;
    closeMobileNav();
  });

  function closeMobileNav() {
    navToggle?.setAttribute('aria-expanded', 'false');
    navPanel?.classList.remove('open');
    document.body.classList.remove('nav-open');
    syncMobileNavAccessibility();
    updateInteractiveLabels();
  }

  languageButtons.forEach((button) => button.addEventListener('click', () => {
    setLanguage(button.dataset.lang, { persist: true });
    languageMenu?.removeAttribute('open');
    closeMobileNav();
  }));

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('info@weburix.com');
      copyButton.textContent = activeContent.contact.copied;
      setTimeout(() => (copyButton.textContent = activeContent.contact.copy), 1400);
    } catch (error) {
      window.location.href = 'mailto:info@weburix.com';
    }
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.01, rootMargin: '120px 0px 80px 0px' })
    : null;

  function observeRevealElements() {
    const elements = [...document.querySelectorAll('.reveal:not(.visible)')];
    elements.forEach((element, index) => {
      element.style.setProperty('--stagger', `${reducedMotion ? 0 : Math.min(index, 8) * 34}ms`);
      const rect = element.getBoundingClientRect();
      const alreadyInView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
      if (alreadyInView) {
        window.setTimeout(() => element.classList.add('visible'), reducedMotion ? 0 : Math.min(index, 6) * 38);
      } else if (observer) {
        observer.observe(element);
      } else {
        element.classList.add('visible');
      }
    });
  }

  function openChat() {
    if (!chatWidget || document.body.classList.contains('consent-pending')) return;
    chatReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : chatLauncher;
    chatWidget.classList.add('open');
    chatWidget.removeAttribute('inert');
    chatWidget.setAttribute('aria-hidden', 'false');
    chatLauncher?.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => chatInput?.focus({ preventScroll: true }), 80);
  }

  function closeChat(options = {}) {
    if (!chatWidget) return;
    const wasOpen = chatWidget.classList.contains('open');
    chatWidget.classList.remove('open');
    chatWidget.setAttribute('aria-hidden', 'true');
    chatWidget.setAttribute('inert', '');
    chatLauncher?.setAttribute('aria-expanded', 'false');
    if (wasOpen && options.restoreFocus !== false) {
      window.setTimeout(() => chatReturnFocus?.focus?.({ preventScroll: true }), 0);
    }
  }

  function renderChat(resetMessages) {
    if (!chatMessages || !chatPrompts) return;
    if (resetMessages) {
      chatMessages.innerHTML = '';
      addChatMessage(activeContent.chat.hello, 'bot');
    }
    chatPrompts.innerHTML = activeContent.chat.prompts
      .map((prompt) => `<button class="chat-chip" type="button" title="${escapeHtml(prompt)}" data-chat-prompt="${escapeHtml(prompt)}"><span>${escapeHtml(prompt)}</span></button>`)
      .join('');
  }

  function addChatMessage(text, type) {
    if (!chatMessages) return;
    const message = document.createElement('div');
    message.className = `chat-bubble ${type}`;
    message.textContent = localized(text);
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function normalize(value) {
    return String(value || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'dj');
  }

  function getBotAnswer(rawInput) {
    const input = normalize(rawInput);
    const answers = activeContent.chat.answers;
    if (/welch.*paket|paket.*empfehl|recommend.*package|which package|koji paket|preporuc/i.test(rawInput)) return answers.packageRecommend || answers.packages;
    if (/gewerbe|impressum|agb|widerruf|recht|legal|law|zakon|pravno|gesetz|bgb/i.test(rawInput)) return answers.legalBusiness || answers.legal;
    if (/portal|login|sign in|signin|signup|sign up|konto|account|zugang|pristup/.test(input)) return answers.portal || answers.forms || answers.contact;
    if (/newsletter|mailing|subscribe|abo|novosti|prijav/.test(input)) return answers.newsletter || answers.forms || answers.contact;
    if (/kurs|course|workshop|radionic|schulung|training/.test(input)) return answers.courses || answers.consulting || answers.fallback;
    if (/consult|beratung|savet|sat|hour|stundensatz|1:1/.test(input)) return answers.consulting || answers.contact;
    if (/checkout|warenkorb|cart|korpa|plać|plac|payment|stripe|paypal|paywall|zahlung|zahlen|kaufen|buy/.test(input)) return answers.checkout || answers.price;
    if (/integration|integrationen|api|formsubmit|tool|tools/.test(input)) return answers.integrations || answers.forms || answers.contact;
    if (/paket|package|plan|starter|business|growth|care|social.+youtube|ponud|angebot/.test(input)) return answers.packages;
    if (/währung|waehrung|currency|valuta|eur.+rsd|rsd.+eur|dinar|dinara/.test(input)) return answers.currency || answers.price;
    if (/preis|price|cost|kosten|cena|cijena|kosta|kost|budget|budzet|budzet|€|euro|rsd/.test(input)) return answers.price;
    if (/web|website|seite|stran|sajt|landing|relaunch|redizajn|redesign|formular|form/.test(input)) return answers.website;
    if (/internal link|interne verlink|interni link|content refresh|update old|alte inhalte|stari sadržaj|stari sadrzaj|topical|themencluster|tematski klaster|wissenshub|blog/.test(input)) return answers.contentStrategy || answers.seo;
    if (/digital pr|guest post|gastbeitrag|fachbeitrag|editorial|medienarbeit|stručni članak|strucni clanak|portal/.test(input)) return answers.digitalPr || answers.contentStrategy || answers.seo;
    if (/seo|ranking|sichtbar|vidljiv|pretraga|pretraz|search|google.+found|suchmaschine|metadaten|metadata/.test(input)) return answers.seo;
    if (/google business|google profil|business profile|maps|mapa|karte|local|lokal/.test(input)) return answers.google;
    if (/youtube|yt|shorts|thumbnail|kanal|channel|upload|analytics|analitika|title|naslov/.test(input)) return answers.youtube;
    if (/social|instagram|tiktok|facebook|linkedin|društv|drustv|mrez|mrež|content|post|objav/.test(input)) return answers.social;
    if (/ads|adwords|anzeig|reklam|oglas|kampagn|campaign|promotion|promoc/.test(input)) return answers.ads;
    if (/domain|domen|dns|ssl|hosting|host|mail|email/.test(input)) return answers.domain;
    if (/security|sicher|sigurn|bezbed|backup|bekap|update|password|lozink|hack/.test(input)) return answers.security;
    if (/support|pflege|wartung|odrzav|održav|podrsk|podrš|monthly|monat|mjesec|mese/.test(input)) return answers.support;
    if (/mehrsprach|multilingual|language|sprache|jezik|jezic|prevod|translation|deutsch|english|serbian|srpski/.test(input)) return answers.multilingual;
    if (/timeline|zeit|dauer|rok|koliko dugo|how long|start|begin|launch|pocet|počet/.test(input)) return answers.timeline;
    if (/fake|follower|like|lajk|bot|view|pregled|komentar|comment/.test(input)) return answers.legal;
    if (/formular|formulare|forms|contact form|kontaktformular|formsubmit/.test(input)) return answers.forms || answers.contact;
    if (/hosting|host|github pages|cloudflare pages|server|deploy|deployment/.test(input)) return answers.hosting || answers.domain;
    if (/privacy|datenschutz|cookie|cookies|gdpr|dsgvo|privatnost|podaci|tracking|analytics/.test(input)) return answers.privacy || answers.legal;
    if (/ablauf|process|prozess|kako ide|projekat|project flow|meeting/.test(input)) return answers.process || answers.contact;
    if (/kontakt|contact|email|mail|anfrage|request|upit|projekt|project|start/.test(input)) return answers.contact;
    return answers.fallback;
  }

  function handleChatSubmit(text) {
    const value = String(text || '').trim();
    if (!value) return;
    addChatMessage(value, 'user');
    if (chatInput) chatInput.value = '';

    const typing = document.createElement('div');
    typing.className = 'chat-bubble bot typing';
    typing.textContent = '...';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      typing.remove();
      addChatMessage(getBotAnswer(value), 'bot');
    }, 360 + Math.random() * 220);
  }

  chatLauncher?.addEventListener('click', openChat);
  chatClose?.addEventListener('click', closeChat);
  chatForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleChatSubmit(chatInput?.value);
  });
  chatPrompts?.addEventListener('click', (event) => {
    const promptButton = event.target.closest('[data-chat-prompt]');
    if (promptButton) handleChatSubmit(promptButton.dataset.chatPrompt);
  });

  if (!coarsePointer && !reducedMotion && !saveData && !lowPowerDevice) {
    document.addEventListener('click', (event) => {
      const clickable = event.target.closest('a, button, .check-pill, .service-card, .idea-card, .timeline-item, .stats-grid div, .addon-grid span, .result-card, .testimonial-card, .example-card, .support-plan, .course-card, .price-list-card, .slogan-grid span, .knowledge-card');
      if (!clickable) return;
      clickable.classList.remove('click-pop');
      void clickable.offsetWidth;
      clickable.classList.add('click-pop');
      window.setTimeout(() => clickable.classList.remove('click-pop'), 360);
    });
  }


  function getStoredConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === CONSENT_VERSION) return parsed;
      }
      const legacy = localStorage.getItem('weburix-cookie-choice');
      if (legacy) {
        const migrated = {
          version: CONSENT_VERSION,
          necessary: true,
          functional: legacy === 'accept',
          analytics: false,
          marketing: false,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(migrated));
        localStorage.removeItem('weburix-cookie-choice');
        return migrated;
      }
    } catch (_) {}
    return null;
  }

  function hasFunctionalConsent() {
    return Boolean(getStoredConsent()?.functional);
  }

  function saveConsent(preferences) {
    const next = {
      version: CONSENT_VERSION,
      necessary: true,
      functional: Boolean(preferences.functional),
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
      localStorage.removeItem('weburix-cookie-choice');
      if (!next.functional) sessionStorage.removeItem('weburix-country');
    } catch (_) {}
    cookieBanner?.classList.remove('visible');
    cookieBanner?.classList.add('hidden');
    document.body.classList.remove('consent-pending');
    closeCookieSettings();
    updateCookieUI();

    if (next.functional && !readStoredLanguage()) {
      resolveInitialLanguage().then((detectedLanguage) => {
        if (detectedLanguage && detectedLanguage !== activeLang) setLanguage(detectedLanguage);
      }).catch(() => {});
    }
  }

  function ensureCookieSettings() {
    let modal = document.getElementById('cookie-settings-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'cookie-settings-modal';
    modal.className = 'cookie-settings-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    modal.innerHTML = `
      <div class="cookie-settings-backdrop" data-cookie-close></div>
      <section class="cookie-settings-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
        <div class="cookie-settings-head">
          <div><p class="eyebrow">Privacy</p><h2 id="cookie-settings-title"></h2></div>
          <button class="cookie-close" type="button" data-cookie-close aria-label="Close">×</button>
        </div>
        <p class="cookie-settings-intro" data-cookie-text></p>
        <div class="cookie-category-list">
          <div class="cookie-category">
            <div><strong data-cookie-label="necessary"></strong><p data-cookie-description="necessary"></p></div>
            <span class="cookie-state" data-cookie-state="necessary"></span>
          </div>
          <label class="cookie-category cookie-category-toggle">
            <div><strong data-cookie-label="functional"></strong><p data-cookie-description="functional"></p></div>
            <input id="cookie-functional" type="checkbox" />
            <span class="consent-toggle" aria-hidden="true"></span>
          </label>
          <div class="cookie-category cookie-category-disabled">
            <div><strong data-cookie-label="analytics"></strong><p data-cookie-description="analytics"></p></div>
            <span class="cookie-state" data-cookie-state="analytics"></span>
          </div>
          <div class="cookie-category cookie-category-disabled">
            <div><strong data-cookie-label="marketing"></strong><p data-cookie-description="marketing"></p></div>
            <span class="cookie-state" data-cookie-state="marketing"></span>
          </div>
        </div>
        <div class="cookie-settings-actions">
          <button class="button button-soft" type="button" data-cookie-save="necessary"></button>
          <button class="button button-soft" type="button" data-cookie-save="selection"></button>
        </div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-cookie-close]').forEach((button) => button.addEventListener('click', closeCookieSettings));
    modal.querySelector('[data-cookie-save="necessary"]')?.addEventListener('click', () => saveConsent({ functional: false }));
    modal.querySelector('[data-cookie-save="selection"]')?.addEventListener('click', () => {
      saveConsent({ functional: Boolean(modal.querySelector('#cookie-functional')?.checked) });
    });
    return modal;
  }

  function updateCookieUI() {
    const copy = activeContent?.cookie;
    if (!copy) return;
    const bannerSettings = cookieBanner?.querySelector('[data-cookie-settings]');
    if (bannerSettings) bannerSettings.textContent = copy.settings;

    const modal = ensureCookieSettings();
    modal.querySelector('#cookie-settings-title').textContent = copy.modalTitle;
    modal.querySelector('[data-cookie-text]').textContent = copy.modalText;
    modal.querySelector('[data-cookie-label="necessary"]').textContent = copy.necessaryTitle;
    modal.querySelector('[data-cookie-description="necessary"]').textContent = copy.necessaryText;
    modal.querySelector('[data-cookie-label="functional"]').textContent = copy.functionalTitle;
    modal.querySelector('[data-cookie-description="functional"]').textContent = copy.functionalText;
    modal.querySelector('[data-cookie-label="analytics"]').textContent = copy.analyticsTitle;
    modal.querySelector('[data-cookie-description="analytics"]').textContent = copy.analyticsText;
    modal.querySelector('[data-cookie-label="marketing"]').textContent = copy.marketingTitle;
    modal.querySelector('[data-cookie-description="marketing"]').textContent = copy.marketingText;
    modal.querySelector('[data-cookie-state="necessary"]').textContent = copy.alwaysOn;
    modal.querySelector('[data-cookie-state="analytics"]').textContent = copy.inactive;
    modal.querySelector('[data-cookie-state="marketing"]').textContent = copy.inactive;
    modal.querySelector('[data-cookie-save="necessary"]').textContent = copy.necessary;
    modal.querySelector('[data-cookie-save="selection"]').textContent = copy.save;
    const close = modal.querySelector('.cookie-close');
    if (close) close.setAttribute('aria-label', copy.close);

    document.querySelectorAll('[data-open-cookie-settings]').forEach((button) => {
      button.textContent = activeContent?.footer?.privacySettings || copy.settings;
    });
  }

  function openCookieSettings() {
    const modal = ensureCookieSettings();
    const consent = getStoredConsent();
    const functional = modal.querySelector('#cookie-functional');
    if (functional) functional.checked = Boolean(consent?.functional);
    cookieReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.classList.add('visible');
    modal.removeAttribute('inert');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cookie-modal-open');
    window.setTimeout(() => modal.querySelector('.cookie-close')?.focus({ preventScroll: true }), 60);
  }

  function closeCookieSettings(options = {}) {
    const modal = document.getElementById('cookie-settings-modal');
    if (!modal) return;
    const wasOpen = modal.classList.contains('visible');
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    document.body.classList.remove('cookie-modal-open');
    if (wasOpen && options.restoreFocus !== false) {
      window.setTimeout(() => cookieReturnFocus?.focus?.({ preventScroll: true }), 0);
    }
  }

  function initCookieBanner() {
    if (cookieBanner && !cookieBanner.querySelector('[data-cookie-settings]')) {
      const button = document.createElement('button');
      button.className = 'button button-ghost cookie-settings-trigger';
      button.type = 'button';
      button.dataset.cookieSettings = '';
      cookieBanner.querySelector('.cookie-actions')?.insertBefore(button, cookieBanner.querySelector('[data-cookie-choice="accept"]'));
    }
    document.querySelectorAll('[data-cookie-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        const choice = button.dataset.cookieChoice || 'necessary';
        saveConsent({ functional: choice === 'accept' });
      });
    });
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-cookie-settings], [data-open-cookie-settings]')) openCookieSettings();
    });
    const footerLinks = document.querySelector('.footer-bottom-links');
    if (footerLinks && !footerLinks.querySelector('[data-open-cookie-settings]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'footer-privacy-button';
      button.dataset.openCookieSettings = '';
      footerLinks.appendChild(button);
    }
    const consent = getStoredConsent();
    document.body.classList.toggle('consent-pending', !consent);
    if (!consent) {
      closeChat({ restoreFocus: false });
      cookieBanner?.classList.remove('hidden');
      cookieBanner?.classList.add('visible');
    } else {
      cookieBanner?.classList.remove('visible');
      cookieBanner?.classList.add('hidden');
    }
    updateCookieUI();
  }

  function normalizeWhatsAppNumber(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function updateSocialPlaceholders() {
    const ready = normalizeWhatsAppNumber(SOCIALS.whatsappNumber).length >= 8;
    document.querySelectorAll('[data-social-placeholder="whatsapp"]').forEach((node) => {
      node.textContent = ready ? (SOCIALS.whatsappDisplay || `+${normalizeWhatsAppNumber(SOCIALS.whatsappNumber)}`) : activeContent.contact.whatsappSoon;
    });
  }

  function initSocialLinks() {
    const facebook = String(SOCIALS.facebook || 'https://www.facebook.com/profile.php?id=61591837417338');
    const instagram = String(SOCIALS.instagram || 'https://www.instagram.com/weburix/');
    const whatsappDigits = normalizeWhatsAppNumber(SOCIALS.whatsappNumber);
    const whatsappReady = whatsappDigits.length >= 8;

    document.querySelectorAll('[data-social="facebook"]').forEach((link) => {
      link.href = facebook;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
    document.querySelectorAll('[data-social="instagram"]').forEach((link) => {
      link.href = instagram;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
    document.querySelectorAll('[data-social="whatsapp"]').forEach((link) => {
      if (whatsappReady) {
        link.href = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent('Hallo Weburix, ich interessiere mich für eure Leistungen.')}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.classList.remove('is-disabled');
        link.removeAttribute('aria-disabled');
      } else {
        link.removeAttribute('href');
        link.removeAttribute('target');
        link.classList.add('is-disabled');
        link.setAttribute('aria-disabled', 'true');
      }
    });

    document.querySelectorAll('.footer-brand').forEach((brand) => {
      if (brand.querySelector('.footer-socials')) return;
      const socials = document.createElement('div');
      socials.className = 'footer-socials';
      socials.innerHTML = `
        <a data-social="facebook" href="${escapeHtml(facebook)}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><img src="${getAssetPrefix()}assets/img/social/facebook.svg" alt="" width="20" height="20" /></a>
        <a data-social="instagram" href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src="${getAssetPrefix()}assets/img/social/instagram.svg" alt="" width="20" height="20" /></a>
        <a data-social="whatsapp" aria-label="WhatsApp"><img src="${getAssetPrefix()}assets/img/social/whatsapp.svg" alt="" width="20" height="20" /></a>`;
      brand.appendChild(socials);
    });
    updateSocialPlaceholders();
  }

  function getAssetPrefix() {
    const appScript = Array.from(document.scripts).find((script) => /assets\/js\/app\.js(?:\?|$)/.test(script.src));
    if (!appScript) return '';
    try {
      const url = new URL(appScript.src, window.location.href);
      return url.pathname.replace(/assets\/js\/app\.js$/, '').replace(/^\//, '/');
    } catch (_) { return ''; }
  }

  function updateVatNotice() {
    const mode = String((window.WEBURIX_LEGAL || {}).vatMode || 'unset');
    const messages = {
      de: {
        'small-business': 'Endpreise. Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.',
        'vat-included': 'Alle gegenüber Verbrauchern genannten Preise enthalten die gesetzliche Umsatzsteuer.',
        'b2b-net': 'Alle Preise netto zuzüglich gesetzlicher Umsatzsteuer. Dieses Angebot richtet sich ausschließlich an Unternehmer.',
        unset: 'Vor Veröffentlichung muss der korrekte Umsatzsteuerhinweis in site-config.js festgelegt werden.'
      },
      en: {
        'small-business': 'Final prices. No VAT is shown under the German small-business rule (§ 19 UStG).',
        'vat-included': 'All consumer-facing prices include statutory VAT.',
        'b2b-net': 'All prices are net plus statutory VAT. This offer is intended exclusively for businesses.',
        unset: 'Set the correct VAT mode in site-config.js before publication.'
      },
      sr: {
        'small-business': 'Krajnje cene. PDV se ne iskazuje prema nemačkom pravilu za mala preduzeća (§ 19 UStG).',
        'vat-included': 'Sve cene namenjene potrošačima uključuju zakonski PDV.',
        'b2b-net': 'Sve cene su neto, bez zakonskog PDV-a. Ponuda je namenjena isključivo firmama.',
        unset: 'Pre objave postavi tačan poreski režim u fajlu site-config.js.'
      }
    };
    const message = messages[activeLang]?.[mode] || messages[activeLang]?.unset || messages.de.unset;
    document.querySelectorAll('[data-vat-notice]').forEach((node) => {
      node.textContent = message;
      node.classList.toggle('is-warning', mode === 'unset');
    });
  }

  function initLegalFields() {
    const legal = window.WEBURIX_LEGAL || {};
    const placeholders = {
      ownerName: '[Vollständigen Namen eintragen]',
      legalForm: '',
      street: '[Straße und Hausnummer eintragen]',
      postalCode: '[PLZ]',
      city: 'München',
      country: 'Deutschland',
      phone: '[Geschäftliche Telefonnummer eintragen]',
      vatId: '[falls vorhanden]',
      registerCourt: '[falls vorhanden]',
      registerNumber: '[falls vorhanden]'
    };
    document.querySelectorAll('[data-legal]').forEach((node) => {
      const key = node.dataset.legal;
      const raw = String(legal[key] || '').trim();
      const value = raw || placeholders[key] || '';
      node.textContent = value;
      node.classList.toggle('legal-placeholder', !raw);
      if (node.tagName === 'A') {
        if (key === 'email') node.href = `mailto:${raw || 'info@weburix.com'}`;
        if (key === 'phone' && raw) node.href = `tel:${raw.replace(/[^+\d]/g, '')}`;
      }
    });
    document.querySelectorAll('[data-legal-if]').forEach((node) => {
      const key = node.dataset.legalIf;
      node.hidden = !String(legal[key] || '').trim();
    });
    document.querySelectorAll('[data-legal-if-any]').forEach((node) => {
      const keys = String(node.dataset.legalIfAny || '').split(',').map((key) => key.trim()).filter(Boolean);
      node.hidden = !keys.some((key) => String(legal[key] || '').trim());
    });
    document.querySelectorAll('[data-legal-dispute]').forEach((node) => {
      const mode = String(legal.consumerDispute || 'unset');
      const copy = {
        'not-participating': 'Weburix ist nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
        participating: 'Weburix nimmt an Streitbeilegungsverfahren vor der im Folgenden genannten Verbraucherschlichtungsstelle teil. Die zuständige Stelle muss hier ergänzt werden.',
        unset: 'Vor Veröffentlichung muss geprüft und festgelegt werden, ob eine Teilnahme an Verbraucherstreitbeilegungsverfahren erfolgt.'
      };
      node.textContent = copy[mode] || copy.unset;
      node.classList.toggle('legal-placeholder', mode === 'unset');
    });
    document.querySelectorAll('[data-checkout-legal-link]').forEach((node) => {
      node.hidden = legal.directCheckoutEnabled !== true;
    });
    const required = ['ownerName', 'street', 'postalCode', 'city', 'email'];
    const incomplete = required.some((key) => !String(legal[key] || '').trim()) || legal.vatMode === 'unset';
    document.documentElement.classList.toggle('legal-config-incomplete', incomplete);
    document.querySelectorAll('[data-legal-warning]').forEach((node) => { node.hidden = !incomplete; });
    updateVatNotice();
  }

  function updateScrollUI() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (scrollProgress) scrollProgress.style.transform = `scaleX(${progress})`;
    backToTop?.classList.toggle('visible', window.scrollY > 560);
  }

  cartRequestButton?.addEventListener('click', transferCartToRequest);
  cartClearButton?.addEventListener('click', () => { cartItems = []; renderCart(true); });
  promoApplyButton?.addEventListener('click', applyPromoCode);
  promoRemoveButton?.addEventListener('click', removePromoCode);
  promoInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); applyPromoCode(); }
  });

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => { updateScrollUI(); scrollTicking = false; });
  }, { passive: true });

  let resizeTicking = false;
  let lastViewportWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (resizeTicking) return;
    resizeTicking = true;
    window.requestAnimationFrame(() => {
      updateAccordionHeights();
      const nextWidth = window.innerWidth;
      root.classList.toggle('short-viewport', window.innerHeight < 650);
      // Mobile browsers resize the viewport when their address bar moves.
      // Do not close an open menu for those small height-only changes.
      if ((lastViewportWidth <= 1280 && nextWidth > 1280) || Math.abs(nextWidth - lastViewportWidth) > 160) {
        closeMobileNav();
        languageMenu?.removeAttribute('open');
        document.querySelector('.currency-menu')?.removeAttribute('open');
      }
      lastViewportWidth = nextWidth;
      resizeTicking = false;
    });
  }, { passive: true });
  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => { closeMobileNav(); languageMenu?.removeAttribute('open'); document.querySelector('.currency-menu')?.removeAttribute('open'); updateAccordionHeights(); }, 120);
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    const cookieModal = document.getElementById('cookie-settings-modal');
    if (event.key === 'Tab' && cookieModal?.classList.contains('visible')) {
      const focusable = [...cookieModal.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hasAttribute('disabled') && !element.hasAttribute('inert') && element.getClientRects().length);
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    if (event.key === 'Escape') {
      closeMobileNav();
      closeChat();
      languageMenu?.removeAttribute('open');
      document.querySelector('.currency-menu')?.removeAttribute('open');
      closeCookieSettings();
    }
  });

  document.addEventListener('input', (event) => {
    const field = event.target.closest('input, textarea, select');
    if (field) field.classList.toggle('is-filled', Boolean(field.value));
  });



  // Weburix V5: real smooth scroll + refresh animation system
  function smoothScrollToTarget(targetId, { focus = false } = {}) {
    let target = null;
    try { target = document.querySelector(targetId); } catch (_) { return false; }
    if (!target) return false;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - Math.max(12, headerHeight + 10);
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    if (focus) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    return true;
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    if (smoothScrollToTarget(href, { focus: link.classList.contains('skip-link') })) {
      event.preventDefault();
      closeMobileNav();
      try { history.replaceState(null, '', href); } catch (_) {}
    }
  });

  function showSubmissionReturnNotice() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') !== '1') return;
    const notice = document.createElement('div');
    notice.className = 'submission-return-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '✓';
    const message = document.createElement('span');
    message.dataset.i18n = 'forms.apiSuccess';
    message.textContent = activeContent.forms.apiSuccess;
    notice.append(icon, message);
    document.body.appendChild(notice);
    window.requestAnimationFrame(() => notice.classList.add('visible'));
    window.setTimeout(() => {
      notice.classList.remove('visible');
      window.setTimeout(() => notice.remove(), reducedMotion ? 0 : 220);
    }, 8000);
    params.delete('sent');
    const query = params.toString();
    const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', cleanUrl);
  }

  function refreshMotion() {
    document.querySelectorAll('.service-card, .idea-card, .quality-card, .price-card, .checkout-option, .integration-card, .form-card, .contact-card, .timeline-item, .work-card, .proof-pill, .portal-card, .launch-checklist label, .result-card, .testimonial-card, .example-card, .support-plan, .course-card, .price-list-card, .slogan-grid span, .knowledge-card').forEach((el, index) => {
      el.style.setProperty('--stagger', `${Math.min(index, 12) * 45}ms`);
    });
  }


  // Weburix V7: extra motion layer for cards/buttons without external libraries
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (finePointer && !reducedMotion && !saveData && !lowPowerDevice && window.innerWidth >= 1100) {
    let tiltFrame = 0;
    let tiltEvent = null;
    document.addEventListener('pointermove', (event) => {
      const candidate = event.target?.closest?.('.tilt-card');
      if (!candidate) return;
      tiltEvent = { event, card: candidate };
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        const current = tiltEvent?.event;
        const card = tiltEvent?.card;
        tiltFrame = 0;
        if (!current || !card) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (current.clientX - rect.left) / rect.width - 0.5;
        const y = (current.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--mx', `${50 + x * 38}%`);
        card.style.setProperty('--my', `${50 + y * 38}%`);
        card.style.setProperty('--rx', `${(-y * 2.4).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 3.2).toFixed(2)}deg`);
      });
    }, { passive: true });
    document.addEventListener('pointerout', (event) => {
      const card = event.target?.closest?.('.tilt-card');
      if (!card || card.contains(event.relatedTarget)) return;
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  }

  document.addEventListener('pointerdown', (event) => {
    if (reducedMotion || saveData || lowPowerDevice || event.pointerType === 'touch') return;
    const target = event.target.closest('button, .button, a, .check-pill span, .payment-chip, .cart-qty button');
    if (!target) return;
    const ripple = document.createElement('span');
    ripple.className = 'ux-ripple';
    const rect = target.getBoundingClientRect();
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 460);
  });


  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('page-hidden', document.hidden);
  }, { passive: true });
  if (mobileNavMedia) {
    const syncNav = () => syncMobileNavAccessibility();
    if (typeof mobileNavMedia.addEventListener === 'function') mobileNavMedia.addEventListener('change', syncNav);
    else if (typeof mobileNavMedia.addListener === 'function') mobileNavMedia.addListener(syncNav);
  }

  document.querySelectorAll('[data-form-status]').forEach((status) => status.setAttribute('role', 'status'));
  syncMobileNavAccessibility();
  const storedLanguage = readStoredLanguage();
  setLanguage(storedLanguage || DEFAULT_LANG);
  showSubmissionReturnNotice();
  initCookieBanner();
  initSocialLinks();
  initLegalFields();
  if (!storedLanguage && hasFunctionalConsent()) {
    resolveInitialLanguage().then((detectedLanguage) => {
      if (detectedLanguage && detectedLanguage !== activeLang) setLanguage(detectedLanguage);
    }).catch(() => {});
  }
  refreshMotion();
  updateScrollUI();
  observeRevealElements();
  window.__WEBURIX_APP_READY__ = true;
})();
