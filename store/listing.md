# Chrome Web Store listing — LiSkins

Everything below is ready to paste into the Chrome Web Store Developer Dashboard.
(The dashboard is where listing text/images live — they are not part of the extension
package itself. The manifest carries only name, version, description, and icons.)

---

## Store listing tab

**Product name** (≤45 chars)

> LiSkins — Piece Skins for Lichess

**Summary** (≤132 chars)

> 26 playful piece skins for lichess — kittens, robots, pirates, 8-bit and more. Pick one in the catalog; it applies instantly.

**Description**

> Tired of the same six silhouettes? LiSkins gives your lichess games a wardrobe.
>
> Open the catalog, pick a skin, and your pieces change instantly — no reload, no
> settings digging, and your opponent sees nothing unusual. Your choice syncs across
> your Chrome profiles and applies to games, puzzles, analysis, studies, and the board
> editor.
>
> THE CATALOG (26 skins at launch)
>
> ★ Cute & cuddly — Goofball (the original silly squad), Kittens, Puppies, Woodland,
>   Polar, Critter Royale, Rubber Duckies, Garden Bugs, Deep Sea, Dinos
> ★ Delicious — Snack Attack (the knight is a dachshund in a bun), Sweet Tooth
> ★ Retro & sci-fi — 8-Bit, Arcade Invaders, Robots, Cosmos, Neon Grid
> ★ Adventure — High Seas, Valhalla, Dojo, Wild West, Spellbound, Spooky, Monster Mash
> ★ For the aesthetes — Thin Line, Midnight Gothic, Doodle
>
> Every set is designed for real play: six unmistakable silhouettes, clear
> white-vs-black armies, and legibility tested down to bullet-speed board sizes.
>
> PRIVACY
>
> LiSkins collects nothing. No analytics, no accounts, no network requests. The only
> thing it stores is which skin you picked. The code is open source:
> https://github.com/NikAgs/LiSkins
>
> LiSkins is a fan project and is not affiliated with or endorsed by lichess.org.

**Category**: Fun
**Language**: English

## Graphic assets

| Asset | Size | File |
|---|---|---|
| Store icon | 128×128 | `extension/icons/icon128.png` |
| Screenshots (3–5) | 1280×800 | `store/assets/screenshot-1.png` … |
| Small promo tile | 440×280 | `store/assets/promo-small.png` |
| Marquee promo tile | 1400×560 | `store/assets/promo-marquee.png` |

## Privacy tab

**Single purpose description**

> LiSkins replaces the chess piece artwork on lichess.org with a user-selected themed
> set. It has no other function.

**Permission justifications**

- `storage` — saves the user's selected skin and on/off preference (chrome.storage.sync)
  so it persists and syncs across their browsers. No other data is stored.
- Content script on `lichess.org` / `lichess.com` — injects a stylesheet that swaps the
  piece images on lichess pages. It reads nothing from the page and runs nowhere else.
- Web-accessible resources (`skins/*/skin.css`) — lets the injected stylesheet load the
  bundled artwork on lichess pages only.

**Data usage disclosures** — check "This item does not collect user data." LiSkins
collects, transmits, and sells nothing; there are no remote servers and no analytics.

**Remote code** — none. All code and artwork ship inside the package.

## Distribution

- Visibility: Public · Free · All regions
- Privacy policy URL: link to `store/privacy-policy.md` on GitHub (raw or rendered)

## Publishing checklist

1. `python3 tools/build.py` → upload `dist/liskins.zip` on the Package tab.
2. Paste the listing text above; upload the graphic assets from `store/assets/`.
3. Fill the Privacy tab from the sections above.
4. Submit for review (typically 1–3 days for a new extension).
