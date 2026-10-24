// Runs the actual optional adapter, including Cloudflare's HTMLRewriter,
// in a local workerd process. No production deployment or origin request.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {Miniflare}=require('./tooling/node_modules/miniflare');
const {markup}=require('./fixture_markup.cjs');
const root=path.resolve(__dirname,'..');
async function main(){
 const fullFixture=process.env.DCPP_RUNTIME_SMALL_FIXTURE!=='1'&&fs.existsSync(path.join(root,'candidate'));
 const html=fullFixture?markup('candidate'):'<!doctype html><html lang="de"><head><title>DCPP Digital</title></head><body><main id="dcpp-home-content">DCPP Digital</main><div id="dcpp-jimdo-page-content"><div id="legacy-yoga-probe">Yoga-Rest</div></div><div id="dcpp-jimdo-required"><nav data-container="navigation">Alte Navigation</nav></div>'+['dcpp-project-blumen-boutique','dcpp-microsite-larosa','dcpp-microsite-olympia','dcpp-datenschutz-page','dcpp-impressum-page'].map(id=>'<section id="'+id+'">Unveränderter Inhalt</section>').join('')+'</body></html>';
 const production=fs.readFileSync(path.join(root,'edge-worker.mjs'),'utf8');
 const fixture=`
const FIXTURE=${JSON.stringify(html)};
const origin=async request=>{
 const url=new URL(request.url),missing=url.pathname==='/__missing/';
 return new Response(request.method==='HEAD'?null:FIXTURE,{status:missing?404:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache, no-store, must-revalidate','ETag':'"origin-test"','Vary':'Accept-Encoding','Content-Security-Policy':"default-src https: 'unsafe-inline'",'Set-Cookie':'__cf_bm=public-bot-cookie; Secure'}});
};
const handler=createHandler(origin);
export default {fetch(request,env){
 const url=new URL(request.url);
 return handler(request,{...env,AGENTIC_ENABLED:url.searchParams.has('audit_disabled')?'0':'1',CLEAN_LEGACY_HTML:url.searchParams.has('audit_noclean')?'0':'1'});
}};
`;
 const script=production.replace('export default {fetch:createHandler()};',fixture);
 assert.notEqual(script,production);
 const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-07-30'});
 const results=[];
 try{
  const request=(p='/',accept='text/html',extra={})=>mf.dispatchFetch('https://www.dcpp-digital.de'+p,{headers:{Accept:accept,...extra}});
  const normal=await request('/?audit_noclean=1');
  assert.equal(await normal.text(),html);assert.match(normal.headers.get('Vary'),/Accept/);
  results.push({case:'HTML without cleanup is byte-identical',passed:true});
  const cleaned=await request('/');const body=await cleaned.text();
  assert.ok(!body.includes('<div id="dcpp-jimdo-page-content">'));
  assert.ok(!body.includes('legacy-yoga-probe'));
  assert.ok(!body.includes('<nav data-container="navigation">'));
  for(const id of ['dcpp-home-content','dcpp-project-blumen-boutique','dcpp-microsite-larosa','dcpp-microsite-olympia','dcpp-datenschutz-page','dcpp-impressum-page'])assert.ok(body.includes('id="'+id+'"'),id);
  assert.equal(cleaned.headers.get('ETag'),null);assert.match(cleaned.headers.get('Cache-Control'),/no-store/);assert.equal(cleaned.headers.get('Content-Security-Policy'),"default-src https: 'unsafe-inline'");
  fs.writeFileSync(path.join(__dirname,'edge-cleaned-fixture.html'),body);
  results.push({case:'native HTMLRewriter removes only the two legacy containers',passed:true,removed_bytes:Buffer.byteLength(html)-Buffer.byteLength(body)});
  for(const target of ['/about/','/j/privacy','/unmapped/']){
   const r=await request(target);assert.equal(await r.text(),html,target);
  }
  results.push({case:'legal and unknown pages retain their complete origin HTML',passed:true});
  for(const [target,headers] of [['/?audit_disabled=1',{}],['/?cmsEdit=1',{}],['/',{Cookie:'session=private'}]]){
   const r=await request(target,'text/html',headers);assert.equal(await r.text(),html);assert.equal(r.headers.get('Vary'),'Accept-Encoding');
  }
  results.push({case:'disabled, editor and session requests bypass the adapter',passed:true});
  const markdown=await request('/','text/markdown');assert.equal(markdown.status,200);assert.match(markdown.headers.get('Content-Type'),/^text\/markdown/);assert.match(markdown.headers.get('Vary'),/Accept/);assert.match(await markdown.text(),/^# DCPP Digital/);
  results.push({case:'canonical homepage negotiates actual Markdown',passed:true});
  const missing=await request('/__missing/','text/markdown');assert.equal(missing.status,404);assert.match(missing.headers.get('Content-Type'),/^text\/markdown/);assert.match(await missing.text(),/\[llms\.txt\]/);
  results.push({case:'real 404 produces a Markdown recovery body',passed:true});
  const head=await mf.dispatchFetch('https://www.dcpp-digital.de/',{method:'HEAD',headers:{Accept:'text/markdown'}});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.match(head.headers.get('Content-Type'),/^text\/markdown/);
  results.push({case:'HEAD negotiates metadata without a response body',passed:true});
 }finally{await mf.dispose();}
 const output={runtime:'Cloudflare workerd via Miniflare 4.20260730.0',compatibility_date_tested:'2026-07-30',production_compatibility_date:'2026-07-30',fixture:fullFixture?'complete V6.7.13 Jimdo layout':'small CI fixture with exact legacy and protected IDs',integration:'local fixture only; no real Jimdo domain, DNS or account deployment',results};
 fs.writeFileSync(path.join(root,fullFixture?'WORKER-RUNTIME-VALIDATION.json':'WORKER-CI-FIXTURE-VALIDATION.json'),JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify(output,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
