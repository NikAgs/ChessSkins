#!/usr/bin/env python3
"""Validate a skin submission JSON (from the ChessSkins creator / issue form).

Usage: python3 tools/validate_submission.py <file.json>
       cat skin.json | python3 tools/validate_submission.py -

Prints errors; exit 0 = valid. With --write, also writes skins/<id>/ files.
"""
import json, os, re, sys
import xml.etree.ElementTree as ET

CODES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"]
FORBIDDEN = ["<script", "<image", "<text", "<style", "<foreignobject",
             'href="http', "url(http", "xlink:href", "javascript:",
             "onload=", "onerror=", "onclick="]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def validate(obj):
    errs = []
    if not isinstance(obj, dict):
        return ["Submission is not a JSON object."]
    sid = obj.get("id", "")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", sid):
        errs.append("id must be kebab-case (e.g. sushi-set).")
    elif os.path.isdir(os.path.join(ROOT, "skins", sid)):
        errs.append(f'id "{sid}" already exists in the catalog — pick another.')
    if not obj.get("name"):
        errs.append("Missing name.")
    if not obj.get("tagline"):
        errs.append("Missing tagline.")
    pieces = obj.get("pieces")
    if not isinstance(pieces, dict):
        return errs + ["Missing pieces map."]
    for code in CODES:
        svg = pieces.get(code)
        if not svg:
            errs.append(f"Missing piece {code}.")
            continue
        low = svg.lower()
        if "<svg" not in low:
            errs.append(f"{code}: not an <svg> element.")
        if "viewbox" not in low:
            errs.append(f"{code}: missing viewBox.")
        if len(svg) > 12000:
            errs.append(f"{code}: too large ({len(svg)} chars, max ~12000).")
        for bad in FORBIDDEN:
            if bad in low:
                errs.append(f'{code}: forbidden content "{bad}".')
        try:
            ET.fromstring(svg)
        except ET.ParseError as e:
            errs.append(f"{code}: invalid SVG/XML ({e}).")
    return errs


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "-"
    raw = sys.stdin.read() if src == "-" else open(src).read()
    # tolerate fenced blocks / surrounding prose
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if m:
        raw = m.group(1)
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        print("ERROR: no JSON object found")
        return 1
    try:
        obj = json.loads(raw[start:end + 1])
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON ({e})")
        return 1

    errs = validate(obj)
    if errs:
        print("VALIDATION FAILED:")
        for e in errs:
            print(" -", e)
        return 1

    print(f"OK: {obj['id']} ({obj['name']}) — 12 pieces valid")
    if "--write" in sys.argv:
        sdir = os.path.join(ROOT, "skins", obj["id"])
        os.makedirs(sdir, exist_ok=True)
        for code in CODES:
            with open(os.path.join(sdir, f"{code}.svg"), "w") as f:
                f.write(obj["pieces"][code])
        meta = {k: obj.get(k, "") for k in ("id", "name", "tagline", "style")}
        with open(os.path.join(sdir, "meta.json"), "w") as f:
            json.dump(meta, f, indent=1)
        print("wrote", sdir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
