# DCPP Digital: Jimdo erhalten, Agentenfähigkeit vorbereiten

Stand: 24.10.2026. Grundlage der Einbaudateien ist ausdrücklich der bestätigte **V6.7.12-KINDER-TEXTE**-Stand. Der frühere vollständige Cloudflare-Seitenentwurf ist aus diesem Änderungsvorschlag entfernt; er bleibt im Git-Verlauf nachvollziehbar. Das bestehende Jimdo-Hosting und der Root-Build des Repositorys werden nicht umgestellt.

**Es wurde nichts auf dcpp-digital.de veröffentlicht. Der letzte bestätigte Is-Agentic-Scan bleibt bei 75/100.**

## Vorbereitete Einbaudateien

Die separaten Dateien für HTML, CSS und HEAD gehören zum bereitgestellten Jimdo-Prüfpaket V6.7.13. Sie werden als Benutzerdateien bereitgestellt; der Serverzusatz und seine Tests liegen hier im Repository.

- HTML: gleiche Inhalte, Links, IDs und Jimdo-Pflichtplatzhalter; zusätzlicher Hauptinhalts-Landmark. Formatierungsballast reduziert.
- CSS: gleiche vom Parser erfasste Regelstruktur und Werte; keine Änderungen an Farben, Layout, Breakpoints oder Bilddaten. Formatierungsballast reduziert.
- HEAD: klarerer Titel und Beschreibung für DCPP Digital und App-Entwicklung, passende Begriffe in den strukturierten Daten, Business-Deklaration sowie Links auf vorhandene kompakte Lesefassung und Agentenhinweise. Das alte Ziel `/#dcpp-about` wurde für `/über-uns/` auf die vorhandene Startseite korrigiert.
- Die Minifizierung der 19 JavaScript-Blöcke wurde gegen die bearbeitete Zwischenfassung per Syntaxbaum geprüft, mit deaktivierter Kompression und ohne Umbenennung von Variablen. Bewusste Änderungen an Metadaten und dem veralteten Redirect-Ziel sind hiervon getrennt dokumentiert.

Roh-Codegröße der drei Dateien: 1.991.063 auf etwa 1.247.157 Byte, rund 37 % weniger. Das ist **keine** Messung einer um 37 % schnelleren Website oder eines um 37 % geringeren komprimierten Netztransfers. Auch die extrahierte Textmenge der vollständigen HTML-Sammelseite wird durch entfernte Einrückung nicht kleiner.

Der native Jimdo-Inhaltsplatzhalter ist erhalten. Die vorhandene Skriptbereinigung bleibt funktionsgleich. Yoga-Reste in den von Jimdo eingesetzten ursprünglichen Seiteninhalten werden dadurch nicht serverseitig gelöscht; deren dauerhafte Bereinigung ist noch ein separater Schritt.

## Optionaler Serverzusatz mit Jimdo als Ursprung

`edge-worker.mjs` ist eine vorbereitete **Workers-Route vor dem bestehenden Ursprung**. Er ist nicht zum Einfügen in Jimdos HTML, CSS oder HEAD bestimmt.

Die Grundeinstellung in `wrangler.toml` ist `AGENTIC_ENABLED="0"`. Es gibt keine eingetragenen Produktionsrouten und keine aktivierte workers.dev-Adresse. Das Repository enthält keine Zugangsdaten und löst keine Veröffentlichung aus.

Nach einer separat geprüften Aktivierung kann der Zusatz:

1. Normale HTML-Antworten mit gleichem Body und Status vom Jimdo-Ursprung durchreichen. Bestehende Cookies und Sicherheitsheader bleiben erhalten. Ergänzt wird `Vary: Accept`.
2. Auf `Accept: text/markdown` an der Startseite, den vorhandenen Projekt-Queries und bekannten öffentlichen Rechtsseiten echte kompakte Markdown-Antworten liefern. Die 16 Textfassungen stammen aus dem genehmigten V6.7.12-Stand und brauchen bei Inhaltsänderungen eine Aktualisierung.
3. Echte originäre 404-Antworten als Markdown-Fehler mit Erklärung und Links zur Sitemap bzw. `llms.txt` ausliefern. Andere Fehler werden nicht als erfolgreiche Startseite maskiert.
4. `/llms.txt` und `/agent-instructions.md` mit konkreten When-to-use-Hinweisen anbieten.
5. Eine kompakte XML-Sitemap mit Startseite, zwölf tatsächlichen `?projekt=`-Adressen und Impressum liefern. Die native Datenschutzadresse unter `/j/privacy` wird wegen der bestehenden Robots-Sperre für `/j/` nicht neu in die Sitemap aufgenommen.
6. Die alten nativen Pfade `/kurse/`, `/kontakt/` und `/über-uns/` mit 301 auf die heutigen DCPP-Ziele weiterleiten. Die Zielwahl folgt der vorhandenen Client-Weiterleitung; das nicht mehr existente `dcpp-about`-Fragment ist korrigiert.

POST-Anfragen, Anmeldungen, Administration und mit Authorization versehene Anfragen werden unverändert weitergereicht. Dateien und nicht erkannte gültige Seiten werden nicht in erfundene Markdown-Inhalte umgewandelt. Für die Markdown-Variante werden alte HTML-ETags und Range-Bedingungen nicht verwendet.

## Prüfungen

