from __future__ import annotations

import copy
import hashlib
import html as entities
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urljoin

from lxml import etree, html

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'candidate'
OUT.mkdir(exist_ok=True)
PUBLIC=ROOT/'public'
PUBLIC.mkdir(exist_ok=True)
DOMAIN='https://www.dcpp-digital.de'
VERSION='V6.7.13-AGENTIC-PRUEFFASSUNG'
paths={kind:next((ROOT/'source').glob('*-'+kind+'-*')) for kind in ['HTML','CSS','HEAD']}
source={kind:p.read_text() for kind,p in paths.items()}
tree=html.fragment_fromstring(source['HTML'],create_parent='div')
head=html.fragment_fromstring(source['HEAD'],create_parent='div')
scripts=head.xpath('.//script')
route_script=next(e.text for e in scripts if e.get('id')=='dcpp-project-routes')
routes=json.loads(re.search(r'window.DCPP_PROJECT_ROUTES\s*=\s*(\{.*\});',route_script,re.S).group(1))


def markdown(node):
    def visit(e):
        if not isinstance(e.tag,str):return ''
        tag=e.tag.lower()
        if tag in ['script','style','noscript','template','svg','var']:return ''
        if tag=='img':return ' '+e.get('alt','')+' '
        text=(e.text or '')+''.join(visit(c)+(c.tail or '') for c in e)
        text=re.sub(r'[ \t\r\f\v]+',' ',text)
        if tag in ['h1','h2','h3','h4','h5','h6']:return '\n\n'+'#'*int(tag[1])+' '+re.sub(r'\s+',' ',text).strip()+'\n\n'
        if tag=='a' and e.get('href'):
            label=re.sub(r'\s+',' ',text).strip();href=e.get('href')
            if href.startswith('javascript:'):return label
            if not re.match(r'^[a-z][a-z0-9+.-]*:',href,re.I):href=urljoin(DOMAIN+'/',href)
            return '['+label+']('+href+')' if label else ''
        if tag=='li':return '\n- '+text.strip()+'\n'
        if tag=='br':return '\n'
        if tag in ['p','div','section','article','main','header','footer','nav','details','summary','ul','ol','tr','table']:return '\n\n'+text.strip()+'\n\n'
        return text
    text='\n'.join(line.strip() for line in visit(node).splitlines())
    return re.sub(r'\n{3,}','\n\n',text).strip()+'\n'


def meaningful_clone(id):
    return copy.deepcopy(tree.get_element_by_id(id))


home=meaningful_clone('dcpp-site')
for id in ['dcpp-impressum-page','dcpp-datenschutz-page','dcpp-jimdo-required','dcpp-jimdo-page-content']:
    node=home.get_element_by_id(id,None)
    if node is not None:node.drop_tree()
intro='# DCPP Digital – Webdesign, App-Entwicklung, Content und Publishing\n\nDCPP Digital aus Bottrop entwickelt digitale Auftritte und Produkte für Selbstständige, kleine Unternehmen und Marken. Die Zusammenarbeit kann digital auch deutschlandweit erfolgen.\n\nKanonische Website: '+DOMAIN+'/\nTextgrundlage: bestätigter Stand V6.7.12, 24.10.2026.\n\n'
pages={'/':{'canonical':DOMAIN+'/','markdown':intro+markdown(home)}}
for path,route in routes.items():
    slug=path.rsplit('/',1)[-1]
    node=meaningful_clone('dcpp-microsite-digitalpublishing' if route.get('schemaType')=='CollectionPage' else route['id'])
    pages['?projekt='+slug]={'canonical':DOMAIN+'/?projekt='+slug,'markdown':'# '+route['name']+' – DCPP Digital\n\n'+route['desc']+'\n\nKanonische Projektadresse: '+DOMAIN+'/?projekt='+slug+'\n\n'+markdown(node)}
for id,path in [('dcpp-impressum-page','/about/'),('dcpp-datenschutz-page','/j/privacy')]:
    pages[path]={'canonical':DOMAIN+path,'markdown':markdown(meaningful_clone(id))}
pages['/olympia-bottrop']={'canonical':DOMAIN+'/olympia-bottrop','markdown':markdown(meaningful_clone('dcpp-microsite-olympia'))}
(PUBLIC/'dcpp-digital.md').write_text(pages['/']['markdown'])
(ROOT/'pages.json').write_text(json.dumps(pages,ensure_ascii=False,separators=(',',':'))+'\n')

