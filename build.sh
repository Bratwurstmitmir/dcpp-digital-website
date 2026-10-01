#!/usr/bin/env sh
set -eu

rm -rf dist
mkdir -p dist/assets/css dist/assets/js

cat encoded/index/*.b64 \
  | base64 -d \
  | gzip -d \
  > dist/index.html

# Cloudflare darf keine Rechtslinks zurück zu Jimdo schicken.
sed -i \
  -e 's|https://dcpp.jimdofree.com/about/|/about/|g' \
  -e 's|https://dcpp.jimdofree.com/j/privacy|/j/privacy|g' \
  -e 's|Die nachfolgenden technischen Datenschutzhinweise werden von Jimdo entsprechend den auf dieser Webseite eingesetzten Funktionen bereitgestellt\.|Diese Vorschau wird technisch über Cloudflare Pages bereitgestellt. Vor dem produktiven Domainwechsel wird die Datenschutzerklärung auf die final eingesetzten Dienste und die eigene Domain abgestimmt.|g' \
  dist/index.html

cat \
  encoded/css/css.01.b64 \
  encoded/css/css.02.b64 \
  encoded/css/css.03.b64 \
  encoded/cssfix/css04.01.b64 \
  encoded/cssfix/css04.02.b64 \
  encoded/cssfix/css04.03.b64 \
  encoded/cssfix/css04.04.b64 \
  encoded/cssfix/css04.05.b64 \
  encoded/cssfix/css04.06.b64 \
  encoded/css/css.05.b64 \
  encoded/css/css.06.b64 \
  encoded/css/css.07.b64 \
  | base64 -d \
  | gzip -d \
  > dist/assets/css/site.css

# Host-spezifische Cloudflare-Korrekturen bewusst separat halten.
cat patches/cloudflare-host.css >> dist/assets/css/site.css

cat encoded/js/*.b64 \
  | base64 -d \
  | gzip -d \
  > dist/assets/js/site.js

cp 404.html _headers _redirects robots.txt dist/

printf "DCPP Digital preview built: %s\n" "$(wc -c < dist/index.html) bytes HTML"
printf "CSS: %s\n" "$(wc -c < dist/assets/css/site.css) bytes"
printf "JS: %s\n" "$(wc -c < dist/assets/js/site.js) bytes"
