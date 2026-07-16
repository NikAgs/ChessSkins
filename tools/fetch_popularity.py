#!/usr/bin/env python3
"""Gather skin popularity from GitHub 👍 reactions at BUILD time (zero runtime tracking).

Counts +1 reactions on:
- issues labeled "skin-submission" (community submissions), and
- pull requests whose head branch is skin/<id>

Writes data/popularity.json as {"<skin-id>": <count>}. Never fails the build:
network/auth problems produce an empty/unchanged file and exit 0.

Usage: [GITHUB_TOKEN=...] python3 tools/fetch_popularity.py
"""
import json, os, re, sys, urllib.request

REPO = "NikAgs/ChessSkins"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "popularity.json")


def gh(path):
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        headers={
            "Accept": "application/vnd.github+json",
            **({"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}"}
               if os.environ.get("GITHUB_TOKEN") else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def skin_id_from(issue):
    m = re.search(r'"id"\s*:\s*"([a-z0-9-]+)"', issue.get("body") or "")
    if m:
        return m.group(1)
    m = re.search(r"\[skin\]\s*(.+)", issue.get("title") or "", re.I)
    if m:
        return re.sub(r"[^a-z0-9]+", "-", m.group(1).strip().lower()).strip("-")
    return None


def main():
    counts = {}
    try:
        issues = gh(f"/repos/{REPO}/issues?labels=skin-submission&state=all&per_page=100")
        for it in issues:
            sid = skin_id_from(it)
            if sid:
                counts[sid] = counts.get(sid, 0) + (it.get("reactions", {}).get("+1", 0))
        pulls = gh(f"/repos/{REPO}/pulls?state=all&per_page=100")
        for pr in pulls:
            ref = pr.get("head", {}).get("ref", "")
            if ref.startswith("skin/"):
                sid = ref[len("skin/"):]
                counts[sid] = counts.get(sid, 0) + (pr.get("reactions", {}).get("+1", 0))
    except Exception as e:  # noqa: BLE001 — popularity is best-effort by design
        print(f"popularity: skipped ({type(e).__name__}: {e})")
        if not os.path.isfile(OUT):
            os.makedirs(os.path.dirname(OUT), exist_ok=True)
            json.dump({}, open(OUT, "w"))
        return 0

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump({k: v for k, v in counts.items() if v > 0}, open(OUT, "w"), indent=1)
    print(f"popularity: wrote {OUT} ({len(counts)} skins seen)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
