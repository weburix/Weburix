// Weburix integrations — add real values only after the business, legal pages and prices are final.

// Contact forms on GitHub Pages: create a Web3Forms access key and paste it below.
window.WEBURIX_FORM_MODE = 'web3forms';
window.WEBURIX_WEB3FORMS_ACCESS_KEY = 'PASTE_YOUR_WEB3FORMS_ACCESS_KEY_HERE';

// Optional Formspree alternative:
// window.WEBURIX_FORM_MODE = 'formspree';
// window.WEBURIX_FORMSPREE_ENDPOINT = 'https://formspree.io/f/your-id';

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
window.WEBURIX_CONSENT_VERSION = 3;

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
  // Keep false while the website only creates non-binding enquiries.
  // Set true only after B2C checkout, AGB, withdrawal information and cancellation flow are legally final.
  directCheckoutEnabled: false
};
