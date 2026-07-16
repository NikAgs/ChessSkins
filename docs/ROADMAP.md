# ChessSkins — feature roadmap

Sources: teardown of the leading competitor ([ChessHelper — Chess.com Custom Themes,
Boards](https://chromewebstore.google.com/detail/chesscom-custom-themes-bo/kdkckejnngdmlcephpnfaggaeofloode),
4.7★ · 483 reviews · 8k users · chess.com-only), lichess community forum research, and
our own product goals. Impact ★1–5 · Effort S/M/L.

## Shipped in v2

| Feature | Impact | Notes |
|---|---|---|
| 26-skin catalog with visual gallery (every skin on a mini board) | ★★★★★ | Competitor shows plain lists; this is our browsing edge |
| Dual-site support: lichess + chess.com | ★★★★★ | Competitor is chess.com-only |
| AI skin creator (Claude/ChatGPT prompt → paste → preview → apply) | ★★★★★ | Nobody else has this |
| One-click submit-to-catalog (bot validates & opens the PR) | ★★★★★ | Community flywheel |
| Instant apply, no reload; syncs across devices | ★★★★ | Table stakes done right |
| Category chips + search + hover strip previews | ★★★★ | |

## Next up (recommended order)

| Feature | Source | Impact | Effort | Verdict |
|---|---|---|---|---|
| Board themes (square colors/textures, per-skin matching palette) | Competitor (40 boards) | ★★★★★ | M | The one competitor feature we clearly lack; squares are half the vibe. Do next. |
| Import skin from .json file (offline path into the creator) | Us | ★★★★ | S | Trivial add; unlocks hand-artists too. |
| Auto-release CI (merged skin PR → rebuild zip → GitHub Release) | Us | ★★★★ | S | Keeps catalog fresh with zero maintainer toil. |
| Per-site toggle (e.g. skins on lichess, off on chess.com) | Us | ★★★ | S | Cheap, real user ask. |
| Random skin per game / seasonal auto-skins (Spooky in October) | Us | ★★★ | S | Pure delight, tiny code. |
| Firefox + Edge ports | Us | ★★★★ | M | Edge is near-free (Chromium); Firefox MV3 mostly compatible. |
| Favorites + recents row | Us | ★★★ | S | Matters as the catalog grows past ~30. |
| Popularity sort via GitHub 👍 reactions (fetched at build time) | Us | ★★★ | S | Social proof without any runtime tracking. |
| Public web gallery on GitHub Pages (shareable skin links) | Us | ★★★ | M | Marketing surface; reuses gallery.html nearly as-is. |
| Mix & match (knight from one set, rooks from another) | Us | ★★★ | M | Creator covers some of this; revisit later. |
| i18n (competitor ships 53 languages) | Competitor | ★★★ | M | Store reach; after listing is live. |
| Full-board "try on" modal in gallery | Us | ★★★ | S | Nice polish. |

## Evaluated and deprioritized

| Feature | Source | Impact | Effort | Why not now |
|---|---|---|---|---|
| Site-wide themes (dark/AMOLED/glitter page reskins) | Competitor | ★★★ | L | Brittle against site redesigns; dilutes single-purpose store listing. |
| QoL tools: chat disable, popup blocking, double-click resign, fullscreen, fixed board, bandwidth saver | Competitor | ★★ | M | Scope creep — violates the "single purpose" story that gets extensions approved fast and keeps 23MB competitors feeling bloated. Stay the skins company. |
| Custom fonts | Competitor | ★★ | M | Niche, brittle. |
| Sound packs | Us | ★★ | M | Off-purpose; sites handle audio fine. |
| Animated pieces | Us | ★★ | M | Risks fighting the sites' own move animations. |
| Skin ratings backend | Us | ★★ | L | Would break the "collects nothing" promise; reactions-sort covers it. |
