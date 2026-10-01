#!/usr/bin/env sh
set -eu
rm -rf dist
mkdir -p dist/assets/css dist/assets/js dist/assets/images
cat src/index.part*.html > dist/index.html
cat src/css/site.part*.css > dist/assets/css/site.css
cp assets/js/site.js dist/assets/js/site.js
cp assets/images/REMOTE-ASSET-MANIFEST.txt dist/assets/images/REMOTE-ASSET-MANIFEST.txt
cp 404.html _headers _redirects robots.txt dist/
printf "DCPP Digital preview built: %s\n" "$(wc -c < dist/index.html) bytes HTML"
printf "CSS: %s\n" "$(wc -c < dist/assets/css/site.css) bytes"
