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

Der native Jimdo-Inhaltsplatzhalter ist erhalten. Die vorhandene Skriptbereinigung bleibt funktionsgleich. Die Einbaudateien allein löschen Yoga-Reste nicht aus der ersten Serverantwort. Dafür gibt es jetzt eine zusätzliche, unabhängig zuschaltbare Bereinigung im Serverbaustein; alternativ müssen die alten Inhalte später im nativen Jimdo-Editor entfernt werden.

## Optionaler Serverzusatz mit Jimdo als Ursprung

`edge-worker.mjs` ist eine vorbereitete **Workers-Route vor dem bestehenden Ursprung**. Er ist nicht zum Einfügen in Jimdos HTML, CSS oder HEAD bestimmt.

Die Grundeinstellung in `wrangler.toml` ist `AGENTIC_ENABLED="0"`. Es gibt keine eingetragenen Produktionsrouten und keine aktivierte workers.dev-Adresse. Das Repository enthält keine Zugangsdaten und löst keine Veröffentlichung aus.

Nach einer separat geprüften Aktivierung kann der Zusatz:

1. Normale HTML-Antworten mit gleichem Body und Status vom Jimdo-Ursprung durchreichen. Bestehende Cookies und Sicherheitsheader bleiben erhalten. Ergänzt wird `Vary: Accept`. Der separate Schalter `CLEAN_LEGACY_HTML` bleibt zunächst ebenfalls `"0"`.
2. Auf `Accept: text/markdown` an der Startseite, den vorhandenen Projekt-Queries und bekannten öffentlichen Rechtsseiten echte kompakte Markdown-Antworten liefern. Die 16 Textfassungen stammen aus dem genehmigten V6.7.12-Stand und brauchen bei Inhaltsänderungen eine Aktualisierung.
3. Echte originäre 404-Antworten als Markdown-Fehler mit Erklärung und Links zur Sitemap bzw. `llms.txt` ausliefern. Andere Fehler werden nicht als erfolgreiche Startseite maskiert.
4. `/llms.txt` und `/agent-instructions.md` mit konkreten When-to-use-Hinweisen anbieten.
5. Eine kompakte XML-Sitemap mit Startseite, zwölf tatsächlichen `?projekt=`-Adressen und Impressum liefern. Die native Datenschutzadresse unter `/j/privacy` wird wegen der bestehenden Robots-Sperre für `/j/` nicht neu in die Sitemap aufgenommen.
6. Die alten nativen Pfade `/kurse/`, `/kontakt/` und `/über-uns/` mit 301 auf die heutigen DCPP-Ziele weiterleiten. Die Zielwahl folgt der vorhandenen Client-Weiterleitung; das nicht mehr existente `dcpp-about`-Fragment ist korrigiert.
7. Mit dem zusätzlichen Opt-in `CLEAN_LEGACY_HTML="1"` auf bekannten öffentlichen Start-/Projektadressen exakt `#dcpp-jimdo-page-content` und die alte Navigation innerhalb `#dcpp-jimdo-required` aus der ersten HTML-Antwort entfernen. Das sind genau die beiden Bereiche, die das vorhandene JavaScript bereits entfernt. Rechtsseiten, unbekannte Seiten, Editor, Sitzungen und Fehlerantworten werden davon ausgenommen. Projekte, Speisekarten, Skripte, Gestaltung und Pflichtplatzhalter in den Quelldateien bleiben erhalten. Das ist keine vollständige Lösung des HTML-Textbudgets.

POST-Anfragen, Anmeldungen, Administration, Editor-/Vorschau-Queries, Authorization und Anfragen mit Sitzungscookies werden unverändert weitergereicht. Nur bekannte Cloudflare-Infrastrukturcookies sind hiervon ausgenommen. Private, authentifizierungspflichtige und als Download deklarierte Ursprungsantworten werden nicht ersetzt. Dateien und nicht erkannte gültige Seiten werden nicht in erfundene Markdown-Inhalte umgewandelt. Für die Markdown-Variante werden alte HTML-ETags und Range-Bedingungen nicht verwendet; sie bleibt `private, no-store`. Auch bedingte HTML-304-Antworten deklarieren die Formattrennung.

## Prüfungen

```sh
python3 jimdo-ready/compile_edge.py
python3 jimdo-ready/verify_machine_docs.py
node --test jimdo-ready/edge.test.mjs
python3 -m unittest discover -s jimdo-ready -p test_verify_live.py
```

Diese Prüfungen benötigen nur Python und Node.js, keine Paketinstallation.

Zusätzlich ist die tatsächliche Workers-Laufzeit lokal geprüft:

```sh
npm ci --prefix jimdo-ready/audit/tooling
node jimdo-ready/audit/edge_runtime.cjs
```

