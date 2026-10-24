// Pages advanced mode. Static content remains readable without JavaScript.
const config = __DCPP_CONFIG__;
const ERROR_MD = '# Seite nicht gefunden\n\nDiese Adresse ist nicht verfügbar. Bitte verwenden Sie die [Startseite](https://www.dcpp-digital.de/), die [Sitemap](https://www.dcpp-digital.de/sitemap/) oder [llms.txt](https://www.dcpp-digital.de/llms.txt), um Leistungen, Projekte und Kontakt zu finden.\n';
const ERROR_HTML = '<!doctype html><html lang="de-DE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Seite nicht gefunden – DCPP Digital</title></head><body><main><h1>Seite nicht gefunden</h1><p>Diese Adresse ist nicht verfügbar. Über die Startseite oder das Seitenverzeichnis finden Sie Leistungen, Projekte und Kontakt.</p><nav aria-label="Weiterführende Links"><a href="/">Startseite</a> · <a href="/sitemap/">Seitenverzeichnis</a> · <a href="/llms.txt">Informationen für Agenten</a></nav></main></body></html>';

function quality(accept, type) {
  const [major] = type.split('/');
  let quality = 0, specificity = -1;
  for (const item of (accept || '*/*').toLowerCase().split(',')) {
    const [media, ...params] = item.trim().split(';');
    const rank = media === type ? 2 : media === major + '/*' ? 1 : media === '*/*' ? 0 : -1;
    if (rank < 0 || rank < specificity) continue;
    const parameter = params.map(s => s.trim()).find(s => s.startsWith('q='));
    const parsed = parameter ? Number(parameter.slice(2)) : 1;
    const q = Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0;
    if (rank > specificity) { quality = q; specificity = rank; }
    else quality = Math.max(quality, q);
  }
  return quality;
}

export function wantsMarkdown(accept = '') {
  // Wildcards alone are never a request to replace the normal HTML document.
  return /(?:^|,)\s*text\/markdown(?:\s*;|\s*,|\s*$)/i.test(accept) &&
    quality(accept, 'text/markdown') > 0 &&
    quality(accept, 'text/markdown') >= quality(accept, 'text/html');
}

function publicMode(env, url) {
  return env.DCPP_PUBLIC === '1' && ['www.dcpp-digital.de', 'dcpp-digital.de'].includes(url.hostname);
}

function headersFor(markdown, robots, canonical) {
  const headers = new Headers({
    'Content-Type': markdown ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8',
    'Vary': 'Accept',
    'Cache-Control': 'public, max-age=60',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Robots-Tag': robots,
  });
  if (canonical) headers.set('Link', '<' + canonical + '>; rel="canonical"');
  return headers;
}

function failure(request, status = 404) {
  const md = wantsMarkdown(request.headers.get('Accept') || '');
  const body = status === 404 ? (md ? ERROR_MD : ERROR_HTML) :
    (md ? '# Anfrage derzeit nicht verfügbar\n\nBitte verwenden Sie die [Sitemap](https://www.dcpp-digital.de/sitemap/) oder versuchen Sie es später erneut.\n' :
      '<!doctype html><html lang="de"><title>Anfrage derzeit nicht verfügbar</title><main><h1>Anfrage derzeit nicht verfügbar</h1><a href="/sitemap/">Sitemap</a></main></html>');
  const headers = headersFor(md, 'noindex,follow');
  headers.set('Cache-Control', 'no-store');
  if (status === 405) headers.set('Allow', 'GET, HEAD');
  if (status === 503) headers.set('Retry-After', '60');
  return new Response(request.method === 'HEAD' ? null : body, { status, headers });
}

function redirect(request, target, status = 308) {
  return new Response(null, {status, headers: {'Location': new URL(target, request.url).href, 'Cache-Control':'public, max-age=300'}});
}

export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) return failure(request, 405);
    const url = new URL(request.url);
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { return failure(request); }
    const publicSite = publicMode(env, url);
    let pagePath = path === '/' ? '/' : path.replace(/\/+$/, '') + '/';
    const slug = url.searchParams.get('projekt');
    // Old public query URLs have a direct server-side recovery path.
    if (slug !== null && path === '/') {
      if (!Object.hasOwn(config.projectPaths, slug)) return failure(request);
      url.searchParams.delete('projekt');
      const search = url.searchParams.toString();
      const destination = config.projectPaths[slug] + (search ? '?' + search : '');
      return redirect(request, publicSite ? config.domain + destination : destination, 301);
    }
    if (Object.hasOwn(config.aliases, pagePath)) {
      const target = config.aliases[pagePath];
      return redirect(request, publicSite ? config.domain + target : target, 301);
    }
    if (path.endsWith('/index.html')) {
      const candidate = path.slice(0, -10);
      if (Object.hasOwn(config.pages, candidate)) return redirect(request, candidate, 301);
    }
    const page = config.pages[pagePath];
    if (page && (path !== pagePath || (publicSite && url.hostname !== 'www.dcpp-digital.de'))) {
      const target = pagePath + url.search;
      return redirect(request, publicSite ? config.domain + target : target);
    }
    if (page) {
      const md = wantsMarkdown(request.headers.get('Accept') || '');
      // Ask ASSETS for the normal canonical path; /index.html may otherwise
      // trigger Pages' clean-URL redirect rules.
      const assetPath = md ? page.markdown : pagePath;
      const asset = await env.ASSETS.fetch(new Request(url.origin + assetPath, {method:'GET'}));
      if (asset.status !== 200) return failure(request, 503);
      let body = await asset.text();
      if (!body.trim()) return failure(request, 503);
      if (!md && publicSite) body = body.replace(/(<meta\s+name="robots"\s+content=")[^"]*(")/i, '$1' + page.robots + '$2');
      const robots = publicSite ? page.robots : 'noindex,nofollow';
      return new Response(request.method === 'HEAD' ? null : body, {status:200, headers:headersFor(md, robots, config.domain + pagePath)});
    }
    const directPage = Object.values(config.pages).find(p => p.markdown === path);
    const directMarkdown = Boolean(directPage);
    const permittedAsset = path.startsWith('/assets/') || directMarkdown || ['/sitemap.xml', '/llms.txt', '/agent-instructions.md', '/robots.txt'].includes(path);
    if (!permittedAsset) return failure(request);
    const assetPath = path === '/robots.txt' && publicSite ? '/robots.production.txt' : path;
    const asset = await env.ASSETS.fetch(new Request(url.origin + assetPath, {method:'GET'}));
    if (asset.status !== 200) return failure(request);
    const headers = new Headers(asset.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Robots-Tag', publicSite ? (directPage?.robots || 'index,follow') : 'noindex,nofollow');
    if (directPage) headers.set('Link', '<' + config.domain + path.slice(0, -8) + '>; rel="canonical"');
    if (directMarkdown || path.endsWith('.md')) headers.set('Content-Type', 'text/markdown; charset=utf-8');
    if (path === '/llms.txt' || path === '/robots.txt') headers.set('Content-Type', 'text/plain; charset=utf-8');
    return new Response(request.method === 'HEAD' ? null : asset.body, {status:200,headers});
  },
};
