#!/usr/bin/env python3
"""Static accessibility and semantic audit for Weburix V32."""
from pathlib import Path
from collections import Counter
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'ACCESSIBILITY-AUDIT-V32.txt'
errors=[]; warnings=[]; notes=[]

for path in sorted(ROOT.rglob('*.html')):
    rel=path.relative_to(ROOT).as_posix()
    try:
        doc=html.fromstring(path.read_bytes())
    except Exception as exc:
        errors.append(f'{rel}: HTML parse failed: {exc}')
        continue
    ids=doc.xpath('//*[@id]/@id')
    duplicates=[key for key,count in Counter(ids).items() if count>1]
    if duplicates: errors.append(f'{rel}: duplicate IDs {duplicates}')
    idset=set(ids)
    mains=doc.xpath('//main')
    if len(mains)!=1: errors.append(f'{rel}: expected exactly one main element, found {len(mains)}')
    if mains:
        main=mains[0]
        if rel!='404.html' and doc.xpath('//header|//nav'):
            if main.get('id')!='main': errors.append(f'{rel}: main landmark needs id="main"')
            skips=doc.xpath('//a[contains(concat(" ",normalize-space(@class)," ")," skip-link ") and @href="#main"]')
            if not skips: errors.append(f'{rel}: missing skip link to #main')
    h1=doc.xpath('//h1')
    if len(h1)!=1: errors.append(f'{rel}: expected one H1, found {len(h1)}')
    for node in doc.xpath('//*[@aria-labelledby or @aria-describedby or @aria-controls]'):
        for attr in ('aria-labelledby','aria-describedby','aria-controls'):
            for target in (node.get(attr) or '').split():
                if target and target not in idset:
                    errors.append(f'{rel}: {attr} references missing #{target}')
    for node in doc.xpath('//a[@target="_blank"]'):
        rels=(node.get('rel') or '').split()
        if 'noopener' not in rels: errors.append(f'{rel}: target=_blank link lacks noopener')
    for image in doc.xpath('//img'):
        if image.get('alt') is None: errors.append(f'{rel}: image missing alt attribute ({image.get("src")})')
    # Check form controls unless intentionally hidden from users and AT.
    for control in doc.xpath('//input|//select|//textarea'):
        typ=(control.get('type') or '').lower()
        if typ=='hidden' or control.get('aria-hidden')=='true' or control.xpath('ancestor::*[@aria-hidden="true"]'):
            continue
        cid=control.get('id')
        labels=doc.xpath(f'//label[@for="{cid}"]') if cid else []
        wrapped=control.xpath('ancestor::label')
        name=(control.get('aria-label') or control.get('aria-labelledby') or '').strip()
        if not name and not labels and not wrapped:
            errors.append(f'{rel}: form control has no accessible label ({control.get("name") or control.tag})')
    levels=[int(node.tag[1]) for node in doc.xpath('//h1|//h2|//h3|//h4|//h5|//h6')]
    for before,after in zip(levels,levels[1:]):
        if after>before+1: warnings.append(f'{rel}: heading level jumps h{before}→h{after}')

notes.append(f'HTML pages checked: {len(list(ROOT.rglob("*.html")))}')
lines=['Weburix Accessibility Audit V32',f'Errors: {len(errors)}',f'Warnings: {len(warnings)}']
lines += [f'ERROR: {x}' for x in errors] + [f'WARNING: {x}' for x in warnings] + [f'NOTE: {x}' for x in notes]
REPORT.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
raise SystemExit(1 if errors else 0)
