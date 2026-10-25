"""Verify the complete local workerd output outside the two allowed removals."""
import json
from pathlib import Path
import subprocess
from lxml import html

root = Path(__file__).resolve().parent.parent
raw = subprocess.check_output(["node", "-e", "process.stdout.write(require('./audit/fixture_markup.cjs').markup('candidate'))"], cwd=root, text=True)
original = html.document_fromstring(raw)
for selector in ['//*[@id="dcpp-jimdo-page-content"]', '//*[@id="dcpp-jimdo-required"]//*[@data-container="navigation"]']:
    for element in original.xpath(selector):
        element.drop_tree()
transformed = html.document_fromstring((root / "audit/edge-cleaned-fixture.html").read_text())


def signature(element):
    if not isinstance(element.tag, str):
        return None
    return (element.tag, dict(element.attrib), element.text, element.tail,
            [item for child in element if (item := signature(child)) is not None])


assert signature(original) == signature(transformed), "Unexpected change outside the legacy wrappers"
result = {"fixture": "full V6.7.13 before/after actual local workerd HTMLRewriter",
          "comparison": "all element names, attributes, text, tails and child order",
          "intentional_removals": ["#dcpp-jimdo-page-content", '#dcpp-jimdo-required [data-container="navigation"]'],
          "all_other_dom_identical": True,
          "live_domain_integration": False}
(root / "LEGACY-CLEANUP-DOM-VALIDATION.json").write_text(json.dumps(result, indent=2) + "\n")
print("Complete DOM identical outside the exact two legacy containers.")
