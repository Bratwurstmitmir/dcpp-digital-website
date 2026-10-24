#!/usr/bin/env python3
"""Compile the dependency-free Pages worker with the exact route manifest."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
config = json.loads((root/'route-config.json').read_text())
source = (root/'worker-template.mjs').read_text()
(root/'site/_worker.js').write_text(source.replace('__DCPP_CONFIG__',json.dumps(config,ensure_ascii=False,separators=(',',':'))))
print('Compiled Pages worker:',len(config['pages']),'HTML/Markdown routes')
