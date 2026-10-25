const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {context,readState,settleVisibleLayout}=require('./browser_compare.cjs');
const base='https://www.dcpp-digital.de';
async function exercise(browser,mode){
 const c=await context(browser,mode,390),p=await c.newPage(),steps=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2026-10-24T18:00:00Z'));
 async function go(url){await p.goto(base+url,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle',{timeout:30000});}
 async function step(name){
  await p.evaluate(()=>scrollTo({top:0,left:0,behavior:'instant'}));
  await p.waitForFunction(()=>window.scrollY<5);
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await settleVisibleLayout(p);
  const state=await readState(p);steps.push({name,state});console.log(mode+' '+name);
 }
 await go('/');
 if(mode==='candidate'){
  assert.equal(await p.title(),'DCPP Digital | Webdesign & App-Entwicklung aus Bottrop');
  assert.match(await p.locator('meta[name="description"]').getAttribute('content'),/Content und Publishing/);
  assert.equal(await p.locator('link[rel="canonical"]').getAttribute('href'),base+'/');
  assert.equal(await p.getByRole('main',{name:'DCPP Digital – Leistungen und Projekte'}).count(),1);
 }
 await p.locator('#dcpp-websites .dcpp-studio-more > summary').click();
 assert.equal(await p.locator('#dcpp-websites .dcpp-studio-more').evaluate(e=>e.open),true);
 await step('Webprojekte aufklappen');
 await p.locator('#dcpp-larosa-card').click();
 await p.locator('#dcpp-project-ristorante-pizzeria-la-rosa').waitFor({state:'visible'});
 await step('Projektkarte öffnen');
 await p.locator('#dcpp-project-ristorante-pizzeria-la-rosa a[href$="#larosabottrop"]').first().click();
 await p.locator('#lr-site').waitFor({state:'visible'});
 assert.equal(await p.locator('#lr-site').getAttribute('data-lr-ready'),'true');
 await p.locator('#lr-search').fill('Margherita');
 assert.match(await p.locator('#lr-results').innerText(),/Margherita/);
 await step('La Rosa Gerichtsuche');
 await p.locator('#lr-results [data-lr-add]:visible').first().click();
 assert.notEqual((await p.locator('#lr-cart-total').innerText()).trim(),'0,00 €');
 await step('La Rosa Bestellzettel');
 await p.locator('#lr-search').fill('');
 await p.locator('[data-lr-category="pasta"]').click();
 assert.ok((await p.locator('#lr-results').innerText()).length>100);
 await step('La Rosa Kategorie wechseln');
 await p.locator('#lr-load-map').click();
 assert.equal(await p.locator('#lr-map-panel iframe').count(),1);
 await p.locator('#lr-unload-map').click();
 assert.equal(await p.locator('#lr-map-panel iframe').count(),0);
 await step('La Rosa Karte laden und entfernen');
 await go('/#olympiabottrop');
 await p.locator('.oly-toggle').click();
 assert.equal(await p.locator('.oly-toggle').getAttribute('aria-expanded'),'true');
 await p.locator('.oly-toggle').click();
 assert.equal(await p.locator('.oly-toggle').getAttribute('aria-expanded'),'false');
 await step('Olympia mobiles Menü');
 await p.locator('[data-oly-filter="gyros"]').click();
 assert.equal(await p.locator('#oly-menu-results').evaluate(e=>e.open),true);
 await step('Olympia Speisekarte und Filter');
 await p.locator('#oly-load-map').click();
 assert.equal(await p.locator('#oly-map-panel iframe').count(),1);
 await p.locator('#oly-unload-map').click();
 assert.equal(await p.locator('#oly-map-panel iframe').count(),0);
 await step('Olympia Karte laden und entfernen');
 await go('/#sunnyxxl');
 await p.locator('.sx-menu-toggle').click();
 assert.equal(await p.locator('html').evaluate(e=>e.classList.contains('sx-menu-open')),true);
 await p.locator('.sx-menu-toggle').click();
 assert.equal(await p.locator('html').evaluate(e=>e.classList.contains('sx-menu-open')),false);
 await step('Sunny mobiles Menü');
 await go('/#dcpp-start');
 await p.locator('#dcpp-faq details').first().locator('summary').click();
 assert.equal(await p.locator('#dcpp-faq details').first().evaluate(e=>e.open),true);
 await step('FAQ aufklappen');
 await p.evaluate(()=>scrollTo(0,900));
 await p.locator('#dcpp-scroll-top').click();
 await p.waitForFunction(()=>window.scrollY<5,{timeout:5000});
 await step('Zurück zum Seitenanfang');
 await go('/about/');assert.match((await readState(p)).h1.join(' '),/Impressum/);await step('Impressum');
 await go('/j/privacy');assert.match((await readState(p)).h1.join(' '),/Datenschutzerklärung/);await step('Datenschutz');
 if(mode==='candidate'){
  for(const [url,target] of [['/%C3%BCber-uns/',base+'/'],['/kurse/',base+'/'],['/kontakt/',base+'/#dcpp-contact']]){
   await p.goto(base+url,{waitUntil:'domcontentloaded'}).catch(e=>{if(!/ERR_ABORTED|interrupted/.test(String(e)))throw e;});
   await p.waitForURL(target,{waitUntil:'domcontentloaded',timeout:10000});
   assert.equal(await p.title(),'DCPP Digital | Webdesign & App-Entwicklung aus Bottrop');
  }
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
 await c.close();return steps;
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.DCPP_CHROMIUM_EXECUTABLE||path.join(__dirname,'browser1148/chrome-linux/headless_shell'),headless:true,args:['--no-sandbox']});
 const a=await exercise(browser,'baseline'),b=await exercise(browser,'candidate');
 fs.writeFileSync(path.join(__dirname,'interaction-snapshots.json'),JSON.stringify({baseline:a,candidate:b},null,2)+'\n');
 assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i++){
  const x=structuredClone(a[i]),y=structuredClone(b[i]);
  // Scroll positions are deliberately excluded from state snapshots. Geometry,
  // text, visible links, control names and route classes are all compared.
  assert.deepEqual(y,x,'Interaction differs: '+x.name);
 }
 await browser.close();
 fs.writeFileSync(path.join(__dirname,'../INTERACTION-VALIDATION.json'),JSON.stringify({steps:a.length,modes:['baseline','candidate'],all_identical:true,validated:a.map(x=>x.name),additional_candidate_legacy_redirects:3,note:'Checkpoint scrolling is normalized to avoid timing-dependent floating-button visibility. Map frames are test fixtures; no live maps, bookings, purchases or phone calls were triggered.'},null,2)+'\n');
 console.log('INTERACTION_COMPARISON_PASSED '+a.length+' behaviors');
})().catch(e=>{console.error(e);process.exit(1)});
