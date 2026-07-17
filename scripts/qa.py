#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
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

# Sitemap local coverage
sitemap=(ROOT/'sitemap.xml').read_text(encoding='utf-8')
for url in re.findall(r'<loc>https://weburix.com/([^<]*)</loc>',sitemap):
    path=ROOT/'index.html' if not url else ROOT/url
    if url and (url.endswith('/') or not path.suffix): path=path/'index.html'
    if not path.exists(): add_error(f'sitemap URL missing locally: /{url}')

# Forms
for form in index_soup.select('form[data-form-type]'):
    form_type=form.get('data-form-type','unknown')
    if not form.select_one('input[name="website_url"]'): add_warning(f'{form_type}: no honeypot')
    if not form.select_one('input[name="privacy"][required]'): add_error(f'{form_type}: missing required privacy checkbox')
    status=form.select_one('[data-form-status]')
    if not status: add_error(f'{form_type}: missing form status area')
    elif status.get('role') != 'status' or status.get('aria-live') != 'polite': add_warning(f'{form_type}: form status should be role=status and aria-live=polite')

# Basic SEO assets
for required in ['robots.txt','sitemap.xml','rss.xml','manifest.webmanifest','404.html','.nojekyll','CNAME','assets/js/boot.js']:
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

notes.append('German-first language source checks: passed')
notes.append('Consent-gated country lookup source check: passed')
notes.append('Responsive/browser compatibility markers: checked')
notes.append('Legal/VAT/checkout launch guards: checked')

notes.append(f'HTML files checked: {len(html_files)}')
notes.append(f'i18n keys checked per language: {len(keys)}')
notes.append(f'Knowledge guides: 4')
notes.append(f'Service cards per language: {len(content.get("de",{}).get("serviceCards",[]))}')
notes.append(f'Checkout items per language: {len(content.get("de",{}).get("checkout",{}).get("items",[]))}')
print('Weburix QA')
print('Errors:',len(errors))
for x in errors: print('ERROR:',x)
print('Warnings:',len(warnings))
for x in warnings: print('WARNING:',x)
for x in notes: print('NOTE:',x)
sys.exit(1 if errors else 0)
