# Weburix — kompletna checklista pre i posle objave

## A. Podaci koje moraš da mi dostaviš
- Puno ime i prezime stvarnog vlasnika sajta i delatnosti.
- Da li je vlasnik ti ili druga osoba; ne sme se pretpostaviti.
- Tačan naziv iz Gewerbeanmeldung i pravna forma.
- Puna ladungsfähige adresa: ulica, broj, PLZ, grad i država.
- Da li postoji Handelsregister upis; ako postoji, sud i broj.
- Da li se koristi Kleinunternehmerregelung po § 19 UStG.
- Ako se obračunava PDV: da li su cene bruto za potrošače ili neto samo za B2B.
- USt-IdNr. samo ako je stvarno dodeljena; nikada javna Steuernummer.
- Da li radiš samo B2B, samo B2C ili oba.
- Stvarni poslovni e-mail, telefon i eventualni WhatsApp Business broj.
- Stvarni rok odgovora i radno vreme/dostupnost koju možeš ispuniti.
- Koje reference, fotografije, rezultate i recenzije imaš pravo da objaviš.
- Konačan hosting, registrar, mailbox provajder i svi aktivni eksterni alati.
- Da li samo primaš neobavezujuće upite ili će biti direktnog plaćanja/pretplate.
- Kako se održavaju kursevi: uživo, snimci ili samostalni materijali.

## B. Pre kupovine domena
- Proveri `weburix.com` direktno kod najmanje dva registrara.
- Proveri naziv Weburix u DPMAregister-u i da ne povređuje starija prava.
- Registruj domen na stvarnog vlasnika, ne na developera ili privremenu osobu.
- Uključi 2FA, auto-renew, domain lock i DNSSEC.
- Sačuvaj račun, registrant podatke i recovery kodove.

## C. Pre nego što sajt postane poslovno aktivan
- Potvrdi da je Gewerbe prijavljen pre ili najkasnije sa početkom delatnosti.
- Popuni `WEBURIX_LEGAL` u `assets/js/site-config.js`.
- Izaberi `vatMode`: `small-business`, `vat-included` ili `b2b-net`.
- Ako nisi u Handelsregister-u, Weburix koristi kao Geschäftsbezeichnung uz puno ime vlasnika.
- Proveri da je Impressum stalno dostupan i da nema placeholdera.
- Proveri Datenschutzerklärung sa stručnjakom prema stvarnim servisima.
- Ne objavljuj adresu koja nije ladungsfähig.
- Ne prikazuj izmišljene recenzije, rezultate, klijente ili „prethodne“ cene.

## D. Domen, hosting i URL
- Kreiraj Cloudflare Pages projekat ili izaberi drugi stvarni hosting.
- Pokreni `set-site-url.py` sa finalnim domenom i hosting opcijom.
- Postavi `weburix.com` kao glavni domen.
- Podesi `www.weburix.com` i trajno ga preusmeri na izabranu glavnu varijantu.
- Uključi HTTPS i proveri da nema certificate/DNS grešaka.
- Proveri `robots.txt`, `sitemap.xml`, canonical, Open Graph i JSON-LD.
- Zabrani indeksiranje privremenog preview domena ako ostaje javno dostupan.

## E. Poslovni e-mail
- Kreiraj pravi mailbox `info@weburix.com`, ne samo forwarding.
- Dodaj MX, SPF, DKIM i DMARC prema uputstvu mailbox provajdera.
- Počni DMARC sa `p=none`, prati rezultate, pa kasnije pojačaj politiku.
- Testiraj prijem i slanje na Gmail, Outlook i iCloud.
- Proveri Reply-To, potpis, spam folder i prikaz imena pošiljaoca.
- Ne objavljuj sajt dok `info@weburix.com` ne prima poruke.

## F. Kontakt forme i FormSubmit
- Tek nakon kreiranja mailboxa pošalji prvi test sa pravog domena.
- Otvori aktivacioni e-mail na `info@weburix.com` i potvrdi primaoca.
- Pošalji drugi test i proveri stvarnu isporuku i Reply-To.
- Pregledaj FormSubmit uslove, privatnost, obradu podataka i eventualni DPA pre konačne poslovne upotrebe.
- Ako ti njihov nivo dokumentacije nije dovoljan, pređi na provereni form backend ili sopstvenu Cloudflare funkciju i izmeni Datenschutz pre aktiviranja.
- Prati spam; po potrebi uključi jaču anti-spam zaštitu.

## G. Cookies, lokalna memorija i Datenschutz
- Trenutno nema Google Analytics, Meta Pixel-a, reklama ni eksternih fontova.
- Country lookup za početni jezik radi tek nakon pristanka; može se potpuno isključiti postavljanjem `WEBURIX_AUTO_LANGUAGE = false`.
- Datenschutzerklärung mora navesti stvarni hosting, mailbox/form servis, social linkove i svaki kasnije dodat alat.
- Ne dodaj Maps, YouTube embed, Calendly, Analytics, Pixel ili payment alat bez prethodne izmene consent sistema i Datenschutza.
- Newsletter je trenutno samo lista interesovanja; pravi newsletter zahteva zaseban Double-Opt-in, evidenciju saglasnosti i odjavu.

## H. Cene, ugovori i prodaja
- Potvrdi da li su cene bruto, Kleinunternehmer cene ili B2B neto.
- EUR je ugovorna valuta; RSD prikaz je informativan i kurs mora povremeno da se osvežava.
- Promo `WEBURIX5` ističe 31.12.2026; ukloni ga ili dokumentovano produži pre tog datuma.
- Direktni Stripe/PayPal checkout ostaje isključen dok nisu završeni ugovorni tekstovi, AGB, Widerruf i tok otkazivanja.
- Za B2C distance contracts proveri obavezne predugovorne informacije i pravo na odustanak.
- Mesečni support mora imati jasne rokove, minimalno trajanje, otkaz i opseg usluge.

## I. SEO i objava
- Dodaj domen u Google Search Console i pošalji sitemap.
- Poveži Google Business profil sa finalnim domenom i poslovnim kontaktom.
- Zameni demo/reference sekcije samo dokazivim sadržajem.
- Proveri title/description u rezultatima pretrage nakon indeksiranja.
- Ne očekuj trenutne pozicije; prati query/page podatke i unapređuj stvarne sadržaje.

## J. Posle objave
- Testiraj pravi iPhone Safari, Android Chrome, Firefox, Edge i desktop Chrome.
- Prođi sve jezike, forme, promo-kod, cookies, 404, Impressum i Datenschutz.
- Proveri da CSS/JS vraćaju pravilan content type i da nema 404 resursa.
- Proveri PageSpeed/Core Web Vitals na pravom domenu.
- Napravi rezervnu kopiju i koristi Git istoriju.
- Mesečno proveravaj domen, SSL, forme, mailbox, broken links, Search Console i rok promo-koda.
- Posle svake nove integracije ponovo pokreni sve QA skripte.

## K. Finalni status u site-config.js
Tek kada je stavka stvarno završena, promeni odgovarajući flag na `true`:
- `businessRegistered`
- `domainOwned`
- `dnsAndHttpsReady`
- `businessEmailReady`
- `formsubmitActivated`
- `formProviderPrivacyReviewed`
- `hostingPrivacyReviewed`
- `realDeviceTested`
