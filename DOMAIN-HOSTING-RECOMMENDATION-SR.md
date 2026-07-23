# Weburix domen, hosting i poslovni e-mail — preporuka (21.07.2026)

## Moja preporuka za tvoj slučaj

### Najpovoljnije ukupno, uz pravi poslovni mailbox
1. Uzmi IONOS Mail Basic ako u korpi za `weburix.com` stvarno ostaje 1,50 € mesečno i domen je uključen.
2. Domen ostaje registrovan kod IONOS-a, ali DNS možeš prebaciti na Cloudflare.
3. Sajt hostuj besplatno na Cloudflare Pages.
4. Poslovni e-mail koristi preko IONOS mailboxa: `info@weburix.com`.

Ovo je praktično jer za približno 18 € godišnje dobijaš domen i pravi mailbox, dok je statički hosting besplatan. Pre plaćanja proveri ukupan iznos, period ugovora i cenu obnove u korpi.

### Najjeftinije ako ti ne smeta ograničen besplatan e-mail
1. Domen preko Cloudflare Registrar-a po nabavnoj ceni bez njihove marže.
2. Hosting preko Cloudflare Pages Free.
3. Zoho Mail Free samo ako je besplatan paket dostupan u tvojoj regiji i ako ti odgovara da nema standardni IMAP/POP/ActiveSync.

### Jednostavna alternativa za samo domen
Porkbun trenutno javno prikazuje `.com` po 11,08 USD godišnje, uz besplatnu WHOIS privatnost. Dobar je izbor ako Cloudflare ne nudi registraciju domena ili želiš registrar kod kog možeš kasnije menjati nameservere bez Cloudflare ograničenja.

## Važno o Cloudflare Registrar-u
- Registracija i obnova su bez Cloudflare marže.
- Domen mora koristiti Cloudflare nameservere dok je kod Cloudflare Registrar-a.
- Cloudflare Pages Free je dovoljan za ovaj statički sajt.
- Cloudflare Email Routing može prosleđivati dolaznu poštu, ali sam routing nije klasičan mailbox za normalno slanje i odgovaranje kao `info@weburix.com`.
- Za pouzdanu poslovnu poštu koristi pravi mailbox servis ili posebno podešen outbound servis.

## Dostupnost weburix.com
Dostupnost nije mogla biti pouzdano potvrđena iz testnog okruženja. To što domen trenutno ne otvara sajt ne dokazuje da je slobodan. Konačna provera se radi u realnom vremenu u korpi registrara, neposredno pre kupovine.

## Pre kupovine
- Registruj domen na ime stvarnog pravnog vlasnika Weburix-a.
- Koristi e-mail kojem vlasnik trajno ima pristup.
- Uključi 2FA, auto-renew, domain lock i DNSSEC.
- Sačuvaj recovery kodove van telefona.
- Ne kupuj klasičan web-hosting paket za ovaj statički sajt ako koristiš Cloudflare Pages.
- Proveri `Weburix` u DPMAregister-u, Google-u, poslovnim registrima i društvenim mrežama pre većeg ulaganja u brend.

## Komanda za finalni domen i Cloudflare Pages
Iz root foldera sajta:

```bash
python3 scripts/set-site-url.py https://weburix.com/ --custom-domain --hosting cloudflare-pages
python3 scripts/qa.py
```

Ovo menja canonical URL, sitemap, robots, structured data, CNAME, kontakt povratne URL-ove i hosting odeljak Datenschutzerklärung-a.
