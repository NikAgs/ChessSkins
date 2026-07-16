#!/usr/bin/env python3
"""Validate a board theme and render its preview with pieces on top (two sizes).
Usage: python3 make_board_preview.py <board-id> [--out <png>]"""
import os, sys, subprocess, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
PIECES = os.path.join(ROOT, "skins", "goofball")
BACK = ["R", "N", "B", "Q", "K", "B", "N", "R"]

def fail(msg):
    print("FAIL:", msg); sys.exit(1)

def main():
    bid = sys.argv[1]
    bdir = os.path.join(ROOT, "boards", bid)
    out = os.path.join(bdir, "preview.png")
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
    svg_path = os.path.join(bdir, "board.svg")
    if not os.path.isfile(svg_path):
        fail(f"missing {svg_path}")

    raw = open(svg_path).read()
    issues = []
    if len(raw) > 70000:
        issues.append(f"board.svg is {len(raw)}B (>70KB)")
    low = raw.lower()
    for bad in ("<script", "<image", "<text", "<foreignobject", 'href="http', "url(http", "xlink:href", "<style", "onload="):
        if bad in low:
            issues.append(f"board.svg contains forbidden '{bad}'")
    try:
        root = ET.fromstring(raw)
        vb = root.attrib.get("viewBox", "")
        if vb.replace(",", " ").split() != ["0", "0", "800", "800"]:
            issues.append(f'viewBox must be "0 0 800 800" (got "{vb}")')
    except ET.ParseError as e:
        fail(f"board.svg XML parse error: {e}")
    if not os.path.isfile(os.path.join(bdir, "meta.json")):
        issues.append("missing meta.json")
    if issues:
        print("VALIDATION ISSUES:")
        [print(" -", i) for i in issues]

    def board_div(px):
        sq = px / 8
        ranks = [[f"b{p}" for p in BACK], ["bP"] * 8, None, None, None, None, ["wP"] * 8, [f"w{p}" for p in BACK]]
        imgs = ""
        for r, rank in enumerate(ranks):
            if not rank:
                continue
            for c, code in enumerate(rank):
                imgs += (f'<img src="{PIECES}/{code}.svg" style="position:absolute;'
                         f'left:{c*sq+sq*0.04}px;top:{r*sq+sq*0.04}px;width:{sq*0.92}px;height:{sq*0.92}px">')
        return (f'<div style="position:relative;width:{px}px;height:{px}px;flex:none;'
                f'background:url(\'board.svg\');background-size:cover">{imgs}</div>')

    html = os.path.join(bdir, "_preview.html")
    with open(html, "w") as f:
        f.write('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#22201d;'
                'display:flex;gap:16px;align-items:flex-start;padding:12px">'
                + board_div(480) + board_div(240) + "</body>")
    r = subprocess.run([CHROME, "--no-sandbox", "--disable-gpu", f"--screenshot={out}",
                        "--window-size=780,510", "--hide-scrollbars", "--virtual-time-budget=4000",
                        f"file://{html}"], capture_output=True, text=True, timeout=60)
    os.remove(html)
    if not os.path.isfile(out):
        fail("chromium produced no screenshot: " + r.stderr[-300:])
    print(("OK" if not issues else "RENDERED WITH ISSUES") + " ->", out)

if __name__ == "__main__":
    main()
