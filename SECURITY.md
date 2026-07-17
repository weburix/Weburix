# Security notes

- Never commit passwords, Stripe/PayPal secret keys, private API tokens or Supabase service-role keys.
- Web3Forms access keys are intended for client-side forms, but domain restrictions and spam protection should still be enabled in its dashboard.
- Keep GitHub account 2FA enabled and use protected branches for production.
- Review third-party integrations before adding scripts; update the Content Security Policy and privacy notice when a new provider is introduced.
- Use hosted checkout pages for card payments. The Weburix frontend must never collect raw card details.
- Replace all placeholder legal/company data before launch.

Security contact: `info@weburix.com`

## Automatic language detection

The optional first-visit language detection requests only a country code from `https://api.country.is/`. A manual language choice always wins. The feature can be disabled in `assets/js/site-config.js`. Keep the privacy notice aligned with the deployed configuration and avoid adding precise-location fields.

## GitHub Pages limitation

GitHub Pages serves the static files but does not apply the repository's `_headers` file as custom HTTP response headers. The HTML contains a meta-based Content Security Policy as a useful partial fallback, while `_headers`, `netlify.toml` and `vercel.json` are intended for hosts that support them. For full server-level headers such as `frame-ancestors`, HSTS and Permissions-Policy under your control, place a supporting CDN/host in front of the site or move deployment to a platform that supports custom headers. Regardless of host, enable HTTPS and verify the custom domain.
