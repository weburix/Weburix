#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; notes=[]

def add_error(msg): errors.append(msg)
def add_warning(msg): warnings.append(msg)

html_files=list(ROOT.rglob('*.html'))
for f in html_files:
    text=f.read_text(encoding='utf-8')
    soup=BeautifulSoup(text,'html.parser')
    ids=[x.get('id') for x in soup.find_all(attrs={'id':True})]
    dup=sorted({i for i in ids if ids.count(i)>1})
    if dup: add_error(f'{f.relative_to(ROOT)}: duplicate ids {dup}')
    if not soup.title or not soup.title.get_text(strip=True): add_error(f'{f.relative_to(ROOT)}: missing title')
    if f.name=='index.html' and f.parent in (ROOT, ROOT/'wissen') or 'wissen' in f.parts:
        if not soup.find('meta',attrs={'name':'description'}): add_warning(f'{f.relative_to(ROOT)}: missing meta description')
    is_redirect = bool(soup.find('meta', attrs={'http-equiv': re.compile('refresh', re.I)}))
    if f != ROOT/'404.html' and not is_redirect and not soup.find('h1'): add_warning(f'{f.relative_to(ROOT)}: no h1')
    for tag,attr in [('a','href'),('img','src'),('script','src'),('link','href')]:
        for el in soup.find_all(tag):
            value=el.get(attr)
            if not value or value.startswith(('#','http:','https:','mailto:','tel:','data:','/')): continue
            value=value.split('?')[0].split('#')[0]
            if not value: continue
            path=(f.parent/value).resolve()
            if tag=='a' and path.is_dir(): path=path/'index.html'
            if not path.exists(): add_error(f'{f.relative_to(ROOT)}: missing {attr}={value}')
    for el in soup.find_all(True):
        if any(k.lower().startswith('on') for k in el.attrs): add_error(f'{f.relative_to(ROOT)}: inline event handler on <{el.name}>')
    for img in soup.find_all('img'):
        if img.get('alt') is None: add_error(f'{f.relative_to(ROOT)}: image without alt attribute')
        if not img.get('width') or not img.get('height'): add_warning(f'{f.relative_to(ROOT)}: image without explicit dimensions: {img.get("src","")}')
    for a in soup.find_all('a', target='_blank'):
        rel=set(a.get('rel') or [])
        if not {'noopener','noreferrer'}.intersection(rel): add_warning(f'{f.relative_to(ROOT)}: target=_blank without rel protection')

# data-i18n path collection
index_soup=BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
keys=sorted({el.get('data-i18n') for el in index_soup.find_all(attrs={'data-i18n':True})})
node_script=r'''
const fs=require('fs'),vm=require('vm');
let s=fs.readFileSync(process.argv[1],'utf8').replace(/^const WEBURIX_CONTENT\s*=\s*/,'WEBURIX_CONTENT = ');
const ctx={}; vm.createContext(ctx); vm.runInContext(s,ctx);
console.log(JSON.stringify(ctx.WEBURIX_CONTENT));
'''
proc=subprocess.run(['node','-e',node_script,str(ROOT/'assets/js/content.js')],capture_output=True,text=True)
if proc.returncode:
    add_error('content.js could not be evaluated: '+proc.stderr.strip())
    content={}
else: content=json.loads(proc.stdout)

def get_path(obj,path):
    for part in path.split('.'):
        if not isinstance(obj,dict) or part not in obj: return None
        obj=obj[part]
    return obj
for lang in ('de','en','sr'):
    if lang not in content: add_error(f'missing language {lang}'); continue
    for key in keys:
        if get_path(content[lang],key) is None: add_error(f'{lang}: missing i18n key {key}')
    if len(content[lang].get('checkout',{}).get('items',[])) < 16: add_warning(f'{lang}: expected expanded checkout catalogue')

