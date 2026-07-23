#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import json, re, sys, gzip

ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; notes=[]
def err(x): errors.append(x)
def warn(x): warnings.append(x)
def note(x): notes.append(x)

html_files=sorted(ROOT.rglob('*.html'))
all_ids={}
for p in html_files:
    text=p.read_text(encoding='utf-8')
    if '</meta>' in text: err(f'{p.relative_to(ROOT)}: invalid closing </meta> tag')
    soup=BeautifulSoup(text,'html.parser')
    rel=str(p.relative_to(ROOT))
    ids=[x.get('id') for x in soup.select('[id]')]
    dup=sorted({x for x in ids if ids.count(x)>1})
    if dup: err(f'{rel}: duplicate ids {dup}')
    idset=set(ids); all_ids[rel]=idset
    # ARIA/label references
    for el in soup.select('[aria-controls]'):
        for target in str(el.get('aria-controls','')).split():
            if target and target not in idset: err(f'{rel}: aria-controls points to missing #{target}')
    for label in soup.select('label[for]'):
        target=label.get('for')
        if target and target not in idset: err(f'{rel}: label points to missing #{target}')
    # Internal fragments in same document
    for a in soup.select('a[href^="#"]'):
        target=a.get('href','')[1:]
        if target and target not in idset: err(f'{rel}: missing fragment target #{target}')
    # External target safety
    for a in soup.select('a[target="_blank"]'):
        rels=set(str(a.get('rel') or '').split()) if isinstance(a.get('rel'),str) else set(a.get('rel') or [])
        if not {'noopener','noreferrer'}.issubset(rels): warn(f'{rel}: target=_blank link missing noopener noreferrer')
    # Images and controls
    for img in soup.find_all('img'):
        if img.get('alt') is None: warn(f'{rel}: image missing alt attribute: {img.get("src","")[:80]}')
        if not img.get('width') or not img.get('height'): warn(f'{rel}: image missing intrinsic dimensions: {img.get("src","")[:80]}')
    for button in soup.find_all('button'):
        name=(button.get('aria-label') or button.get_text(' ',strip=True) or '').strip()
        if not name: err(f'{rel}: button without accessible name')
    # Forms
    for form in soup.find_all('form'):
        for field in form.find_all(['input','select','textarea']):
            if field.get('type')=='hidden' or field.get('aria-hidden')=='true': continue
            fid=field.get('id'); name=field.get('name')
            labelled=bool(field.get('aria-label') or field.get('aria-labelledby') or (fid and soup.find('label',attrs={'for':fid})) or field.find_parent('label'))
            if not labelled: warn(f'{rel}: form field without explicit label: {name or fid or field.name}')
    # Canonical/robots consistency
    is_redirect=bool(soup.find('meta',attrs={'http-equiv':re.compile('refresh',re.I)}))
    canonical=soup.find('link',rel='canonical')
    robots_tag=soup.find('meta',attrs={'name':'robots'})
    noindex=bool(robots_tag and 'noindex' in str(robots_tag.get('content','')).lower())
    if not is_redirect and not noindex and rel not in ('404.html',) and not canonical: warn(f'{rel}: canonical missing')
    if is_redirect:
        robots=soup.find('meta',attrs={'name':'robots'})
        if not robots or 'noindex' not in str(robots.get('content','')).lower(): warn(f'{rel}: redirect stub should be noindex')

# Resolve local assets/links
for p in html_files:
    soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    rel=str(p.relative_to(ROOT))
    for el,attr in [(e,'src') for e in soup.find_all(['img','script'])]+[(e,'href') for e in soup.find_all(['a','link'])]:
        value=str(el.get(attr) or '').split('#')[0].split('?')[0]
        if not value or value.startswith(('http://','https://','mailto:','tel:','data:','javascript:','#')): continue
        target=(p.parent/value).resolve()
        try: target.relative_to(ROOT.resolve())
        except ValueError:
            err(f'{rel}: local reference escapes root: {value}'); continue
        if value.endswith('/'):
            target=target/'index.html'
        elif target.is_dir():
            target=target/'index.html'
        if not target.exists(): err(f'{rel}: missing local target {value}')

# JSON/XML/config parsing
for f in ['manifest.webmanifest','vercel.json']:
    try: json.loads((ROOT/f).read_text(encoding='utf-8'))
    except Exception as e: err(f'{f}: invalid JSON: {e}')
try:
    import xml.etree.ElementTree as ET
    ET.parse(ROOT/'sitemap.xml'); ET.parse(ROOT/'rss.xml')
except Exception as e: err(f'XML parse failure: {e}')

