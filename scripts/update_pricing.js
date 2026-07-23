const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets/js/content.js');
const source = fs.readFileSync(file, 'utf8') + '\n;globalThis.__CONTENT=WEBURIX_CONTENT;';
const ctx = {};
vm.createContext(ctx);
vm.runInContext(source, ctx);
const C = ctx.__CONTENT;

// V24: coherent marketing prices, still deliberately below typical agency entry points.
// These are non-binding starting prices; the written quote remains decisive.
const P = {
  starter: 599,
  business: 1099,
  growth: 1699,
  google: 129,
  social: 179,
  careEssential: 39,
  careBusiness: 79,
  carePriority: 129,
  courseWeb: 49,
  courseSeo: 79,
  courseSocial: 69,
  workshop: 119,
  consulting: 59,
  consultingBlock: 259,
  audit: 79,
  brand: 119,
  email: 69,
  seoFoundation: 249,
  contentRefresh: 159,
  digitalPr: 219,
  localSeo: 219,
  googleAds: 219,
  socialAds: 219
};

// Historical reference prices remain stored only for the optional, disabled global promotion system.
// Do not display them unless they were genuine prices and the campaign is temporary and documented.
const PREVIOUS = {
  starter: 690, business: 1290, growth: 1990, google: 149, social: 199,
  careEssential: 49, careBusiness: 89, carePriority: 149,
  courseWeb: 59, courseSeo: 89, courseSocial: 79, workshop: 129,
  consulting: 69, consultingBlock: 299, audit: 89, brand: 129, email: 79,
  seoFoundation: 299, contentRefresh: 179, digitalPr: 249, localSeo: 249,
  googleAds: 249, socialAds: 249
};

function deNum(n){ return n.toLocaleString('de-DE'); }
function enNum(n){ return n.toLocaleString('en-US'); }

