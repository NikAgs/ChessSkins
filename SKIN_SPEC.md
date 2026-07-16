# LiSkins skin specification (read fully before drawing)

You are building one **piece skin**: a complete replacement set of chess piece artwork
for lichess, shown in a catalog next to 25 other skins. It must be usable in real games.

## Deliverables — in `/home/claude/liskins/skins/<skin-id>/`

- 12 SVG files, exactly these names:
  `wK.svg wQ.svg wR.svg wB.svg wN.svg wP.svg bK.svg bQ.svg bR.svg bB.svg bN.svg bP.svg`
  (w = the "white" army, b = the "black" army)
- `meta.json`: `{"id": "<skin-id>", "name": "<Display Name>", "tagline": "<one fun sentence>", "style": "<1-2 word style tag>"}`
- `preview.png` (produced by the tool below — regenerate after your final edit)

## Technical requirements (hard)

- `viewBox="0 0 100 100"`, artwork fills roughly 86–96 units of height (small margins).
  Pieces render at ~45–90px on screen.
- Fully self-contained SVG: **no** external refs, `<image>`, `<script>`, `<style>` blocks,
  CSS classes, fonts, or `<text>` elements (draw letterforms as paths if ever needed).
  Presentation attributes only (`fill`, `stroke`, ...). Gradients/opacity are allowed
  (define gradients inline with unique ids per file).
- Keep each file under ~10 KB.
- Bottom of the piece should sit near y≈92 so all pieces share a ground line.

## Readability rules (hard — this is a chess set, not just art)

1. **Six distinct silhouettes.** King, queen, rook, bishop, knight, pawn must be
   identifiable at a glance. Keep classic role cues even in costume:
   king = tallest/most regal (crown/cross), queen = elegant + her own crown/tiara
   (make king vs queen unmistakably different), rook = sturdy/structural,
   bishop = tall/pointed, knight = the animal/mount in side profile, pawn = smallest
   and simplest.
2. **Side identity.** The white army must read as predominantly LIGHT-bodied, the black
   army as predominantly DARK-bodied. Accent colors are welcome (this is a themed set),
   but at 45px a player must never hesitate about whose piece it is.
3. **Contrast on both squares.** Both armies sit on #f0d9b5 (light) and #b58863 (dark).
   Proven recipe: dark outline around light pieces, light outline around dark pieces.
4. **Small-size check.** The preview includes a 45px strip — every piece must stay
   readable there. Fine detail that vanishes at 45px is wasted; remove or thicken it.
5. **Internal consistency.** One stroke-weight family, one level of detail, one ground
   treatment across all 12. The black set is the same design language as white
   (recolored / re-accented), not a different set.

## Process (mandatory)

1. Read 2–3 of `/home/claude/liskins/pieces/*.svg` (the "Goofball" set) to see the
   conventions (structure, base plinth, outline trick). Do NOT copy its style — your
   brief defines your style.
2. Draft all 12 SVGs.
3. Run `python3 /home/claude/liskins/make_preview.py <skin-id>` — it validates files and
   renders `skins/<skin-id>/preview.png`.
4. **View the PNG with the Read tool** and critique it honestly: blank/broken cells?
   muddled silhouettes? sides confusable? unreadable at 45px? off-theme? ugly?
5. Fix and repeat. Minimum 2 full render-and-look iterations; never finish without
   viewing your final preview.

Do not create or modify anything outside your own `skins/<skin-id>/` directory.
