# DCPP Digital – Agentenfähigkeit: geprüfter Änderungsvorschlag

Stand: 24.10.2026. **Noch nicht auf dcpp-digital.de veröffentlicht.** Der öffentliche Is-Agentic-Bericht zeigt weiterhin 75/100 vom 24.10.2026, 19:29 Uhr MESZ. Ein neuer Score wird erst nach Aktivierung auf derselben Hauptdomain aussagekräftig.

Diese Ergänzung arbeitet unabhängig von der älteren Cloudflare-Vorschau im Repository. Der bestehende Build am Repository-Stamm, die Jimdo-Seite und die `.com`-Studio/Lab-Planung werden dadurch nicht umgestellt. Die Auslieferung auf der Hauptdomain ist ein eigener, noch offener Hosting-Schritt.

## Was konkret vorbereitet ist

- 25 Inhaltsseiten und ein Seitenverzeichnis, jeweils als vollständiges HTML und echtes Markdown.
- Startseite, Projektfälle, Projektansichten und Rechtstexte stehen in getrennten Dokumenten. Die Restaurantkarten und sämtliche anderen Microsites werden nicht mehr auf jeder Seite mitgeliefert.
- Startseite: rund 11.900 extrahierte Textzeichen statt rund 119.800. Größte Projektansicht: rund 18.000 Textzeichen. Rohes HTML der Startseite: rund 57 KB statt 1.049 KB. Diese Messgrößen sind getrennt ausgewiesen; Tokens werden nicht aus der Größe des HTML abgeleitet.
- Yoga-Inhalte entstehen über Jimdos `<var>content</var>`-Bereich. Dieser Bereich und die alten Vorlagen-Navigationspfade werden nicht in die getrennten Dokumente übernommen. Das aktuelle Design wird aus den gelieferten HTML-/CSS-Dateien übernommen.
- HTTP-Verhandlung an derselben URL: `Accept: text/markdown` liefert Markdown, `Accept: text/html` liefert HTML. Beide Antworten erhalten `Vary: Accept`.
- Echte 404-Antworten in beiden Formaten, mit verständlicher Erklärung und Links zu Sitemap und `llms.txt`.
- `llms.txt`, konkrete When-to-use-Hinweise und `agent-instructions.md`; keine erfundene API oder Buchungsschnittstelle.
- Seitenspezifische Canonicals, Sprache, Open Graph, JSON-LD und Sitemap. Titel der Hauptseite nennt DCPP Digital, Webdesign und App-Entwicklung in Bottrop ausdrücklich.
- Alte `?projekt=`-Adressen und überholte Jimdo-Pfade werden serverseitig weitergeleitet. Alte Microsite-Hashes werden zur entsprechenden echten Seite geführt. Neue interne Links sind ohne JavaScript lesbar.
- Vorschauen bleiben standardmäßig `noindex,nofollow`. Restaurant-Designkonzepte La Rosa und Olympia bleiben auch im vorbereiteten öffentlichen Modus `noindex,follow`; die eigentlichen DCPP-Projektfälle sind indexierbar.

## Dateien und lokale Prüfung

Die einzelnen Dokumente und Assets liegen unter `site/`. `worker-template.mjs` und `route-config.json` enthalten die HTTP-Logik und erlaubten Seiten. `compile_worker.py` baut daraus die einzelne Cloudflare-Pages-Datei `site/_worker.js`. Node.js 20+ und Python 3.12+ reichen; zur Nutzung und Prüfung sind keine Paketinstallationen erforderlich.

```sh
sh agent-readiness/build.sh
node --test agent-readiness/tests/worker.test.mjs
python3 agent-readiness/verify.py
node agent-readiness/preview.mjs
```

Die Vorschau läuft anschließend lokal auf `http://localhost:4173`. Der Build verändert die ältere Vorschau unter `dist/` nicht.

Die Archivierung folgt dem bereits im Repository verwendeten Vorgehen. Nach dem Build lassen sich die einzelnen Dateien unter `site/` normal lesen und bearbeiten. Änderungen an diesen Dokumenten mit `python3 agent-readiness/pack_site.py` ins versionierte Archiv übernehmen und erneut prüfen; Änderungen an Routen bzw. der HTTP-Logik werden in `route-config.json` und `worker-template.mjs` gepflegt.

`VALIDATION.json` enthält die Dokumentmessungen und Linkprüfung. Die lokalen HTTP-Tests decken alle 26 Routen, Statuscodes, beide Formate, HEAD, Fehlersituationen, Weiterleitungen, Cache-Trennung und die Indexierungssperre für Vorschauen ab. **Eine visuelle Browserabnahme und eine Prüfung in der echten Cloudflare-Laufzeit stehen noch aus.** Die verfügbare Browserumgebung konnte die lokale Vorschau nicht erreichen; daraus wird kein visueller Erfolg abgeleitet.

