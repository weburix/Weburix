(() => {
  const DEFAULT_LANG = 'de';
  const availableLanguages = ['de', 'en', 'sr'];
  const root = document.documentElement;
  root.classList.add('weburix-js');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  root.classList.toggle('weburix-motion-on', !reducedMotion);
  const loader = document.getElementById('loader');
  const navToggle = document.querySelector('.nav-toggle');
  const navPanel = document.querySelector('.nav-panel');
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
  const FORM_CONFIG = {
    // For GitHub Pages this must use an external form backend.
    // Recommended for this template: Web3Forms. Get a free access key and paste it into assets/js/site-config.js.
    mode: (window.WEBURIX_FORM_MODE || 'web3forms'), // 'web3forms', 'formspree', 'netlify' or 'mailto'
    recipient: 'info@weburix.com',
    formspreeEndpoint: (window.WEBURIX_FORMSPREE_ENDPOINT || ''),
    web3formsAccessKey: (window.WEBURIX_WEB3FORMS_ACCESS_KEY || 'PASTE_YOUR_WEB3FORMS_ACCESS_KEY_HERE')
  };
  const PAYMENT_LINKS = window.WEBURIX_PAYMENT_LINKS || {};
  const SOCIALS = window.WEBURIX_SOCIALS || {};
  const CONSENT_KEY = 'weburix-consent-v2';
  const CONSENT_VERSION = Number(window.WEBURIX_CONSENT_VERSION || 2);
  let activeLang = DEFAULT_LANG;
  let activeContent = WEBURIX_CONTENT[DEFAULT_LANG];
  let cartItems = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('weburix-cart') || '[]');
      return Array.isArray(saved) ? saved.filter((item) => item && typeof item.id === 'string' && Number(item.qty) > 0) : [];
    } catch (error) { return []; }
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
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

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = getValue(node.dataset.i18n, activeContent);
      if (typeof value === 'string') node.textContent = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const value = getValue(node.dataset.i18nPlaceholder, activeContent);
      if (typeof value === 'string') node.setAttribute('placeholder', value);
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
      <article class="integration-card tilt-card" tabindex="0">
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
    return `<article class="result-card reveal tilt-card" tabindex="0">
      <strong>${escapeHtml(item.value)}</strong>
      <span>${escapeHtml(item.label)}</span>
      <p>${escapeHtml(item.text)}</p>
    </article>`;
  }

  function testimonialTemplate(item) {
    return `<article class="testimonial-card reveal tilt-card" tabindex="0">
      <p>${escapeHtml(item.quote)}</p>
      <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.role)}</span></div>
    </article>`;
  }

  function packageExampleTemplate(item) {
    const points = (item.includes || []).map((point) => `<li>${escapeHtml(point)}</li>`).join('');
    return `<article class="example-card reveal tilt-card" tabindex="0">
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
          <strong>${escapeHtml(item.priceLabel)}</strong>
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
    const amount = Number(value) || 0;
    try {
      return new Intl.NumberFormat(activeLang === 'de' ? 'de-DE' : activeLang === 'sr' ? 'sr-Latn-RS' : 'en-US', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0
      }).format(amount);
    } catch (_) {
      return `${Math.round(amount).toLocaleString()} €`;
    }
  }

  function addToCart(id) {
    const source = getCheckoutItemById(id);
    if (!source) return;
    const existing = cartItems.find((item) => item.id === id);
    if (existing) existing.qty = Math.min(9, existing.qty + 1);
    else cartItems.push({ id, qty: 1 });
    renderCart(true);
  }

  function changeCartQty(id, delta) {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) return;
    item.qty = Math.min(9, item.qty + delta);
    if (item.qty <= 0) cartItems = cartItems.filter((entry) => entry.id !== id);
    renderCart(true);
  }

  function renderCart(pulse = false) {
    if (!cartItemsEl || !cartTotalEl || !cartCountEl || !cartEmptyEl) return;
    // Remove stale cart entries left behind after package/price changes.
    cartItems = cartItems.filter((entry) => getCheckoutItemById(entry.id));
    const totals = cartItems.reduce((sum, entry) => {
      const source = getCheckoutItemById(entry.id);
      const value = (source?.price || 0) * entry.qty;
      if (source?.billing === 'monthly') sum.monthly += value;
      else sum.oneTime += value;
      return sum;
    }, { oneTime: 0, monthly: 0 });
    const count = cartItems.reduce((sum, entry) => sum + entry.qty, 0);
    cartCountEl.textContent = String(count);
    try { localStorage.setItem('weburix-cart', JSON.stringify(cartItems)); } catch (error) {}
    const parts = [];
    if (totals.oneTime) parts.push(`<span><small>${escapeHtml(activeContent.checkout.oneTimeLabel || '')}</small>${formatEuro(totals.oneTime)}</span>`);
    if (totals.monthly) parts.push(`<span><small>${escapeHtml(activeContent.checkout.monthlyLabel || '')}</small>${formatEuro(totals.monthly)}</span>`);
    cartTotalEl.innerHTML = parts.length ? parts.join('') : `<span>${formatEuro(0)}</span>`;
    cartEmptyEl.hidden = count > 0;
    cartItemsEl.innerHTML = cartItems.map((entry) => {
      const source = getCheckoutItemById(entry.id);
      if (!source) return '';
      return `<div class="cart-line">
        <div><strong>${escapeHtml(source.name)}</strong><span>${escapeHtml(source.priceLabel)}</span></div>
        <div class="cart-qty">
          <button type="button" data-cart-qty="${escapeHtml(entry.id)}" data-delta="-1" aria-label="Minus">−</button>
          <span>${entry.qty}</span>
          <button type="button" data-cart-qty="${escapeHtml(entry.id)}" data-delta="1" aria-label="Plus">+</button>
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
      return source ? `- ${source.name} (${source.priceLabel}) x ${entry.qty}` : '';
    }).filter(Boolean);
    const intro = activeContent.checkout.requestIntro || 'Selected services:';
    message.value = `${intro}\n${lines.join('\n')}`;
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
      const previous = select.value;
      select.innerHTML = (map[key] || []).map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
      if ([...select.options].some((option) => option.value === previous)) select.value = previous;
    });
  }

  function renderServiceChecks(items) {
    const container = document.getElementById('service-checks');
    if (!container) return;
    container.innerHTML = items.map((item, index) => {
      const id = `service-check-${activeLang}-${index}`;
      return `<label class="check-pill" for="${id}"><input id="${id}" name="interests" type="checkbox" value="${escapeHtml(item)}"><span>${escapeHtml(item)}</span></label>`;
    }).join('');
  }

  function renderSeoFocus(items) {
    const select = document.querySelector('[data-seo-focus]');
    if (!select) return;
    const previous = select.value;
    select.innerHTML = items.map((item, index) => `<option value="${index === 0 ? '' : escapeHtml(item)}" ${index === 0 ? 'disabled' : ''}>${escapeHtml(item)}</option>`).join('');
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
    else select.value = '';
  }

  function serviceCardTemplate(item) {
    return `
      <article class="service-card reveal tilt-card" tabindex="0">
        <span>${escapeHtml(item.icon)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
  }

  function ideaCardTemplate(item, index) {
    return `
      <article class="idea-card reveal tilt-card" tabindex="0">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
  }

  function qualityCardTemplate(item, index) {
    return `
      <article class="quality-card reveal tilt-card" tabindex="0">
        <span aria-hidden="true">→</span>
        <small>${String(index + 1).padStart(2, '0')}</small>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
  }

  function renderServiceTabs(items) {
    const container = document.getElementById('service-tabs');
    if (!container) return;
    const buttons = items.map((item, index) => `<button class="tab-button ${index === 0 ? 'active' : ''}" id="service-tab-${index}" type="button" role="tab" data-tab-index="${index}" aria-selected="${index === 0}" aria-controls="service-panel-${index}" tabindex="${index === 0 ? '0' : '-1'}">${escapeHtml(item.title)}</button>`).join('');
    const panels = items.map((item, index) => {
      const points = item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
      return `<article class="tab-panel ${index === 0 ? 'active' : ''}" id="service-panel-${index}" role="tabpanel" aria-labelledby="service-tab-${index}" aria-hidden="${index !== 0}" data-tab-panel="${index}">
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
        <div class="launch-price-tag">${escapeHtml(activeContent.packages.saving || '')}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="package-label">${escapeHtml(item.label)}</p>
        <div class="package-price"><strong>${escapeHtml(item.price)}</strong></div>
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
        <div class="support-price"><strong>${escapeHtml(item.price)}</strong><span>${escapeHtml(item.period)}</span></div>
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
        <div class="course-price"><strong>${escapeHtml(item.price)}</strong></div>
        <ul>${points}</ul>
        <a class="button button-soft" href="#request">${escapeHtml(section.cta)}</a>
      </article>`;
    }).join('');
  }

  function renderPriceList(section) {
    const container = document.getElementById('price-list-grid');
    if (!container || !section) return;
    container.innerHTML = (section.groups || []).map((group) => {
      const rows = (group.items || []).map((item) => `<div class="price-row"><span>${escapeHtml(item.name)}</span><div><strong>${escapeHtml(item.price)}</strong></div></div>`).join('');
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
    container.innerHTML = items.map((item, index) => `
      <article class="faq-item reveal ${index === 0 ? 'open' : ''}">
        <button class="faq-question" id="faq-button-${index}" type="button" aria-expanded="${index === 0}" aria-controls="faq-answer-${index}">
          <span>${escapeHtml(item.q)}</span><i aria-hidden="true">+</i>
        </button>
        <div class="faq-answer" id="faq-answer-${index}" role="region" aria-labelledby="faq-button-${index}" aria-hidden="${index !== 0}"><p>${escapeHtml(item.a)}</p></div>
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
    status.textContent = message || '';
    status.dataset.status = type;
    status.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  }

  function collectFormPayload(form) {
    const data = new FormData(form);
    data.set('form_type', form.dataset.formType || 'contact');
    const honeypot = String(data.get('website_url') || '').trim();
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

  function formToMail(form, payload) {
    const type = form.dataset.formType;
    const subjects = { project: 'Projektanfrage Weburix', quick: 'Kontakt Weburix', newsletter: 'Newsletter Weburix', portal: 'Portal Zugang Weburix', 'seo-check': 'Kostenloser SEO-Kurzcheck Weburix' };
    const subject = subjects[type] || 'Weburix Anfrage';
    const lines = Object.entries(payload.grouped).map(([key, value]) => `${payload.labels[key] || key}: ${value}`);
    const body = lines.join('\n');
    window.location.href = `mailto:${FORM_CONFIG.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setFormStatus(form, activeContent.forms.success, 'success');
  }

  async function fetchWithTimeout(url, options, timeoutMs = 12000) {
    const controller = 'AbortController' in window ? new AbortController() : null;
    const timer = window.setTimeout(() => controller?.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, ...(controller ? { signal: controller.signal } : {}) });
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function submitToNetlify(form, payload) {
    const body = new URLSearchParams(payload.data).toString();
    const response = await fetchWithTimeout('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!response.ok) throw new Error('Netlify form error');
  }

  async function submitToFormspree(form, payload) {
    if (!FORM_CONFIG.formspreeEndpoint) throw new Error('Missing Formspree endpoint');
    const response = await fetchWithTimeout(FORM_CONFIG.formspreeEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload.data
    });
    if (!response.ok) throw new Error('Formspree error');
  }

  function hasRealWeb3FormsKey() {
    return FORM_CONFIG.web3formsAccessKey && !/PASTE_|YOUR_|XXXX|REPLACE/i.test(FORM_CONFIG.web3formsAccessKey);
  }

  async function submitToWeb3Forms(form, payload) {
    if (!hasRealWeb3FormsKey()) {
      const error = new Error('Missing Web3Forms access key');
      error.code = 'MISSING_WEB3FORMS_KEY';
      throw error;
    }
    payload.data.set('access_key', FORM_CONFIG.web3formsAccessKey);
    payload.data.set('from_name', 'Weburix Website');
    payload.data.set('botcheck', '');
    const subjects = { project: 'Projektanfrage Weburix', quick: 'Kontakt Weburix', newsletter: 'Newsletter Weburix', portal: 'Portal Zugang Weburix', 'seo-check': 'Kostenloser SEO-Kurzcheck Weburix' };
    payload.data.set('subject', subjects[form.dataset.formType] || 'Weburix Anfrage');
    const response = await fetchWithTimeout('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload.data
    });
    let result = null;
    try { result = await response.json(); } catch (_) {}
    if (!response.ok || (result && result.success === false)) throw new Error(result?.message || 'Web3Forms error');
  }

  async function submitForm(form) {
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
      if (FORM_CONFIG.mode === 'netlify') await submitToNetlify(form, payload);
      else if (FORM_CONFIG.mode === 'formspree') await submitToFormspree(form, payload);
      else if (FORM_CONFIG.mode === 'web3forms') await submitToWeb3Forms(form, payload);
      else {
        formToMail(form, payload);
        return;
      }
      setFormStatus(form, activeContent.forms.apiSuccess, 'success');
      form.reset();
      form.querySelectorAll('.is-filled').forEach((field) => field.classList.remove('is-filled'));
      if (form.dataset.formType === 'project') { cartItems = []; renderCart(); }
    } catch (error) {
      console.warn(error);
      const missingKey = error && error.code === 'MISSING_WEB3FORMS_KEY';
      setFormStatus(form, missingKey ? activeContent.forms.configMissing : activeContent.forms.error, 'error');
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
    submitForm(form);
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

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navPanel?.classList.toggle('open', !isOpen);
    document.body.classList.toggle('nav-open', !isOpen);
  });

  navPanel?.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    navPanel.querySelectorAll('.nav-more[open]').forEach((menu) => menu.removeAttribute('open'));
    closeMobileNav();
  });
  document.addEventListener('pointerdown', (event) => {
    document.querySelectorAll('.nav-more[open], .language-menu[open]').forEach((menu) => {
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
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' })
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
    chatWidget?.classList.add('open');
    chatWidget?.setAttribute('aria-hidden', 'false');
    setTimeout(() => chatInput?.focus(), 80);
  }

  function closeChat() {
    chatWidget?.classList.remove('open');
    chatWidget?.setAttribute('aria-hidden', 'true');
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
    message.textContent = text;
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
    if (/integration|integrationen|api|netlify|formspree|web3forms|tool|tools/.test(input)) return answers.integrations || answers.forms || answers.contact;
    if (/paket|package|plan|starter|business|growth|care|social.+youtube|ponud|angebot/.test(input)) return answers.packages;
    if (/preis|price|cost|kosten|cena|cijena|kosta|kost|budget|budzet|budzet|€|euro/.test(input)) return answers.price;
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
    if (/formular|formulare|forms|contact form|kontaktformular|web3forms|formspree|netlify/.test(input)) return answers.forms || answers.contact;
    if (/hosting|host|github pages|server|deploy|deployment|netlify/.test(input)) return answers.hosting || answers.domain;
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

  document.addEventListener('click', (event) => {
    const clickable = event.target.closest('a, button, .check-pill, .service-card, .idea-card, .timeline-item, .stats-grid div, .addon-grid span, .result-card, .testimonial-card, .example-card, .support-plan, .course-card, .price-list-card, .slogan-grid span, .knowledge-card');
    if (!clickable) return;
    clickable.classList.remove('click-pop');
    void clickable.offsetWidth;
    clickable.classList.add('click-pop');
    setTimeout(() => clickable.classList.remove('click-pop'), 360);
  });


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
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cookie-modal-open');
    window.setTimeout(() => modal.querySelector('.cookie-close')?.focus(), 60);
  }

  function closeCookieSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (!modal) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cookie-modal-open');
  }

  function initCookieBanner() {
    if (cookieBanner && !cookieBanner.querySelector('[data-cookie-settings]')) {
      const button = document.createElement('button');
      button.className = 'button button-ghost';
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
    if (!consent) {
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

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => { updateScrollUI(); scrollTicking = false; });
  }, { passive: true });

  let resizeTicking = false;
  window.addEventListener('resize', () => {
    if (resizeTicking) return;
    resizeTicking = true;
    window.requestAnimationFrame(() => { updateAccordionHeights(); closeMobileNav(); resizeTicking = false; });
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNav();
      closeChat();
      languageMenu?.removeAttribute('open');
      closeCookieSettings();
    }
  });

  document.addEventListener('input', (event) => {
    const field = event.target.closest('input, textarea, select');
    if (field) field.classList.toggle('is-filled', Boolean(field.value));
  });



  // Weburix V5: real smooth scroll + refresh animation system
  function smoothScrollToTarget(targetId) {
    const target = document.querySelector(targetId);
    if (!target) return false;
    const top = target.getBoundingClientRect().top + window.scrollY - 82;
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    return true;
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    if (smoothScrollToTarget(href)) {
      event.preventDefault();
      closeMobileNav();
      history.replaceState(null, '', href);
    }
  });

  function refreshMotion() {
    document.querySelectorAll('.service-card, .idea-card, .quality-card, .price-card, .checkout-option, .integration-card, .form-card, .contact-card, .timeline-item, .work-card, .proof-pill, .portal-card, .launch-checklist label, .result-card, .testimonial-card, .example-card, .support-plan, .course-card, .price-list-card, .slogan-grid span, .knowledge-card').forEach((el, index) => {
      el.style.setProperty('--stagger', `${Math.min(index, 12) * 45}ms`);
    });
  }


  // Weburix V7: extra motion layer for cards/buttons without external libraries
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (finePointer && !reducedMotion) {
    let tiltFrame = 0;
    let tiltEvent = null;
    document.addEventListener('pointermove', (event) => {
      tiltEvent = event;
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        const current = tiltEvent;
        tiltFrame = 0;
        const card = current?.target?.closest?.('.tilt-card');
        if (!card) return;
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
    if (reducedMotion) return;
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


  document.querySelectorAll('[data-form-status]').forEach((status) => status.setAttribute('role', 'status'));
  const storedLanguage = readStoredLanguage();
  setLanguage(storedLanguage || DEFAULT_LANG);
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
})();