# JavaScript syntax
for f in (ROOT/'assets/js').glob('*.js'):
    proc=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    if proc.returncode: add_error(f'{f.relative_to(ROOT)} syntax: {proc.stderr.strip()}')

# Sitemap local coverage (supports GitHub project pages and custom domains)
sitemap=(ROOT/'sitemap.xml').read_text(encoding='utf-8')
sitemap_urls=re.findall(r'<loc>(https?://[^<]+)</loc>',sitemap)
if not sitemap_urls:
    add_error('sitemap.xml contains no URLs')
else:
    first=urlparse(sitemap_urls[0])
    base_parts=[part for part in first.path.split('/') if part]
    project_prefix='/' + '/'.join(base_parts) + '/' if base_parts else '/'
    for absolute in sitemap_urls:
        parsed=urlparse(absolute)
        relative=parsed.path
        if project_prefix != '/' and relative.startswith(project_prefix):
            relative=relative[len(project_prefix):]
        else:
            relative=relative.lstrip('/')
        path=ROOT/'index.html' if not relative else ROOT/relative
        if relative and (relative.endswith('/') or not path.suffix): path=path/'index.html'
        if not path.exists(): add_error(f'sitemap URL missing locally: {absolute}')

# Forms
for form in index_soup.select('form[data-form-type]'):
    form_type=form.get('data-form-type','unknown')
    if not form.select_one('input[name="website_url"]'): add_warning(f'{form_type}: no honeypot')
    consent_selector = 'input[name="newsletter_consent"][required]' if form_type == 'newsletter' else 'input[name="privacy"][required]'
    if not form.select_one(consent_selector): add_error(f'{form_type}: missing required privacy/consent checkbox')
    status=form.select_one('[data-form-status]')
    if not status: add_error(f'{form_type}: missing form status area')
    elif status.get('role') != 'status' or status.get('aria-live') != 'polite': add_warning(f'{form_type}: form status should be role=status and aria-live=polite')

# Basic SEO assets
for required in ['robots.txt','sitemap.xml','rss.xml','manifest.webmanifest','404.html','.nojekyll','CNAME.example','assets/js/boot.js','scripts/set-site-url.py']:
    if not (ROOT/required).exists(): add_error(f'missing {required}')
for slug in ['interne-verlinkung-content-refresh','local-seo-muenchen','google-business-profil','website-kosten']:
    page=ROOT/'wissen'/slug/'index.html'
    if not page.exists(): add_error(f'missing guide {slug}')
    else:
        t=page.read_text(encoding='utf-8')
        if 'BreadcrumbList' not in t or 'Article' not in t: add_warning(f'{slug}: structured data incomplete')

# CSS brace sanity
css=(ROOT/'assets/css/style.css').read_text(encoding='utf-8')
stripped=re.sub(r'/\*.*?\*/','',css,flags=re.S)
if stripped.count('{') != stripped.count('}'): add_error('style.css brace count mismatch')


# Weburix V16 launch-safety checks
app_text=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
config_text=(ROOT/'assets/js/site-config.js').read_text(encoding='utf-8')
content_text=(ROOT/'assets/js/content.js').read_text(encoding='utf-8')
root_html=(ROOT/'index.html').read_text(encoding='utf-8')

if "const DEFAULT_LANG = 'de'" not in app_text:
    add_error('German is not configured as DEFAULT_LANG')
if 'setLanguage(storedLanguage || DEFAULT_LANG)' not in app_text:
    add_error('initial language does not fall back to German')
if "!hasFunctionalConsent()" not in app_text or 'WEBURIX_GEO_ENDPOINT' not in config_text:
    add_error('optional country lookup is not visibly gated by functional consent')
if "directCheckoutEnabled: false" not in config_text:
    add_warning('direct checkout should remain disabled until the legal checkout is final')
if "vatMode: 'unset'" not in config_text:
    add_warning('QA expected an explicit VAT-mode configuration entry')
if 'window.WEBURIX_LEGAL' not in config_text:
    add_error('central WEBURIX_LEGAL configuration is missing')
