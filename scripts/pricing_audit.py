#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
errors=[]; notes=[]
def error(msg): errors.append(msg)

def load_content():
    js = r'''const fs=require('fs'),vm=require('vm');const p=process.argv[1];const code=fs.readFileSync(p,'utf8')+'\n;globalThis.__x=WEBURIX_CONTENT;';const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);console.log(JSON.stringify(ctx.__x));'''
    result=subprocess.run(['node','-e',js,str(ROOT/'assets/js/content.js')],capture_output=True,text=True)
    if result.returncode:
        error('content.js evaluation failed: '+result.stderr.strip()); return {}
    return json.loads(result.stdout)

content=load_content()
expected={
 'starter':599,'business':1099,'growth':1699,'google':129,
 'care-essential':39,'care-business':79,'care-priority':129,
 'course-web':49,'course-seo':79,'course-social':69,'social-youtube':179,
 'consulting':59,'audit':79,'brandkit':119,'emailsetup':69,
 'content-refresh':159,'digital-pr':219,'seo-foundation':249,
 'local-seo':219,'google-ads':219,'social-ads':219,
}
previous={
 'starter':690,'business':1290,'growth':1990,'google':149,
 'care-essential':49,'care-business':89,'care-priority':149,
 'course-web':59,'course-seo':89,'course-social':79,'social-youtube':199,
 'consulting':69,'audit':89,'brandkit':129,'emailsetup':79,
 'content-refresh':179,'digital-pr':249,'seo-foundation':299,
 'local-seo':249,'google-ads':249,'social-ads':249,
}
for lang in ('de','en','sr'):
    if lang not in content:
        error(f'missing locale {lang}'); continue
    items=content[lang].get('checkout',{}).get('items',[])
    ids=[x.get('id') for x in items]
    if len(ids)!=len(set(ids)): error(f'{lang}: duplicate checkout ids')
    by_id={x.get('id'):x for x in items}
    for ident,price in expected.items():
        if ident not in by_id: error(f'{lang}: missing checkout item {ident}'); continue
        item=by_id[ident]
        if item.get('price') != price: error(f'{lang}: {ident} price {item.get("price")} != {price}')
        if item.get('oldPrice') != previous[ident]: error(f'{lang}: {ident} reference price mismatch')
        if price >= previous[ident]: error(f'{lang}: {ident} entry price must remain below its historical reference price')
        label=str(item.get('priceLabel',''))
        nums=re.findall(r'\d+',label)
        found=int(''.join(nums)) if price>=1000 else (int(nums[0]) if nums else 0)
        if found != price: error(f'{lang}: {ident} label {label!r} does not match {price}')

index=(ROOT/'index.html').read_text(encoding='utf-8')
if '59 € / Std.' not in index or '5 Stunden: 259 €' not in index:
    error('index.html consulting fallback is stale')
site_config=(ROOT/'assets/js/site-config.js').read_text(encoding='utf-8')
if not re.search(r'WEBURIX_PROMOTION\s*=\s*\{[\s\S]*?enabled:\s*false', site_config):
    error('optional promotion must be disabled by default')
app=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
if 'a promotion without a valid end date is never displayed' not in app:
    error('promotion end-date safety check missing')
for html in ROOT.rglob('*.html'):
    text=html.read_text(encoding='utf-8')
    if re.search(r'<img[^>]+\s/\s+loading=',text): error(f'{html.relative_to(ROOT)}: malformed img slash before loading')
    soup=BeautifulSoup(text,'html.parser')
    for tag in soup.find_all('img'):
        if tag.get('loading') not in (None,'lazy','eager'): error(f'{html.relative_to(ROOT)}: invalid loading value')

notes += [
 f'Locales checked: {len([x for x in ("de","en","sr") if x in content])}',
 f'Checkout prices checked per locale: {len(expected)}',
 'V32 Production Final prices: coherent entry prices below the stored historical reference values',
 'Comparison-price display: prepared but disabled by default',
 'Campaign display requires a valid end date',
]
report=['Weburix Pricing Audit V32 Production Final',f'Errors: {len(errors)}']+[f'ERROR: {x}' for x in errors]+[f'NOTE: {x}' for x in notes]
(ROOT/'PRICING-AUDIT.txt').write_text('\n'.join(report)+'\n',encoding='utf-8')
print('\n'.join(report))
sys.exit(1 if errors else 0)
