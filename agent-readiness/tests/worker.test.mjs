import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import worker,{wantsMarkdown} from '../site/_worker.js';
import {assets} from '../preview.mjs';

const config=JSON.parse(await fs.readFile(new URL('../route-config.json',import.meta.url),'utf8'));
const request=(path='/',accept='text/html',env={},method='GET')=>worker.fetch(new Request('https://www.dcpp-digital.de'+path,{method,headers:{Accept:accept}}),{ASSETS:assets,...env});

test('HTML and Markdown are actual distinct nonempty representations',async()=>{
 for(const path of Object.keys(config.pages)){
  const html=await request(path,'text/html'); const md=await request(path,'text/markdown');
  assert.equal(html.status,200,path);assert.equal(md.status,200,path);
  assert.match(html.headers.get('Content-Type'),/^text\/html/);assert.match(md.headers.get('Content-Type'),/^text\/markdown/);
  assert.match(html.headers.get('Vary'),/Accept/);assert.match(md.headers.get('Vary'),/Accept/);
  assert.match(await html.text(),/<!doctype html>/i);const body=await md.text();assert.ok(body.length>100,path);assert.doesNotMatch(body,/<html|<!doctype/i);
 }
});
test('404 keeps status, explains error in Markdown and links to a recovery page',async()=>{
 const res=await request('/__missing_20261024/','text/markdown');
 assert.equal(res.status,404);assert.match(res.headers.get('Content-Type'),/^text\/markdown/);assert.match(res.headers.get('Vary'),/Accept/);
 const body=await res.text();assert.ok(body.length>=20);assert.match(body,/\]\(https:\/\/www\.dcpp-digital\.de\/(sitemap\/|llms\.txt)\)/);
 assert.equal((await request('/__missing_20261024/','text/html')).status,404);
 assert.equal((await request('/?projekt=nonexistent','text/html')).status,404);
});
test('content negotiation honors explicit q=0 and normal browser preferences',()=>{
 assert.equal(wantsMarkdown('text/markdown'),true);
 assert.equal(wantsMarkdown('text/markdown; charset=utf-8'),true);
 assert.equal(wantsMarkdown('*/*'),false);
 assert.equal(wantsMarkdown('text/html,application/xhtml+xml,*/*;q=0.8'),false);
 assert.equal(wantsMarkdown('text/markdown;q=0,text/html'),false);
 assert.equal(wantsMarkdown('text/markdown;q=0.3,text/html;q=0.9'),false);
 assert.equal(wantsMarkdown('text/markdown,text/html;q=0.1'),true);
 assert.equal(wantsMarkdown('text/markdown;q=0.3,*/*;q=1'),false);
});
test('preview is always noindex, production only opens on the actual domain',async()=>{
 const preview=await request('/');assert.equal(preview.headers.get('X-Robots-Tag'),'noindex,nofollow');
 const live=await request('/','text/html',{DCPP_PUBLIC:'1'});assert.match(live.headers.get('X-Robots-Tag'),/^index/);assert.doesNotMatch(await live.text(),/name="robots" content="noindex,nofollow"/);
 const foreign=await worker.fetch(new Request('https://preview.example/'),{ASSETS:assets,DCPP_PUBLIC:'1'});assert.equal(foreign.headers.get('X-Robots-Tag'),'noindex,nofollow');
 const concept=await request('/projekte/olympia-bottrop/ansehen/','text/html',{DCPP_PUBLIC:'1'});assert.match(concept.headers.get('X-Robots-Tag'),/^noindex/);
 const direct=await request('/projekte/olympia-bottrop/ansehen/index.md','text/markdown',{DCPP_PUBLIC:'1'});assert.match(direct.headers.get('X-Robots-Tag'),/^noindex/);
 assert.match(await (await request('/robots.txt')).text(),/Disallow: \/\n/);
 assert.match(await (await request('/robots.txt','text/plain',{DCPP_PUBLIC:'1'})).text(),/Allow: \/\nSitemap:/);
});
test('legacy query and template paths recover through server redirects',async()=>{
 for(const [slug,path] of Object.entries(config.projectPaths)){
  const r=await request('/?projekt='+slug);assert.equal(r.status,301);assert.equal(r.headers.get('Location'),'https://www.dcpp-digital.de'+path);
 }
 const courses=await request('/kurse/');assert.equal(courses.status,301);assert.equal(courses.headers.get('Location'),'https://www.dcpp-digital.de/');
 const alias=await request('/über-uns/');assert.equal(alias.status,301);
});
test('HEAD preserves representation headers without sending a body',async()=>{
 const r=await request('/','text/markdown',{},'HEAD');assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/^text\/markdown/);assert.equal(await r.text(),'');
 const missing=await request('/missing','text/markdown',{},'HEAD');assert.equal(missing.status,404);assert.equal(await missing.text(),'');
});
test('missing assets fail as recoverable errors, not a soft 404',async()=>{
 const broken={ASSETS:{fetch:async()=>new Response('missing',{status:404})}};
 const res=await worker.fetch(new Request('https://www.dcpp-digital.de/',{headers:{Accept:'text/markdown'}}),broken);assert.equal(res.status,503);assert.match(res.headers.get('Content-Type'),/^text\/markdown/);
 assert.equal((await request('/assets/absent.css')).status,404);
 const post=await request('/','text/markdown',{},'POST');assert.equal(post.status,405);assert.equal(post.headers.get('Allow'),'GET, HEAD');
});
