(() => {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": "https://weburix.com/#organization",
        "name": "Weburix",
        "url": "https://weburix.com/",
        "logo": "https://weburix.com/assets/img/weburix-logo.png",
        "image": "https://weburix.com/assets/img/weburix-banner.png",
        "email": "info@weburix.com",
        "areaServed": [{"@type":"City","name":"München"},{"@type":"Country","name":"Deutschland"}],
        "knowsLanguage": ["de", "en", "sr-Latn"],
        "description": "Webentwicklung, SEO, Google Business, Social Media, YouTube, Digital PR, Kurse, Beratung und Support aus München.",
        "priceRange": "€€",
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
        "@id": "https://weburix.com/#website",
        "url": "https://weburix.com/",
        "name": "Weburix",
        "publisher": {"@id":"https://weburix.com/#organization"},
        "inLanguage": ["de", "en", "sr-Latn"]
      },
      {
        "@type": "ItemList",
        "name": "Weburix Livekurse",
        "itemListElement": [
          {"@type":"ListItem","position":1,"item":{"@type":"Course","name":"Website-Start","description":"Livekurs zur Planung, technischen Grundlage, SEO-Basis und Veröffentlichung einer Website.","provider":{"@id":"https://weburix.com/#organization"}}},
          {"@type":"ListItem","position":2,"item":{"@type":"Course","name":"SEO & Google Business","description":"Livekurs zu Keywords, lokalem SEO, Google Business und messbaren nächsten Schritten.","provider":{"@id":"https://weburix.com/#organization"}}},
          {"@type":"ListItem","position":3,"item":{"@type":"Course","name":"YouTube & Social Workflow","description":"Livekurs für Themenplanung, Uploadsysteme, Titel, Thumbnails und Analytics.","provider":{"@id":"https://weburix.com/#organization"}}}
        ]
      }
    ]
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
})();
