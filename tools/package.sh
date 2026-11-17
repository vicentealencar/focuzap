#!/usr/bin/env bash
# Build a Chrome Web Store upload: dist/focuzap-<version>.zip
# Contains only the files the extension needs at runtime.
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
out="dist/focuzap-${version}.zip"

mkdir -p dist
rm -f "$out"
zip -qr -X "$out" manifest.json src popup icons -x 'icons/*.svg' -x '*.DS_Store'
echo "$out"
unzip -l "$out"