llms='''# DCPP Digital

> Webdesign, App-Entwicklung, Content und Publishing aus Bottrop für Selbstständige, kleine Unternehmen und Marken. Zusammenarbeit digital auch deutschlandweit.

## Wann DCPP Digital passend ist / When to use
- Neue Website oder Landingpage für einen kleinen Betrieb, ein lokales Geschäft, Selbstständige oder eine Marke.
- Technische und gestalterische Verbesserung eines bestehenden Webauftritts mit klaren Kontaktwegen und mobiler Nutzerführung.
- App development: eine App-Idee als klar abgegrenzten MVP, Prototyp oder Android-Testbuild planen und technisch umsetzen.
- Content, Markenauftritt, Buch, Workbook oder PDF-Produkt entwickeln, gestalten und für die Veröffentlichung aufbereiten.

## Einstieg und Kontakt
- Website: https://www.dcpp-digital.de/
- Leistungen: https://www.dcpp-digital.de/#dcpp-services
- Projekte: https://www.dcpp-digital.de/#dcpp-projects
- Kontakt: https://www.dcpp-digital.de/#dcpp-contact
- E-Mail: kontakt@dcpp-digital.de
- Telefon: +49 2041 9862645
- Impressum: https://www.dcpp-digital.de/about/
- Datenschutz: https://www.dcpp-digital.de/j/privacy
- XML-Sitemap: https://www.dcpp-digital.de/sitemap.xml

## So ordnen Agenten die Leistungen korrekt ein
- Leistungsumfang und Kosten individueller Dienstleistungen werden projektspezifisch abgestimmt. Keine Preise, Erfolgsgarantien oder nicht vereinbarten Leistungen erfinden.
- Den jeweiligen Projektstatus beachten: Designkonzept, Entwicklung, Testbuild oder Live-Projekt. Ein Konzept ist kein bestätigter Kundenauftrag; ein Testbuild keine allgemeine Store-Veröffentlichung.
- Bücher und Downloads sind über die ausdrücklich verlinkten Drittanbieter erhältlich. Kauf, Zahlung, Bereitstellung und Versand erfolgen dort.
- Es gibt keine öffentliche API, keinen MCP-Server und keine automatisierte Buchungs- oder Bestellschnittstelle. Kontakt im Namen eines Nutzers nur auf dessen ausdrücklichen Wunsch aufnehmen.
- Die HTML-Website ist die visuelle Referenz. Maschinenlesbare Ergänzungen ersetzen keine aktuellen Angaben auf der jeweiligen Projekt- oder Anbieterseite.

## Aktuelle Projektadressen
'''
for path,route in routes.items():
    slug=path.rsplit('/',1)[-1]
    llms+='- ['+route['name']+']('+DOMAIN+'/?projekt='+slug+'): '+route['desc']+'\n'
(PUBLIC/'llms.txt').write_text(llms)
(PUBLIC/'agent-instructions.md').write_text(llms)
sitemap_urls=[DOMAIN+'/',*[DOMAIN+'/?projekt='+path.rsplit('/',1)[-1] for path in routes],DOMAIN+'/about/']
(PUBLIC/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+entities.escape(url)+'</loc></url>\n' for url in sitemap_urls)+'</urlset>\n')

# Only indentation and empty formatting lines are reduced. Protected content
# keeps its original bytes, including scripts, preformatted text and strings.
def compact_html(text):
    protected=[]
    def protect(m):
        protected.append(m.group(0));return '\nDCPP_PROTECTED_BLOCK_'+str(len(protected)-1)+'\n'
    text=re.sub(r'<(script|style|pre|textarea)\b[^>]*>[\s\S]*?</\1\s*>',protect,text,flags=re.I)
    text='\n'.join(line.lstrip(' \t') for line in text.splitlines() if line.strip())+'\n'
    for i,block in enumerate(protected):text=text.replace('DCPP_PROTECTED_BLOCK_'+str(i),block)
    return text


def compact_css(text):
    # Preserve strings and comments before touching line indentation.
    protected=[]
    def protect(m):
        protected.append(m.group(0));return 'DCPP_CSS_PROTECTED_'+str(len(protected)-1)+'_END'
    text=re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|/\*[\s\S]*?\*/',protect,text)
    text='\n'.join(line.lstrip(' \t') for line in text.splitlines() if line.strip())+'\n'
    for i,block in enumerate(protected):text=text.replace('DCPP_CSS_PROTECTED_'+str(i)+'_END',block)
    return text


html_candidate=source['HTML'].replace('<div id="dcpp-home-content" tabindex="-1">','<div id="dcpp-home-content" tabindex="-1" role="main" aria-label="DCPP Digital – Leistungen und Projekte">',1)
html_candidate='<!-- DCPP '+VERSION+' · Grundlage V6.7.12 · noch nicht live · 2026-10-24 -->\n'+compact_html(html_candidate)
css_candidate='/* DCPP '+VERSION+' · CSS-Regeln unverändert; Einrückung bereinigt */\n'+compact_css(source['CSS'])