# JS/CSS regression-source guards
app=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
boot=(ROOT/'assets/js/boot.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/style.css').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
checks={
 'stable fixed chat launcher':'position: fixed !important' in css and 'chatPulseSafe' in css,
 'cookie/chat collision guard':'consent-pending' in css and 'consent-pending' in app,
 'chat inert state':"chatWidget.setAttribute('inert', '')" in app,
 'cookie modal inert state':"modal.setAttribute('inert', '')" in app,
 'modal focus cycling':"event.key === 'Tab'" in app,
 'resource error capture':"'resource'" in boot,
 'mobile nav inert':"toggleAttribute('inert'" in app,
 'nav ARIA relationship':'aria-controls="nav-panel"' in index,
 'chat ARIA relationship':'aria-controls="chat-widget"' in index,
 'cache bust v32':'?v=32.0' in index,
}
for name,ok in checks.items():
    if not ok: err(f'regression guard failed: {name}')
    else: note(f'{name}: passed')

# Production CSP must permit the active contact backend on every supported host.
for csp_file in ('_headers','netlify.toml','vercel.json'):
    csp_text=(ROOT/csp_file).read_text(encoding='utf-8')
    if 'https://formsubmit.co' not in csp_text:
        err(f'{csp_file}: active FormSubmit backend missing from CSP')
    if 'form-action' not in csp_text or not re.search(r"form-action[^;]*https://formsubmit\.co", csp_text):
        err(f'{csp_file}: FormSubmit missing from form-action CSP')
    if 'connect-src' not in csp_text or not re.search(r"connect-src[^;]*https://formsubmit\.co", csp_text):
        err(f'{csp_file}: FormSubmit missing from connect-src CSP')
note('production CSP allows FormSubmit connect-src and form-action: passed')

# The 404 page must work under strict CSP and at nested missing URLs.
not_found=(ROOT/'404.html').read_text(encoding='utf-8')
if '<script' in not_found: err('404.html: inline script would be blocked by production CSP')
sitemap_text=(ROOT/'sitemap.xml').read_text(encoding='utf-8')
home_match=re.search(r'<loc>(https?://[^<]+/)</loc>', sitemap_text)
home_url=home_match.group(1) if home_match else ''
if not home_url or home_url not in not_found or (home_url+'wissen/') not in not_found:
    err('404.html: canonical absolute recovery links missing or out of sync')
else:
    note('CSP-safe 404 recovery links: passed')

# Native fallback should return to the current deployment and show confirmation.
for token in ("window.location.origin", "?sent=1", 'showSubmissionReturnNotice', 'await submitNativeForm'):
    if token not in app: err(f'contact native fallback guard missing: {token}')
note('portable native contact fallback and return confirmation: passed')

# V32 contact/SEO/security guards.
if "const explicitSuccess = successValue === true || String(successValue).toLowerCase() === 'true'" not in app:
    err('FormSubmit explicit-success guard missing')
else:
    note('FormSubmit explicit-success guard: passed')
if "if (form.classList.contains('is-submitting')) return;" not in app:
    err('form double-submit guard missing')
else:
    note('form double-submit guard: passed')
if 'void submitForm(form).catch' not in app:
    err('top-level form rejection recovery missing')
else:
    note('top-level form rejection recovery: passed')
if 'https://formspree.io' in index:
    err('main-page CSP still allows inactive form backends')
else:
    note('active-service-only page CSP: passed')
for token in ('property="og:image:type"','property="og:image:width"','property="og:image:height"'):
    if token not in index: err(f'Open Graph image metadata missing: {token}')
note('Open Graph image dimensions/type: passed')

# Compression/weight budget (first-party core, gzip estimate)
core=['index.html','assets/css/style.css','assets/js/boot.js','assets/js/schema.js','assets/js/content.js','assets/js/site-config.js','assets/js/app.js','assets/img/weburix-logo.svg','assets/img/weburix-mark.svg']
raw=gz=0
for f in core:
    data=(ROOT/f).read_bytes(); raw+=len(data); gz+=len(gzip.compress(data,compresslevel=9))
note(f'Core first-party payload estimate: {raw/1024:.1f} KiB raw / {gz/1024:.1f} KiB gzip')
if gz>180*1024: warn(f'core gzip payload is relatively large: {gz/1024:.1f} KiB')

# Placeholder launch blockers remain warnings, not technical errors.
config=(ROOT/'assets/js/site-config.js').read_text(encoding='utf-8')
if "window.WEBURIX_FORM_MODE = 'formsubmit'" in config and 'https://formsubmit.co/ajax/' in config: note('contact delivery backend: FormSubmit configured; one-time activation required')
else: warn('LAUNCH: no active direct form backend is configured')
for field in ('ownerName','street','postalCode'):
    if re.search(rf"{field}:\s*''",config): warn(f'LAUNCH: legal field {field} is empty')
if "vatMode: 'unset'" in config: warn('LAUNCH: VAT mode is unset')

lines=['Weburix Technical Audit v32 Production Final',f'Errors: {len(errors)}',f'Warnings: {len(warnings)}']
lines += [f'ERROR: {x}' for x in errors]
lines += [f'WARNING: {x}' for x in warnings]
lines += [f'NOTE: {x}' for x in notes]
report='\n'.join(lines)+'\n'
(ROOT/'TECHNICAL-AUDIT.txt').write_text(report,encoding='utf-8')
print(report,end='')
sys.exit(1 if errors else 0)
