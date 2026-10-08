#!/bin/sh
# Builds index.html (the whole game in one file) from src/
cd "$(dirname "$0")"
{
  printf '%s\n' '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0b1526"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'
  (cd src && cat head.html util.js state.js eval.js state2.js sfx.js voice.js voice2.js voice3.js voice4.js voice5.js render1.js suits.js cardcache.js deck.js court.js render2.js drawcard.js chips.js handpaint.js render3.js noise.js buildstatic.js rooms.js badge.js wrap.js frame.js button.js youpts.js flow.js pots.js flow2.js loglines.js drawer.js verify.js tail.js)
  printf '%s\n' '</body></html>'
} > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
