#!/usr/bin/env python3
from pathlib import Path
import argparse, importlib.util
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit', ROOT/'scripts/browser_audit_v32.py')
a=importlib.util.module_from_spec(spec); spec.loader.exec_module(a)
parser=argparse.ArgumentParser(); parser.add_argument('group',choices=['primary','secondary','secondary-a','secondary-b','ui','forms','ux']); args=parser.parse_args()
launch_args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=launch_args)
    if args.group=='primary':
        for w,h in a.VIEWPORTS:
            for rel in a.PRIMARY: a.health(browser,rel,w,h)
    elif args.group in ('secondary','secondary-a','secondary-b'):
        pages=a.SECONDARY
        if args.group=='secondary-a': pages=pages[:8]
        elif args.group=='secondary-b': pages=pages[8:]
        for w,h in ((240,600),(320,568),(768,1024),(1366,768)):
            for rel in pages: a.health(browser,rel,w,h)
    elif args.group=='ui':
        a.test_contact_paths(browser); a.test_mobile_nav(browser); a.test_cookie(browser); a.test_languages(browser); a.test_promo(browser); a.test_chat_reduced_nojs(browser)
    elif args.group=='ux':
        a.test_language_state(browser); a.test_cart_resilience(browser); a.test_serbian_currency_text(browser); a.test_skip_focus_and_tab_order(browser)
    else:
        a.test_forms(browser); a.test_newsletter(browser); a.test_project(browser)
    browser.close()
lines=[f'Weburix Browser Group V32: {args.group}',f'Errors: {len(a.errors)}']+[f'ERROR: {x}' for x in a.errors]+[f'NOTE: {x}' for x in a.notes]
report=ROOT/f'BROWSER-V32-{args.group.upper()}.txt'; report.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines)); raise SystemExit(1 if a.errors else 0)
