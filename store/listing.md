# Chrome Web Store listing — ChessSkins

Everything below is ready to paste into the Chrome Web Store Developer Dashboard.
(The dashboard is where listing text/images live — they are not part of the extension
package itself. The manifest carries only name, version, description, and icons.)

---

## Store listing tab

**Product name** (≤45 chars)

> ChessSkins — Skins for Lichess & Chess.com

**Summary** (≤132 chars)

> 24 playful piece skins + 26 board themes for lichess & chess.com. Browse visually, apply instantly, or design your own with AI.

**Description**

> Tired of the same six silhouettes? ChessSkins gives your chess games a wardrobe —
> on both lichess.org and chess.com.
>
> Open the visual gallery, see every skin laid out on a real board, click one, and
> your pieces change instantly — no reload, no settings digging, and your opponent
> sees nothing unusual. Works in games, puzzles, analysis, studies and the board
> editor. Your choice syncs across your Chrome profiles.
>
> THE CATALOG (24 skins + 26 board themes at launch)
>
> ★ Cute & cuddly — Goofball (the original silly squad), Woodland, Polar,
>   Rubber Duckies, Garden Bugs, Deep Sea, Dinos, Monster Mash
> ★ Delicious — Snack Attack (the knight is a dachshund in a bun), Sweet Tooth
> ★ Retro & sci-fi — 8-Bit, Arcade Invaders, Robots, Cosmos, Neon Grid
> ★ Adventure — High Seas, Valhalla, Dojo, Wild West, Spellbound, Spooky
> ★ For the aesthetes — Thin Line, Midnight Gothic, Doodle
>
> BOARD THEMES
>
> 26 matching grounds to fight on — walnut, marble, neon grid, sakura, tournament
> green, midnight and more.
>
> MAKE YOUR OWN — NO CODING
>
> The built-in creator hands you a designer-grade prompt for Claude or ChatGPT. Paste
> the AI's answer back and your custom set appears on a preview board, ready to apply.
> Love it? One click submits it to the public catalog, where a bot opens the pull
> request for you.
>
> DESIGNED FOR REAL PLAY
>
> Every set follows strict readability rules: six unmistakable silhouettes, clear
> white-vs-black armies, and legibility tested down to bullet-speed board sizes.
>
> PRIVACY
>
> ChessSkins collects nothing. No analytics, no accounts, no network requests. The
> only thing it stores is which skin you picked. The code is open source:
> https://github.com/NikAgs/ChessSkins
>
> ChessSkins is a fan project, not affiliated with or endorsed by lichess.org or
> chess.com.

**Category**: Fun
**Language**: English

## Graphic assets

| Asset | Size | File |
|---|---|---|
| Store icon | 128×128 | `extension/icons/icon128.png` |
| Screenshots (3) | 1280×800 | `store/assets/screenshot-1.png` (popup), `-2` (gallery), `-3` (creator) |
| Small promo tile | 440×280 | `store/assets/promo-small.png` |
| Marquee promo tile | 1400×560 | `store/assets/promo-marquee.png` |

## Privacy tab

**Single purpose description**

> ChessSkins replaces the chess piece artwork on lichess.org and chess.com with a
> user-selected themed set. It has no other function.

**Permission justifications**

- `storage` — saves the user's selected skin and on/off preference
  (chrome.storage.sync) and their self-made custom skin (chrome.storage.local).
  No other data is stored.
- Content script on `lichess.org` / `lichess.com` / `chess.com` — injects a stylesheet
  that swaps the piece images on those sites. It reads nothing from the page and runs
  nowhere else.
- Web-accessible resources (`skins/*/skin.css`, `boards/*/board.css`) — lets the
  injected stylesheet load the bundled artwork on those sites only.

**Host permission justification** (the dashboard asks for this separately; the
"in-depth review" warning it shows is normal for content-script extensions)

> ChessSkins' single purpose is to re-theme the chess pieces and board on lichess.org
> and chess.com. The content script must run on those specific sites to inject a
> stylesheet that swaps the piece and board artwork for the user's selected theme —
> theming cannot work without running on the page being themed. Host access is limited
> to exactly three chess sites (lichess.org, lichess.com, chess.com); the extension
> reads nothing from the page, collects no data, makes no network requests, and
> executes no remote code. All artwork ships inside the package.

**Data usage disclosures** — check "This item does not collect user data." ChessSkins
collects, transmits, and sells nothing; there are no remote servers and no analytics.

**Remote code** — none. All code and artwork ship inside the package.

## Distribution

- Visibility: Public · Free · All regions
- Privacy policy URL: link to `store/privacy-policy.md` on GitHub (raw or rendered)

## Publishing checklist

1. `python3 tools/build.py` → upload `dist/chessskins.zip` on the Package tab.
2. Paste the listing text above; upload the graphic assets from `store/assets/`.
3. Fill the Privacy tab from the sections above.
4. Submit for review (typically 1–3 days for a new extension).
