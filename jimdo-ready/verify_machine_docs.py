import json
import xml.etree.ElementTree as ET
from pathlib import Path

root=Path(__file__).resolve().parent
pages=json.loads((root/'pages.json').read_text())
assert len(pages)==16
assert pages['/']['markdown']==(root/'public/dcpp-digital.md').read_text()
assert all(100<len(p['markdown'])<100000 for p in pages.values())
assert all(p['canonical'].startswith('https://www.dcpp-digital.de/') for p in pages.values())
assert 'Yoga-Begeisterte' not in pages['/']['markdown']
assert 'When to use' in (root/'public/llms.txt').read_text()
urls=[node.text for node in ET.fromstring((root/'public/sitemap.xml').read_text()).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==14 and len(set(urls))==14
assert not any('/kurse/' in url or '/über-uns/' in url or '/kontakt/' in url or '/projekte/' in url for url in urls)
assert all(url=='https://www.dcpp-digital.de/' or url=='https://www.dcpp-digital.de/about/' or url.split('?',1)[-1].startswith('projekt=') for url in urls)
print('Validated 16 compact Markdown representations, agent guidance and 14 sitemap URLs.')
