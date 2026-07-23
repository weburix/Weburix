# Weburix promotion and crossed-out-price guide

This is a practical internal checklist, not individual legal advice.

## Safe default

The website currently treats V22 prices as normal starting prices. The optional crossed-out-price display is disabled in `assets/js/site-config.js`.

Do not advertise a permanent “10% discount” if the higher price is not a genuine former price. A permanently reduced price normally becomes the real normal price, making the crossed-out reference increasingly misleading.

## Relevant German rules

- § 5 UWG prohibits misleading commercial practices. Under § 5(5), a claimed price reduction is presumed misleading when the higher price was demanded only for an unreasonably short time; the advertiser bears the burden of proving the price history.
- § 11 PAngV expressly requires the lowest price of the previous 30 days when announcing a price reduction for goods. Weburix primarily sells services, but the general UWG rules against misleading reference prices still apply.
- § 6 DDG requires promotional offers and their conditions to be clearly recognisable, easily accessible and unambiguous.

Official references:
- https://www.gesetze-im-internet.de/uwg_2004/__5.html
- https://www.gesetze-im-internet.de/pangv_2022/__11.html
- https://www.gesetze-im-internet.de/ddg/__6.html

## Conditions before enabling a campaign

1. The crossed-out price must be a genuine price that Weburix seriously offered, not an invented anchor price.
2. Keep dated records: published pages, offers, invoices and change logs.
3. Use a clear start and end date.
4. State which services, clients and booking dates qualify.
5. Do not automatically restart or extend the campaign so often that it becomes permanent.
6. Ensure the percentage matches the actual price difference.
7. Clearly state VAT treatment and excluded third-party costs.
8. Have the final campaign reviewed if it targets consumers or enables direct online ordering.

## Technical switch

In `assets/js/site-config.js`:

```js
window.WEBURIX_PROMOTION = {
  enabled: true,
  percent: 10,
  startsAt: '2026-09-01T00:00:00+02:00',
  endsAt: '2026-09-14T23:59:59+02:00',
  label: {
    de: '10 % Aktionsvorteil',
    en: '10% limited offer',
    sr: '10% vremenski ograničen popust'
  }
};
```

The website refuses to show the crossed-out-price promotion if no valid `endsAt` date is provided.
