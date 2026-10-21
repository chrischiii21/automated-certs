#!/usr/bin/env bash
# Place the VO lines and duck the music under them.
set -e
FF="C:/Users/chris/AppData/Local/Temp/claude/c--Users-chris-Documents-automated-certs/de912d96-0dde-4e66-a5d8-535d5f73019a/scratchpad/tools/node_modules/ffmpeg-static/ffmpeg.exe"
AT=(1000 4150 8400 12500 16400 22400 26500)
IN=""; F=""; MIX=""
for i in 0 1 2 3 4 5 6; do IN="$IN -i vo/t$i.wav"; F="$F[$((i+1)):a]aresample=44100,adelay=${AT[$i]}|${AT[$i]}[v$i];"; MIX="$MIX[v$i]"; done
"$FF" -y -loglevel error -i music.wav $IN -filter_complex "${F}${MIX}amix=inputs=7:normalize=0,pan=stereo|c0=c0|c1=c0,highpass=f=90,equalizer=f=3000:t=q:w=1:g=2,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=1.6,asplit=2[vo][sc];[0:a]volume=0.55[m];[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350[md];[md][vo]amix=inputs=2:normalize=0,alimiter=limit=0.89,apad,atrim=0:30[out]" -map "[out]" -ar 48000 mix.wav
