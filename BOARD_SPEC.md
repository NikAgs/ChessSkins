# ChessSkins board theme specification (read fully before drawing)

You are building one **board theme**: the 8×8 board artwork shown under the pieces on
lichess and chess.com. It sits in a catalog next to 25 other themes and must keep
pieces readable in real games.

## Deliverables — in `/home/claude/liskins/boards/<board-id>/`

- `board.svg` — the full board, `viewBox="0 0 800 800"`, an 8×8 grid of 100×100
  squares. **Convention: the top-left square (a8) is a LIGHT square.**
- `meta.json`: `{"id": "<board-id>", "name": "<Display Name>", "tagline": "<one fun sentence>", "colors": {"light": "#hex", "dark": "#hex"}}`
  (colors = representative light/dark square hexes, used for catalog accents)
- `preview.png` (produced by the tool below — regenerate after your final edit)

## Technical requirements (hard)

- Fully self-contained SVG: **no** `<script>`, `<image>`, `<text>`, `<style>`,
  `<foreignObject>`, external refs, or event attributes. Presentation attributes only;
  inline gradients/patterns with unique ids are fine.
- Keep the file under ~60 KB. Prefer `<defs>`+`<use>` or `<pattern>` over 64 copies of
  hand-drawn texture.
- Exact 800×800 coverage, no margins, nothing outside the viewBox.

## Playability rules (hard — pieces live on top of this)

1. **Two clearly distinct square tones.** Light vs dark squares must be obvious at a
   glance and at small board sizes.
2. **Pieces stay readable.** White pieces are light-bodied with dark outlines; black
   pieces dark-bodied with light outlines. Avoid extreme values (near-white lights or
   near-black darks kill piece contrast), highly saturated mid-tones, and busy
   high-frequency texture. Texture should be *subtle* — visible at full size, invisible
   noise at 45 px.
3. **Consistency.** All 32 light squares identical (or near-identical), likewise dark
   squares. Decorative flourishes are welcome only if they stay quiet (e.g. faint grain,
   soft vignette per square).

## Process (mandatory)

1. Look at `/home/claude/liskins/boards/_reference/classic/board.svg` for structure.
2. Draft your board.svg.
3. Run `python3 /home/claude/liskins/make_board_preview.py <board-id>` — it validates
   and renders `boards/<board-id>/preview.png` with a full set of pieces ON the board
   at two sizes.
4. **View the PNG with the Read tool** and critique honestly: are both armies clearly
   visible on both square colors? Is the theme distinct and attractive? Is texture
   overwhelming at the small size?
5. Fix and repeat — minimum 2 render-and-look iterations; never finish without viewing
   your final preview.

Do not create or modify anything outside your own `boards/<board-id>/` directory.
