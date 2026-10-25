# DCPP Digital V6.7.15 – Textbudget der ersten HTML-Antwort

Ausgangspunkt ist die am 25.10.2026 vom Nutzer live bestätigte V6.7.14 mit korrigierter Logo-Adresse. Die .de-Hauptseite bleibt bei Jimdo. Die separate .com-Lab-Umgebung wird nicht verwendet.

Die neue HTML-Datei verpackt fünf zuvor unsichtbare App-Microsites als HTML-sicheres JSON. Ein kleines synchrones Skript setzt deren unveränderten DOM vor `DOMContentLoaded` wieder an denselben Stellen ein. Unternehmensinhalte, Kontakt, Projektbeschreibungen, Publishing, Buchlinks, Restaurantinhalte und die eigenen Rechtsseiten bleiben gewöhnliches HTML. Bestehendes CSS, HEAD, Inhalte, Links, Reihenfolge und Bedienlogik werden nicht bearbeitet. Die Menü-Daten von La Rosa bleiben als nicht ausführbares JSON erhalten. Der Generator lehnt ausführbare Skripte in zu verpackenden Panels ab.

Der JSON-Block enthält keine literalen `<`, `>` oder `&`, sodass enthaltenes Markup keine zusätzlichen Script-Tags öffnen oder den Datenblock beenden kann. Die Platzhalter sind ausdrücklich unsichtbar und nicht leer, damit eine HTML-Bereinigung sie nicht als leere Spans entfernt. Die Wiederherstellung akzeptiert Jimdos übliche CDATA-Kommentare und führt enthaltene Skripte nicht aus. Bei beschädigten Daten führen die betroffenen Microsite-Einstiege zur weiterhin lesbaren Projektübersicht zurück.

Der reine exportierte HTML-Text sinkt mit zwei Parsern von rund 118.600 auf rund 83.763 Zeichen. Das Modell auf fünf aktuellen öffentlichen Jimdo-Seiten ergibt einschließlich nativer Inhalte rund 85.000–87.000 Zeichen nach Auslagerung. Das sind lokale Messungen bzw. ein Modell; die neue Jimdo-Ausgabe und Ora-Tokenisierung sind erst nach dem Einbau überprüfbar. Die Rohdatei steigt von rund 550 KB auf rund 599 KB. Eine Beschleunigung wird daraus nicht behauptet. Der zusätzliche Parser-Aufwand im Browser ist ein verbleibender praktischer Prüfpunkt auf den tatsächlichen Geräten.

Der letzte echte Is-Agentic-Stand ist **75/100**, Scan 25.10.2026, 06:40:23 UTC. Das HTML ist hiermit nicht veröffentlicht. V6.7.14 bleibt als Rückfallfassung erhalten. Der neue Stand muss nach dem tatsächlichen Jimdo-Speichern kontrolliert werden.

## Prüfung

```sh
python3 -m unittest discover -s jimdo-ready/budget -p test_budget.py
```

Sieben Standardbibliotheks-Tests decken unveränderte Hauptinhalte, Reihenfolge, sichere Datenkodierung, Ablehnung aktiver Skripte, unveränderte Menüdaten und ungültige Eingaben ab. Die lokalen Browserprüfungen verwenden die separat bereitgestellten vollständigen Benutzerdateien. 52 Ansichten, 14 Pixelvergleiche und 14 Bedienabläufe wurden verglichen. Zehn zusätzliche Vergleiche prüfen das Verhalten ohne JavaScript; weitere Fälle prüfen CDATA und beschädigte Daten. Insgesamt sind es 15 zusätzliche Fälle, einschließlich weiterhin nutzbarem Publishing und Restaurantinhalt bei beschädigten App-Daten. Für die Bedienvergleiche werden sichtbare Bilder in beiden Testfassungen vollständig geladen. Der scrollabhängige Zurück-Button wird ausschließlich für statische Inhalts-Schnappschüsse ausgeblendet; seine tatsächliche Klickfunktion wird separat nach 900 Pixel Scrollweg geprüft. Browser: Chromium 131.0.6778.33, keine tatsächliche Safari-/iOS-Geräteprüfung.

Für die lokale Wiederholung werden die drei V6.7.14-Dateien unter `source/` benötigt; `build_budget.py` erzeugt das neue HTML unter `candidate/`. Die vorhandenen Browser-Hilfen benötigen dieselben lokalen Werkzeuge wie `../audit/`. Benutzerdateien, Assets, Bilder und Browser sind nicht im Repository enthalten. Für die Browserprüfungen wird `budget/audit/tooling/` mit dem vorhandenen `audit/tooling/` verknüpft; auch Browser und Asset-Cache können gemeinsam verwendet werden. `CODEX_PRIMARY_RUNTIME_NODE_MODULES` muss auf das Verzeichnis mit Playwright zeigen. Die CI führt die sieben Generator-Tests aus; die vollständigen Browserdaten bleiben zusätzliche lokale Nachweise.

## Weiterhin außerhalb dieses HTML-Schritts

- `Accept: text/markdown` und eine Markdown-404 brauchen echte HTTP-Verarbeitung auf derselben Domain. Der separate Worker bleibt ohne Produktionsroute und deaktiviert. Aktuell besteht keine steuerbare Jimdo-/Cloudflare-Verbindung, um ihn auf der .de-Hauptseite zu aktivieren.
- `/llms.txt` und `/agent-instructions.md` sind im Serverbaustein vorbereitet, aber an der .de-Domain noch nicht als Textendpunkte aktiv. Ein GitHub-Link im HEAD ist hierfür kein gleichwertiger Ersatz.
- Die alten Mind-/Yoga-Module stammen aus dem nativen Jimdo-Inhalt. Der Pflichtplatzhalter wird nicht entfernt; diese Inhalte müssen im Editor bereinigt oder durch den separat geprüften Serverfilter entfernt werden.
- Der erste serverseitige Titel ist weiterhin `Webdesign, Apps & Publishing aus Bottrop - DCPP Digital`. In Jimdos nativer Startseiten-SEO ist `DCPP Digital | Webdesign & App-Entwicklung aus Bottrop` einzutragen. Die sichtbare Überschrift bleibt unverändert. Ein bestimmter Suchrang und Indexierungszeitpunkt werden nicht zugesagt.
- DNS und Mail bleiben unverändert. Jimdo bleibt Ursprung und Hosting der .de-Seite. Es werden keine kostenpflichtigen Tarife eingerichtet.
