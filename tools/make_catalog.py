#!/usr/bin/env python3
"""Render docs/catalog.png — a grid of every complete skin in skins/.

A skin is "complete" when it has all 12 piece SVGs plus a valid meta.json.
Each cell shows the skin name over a 4-rank mini board (black back rank +
pawns on top, white pawns + back rank below). Re-runnable at any time; the
grid simply grows as the art fleet lands more skins.

Usage: python3 tools/make_catalog.py
Requires a headless Chromium (override path with CHROME_BIN).
"""
import json
import math
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKINS = os.path.join(ROOT, "skins")
OUT = os.path.join(ROOT, "docs", "catalog.png")

CODES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"]
BACK = ["R", "N", "B", "Q", "K", "B", "N", "R"]

# ---- layout constants (all px; height is computed from these) ----
PAGE_W = 1400
COLS = 4
PAD_X, PAD_TOP, PAD_BOTTOM = 36, 30, 40
TITLE_H = 66
GAP = 22
CARD_BORDER, CARD_PAD, NAME_H = 2, 12, 30
CELL_W = (PAGE_W - 2 * PAD_X - (COLS - 1) * GAP) // COLS          # 315
BOARD_W = CELL_W - 2 * CARD_BORDER - 2 * CARD_PAD                 # 287
BOARD_H = BOARD_W // 2                                            # 4 ranks, 8 files
CARD_H = 2 * CARD_BORDER + 2 * CARD_PAD + NAME_H + BOARD_H


def chrome_bin():
    for c in [os.environ.get("CHROME_BIN"),
              "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
              shutil.which("chromium"), shutil.which("chromium-browser"),
              shutil.which("google-chrome"), shutil.which("headless_shell")]:
        if c and os.path.exists(c):
            return c
    sys.exit("No headless Chromium found — set CHROME_BIN.")


def complete_skins():
    out = []
    for sid in sorted(os.listdir(SKINS)):
        d = os.path.join(SKINS, sid)
        if not os.path.isdir(d) or sid.startswith("_"):
            continue
        if not all(os.path.isfile(os.path.join(d, c + ".svg")) for c in CODES):
            continue
        try:
            meta = json.load(open(os.path.join(d, "meta.json")))
        except (OSError, json.JSONDecodeError):
            continue
        out.append({"id": sid, "name": meta.get("name", sid)})
    # Goofball (the original) first, the rest alphabetical by display name
    out.sort(key=lambda s: (s["id"] != "goofball", s["name"].lower()))
    return out


def board_html(sid):
    ranks = [["b" + p for p in BACK], ["bP"] * 8, ["wP"] * 8, ["w" + p for p in BACK]]
    cells = []
    for r, rank in enumerate(ranks):
        for c, code in enumerate(rank):
            sq = "l" if (r + c) % 2 == 0 else "d"
            cells.append(f'<div class="sq {sq}"><img src="skins/{sid}/{code}.svg"></div>')
    return "".join(cells)


def page_html(skins):
    cards = "".join(
        f'<div class="card"><div class="name">{s["name"]}</div>'
        f'<div class="board">{board_html(s["id"])}</div></div>'
        for s in skins
    )
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
  * {{ box-sizing: border-box; margin: 0; }}
  body {{ width: {PAGE_W}px; background: #f6efe3; color: #3d3833;
          font-family: system-ui, sans-serif;
          padding: {PAD_TOP}px {PAD_X}px {PAD_BOTTOM}px; }}
  h1 {{ height: {TITLE_H}px; font-size: 34px; font-weight: 800; letter-spacing: -.3px; }}
  h1 small {{ color: #8a7f6d; font-weight: 500; font-size: 16px; margin-left: 14px; letter-spacing: 0; }}
  .grid {{ display: grid; grid-template-columns: repeat({COLS}, {CELL_W}px); gap: {GAP}px; }}
  .card {{ width: {CELL_W}px; height: {CARD_H}px; background: #fffaf1;
           border: {CARD_BORDER}px solid #e3d8c4; border-radius: 14px; padding: {CARD_PAD}px; }}
  .name {{ height: {NAME_H}px; font-weight: 700; font-size: 16.5px; line-height: 22px; }}
  .board {{ display: grid; grid-template-columns: repeat(8, 1fr);
            width: {BOARD_W}px; height: {BOARD_H}px; border-radius: 8px; overflow: hidden; }}
  .sq {{ position: relative; }}
  .sq.l {{ background: #f0d9b5; }} .sq.d {{ background: #b58863; }}
  .sq img {{ position: absolute; inset: 4%; width: 92%; height: 92%; }}
</style></head><body>
  <h1>ChessSkins — the catalog<small>{len(skins)} complete skins</small></h1>
  <div class="grid">{cards}</div>
</body></html>"""


def main():
    skins = complete_skins()
    if not skins:
        sys.exit("No complete skins found in skins/.")
    rows = math.ceil(len(skins) / COLS)
    height = PAD_TOP + TITLE_H + rows * CARD_H + (rows - 1) * GAP + PAD_BOTTOM

    tmp = os.path.join(ROOT, "_catalog_tmp.html")
    with open(tmp, "w") as f:
        f.write(page_html(skins))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    try:
        subprocess.run(
            [chrome_bin(), "--no-sandbox", "--disable-gpu",
             "--virtual-time-budget=6000", "--hide-scrollbars",
             f"--screenshot={OUT}", f"--window-size={PAGE_W}x{height}",
             "file://" + tmp],
            check=True, capture_output=True)
    finally:
        os.remove(tmp)
    print(f"wrote {OUT} ({PAGE_W}x{height}, {len(skins)} skins)")


if __name__ == "__main__":
    main()
