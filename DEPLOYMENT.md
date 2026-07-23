# Weburix V32 deployment

## Preporučeni redosled

1. Popuni stvarne pravne i poslovne podatke u `assets/js/site-config.js`.
2. Poveži domen i hosting:

```bash
python3 scripts/set-site-url.py https://weburix.com/ --custom-domain --hosting cloudflare-pages
```

3. Pokreni sve komande iz `START-HERE-FINAL.txt`.
4. Postavi ceo sadržaj foldera, uključujući `assets`, `_headers`, `netlify.toml`, `vercel.json`, `.htaccess` i `.nojekyll`.
5. Potvrdi HTTPS, glavni domen i 301 redirect između `www` i non-`www` verzije.
6. Aktiviraj FormSubmit i proveri stvarnu isporuku.
7. Testiraj produkciju na pravim browserima i uređajima.

## Hosting fajlovi

- Cloudflare Pages: `_headers`
- Netlify: `netlify.toml`
- Vercel: `vercel.json`
- Apache: `.htaccess`
- GitHub Pages: `.nojekyll` i eksplicitne `.html` kontakt putanje

## Cache strategija

- verzionisani CSS/JS/slike: `public, max-age=31536000, immutable`
- HTML i directory-index rute: `max-age=0, must-revalidate`
- manifest: jedan dan
- robots/sitemap: jedan sat

Ovo sprečava da novi deploy ostane iza stare HTML verzije, dok statički asseti ostaju brzi.

## Kontakt test posle deploya

1. Otvori `kontakt.html` direktno i preko dugmeta sa početne.
2. Proveri da CSS i JavaScript imaju HTTP 200 i pravilan MIME tip.
3. Pošalji prvu poruku i potvrdi FormSubmit aktivaciju u mailboxu.
4. Pošalji drugu poruku i proveri Inbox/Spam i Reply-To.
5. Testiraj i sa blokiranim JavaScriptom: navigacija i obični HTTPS POST moraju ostati dostupni.

## GitHub Pages podfolder

Relativne putanje podržavaju project-page deploy poput `/weburixsite/`. Pri prelasku na custom domen obavezno pokreni `set-site-url.py`, pa uploaduj rezultat, a ne staru preview kopiju.
