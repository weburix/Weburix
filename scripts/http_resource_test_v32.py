#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from urllib.request import urlopen, Request
import contextlib, os, threading, re

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'HTTP-RESOURCE-TEST-V32.txt'
errors=[]; notes=[]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

old=os.getcwd(); os.chdir(ROOT)
server=ThreadingHTTPServer(('127.0.0.1',0),QuietHandler)
thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
base=f'http://127.0.0.1:{server.server_port}'

urls=set(['/','/404.html','/robots.txt','/sitemap.xml','/rss.xml','/manifest.webmanifest','/.well-known/security.txt'])
for f in ROOT.rglob('*.html'):
    rel=f.relative_to(ROOT).as_posix()
    urls.add('/'+rel)
    if f.name=='index.html':
        directory='/' + f.parent.relative_to(ROOT).as_posix().strip('/')
        urls.add((directory.rstrip('/')+'/') if directory!='/' else '/')
    soup=BeautifulSoup(f.read_text('utf-8'),'lxml')
    for tag,attr in [('script','src'),('img','src'),('link','href'),('a','href')]:
        for node in soup.find_all(tag):
            value=node.get(attr)
            if not value or value.startswith(('http://','https://','mailto:','tel:','data:','#','javascript:','//')): continue
            clean=value.split('#')[0].split('?')[0]
            if not clean: continue
            target=(f.parent/clean).resolve()
            try: reltarget=target.relative_to(ROOT.resolve())
            except ValueError: continue
            if target.is_dir(): reltarget=reltarget/'index.html'
            if target.exists() and target.is_file():
                urls.add('/'+reltarget.as_posix())
for f in (ROOT/'assets').rglob('*'):
    if f.is_file(): urls.add('/'+f.relative_to(ROOT).as_posix())

for url in sorted(urls):
    try:
        req=Request(base+url,headers={'User-Agent':'Weburix-QA/27'})
        with contextlib.closing(urlopen(req,timeout=8)) as response:
            status=response.status
            body=response.read()
            ctype=response.headers.get_content_type()
        if status!=200: errors.append(f'{url}: HTTP {status}')
        if not body: errors.append(f'{url}: empty response')
        if url.endswith('.css') and ctype!='text/css': errors.append(f'{url}: unexpected content type {ctype}')
        if url.endswith('.js') and ctype not in {'text/javascript','application/javascript'}: errors.append(f'{url}: unexpected content type {ctype}')
        if url.endswith('.png') and ctype!='image/png': errors.append(f'{url}: unexpected content type {ctype}')
        if url.endswith('.svg') and ctype!='image/svg+xml': errors.append(f'{url}: unexpected content type {ctype}')
    except Exception as exc:
        errors.append(f'{url}: {type(exc).__name__}: {exc}')

server.shutdown(); server.server_close(); os.chdir(old)
notes.append(f'HTTP routes/resources checked: {len(urls)}')
notes.append('Server: Python ThreadingHTTPServer bound to localhost')
lines=['Weburix HTTP Resource Audit V32 Launch Final',f'Errors: {len(errors)}']+[f'ERROR: {x}' for x in errors]+[f'NOTE: {x}' for x in notes]
REPORT.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(1 if errors else 0)
