# Weburix deployment checklist

## GitHub Pages

1. Upload the contents of this folder to the repository root.
2. In GitHub: **Settings → Pages → Deploy from a branch** and select the main branch/root folder.
3. The included `CNAME` points to `weburix.com`. Remove or change it if another domain is used.
4. Configure the custom domain in GitHub Pages, then enable **Enforce HTTPS**.
5. At the DNS provider, use the records shown by GitHub for the apex domain and `www` redirect.

The public homepage will be `https://weburix.com/`. Visitors do not see `index.html` when they enter through the domain.

## Forms

Create a Web3Forms access key and place it in `assets/js/site-config.js`. Test every form after deployment. The current code uses a timeout, duplicate-submit protection, a honeypot and clear success/error states.

## Payments

Use hosted Stripe or PayPal payment links only. Add public payment URLs to `assets/js/site-config.js`; never add secret keys to this repository. Before activation, finalise company details, tax wording, terms, cancellation/withdrawal information and subscription conditions.

## Final checks

Run:

```bash
python3 scripts/qa.py
```

Then test the deployed site on a real iPhone/Android device plus current Safari, Firefox and Chrome.

## Language detection

German is the default without any external request. The CSP must allow `https://api.country.is` in `connect-src` only if optional country-based language selection remains enabled. The request runs after functional consent. Disable `WEBURIX_AUTO_LANGUAGE` to remove this feature, then remove the domain from the CSP and update the privacy notice.

## GitHub Pages security-header note

The included `_headers` file is not applied by GitHub Pages. On GitHub Pages, enforce HTTPS and verify the custom domain; the in-document CSP remains a partial browser-side fallback. If server-controlled CSP, frame protection or other custom response headers become a requirement, use a compatible proxy/CDN or a host such as Cloudflare Pages, Netlify or Vercel and re-test all forms and routes afterward.
