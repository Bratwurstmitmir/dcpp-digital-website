import hashlib
import json
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

root=Path(__file__).resolve().parent/'asset-cache'
root.mkdir(exist_ok=True)
url=sys.argv[1]
allowed={'u.jimcdn.com','fonts.bunny.net','fonts.gstatic.com','fonts.googleapis.com','assets.jimstatic.com'}
if urlsplit(url).hostname not in allowed:
    print(json.dumps({'error':'asset host outside snapshot allowlist'}));raise SystemExit(0)
key=hashlib.sha256(url.encode()).hexdigest();body=root/(key+'.body');meta=root/(key+'.json')
if body.exists() and meta.exists():print(meta.read_text());raise SystemExit(0)
try:
    request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'})
    with urllib.request.urlopen(request,timeout=18) as response:
        data=response.read();body.write_bytes(data)
        result={'path':str(body),'type':response.headers.get('Content-Type','application/octet-stream'),'bytes':len(data),'url':url,'status':response.status}
        meta.write_text(json.dumps(result));print(json.dumps(result))
except Exception as e:
    result={'error':type(e).__name__,'url':url};meta.write_text(json.dumps(result));print(json.dumps(result))
