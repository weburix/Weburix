// Weburix integrations — add real values only after the business, legal pages and prices are final.

// Contact forms on GitHub Pages: FormSubmit works without a secret frontend key.
// IMPORTANT: the first test submission sends a one-time activation email to info@weburix.com.
// Open that email and confirm the form once; after activation, requests arrive directly in the inbox.
window.WEBURIX_FORM_MODE = 'formsubmit';
window.WEBURIX_FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/info@weburix.com';
// Reliable fallback: if AJAX is blocked, submit the same form as a normal HTTPS POST.
// This avoids depending on a locally configured email application.

// Launch-state checklist. These values do not contain secrets. Update them only after each external step is genuinely complete.
window.WEBURIX_LAUNCH = {
  publicUrl: 'https://weburix.github.io/weburixsite/',
  customDomain: '',
  hostingProvider: 'github-pages', // github-pages, cloudflare-pages, netlify, vercel or other
  businessRegistered: false,
  domainOwned: false,
  dnsAndHttpsReady: false,
  businessEmailReady: false,
  formsubmitActivated: false,
  formProviderPrivacyReviewed: false,
  hostingPrivacyReviewed: false,
  realDeviceTested: false
};


// Optional hosted Stripe/PayPal links. Never place secret API keys in frontend code.
// Key format: '<checkout item id>:stripe' or '<checkout item id>:paypal'.
// Stripe links may be one-time or recurring subscription Payment Links.
window.WEBURIX_PAYMENT_LINKS = {
  // 'starter:stripe': 'https://buy.stripe.com/...',
  // 'business:stripe': 'https://buy.stripe.com/...',
  // 'care-essential:stripe': 'https://buy.stripe.com/...',
  // 'care-business:stripe': 'https://buy.stripe.com/...',
  // 'care-priority:stripe': 'https://buy.stripe.com/...',
  // 'course-web:paypal': 'https://www.paypal.com/ncp/payment/...'
  // 'content-refresh:stripe': 'https://buy.stripe.com/...',
  // 'digital-pr:stripe': 'https://buy.stripe.com/...' 
};

// Automatic first-visit language selection for static hosting.
// Germany and Austria -> German; former Yugoslavia region -> Serbian; all other countries -> English.
// A visitor's manual language choice is stored locally and always takes priority.
window.WEBURIX_AUTO_LANGUAGE = true;
window.WEBURIX_GEO_ENDPOINT = 'https://api.country.is/';

// Public social channels. These values are safe to keep in frontend code.
window.WEBURIX_SOCIALS = {
  facebook: 'https://www.facebook.com/profile.php?id=61591837417338',
  instagram: 'https://www.instagram.com/weburix/',

  // Add digits only, including country code, for example: 4917612345678
  // Leave empty until you have a dedicated business number. The website will show a clear placeholder instead of opening a wrong number.
  whatsappNumber: '',
  whatsappDisplay: '+49 000 00000000'
};

// Consent manager version. Increase this number if privacy-relevant integrations change,
// so visitors are asked for a fresh decision.
window.WEBURIX_CONSENT_VERSION = 4;

// Enter the final business details once here before publishing.
// These values populate the legal pages. Do not publish with empty required fields.
window.WEBURIX_LEGAL = {
  businessName: 'Weburix',
  ownerName: '',
  legalForm: '',
  street: '',
  postalCode: '',
  city: 'München',
  country: 'Deutschland',
  email: 'info@weburix.com',
  phone: '',
  vatId: '',
  registerCourt: '',
  registerNumber: '',
  // Choose after speaking to the tax office / tax adviser:
  // 'small-business' = § 19 UStG, 'vat-included' = consumer gross prices, 'b2b-net' = B2B only.
  vatMode: 'unset',
  consumerDispute: 'not-participating',
  // Optional: only needed when editorial/journalistic content requires a named responsible person.
  contentResponsibleName: '',
  // Keep false while the website only creates non-binding enquiries.
  // Set true only after B2C checkout, AGB, withdrawal information and cancellation flow are legally final.
  directCheckoutEnabled: false
};


// Serbian price display. EUR remains the contractual/base currency; RSD is an informative conversion.
// The rate below is the official NBS middle EUR/RSD rate for the stated date.
// Update rate and rateDate together whenever you want to refresh the displayed dinar amounts.
window.WEBURIX_CURRENCY = {
  baseCurrency: 'EUR',
  rsdRate: 117.3829,
  rateDate: '2026-07-21',
  defaultSerbianMode: 'both', // 'both', 'eur' or 'rsd'
  billingCurrency: 'EUR',
  roundRsdTo: 10
};



// Public promo codes for the non-binding request configurator.
// These codes are estimates only and must be confirmed in the written offer.
window.WEBURIX_PROMO_CODES = {
  enabled: true,
  codes: [
    {
      code: 'WEBURIX5',
      percent: 5,
      startsAt: '2026-07-21T00:00:00+02:00',
      endsAt: '2026-12-31T23:59:59+01:00',
      minOneTime: 100,
      maxDiscount: 150,
      billing: 'one-time',
      label: { de: '5 % Willkommensvorteil', en: '5% welcome discount', sr: '5% popusta dobrodošlice' }
    }
  ]
};

// Optional price-promotion display. It is intentionally disabled.
// Enable only for a genuine, temporary campaign after the crossed-out prices were real prices,
// and keep written evidence of the period in which those prices were actually offered.
window.WEBURIX_PROMOTION = {
  enabled: false,
  percent: 10,
  startsAt: '', // ISO example: '2026-09-01T00:00:00+02:00'
  endsAt: '',   // ISO example: '2026-09-14T23:59:59+02:00'
  label: {
    de: '10 % Aktionsvorteil',
    en: '10% limited offer',
    sr: '10% vremenski ograničen popust'
  }
};
