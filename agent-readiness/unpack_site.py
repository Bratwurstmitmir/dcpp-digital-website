#!/usr/bin/env python3
"""Reconstruct the reviewed snapshot without third-party dependencies."""
import base64
import hashlib
import io
import json
import tarfile
from pathlib import Path

root=Path(__file__).resolve().parent
archive=root/'source-site.tar.gz.b64'
if archive.exists():
    raw=base64.b64decode(archive.read_bytes())
    expected=(root/'source-site.sha256').read_text().strip()
    if hashlib.sha256(raw).hexdigest()!=expected:raise SystemExit('Snapshot checksum mismatch')
    with tarfile.open(fileobj=io.BytesIO(raw),mode='r:gz') as tf:
        for entry in tf.getmembers():
            if not entry.name.startswith('site/') or not (entry.isfile() or entry.isdir()):raise SystemExit('Unexpected archive entry')
        tf.extractall(root,filter='data')
    print('Restored reviewed document snapshot')
elif not (root/'site/index.html').exists():
    raise SystemExit('Missing reviewed document snapshot')
