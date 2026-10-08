# FairPoker

No-limit Texas Hold'em against labeled computer (COM) players, with a provably fair, verifiable shuffle.

**Play:** https://cbgregg.github.io/fairpoker/

- Tables: Regular, 1877 Saloon, 16-Bit, each with an Above or First-person camera
- Animated players and dealer: hands that grab, carry and toss chips and cards
- ~2,100 lines of table talk with Retro (SAM), Modern (device) and Studio (Azure neural) voice packs
- Odds helper: hand name, live win chance and pot odds
- Classic CC0 card deck (Adrian Kennard)

## Build

```sh
./build.sh      # concatenates src/ into index.html
```

## Studio voices

`tools/studio/` records every line with Azure AI Speech neural voices with real emotion styles.
See `tools/studio/README.txt`. Put the generated `voices/` folder next to `index.html`.

## License

Apache 2.0 (see LICENSE). The card faces are CC0 (Adrian Kennard).
