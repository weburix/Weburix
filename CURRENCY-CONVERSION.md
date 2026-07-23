# Weburix EUR/RSD currency display

## Current configuration

- Base and billing currency: EUR
- Informative conversion: RSD
- Rate: 1 EUR = 117.3829 RSD
- Rate date: 2026-07-21
- Serbian default: EUR + RSD
- RSD values rounded to the nearest 10 dinars for clean display

## Update the rate

Open `assets/js/site-config.js` and update these values together:

```js
window.WEBURIX_CURRENCY = {
  baseCurrency: 'EUR',
  rsdRate: 117.3829,
  rateDate: '2026-07-21',
  defaultSerbianMode: 'both',
  billingCurrency: 'EUR',
  roundRsdTo: 10
};
```

The site deliberately does not fetch an exchange-rate API on every page load. This avoids another external request, prevents layout delays and keeps the privacy setup simpler. The final offer and payment remain in EUR unless a written offer explicitly states otherwise.