## Aktivierung: der noch erforderliche Schritt

Ein HEAD-Snippet in Jimdo kann weder `Content-Type` noch den HTTP-Status einer Antwort festlegen. Die beiden wesentlichen Markdown-Lücken brauchen deshalb eine kontrollierbare Server- oder Edge-Schicht vor bzw. an der Hauptdomain. Dieses Paket liefert eine mögliche Implementierung für Cloudflare Pages; es ist kein automatisch freigegebener Anbieterwechsel und kein neuer Live-Auftritt.

1. Zunächst ausschließlich eine separate, nicht indexierbare Hosting-Vorschau mit diesem Branch bauen. Cloudflare: Framework `None`, Build `sh agent-readiness/build.sh`, Ausgabeverzeichnis `agent-readiness/site`. `DCPP_PUBLIC` dabei nicht setzen.
2. Mobil/Desktop, Menüs, Aufklappbereiche, alle Projektansichten, Anbieterlinks und Kontaktwege abnehmen. Insbesondere die übernommenen Bild-/Download-Links werden weiterhin von ihren bisherigen Anbietern ausgeliefert. Externe Ziele sind nicht durch den internen Linktest abgedeckt.
3. Für eine spätere Auslieferung auf `.de` muss der konkrete Hostingweg feststehen. Bei einem Anbieterwechsel die übernommenen Datenschutztexte an die tatsächlich eingesetzten Dienste anpassen. Das Paket übernimmt die aktuellen Rechtstexte als Ausgangsstand und bescheinigt keine Rechtskonformität für eine neue Hostingumgebung. Domain-E-Mail, MX und DKIM sind kein Bestandteil dieser Änderung.
4. Erst auf dem bestätigten Hauptdomain-Ziel `DCPP_PUBLIC=1` setzen. Der Worker gibt Indexierung nur für `www.dcpp-digital.de` bzw. die entsprechende Weiterleitung von `dcpp-digital.de` frei. Unbekannte Vorschauhosts bleiben gesperrt. Die Sitemap lässt reine Restaurant-Konzeptansichten aus.
5. Auf der Live-Domain die folgenden Abrufe und anschließend einen neuen Is-Agentic-Scan prüfen. Die Marke muss außerdem für die tatsächlich bemängelte Suche **`DCPP Digital app development`** erscheinen. Titel, Inhalte und strukturierte Daten unterstützen das; Suchindex und Ranking lassen sich nicht technisch erzwingen.

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://dcpp-digital.de/
curl -sS -L -i -H 'Accept: text/html' https://dcpp-digital.de/
curl -sS -L -i -H 'Accept: text/markdown' https://dcpp-digital.de/__agent_readiness_missing_20261024/
curl -sS -L -i https://dcpp-digital.de/llms.txt
```

Erwartet: 200 Markdown + `Vary: Accept`; 200 HTML + `Vary: Accept`; 404 Markdown mit Rückweg; 200 Textdatei mit nutzbaren Agentenhinweisen. Nur die Prüfung der Header genügt nicht: Der jeweilige Antwortinhalt muss zum Format passen.

## Grenzen des Ergebnisses

100/100 ist ein Ziel und kein bestätigter Istzustand. Der bereitgestellte API-Bericht enthält gegenüber dem kopierten Ausschnitt zusätzlich den fehlenden Agentenhinweis und listet 9 statt 8 empfohlene Prüfungen. Nach einem neuen Scan können Gewichtung, Cache, Suchergebnisse oder Prüfbefunde abweichen. Ein hoher Agenten-Score ist keine Prüfung von Datenschutz, Sicherheit, Barrierefreiheit oder Vertriebsqualität.

Maßgebliche Quellen:

- https://is-agentic.com/scan/dcpp-digital.de
- https://is-agentic.com/api/v1/report?url=https%3A%2F%2Fdcpp-digital.de
- https://is-agentic.com/docs
- https://is-agentic.com/methodology
- https://developers.cloudflare.com/pages/functions/advanced-mode/
- https://developers.cloudflare.com/pages/functions/pricing/

Es wurden keine kostenpflichtigen Tarife gebucht. Pages Functions fallen unter die Workers-Kontingente; statische Assets sind separat zu betrachten. Bei Erschöpfung eines kostenlosen Kontingents wird nicht automatisch ein kostenpflichtiges Upgrade eingerichtet.
