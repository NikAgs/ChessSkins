#!/usr/bin/env python3
"""Validate a skin and render its contact sheet: big grid + 45px strip.
Usage: python3 make_preview.py <skin-id> [--out <png>]"""
import os, sys, subprocess, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
ORDER = ["K", "Q", "R", "B", "N", "P"]
LIGHT, DARK = "#f0d9b5", "#b58863"

def fail(msg):
    print("FAIL:", msg); sys.exit(1)

def main():
    skin = sys.argv[1]
    sdir = os.path.join(ROOT, "skins", skin)
    out = os.path.join(sdir, "preview.png")
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
    if not os.path.isdir(sdir):
        fail(f"no such skin dir: {sdir}")

    issues = []
    for c in "wb":
        for p in ORDER:
            f = os.path.join(sdir, f"{c}{p}.svg")
            if not os.path.isfile(f):
                issues.append(f"missing {c}{p}.svg"); continue
            raw = open(f).read()
            if len(raw) > 12000:
                issues.append(f"{c}{p}.svg is {len(raw)}B (>12KB)")
            low = raw.lower()
            for bad in ("<script", "<image", "<text", 'href="http', "url(http", "xlink:href", "<style"):
                if bad in low:
                    issues.append(f"{c}{p}.svg contains forbidden '{bad}'")
            try:
                root = ET.fromstring(raw)
                if "viewBox" not in root.attrib:
                    issues.append(f"{c}{p}.svg missing viewBox")
            except ET.ParseError as e:
                issues.append(f"{c}{p}.svg XML parse error: {e}")
    if issues:
        print("VALIDATION ISSUES:")
        [print(" -", i) for i in issues]
        if any("parse error" in i or "missing" in i.split()[0] == "missing" for i in issues):
            pass  # still try to render what exists

    def cell(code, bg, px):
        p = os.path.join(sdir, f"{code}.svg")
        img = f'<img src="{code}.svg" style="width:{px-6}px;height:{px-6}px">' if os.path.isfile(p) else "✗"
        return f'<div style="width:{px}px;height:{px}px;background:{bg};display:flex;align-items:center;justify-content:center">{img}</div>'

    rows = []
    for c in "wb":
        for bg in (LIGHT, DARK):
            cells = "".join(cell(f"{c}{p}", bg, 110) for p in ORDER)
            rows.append(f'<div style="display:flex">{cells}</div>')
    # 45px strip: both armies on alternating squares
    strip = ""
    for i, (c, p) in enumerate([(c, p) for c in "wb" for p in ORDER]):
        strip += cell(f"{c}{p}", LIGHT if i % 2 == 0 else DARK, 45)
    rows.append(f'<div style="display:flex;margin-top:8px">{strip}</div>')

    html = os.path.join(sdir, "_preview.html")
    with open(html, "w") as f:
        f.write(f'<!doctype html><meta charset="utf-8"><body style="margin:0;background:#22201d;'
                f'display:inline-block">{"".join(rows)}</body>')
    w, h = 6 * 110, 4 * 110 + 45 + 8
    r = subprocess.run([CHROME, "--no-sandbox", "--disable-gpu", f"--screenshot={out}",
                        f"--window-size={w},{h}", "--hide-scrollbars", f"file://{html}"],
                       capture_output=True, text=True, timeout=60)
    os.remove(html)
    if not os.path.isfile(out):
        fail("chromium produced no screenshot: " + r.stderr[-300:])
    print(("OK" if not issues else "RENDERED WITH ISSUES") + " ->", out)

if __name__ == "__main__":
    main()