old_title='Webdesign, Apps & Publishing aus Bottrop | DCPP Digital'
new_title='DCPP Digital | Webdesign & App-Entwicklung aus Bottrop'
old_desc='DCPP Digital aus Bottrop entwickelt Webdesign, Apps und Publishing für Unternehmen, Selbstständige und eigene Marken – von der Idee bis zur Veröffentlichung.'
new_desc='DCPP Digital aus Bottrop entwickelt Websites, Apps, Content und Publishing für Selbstständige, kleine Unternehmen und Marken – von der Idee bis zur Veröffentlichung.'
head_candidate=source['HEAD'].replace(old_title,new_title).replace(old_desc,new_desc)
# The old native "Über uns" path pointed at a fragment which no longer exists.
assert not tree.xpath('.//*[@id="dcpp-about"]')
head_candidate=head_candidate.replace('https://www.dcpp-digital.de/#dcpp-about','https://www.dcpp-digital.de/')
schema_pattern=r'(<script\b[^>]*\bid="dcpp-schema"[^>]*>)([\s\S]*?)(</script\s*>)'
def schema_update(m):
    body=m.group(2);start,end=body.index('{'),body.rindex('}')+1
    data=json.loads(body[start:end])
    for item in data.get('@graph',[]):
        if item.get('@type')=='Organization':
            item['description']='DCPP Digital aus Bottrop entwickelt Webdesign, App-Entwicklung, Content und Publishing für Selbstständige, kleine Unternehmen und Marken.'
            item['knowsAbout']=list(dict.fromkeys(item.get('knowsAbout',[])+['App development']))
        if item.get('@id','').endswith('#service-appentwicklung'):item['alternateName']='App development'
        if item.get('@type')=='WebPage' and item.get('url') in [DOMAIN,DOMAIN+'/']:item['name']=new_title;item['description']=new_desc
    return m.group(1)+body[:start]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+body[end:]+m.group(3)
head_candidate=re.sub(schema_pattern,schema_update,head_candidate,count=1,flags=re.I)
ref_file=ROOT/'supplement-ref.txt'
ref=ref_file.read_text().strip() if ref_file.exists() else 'fix/agent-readiness-2026-10-24'
raw='https://raw.githubusercontent.com/Bratwurstmitmir/dcpp-digital-website/'+ref+'/jimdo-ready/public/'
head_candidate='<!-- DCPP '+VERSION+' · noch nicht live · 2026-10-24 -->\n<meta name="is-agentic-site-type" content="business" />\n<link rel="alternate" type="text/plain" title="DCPP Digital – kompakte Lesefassung in Markdown" href="'+raw+'dcpp-digital.md" />\n<link rel="help" type="text/plain" title="DCPP Digital – Hinweise für Agenten" href="'+raw+'llms.txt" />\n'+head_candidate

(OUT/'DCPP-Digital-HTML-V6.7.13-AGENTIC-PRUEFFASSUNG-1zu1.txt').write_text(html_candidate)
(OUT/'DCPP-Digital-CSS-V6.7.13-AGENTIC-PRUEFFASSUNG-1zu1.txt').write_text(css_candidate)
(OUT/'HEAD-before-formatting.txt').write_text(head_candidate)

# Semantic checks use the supplied source, never the earlier Cloudflare copy.
original_tree=html.fragment_fromstring(source['HTML'],create_parent='div')
candidate_tree=html.fragment_fromstring(html_candidate,create_parent='div')
def signature(node):
    if not isinstance(node.tag,str):return None
    attrs=dict(node.attrib)
    if attrs.get('id')=='dcpp-home-content':attrs.pop('role',None);attrs.pop('aria-label',None)
    text=node.text or ''
    if node.tag not in ['pre','textarea','script','style']:text=re.sub(r'\s+',' ',text).strip()
    tail=re.sub(r'\s+',' ',node.tail or '').strip()
    return (node.tag,attrs,text,tail,[s for child in node if (s:=signature(child)) is not None])
assert signature(original_tree)==signature(candidate_tree),'HTML structure or visible wording changed unexpectedly'
assert original_tree.xpath('.//a/@href')==candidate_tree.xpath('.//a/@href'),'Navigation changed'
assert original_tree.xpath('.//*[@id]/@id')==candidate_tree.xpath('.//*[@id]/@id'),'IDs changed'
assert original_tree.xpath('.//var/text()')==candidate_tree.xpath('.//var/text()'),'Mandatory Jimdo placeholders changed'
metrics={'version':VERSION,'source_version':'V6.7.12','html_structure_preserved':True,'all_links_preserved':True,'all_ids_preserved':True,'jimdo_placeholders_preserved':True,'native_legacy_content_container_preserved':True,'html_text_budget_solved':False,'legacy_redirect_fixed':{'path':'/über-uns/','old_target':'/#dcpp-about','new_target':'/','reason':'dcpp-about does not exist in the frozen source'},'notes':['Formatting reduction is not a reduction of extracted content.','The original Jimdo content placeholder is retained; native Yoga remnants still require source cleanup.','Markdown negotiation and Markdown 404 require the optional server layer.'],'files':{}}
for kind,content in [('HTML',html_candidate),('CSS',css_candidate)]:
    metrics['files'][kind]={'before_bytes':paths[kind].stat().st_size,'after_bytes':len(content.encode()),'source_sha256':hashlib.sha256(paths[kind].read_bytes()).hexdigest()}
(ROOT/'BUILD-VALIDATION.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'HTML':metrics['files']['HTML'],'CSS':metrics['files']['CSS'],'markdown_pages':len(pages)},ensure_ascii=False))