function updateLocale(lang) {
  const d = C[lang];
  const de = lang === 'de';
  const en = lang === 'en';
  const money = n => de ? `${deNum(n)} €` : en ? `€${enNum(n)}` : `${deNum(n)} €`;
  const from = n => de ? `ab ${money(n)}` : en ? `from €${enNum(n)}` : `od ${money(n)}`;
  const monthly = n => de ? `${money(n)}/Monat` : en ? `€${enNum(n)}/month` : `${money(n)}/mesečno`;
  const fromMonthly = n => de ? `ab ${money(n)}/Monat` : en ? `from €${enNum(n)}/month` : `od ${money(n)}/mesečno`;
  const hourly = n => de ? `${money(n)}/Std.` : en ? `€${enNum(n)}/hour` : `${money(n)}/sat`;

  d.hero.trust2 = de ? 'Faire Einstiegspreise' : en ? 'Fair entry pricing' : 'Pristupačne početne cene';
  d.packages.title = de ? 'Klare Einstiegspreise für kleine Unternehmen.' : en ? 'Clear entry pricing for small businesses.' : 'Jasne početne cene za male firme.';
  d.packages.text = de
    ? 'Weburix liegt bewusst unter vielen klassischen Agentur-Einstiegspreisen. Möglich wird das durch schlanke Abläufe, klar begrenzte Pakete und direkten Kontakt — nicht durch versteckte Kürzungen.'
    : en
      ? 'Weburix is deliberately priced below many traditional agency entry points. Lean processes, clearly scoped packages and direct contact make that possible — not hidden cutbacks.'
      : 'Weburix je namerno cenovno ispod mnogih klasičnih agencijskih početnih ponuda. To postižemo jednostavnim procesom, jasno ograničenim paketima i direktnim kontaktom — bez skrivenog smanjivanja kvaliteta.';
  d.packages.note = de
    ? 'Alle Beträge sind unverbindliche Startpreise. Umfang, Umsatzsteuerhinweis und Endpreis werden vor Projektbeginn schriftlich bestätigt. Domain, Hosting, Anzeigenbudget, Lizenzen und Drittanbietergebühren sind nur enthalten, wenn es ausdrücklich im Angebot steht.'
    : en
      ? 'All amounts are non-binding starting prices. Scope, VAT wording and the final price are confirmed in writing before work begins. Domains, hosting, ad spend, licences and third-party fees are included only when explicitly stated in the quote.'
      : 'Svi iznosi su neobavezujuće početne cene. Obim, poreska napomena i konačna cena potvrđuju se pisano pre početka rada. Domen, hosting, budžet za oglase, licence i troškovi drugih servisa uključeni su samo kada to izričito piše u ponudi.';
  d.packages.saving = de ? 'Einstiegspreis' : en ? 'Entry price' : 'Početna cena';

  const pc = d.packageCards;
  const packageMeta = [
    ['starter', P.starter, PREVIOUS.starter, 'from'],
    ['business', P.business, PREVIOUS.business, 'from'],
    ['growth', P.growth, PREVIOUS.growth, 'from'],
    ['google', P.google, PREVIOUS.google, 'from'],
    ['social-youtube', P.social, PREVIOUS.social, 'fromMonthly'],
    ['care-essential', P.careEssential, PREVIOUS.careEssential, 'fromMonthly']
  ];
  packageMeta.forEach(([id, price, previous, format], index) => {
    pc[index].id = id;
    pc[index].price = format === 'fromMonthly' ? fromMonthly(price) : from(price);
    pc[index].oldPrice = format === 'fromMonthly' ? fromMonthly(previous) : from(previous);
  });

  if (d.serviceTabs?.[4]?.points?.[1]) {
    d.serviceTabs[4].points[1] = de ? `1:1 Beratung ab ${money(P.consulting)} pro Stunde` : en ? `1:1 consulting from €${enNum(P.consulting)} per hour` : `1:1 savetovanje od ${money(P.consulting)} po satu`;
  }

  d.faqItems[1].a = de
    ? 'Wir arbeiten mit klaren Leistungsgrenzen, wiederverwendbaren Qualitätsbausteinen und direktem Kontakt. Dadurch entfallen viele klassische Agenturkosten. Verbindlich sind immer der schriftlich bestätigte Umfang und Endpreis.'
    : en
      ? 'We use clearly defined scopes, reusable quality components and direct communication. This removes much of the overhead found in traditional agencies. The written scope and final quote are always binding.'
      : 'Radimo sa jasno definisanim obimom, proverеним kvalitetnim komponentama i direktnom komunikacijom. Tako izbegavamo veliki deo klasičnih agencijskih troškova. Uvek su obavezujući pisano potvrđen obim i konačna ponuda.';
  d.faqItems[2].a = de
    ? `Care Essential startet bei ${money(P.careEssential)}, Care Business bei ${money(P.careBusiness)} und Care Priority bei ${money(P.carePriority)} pro Monat. Enthaltene Zeit, Reaktionszeiten und Leistungen stehen im jeweiligen Tarif.`
    : en
      ? `Care Essential starts at €${enNum(P.careEssential)}, Care Business at €${enNum(P.careBusiness)} and Care Priority at €${enNum(P.carePriority)} per month. Included time, response targets and services are listed in each plan.`
      : `Care Essential kreće od ${money(P.careEssential)}, Care Business od ${money(P.careBusiness)}, a Care Priority od ${money(P.carePriority)} mesečno. Uključeno vreme, rokovi odgovora i usluge navedeni su u svakom paketu.`;
  d.faqItems[3].a = de
    ? `Ja. Geplant sind live durchgeführte Kurse zu Websites, SEO/Google Business und YouTube/Social Media. Individuelle Beratung kostet ${money(P.consulting)} pro Stunde oder ${money(P.consultingBlock)} als 5-Stunden-Block.`
    : en
      ? `Yes. Planned live courses cover websites, SEO/Google Business and YouTube/social media. Individual consulting is €${enNum(P.consulting)} per hour or €${enNum(P.consultingBlock)} for a five-hour block.`
      : `Da. Planirani su live kursevi za sajtove, SEO/Google Business i YouTube/društvene mreže. Individualno savetovanje košta ${money(P.consulting)} po satu ili ${money(P.consultingBlock)} za blok od pet sati.`;

  d.chat.answers.price = de
    ? `Einstiegspreise: Starter Site ab ${money(P.starter)}, Business Web ab ${money(P.business)} und Growth Setup ab ${money(P.growth)}. Support startet bei ${money(P.careEssential)} monatlich, Beratung bei ${money(P.consulting)} pro Stunde. Drittanbieter- und Werbekosten werden separat ausgewiesen.`
    : en
      ? `Entry pricing: Starter Site from €${enNum(P.starter)}, Business Web from €${enNum(P.business)} and Growth Setup from €${enNum(P.growth)}. Support starts at €${enNum(P.careEssential)}/month and consulting at €${enNum(P.consulting)}/hour. Third-party and ad costs are listed separately.`
      : `Početne cene: Starter Site od ${money(P.starter)}, Business Web od ${money(P.business)} i Growth Setup od ${money(P.growth)}. Podrška kreće od ${money(P.careEssential)} mesečno, a savetovanje od ${money(P.consulting)} po satu. Troškovi drugih servisa i oglasa navode se posebno.`;
  d.chat.answers.support = de
    ? `Care Essential kostet ${money(P.careEssential)}, Care Business ${money(P.careBusiness)} und Care Priority ${money(P.carePriority)} pro Monat. Tarife unterscheiden sich nach Änderungszeit, Prüfungen und Antwortpriorität.`
    : en
      ? `Care Essential is €${enNum(P.careEssential)}, Care Business €${enNum(P.careBusiness)} and Care Priority €${enNum(P.carePriority)} per month. Plans differ by included editing time, checks and response priority.`
      : `Care Essential košta ${money(P.careEssential)}, Care Business ${money(P.careBusiness)}, a Care Priority ${money(P.carePriority)} mesečno. Paketi se razlikuju po uključenom vremenu za izmene, proverama i prioritetu odgovora.`;
  d.chat.answers.courses = de
    ? `Geplante Livekurse: Website-Start ${money(P.courseWeb)}, SEO & Google Business ${money(P.courseSeo)}, YouTube & Social Workflow ${money(P.courseSocial)} und 1:1 Praxis-Workshop ${money(P.workshop)}.`
    : en
      ? `Planned live courses: Website Start €${enNum(P.courseWeb)}, SEO & Google Business €${enNum(P.courseSeo)}, YouTube & Social Workflow €${enNum(P.courseSocial)} and a 1:1 Practical Workshop €${enNum(P.workshop)}.`
      : `Planirani live kursevi: Website Start ${money(P.courseWeb)}, SEO i Google Business ${money(P.courseSeo)}, YouTube i Social Workflow ${money(P.courseSocial)} i 1:1 praktična radionica ${money(P.workshop)}.`;
  d.chat.answers.consulting = de
    ? `Individuelle Beratung kostet ${money(P.consulting)} pro Stunde. Ein 5-Stunden-Block kostet ${money(P.consultingBlock)}. Themen können Website, SEO, Google Business, YouTube, Social Media, Domain, Sicherheit oder digitale Abläufe sein.`
    : en
      ? `Individual consulting is €${enNum(P.consulting)} per hour or €${enNum(P.consultingBlock)} for a five-hour block. Topics can include websites, SEO, Google Business, YouTube, social media, domains, security or digital workflows.`
      : `Individualno savetovanje košta ${money(P.consulting)} po satu ili ${money(P.consultingBlock)} za blok od pet sati. Tema može biti sajt, SEO, Google Business, YouTube, društvene mreže, domen, sigurnost ili digitalni procesi.`;

  const co = d.checkout.items;
  const priceById = {
    starter:P.starter,business:P.business,growth:P.growth,google:P.google,
    'care-essential':P.careEssential,'care-business':P.careBusiness,'care-priority':P.carePriority,
    'course-web':P.courseWeb,'course-seo':P.courseSeo,'course-social':P.courseSocial,
    'social-youtube':P.social,consulting:P.consulting,audit:P.audit,brandkit:P.brand,
    emailsetup:P.email,'content-refresh':P.contentRefresh,'digital-pr':P.digitalPr
  };
  const previousById = {
    starter:PREVIOUS.starter,business:PREVIOUS.business,growth:PREVIOUS.growth,google:PREVIOUS.google,
    'care-essential':PREVIOUS.careEssential,'care-business':PREVIOUS.careBusiness,'care-priority':PREVIOUS.carePriority,
    'course-web':PREVIOUS.courseWeb,'course-seo':PREVIOUS.courseSeo,'course-social':PREVIOUS.courseSocial,
    'social-youtube':PREVIOUS.social,consulting:PREVIOUS.consulting,audit:PREVIOUS.audit,brandkit:PREVIOUS.brand,
    emailsetup:PREVIOUS.email,'content-refresh':PREVIOUS.contentRefresh,'digital-pr':PREVIOUS.digitalPr
  };
  co.forEach(item => {
    if (!(item.id in priceById)) return;
    item.price = priceById[item.id];
    if (item.id === 'starter' || item.id === 'business' || item.id === 'growth' || item.id === 'google' || item.id === 'digital-pr') item.priceLabel = from(item.price);
    else if (item.billing === 'monthly') item.priceLabel = monthly(item.price);
    else if (item.id === 'consulting') item.priceLabel = hourly(item.price);
    else item.priceLabel = money(item.price);
    item.oldPrice = previousById[item.id];
    item.oldPriceLabel = item.id === 'starter' || item.id === 'business' || item.id === 'growth' || item.id === 'google' || item.id === 'digital-pr'
      ? from(item.oldPrice)
      : item.billing === 'monthly' ? monthly(item.oldPrice)
      : item.id === 'consulting' ? hourly(item.oldPrice)
      : money(item.oldPrice);
  });

  const extraCheckout = de ? [
    {id:'seo-foundation',type:'SEO',name:'SEO Foundation',text:'Technische Basis, Keywords, Seitentitel, Meta-Texte und klare Prioritäten.',price:P.seoFoundation,priceLabel:money(P.seoFoundation),image:'assets/img/products/seo-links.svg',billing:'one-time'},
    {id:'local-seo',type:'SEO',name:'Local SEO Betreuung',text:'Monatliche lokale Optimierung, Inhaltsprioritäten und kurzer Fortschrittscheck.',price:P.localSeo,priceLabel:monthly(P.localSeo),image:'assets/img/products/local-seo-guide.svg',billing:'monthly'},
    {id:'google-ads',type:'Ads',name:'Google Ads Setup',text:'Kampagnenstruktur, Zielgruppen, Anzeigenentwürfe und Tracking-Grundlage. Werbebudget separat.',price:P.googleAds,priceLabel:money(P.googleAds),image:'assets/img/products/local.svg',billing:'one-time'},
    {id:'social-ads',type:'Ads',name:'Social Ads Setup',text:'Kampagnenstruktur, Zielgruppen und Anzeigenvarianten für Meta-Plattformen. Werbebudget separat.',price:P.socialAds,priceLabel:money(P.socialAds),image:'assets/img/products/social.svg',billing:'one-time'}
  ] : en ? [
    {id:'seo-foundation',type:'SEO',name:'SEO Foundation',text:'Technical basics, keywords, page titles, meta copy and a clear priority plan.',price:P.seoFoundation,priceLabel:money(P.seoFoundation),image:'assets/img/products/seo-links.svg',billing:'one-time'},
    {id:'local-seo',type:'SEO',name:'Local SEO Support',text:'Monthly local optimisation, content priorities and a concise progress review.',price:P.localSeo,priceLabel:monthly(P.localSeo),image:'assets/img/products/local-seo-guide.svg',billing:'monthly'},
    {id:'google-ads',type:'Ads',name:'Google Ads Setup',text:'Campaign structure, audiences, ad drafts and tracking basics. Ad spend is separate.',price:P.googleAds,priceLabel:money(P.googleAds),image:'assets/img/products/local.svg',billing:'one-time'},
    {id:'social-ads',type:'Ads',name:'Social Ads Setup',text:'Campaign structure, audiences and ad variants for Meta platforms. Ad spend is separate.',price:P.socialAds,priceLabel:money(P.socialAds),image:'assets/img/products/social.svg',billing:'one-time'}
  ] : [
    {id:'seo-foundation',type:'SEO',name:'SEO osnova',text:'Tehnička osnova, ključne reči, naslovi stranica, meta tekstovi i jasan plan prioriteta.',price:P.seoFoundation,priceLabel:money(P.seoFoundation),image:'assets/img/products/seo-links.svg',billing:'one-time'},
    {id:'local-seo',type:'SEO',name:'Lokalna SEO podrška',text:'Mesečna lokalna optimizacija, prioriteti sadržaja i kratak pregled napretka.',price:P.localSeo,priceLabel:monthly(P.localSeo),image:'assets/img/products/local-seo-guide.svg',billing:'monthly'},
    {id:'google-ads',type:'Oglasi',name:'Google Ads podešavanje',text:'Struktura kampanje, publika, predlozi oglasa i osnova za praćenje. Budžet za oglase je poseban.',price:P.googleAds,priceLabel:money(P.googleAds),image:'assets/img/products/local.svg',billing:'one-time'},
    {id:'social-ads',type:'Oglasi',name:'Social Ads podešavanje',text:'Struktura kampanje, publika i varijante oglasa za Meta platforme. Budžet za oglase je poseban.',price:P.socialAds,priceLabel:money(P.socialAds),image:'assets/img/products/social.svg',billing:'one-time'}
  ];
  const extraPrevious = {
    'seo-foundation': PREVIOUS.seoFoundation,
    'local-seo': PREVIOUS.localSeo,
    'google-ads': PREVIOUS.googleAds,
    'social-ads': PREVIOUS.socialAds
  };
  extraCheckout.forEach(extra => {
    extra.oldPrice = extraPrevious[extra.id];
    extra.oldPriceLabel = extra.billing === 'monthly' ? monthly(extra.oldPrice) : money(extra.oldPrice);
    const index = co.findIndex(item => item.id === extra.id);
    if (index >= 0) co[index] = extra; else co.push(extra);
  });

  const groups = d.priceList.groups;
  const group0 = [P.starter,P.business,P.growth,P.audit,P.brand,P.email];
  const group1 = [P.google,P.seoFoundation,P.contentRefresh,P.digitalPr,P.localSeo,P.social,P.googleAds,P.socialAds];
  const group2 = [P.careEssential,P.careBusiness,P.carePriority,P.consulting,P.consultingBlock];
  const group3 = [P.courseWeb,P.courseSeo,P.courseSocial,P.workshop];
  const groupIds = [
    ['starter','business','growth','audit','brandkit','emailsetup'],
    ['google','seo-foundation','content-refresh','digital-pr','local-seo','social-youtube','google-ads','social-ads'],
    ['care-essential','care-business','care-priority','consulting','consulting-block'],
    ['course-web','course-seo','course-social','workshop']
  ];
  const previousGroups = [
    [PREVIOUS.starter,PREVIOUS.business,PREVIOUS.growth,PREVIOUS.audit,PREVIOUS.brand,PREVIOUS.email],
    [PREVIOUS.google,PREVIOUS.seoFoundation,PREVIOUS.contentRefresh,PREVIOUS.digitalPr,PREVIOUS.localSeo,PREVIOUS.social,PREVIOUS.googleAds,PREVIOUS.socialAds],
    [PREVIOUS.careEssential,PREVIOUS.careBusiness,PREVIOUS.carePriority,PREVIOUS.consulting,PREVIOUS.consultingBlock],
    [PREVIOUS.courseWeb,PREVIOUS.courseSeo,PREVIOUS.courseSocial,PREVIOUS.workshop]
  ];
  groups[0].items.forEach((x,i)=>{x.id=groupIds[0][i];x.price=money(group0[i]);x.oldPrice=money(previousGroups[0][i]);});
  groups[1].items.forEach((x,i)=>{x.id=groupIds[1][i];x.price=(i===4||i===5)?monthly(group1[i]):money(group1[i]);x.oldPrice=(i===4||i===5)?monthly(previousGroups[1][i]):money(previousGroups[1][i]);});
  groups[2].items.forEach((x,i)=>{x.id=groupIds[2][i];x.price=i<3?monthly(group2[i]):i===3?hourly(group2[i]):money(group2[i]);x.oldPrice=i<3?monthly(previousGroups[2][i]):i===3?hourly(previousGroups[2][i]):money(previousGroups[2][i]);});
  groups[3].items.forEach((x,i)=>{x.id=groupIds[3][i];x.price=money(group3[i]);x.oldPrice=money(previousGroups[3][i]);});
  d.priceList.text = de
    ? 'Bewusst günstige Einstiegspreise mit klar definiertem Umfang. Im Vergleich zu vielen klassischen Agenturangeboten bleiben die Einstiegshürden niedrig, während Qualität, Erreichbarkeit und ein schriftliches Angebot erhalten bleiben.'
    : en
      ? 'Deliberately affordable entry pricing with a clearly defined scope. Compared with many traditional agency offers, the entry barrier stays low while quality, accessibility and a written quote remain part of the service.'
      : 'Namerno pristupačne početne cene uz jasno definisan obim. U poređenju sa mnogim klasičnim agencijskim ponudama, početni trošak ostaje niži, dok kvalitet, dostupnost i pisana ponuda ostaju deo usluge.';

  const sp=d.supportPlans.items;
  const supportMeta = [
    ['care-essential',P.careEssential,PREVIOUS.careEssential],
    ['care-business',P.careBusiness,PREVIOUS.careBusiness],
    ['care-priority',P.carePriority,PREVIOUS.carePriority]
  ];
  supportMeta.forEach(([id,v,previous],i)=>{sp[i].id=id;sp[i].price=de?money(v):en?`€${enNum(v)}`:money(v);sp[i].oldPrice=de?money(previous):en?`€${enNum(previous)}`:money(previous);});
  sp[0].features[0] = de ? 'Bis 20 Min. kleine Änderungen' : en ? 'Up to 20 minutes of small edits' : 'Do 20 min. manjih izmena';
  sp[1].features[0] = de ? 'Bis 60 Min. Änderungen' : en ? 'Up to 60 minutes of edits' : 'Do 60 min. izmena';
  sp[2].features[0] = de ? 'Bis 2 Std. Änderungen' : en ? 'Up to 2 hours of edits' : 'Do 2 sata izmena';

  const ci=d.courses.items;
  const courseMeta = [
    ['course-web',P.courseWeb,PREVIOUS.courseWeb],
    ['course-seo',P.courseSeo,PREVIOUS.courseSeo],
    ['course-social',P.courseSocial,PREVIOUS.courseSocial],
    ['workshop',P.workshop,PREVIOUS.workshop]
  ];
  courseMeta.forEach(([id,v,previous],i)=>{ci[i].id=id;ci[i].price=money(v);ci[i].oldPrice=money(previous);});

  d.consulting.text = de
    ? `Für Website, SEO, Google Business, YouTube, Social Media, Domains oder digitale Abläufe. Eine Stunde kostet ${money(P.consulting)}; der 5-Stunden-Block ${money(P.consultingBlock)}.`
    : en
      ? `For websites, SEO, Google Business, YouTube, social media, domains or digital workflows. One hour is €${enNum(P.consulting)}; the five-hour block is €${enNum(P.consultingBlock)}.`
      : `Za sajt, SEO, Google Business, YouTube, društvene mreže, domene ili digitalne procese. Jedan sat košta ${money(P.consulting)}; blok od pet sati ${money(P.consultingBlock)}.`;
  d.consulting.price = de ? `${money(P.consulting)} / Std.` : en ? `€${enNum(P.consulting)} / hour` : `${money(P.consulting)} / sat`;
  d.consulting.block = de ? `5 Stunden: ${money(P.consultingBlock)}` : en ? `5 hours: €${enNum(P.consultingBlock)}` : `5 sati: ${money(P.consultingBlock)}`;
  d.consulting.oldPrice = de ? `${money(PREVIOUS.consulting)} / Std.` : en ? `€${enNum(PREVIOUS.consulting)} / hour` : `${money(PREVIOUS.consulting)} / sat`;
  d.consulting.oldBlock = de ? `5 Stunden: ${money(PREVIOUS.consultingBlock)}` : en ? `5 hours: €${enNum(PREVIOUS.consultingBlock)}` : `5 sati: ${money(PREVIOUS.consultingBlock)}`;

  // Keep budget choices useful after lowering entry prices.
  d.forms.budgetOptions = de
    ? ['Unter 500 €','500–1.000 €','1.000–2.000 €','2.000–3.500 €','3.500 €+','Monatliches Budget']
    : en
      ? ['Under €500','€500–1,000','€1,000–2,000','€2,000–3,500','€3,500+','Monthly budget']
      : ['Ispod 500 €','500–1.000 €','1.000–2.000 €','2.000–3.500 €','3.500 €+','Mesečni budžet'];

}

['de','en','sr'].forEach(updateLocale);
fs.writeFileSync(file, `const WEBURIX_CONTENT = ${JSON.stringify(C, null, 2)};\n`, 'utf8');
console.log('Pricing updated', P);
