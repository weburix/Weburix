#!/usr/bin/env python3
"""Fast, isolated Chromium regression audit for Weburix V32."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes
import re
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'BROWSER-REGRESSION-V32.txt'
ORIGIN = 'https://weburix.test'
VIEWPORTS = [(240,600),(280,653),(320,568),(360,800),(390,844),(412,915),(768,1024),(1024,768),(1366,768),(1600,900)]
PRIMARY = ['index.html','kontakt.html']
SECONDARY = ['404.html','agb/index.html','contact.html','datenschutz.html','datenschutz/index.html','impressum.html','impressum/index.html','kontakt/index.html','results/index.html','widerruf/index.html','wissen/index.html','wissen/google-business-profil/index.html','wissen/interne-verlinkung-content-refresh/index.html','wissen/local-seo-muenchen/index.html','wissen/website-kosten/index.html']
errors=[]; notes=[]

def html_for(rel, prefix=''):
    html=(ROOT/rel).read_text(encoding='utf-8')
    parent=Path(rel).parent.as_posix()
    base_path=(prefix.rstrip('/')+'/' if prefix else '/')
    if parent not in ('','.'): base_path += parent.strip('/')+'/'
    base=f'{ORIGIN}{base_path}'
    html=html.replace('<head>',f'<head><base href="{base}">',1)
    html=re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*/?>','',html,flags=re.I)
    return html

def router(page,prefix='',form_response=None,missing=None):
    prefix_clean=prefix.strip('/')
    def handle(route):
        u=urlparse(route.request.url)
        if u.hostname=='formsubmit.co' and '/ajax/' in u.path and form_response is not None:
            route.fulfill(status=200,content_type='application/json',body=form_response); return
        if u.hostname!='weburix.test': route.abort(); return
        rel=u.path.lstrip('/')
        if prefix_clean and rel.startswith(prefix_clean+'/'): rel=rel[len(prefix_clean)+1:]
        target=ROOT/rel
        if target.is_dir(): target=target/'index.html'
        if target.exists() and target.is_file():
            route.fulfill(status=200,path=str(target),content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
        else:
            if missing is not None: missing.append(u.path)
            route.fulfill(status=404,body='not found',content_type='text/plain')
    page.route('**/*',handle)

def new_page(browser,w=390,h=844,touch=False,reduced=False,javascript=True,prefix='',form_response=None):
    ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch,reduced_motion='reduce' if reduced else 'no-preference',color_scheme='dark',java_script_enabled=javascript,bypass_csp=True)
    page=ctx.new_page(); page.set_default_timeout(6000)
    runtime=[]; missing=[]
    page.on('pageerror',lambda e:runtime.append('pageerror: '+str(e)))
    page.on('console',lambda m:runtime.append('console: '+m.text) if m.type=='error' else None)
    router(page,prefix,form_response,missing)
    return ctx,page,runtime,missing

def load(page,rel,prefix=''):
    page.set_content(html_for(rel,prefix),wait_until='domcontentloaded',timeout=12000)
    page.wait_for_timeout(550)

def health(browser,rel,w,h,prefix=''):
    ctx,page,runtime,missing=new_page(browser,w,h,touch=w<=768,prefix=prefix)
    try:
        load(page,rel,prefix)
        data=page.evaluate("""() => {
          const root=document.documentElement, h1=document.querySelector('h1');
          const broken=[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src);
          const outside=[...document.querySelectorAll('a,button,input,select,textarea,summary')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return !el.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&(r.left<-1||r.right>innerWidth+1)}).slice(0,5).map(el=>el.outerHTML.slice(0,120));
          const css=[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>({href:x.getAttribute('href'),loaded:!!x.sheet}));
          return {overflow:root.scrollWidth-root.clientWidth,broken,outside,css,h1:!!h1&&h1.getBoundingClientRect().height>0,loader:!!document.querySelector('#loader:not(.hidden)'),bg:getComputedStyle(document.documentElement).backgroundColor};
        }""")
        label=f'{rel} {w}x{h}'+(f' prefix={prefix}' if prefix else '')
        if data['overflow']>1: errors.append(f'{label}: overflow {data["overflow"]}px')
        if data['broken']: errors.append(f'{label}: broken images {data["broken"]}')
        if data['outside']: errors.append(f'{label}: controls outside viewport {data["outside"]}')
        if not data['h1']: errors.append(f'{label}: H1 hidden')
        if data['loader']: errors.append(f'{label}: loader remained visible')
        if data['css'] and not all(x['loaded'] for x in data['css']): errors.append(f'{label}: stylesheet not loaded {data["css"]}')
        if missing: errors.append(f'{label}: missing first-party resources {missing}')
        if runtime: errors.append(f'{label}: runtime {runtime}')
    except Exception as e: errors.append(f'{rel} {w}x{h}: {type(e).__name__}: {e}')
    finally: ctx.close()

def interaction_page(browser,rel='index.html',**kw):
    ctx,page,runtime,missing=new_page(browser,**kw); load(page,rel,kw.get('prefix','')); return ctx,page,runtime,missing

def test_contact_paths(browser):
    for prefix in ('','/weburixsite'):
        ctx,page,runtime,missing=interaction_page(browser,'index.html',w=390,h=844,prefix=prefix)
        link=page.locator('a.nav-cta').first
        href=link.get_attribute('href'); resolved=link.evaluate('(el)=>el.href')
        expected=f'{ORIGIN}{prefix}/kontakt.html'
        if href!='kontakt.html': errors.append(f'Contact CTA href is {href!r}, expected kontakt.html')
        if resolved!=expected: errors.append(f'Contact CTA resolves to {resolved}, expected {expected}')
        ctx.close()
        for rel in ('kontakt.html','contact.html'):
            ctx,page,runtime,missing=interaction_page(browser,rel,w=390,h=844,prefix=prefix)
            css=page.locator('link[rel=stylesheet]').first
            if css.get_attribute('href')!='assets/css/style.css?v=32.0' or not css.evaluate('(e)=>!!e.sheet'):
                errors.append(f'{rel} prefix {prefix or "/"}: portable CSS path failed')
            scripts=page.locator('script[src]').evaluate_all('(els)=>els.map(e=>e.getAttribute("src"))')
            if any(s and s.startswith('../') for s in scripts): errors.append(f'{rel}: parent-relative scripts {scripts}')
            if missing or runtime: errors.append(f'{rel} prefix {prefix or "/"}: missing={missing} runtime={runtime}')
            ctx.close()
    notes.append('index.html → kontakt.html and direct kontakt.html/contact.html paths passed at root and /weburixsite/ subpath')

def test_mobile_nav(browser):
    ctx,page,runtime,missing=interaction_page(browser,w=390,h=844,touch=True)
    before=len(errors)
    if page.get_attribute('.nav-toggle','aria-label')!='Menü öffnen': errors.append('mobile nav initial German aria-label failed')
    page.click('.nav-toggle'); page.wait_for_timeout(180)
    if page.get_attribute('.nav-toggle','aria-expanded')!='true' or not page.locator('#nav-panel').is_visible(): errors.append('mobile nav open failed')
    if page.get_attribute('.nav-toggle','aria-label')!='Menü schließen': errors.append('mobile nav open aria-label failed')
    page.keyboard.press('Escape')
    if page.get_attribute('.nav-toggle','aria-expanded')!='false': errors.append('mobile nav Escape close failed')
    if page.get_attribute('.nav-toggle','aria-label')!='Menü öffnen': errors.append('mobile nav close aria-label failed')
    if runtime or missing: errors.append(f'mobile nav runtime={runtime} missing={missing}')
    if len(errors)==before: notes.append('mobile navigation passed')
    ctx.close()

def test_cookie(browser):
    ctx,page,runtime,missing=interaction_page(browser)
    page.locator('#cookie-banner').wait_for(state='visible')
    page.click('[data-cookie-settings]'); page.locator('#cookie-settings-modal').wait_for(state='visible'); page.keyboard.press('Escape'); page.locator('#cookie-settings-modal').wait_for(state='hidden')
    page.click('[data-cookie-choice="necessary"]'); page.locator('#cookie-banner').wait_for(state='hidden')
    if runtime or missing: errors.append(f'cookie runtime={runtime} missing={missing}')
    else: notes.append('cookie flow passed')
    ctx.close()

def test_languages(browser):
    ctx,page,runtime,missing=interaction_page(browser,w=1366,h=768)
    page.click('.language-menu > summary'); page.click('[data-lang="sr"]')
    if page.get_attribute('html','lang')!='sr-Latn': errors.append('Serbian language switch failed')
    sr_labels={
      '.site-header nav':'Glavna navigacija', '#nav-panel':'Navigacija stranice',
      '.nav-toggle':'Otvori meni', '#chat-launcher':'Otvori Weburix chat za podršku',
      '#chat-widget':'Weburix chat za podršku', '#chat-close':'Zatvori chat',
      '#chat-input':'Poruka za Weburix asistenta', '#back-to-top':'Nazad na vrh'
    }
    for selector,expected in sr_labels.items():
        actual=page.get_attribute(selector,'aria-label')
        if actual!=expected: errors.append(f'Serbian interactive label failed for {selector}: {actual!r}')
    page.click('.language-menu > summary'); page.click('[data-lang="en"]')
    if page.get_attribute('html','lang')!='en': errors.append('English language switch failed')
    en_labels={
      '.site-header nav':'Main navigation', '#nav-panel':'Page navigation',
      '.nav-toggle':'Open menu', '#chat-launcher':'Open Weburix support chat',
      '#chat-widget':'Weburix support chat', '#chat-close':'Close chat',
      '#chat-input':'Message the Weburix Assistant', '#back-to-top':'Back to top'
    }
    for selector,expected in en_labels.items():
        actual=page.get_attribute(selector,'aria-label')
        if actual!=expected: errors.append(f'English interactive label failed for {selector}: {actual!r}')
    if runtime or missing: errors.append(f'language runtime={runtime} missing={missing}')
    else: notes.append('language switching passed')
    ctx.close()

def test_promo(browser):
    ctx,page,runtime,missing=interaction_page(browser,w=1366,h=768)
    page.locator('[data-cart-add]').first.click(); p=page.locator('#promo-code')
    p.fill('BADCODE'); page.click('#promo-apply')
    if page.locator('#promo-status').get_attribute('data-status')!='error': errors.append('invalid promo accepted')
    p.fill('WEBURIX5'); page.click('#promo-apply')
    if page.locator('#promo-status').get_attribute('data-status')!='success' or not page.locator('#promo-remove').is_visible(): errors.append('valid promo failed')
    page.click('#promo-remove'); page.wait_for_timeout(100)
    if page.locator('#promo-remove').is_visible(): errors.append('promo remove failed')
    if runtime or missing: errors.append(f'promo runtime={runtime} missing={missing}')
    else: notes.append('promo flow passed')
    ctx.close()

def fill_quick(page):
    f=page.locator('#quick-form'); f.locator('[name=name]').fill('QA User'); f.locator('[name=email]').fill('qa@example.com'); f.locator('[name=message]').fill('Regression test message'); f.locator('[name=privacy]').check(); return f

def test_forms(browser):
    ctx,page,runtime,missing=new_page(browser,w=390,h=844,touch=True,form_response='{"success":true,"message":"sent"}'); load(page,'kontakt.html')
    f=fill_quick(page); f.locator('button[type=submit]').click(); page.wait_for_function("document.querySelector('#quick-form [data-form-status]').dataset.status === 'success'")
    if f.locator('[name=name]').input_value()!='': errors.append('successful quick form did not reset')
    if runtime or missing: errors.append(f'form success runtime={runtime} missing={missing}')
    else: notes.append('contact success flow passed')
    ctx.close()

    ctx,page,runtime,missing=new_page(browser,w=390,h=844,touch=True,form_response='{"success":"false","message":"Please activate and confirm your form"}'); load(page,'kontakt.html')
    f=fill_quick(page); f.locator('button[type=submit]').click()
    try: page.wait_for_function("document.querySelector('#quick-form [data-form-status]').dataset.status === 'warning'",timeout=5000)
    except PlaywrightTimeoutError: errors.append('string false response not treated as warning')
    if f.locator('[name=name]').input_value()=='': errors.append('failed form was reset')
    if runtime or missing: errors.append(f'form warning runtime={runtime} missing={missing}')
    else: notes.append('contact activation-warning flow passed')
    ctx.close()

    # HTTP 200 without an explicit success=true must not reset the form.
    ctx,page,runtime,missing=new_page(browser,w=390,h=844,touch=True,form_response='{"message":"ambiguous response"}'); load(page,'kontakt.html')
    page.evaluate("void (HTMLFormElement.prototype.submit = function(){ throw new Error('native submit blocked') })")
    f=fill_quick(page); f.locator('button[type=submit]').click()
    page.wait_for_function("!document.querySelector('#quick-form button[type=submit]').disabled",timeout=5000)
    if f.locator('[name=name]').input_value()=='': errors.append('ambiguous FormSubmit response was accepted as success')
    if page.locator('#quick-form [data-form-status]').get_attribute('data-status')!='error': errors.append('ambiguous FormSubmit response did not produce an error status')
    ctx.close()

    # If native submission itself throws, the form must recover and re-enable its button.
    ctx,page,runtime,missing=new_page(browser,w=390,h=844,touch=True,form_response='{"success":false,"message":"temporary failure"}'); load(page,'kontakt.html')
    page.evaluate("void (HTMLFormElement.prototype.submit = function(){ throw new Error('native submit blocked') })")
    f=fill_quick(page); f.locator('button[type=submit]').click()
    page.wait_for_function("!document.querySelector('#quick-form button[type=submit]').disabled",timeout=5000)
    if page.locator('#quick-form [data-form-status]').get_attribute('data-status')!='error': errors.append('native submit rejection did not produce an error status')
    if runtime or missing: errors.append(f'native rejection runtime={runtime} missing={missing}')
    else: notes.append('strict FormSubmit and native-fallback rejection flows passed')
    ctx.close()

    # Two rapid submit events must still create only one delivery attempt.
    ctx,page,runtime,missing=new_page(browser,w=390,h=844,touch=True,form_response='{"success":true}'); load(page,'kontakt.html')
    page.evaluate("""() => {
      window.__formFetchCalls = 0;
      window.fetch = () => {
        window.__formFetchCalls += 1;
        return new Promise((resolve) => setTimeout(() => resolve(new Response(JSON.stringify({success:true}), {status:200, headers:{'Content-Type':'application/json'}})), 250));
      };
    }""")
    f=fill_quick(page)
    page.evaluate("""() => { const form=document.querySelector('#quick-form'); form.requestSubmit(); form.requestSubmit(); }""")
    page.wait_for_function("document.querySelector('#quick-form [data-form-status]').dataset.status === 'success'",timeout=5000)
    if page.evaluate('window.__formFetchCalls') != 1: errors.append('rapid double submit created more than one delivery attempt')
    if runtime or missing: errors.append(f'double-submit runtime={runtime} missing={missing}')
    else: notes.append('rapid double-submit guard passed')
    ctx.close()

def test_newsletter(browser):
    ctx,page,runtime,missing=new_page(browser,w=390,h=844,touch=True,form_response='{"success":true}'); load(page,'index.html')
    page.locator('#newsletter-form [name=email]').fill('waitlist@example.com')
    page.locator('#newsletter-form [name=newsletter_consent]').check()
    page.locator('#newsletter-form button[type=submit]').click()
    page.wait_for_function("document.querySelector('#newsletter-form [data-form-status]').dataset.status === 'success'")
    if runtime or missing: errors.append(f'newsletter runtime={runtime} missing={missing}')
    else: notes.append('newsletter waitlist consent and submit flow passed')
    ctx.close()

def test_project(browser):
    ctx,page,runtime,missing=new_page(browser,w=768,h=1024,form_response='{"success":true}'); load(page,'kontakt.html')
    f=page.locator('#project-form'); f.locator('[name=name]').fill('Project QA'); f.locator('[name=email]').fill('project@example.com')
    for n in ('service','budget','timeline','support'): f.locator(f'[name={n}]').select_option(index=1)
    f.locator('[name=message]').fill('Project regression'); f.locator('[name=privacy]').check(); f.locator('button[type=submit]').click(); page.wait_for_function("document.querySelector('#project-form [data-form-status]').dataset.status === 'success'")
    if runtime or missing: errors.append(f'project runtime={runtime} missing={missing}')
    else: notes.append('project form passed')
    ctx.close()

def test_chat_reduced_nojs(browser):
    ctx,page,runtime,missing=interaction_page(browser)
    page.click('[data-cookie-choice="necessary"]'); page.click('#chat-launcher')
    if page.get_attribute('#chat-widget','aria-hidden')!='false': errors.append('chat open failed')
    page.keyboard.press('Escape')
    if page.get_attribute('#chat-widget','aria-hidden')!='true': errors.append('chat close failed')
    ctx.close(); notes.append('chat flow passed')

    ctx,page,runtime,missing=interaction_page(browser,w=390,h=844,touch=True,reduced=True)
    hidden=page.evaluate("[...document.querySelectorAll('.reveal')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.top<innerHeight&&r.bottom>0&&(s.opacity==='0'||s.visibility==='hidden')}).length")
    if hidden: errors.append(f'reduced motion left {hidden} elements hidden')
    ctx.close(); notes.append('reduced-motion mode passed')

    for rel in ('index.html','kontakt.html'):
        ctx,page,runtime,missing=new_page(browser,w=240,h=600,touch=True,javascript=False); load(page,rel)
        if not page.locator('h1').is_visible(): errors.append(f'no-JS {rel} H1 hidden')
        overflow=page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
        if overflow>1: errors.append(f'no-JS {rel} overflow {overflow}px at 240px')
        if not page.locator('#nav-panel').is_visible(): errors.append(f'no-JS {rel} mobile navigation hidden')
        if page.locator('.nav-toggle').is_visible(): errors.append(f'no-JS {rel} nonfunctional menu toggle visible')
        if page.locator('.chat-launcher').is_visible(): errors.append(f'no-JS {rel} nonfunctional chat launcher visible')
        if page.locator('[data-select="service"] option').count()<2: errors.append(f'no-JS {rel} project service options missing')
        if page.locator('#service-checks input[name="interests"]').count()<5: errors.append(f'no-JS {rel} project interests missing')
        if rel=='kontakt.html':
            f=page.locator('#quick-form')
            if f.get_attribute('action')!='https://formsubmit.co/info@weburix.com' or (f.get_attribute('method') or '').lower()!='post': errors.append('no-JS contact fallback invalid')
        if missing or runtime: errors.append(f'no-JS {rel} runtime={runtime} missing={missing}')
        ctx.close()
    notes.append('no-JavaScript navigation and contact/project fallback passed')


def test_language_state(browser):
    ctx,page,runtime,missing=interaction_page(browser,'kontakt.html',w=390,h=844,touch=True)
    page.evaluate("""() => {
      document.querySelector('[data-cookie-choice="necessary"]')?.click();
      const selections={service:6,budget:3,timeline:4,support:2};
      Object.entries(selections).forEach(([name,index])=>{const el=document.querySelector(`#project-form [name="${name}"]`); if(el) el.selectedIndex=index;});
      const checks=[...document.querySelectorAll('#service-checks input')];
      [1,3,8].forEach(i=>{if(checks[i]) checks[i].checked=true;});
    }""")
    read_form_state="""() => ({
      selects:['service','budget','timeline','support'].map(name=>document.querySelector(`#project-form [name="${name}"]`)?.selectedIndex),
      checks:[...document.querySelectorAll('#service-checks input')].map((e,i)=>e.checked?i:-1).filter(i=>i>=0)
    })"""
    before=page.evaluate(read_form_state)
    page.evaluate("document.querySelector('[data-lang=sr]').click()")
    page.wait_for_timeout(120)
    after_language=page.evaluate(read_form_state)
    page.evaluate("document.querySelector('[data-currency=rsd]')?.click()")
    page.wait_for_timeout(120)
    after_currency=page.evaluate(read_form_state)
    if after_language!=before: errors.append(f'language switch lost form state: before={before} after={after_language}')
    if after_currency!=before: errors.append(f'currency switch lost form state: before={before} after={after_currency}')
    if runtime or missing: errors.append(f'language form-state runtime={runtime} missing={missing}')
    ctx.close()

    ctx,page,runtime,missing=interaction_page(browser,'index.html',w=1366,h=768)
    page.evaluate("""() => {
      document.querySelector('[data-cookie-choice="necessary"]')?.click();
      document.querySelector('#service-tab-2')?.click();
      document.querySelectorAll('.faq-question')[2]?.click();
    }""")
    read_ui_state="""() => ({
      tab:Number(document.querySelector('.tab-button.active')?.dataset.tabIndex ?? -1),
      faq:[...document.querySelectorAll('.faq-item')].findIndex(e=>e.classList.contains('open'))
    })"""
    before_ui=page.evaluate(read_ui_state)
    page.evaluate("document.querySelector('[data-lang=sr]').click()")
    page.wait_for_timeout(120)
    after_ui_language=page.evaluate(read_ui_state)
    page.evaluate("document.querySelector('[data-currency=rsd]')?.click()")
    page.wait_for_timeout(120)
    after_ui_currency=page.evaluate(read_ui_state)
    if after_ui_language!=before_ui: errors.append(f'language switch lost tab/FAQ state: before={before_ui} after={after_ui_language}')
    if after_ui_currency!=before_ui: errors.append(f'currency switch lost tab/FAQ state: before={before_ui} after={after_ui_currency}')
    if runtime or missing: errors.append(f'language UI-state runtime={runtime} missing={missing}')
    else: notes.append('language/currency changes preserve selects, interests, active tab and FAQ state')
    ctx.close()

def test_cart_resilience(browser):
    ctx,page,runtime,missing=new_page(browser,w=390,h=844,touch=True)
    storage_script = """<script>
    (() => {
      const makeStorage = (initial = {}) => {
        const data = new Map(Object.entries(initial));
        return {
          get length(){ return data.size; },
          key(index){ return [...data.keys()][index] ?? null; },
          getItem(key){ return data.has(String(key)) ? data.get(String(key)) : null; },
          setItem(key,value){ data.set(String(key),String(value)); },
          removeItem(key){ data.delete(String(key)); },
          clear(){ data.clear(); }
        };
      };
      Object.defineProperty(window,'localStorage',{configurable:true,value:makeStorage({'weburix-cart':JSON.stringify([{id:'starter',qty:'2'},{id:'starter',qty:1},{id:'bad',qty:'NaN'}])})});
      Object.defineProperty(window,'sessionStorage',{configurable:true,value:makeStorage({'weburix-promo-code':'REMOVED-CODE'})});
    })();
    </script>"""
    html=html_for('index.html').replace('</head>',storage_script+'</head>',1)
    page.set_content(html,wait_until='domcontentloaded',timeout=12000); page.wait_for_timeout(650)
    state=page.evaluate("""() => ({
      count:document.querySelector('#cart-count')?.textContent,
      qty:document.querySelector('.cart-qty span')?.textContent,
      promo:sessionStorage.getItem('weburix-promo-code'),
      removeVisible:!!document.querySelector('#promo-remove') && !document.querySelector('#promo-remove').hidden
    })""")
    if state['count']!='3' or state['qty']!='3': errors.append(f'stored cart normalization failed: {state}')
    if state['promo'] is not None or state['removeVisible']: errors.append(f'stale promo cleanup failed: {state}')
    page.evaluate("document.querySelector('[data-cart-qty=starter][data-delta=\"1\"]')?.click()")
    if page.locator('.cart-qty span').first.text_content().strip()!='4': errors.append('cart plus after string quantity did not produce 4')
    page.evaluate("document.querySelector('[data-cart-qty=starter][data-delta=\"-1\"]')?.click()")
    if page.locator('.cart-qty span').first.text_content().strip()!='3': errors.append('cart minus after normalized quantity did not produce 3')
    labels=page.locator('.cart-qty button').evaluate_all('(els)=>els.map(e=>e.getAttribute("aria-label"))')
    if not labels or any('Starter' not in (x or '') for x in labels): errors.append(f'cart quantity labels are not item-specific: {labels}')
    if runtime or missing: errors.append(f'cart resilience runtime={runtime} missing={missing}')
    else: notes.append('stored cart normalization, stale promo cleanup and item-specific quantity labels passed')
    ctx.close()

def test_serbian_currency_text(browser):
    ctx,page,runtime,missing=interaction_page(browser,'index.html',w=1366,h=768)
    page.evaluate("""() => { document.querySelector('[data-cookie-choice="necessary"]')?.click(); document.querySelector('[data-lang=sr]')?.click(); }""")
    page.locator('[data-cart-add="starter"]').click()
    page.locator('#promo-code').fill('WEBURIX5'); page.locator('#promo-apply').click(); page.wait_for_timeout(100)
    status=page.locator('#promo-status').text_content() or ''
    if '<small' in status or '</small>' in status: errors.append(f'promo status leaked HTML markup: {status}')
    total_html=page.locator('#cart-total').inner_html()
    if 'currency-secondary' not in total_html: errors.append('dual-currency cart total lost intended secondary markup')
    page.locator('#cart-request').click(); page.wait_for_timeout(100)
    message=page.locator('#project-form textarea[name=message]').input_value()
    if '<small' in message or '</small>' in message: errors.append(f'project request leaked HTML markup: {message}')
    if runtime or missing: errors.append(f'Serbian currency runtime={runtime} missing={missing}')
    else: notes.append('Serbian dual-currency totals keep markup in UI but plain text in status and form payload')
    ctx.close()

def test_skip_focus_and_tab_order(browser):
    ctx,page,runtime,missing=interaction_page(browser,'index.html',w=390,h=844,touch=True)
    page.evaluate("document.querySelector('.skip-link')?.click()")
    focused=page.evaluate("document.activeElement?.id")
    if focused!='main': errors.append(f'skip link did not focus main landmark: {focused!r}')
    extra=page.evaluate("""() => [...document.querySelectorAll('.service-card,.idea-card,.quality-card,.integration-card,.result-card,.testimonial-card,.example-card')].filter(e=>e.getAttribute('tabindex')==='0').length""")
    if extra: errors.append(f'{extra} non-interactive cards remain in keyboard tab order')
    if runtime or missing: errors.append(f'skip/tab runtime={runtime} missing={missing}')
    else: notes.append('skip link focus and streamlined keyboard tab order passed')
    ctx.close()

def main():
    launch_args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']
    with sync_playwright() as pw:
        # Separate browser processes keep long regression runs stable in low-memory CI.
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=launch_args)
        for w,h in VIEWPORTS:
            for rel in PRIMARY: health(browser,rel,w,h)
        browser.close()

        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=launch_args)
        for w,h in ((320,568),(768,1024),(1366,768)):
            for rel in SECONDARY: health(browser,rel,w,h)
        browser.close()

        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=launch_args)
        test_contact_paths(browser); test_mobile_nav(browser); test_cookie(browser); test_languages(browser); test_promo(browser); test_language_state(browser); test_cart_resilience(browser); test_serbian_currency_text(browser); test_skip_focus_and_tab_order(browser); test_forms(browser); test_newsletter(browser); test_project(browser); test_chat_reduced_nojs(browser)
        browser.close()
    lines=['Weburix Browser Regression V32 Launch Final',f'Errors: {len(errors)}',f'Primary responsive renders: {len(VIEWPORTS)*len(PRIMARY)}',f'Secondary responsive renders: {3*len(SECONDARY)}']
    lines += [f'ERROR: {x}' for x in errors] + [f'NOTE: {x}' for x in notes]
    lines += ['NOTE: Viewports: '+', '.join(f'{w}x{h}' for w,h in VIEWPORTS),'NOTE: Root and GitHub Pages-style /weburixsite/ paths were tested.','NOTE: No real inbox message was sent; FormSubmit responses were intercepted.']
    REPORT.write_text('\n'.join(lines)+'\n',encoding='utf-8'); print('\n'.join(lines)); return 1 if errors else 0
if __name__=='__main__': raise SystemExit(main())
