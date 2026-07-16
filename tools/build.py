#!/usr/bin/env python3
"""Build the ChessSkins extension from the skins/ art directory.

- validates every skin (12 SVGs + meta.json)
- copies SVGs + meta into extension/skins/<id>/
- generates skins/<id>/skin.css — rules for BOTH lichess and chess.com
- generates extension/skins/index.json (catalog with categories, Goofball first)
- zips the extension into dist/chessskins.zip

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

CATEGORIES = {
    "Cute": ["goofball", "kittens", "puppies", "woodland", "polar", "critter-royale",
             "duckies", "garden-bugs", "deep-sea", "dinos", "monster-mash"],
    "Food": ["snack-attack", "sweet-tooth"],
    "Retro & Sci-Fi": ["pixel", "invaders", "robots", "cosmos", "neon-grid"],
    "Adventure": ["high-seas", "valhalla", "dojo", "wild-west", "spellbound", "spooky"],
    "Style": ["thin-line", "midnight-gothic", "doodle"],
}
CATEGORY_OF = {sid: cat for cat, ids in CATEGORIES.items() for sid in ids}


def selectors(code):
    """CSS selectors covering lichess (<piece class='white pawn'>) and
    chess.com (<div class='piece wp'> + promotion windows)."""
    lichess = f"piece.{COLORS[code[0]]}.{NAMES[code[1]]}"
    cc = code.lower()
    return f"{lichess}, .piece.{cc}, .promotion-piece.{cc}"


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
        rules.append(f'{selectors(code)}{{background-image:url("{uri}") !important;}}')
    with open(os.path.join(dst, "skin.css"), "w") as f:
        f.write("\n".join(rules))
    shutil.copyfile(meta_path, os.path.join(dst, "meta.json"))
    return meta, []


BOARDS = os.path.join(ROOT, "boards")


def build_board(board_id):
    src = os.path.join(BOARDS, board_id)
    meta_path = os.path.join(src, "meta.json")
    svg_path = os.path.join(src, "board.svg")
    if not os.path.isfile(meta_path) or not os.path.isfile(svg_path):
        return None, [f"board {board_id}: missing board.svg or meta.json"]
    try:
        meta = json.load(open(meta_path))
    except json.JSONDecodeError as e:
        return None, [f"board {board_id}: meta.json invalid ({e})"]

    dst = os.path.join(EXT, "boards", board_id)
    os.makedirs(dst, exist_ok=True)
    svg = open(svg_path).read()
    shutil.copyfile(svg_path, os.path.join(dst, "board.svg"))
    shutil.copyfile(meta_path, os.path.join(dst, "meta.json"))
    uri = "data:image/svg+xml," + urllib.parse.quote(svg, safe="~()*!.'")
    css = (
        f'cg-board{{background-image:url("{uri}") !important;background-size:cover !important;}}\n'
        f'wc-chess-board,chess-board{{background-image:url("{uri}") !important;'
        f'background-size:100% 100% !important;}}'
    )
    with open(os.path.join(dst, "board.css"), "w") as f:
        f.write(css)
    return meta, []


def main():
    ids = sorted(d for d in os.listdir(SKINS) if os.path.isdir(os.path.join(SKINS, d)))
    ext_skins = os.path.join(EXT, "skins")
    if os.path.isdir(ext_skins):
        shutil.rmtree(ext_skins)
    os.makedirs(ext_skins, exist_ok=True)
    ext_boards = os.path.join(EXT, "boards")
    if os.path.isdir(ext_boards):
        shutil.rmtree(ext_boards)
    os.makedirs(ext_boards, exist_ok=True)

    likes_path = os.path.join(ROOT, "data", "popularity.json")
    likes = {}
    if os.path.isfile(likes_path):
        try:
            likes = json.load(open(likes_path))
        except json.JSONDecodeError:
            pass

    catalog, all_errors = [], []
    for skin_id in ids:
        meta, errors = build_skin(skin_id)
        all_errors += errors
        if meta:
            entry = {k: meta.get(k, "") for k in ("id", "name", "tagline", "style")}
            entry["category"] = CATEGORY_OF.get(skin_id, "More")
            entry["likes"] = int(likes.get(skin_id, 0))
            catalog.append(entry)

    # Goofball (the original) first, everything else alphabetical by name
    catalog.sort(key=lambda m: (m["id"] != "goofball", m["name"].lower()))
    with open(os.path.join(ext_skins, "index.json"), "w") as f:
        json.dump(catalog, f, indent=1)

    board_ids = sorted(d for d in os.listdir(BOARDS)
                       if os.path.isdir(os.path.join(BOARDS, d)) and not d.startswith("_")) \
        if os.path.isdir(BOARDS) else []
    board_catalog = []
    for board_id in board_ids:
        meta, errors = build_board(board_id)
        all_errors += errors
        if meta:
            board_catalog.append({k: meta.get(k, "") for k in ("id", "name", "tagline", "colors")})
    board_catalog.sort(key=lambda m: (m["id"] != "classic", m["name"].lower()))
    with open(os.path.join(ext_boards, "index.json"), "w") as f:
        json.dump(board_catalog, f, indent=1)
    print(f"built {len(board_catalog)} board themes into extension/boards/")

    if all_errors:
        print("SKIPPED / ERRORS:")
        [print(" -", e) for e in all_errors]
    print(f"built {len(catalog)} skins into extension/skins/")

    if "--no-zip" not in sys.argv:
        os.makedirs(DIST, exist_ok=True)

        def make_zip(zpath, manifest_override=None):
            with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
                for base, _, files in os.walk(EXT):
                    for fn in files:
                        p = os.path.join(base, fn)
                        rel = os.path.relpath(p, EXT)
                        if rel == "manifest.json" and manifest_override is not None:
                            z.writestr(rel, manifest_override)
                        else:
                            z.write(p, rel)
            print("zipped ->", zpath, f"({os.path.getsize(zpath)//1024} KB)")

        make_zip(os.path.join(DIST, "chessskins.zip"))

        # Firefox variant: same package + gecko app id (required for AMO signing)
        ff_manifest = json.load(open(os.path.join(EXT, "manifest.json")))
        ff_manifest["browser_specific_settings"] = {
            "gecko": {"id": "chessskins@nikags.github.io", "strict_min_version": "115.0"}
        }
        make_zip(os.path.join(DIST, "chessskins-firefox.zip"),
                 json.dumps(ff_manifest, indent=2))

    return 1 if all_errors else 0


if __name__ == "__main__":
    sys.exit(main())
