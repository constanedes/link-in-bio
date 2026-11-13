#!/usr/bin/env sh
# Copies only the publishable files into dist/ (Cloudflare Pages output directory).
set -eu

cd "$(dirname "$0")/.."
rm -rf dist
mkdir dist

for item in index.html 404.html style.css main.js bg.js icons.js \
            favicon.svg robots.txt data assets fonts; do
  cp -r "$item" dist/
done

echo "  dist/ ready ($(find dist -type f | wc -l) files)"
