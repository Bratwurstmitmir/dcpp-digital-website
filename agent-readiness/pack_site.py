#!/usr/bin/env python3
"""Persist edits to the expanded, reviewable HTML/Markdown/assets snapshot."""
import base64
import gzip
import hashlib
import io
import tarfile
from pathlib import Path

root=Path(__file__).resolve().parent
buffer=io.BytesIO()
with tarfile.open(fileobj=buffer,mode='w') as archive:
    for path in sorted((root/'site').rglob('*')):
        if not path.is_file() or path.name=='_worker.js':continue
        entry=archive.gettarinfo(str(path),str(path.relative_to(root)))
        entry.uid=entry.gid=0;entry.uname=entry.gname='';entry.mtime=0
        with path.open('rb') as source:archive.addfile(entry,source)
raw=gzip.compress(buffer.getvalue(),compresslevel=9,mtime=0)
(root/'source-site.tar.gz.b64').write_bytes(base64.encodebytes(raw))
(root/'source-site.sha256').write_text(hashlib.sha256(raw).hexdigest()+'\n')
print('Saved reviewed snapshot:',len(raw),'bytes compressed')
