#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; notes=[]
app=(ROOT/'assets/js/app.js').read_text(encoding='utf-8')
config=(ROOT/'assets/js/site-config.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/style.css').read_text(encoding='utf-8')
required=[
 'window.WEBURIX_CURRENCY','rsdRate: 117.3829',"defaultSerbianMode: 'both'",
 'function localizePriceText','function ensureCurrencyMenu','function updateCurrencyUI',
 "['both', 'eur', 'rsd']",'currency-rate-note'
]
for marker in required:
    source=config if marker in ('window.WEBURIX_CURRENCY','rsdRate: 117.3829',"defaultSerbianMode: 'both'") else css if marker=='currency-rate-note' else app
    if marker not in source: errors.append('missing '+marker)
# JavaScript syntax
for f in (ROOT/'assets/js').glob('*.js'):
    r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    if r.returncode: errors.append(f'{f.name}: {r.stderr.strip()}')
notes += [
 'Serbian default display: EUR + RSD',
 'Selectable modes: EUR + RSD, EUR only, RSD only',
 'Billing/base currency remains EUR',
 'Configured rate: 1 EUR = 117.3829 RSD (2026-07-21)',
 'RSD display rounded to nearest 10 dinars',
]
report=['Weburix Currency Audit V32 Production Final',f'Errors: {len(errors)}']+[f'ERROR: {x}' for x in errors]+[f'NOTE: {x}' for x in notes]
(ROOT/'CURRENCY-AUDIT.txt').write_text('\n'.join(report)+'\n',encoding='utf-8')
print('\n'.join(report))
sys.exit(1 if errors else 0)
