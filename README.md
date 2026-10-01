# DCPP Digital – Cloudflare Pages Preview V1

Basis: **DCPP Digital V1.6.7 (bestätigt)**.

Dieses Repository enthält die risikofreie Phase-1-Migration der DCPP-Digital-Webseite von Jimdo Creator auf statisches HTML/CSS/JS für Cloudflare Pages.

## Cloudflare Pages Deployment

Cloudflare Pages → Connect to Git → `Bratwurstmitmir/dcpp-digital-website`

- Framework preset: **None**
- Build command: **`sh build.sh`**
- Build output directory: **`dist`**

`build.sh` rekonstruiert beim Deployment die statische Preview aus den komprimierten Quellen unter `encoded/` und schreibt die fertigen Dateien nach `dist/`.

## Preview-Sicherheit

Die Preview bleibt zunächst bewusst **noindex / nofollow**. Impressum und Datenschutz verweisen in Phase 1 noch auf die bestehenden DCPP-Jimdo-Rechtsseiten. Die aktuelle Jimdo-Seite bleibt bis zur finalen Freigabe unverändert online.

## Phase 2 nach SAFE

Nach erfolgreicher Preview-Prüfung folgen:

- lokale Bildassets statt `u.jimcdn.com`
- echte Unterseiten statt Hash-Microsites
- eigene Impressum-/Datenschutzseiten
- `dcpp-digital.de`
- Sitemap, Canonicals und Freigabe für Suchmaschinen

