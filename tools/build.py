#!/usr/bin/env python3
"""Build the LiSkins extension from the skins/ art directory.

- validates every skin (12 SVGs + meta.json)
- copies SVGs + meta into extension/skins/<id>/
- generates skins/<id>/skin.css (12 !important rules with data-URI SVGs)
- generates extension/skins/index.json (catalog, Goofball pinned first)
- zips the extension into dist/liskins.zip

Usage: python3 tools/build.py [--no-zip]
"""
import os, sys, json, shutil, urllib.parse, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKINS = os.path.join(ROOT, "skins")
EXT = os.path.join(ROOT, "extension")
DIST = os.path.join(ROOT, "dist")

CODES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"]
NAMES = {"K": "king", "Q": "queen", "R": "rook", "B": "bishop", "N": "knight", "P": "pawn"}
COLORS = {"w": "white", "b": "black"}


def build_skin(skin_id):
    src = os.path.join(SKINS, skin_id)
    meta_path = os.path.join(src, "meta.json")
    if not os.path.isfile(meta_path):
        return None, [f"{skin_id}: missing meta.json"]
    try:
        meta = json.load(open(meta_path))
    except json.JSONDecodeError as e:
        return None, [f"{skin_id}: meta.json invalid ({e})"]
    errors = [f"{skin_id}: missing {c}.svg" for c in CODES
              if not os.path.isfile(os.path.join(src, f"{c}.svg"))]
    if errors:
        return None, errors

    dst = os.path.join(EXT, "skins", skin_id)
    os.makedirs(dst, exist_ok=True)
    rules = []
    for code in CODES:
        svg = open(os.path.join(src, f"{code}.svg")).read()
        shutil.copyfile(os.path.join(src, f"{code}.svg"), os.path.join(dst, f"{code}.svg"))
        uri = "data:image/svg+xml," + urllib.parse.quote(svg, safe="~()*!.'")
        rules.append(
            f'piece.{COLORS[code[0]]}.{NAMES[code[1]]}{{background-image:url("{uri}") !important;}}'
        )
    with open(os.path.join(dst, "skin.css"), "w") as f:
        f.write("\n".join(rules))
    shutil.copyfile(meta_path, os.path.join(dst, "meta.json"))
    return meta, []


def main():
    ids = sorted(d for d in os.listdir(SKINS) if os.path.isdir(os.path.join(SKINS, d)))
    ext_skins = os.path.join(EXT, "skins")
    if os.path.isdir(ext_skins):
        shutil.rmtree(ext_skins)

    catalog, all_errors = [], []
    for skin_id in ids:
        meta, errors = build_skin(skin_id)
        all_errors += errors
        if meta:
            catalog.append({k: meta.get(k, "") for k in ("id", "name", "tagline", "style")})

    # Goofball (the original) first, everything else alphabetical by name
    catalog.sort(key=lambda m: (m["id"] != "goofball", m["name"].lower()))
    with open(os.path.join(ext_skins, "index.json"), "w") as f:
        json.dump(catalog, f, indent=1)

    if all_errors:
        print("SKIPPED / ERRORS:")
        [print(" -", e) for e in all_errors]
    print(f"built {len(catalog)} skins into extension/skins/")

    if "--no-zip" not in sys.argv:
        os.makedirs(DIST, exist_ok=True)
        zpath = os.path.join(DIST, "liskins.zip")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            for base, _, files in os.walk(EXT):
                for fn in files:
                    p = os.path.join(base, fn)
                    z.write(p, os.path.relpath(p, EXT))
        print("zipped ->", zpath, f"({os.path.getsize(zpath)//1024} KB)")

    return 1 if all_errors else 0


if __name__ == "__main__":
    sys.exit(main())
