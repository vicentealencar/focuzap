#!/usr/bin/env bash
# Render Chrome Web Store images into store/out/ with headless Chrome.
#   promo-small-440x280.png, promo-marquee-1400x560.png
#   screenshot-N-1280x800.png for each raw/N.png listed in screenshots.tsv
# Set CHROME=/path/to/chrome if it isn't on PATH.
set -euo pipefail
cd "$(dirname "$0")"
CHROME=${CHROME:-$(command -v google-chrome || command -v chromium || command -v chrome || true)}
[ -n "$CHROME" ] || { echo "Set CHROME=/path/to/chrome"; exit 1; }
mkdir -p out
# Headless Chrome's viewport can come out shorter than --window-size, so render
# taller than needed and crop to the exact size (needs ImageMagick's convert).
shot() { local w=${2%,*} h=${2#*,}
  "$CHROME" --headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --window-size="$w,$((h + 200))" --screenshot="out/$1" "$3" 2>/dev/null
  convert "out/$1" -crop "${w}x${h}+0+0" +repage -alpha off "PNG24:out/$1"; echo "out/$1"; }
here="file://$PWD"
shot promo-small-440x280.png 440,280 "$here/promo.html#small"
shot promo-marquee-1400x560.png 1400,560 "$here/promo.html#marquee"
enc() { python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$1"; }
grep -v '^#' screenshots.tsv | while IFS=$'\t' read -r img title sub; do
  [ -f "screenshots/raw/$img" ] || { echo "skip $img (missing screenshots/raw/$img)"; continue; }
  shot "screenshot-${img%.png}-1280x800.png" 1280,800 \
    "$here/frame.html?img=screenshots/raw/$img&title=$(enc "$title")&sub=$(enc "$sub")"
done
