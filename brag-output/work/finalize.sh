#!/usr/bin/env bash
# Bake the poster into frame 0, write deliverables and web copies. Usage: finalize.sh <landscape|vertical>
set -e
export TOOLS="C:/Users/chris/AppData/Local/Temp/claude/c--Users-chris-Documents-automated-certs/de912d96-0dde-4e66-a5d8-535d5f73019a/scratchpad/tools"
FF="$TOOLS/node_modules/ffmpeg-static/ffmpeg.exe"
POSTER_T=7.00
if [ "$1" = vertical ]; then RAW=raw-vertical.mp4; NAME=brag-vertical; FORMAT=vertical node stills.mjs $POSTER_T; else RAW=raw.mp4; NAME=brag; node stills.mjs $POSTER_T; fi
"$FF" -y -loglevel error -i stills/t$POSTER_T.png -q:v 2 ../$NAME.jpg
"$FF" -y -loglevel error -i $RAW -i stills/t$POSTER_T.png -filter_complex "[0:v][1:v]overlay=enable='eq(n,0)'" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a copy -movflags +faststart ../$NAME.mp4
mkdir -p ../../public/promo
"$FF" -y -loglevel error -i ../$NAME.mp4 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart ../../public/promo/certify-promo-$1.mp4
"$FF" -y -loglevel error -i ../$NAME.jpg -vf "scale=iw/2:-1" -q:v 4 ../../public/promo/certify-promo-$1.jpg
ls -la ../$NAME.mp4 ../../public/promo/certify-promo-$1.*
