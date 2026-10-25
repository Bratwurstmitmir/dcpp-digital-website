import json
from pathlib import Path

root=Path(__file__).resolve().parent
source=(root/'edge-template.mjs').read_text()
pages=json.loads((root/'pages.json').read_text())
source=source.replace('__PAGES__',json.dumps(pages,ensure_ascii=False,separators=(',',':'))).replace('__LLMS__',json.dumps((root/'public/llms.txt').read_text(),ensure_ascii=False)).replace('__SITEMAP__',json.dumps((root/'public/sitemap.xml').read_text(),ensure_ascii=False))
(root/'edge-worker.mjs').write_text(source)
print('Compiled optional Jimdo-origin worker:',len(pages),'Markdown representations')