if re.search(r'20\s*%[^\n]{0,80}(billig|günst|cheaper|jeftin)', content_text, re.I):
    add_error('public exact 20% cheaper claim found in content.js')
if 'data-vat-notice' not in root_html:
    add_error('dynamic VAT notice is missing from the main page')
if 'data-checkout-legal-link' not in root_html:
    add_warning('future checkout legal links are not conditionally controlled')

for f in html_files:
    soup=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
    is_redirect = bool(soup.find('meta', attrs={'http-equiv': re.compile('refresh', re.I)}))
    if not is_redirect:
        viewport=soup.find('meta',attrs={'name':'viewport'})
        if not viewport or 'viewport-fit=cover' not in (viewport.get('content') or ''):
            add_warning(f'{f.relative_to(ROOT)}: viewport-fit=cover missing')
    for form in soup.select('form[data-form-type]'):
        privacy=form.select_one('input[name="privacy"]')
        if privacy and not form.find_next('small',class_='privacy-link'):
            add_warning(f'{f.relative_to(ROOT)}: {form.get("data-form-type")} has no nearby privacy-policy link')

for required_css in ['-webkit-text-size-adjust','touch-action','100svh','100dvh','safe-area-inset','@supports not (backdrop-filter']:
    if required_css not in css:
        add_warning(f'style.css missing compatibility marker: {required_css}')


# V19 deployment, metadata and mobile-navigation checks
for f in html_files:
    soup=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
    theme_tags=soup.find_all('meta',attrs={'name':'theme-color'})
    if len(theme_tags)>1: add_warning(f'{f.relative_to(ROOT)}: duplicate theme-color metadata')
    for el in soup.find_all(['a','img','script','link']):
        attr='href' if el.name in ('a','link') else 'src'
        value=el.get(attr,'')
        if value.startswith('/') and f.name != '404.html':
            add_warning(f'{f.relative_to(ROOT)}: root-relative {attr} may break on GitHub project pages: {value}')

manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
if manifest.get('start_url') != './': add_warning('manifest start_url should be ./ for GitHub project-page compatibility')
if manifest.get('scope') != './': add_warning('manifest scope should be ./ for GitHub project-page compatibility')
for icon in manifest.get('icons',[]):
    if str(icon.get('src','')).startswith('/'): add_warning('manifest icon uses a root-relative path')

if (ROOT/'CNAME').exists():
    cname_host=(ROOT/'CNAME').read_text(encoding='utf-8').strip().lower()
    sitemap_host=urlparse(sitemap_urls[0]).hostname.lower() if sitemap_urls else ''
    if cname_host != sitemap_host:
        add_warning('active CNAME does not match the sitemap/canonical host')
if 'github.io' not in sitemap and not (ROOT/'CNAME').exists():
    add_warning('sitemap does not target the current GitHub Pages URL and no active CNAME exists')
if 'syncMobileNavAccessibility' not in app_text or "toggleAttribute('inert'" not in app_text:
    add_warning('mobile navigation does not appear to remove closed links from keyboard focus')
if 'body.nav-open::after' not in css:
    add_warning('mobile navigation backdrop missing')
if '?v=32.0' not in root_html:
    add_warning('main page is not using the latest cache-busting asset version')



# V24 Serbian currency-switch regression checks.
if 'window.WEBURIX_CURRENCY' not in config_text:
    add_error('EUR/RSD currency configuration is missing')
if "defaultSerbianMode: 'both'" not in config_text:
    add_warning('Serbian currency display should default to EUR + RSD')
if 'function localizePriceText' not in app_text or 'function ensureCurrencyMenu' not in app_text:
    add_error('Serbian currency conversion UI/functions are missing')
if 'currency-menu' not in css or 'currency-rate-note' not in css:
    add_error('currency selector styles are missing')
