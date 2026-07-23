(() => {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": "https://weburix.github.io/weburixsite/#organization",
        "name": "Weburix",
        "url": "https://weburix.github.io/weburixsite/",
        "logo": "https://weburix.github.io/weburixsite/assets/img/weburix-logo.png",
        "image": "https://weburix.github.io/weburixsite/assets/img/weburix-banner.png",
        "email": "info@weburix.com",
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61591837417338",
          "https://www.instagram.com/weburix/"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "info@weburix.com",
          "availableLanguage": ["German", "English", "Serbian"]
        },
        "areaServed": [{"@type":"City","name":"München"},{"@type":"Country","name":"Deutschland"}],
        "knowsLanguage": ["de", "en", "sr-Latn"],
        "description": "Webentwicklung, SEO, Google Business, Social Media, YouTube, Digital PR, Kurse, Beratung und Support aus München.",
        "priceRange": "€",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Weburix Leistungen",
          "itemListElement": [
            {"@type":"OfferCatalog","name":"Websites und Landingpages"},
            {"@type":"OfferCatalog","name":"SEO und Google Business"},
            {"@type":"OfferCatalog","name":"Digital PR und Fachbeiträge"},
            {"@type":"OfferCatalog","name":"Monatlicher Website-Support"},
            {"@type":"OfferCatalog","name":"Livekurse und individuelle Beratung"}
          ]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://weburix.github.io/weburixsite/#website",
        "url": "https://weburix.github.io/weburixsite/",
        "name": "Weburix",
        "publisher": {"@id":"https://weburix.github.io/weburixsite/#organization"},
        "inLanguage": ["de", "en", "sr-Latn"]
      },
      {
        "@type": "ItemList",
        "name": "Weburix Livekurse",
        "itemListElement": [
          {"@type":"ListItem","position":1,"item":{"@type":"Course","name":"Website-Start","description":"Livekurs zur Planung, technischen Grundlage, SEO-Basis und Veröffentlichung einer Website.","provider":{"@id":"https://weburix.github.io/weburixsite/#organization"}}},
          {"@type":"ListItem","position":2,"item":{"@type":"Course","name":"SEO & Google Business","description":"Livekurs zu Keywords, lokalem SEO, Google Business und messbaren nächsten Schritten.","provider":{"@id":"https://weburix.github.io/weburixsite/#organization"}}},
          {"@type":"ListItem","position":3,"item":{"@type":"Course","name":"YouTube & Social Workflow","description":"Livekurs für Themenplanung, Uploadsysteme, Titel, Thumbnails und Analytics.","provider":{"@id":"https://weburix.github.io/weburixsite/#organization"}}}
        ]
      }
    ]
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
})();
