#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote
import re

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'STRUCTURAL-AUDIT-V32.txt'
errors=[]; warnings=[]; notes=[]
htmls=sorted(ROOT.rglob('*.html'))

def local_target(file, href):
    clean=href.split('#')[0].split('?')[0]
    if not clean: return file
    if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', clean) or clean.startswith('//'): return None
    clean=unquote(clean)
    rel=clean.lstrip('/') if clean.startswith('/') else (file.parent.relative_to(ROOT)/clean).as_posix()
    p=(ROOT/rel).resolve()
    try: p.relative_to(ROOT.resolve())
    except ValueError: return 'OUTSIDE'
    if p.is_dir(): p=p/'index.html'
    elif not p.suffix and (p/'index.html').exists(): p=p/'index.html'
    return p

for file in htmls:
    rel=file.relative_to(ROOT).as_posix()
    soup=BeautifulSoup(file.read_text('utf-8'),'lxml')
    ids=[n.get('id') for n in soup.find_all(attrs={'id':True})]
    dup=sorted({x for x in ids if ids.count(x)>1})
    if dup: errors.append(f'{rel}: duplicate ids {dup}')
    if not soup.html or not soup.html.get('lang'): errors.append(f'{rel}: missing html lang')
    if not soup.find('meta',attrs={'name':'viewport'}): errors.append(f'{rel}: missing viewport')
    if not soup.title or not soup.title.get_text(strip=True): errors.append(f'{rel}: missing title')
    for img in soup.find_all('img'):
        if not img.has_attr('alt'): errors.append(f'{rel}: image missing alt: {img.get("src")}')
        if not img.has_attr('width') or not img.has_attr('height'): warnings.append(f'{rel}: image missing intrinsic size: {img.get("src")}')
        target=local_target(file,img.get('src',''))
        if isinstance(target,Path) and not target.exists(): errors.append(f'{rel}: missing image {img.get("src")}')
    for a in soup.find_all('a',target='_blank'):
        if 'noopener' not in set(a.get('rel') or []): errors.append(f'{rel}: target=_blank missing noopener: {a.get("href")}')
    for button in soup.find_all('button'):
        if not button.has_attr('type'): warnings.append(f'{rel}: button missing type: {button.get_text(" ",strip=True)[:40]}')
    for form in soup.find_all('form'):
        fid=form.get('id') or form.get('name') or '?'
        for control in form.find_all(['input','select','textarea']):
            typ=control.get('type','').lower()
            if typ in {'hidden','submit','button','reset','image'}: continue
            if control.get('aria-hidden')=='true' and control.get('tabindex')=='-1': continue
            labelled=bool(control.find_parent('label'))
            cid=control.get('id')
            if cid and form.find('label',attrs={'for':cid}): labelled=True
            if control.get('aria-label') or control.get('aria-labelledby'): labelled=True
            if not labelled: errors.append(f'{rel}: form {fid} has unlabelled {control.name}[name={control.get("name")}]')
    for a in soup.find_all('a',href=True):
        href=a['href']
        if href in {'#','javascript:void(0)','javascript:;'}: errors.append(f'{rel}: dead href {href}')
        target=local_target(file,href)
        if target=='OUTSIDE': errors.append(f'{rel}: path escapes package: {href}')
        elif isinstance(target,Path) and not target.exists(): errors.append(f'{rel}: broken local href {href}')
        if '#' in href and not re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',href):
            fragment=unquote(href.split('#',1)[1])
            target=local_target(file,href.split('#',1)[0])
            if fragment and isinstance(target,Path) and target.exists() and target.suffix=='.html':
                target_soup=BeautifulSoup(target.read_text('utf-8'),'lxml')
                if not target_soup.find(id=fragment) and not target_soup.find(attrs={'name':fragment}):
                    errors.append(f'{rel}: missing fragment {href}')
    robots=soup.find('meta',attrs={'name':'robots'})
    robots_value=(robots.get('content','') if robots else '').lower()
    if 'noindex' not in robots_value and rel not in {'impressum.html','datenschutz.html'}:
        if len(soup.find_all('h1'))!=1: errors.append(f'{rel}: expected one H1, found {len(soup.find_all("h1"))}')
        if not soup.find('meta',attrs={'name':'description'}): errors.append(f'{rel}: missing description')
        if not soup.find('link',rel='canonical'): errors.append(f'{rel}: missing canonical')
    for name in ('description','robots'):
        if len(soup.find_all('meta',attrs={'name':name}))>1: errors.append(f'{rel}: duplicate meta {name}')
    if len(soup.find_all('link',rel='canonical'))>1: errors.append(f'{rel}: duplicate canonical')

css=(ROOT/'assets/css/style.css').read_text('utf-8')
if css.count('{')!=css.count('}'): errors.append('style.css: unbalanced braces')
versions=set()
for file in htmls:
    versions.update(re.findall(r'assets/(?:js|css)/[^"\']+\?v=([0-9.]+)',file.read_text('utf-8')))
if versions!={'32.0'}: errors.append(f'inconsistent cache versions: {sorted(versions)}')

notes += [f'HTML files checked: {len(htmls)}', f'Asset cache version: {next(iter(versions), "none")}']
lines=['Weburix Structural Audit V32 Launch Final',f'Errors: {len(errors)}',f'Warnings: {len(warnings)}']
lines += [f'ERROR: {x}' for x in errors] + [f'WARNING: {x}' for x in warnings] + [f'NOTE: {x}' for x in notes]
REPORT.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(1 if errors else 0)