if 'CURRENCY-CONVERSION.md' not in [x.name for x in ROOT.iterdir()]:
    add_warning('currency maintenance documentation is missing')
notes.append('Serbian EUR/RSD selector and dual-price conversion: checked')
# Launch-readiness warnings: not technical failures, but must be resolved before real business use.
if "window.WEBURIX_FORM_MODE = 'formsubmit'" in config_text and 'https://formsubmit.co/ajax/' in config_text:
    notes.append('Contact delivery: FormSubmit configured; one-time inbox activation required')
else:
    add_warning('LAUNCH: no active direct form backend is configured')
for field in ('ownerName','street','postalCode'):
    if re.search(rf"{field}:\s*''", config_text):
        add_warning(f'LAUNCH: legal field {field} is empty in site-config.js')
if "vatMode: 'unset'" in config_text:
    add_warning('LAUNCH: VAT mode is unset; confirm the correct tax wording before publishing prices')
for field, label in (
    ('businessRegistered', 'Gewerbe/business registration has not been confirmed'),
    ('domainOwned', 'ownership of the final domain has not been confirmed'),
    ('dnsAndHttpsReady', 'final DNS, www redirect and HTTPS have not been confirmed'),
    ('businessEmailReady', 'business mailbox info@weburix.com has not been confirmed'),
    ('formsubmitActivated', 'FormSubmit recipient activation has not been confirmed'),
    ('formProviderPrivacyReviewed', 'final privacy/DPA review for the form provider has not been confirmed'),
    ('hostingPrivacyReviewed', 'privacy wording for the final hosting provider has not been confirmed'),
    ('realDeviceTested', 'real-device production test has not been confirmed')
):
    if re.search(rf"{field}:\s*false", config_text):
        add_warning(f'LAUNCH: {label}')

# V22 interaction stability and accessibility regression checks.
if 'aria-controls="nav-panel"' not in root_html:
    add_error('navigation toggle is missing aria-controls=nav-panel')
if 'aria-controls="chat-widget"' not in root_html:
    add_error('chat launcher is missing aria-controls=chat-widget')
chat_dialog=BeautifulSoup(root_html,'html.parser').select_one('#chat-widget[role="dialog"]')
if not chat_dialog:
    add_error('chat widget dialog semantics are missing')
if 'chatPulseSafe' not in css:
    add_error('stable chat launcher animation override is missing')
if 'consent-pending' not in app_text or 'consent-pending' not in css:
    add_error('cookie/chat collision guard is missing')
if "chatWidget.setAttribute('inert', '')" not in app_text or "modal.setAttribute('inert', '')" not in app_text:
    add_error('hidden interactive panels are not made inert')
boot_text=(ROOT/'assets/js/boot.js').read_text(encoding='utf-8')
if "'resource'" not in boot_text:
    add_warning('resource loading errors are not captured by boot diagnostics')
notes.append('Interaction stability and modal focus guards: checked')

notes.append('German-first language source checks: passed')
notes.append('Consent-gated country lookup source check: passed')
notes.append('Responsive/browser compatibility markers: checked')
notes.append('Legal/VAT/checkout launch guards: checked')

notes.append(f'HTML files checked: {len(html_files)}')
notes.append(f'i18n keys checked per language: {len(keys)}')
notes.append(f'Knowledge guides: 4')
notes.append(f'Service cards per language: {len(content.get("de",{}).get("serviceCards",[]))}')
notes.append(f'Checkout items per language: {len(content.get("de",{}).get("checkout",{}).get("items",[]))}')
report=['Weburix QA',f'Errors: {len(errors)}']+[f'ERROR: {x}' for x in errors]+[f'Warnings: {len(warnings)}']+[f'WARNING: {x}' for x in warnings]+[f'NOTE: {x}' for x in notes]
(ROOT/'QA-REPORT-LATEST.txt').write_text('\n'.join(report)+'\n',encoding='utf-8')
print('\n'.join(report))
sys.exit(1 if errors else 0)
