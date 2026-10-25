import unittest
from verify_live import PageText, markdown_ok


class AcceptanceTests(unittest.TestCase):
    def response(self, **changes):
        return {"status": 200, "headers": {"content-type": "text/markdown; charset=utf-8", "vary": "Accept-Encoding, Accept"}, "body": "# DCPP Digital\n\nVerständliche Leistungsbeschreibung.\n"} | changes

    def test_status_and_mime_without_markdown_body_do_not_pass(self):
        self.assertFalse(markdown_ok(self.response(body="")))
        self.assertFalse(markdown_ok(self.response(body="<!doctype html><html>Long HTML response</html>")))
        self.assertFalse(markdown_ok(self.response(status=404)))

    def test_vary_is_required_and_case_insensitive(self):
        self.assertTrue(markdown_ok(self.response()))
        self.assertTrue(markdown_ok(self.response(headers={"content-type": "TEXT/MARKDOWN", "vary": "ACCEPT"})))
        self.assertFalse(markdown_ok(self.response(headers={"content-type": "text/markdown", "vary": "Accept-Encoding"})))

    def test_markdown_error_needs_real_404_and_a_recovery_link(self):
        recovery = "# Nicht gefunden\n\nDiese Seite fehlt. [Sitemap](https://www.dcpp-digital.de/sitemap.xml)"
        self.assertTrue(markdown_ok(self.response(status=404, body=recovery), 404, True))
        self.assertFalse(markdown_ok(self.response(body=recovery), 404, True))
        self.assertFalse(markdown_ok(self.response(status=404), 404, True))

    def test_text_budget_ignores_code_but_counts_hidden_route_text(self):
        parser = PageText()
        parser.feed('<main>Website</main><style>css</style><script>js</script><svg>icon</svg><template>template</template><div hidden>Projekttext</div>')
        self.assertEqual(parser.chunks, ["Website", "Projekttext"])

    def test_native_content_is_scoped_to_exact_legacy_wrapper(self):
        parser = PageText()
        parser.feed('<p>Live content</p><div id="dcpp-jimdo-page-content"><h1>Mind.</h1><p>Yoga</p></div><footer>Footer</footer>')
        self.assertEqual(parser.native, ["Mind.", "Yoga"])

    def test_void_and_self_closing_nodes_do_not_hide_later_content(self):
        parser = PageText()
        parser.feed('<head><meta name="description" content="DCPP"/><link rel="canonical" href="https://www.dcpp-digital.de/"/></head><body>A<br/>B<script>x</script>C</body>')
        self.assertEqual(parser.chunks, ["A", "B", "C"])
        self.assertEqual(parser.canonicals, ["https://www.dcpp-digital.de/"])


if __name__ == "__main__":
    unittest.main()
