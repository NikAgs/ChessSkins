# Publishing ChessSkins to the Chrome Web Store — step by step

## 0. One-time developer account (~10 min)

1. Go to https://chrome.google.com/webstore/devconsole and sign in with the Google
   account that should own the extension.
2. Pay the one-time **$5** developer registration fee and accept the developer
   agreement.
3. In **Account** settings: set publisher display name (e.g. "NikAgs"), add a contact
   email, and click the verification link Google sends — listings can't be published
   with an unverified email.

## 1. Get the package

Grab `chessskins.zip` from the latest GitHub Release
(https://github.com/NikAgs/ChessSkins/releases) — CI builds it on every push to main —
or build locally with `python3 tools/build.py`.

## 2. Create the item

Dashboard → **+ New item** → upload `chessskins.zip`.

## 3. Store listing tab — paste from [`store/listing.md`](listing.md)

| Field | Value |
|---|---|
| Name | ChessSkins — Skins for Lichess & Chess.com |
| Summary | (the ≤132-char summary in listing.md) |
| Description | (the long description in listing.md) |
| Category | Fun |
| Language | English |
| Store icon | auto-taken from the package (128px icon) |
| Screenshots | `store/assets/screenshot-1.png` … `screenshot-4.png` (1280×800) |
| Small promo tile | `store/assets/promo-small.png` (440×280) |
| Marquee promo tile | `store/assets/promo-marquee.png` (1400×560) |
| Homepage URL | https://github.com/NikAgs/ChessSkins |

## 4. Privacy tab — paste from listing.md's Privacy section

- **Single purpose**: replaces chess piece/board artwork on lichess.org and chess.com
  with a user-selected themed set; no other function.
- **Permission justifications**: storage (saves selected skin/board + toggles),
  content scripts on lichess/chess.com (inject the theming stylesheet),
  web-accessible resources (serve the bundled artwork to those pages).
- **Data usage**: check **"This item does not collect user data"** — no analytics, no
  remote servers, no remote code.
- **Privacy policy URL**:
  https://github.com/NikAgs/ChessSkins/blob/main/store/privacy-policy.md

## 5. Distribution tab

Public · Free · All regions.

## 6. Submit

Click **Submit for review**. New extensions typically clear review in 1–3 business
days; content-script extensions occasionally take longer.

### If review flags the name

Brand names in titles ("Lichess", "Chess.com") are usually fine as descriptive use,
but if the reviewer objects, rename to **"ChessSkins — Custom Chess Piece Themes"**
(manifest `appName` in `extension/_locales/*/messages.json`) and keep the site names
in the description only. Also keep the "not affiliated" disclaimer (already in the
description).

### After approval

- The listing URL will be `https://chromewebstore.google.com/detail/<item-id>`.
- Add it to the README install section and the repo's About link.
- Updates: bump `"version"` in `extension/manifest.json`, rebuild, upload the new zip
  on the Package tab, submit — reviews for updates are usually faster.

## Firefox (when ready)

`dist/chessskins-firefox.zip` is built by the same CI. Submit at
https://addons.mozilla.org/developers/ (free account, no fee). The manifest already
carries the required `browser_specific_settings.gecko` id.
