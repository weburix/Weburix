# Browser and device verification — V32 Production Final

Automatski Chromium testovi pokrivaju:

- širine 240, 280, 320, 360, 390, 412, 768, 1024, 1366 i 1600 px
- svih 17 HTML stranica na telefonu, tabletu i desktopu
- root i GitHub Pages-style podfolder putanje
- mobilni meni, cookies, jezik, promo-kod, chat i Reduced Motion
- kontakt, projektni i newsletter tok
- uspeh, aktivaciju, nejasan odgovor, grešku, timeout/fallback i duplo slanje forme
- očuvanje selecta, checkboxa, aktivnog taba i FAQ stanja kroz jezik/valutu
- no-JavaScript navigaciju i kontakt/project fallback

Dodatna CSS zaštita postoji za touch, Data Saver, kratke ekrane, safe-area insete, Safari/Firefox fallback i 240 px ultra-uske prikaze.

Automatski Chromium nije zamena za finalni produkcioni test na fizičkom iPhone Safari, Android Chrome, Firefox i Edge uređaju. Taj korak ostaje obavezan nakon povezivanja pravog domena.
