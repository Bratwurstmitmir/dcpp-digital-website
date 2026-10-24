const fs=require('fs'),path=require('path'),util=require('util'),cp=require('child_process');
const execFile=util.promisify(cp.execFile);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'..');
const sourcePath=kind=>path.join(root,'source',fs.readdirSync(path.join(root,'source')).find(f=>f.includes('-'+kind+'-')));
const candidatePath=kind=>path.join(root,'candidate',fs.readdirSync(path.join(root,'candidate')).find(f=>f.includes('-'+kind+'-')));
const inputs=Object.fromEntries(['baseline','candidate'].map(mode=>[mode,Object.fromEntries(['HTML','CSS','HEAD'].map(kind=>[kind,fs.readFileSync(mode==='baseline'?sourcePath(kind):candidatePath(kind),'utf8')]))]));
const paths=['/','/?projekt=blumen-boutique','/?projekt=3x3-home-fit','/?projekt=sunny-xxl-dogge','/?projekt=familienkreis','/?projekt=hey-malle','/?projekt=release-buddy','/?projekt=bottroper-doener-pizza','/?projekt=bratwurst-mit-mir','/?projekt=kochheld','/?projekt=ristorante-pizzeria-la-rosa','/?projekt=olympia-bottrop','/?projekt=digital-publishing','/#3x3homefit','/#sunnyxxl','/#familienkreis','/#heymalle','/#releasebuddy','/#bottroperdoener','/#bratwurstmitmir','/#Kochheld','/#larosabottrop','/#olympiabottrop','/#digitalpublishing','/about/','/j/privacy'];
const shotPaths=new Set(['/','/?projekt=blumen-boutique','/?projekt=digital-publishing','/#larosabottrop','/#olympiabottrop','/#sunnyxxl','/j/privacy']);
const assets=new Map(),failures=[];let active=0;const queue=[];
async function gate(fn){if(active>=8)await new Promise(r=>queue.push(r));active++;try{return await fn();}finally{active--;queue.shift()?.();}}
async function fetchAsset(url){
 if(!assets.has(url))assets.set(url,gate(async()=>{
  const {stdout}=await execFile('python',[path.join(__dirname,'fetch_asset.py'),url],{maxBuffer:4096});return JSON.parse(stdout);
 }));
 return assets.get(url);
}
function markup(mode){
 const v=inputs[mode];let body=v.HTML.replace(/<var>navigation<\/var>/g,'<nav data-container="navigation"><a href="/kurse/">Kurse</a></nav>').replace(/<var>(?:sidebar|footer)<\/var>/g,'').replace(/<var>content<\/var>/g,'<div id="legacy-yoga-probe"><h1>Mind.</h1><p>Yoga-Begeisterte und Kurse: ungenutzter nativer Jimdo-Inhalt.</p></div>');
 return '<!doctype html><html lang="de-DE"><head><meta charset="utf-8"><title>Webdesign, Apps &amp; Publishing aus Bottrop - DCPP Digital</title>'+v.HEAD+'<style>'+v.CSS+'</style></head><body><div id="cc-inner" class="cc-content-parent">'+body+'</div></body></html>';
}
async function context(browser,mode,width){
 const c=await browser.newContext({viewport:{width,height:900},locale:'de-DE',timezoneId:'Europe/Berlin',reducedMotion:'reduce'});
 await c.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname==='www.dcpp-digital.de')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:markup(mode)});
  if(['image','font','stylesheet'].includes(request.resourceType())){
   try{const asset=await fetchAsset(request.url());if(asset.path)return route.fulfill({status:200,contentType:asset.type,body:fs.readFileSync(asset.path)});failures.push(asset);}catch(e){failures.push({error:String(e),url:request.url()});}
   return route.fulfill({status:404,contentType:'text/plain',body:'Asset unavailable in audit fixture'});
  }
  return route.fulfill({status:200,contentType:'text/plain',body:''});
 });
 return c;
}
async function readState(page){
 return page.evaluate(()=>{
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  return {h1:[...document.querySelectorAll('h1')].filter(visible).map(e=>normalize(e.textContent)),text:normalize(document.body.innerText),width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,classes:document.documentElement.className.split(/\s+/).sort(),links:[...document.querySelectorAll('a[href]')].filter(visible).map(e=>({text:normalize(e.textContent||e.getAttribute('aria-label')||''),href:e.getAttribute('href')})),controls:[...document.querySelectorAll('button,summary,input,select')].filter(visible).map(e=>({tag:e.tagName,id:e.id,text:normalize(e.textContent||e.getAttribute('aria-label')||''),type:e.getAttribute('type')})),legacyPresent:!!document.getElementById('legacy-yoga-probe')};
 });
}
function checkEqual(a,b,label){if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('Rendered state changed: '+label);}
async function main(){
 fs.mkdirSync(path.join(__dirname,'screens'),{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.DCPP_CHROMIUM_EXECUTABLE||path.join(__dirname,'browser1148/chrome-linux/headless_shell'),headless:true,args:['--no-sandbox']});
 const results=[];let screenshots=0;const pageErrors=[];
 for(const width of [1440,390]){
  const baseline=await context(browser,'baseline',width),candidate=await context(browser,'candidate',width);
  const a=await baseline.newPage(),b=await candidate.newPage();
  for(const [p,mode] of [[a,'baseline'],[b,'candidate']]){p.on('pageerror',e=>pageErrors.push({mode,error:e.message}));await p.clock.setFixedTime(new Date('2026-10-24T18:00:00Z'));}
  for(let i=0;i<paths.length;i++){
   const target=paths[i];
   for(const p of [a,b]){
    await p.goto('https://www.dcpp-digital.de'+target,{waitUntil:'domcontentloaded'});
    await p.waitForLoadState('networkidle',{timeout:30000});
    await p.evaluate(()=>document.fonts.ready);
   }
   const x=await readState(a),y=await readState(b);checkEqual(x,y,target+' at '+width);
   if(!x.h1.length)throw new Error('No visible main heading: '+target);
   if(y.width>width+1)throw new Error('Horizontal overflow: '+target+' at '+width+' ('+y.width+')');
   if(shotPaths.has(target)){
    const name=width+'-'+String(i).padStart(2,'0');
    for(const [p,mode] of [[a,'baseline'],[b,'candidate']])await p.screenshot({path:path.join(__dirname,'screens',name+'-'+mode+'.png'),animations:'disabled',fullPage:target==='/?projekt=digital-publishing'});
    screenshots++;
   }
   results.push({path:target,width,visible_heading:y.h1.join(' | '),height:y.height,links:y.links.length,controls:y.controls.length,identical:true});
   process.stdout.write(JSON.stringify({checked:results.length,path:target,width})+'\n');
  }
  await baseline.close();await candidate.close();
 }
 await browser.close();
 const output={source:'V6.7.12',candidate:'V6.7.13 AGENTIC Prüffassung',browser:'Chromium 131.0.6778.33',fixture:'isolated full Jimdo-layout snapshot; public assets downloaded with normal TLS validation and fulfilled from a local cache',routes:paths.length,viewports:[1440,390],comparisons:results.length,screenshot_pairs:screenshots,page_errors:pageErrors,asset_failures:[...new Map(failures.map(f=>[f.url,f])).values()],results};
 fs.writeFileSync(path.join(root,'BROWSER-VALIDATION.json'),JSON.stringify(output,null,2)+'\n');
 if(pageErrors.length)throw new Error('JavaScript page errors: '+JSON.stringify(pageErrors));
 console.log('BROWSER_COMPARISON_PASSED '+JSON.stringify({comparisons:results.length,screenshot_pairs:screenshots,asset_failures:output.asset_failures.length}));
}
module.exports={context,readState};
if(require.main===module)main().catch(e=>{console.error(e);process.exit(1)});
