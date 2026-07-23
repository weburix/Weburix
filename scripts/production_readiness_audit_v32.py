#!/usr/bin/env python3
"""Additional production-readiness checks for Weburix V32."""
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, sys, tomllib

ROOT=Path(__file__).resolve().parents[1]
errors=[]; notes=[]
app=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/style.css').read_text(encoding='utf-8')
config=(ROOT/'assets/js/site-config.js').read_text(encoding='utf-8')
html_files=sorted(ROOT.rglob('*.html'))

# Active runtime should have one form provider and strict success/recovery guards.
for forbidden in ('web3forms','formspree','netlify forms'):
    if forbidden in app.lower(): errors.append(f'active app.js still references {forbidden}')
for marker in ('Promise.race', 'normalizeCartEntries', "classList.contains('is-submitting')", 'explicitSuccess', 'formatCartTotal'):
    if marker not in app: errors.append(f'missing runtime resilience marker: {marker}')
if 'tabindex="0"' in ''.join(re.findall(r'function .*?\n  }', app, flags=re.S)):
    errors.append('generated noninteractive cards still include tabindex=0')

# All contact forms retain native HTTPS fallback; no-JS project controls are useful.
for rel in ('index.html','kontakt.html','contact.html','kontakt/index.html'):
    p=ROOT/rel; soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    forms=soup.select('form[data-form-type]')
    if not forms: errors.append(f'{rel}: no delivery forms found')
    for form in forms:
        if form.get('action')!='https://formsubmit.co/info@weburix.com' or form.get('method','').lower()!='post':
            errors.append(f'{rel}: invalid native form fallback on {form.get("id")}')
    if len(soup.select('select[data-select="service"] option'))<2: errors.append(f'{rel}: no-JS service options missing')
    if len(soup.select('#service-checks input[name="interests"]'))<5: errors.append(f'{rel}: no-JS interest options missing')
    ns=soup.find('noscript')
    text=ns.get_text(' ',strip=True) if ns else ''
    if not ns or '.nav-panel' not in str(ns) or '.chat-launcher' not in str(ns): errors.append(f'{rel}: no-JS navigation/control fallback missing')

# Preview meta CSP stays portable; production configs retain HTTPS upgrade and exact providers.
for p in html_files:
    soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    csp=soup.find('meta',attrs={'http-equiv':re.compile('content-security-policy',re.I)})
    if csp and 'upgrade-insecure-requests' in csp.get('content',''):
        errors.append(f'{p.relative_to(ROOT)}: preview meta CSP forces HTTPS')
for rel in ('_headers','netlify.toml','vercel.json'):
    text=(ROOT/rel).read_text(encoding='utf-8')
    for marker in ('https://formsubmit.co','https://api.country.is','upgrade-insecure-requests'):
        if marker not in text: errors.append(f'{rel}: production security policy missing {marker}')

# Cache policy: assets immutable, root and directory HTML revalidate.
headers=(ROOT/'_headers').read_text(encoding='utf-8')
netlify=(ROOT/'netlify.toml').read_text(encoding='utf-8')
vercel=json.loads((ROOT/'vercel.json').read_text(encoding='utf-8'))
tomllib.loads(netlify)
for text,name in ((headers,'_headers'),(netlify,'netlify.toml')):
    if 'max-age=31536000, immutable' not in text: errors.append(f'{name}: immutable asset cache missing')
    for route in ('/wissen/*','/results/*','/kontakt/*'):
        if route not in text: errors.append(f'{name}: directory HTML cache rule missing for {route}')
vercel_sources={x.get('source') for x in vercel.get('headers',[])}
for route in ('/','/wissen/(.*)','/results/(.*)','/kontakt/(.*)'):
    if route not in vercel_sources: errors.append(f'vercel.json: route cache rule missing for {route}')

# Versioned first-party assets and no remote font dependency.
for p in html_files:
    soup=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
    for tag,attr in [('script','src'),('link','href')]:
        for el in soup.find_all(tag):
            url=el.get(attr,'')
            if ('assets/js/' in url or 'assets/css/' in url) and '?v=32.0' not in url:
                errors.append(f'{p.relative_to(ROOT)}: unversioned active asset {url}')
    doc=str(soup).lower()
    if 'fonts.googleapis.com' in doc or 'fonts.gstatic.com' in doc: errors.append(f'{p.relative_to(ROOT)}: remote Google Font dependency')

notes += [
  f'HTML pages checked: {len(html_files)}',
  'strict form success, timeout, rejection and duplicate-submit markers checked',
  'no-JavaScript navigation and project-form fallback checked',
  'portable preview CSP and production CSP separation checked',
  'immutable asset cache and revalidated HTML route rules checked',
]
lines=['Weburix Production Readiness Audit V32',f'Errors: {len(errors)}']+[f'ERROR: {e}' for e in errors]+[f'NOTE: {n}' for n in notes]
(ROOT/'PRODUCTION-READINESS-AUDIT-V32.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
sys.exit(1 if errors else 0)
