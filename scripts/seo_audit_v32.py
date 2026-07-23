#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urldefrag
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; notes=[]
indexable=[]; canonicals={}
for path in sorted(ROOT.rglob('*.html')):
    rel=path.relative_to(ROOT).as_posix()
    soup=BeautifulSoup(path.read_text(encoding='utf-8'),'html.parser')
    ids=[x.get('id') for x in soup.select('[id]')]
    dup=sorted({x for x in ids if ids.count(x)>1})
    if dup: errors.append(f'{rel}: duplicate IDs {dup}')
    if len(soup.select('h1'))!=1 and rel not in {'impressum.html','datenschutz.html'}: errors.append(f'{rel}: H1 count {len(soup.select("h1"))}')
    robots=soup.find('meta',attrs={'name':'robots'})
    is_indexable=bool(robots and str(robots.get('content','')).startswith('index'))
    if is_indexable:
        indexable.append(rel)
        title=soup.title.get_text(' ',strip=True) if soup.title else ''
        desc=(soup.find('meta',attrs={'name':'description'}) or {}).get('content','') if soup.find('meta',attrs={'name':'description'}) else ''
        if not 30<=len(title)<=60: errors.append(f'{rel}: title length {len(title)}')
        if not 70<=len(desc)<=160: errors.append(f'{rel}: description length {len(desc)}')
        canonical=soup.find('link',rel='canonical')
        if not canonical or not str(canonical.get('href','')).startswith('https://'): errors.append(f'{rel}: missing absolute canonical')
        else:
            url=canonical['href']; canonicals[rel]=url
            if url in [x for k,x in canonicals.items() if k!=rel]: errors.append(f'{rel}: duplicate canonical {url}')
        for prop in ('og:title','og:description','og:url','og:image','og:site_name','og:type'):
            if not soup.find('meta',property=prop): errors.append(f'{rel}: missing {prop}')
        for name in ('twitter:card','twitter:title','twitter:description','twitter:image'):
            if not soup.find('meta',attrs={'name':name}): errors.append(f'{rel}: missing {name}')
    # JSON-LD must parse.
    for script in soup.select('script[type="application/ld+json"]'):
        try: json.loads(script.get_text())
        except Exception as exc: errors.append(f'{rel}: invalid JSON-LD {exc}')
    # Local href targets and fragments.
    for a in soup.select('a[href]'):
        href=a.get('href','').strip()
        if not href or href.startswith(('mailto:','tel:','https://','http://','javascript:')): continue
        clean,frag=urldefrag(href)
        if clean:
            target=(path.parent/clean).resolve()
            if clean.endswith('/') or target.is_dir(): target=target/'index.html'
            if not target.exists(): errors.append(f'{rel}: broken link {href}')
        else: target=path
        if frag:
            ts=BeautifulSoup(target.read_text(encoding='utf-8'),'html.parser') if target.exists() else None
            if ts and not ts.find(id=frag): errors.append(f'{rel}: missing fragment #{frag} in {href}')
    # All form controls that need labels are covered by label or aria-label.
    for control in soup.select('form input:not([type="hidden"]):not([type="checkbox"]), form textarea, form select'):
        if control.get('name') in {'website_url','_honey'}: continue
        labelled=control.find_parent('label') or control.get('aria-label') or (control.get('id') and soup.find('label',attrs={'for':control.get('id')}))
        if not labelled: errors.append(f'{rel}: unlabeled form field {control.get("name") or control.name}')
    for a in soup.select('a[target="_blank"]'):
        rels=set(a.get('rel') or [])
        if not {'noopener','noreferrer'}.issubset(rels): warnings.append(f'{rel}: external target blank missing full rel')

# Sitemap must list all indexable canonical URLs except utility home duplicates.
sitemap=(ROOT/'sitemap.xml').read_text(encoding='utf-8')
sm_urls=set(re.findall(r'<loc>([^<]+)</loc>',sitemap))
for rel,url in canonicals.items():
    if url not in sm_urls: errors.append(f'{rel}: canonical missing from sitemap')
for url in sm_urls:
    if url not in set(canonicals.values()): warnings.append(f'sitemap URL without indexable canonical: {url}')

robots=(ROOT/'robots.txt').read_text(encoding='utf-8')
home_url=min(sm_urls, key=len) if sm_urls else ''
expected_sitemap=(home_url.rstrip('/')+'/sitemap.xml') if home_url else ''
robots_match=re.search(r'^Sitemap:\s*(\S+)', robots, re.M)
if not robots_match or robots_match.group(1) != expected_sitemap: errors.append('robots.txt sitemap mismatch')
if 'Disallow: /kontakt/' in robots or 'Disallow: /wissen/' in robots: errors.append('robots blocks indexable content')

# Form backend and no-JS fallback.
config=(ROOT/'assets/js/site-config.js').read_text(encoding='utf-8')
app=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
if "WEBURIX_FORM_MODE = 'formsubmit'" not in config: errors.append('FormSubmit is not default backend')
if 'submitToFormSubmit' not in app: errors.append('FormSubmit JS handler missing')
for rel in ('index.html','kontakt.html'):
    soup=BeautifulSoup((ROOT/rel).read_text(encoding='utf-8'),'html.parser')
    for form in soup.select('form[data-form-type]'):
        if form.get('action')!='https://formsubmit.co/info@weburix.com': errors.append(f'{rel}: no-JS action incorrect')
        if not form.select_one('input[name="_honey"]'): errors.append(f'{rel}: FormSubmit honeypot missing')
        if not form.select_one('input[name="_subject"]'): errors.append(f'{rel}: FormSubmit subject missing')

notes += [f'Indexable pages checked: {len(indexable)}',f'Canonical URLs checked: {len(canonicals)}','Open Graph/Twitter metadata checked','JSON-LD parsed','Internal links and fragments checked','Form labels and no-JS delivery checked']
lines=['Weburix SEO & Link Audit V32 Launch Final',f'Errors: {len(errors)}',f'Warnings: {len(warnings)}']
lines += [f'ERROR: {e}' for e in errors] + [f'WARNING: {w}' for w in warnings] + [f'NOTE: {n}' for n in notes]
(ROOT/'SEO-AUDIT-V32.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
sys.exit(1 if errors else 0)
