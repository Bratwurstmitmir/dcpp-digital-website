#!/usr/bin/env python3
"""Validate independent content budgets, metadata, schemas and link targets."""
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parent
SITE=ROOT/'site'
config=json.loads((ROOT/'route-config.json').read_text())

class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=set();self.links=[];self.text=[];self.suppress=[];self.canonicals=[];self.lang=None;self.schema=[];self.schema_buffer=None;self.h1=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if attrs.get('id'):self.ids.add(attrs['id'])
        if tag=='html':self.lang=attrs.get('lang')
        if tag=='a' and attrs.get('href'):self.links.append(attrs['href'])
        if tag=='link' and attrs.get('rel')=='canonical':self.canonicals.append(attrs.get('href'))
        if tag=='h1':self.h1+=1
        if tag in ['script','style','noscript','template','svg']:self.suppress.append(tag)
        if tag=='script' and attrs.get('type')=='application/ld+json':self.schema_buffer=[]
    def handle_endtag(self,tag):
        if tag=='script' and self.schema_buffer is not None:
            self.schema.append(json.loads(''.join(self.schema_buffer)));self.schema_buffer=None
        if self.suppress and self.suppress[-1]==tag:self.suppress.pop()
    def handle_data(self,data):
        if self.schema_buffer is not None:self.schema_buffer.append(data)
        if not self.suppress:self.text.append(data)

documents={};metrics=[];errors=[]
for route,meta in config['pages'].items():
    path=SITE/route.lstrip('/')/'index.html'
    doc=Document();markup=path.read_text();doc.feed(markup);documents[route]=doc
    text=re.sub(r'\s+',' ',''.join(doc.text)).strip()
    if len(text)>=100000:errors.append(f'{route}: text exceeds 100k characters')
    if len(doc.canonicals)!=1 or doc.canonicals[0]!=config['domain']+route:errors.append(f'{route}: canonical mismatch')
    if doc.lang!='de-DE':errors.append(f'{route}: missing declared German language')
    if doc.h1!=1:errors.append(f'{route}: expected one page heading, found {doc.h1}')
    if route!='/sitemap/' and not doc.schema:errors.append(f'{route}: no valid JSON-LD')
    if 'Yoga-Begeisterter' in text or 'Yoga-Begeisterte' in text or 'Mind.' in text:errors.append(f'{route}: legacy Yoga template')
    if not (SITE/meta['markdown'].lstrip('/')).read_text().strip():errors.append(f'{route}: empty Markdown')
    metrics.append({'path':route,'text_characters':len(text),'html_bytes':path.stat().st_size,'h1':doc.h1})

link_count=0
for route,doc in documents.items():
    for href in doc.links:
        u=urlsplit(href)
        if u.scheme or u.netloc:continue
        link_count+=1
        path=unquote(u.path) or route
        if path not in documents:
            if not path.startswith('/assets/'):errors.append(f'{route}: missing page {href}')
        elif u.fragment and u.fragment not in documents[path].ids:errors.append(f'{route}: missing anchor {href}')

result={'pages':len(documents),'internal_links':link_count,'max_extracted_text_chars':max(m['text_characters'] for m in metrics),'errors':errors,'pages_measured':metrics,'browser_visual_qa':'pending; browser executable unavailable and cloud browser cannot reach localhost','deployment_status':'not deployed; existing Jimdo live site unchanged'}
(ROOT/'VALIDATION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
if errors:raise SystemExit('\n'.join(errors))
print(f'Validated {len(documents)} documents and {link_count} internal links; largest text: {result["max_extracted_text_chars"]:,} characters. No template remnants or broken internal links.')
