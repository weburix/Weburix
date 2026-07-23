#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import mimetypes, re, json, shutil, tempfile, subprocess
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'RESILIENCE-AUDIT-V32.txt'
ORIGIN='https://weburix.test'
errors=[]; notes=[]

def html_for(rel):
    text=(ROOT/rel).read_text('utf-8')
    parent=Path(rel).parent.as_posix()
    base='/' if parent in ('','.') else '/'+parent.strip('/')+'/'
    text=text.replace('<head>',f'<head><base href="{ORIGIN}{base}">',1)
    text=re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*/?>','',text,flags=re.I)
    return text

def route(page, block_app=False):
    def handle(r):
        u=urlparse(r.request.url)
        if u.hostname!='weburix.test':
            r.abort(); return
        rel=u.path.lstrip('/')
        if block_app and rel.endswith('assets/js/app.js'):
            r.fulfill(status=503,content_type='text/plain',body='blocked for fallback test'); return
        p=ROOT/rel
        if p.is_dir(): p=p/'index.html'
        if p.exists(): r.fulfill(status=200,path=str(p),content_type=mimetypes.guess_type(str(p))[0] or 'application/octet-stream')
        else: r.fulfill(status=404,content_type='text/plain',body='not found')
    page.route('**/*',handle)

def new_page(browser,w=390,h=844,block_app=False):
    ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=w<=768,is_mobile=w<=480,bypass_csp=True)
    page=ctx.new_page(); page.set_default_timeout(7000); route(page,block_app)
    return ctx,page

with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking'])
    # App failure must never leave static content hidden.
    ctx,p=new_page(b,390,844,True)
    p.set_content(html_for('index.html'),wait_until='domcontentloaded')
    p.wait_for_timeout(3600)
    d=p.evaluate("""() => ({loader:document.querySelector('#loader:not(.hidden)')!==null,
      fallback:document.documentElement.classList.contains('weburix-app-fallback'),
      hidden:[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity==='0').length,
      recorded:(window.__WEBURIX_ERRORS__||[]).map(x=>x.type)})""")
    if d['loader'] or not d['fallback'] or d['hidden']:
        errors.append(f'app failure fallback failed: {d}')
    else: notes.append('main-script failure safely reveals static content and hides loader')
    ctx.close()

    # Narrow touch controls and translated promo accessible name.
    ctx,p=new_page(b,280,653)
    p.set_content(html_for('index.html'),wait_until='domcontentloaded'); p.wait_for_timeout(900)
    dims=p.evaluate("""() => {
      const q=s=>{const r=document.querySelector(s).getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]};
      return {nav:q('.nav-toggle'),lang:q('.language-menu > summary'),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      promo:document.querySelector('#promo-code').getAttribute('aria-label')};
    }""")
    if dims['nav'][0]<44 or dims['nav'][1]<44: errors.append(f'narrow nav target below 44px: {dims["nav"]}')
    if dims['lang'][1]<44: errors.append(f'narrow language target below 44px: {dims["lang"]}')
    if dims['overflow']>1: errors.append(f'280px header overflow: {dims["overflow"]}')
    if dims['promo']!='Aktionscode': errors.append(f'German promo accessible name failed: {dims["promo"]!r}')
    p.click('.language-menu > summary'); p.click('[data-lang="sr"]');
    if p.get_attribute('#promo-code','aria-label')!='Promo kod': errors.append('promo accessible name did not translate to Serbian')
    else: notes.append('44px narrow touch controls and translated promo label passed')
    ctx.close()

    # Contact aliases must have the same closed-dialog semantics.
    for rel in ('kontakt.html','contact.html','kontakt/index.html'):
        ctx,p=new_page(b)
        p.set_content(html_for(rel),wait_until='domcontentloaded'); p.wait_for_timeout(500)
        state=p.evaluate("""() => ({controls:document.querySelector('#chat-launcher')?.getAttribute('aria-controls'),
          expanded:document.querySelector('#chat-launcher')?.getAttribute('aria-expanded'),
          inert:document.querySelector('#chat-widget')?.hasAttribute('inert'),
          role:document.querySelector('#chat-widget')?.getAttribute('role')})""")
        if state != {'controls':'chat-widget','expanded':'false','inert':True,'role':'dialog'}: errors.append(f'{rel}: chat semantics mismatch {state}')
        ctx.close()
    notes.append('contact aliases share consistent chat ARIA/inert state')
    b.close()

# Repeated public URL conversion must replace the immediately previous URL too.
with tempfile.TemporaryDirectory() as td:
    copy=Path(td)/'site'; shutil.copytree(ROOT,copy)
    commands=[
      ['python3','scripts/set-site-url.py','https://preview.example.net/site/','--hosting','other'],
      ['python3','scripts/set-site-url.py','https://weburix.com/','--custom-domain','--hosting','cloudflare-pages']
    ]
    for cmd in commands:
        run=subprocess.run(cmd,cwd=copy,text=True,capture_output=True)
        if run.returncode: errors.append(f'set-site-url failed: {cmd}: {run.stderr or run.stdout}')
    stale=[]
    for p in copy.rglob('*'):
        if p.is_file() and p.suffix.lower() in {'.html','.js','.xml','.txt','.md'} or (p.is_file() and p.name=='robots.txt'):
            try: text=p.read_text('utf-8')
            except Exception: continue
            if 'preview.example.net/site' in text: stale.append(p.relative_to(copy).as_posix())
    if stale: errors.append(f'repeated domain conversion left stale preview URL in {stale[:10]}')
    elif (copy/'CNAME').read_text('utf-8').strip()!='weburix.com': errors.append('repeated domain conversion did not create final CNAME')
    else: notes.append('repeated preview-to-final domain conversion passed')

lines=['Weburix Resilience Audit V32',f'Errors: {len(errors)}']+[f'ERROR: {x}' for x in errors]+[f'NOTE: {x}' for x in notes]
REPORT.write_text('\n'.join(lines)+'\n','utf-8'); print('\n'.join(lines)); raise SystemExit(1 if errors else 0)
