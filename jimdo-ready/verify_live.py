"""Read-only GET checks for the actual DCPP domain; never computes a score."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET

HOSTS = {"dcpp-digital.de", "www.dcpp-digital.de"}
UA = "DCPP-Digital-Agentic-Acceptance/1.0"
LIMIT = 4 * 1024 * 1024


class SiteRedirects(HTTPRedirectHandler):
    def __init__(self):
        self.hops = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urlsplit(newurl)
        if target.scheme != "https" or target.hostname not in HOSTS:
            raise URLError("Unexpected redirect outside the HTTPS DCPP hosts")
        if len(self.hops) >= 5:
            raise URLError("Too many redirects")
        self.hops.append({"status": code, "url": newurl})
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(url, accept):
    redirects = SiteRedirects()
    request = Request(url, headers={"User-Agent": UA, "Accept": accept})
    try:
        try:
            response = build_opener(redirects).open(request, timeout=25)
        except HTTPError as error:
            response = error  # A real 404 is evidence, not a transport failure.
        with response:
            body = response.read(LIMIT + 1)
            if len(body) > LIMIT:
                raise ValueError("Response exceeds the 4 MiB inspection limit")
            charset = response.headers.get_content_charset() or "utf-8"
            return {"url": response.url, "status": response.status,
                    "headers": {k.lower(): v for k, v in response.headers.items()
                                if k.lower() not in {"set-cookie"}},
                    "body": body.decode(charset, errors="replace"),
                    "bytes": len(body), "redirects": redirects.hops}
    except (OSError, URLError, ValueError) as error:
        return {"url": url, "error": str(error), "redirects": redirects.hops}


def markdown_ok(response, status=200, recovery=False):
    headers = response.get("headers", {})
    body = response.get("body", "").strip()
    mime = headers.get("content-type", "").split(";", 1)[0].strip().lower()
    varies = {v.strip().lower() for v in headers.get("vary", "").split(",")}
    is_text = len(body) >= 20 and not re.search(r"<(?:!doctype|html|body)\b", body, re.I)
    link = not recovery or bool(re.search(r"\]\(https://(?:www\.)?dcpp-digital\.de/(?:llms\.txt|sitemap\.xml|docs)(?:[)#/])", body))
    return response.get("status") == status and mime == "text/markdown" and "accept" in varies and is_text and link


class PageText(HTMLParser):
    """Conservative text estimate: includes CSS-hidden route panels, ignores code."""
    SKIP = {"script", "style", "template", "noscript", "svg"}
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.chunks, self.titles, self.native = [], [], [], []
        self.canonicals, self.descriptions = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        inherited_skip = self.stack[-1][1] if self.stack else False
        inherited_native = self.stack[-1][2] if self.stack else False
        skip = inherited_skip or tag in self.SKIP
        native = inherited_native or attrs.get("id") == "dcpp-jimdo-page-content"
        if tag == "link" and "canonical" in attrs.get("rel", "").split():
            self.canonicals.append(attrs.get("href", ""))
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.descriptions.append(attrs.get("content", ""))
        if tag not in self.VOID:
            self.stack.append((tag, skip, native))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        if self.stack and self.stack[-1][1]:
            return
        self.chunks.append(data)
        if any(node[0] == "title" for node in self.stack):
            self.titles.append(data)
        if self.stack and self.stack[-1][2]:
            self.native.append(data)


def evaluate(responses):
    checks = []
    def add(key, ok, detail):
        checks.append({"id": key, "passed": bool(ok), "detail": detail})
    homepage = responses["html"]
    headers, body = homepage.get("headers", {}), homepage.get("body", "")
    add("html-homepage", homepage.get("status") == 200 and headers.get("content-type", "").lower().startswith("text/html") and "DCPP Digital" in body, "Homepage must return useful HTML with status 200.")
    add("markdown-negotiation", markdown_ok(responses["markdown"]), "GET on the same homepage must return Markdown, 200, and Vary: Accept.")
    add("html-vary", "accept" in {x.strip().lower() for x in headers.get("vary", "").split(",")}, "HTML must also declare Vary: Accept.")
    add("markdown-404", markdown_ok(responses["missing_md"], 404, True), "The missing path must retain 404 and return Markdown with a recovery link.")
    add("html-404", responses["missing_html"].get("status") == 404, "The missing path must retain 404 for ordinary HTML requests.")
    instructions = responses["llms"]
    add("agent-instructions", instructions.get("status") == 200 and instructions.get("headers", {}).get("content-type", "").lower().startswith(("text/plain", "text/markdown")) and bool(re.search(r"When to use|Wann .*passend", instructions.get("body", ""), re.I)), "llms.txt must contain actual when-to-use guidance as text.")
    sitemap = responses["sitemap"]
    urls = []
    try:
        xml = ET.fromstring(sitemap.get("body", ""))
        urls = [node.text or "" for node in xml.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    except ET.ParseError:
        pass
    add("clean-sitemap", sitemap.get("status") == 200 and len(urls) >= 14 and all(urlsplit(u).hostname in HOSTS for u in urls) and not any(unquote(urlsplit(u).path).rstrip("/") in {"/kurse", "/kontakt", "/über-uns"} for u in urls), f"Expected root, 12 current project queries and imprint; found {len(urls)} URLs.")
    parser = PageText()
    parser.feed(body)
    title = re.sub(r"\s+", " ", "".join(parser.titles)).strip()
    text = re.sub(r"\s+", " ", " ".join(parser.chunks)).strip()
    add("native-title", "DCPP Digital" in title and bool(re.search(r"App[ -]Entwicklung", title, re.I)), "First-response title: " + title)
    add("html-text-budget", len(text) < 100000, f"Conservative extracted HTML text: {len(text)} characters; this is not an Ora token measurement.")
    add("native-template-cleanup", not re.search(r"Yoga|Mind\.", " ".join(parser.native), re.I), "Old native Yoga content must be absent in the initial response.")
    add("canonical", len(parser.canonicals) == 1 and parser.canonicals[0].rstrip("/") == "https://www.dcpp-digital.de", "Homepage canonical: " + repr(parser.canonicals))
    for name, target in [("legacy_courses", "/"), ("legacy_about", "/"), ("legacy_contact", "/#dcpp-contact")]:
        response = responses[name]
        first = response.get("redirects", [])[:1]
        add(name, bool(first) and first[0]["status"] == 301 and first[0]["url"] == "https://www.dcpp-digital.de" + target, "Expected an immediate 301 to https://www.dcpp-digital.de" + target)
    return {"kind": "read-only HTTP acceptance; not an Is-Agentic score", "checks": checks,
            "passed": sum(x["passed"] for x in checks), "total": len(checks),
            "html_extracted_characters": len(text), "native_yoga_detected": bool(re.search(r"Yoga|Mind\.", " ".join(parser.native), re.I)),
            "responses": {name: {k: v for k, v in response.items() if k not in {"body", "headers"}} | {"content_type": response.get("headers", {}).get("content-type"), "vary": response.get("headers", {}).get("vary")} for name, response in responses.items()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="https://dcpp-digital.de/")
    parser.add_argument("--json", type=Path, help="Optional local result file")
    args = parser.parse_args()
    parsed = urlsplit(args.base)
    if parsed.scheme != "https" or parsed.hostname not in HOSTS or parsed.username or parsed.password or parsed.port not in {None, 443} or parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        parser.error("Use only the HTTPS root of dcpp-digital.de or www.dcpp-digital.de")
    base = args.base.rstrip("/") + "/"
    cases = {"html": ("", "text/html"), "markdown": ("", "text/markdown"),
             "missing_md": ("__dcpp_agentic_acceptance_missing_20261024/", "text/markdown"),
             "missing_html": ("__dcpp_agentic_acceptance_missing_20261024/", "text/html"),
             "llms": ("llms.txt", "text/plain"), "sitemap": ("sitemap.xml", "application/xml"),
             "legacy_courses": ("kurse/", "text/html"), "legacy_about": ("%C3%BCber-uns/", "text/html"),
             "legacy_contact": ("kontakt/", "text/html")}
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {name: pool.submit(fetch, urljoin(base, path), accept) for name, (path, accept) in cases.items()}
        responses = {name: future.result() for name, future in futures.items()}
    result = evaluate(responses) | {"checked_at_utc": datetime.now(timezone.utc).isoformat(), "base_url": base}
    if args.json:
        args.json.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    for check in result["checks"]:
        print(("PASS " if check["passed"] else "OPEN ") + check["id"] + ": " + check["detail"])
    print(f"HTTP acceptance: {result['passed']}/{result['total']}. No score calculated and no scan started.")
    return 0 if result["passed"] == result["total"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