Miniflare ist auf `4.20260730.0` festgelegt. Laufzeittest und Konfiguration verwenden denselben Kompatibilitätsstand `2026-07-30`. Ohne die separat bereitgestellten Jimdo-Dateien nutzt die CI eine kleine HTML-Probe mit den exakten geschützten IDs. Lokal wurde die vollständige V6.7.13-Fassung verwendet. Sieben Szenarien einschließlich des echten `HTMLRewriter` bestanden. Der vollständige DOM-Vergleich zeigt außerhalb der beiden beabsichtigten Altbereiche keine Änderung; zehn zusätzliche Browservergleiche auf 1440/390 Pixel Breite zeigen identische sichtbare Inhalte, Geometrie, Links und Bedienelemente. Das ersetzt keinen Produktiveinbau.

Die Server-Verhaltenstests umfassen jetzt 17 Szenarien. Die sechs Tests des öffentlichen Prüfprogramms sichern ab, dass etwa ein Status 404 ohne Markdown-Body oder ein fehlendes `Vary: Accept` nicht versehentlich als bestanden gilt.

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

Die öffentliche DNS-Prüfung vom 24.10.2026 ist abgeschlossen: `dcpp-digital.de` verwendet `ns13.jimdo.com` und `ns14.jimdo.com`; die Mailziele sind `mx1.jimdo.com` und `mx2.jimdo.com`. Cloudflare-Adressen und -Header beim Webhost sind kein Nachweis einer vom Nutzer verwalteten Cloudflare-Zone.

Cloudflare dokumentiert Workers-Routen als vorgeschaltete Logik für einen bestehenden Anwendungsserver. Voraussetzung ist eine aktive passende Zone und ein proxied DNS-Eintrag. Eine eigene kostenlose Full-Zone-Anbindung würde hier eine gesondert geprüfte Nameserver-/DNS-Umstellung voraussetzen. Die Partial-CNAME-Variante steht laut Cloudflare nur mit Business/Enterprise zur Verfügung und wird hier nicht als kostenlose Abkürzung empfohlen. Aus den öffentlichen DNS-Antworten lassen sich weder Registrarzugriff noch die vollständige Zone, DNSSEC und Jimdos Proxy-Verträglichkeit ableiten. Die offizielle Jimdo-Hilfe beschreibt zudem Einschränkungen für dort registrierte/transferierte Domains; wo diese Domain registriert ist, wurde nicht festgestellt. DNS, Mail-Einträge und Produktionsrouten sind nicht geändert worden.

Die späteren Routen müssten die beiden tatsächlichen Web-Hosts abdecken: `dcpp-digital.de/*` und `www.dcpp-digital.de/*`. Nicht als Workers Custom Domain einrichten: Jimdo soll der Ursprung bleiben. Erst nach der Endprüfung wäre `AGENTIC_ENABLED="1"` zu setzen. Zum Rücksetzen kann der Zusatz deaktiviert bzw. seine Route entfernt werden; der deaktivierte Handler reicht die originäre Antwort unverändert weiter.

Anschließend auf der echten Domain Inhalt und Header prüfen:

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://dcpp-digital.de/
curl -sS -L -i -H 'Accept: text/html' https://dcpp-digital.de/
curl -sS -L -i -H 'Accept: text/markdown' https://dcpp-digital.de/__agentic_missing_20261024/
curl -sS -L -i https://dcpp-digital.de/llms.txt
curl -sS -L -i https://dcpp-digital.de/sitemap.xml
python3 jimdo-ready/verify_live.py --json live-check.json
```

Erwartet: 200 Markdown mit `Vary: Accept`; 200 HTML mit `Vary: Accept`; 404 Markdown mit Rückweg; echte Textdatei und gültige XML-Sitemap. Die Formatprüfung erfolgt mit GET und dem tatsächlichen Antwortinhalt; ein HEAD-Status allein genügt nicht.

`verify_live.py` führt ausschließlich öffentliche GET-Anfragen aus. Es verändert keine Daten, startet keinen Scan und berechnet keinen Is-Agentic-Score. Die 14 eigenen Abnahmekriterien sind strenger und anders gruppiert als der Scanner. Exit-Code 1 bedeutet offene Abnahmepunkte. Der konservative HTML-Textwert zählt auch versteckte Projektbereiche, ignoriert Code und ist keine Messung der Ora-Tokenisierung.

Die Markensuche `DCPP Digital app development` bleibt vom Suchindex abhängig. Die große Textmenge des vollständigen HTML muss im neuen Scan gesondert beurteilt werden. Der Zusatz liefert wesentlich kürzere Markdown-Fassungen, ersetzt aber nicht die native HTML-Ausgabe. 100/100 ist bis zu einem neuen Live-Scan unbestätigt.

## Quellen

- https://is-agentic.com/docs
- https://is-agentic.com/methodology
- https://developers.cloudflare.com/workers/configuration/routing/routes/

Es wurden keine kostenpflichtigen Tarife eingerichtet. Die technische Eignung des tatsächlichen Domain-/DNS-Zugangs ist ein offener Einbauschritt; eine ohne DNS-Änderung kostenlose Aktivierung ist für die jetzige Anbindung nicht nachgewiesen.
