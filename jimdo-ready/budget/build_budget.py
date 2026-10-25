"""Move complete, normally hidden demo panels into an HTML-safe JSON data block.

This changes no business text, project case, link, CSS or existing script.
The complete original demo DOM is restored synchronously before DOMContentLoaded.
"""
from __future__ import annotations

from html.parser import HTMLParser
import json
from pathlib import Path
import re


class Panels(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.offsets = [0]
        self.offsets.extend(match.end() for match in re.finditer('\n', source))
        self.depth = 0
        self.current = None
        self.spans = []

    def source_position(self):
        row, col = self.getpos()
        return self.offsets[row - 1] + col

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'div':
            self.depth += 1
            if (attrs.get('id') or '').startswith('dcpp-microsite-'):
                if self.current:
                    raise ValueError('Nested demo panel roots are unsupported')
                self.current = (attrs['id'], self.source_position(), self.depth)
        if self.current and tag == 'script' and attrs.get('type') not in {'application/json', 'application/ld+json'}:
            raise ValueError('Executable scripts must not be moved into a data block')

    def handle_endtag(self, tag):
        if tag == 'div':
            if self.current and self.current[2] == self.depth:
                identifier, start, _ = self.current
                end = self.source.index('>', self.source_position()) + 1
                self.spans.append((identifier, start, end))
                self.current = None
            self.depth -= 1


def build(source, restore_script):
    if 'id="dcpp-panel-data"' in source:
        raise ValueError('The source is already a deferred-panel version')
    parser = Panels(source)
    parser.feed(source)
    if parser.current or not parser.spans:
        raise ValueError('Incomplete or missing panel roots')
    panels = [{'id': identifier, 'html': source[start:end]} for identifier, start, end in parser.spans]
    output = source
    for identifier, start, end in reversed(parser.spans):
        # A nonempty, explicitly hidden element survives HTML cleanup that may
        # remove empty spans. It disappears entirely during restoration.
        slot = '<div id="dcpp-panel-slot-' + identifier + '" data-dcpp-panel="' + identifier + '" hidden="hidden" aria-hidden="true" style="display:none!important">Projektansicht</div>'
        output = output[:start] + slot + output[end:]
    # No literal '<' reaches the HTML script parser, including nested data blocks.
    data = json.dumps(panels, ensure_ascii=False, separators=(',', ':'))
    data = data.replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e')
    data = data.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    output += '\n<script id="dcpp-panel-data" type="application/json">\n' + data + '\n</script>\n'
    output += '<script id="dcpp-panel-restore">\n/*<![CDATA[*/\n' + restore_script + '\n/*]]>*/\n</script>\n'
    output = output.replace('DCPP V6.7.14-AGENTIC', 'DCPP V6.7.15-INHALTSBUDGET', 1)
    return output, panels


if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    source_path = next((root / 'source').glob('*-HTML-*-1zu1.txt'))
    source = source_path.read_text()
    output, panels = build(source, (root / 'panel-restore.js').read_text())
    target = root / 'candidate/DCPP-Digital-HTML-V6.7.15-INHALTSBUDGET-1zu1.txt'
    target.write_text(output)
    (root / 'PANELS.json').write_text(json.dumps({'panels': [{'id': p['id'], 'characters': len(p['html'])} for p in panels], 'source_bytes': source_path.stat().st_size, 'candidate_bytes': target.stat().st_size}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'panels': len(panels), 'source_bytes': source_path.stat().st_size, 'candidate_bytes': target.stat().st_size}))
