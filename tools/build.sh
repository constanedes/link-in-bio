#!/usr/bin/env sh
# The site is served straight from public/ (see wrangler.jsonc); the only build
# step is generating the vCard, which is a build artifact (gitignored).
set -eu

cd "$(dirname "$0")/.."
node tools/vcf.mjs public/assets/constantino-edes.vcf
