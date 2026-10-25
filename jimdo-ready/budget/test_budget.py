import json
import unittest
from build_budget import build


class BudgetTests(unittest.TestCase):
    def test_main_content_stays_plain_html_and_panel_is_exactly_recoverable(self):
        panel = '<div id="dcpp-microsite-demo"><div><h1>Demo</h1></div></div>'
        source = '<main><h1>DCPP Digital</h1><a href="/#demo">Öffnen</a></main>' + panel
        result, data = build(source, '(function(){})();')
        self.assertIn('<main><h1>DCPP Digital</h1>', result)
        self.assertNotIn('<h1>Demo</h1>', result)
        self.assertEqual(data, [{'id': 'dcpp-microsite-demo', 'html': panel}])

    def test_original_panel_order_and_nesting_survive(self):
        a = '<div id="dcpp-microsite-one"><div>A</div></div>'
        b = '<div id="dcpp-microsite-two"><div>B</div></div>'
        result, data = build(a + '<footer>F</footer>' + b, '')
        self.assertEqual([p['html'] for p in data], [a, b])
        self.assertLess(result.index('data-dcpp-panel="dcpp-microsite-one"'), result.index('<footer>'))
        self.assertLess(result.index('<footer>'), result.index('data-dcpp-panel="dcpp-microsite-two"'))

    def test_script_closing_sequences_are_safe_inside_the_serialized_data(self):
        source = '<div id="dcpp-microsite-demo"><p title="</script>">A &amp; B</p></div>'
        result, data = build(source, '')
        raw = result.split('type="application/json">\n', 1)[1].split('\n</script>', 1)[0]
        self.assertNotIn('<', raw)
        self.assertNotIn('>', raw)
        self.assertNotIn('&', raw)
        self.assertEqual(json.loads(raw), data)

    def test_executable_scripts_in_panels_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Executable scripts'):
            build('<div id="dcpp-microsite-demo"><script>window.action()</script></div>', '')

    def test_inert_menu_data_is_preserved(self):
        source = '<div id="dcpp-microsite-demo"><script type="application/json">{"menu":[1,2]}</script></div>'
        result, data = build(source, '')
        self.assertEqual(data[0]['html'], source)
        self.assertIn('dcpp-panel-data', result)

    def test_double_application_and_incomplete_markup_are_rejected(self):
        for source in ['<script id="dcpp-panel-data"></script>', '<div id="dcpp-microsite-demo">unfinished']:
            with self.assertRaises(ValueError):
                build(source, '')

    def test_selective_packaging_keeps_publishing_and_other_panels_as_html(self):
        app = '<div id="dcpp-microsite-app"><h1>App</h1></div>'
        publishing = '<div id="dcpp-microsite-publishing"><a href="https://example.org/book">Buch</a></div>'
        result, data = build(app + publishing, '', {'dcpp-microsite-app'})
        self.assertEqual([p['id'] for p in data], ['dcpp-microsite-app'])
        self.assertIn(publishing, result)
        with self.assertRaisesRegex(ValueError, 'selected panel'):
            build(app, '', {'dcpp-microsite-missing'})


if __name__ == '__main__':
    unittest.main()
