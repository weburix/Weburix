# Weburix V32 Production Final

Statički, višejezični poslovni sajt za GitHub Pages, Cloudflare Pages, Netlify, Vercel ili Apache hosting.

## Glavne osobine

- nemački kao podrazumevani jezik; engleski i srpski latinica
- responsive prikaz od ultra-uske širine 240 px do velikih monitora
- pristupačna navigacija, modalni prozori, forme i prevedene ARIA oznake
- lokalni fontovi i slike; bez analytics/advertising trackera po defaultu
- kontakt i projektne forme preko FormSubmit, uz obični HTTPS POST fallback
- funkcionalan no-JavaScript kontakt i mobilna navigacija
- konfigurator, EUR/RSD prikaz i vremenski ograničen promo-kod
- SEO metadata, JSON-LD, sitemap, robots, RSS, 404 i Wissenshub
- cache, CSP i security konfiguracije za više hosting platformi

## Kontakt putanje

Glavna kontakt stranica je `kontakt.html`. U paketu postoje i:

- `contact.html` — kompatibilni alias
- `kontakt/index.html` — podrška za staru `/kontakt/` putanju

Sve tri verzije imaju ispravne relativne CSS/JS putanje. Ipak, javni canonical ostaje `kontakt.html`.

## Lokalni pregled

Možeš otvoriti `index.html` direktno. Za najrealniji test koristi lokalni HTTP server:

```bash
python3 -m http.server 8080
```

Zatim otvori `http://localhost:8080/`.

## Forme

FormSubmit je jedini aktivni backend. Posle prvog javnog slanja moraš otvoriti jednokratnu aktivacionu poruku poslatu na `info@weburix.com`, potvrditi adresu i zatim poslati drugi test.

Bez JavaScripta:

- mobilna navigacija ostaje dostupna
- nefunkcionalni chat i jezički prekidač se sakrivaju
- kontakt forme koriste direktni HTTPS POST
- projektni selecti i interesovanja imaju statične nemačke fallback opcije

## Promena domena

Kada je `weburix.com` spreman:

```bash
python3 scripts/set-site-url.py https://weburix.com/ --custom-domain --hosting cloudflare-pages
```

Alat menja canonical/OG URL-ove, sitemap, robots, RSS, CNAME, forme i hosting tekst u Datenschutzu. Posle toga ponovo pokreni sve audite iz `START-HERE-FINAL.txt`.

## Najvažniji fajlovi

- `index.html` — početna
- `kontakt.html` — kontakt
- `assets/css/style.css` — dizajn i responsive pravila
- `assets/js/content.js` — DE/EN/SR sadržaj i cene
- `assets/js/app.js` — interakcije, forme, korpa i chat
- `assets/js/site-config.js` — poslovni, form, promo i launch podaci
- `PRE-LAUNCH-CHECKLIST-SR.md` — obavezni koraci pre objave
- `FINAL-QA-V32.txt` — finalni rezultati testiranja

## Važno pre objave

Ne objavljuj komercijalno dok nisu uneseni stvarni vlasnik, puna adresa, pravna forma i poreski režim. Ne aktiviraj direktni checkout ili pravi newsletter dok pravni tekstovi i procesi nisu završeni. AGB/Widerruf stranice su namerno noindex placeholderi dok direktni checkout nije pravno spreman.
