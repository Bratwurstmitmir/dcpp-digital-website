import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHandler,wantsMarkdown} from './edge-worker.mjs';

const PAGES=JSON.parse(await fs.readFile(new URL('./pages.json',import.meta.url),'utf8'));
const req=(path='/',accept='text/html',method='GET',extra={})=>new Request('https://www.dcpp-digital.de'+path,{method,headers:{Accept:accept,...extra}});
const ENV={AGENTIC_ENABLED:'1'};
const bytes=new Uint8Array([60,104,116,109,108,62,0,195,164,60,47,104,116,109,108,62]);
const origin=()=>new Response(bytes,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Content-Encoding':'identity','ETag':'"origin-html"','Vary':'Accept-Encoding','Set-Cookie':'example=public; Secure; SameSite=Lax','Content-Security-Policy':"default-src 'self'"}});

test('disabled worker passes the exact request and response through',async()=>{
 const request=req('/');const original=origin();let received;
 const result=await createHandler(async r=>(received=r,original))(request,{AGENTIC_ENABLED:'0'});
 assert.equal(received,request);assert.equal(result,original);
});
test('HTML body, status and existing response controls remain unchanged',async()=>{
 const result=await createHandler(async()=>origin())(req('/'),ENV);
 assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes);
 assert.equal(result.status,200);assert.equal(result.headers.get('ETag'),'"origin-html"');assert.equal(result.headers.get('Set-Cookie'),'example=public; Secure; SameSite=Lax');assert.equal(result.headers.get('Content-Security-Policy'),"default-src 'self'");assert.equal(result.headers.get('Vary'),'Accept-Encoding, Accept');
});
test('all prepared public pages negotiate a nonempty Markdown body',async()=>{
 const handler=createHandler(async()=>origin());
 for(const [key,page] of Object.entries(PAGES)){
  const path=key.startsWith('?')?'/'+key:key;
  const result=await handler(req(path,'text/markdown'),ENV);
  assert.equal(result.status,200,key);assert.match(result.headers.get('Content-Type'),/^text\/markdown/);assert.match(result.headers.get('Vary'),/Accept/);assert.equal(await result.text(),page.markdown);assert.ok(page.markdown.length>100);assert.ok(page.markdown.length<100000);
  assert.equal(result.headers.get('Content-Encoding'),null);assert.equal(result.headers.get('ETag'),null);assert.equal(result.headers.get('Content-Length'),null);assert.equal(result.headers.get('Content-Security-Policy'),"default-src 'self'");
 }
});
test('real 404 remains 404 with a Markdown recovery message',async()=>{
 const handler=createHandler(async()=>new Response('Jimdo 404',{status:404,headers:{'Content-Type':'text/html','ETag':'"404-html"'}}));
 const result=await handler(req('/__missing/','text/markdown'),ENV);
 assert.equal(result.status,404);assert.match(result.headers.get('Content-Type'),/^text\/markdown/);const body=await result.text();assert.ok(body.length>=20);assert.match(body,/\]\(https:\/\/www\.dcpp-digital\.de\/(?:sitemap\.xml|llms\.txt)\)/);
 const html=await handler(req('/__missing/'),ENV);assert.equal(html.status,404);assert.equal(await html.text(),'Jimdo 404');
});
test('unknown URLs do not acquire a false successful homepage',async()=>{
 const handler=createHandler(async()=>new Response('origin detail',{status:200,headers:{'Content-Type':'text/html'}}));
 const result=await handler(req('/unknown-but-origin-valid/','text/markdown'),ENV);assert.equal(await result.text(),'origin detail');assert.match(result.headers.get('Content-Type'),/^text\/html/);
 const redirect=new Response(null,{status:301,headers:{Location:'https://www.dcpp-digital.de/'}});
 assert.equal(await createHandler(async()=>redirect)(req('/','text/markdown'),ENV),redirect);
});
test('the instructions endpoint is real text with concrete when-to-use guidance',async()=>{
 let calls=0;const handler=createHandler(async()=>{calls++;return origin();});
 for(const path of ['/llms.txt','/agent-instructions.md']){const r=await handler(req(path,'text/plain'),ENV);assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/^text\/(?:plain|markdown)/);assert.match(await r.text(),/When to use/);}
 assert.equal(calls,0);
});
test('POST, sign-in, administration and authorization requests pass unchanged',async()=>{
 for(const request of [req('/','text/markdown','POST'),req('/login','text/markdown'),req('/app/settings','text/markdown'),req('/j/config','text/markdown'),req('/','text/markdown','GET',{Authorization:'Bearer test-only'})]){
  const response=origin();let seen;const r=await createHandler(async q=>(seen=q,response))(request,ENV);assert.equal(seen,request);assert.equal(r,response);
 }
});
test('HTML conditional headers stay, Markdown conditionals do not leak variants',async()=>{
 const seen=[];const handler=createHandler(async r=>(seen.push(r),origin()));
 await handler(req('/','text/markdown','GET',{'If-None-Match':'"html"','If-Modified-Since':'Wed, 21 Oct 2026 00:00:00 GMT',Range:'bytes=0-20','If-Range':'"html"'}),ENV);
 assert.equal(seen[0].headers.get('If-None-Match'),null);assert.equal(seen[0].headers.get('Range'),null);
 await handler(req('/','text/html','GET',{'If-None-Match':'"html"'}),ENV);assert.equal(seen[1].headers.get('If-None-Match'),'"html"');
});
test('HEAD sends no Markdown body; origin errors retain their status',async()=>{
 const handler=createHandler(async()=>origin());const h=await handler(req('/','text/markdown','HEAD'),ENV);assert.equal(h.status,200);assert.equal(await h.text(),'');assert.match(h.headers.get('Content-Type'),/^text\/markdown/);
 const down=await createHandler(async()=>new Response('down',{status:503,headers:{'Content-Type':'text/html'}}))(req('/','text/markdown'),ENV);assert.equal(down.status,503);assert.match(await down.text(),/vorübergehend/);
});
test('content negotiation honors normal browsers, quality values and q=0',()=>{
 assert.equal(wantsMarkdown('text/markdown'),true);assert.equal(wantsMarkdown('*/*'),false);assert.equal(wantsMarkdown('text/html,application/xhtml+xml,*/*;q=0.8'),false);assert.equal(wantsMarkdown('text/markdown;q=0,text/html'),false);assert.equal(wantsMarkdown('text/markdown;q=0.5,text/html;q=1'),false);assert.equal(wantsMarkdown('text/markdown;q=0.5,text/html;q=0'),true);
});
test('the adapter is not a general-purpose external proxy',async()=>{
 let called=false;const result=await createHandler(async()=>{called=true;return origin();})(new Request('https://other.example/'),ENV);assert.equal(result.status,404);assert.equal(called,false);
});
test('old template paths have explicit server redirects to existing DCPP targets',async()=>{
 let calls=0;const handler=createHandler(async()=>{calls++;return origin();});
 for(const [path,target] of [['/kurse/','/'],['/kontakt/','/#dcpp-contact'],['/%C3%BCber-uns/','/']]){
  const response=await handler(req(path,'text/markdown'),ENV);assert.equal(response.status,301);assert.equal(response.headers.get('Location'),'https://www.dcpp-digital.de'+target);
 }
 assert.equal(calls,0);
});
test('clean sitemap advertises current query projects and excludes legacy templates',async()=>{
 const response=await createHandler(async()=>origin())(req('/sitemap.xml','application/xml'),ENV);assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/^application\/xml/);
 const xml=await response.text();assert.match(xml,/<loc>https:\/\/www\.dcpp-digital\.de\/\?projekt=3x3-home-fit<\/loc>/);assert.doesNotMatch(xml,/\/kurse\/|\/kontakt\/|\/über-uns\/|\/projekte\//);assert.equal((xml.match(/<url>/g)||[]).length,14);
});
