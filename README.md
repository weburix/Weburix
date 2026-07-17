# Weburix Website — Launch Pricing, Courses & Support Edition

Static multilingual business website for GitHub Pages or another static host.

## Open locally

Open `index.html`. On a real domain/GitHub Pages the homepage is served as `https://weburix.com/`; visitors do not normally see `index.html` in the address bar.

## Languages

- German is the default
- English
- Serbian, Latin script

Texts, prices, FAQ, packages and chatbot replies are in `assets/js/content.js`.

## New offers and launch prices

The website now includes:

- Starter Site: from 790 €
- Business Web: from 1,590 €
- Growth Setup: from 2,390 €
- Google Local: from 199 €
- Social & YouTube: from 239 €/month
- Monthly support: 63 €, 119 € or 199 €/month
- Individual consulting: 76 €/hour; 5-hour block 349 €
- Live website, SEO/Google Business and YouTube/social courses
- Full transparent price list

Exact percentage-comparison claims and artificial strike-through prices are no longer shown publicly. Prices are presented as Weburix starting prices; the written individual quote is binding.

## Forms on GitHub Pages

GitHub Pages cannot send email by itself. The forms are prepared for Web3Forms.

Edit `assets/js/site-config.js`:

```js
window.WEBURIX_WEB3FORMS_ACCESS_KEY = 'YOUR_REAL_KEY';
```

Then contact, project, newsletter and portal forms can submit through Web3Forms.

## Stripe / PayPal preparation

The configurator/cart works without payment. Hosted payment links can be added later in `assets/js/site-config.js`:

```js
window.WEBURIX_PAYMENT_LINKS = {
  'starter:stripe': 'https://buy.stripe.com/...',
  'care-business:stripe': 'https://buy.stripe.com/...',
  'course-web:paypal': 'https://www.paypal.com/ncp/payment/...'
};
```

Never place Stripe or PayPal secret keys in frontend JavaScript. Create one-time or recurring hosted payment links in the provider dashboard.

Before activating payment, complete and legally review:

- Impressum
- Datenschutz
- AGB
- Widerrufsbelehrung / Widerrufsfunktion where required
- final prices and tax wording
- subscription duration and cancellation rules
- course format and FernUSG/ZFU relevance

The legal pages in this project are placeholders, not legal advice.

## Courses

Courses are described as live online workshops without a state-recognised certificate promise. Before sale, confirm the exact format legally. Recorded, supervised or asynchronous programmes can require a different legal assessment.

## Original illustrations

All product illustrations are original local SVG files in:

`assets/img/products/`

No stock-image licence or external image request is required.

## Performance and compatibility

- no external fonts
- no analytics or advertising trackers by default
- lazy-loaded product illustrations
- width/height attributes to reduce layout shift
- transform/opacity animations instead of heavy blur effects
- pointer effects disabled on touch devices
- requestAnimationFrame throttling for scroll and card tilt
- responsive layouts for wide desktop, laptop, tablet and phones down to 280–390 px
- viewport, safe-area, 16 px form-field and non-Chromium fallbacks for Safari and Firefox
- persistent local cart

## Main files

- `index.html` — homepage structure
- `assets/css/style.css` — design and responsive styles
- `assets/js/content.js` — translations, prices and offers
- `assets/js/app.js` — UI, forms, chatbot and cart
- `assets/js/site-config.js` — form and payment configuration
- `impressum/`, `datenschutz/`, `agb/`, `widerruf/` — legal placeholders

## Final launch checklist

1. Replace all legal placeholders with real business data.
2. Confirm whether prices include VAT or use the German small-business VAT rule.
3. Add the real Web3Forms key.
4. Add Stripe/PayPal links only after the checkout is legally ready.
5. Replace demo testimonials with genuine, verifiable feedback.
6. Test again on a real phone, Safari, Firefox and Chrome after deployment; the included static QA already checks code, links, assets, translations and responsive safeguards.
7. Compress PNG social images if needed; website product art already uses lightweight SVG.


## SEO-Wissenshub

Neu enthalten sind `/wissen/` und vier miteinander verlinkte Leitfäden zu interner Verlinkung/Content Refresh, Local SEO München, Google Business und Website-Kosten. Die Homepage enthält zusätzlich einen kostenlosen SEO-Kurzcheck als Web3Forms-Formular.

Vor Livegang: Artikel fachlich prüfen, echte Unternehmensdaten ergänzen und neue Inhalte regelmäßig aktualisieren. `rss.xml`, `sitemap.xml`, `404.html`, strukturierte Daten und ein Web-App-Manifest sind vorbereitet.

## V12 reliability and polish update

This version adds a final technical hardening pass without changing the established visual identity:

- early `boot.js` error capture and loader fail-safe
- shorter transform/opacity animations with no blur-based reveal lag
- reduced-motion support instead of forcing animation against device settings
- responsive navigation that no longer squeezes all links into laptop widths
- keyboard-accessible service tabs and properly labelled FAQ regions
- form request timeout, submission lock, clearer success/error states and extra submission context
- cart quantity limits and automatic cleanup after a successful project request
- Digital PR & expert-article service in DE/EN/SR, checkout and pricing
- GitHub Pages `CNAME`, deployment notes and security notes
- additional QA checks for image dimensions, link security, form live regions and required deployment files

Run `python3 scripts/qa.py` after every future content or price change.

## V14: Sprache und Kontakt

- Das Logo in der Hauptnavigation verlinkt ausdrücklich auf `index.html`.
- Die Sprachauswahl ist ein aufklappbares Menü mit lokalen SVG-Flaggen für DE, EN und SR.
- Eine manuell gewählte Sprache wird lokal gespeichert und hat immer Vorrang.
- Deutsch ist ohne gespeicherte Auswahl immer der technische Standard. Erst nach Zustimmung zur optionalen Komfortfunktion kann `api.country.is` ausschließlich den Ländercode liefern: Deutschland/Österreich -> Deutsch, Länder des ehemaligen Jugoslawiens -> Srpski, übrige Länder -> English.
- Die automatische Auswahl kann in `assets/js/site-config.js` über `WEBURIX_AUTO_LANGUAGE = false` deaktiviert werden.
- Neue Kontaktseite: `/kontakt/` mit Kurzkontakt, Projektanfrage, Beratungs- und Support-Hinweisen.
- Vor Veröffentlichung muss die Datenschutzerklärung mit den tatsächlich aktivierten Formular-, Zahlungs- und Geolocation-Diensten final geprüft werden.


## V16: German-first, legal and browser hardening

- German is rendered first on every initial visit. A manual language choice always wins.
- Country-based switching only runs after functional consent and never requests precise location.
- Exact “20% cheaper” public claims and artificial comparison-price displays were removed to reduce misleading-price risk.
- Form checkboxes acknowledge the privacy notice instead of relying on unnecessary consent wording for pre-contractual enquiries.
- Business/legal data can be entered once in `assets/js/site-config.js` under `WEBURIX_LEGAL`.
- Added mobile safe-area handling, viewport fallbacks, iOS form zoom prevention and touch/non-Chromium fallbacks.
- See `LEGAL-LAUNCH-CHECKLIST.md` before publication.
