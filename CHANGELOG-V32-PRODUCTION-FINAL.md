# Weburix V32 Production Final

## Ispravljene funkcionalne greške

- Promena jezika ili EUR/RSD prikaza više ne briše izabrane projektne selecte, interesovanja, aktivni service tab ili otvoreni FAQ.
- Korpa sada normalizuje stare, duplirane, tekstualne, negativne i nevažeće količine; više nema string sabiranja niti `NaN` stanja.
- Nevažeći promo-kod sačuvan u session storageu automatski se uklanja.
- Srpski dual-currency tekst u promo statusu i formularu više ne prikazuje sirove `<small>` HTML tagove; markup ostaje samo u vizuelnom totalu.
- FormSubmit HTTP 200 nije dovoljan za lažnu potvrdu: potreban je eksplicitni `success: true`/`"true"`.
- Timeout forme radi i kada AbortController nije dostupan.
- Ako native POST fallback bude blokiran ili baci grešku, forma se uvek otključava i prikazuje grešku.
- Brzi dvostruki klik/Enter više ne može poslati dva zahteva.
- Promo „Ukloni“ i stale promo stanje ostaju konzistentni.

## Accessibility i UX

- Interaktivne ARIA oznake prevode se na DE/EN/SR za navigaciju, meni, chat, input, slanje, loader i povratak na vrh.
- Mobilni menu label pravilno menja „otvori/zatvori“ stanje.
- Skip-link sada postavlja fokus na glavni sadržaj i koristi stvarnu visinu headera.
- Dekorativne kartice više ne zatrpavaju Tab redosled sa `tabindex="0"`.
- Količinska dugmad u korpi imaju item-specific prevedene oznake.
- Ultra-uski prikaz od 240 px ne dobija horizontalno prelivanje.

## No-JavaScript otpornost

- Mobilna navigacija ostaje vidljiva i upotrebljiva bez JavaScripta.
- Neupotrebljivi chat, menu toggle, language control i cookie kontrole se sakrivaju bez JS-a.
- Kontakt i projektni formular zadržavaju direktni HTTPS POST.
- Project selecti i interest checkboxi imaju statične nemačke fallback vrednosti.
- Sadržaj i loader imaju fail-safe ako se glavni `app.js` ne učita.

## Performance, cache i hosting

- Asset cache oznaka je `v32.0`.
- CSS/JS/slike koriste immutable godišnji cache.
- Root i directory-index HTML rute (`wissen`, `results`, `kontakt`, pravne rute) koriste revalidaciju na Cloudflare Pages, Netlify i Vercel konfiguracijama.
- Preview meta CSP ostaje prenosiv za lokalni/HTTP pregled; produkcioni headeri zadržavaju HTTPS upgrade, FormSubmit i country-code dozvole.
- `set-site-url.py` je testiran kroz dve uzastopne URL promene do `weburix.com`.

## Release higijena

- Uklonjeni su stari V31 audit izveštaji i V31 skripte iz paketa.
- README, START-HERE, deployment i browser dokumentacija sada opisuju samo V32 komande i ponašanje.
- Dodat je `production_readiness_audit_v32.py` za form resilience, no-JS, CSP i cache provere.

## Testiranje

- 17 HTML stranica.
- 80 responsive Chromium renderovanja: 20 primary + 60 secondary.
- Širine 240–1600 px.
- Root i GitHub Pages-style podfolder kontakt putanje.
- UI, UX, forms, error, activation, fallback, no-JS i duplicate-submit scenariji.
- Statički, tehnički, SEO, structural, accessibility, resilience, production-readiness, HTTP, pricing i currency auditi.
