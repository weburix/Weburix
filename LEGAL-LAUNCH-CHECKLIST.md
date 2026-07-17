# Weburix legal launch checklist (Germany)

This is a technical checklist, not individual legal or tax advice.

## Must be completed before publishing

1. Open `assets/js/site-config.js` and complete `WEBURIX_LEGAL`:
   - full owner/company name and legal form
   - serviceable business address
   - business email and phone
   - register information if applicable
   - VAT ID if applicable
   - correct `vatMode`
2. Register the Gewerbe and ensure the residence permit allows self-employment.
3. Decide whether the offer is B2B only, B2C or mixed. This affects prices, withdrawal rights, checkout and terms.
4. Select the correct VAT wording. Consumer prices generally need to be total prices; do not publish with `vatMode: 'unset'`.
5. Activate Web3Forms only after checking its data-processing agreement and matching the privacy notice to the real setup.
6. Activate Stripe/PayPal links only after the product, total price, duration, cancellation, terms and withdrawal information are final.
7. For recurring consumer subscriptions, legally review the cancellation-button process before activation.
8. For courses, have the exact live/recorded/self-study format checked for FernUSG/ZFU relevance.
9. Replace every demo testimonial with genuine, verifiable feedback before presenting it as a customer review.
10. If analytics, pixels, embedded videos, maps, external fonts or new SaaS tools are added, update consent settings and the privacy notice before loading them.

## Already implemented defensively

- German is the default language.
- Optional IP-country language lookup runs only after functional consent.
- No analytics or marketing trackers are loaded by default.
- Social networks are external links, not embedded plugins.
- Checkout is an enquiry cart by default, not an immediate binding purchase.
- Hosted payment links are placeholders; secret keys are never stored in frontend code.
- Exact percentage-discount claims and artificial comparison prices are not shown publicly.
- Privacy notice acknowledgement is separated from the legal basis for processing enquiries.
- Accessibility and responsive fallbacks are included, but a real-device review is still recommended.

## Official reference points checked on 17 July 2026

- Provider identification / Impressum: https://www.gesetze-im-internet.de/ddg/__5.html
- Device storage and consent exceptions: https://www.gesetze-im-internet.de/ttdsg/__25.html
- Consumer online-order button duties: https://www.gesetze-im-internet.de/bgb/__312j.html
- Online cancellation function for eligible consumer subscriptions: https://www.gesetze-im-internet.de/bgb/__312k.html
- Consumer price transparency: https://www.gesetze-im-internet.de/pangv_2022/
- Consumer dispute information: https://www.gesetze-im-internet.de/vsbg/__36.html
- Accessibility law and microenterprise definitions: https://www.gesetze-im-internet.de/bfsg/

## Accessibility / BFSG

Keep the current keyboard, contrast, labels and responsive fallbacks even if a microenterprise service exemption appears to apply. Before enabling a direct B2C e-commerce flow, assess the actual BFSG scope using the final company size, service and checkout model instead of assuming an exemption.