```sh
python3 jimdo-ready/compile_edge.py
python3 jimdo-ready/verify_machine_docs.py
node --test jimdo-ready/edge.test.mjs
```

Diese Prüfungen benötigen nur Python und Node.js, keine Paketinstallation.

Zusätzlich wurden die Jimdo-Dateien lokal geprüft:

- 26 Ansichten auf 1440 und 390 Pixel Breite: 52 Vergleiche der gerenderten Inhalte, Geometrie, Links und Bedienelemente ohne Abweichung.
- 14 Screenshot-Paare: pixelgleich.
- 14 Bedienabläufe in Ausgangsstand und Prüffassung: identisches Ergebnis. Hinzu kommen die drei Legacy-Weiterleitungen der Prüffassung.
- Die angeforderten 112 öffentlichen Bild-, Font- und CSS-Ressourcen waren im kontrollierten Test verfügbar. Sie wurden mit normaler TLS-Prüfung geladen und für einen reproduzierbaren Vergleich lokal zwischengespeichert. Karte-Frames waren Testdaten; es wurden keine Bestellungen, Buchungen oder Telefonate ausgelöst.
- Browser: Chromium 131.0.6778.33. Die Smartphonebreite ist ein Viewport-Test, kein separater Safari-/iOS-Gerätetest. Der echte Speichervorgang im Jimdo-Editor und die Cloudflare-Integration an der tatsächlichen Domain sind noch nicht geprüft.

Die lokalen Generatoren und Browser-Prüfungen erwarten die drei Ausgangsdateien unter `source/` und erzeugen die neuen Dateien unter `candidate/`. Diese Benutzerdateien, der Browser und der Asset-Cache sind nicht ins Repository aufgenommen. Die beiden Dateimanifeste enthalten Version, Größen und Prüfsummen. Für die Entwicklerprüfung werden `lxml`, die unter `audit/tooling/` festgehaltenen Node-Pakete und Playwright benötigt. Ein vorhandener Chromium-Pfad kann über `DCPP_CHROMIUM_EXECUTABLE` angegeben werden. Die CI prüft den Serverzusatz und die Textdateien; die Browserergebnisse sind zusätzlich lokal erhobene Nachweise.

Der HEAD verweist mit einer unveränderlichen Commit-Adresse auf die ergänzenden Textdateien. Diese Links wurden als HTTP 200 und inhaltlich mit dem freigegebenen Stand identisch geprüft. GitHub Raw liefert sie als `text/plain`; genau das wird im Linktyp angegeben. Dies ist ein nutzbarer Zusatz, ersetzt aber nicht die geprüfte Markdown-Verhandlung an der Hauptdomain.

## Noch erforderliche Aktivierung

Für den Score muss die technische Auslieferung auf **derselben Hauptdomain** geprüft und gegebenenfalls aktiviert werden. Eine Vorschau auf einer anderen Adresse verbessert den `.de`-Score nicht.

Cloudflare dokumentiert Workers-Routen als vorgeschaltete Logik für einen bestehenden Anwendungsserver. Voraussetzung ist eine aktive passende Zone und ein proxied DNS-Eintrag. Ob die tatsächliche Jimdo-Domainanbindung dafür geeignet ist, muss vor einer Aktivierung bestätigt werden. DNS, Mail-Einträge und Produktionsrouten sind nicht geändert worden.

Die späteren Routen müssten die beiden tatsächlichen Web-Hosts abdecken: `dcpp-digital.de/*` und `www.dcpp-digital.de/*`. Nicht als Workers Custom Domain einrichten: Jimdo soll der Ursprung bleiben. Erst nach der Endprüfung wäre `AGENTIC_ENABLED="1"` zu setzen. Zum Rücksetzen kann der Zusatz deaktiviert bzw. seine Route entfernt werden; der deaktivierte Handler reicht die originäre Antwort unverändert weiter.

Anschließend auf der echten Domain Inhalt und Header prüfen:

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://dcpp-digital.de/
curl -sS -L -i -H 'Accept: text/html' https://dcpp-digital.de/
curl -sS -L -i -H 'Accept: text/markdown' https://dcpp-digital.de/__agentic_missing_20261024/
curl -sS -L -i https://dcpp-digital.de/llms.txt
curl -sS -L -i https://dcpp-digital.de/sitemap.xml
```

Erwartet: 200 Markdown mit `Vary: Accept`; 200 HTML mit `Vary: Accept`; 404 Markdown mit Rückweg; echte Textdatei und gültige XML-Sitemap. Die Formatprüfung erfolgt mit GET und dem tatsächlichen Antwortinhalt; ein HEAD-Status allein genügt nicht.

Die Markensuche `DCPP Digital app development` bleibt vom Suchindex abhängig. Die große Textmenge des vollständigen HTML muss im neuen Scan gesondert beurteilt werden. Der Zusatz liefert wesentlich kürzere Markdown-Fassungen, ersetzt aber nicht die native HTML-Ausgabe. 100/100 ist bis zu einem neuen Live-Scan unbestätigt.

## Quellen

- https://is-agentic.com/docs
- https://is-agentic.com/methodology
- https://developers.cloudflare.com/workers/configuration/routing/routes/

Es wurden keine kostenpflichtigen Tarife eingerichtet. Der Serverzusatz benötigt eine zum vorhandenen Konto passende kostenlose Konfiguration innerhalb der jeweiligen Kontingente.
