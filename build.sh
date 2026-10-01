#!/usr/bin/env sh
set -eu

rm -rf dist
mkdir -p dist/assets/css dist/assets/js

cat encoded/index/*.b64 \
  | base64 -d \
  | gzip -d \
  > dist/index.html

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

cat encoded/js/*.b64 \
  | base64 -d \
  | gzip -d \
  > dist/assets/js/site.js

cp 404.html _headers _redirects robots.txt dist/

printf "DCPP Digital preview built: %s\n" "$(wc -c < dist/index.html) bytes HTML"
printf "CSS: %s\n" "$(wc -c < dist/assets/css/site.css) bytes"
printf "JS: %s\n" "$(wc -c < dist/assets/js/site.js) bytes"
