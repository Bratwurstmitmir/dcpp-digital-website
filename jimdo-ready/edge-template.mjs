// Optional Workers Route in front of the existing Jimdo origin.
// No HTML content is rewritten and no site migration is performed.
const PAGES = __PAGES__;
const LLMS = __LLMS__;
const SITEMAP = __SITEMAP__;
const DOMAIN = 'https://www.dcpp-digital.de';
const HOSTS = new Set(['www.dcpp-digital.de','dcpp-digital.de']);
const LEGACY = {'/kurse':DOMAIN+'/','/kontakt':DOMAIN+'/#dcpp-contact','/über-uns':DOMAIN+'/'};

function quality(header,type){
 let q=0,specificity=-1;
 for(const part of (header||'*/*').toLowerCase().split(',')){
  const [media,...parameters]=part.trim().split(';');
  const rank=media===type?2:media===type.split('/')[0]+'/*'?1:media==='*/*'?0:-1;
  if(rank<0||rank<specificity)continue;
  const value=parameters.map(p=>p.trim()).find(p=>p.startsWith('q='));
  const parsed=value?Number(value.slice(2)):1;
  const current=Number.isFinite(parsed)&&parsed>=0&&parsed<=1?parsed:0;
  if(rank>specificity){q=current;specificity=rank;}else q=Math.max(q,current);
 }
 return q;
}
export function wantsMarkdown(header=''){
 return /(?:^|,)\s*text\/markdown(?:\s*;|\s*,|\s*$)/i.test(header)&&quality(header,'text/markdown')>0&&quality(header,'text/markdown')>=quality(header,'text/html');
}
function vary(headers){
 const values=(headers.get('Vary')||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(!values.some(x=>x.toLowerCase()==='accept')&&!values.includes('*'))values.push('Accept');
 headers.set('Vary',values.join(', '));
 return headers;
}
function mdHeaders(upstream,canonical){
 const headers=vary(new Headers(upstream?.headers));
 for(const name of ['Content-Length','Content-Encoding','Transfer-Encoding','ETag','Last-Modified','Content-Range','Accept-Ranges','Content-MD5','Digest','Content-Digest','Repr-Digest'])headers.delete(name);
 headers.set('Content-Type','text/markdown; charset=utf-8');
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Cache-Control','private, no-cache');
 if(canonical)headers.set('Link','<'+canonical+'>; rel="canonical"');
 return headers;
}
function markdownError(request,status,upstream){
 const missing=status===404;
 const body=(missing?'# Seite nicht gefunden\n\nDiese Adresse ist nicht verfügbar.':'# Seite vorübergehend nicht verfügbar\n\nDer Ursprung meldet einen Fehler. Bitte versuchen Sie es später erneut.')+' Über die [Startseite]('+DOMAIN+'/), die [Sitemap]('+DOMAIN+'/sitemap.xml) oder [llms.txt]('+DOMAIN+'/llms.txt) finden Sie Leistungen, Projekte und Kontakt.\n';
 const headers=mdHeaders(upstream);headers.set('Cache-Control','no-store');
 return new Response(request.method==='HEAD'?null:body,{status,headers});
}
function keyFor(url){
 const path=url.pathname.replace(/\/+$/,'')||'/';
 if(path==='/'&&url.searchParams.has('projekt'))return '?projekt='+url.searchParams.get('projekt');
 return path==='/about'?'/about/':path;
}

export function createHandler(originFetch=fetch){
 return async function handle(request,env={}){
  const url=new URL(request.url);
  if(!HOSTS.has(url.hostname))return new Response('This route is only configured for DCPP Digital.',{status:404});
  const enabled=env.AGENTIC_ENABLED==='1';
  const publicMethod=['GET','HEAD'].includes(request.method);
  const administrative=/^\/(?:app(?:\/|$)|login(?:\/|$)|logout(?:\/|$)|\.well-known\/acme-challenge(?:\/|$))/.test(url.pathname)||(/^\/j\//.test(url.pathname)&&!/^\/j\/privacy\/?$/.test(url.pathname));
  if(!enabled||!publicMethod||administrative||request.headers.has('Authorization'))return originFetch(request);
  let decodedPath;try{decodedPath=decodeURIComponent(url.pathname).replace(/\/+$/,'')||'/';}catch{decodedPath=url.pathname;}
  if(Object.hasOwn(LEGACY,decodedPath))return new Response(null,{status:301,headers:{Location:LEGACY[decodedPath],'Cache-Control':'public, max-age=300'}});
  if(url.pathname==='/sitemap.xml')return new Response(request.method==='HEAD'?null:SITEMAP,{status:200,headers:{'Content-Type':'application/xml; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300'}});
  if(['/llms.txt','/agent-instructions.md'].includes(url.pathname)){
   const markdown=url.pathname.endsWith('.md');
   const headers=new Headers({'Content-Type':markdown?'text/markdown; charset=utf-8':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300','Link':'<'+DOMAIN+url.pathname+'>; rel="canonical"'});
   return new Response(request.method==='HEAD'?null:LLMS,{status:200,headers});
  }
  const md=wantsMarkdown(request.headers.get('Accept')||'');
  let originRequest=new Request(request,{redirect:'manual'});
  if(md){
   const headers=new Headers(request.headers);
   for(const name of ['If-None-Match','If-Modified-Since','Range','If-Range'])headers.delete(name);
   originRequest=new Request(request,{headers,redirect:'manual'});
  }
  const upstream=await originFetch(originRequest);
  // Origin truth is retained: redirects, 404s and errors are never turned into
  // a successful canned homepage. All HTML bodies remain byte-for-byte intact.
  if(upstream.status>=300&&upstream.status<400)return upstream;
  const type=upstream.headers.get('Content-Type')||'';
  if(md&&upstream.status===404){await upstream.body?.cancel().catch(()=>{});return markdownError(request,404,upstream);}
  if(md&&upstream.status>=500){await upstream.body?.cancel().catch(()=>{});return markdownError(request,upstream.status,upstream);}
  const page=PAGES[keyFor(url)];
  if(md&&upstream.status===200&&/^text\/html(?:;|$)/i.test(type)&&page){
   await upstream.body?.cancel().catch(()=>{});
   return new Response(request.method==='HEAD'?null:page.markdown,{status:200,headers:mdHeaders(upstream,page.canonical)});
  }
  if(/^text\/(?:html|markdown)(?:;|$)/i.test(type)){
   const headers=vary(new Headers(upstream.headers));
   return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers});
  }
  return upstream;
 };
}
export default {fetch:createHandler()};
