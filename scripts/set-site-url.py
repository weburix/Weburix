#!/usr/bin/env python3
"""Update all crawl-visible absolute URLs for GitHub Pages or a custom domain.

Examples:
  python3 scripts/set-site-url.py https://weburix.github.io/weburixsite/
  python3 scripts/set-site-url.py https://weburix.com/ --custom-domain
"""
from pathlib import Path
from urllib.parse import urlparse
import argparse, json, re

ROOT = Path(__file__).resolve().parents[1]


def update_hosting_section(provider: str):
    blocks = {
        'github-pages': '<h2>3. Hosting über GitHub Pages</h2>\n<p>Die Website wird über GitHub Pages bereitgestellt. Anbieter ist GitHub, Inc., USA. Beim Aufruf können insbesondere IP-Adresse, Browser- und Gerätedaten, Referrer, Zeitpunkt und angeforderte Seite verarbeitet werden, um die Website sicher und stabil auszuliefern. Eine Verarbeitung in den USA kann nicht ausgeschlossen werden. Weitere Informationen enthalten die <a href="https://docs.github.com/pages/getting-started-with-github-pages/about-github-pages#data-collection" rel="noopener noreferrer" target="_blank">GitHub-Pages-Dokumentation</a> und die <a href="https://docs.github.com/site-policy/privacy-policies/github-privacy-statement" rel="noopener noreferrer" target="_blank">GitHub-Datenschutzerklärung</a>.</p>',
        'cloudflare-pages': '<h2>3. Hosting und Auslieferung über Cloudflare Pages</h2>\n<p>Die Website wird über Cloudflare Pages und das globale Cloudflare-Netzwerk bereitgestellt. Anbieter ist Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA. Beim Aufruf können insbesondere IP-Adresse, Browser- und Gerätedaten, Referrer, Zeitpunkt und angeforderte Seite verarbeitet werden, um die Website sicher, schnell und stabil auszuliefern. Eine Verarbeitung außerhalb der EU kann nicht ausgeschlossen werden. Cloudflare stellt Informationen zur DSGVO, zu Übermittlungsmechanismen und eine Vereinbarung zur Auftragsverarbeitung bereit. Weitere Informationen enthalten die <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener noreferrer" target="_blank">Cloudflare-Datenschutzerklärung</a> und das <a href="https://www.cloudflare.com/trust-hub/gdpr/" rel="noopener noreferrer" target="_blank">Cloudflare GDPR Trust Hub</a>.</p>',
        'netlify': '<h2>3. Hosting über Netlify</h2>\n<p>Die Website wird über Netlify bereitgestellt. Vor Veröffentlichung müssen hier die aktuelle Anbieterbezeichnung, Anschrift, verarbeiteten Server-Logdaten, Rechtsgrundlage, Speicherdauer, Auftragsverarbeitung und mögliche Drittlandübermittlungen anhand der tatsächlich gebuchten Netlify-Leistung ergänzt und geprüft werden.</p>',
        'vercel': '<h2>3. Hosting über Vercel</h2>\n<p>Die Website wird über Vercel bereitgestellt. Vor Veröffentlichung müssen hier die aktuelle Anbieterbezeichnung, Anschrift, verarbeiteten Server-Logdaten, Rechtsgrundlage, Speicherdauer, Auftragsverarbeitung und mögliche Drittlandübermittlungen anhand der tatsächlich gebuchten Vercel-Leistung ergänzt und geprüft werden.</p>',
        'other': '<h2>3. Hosting</h2>\n<p>Vor Veröffentlichung müssen hier der tatsächlich eingesetzte Hostinganbieter, dessen Anschrift, die verarbeiteten Server-Logdaten, Rechtsgrundlage, Speicherdauer, Auftragsverarbeitung und mögliche Drittlandübermittlungen vollständig eingetragen und geprüft werden.</p>'
    }
    start='<!-- WEBURIX-HOSTING-START -->'
    end='<!-- WEBURIX-HOSTING-END -->'
    for rel in ('datenschutz.html','datenschutz/index.html'):
        path=ROOT/rel
        text=path.read_text(encoding='utf-8')
        if start not in text or end not in text:
            raise SystemExit(f'Hosting markers missing in {rel}')
        before, rest=text.split(start,1)
        _, after=rest.split(end,1)
        path.write_text(before+start+'\n'+blocks[provider]+'\n'+end+after,encoding='utf-8')

KNOWN_BASES = ('https://weburix.com/', 'https://weburix.github.io/weburixsite/')

parser = argparse.ArgumentParser()
parser.add_argument('base_url')
parser.add_argument('--custom-domain', action='store_true')
parser.add_argument('--hosting', choices=('github-pages','cloudflare-pages','netlify','vercel','other'), default=None)
args = parser.parse_args()
base = args.base_url.strip()
if not base.startswith(('https://','http://')):
    raise SystemExit('base_url must start with https:// or http://')
base = base.rstrip('/') + '/'
parsed = urlparse(base)

# Include the currently configured public URL so the tool can be run repeatedly
# (for example GitHub Pages -> preview domain -> final custom domain).
config_path = ROOT / 'assets/js/site-config.js'
config_before = config_path.read_text(encoding='utf-8')
current_match = re.search(r"publicUrl:\s*'([^']+)'", config_before)
current_base = (current_match.group(1).rstrip('/') + '/') if current_match else ''
old_bases = tuple(dict.fromkeys((*KNOWN_BASES, current_base)))

for path in ROOT.rglob('*'):
    if not path.is_file() or path.name in {'CNAME', 'CNAME.example'}:
        continue
    if path.suffix.lower() not in {'.html','.js','.xml','.txt','.md'} and path.name != 'robots.txt':
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    updated = text
    for old in old_bases:
        updated = updated.replace(old, base)
    if updated != text:
        path.write_text(updated, encoding='utf-8')

manifest_path = ROOT / 'manifest.webmanifest'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['start_url'] = './'
manifest['scope'] = './'
for icon in manifest.get('icons', []):
    icon['src'] = str(icon.get('src','')).lstrip('/')
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

cname = ROOT / 'CNAME'
if args.custom_domain:
    if parsed.path not in ('','/'):
        raise SystemExit('--custom-domain requires a domain root URL without a path')
    cname.write_text(parsed.hostname + '\n', encoding='utf-8')
elif cname.exists():
    cname.unlink()


if args.hosting:
    update_hosting_section(args.hosting)
    cfg = config_path
    cfg_text = cfg.read_text(encoding='utf-8')
    cfg_text = re.sub(r"hostingProvider: '[^']*'", f"hostingProvider: '{args.hosting}'", cfg_text, count=1)
    cfg.write_text(cfg_text, encoding='utf-8')

# Keep launch-state URLs in sync with the crawl-visible public URL.
cfg = config_path
cfg_text = cfg.read_text(encoding='utf-8')
cfg_text = re.sub(r"publicUrl: '[^']*'", f"publicUrl: '{base}'", cfg_text, count=1)
cfg_text = re.sub(r"customDomain: '[^']*'", f"customDomain: '{parsed.hostname if args.custom_domain else ''}'", cfg_text, count=1)
cfg.write_text(cfg_text, encoding='utf-8')

print(f'Updated site base URL to {base}')
print('CNAME:', cname.read_text().strip() if cname.exists() else 'disabled')
