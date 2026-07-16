#!/usr/bin/env python3
"""Generate the 'Goofball' lichess piece set: 6 pieces x 2 colors, goofy hand-drawn style."""
import os, html

OUT = os.path.join(os.path.dirname(__file__), "pieces")
os.makedirs(OUT, exist_ok=True)

# palette
WHITE = dict(fill="#ffffff", line="#3d3833")
BLACK = dict(fill="#312d2a", line="#e9e5df")

W_MAIN = 5      # main outline stroke
W_FACE = 3.4    # face / detail stroke

def svg(body):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'<g stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>'
    )

def base(c, x=26, w=48, y=81.5):
    """shared rounded plinth"""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="11" rx="5.5" '
            f'fill="{c["fill"]}" stroke="{c["line"]}" stroke-width="{W_MAIN}"/>')

def eyes(c, lx, rx, y, r=2.1):
    return (f'<circle cx="{lx}" cy="{y}" r="{r}" fill="{c["line"]}" stroke="none"/>'
            f'<circle cx="{rx}" cy="{y}" r="{r}" fill="{c["line"]}" stroke="none"/>')

def smile(c, x1, y1, mx, my, x2, y2):
    return (f'<path d="M{x1},{y1} Q{mx},{my} {x2},{y2}" fill="none" '
            f'stroke="{c["line"]}" stroke-width="{W_FACE}"/>')

# ---------------------------------------------------------------- pieces ----

def pawn(c):
    body = f'''
    <path d="M42,46 C39,58 34,66 31,81.5 L69,81.5 C66,66 61,58 58,46 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <circle cx="50" cy="32" r="14.5" fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <rect x="36.5" y="44" width="27" height="8" rx="4"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    {eyes(c, 44.5, 55.5, 29.5)}
    {smile(c, 45, 36, 50, 40.5, 55, 36)}
    '''
    return svg(body + base(c, x=28, w=44))

def knight(c):
    # goofy horse head facing left, like the reference
    body = f'''
    <path d="M37,81.5
             C37,66 39,56 36,50
             C30,49 21,47 17.5,41
             C15,36.5 16,30 20,26.5
             C27,20.5 38,19 44,15
             C47,13 48.5,9 51,9
             C53.5,9 54,12.5 56,14.5
             C63,20 68,30 69.5,43
             C71,55 70,68 69,81.5 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <circle cx="47" cy="26.5" r="2.6" fill="{c['line']}" stroke="none"/>
    <path d="M19,39.5 Q25,43 31,42.5" fill="none" stroke="{c['line']}" stroke-width="{W_FACE}"/>
    <circle cx="23.5" cy="32.5" r="1.8" fill="{c['line']}" stroke="none"/>
    <path d="M56,16 Q60,26 61,34" fill="none" stroke="{c['line']}" stroke-width="{W_FACE}"/>
    '''
    return svg(body + base(c))

def bishop(c):
    body = f'''
    <path d="M50,20 C62,26 67,38 67,50 C67,64 60,72 50,72 C40,72 33,64 33,50 C33,38 38,26 50,20 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <circle cx="50" cy="13.5" r="5.5" fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <path d="M52,26 L61,37" fill="none" stroke="{c['line']}" stroke-width="{W_FACE}"/>
    <rect x="34" y="70" width="32" height="8" rx="4"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    {eyes(c, 44, 56, 47)}
    {smile(c, 45.5, 54, 50, 58, 54.5, 54)}
    '''
    return svg(body + base(c, x=27, w=46))

def rook(c):
    body = f'''
    <path d="M31,30 L31,18 L40,18 L40,25 L45.5,25 L45.5,16 L54.5,16 L54.5,25 L60,25 L60,18 L69,18 L69,30
             L64,36 L64,72 L69,78 L69,81.5 L31,81.5 L31,78 L36,72 L36,36 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    {eyes(c, 44, 56, 48)}
    <path d="M44.5,57 Q50,59.5 55.5,57" fill="none" stroke="{c['line']}" stroke-width="{W_FACE}"/>
    '''
    return svg(body + base(c))

def queen(c):
    body = f'''
    <path d="M36,32 C31,48 28,62 27,81.5 L73,81.5 C72,62 69,48 64,32 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <path d="M35,33 L31,14 L42,24 L50,9 L58,24 L69,14 L65,33 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <circle cx="31" cy="12" r="3.4" fill="{c['fill']}" stroke="{c['line']}" stroke-width="3.4"/>
    <circle cx="50" cy="7" r="3.4" fill="{c['fill']}" stroke="{c['line']}" stroke-width="3.4"/>
    <circle cx="69" cy="12" r="3.4" fill="{c['fill']}" stroke="{c['line']}" stroke-width="3.4"/>
    <path d="M40,47 Q43,42.5 46,47" fill="none" stroke="{c['line']}" stroke-width="{W_FACE}"/>
    <path d="M54,47 Q57,42.5 60,47" fill="none" stroke="{c['line']}" stroke-width="{W_FACE}"/>
    {smile(c, 44, 55, 50, 61, 56, 55)}
    '''
    return svg(body + base(c, x=24, w=52))

def king(c):
    body = f'''
    <path d="M37,34 C31,50 28,62 27,81.5 L73,81.5 C72,62 69,50 63,34 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <path d="M35,34 L34,20 Q41,25.5 50,25 Q59,25.5 66,20 L65,34 Z"
          fill="{c['fill']}" stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    <path d="M50,19 L50,5.5 M43.5,12 L56.5,12" fill="none"
          stroke="{c['line']}" stroke-width="{W_MAIN}"/>
    {eyes(c, 43, 57, 45.5, r=2.4)}
    <path d="M42.5,52.5 Q50,62.5 57.5,52.5 Q50,55.5 42.5,52.5 Z"
          fill="{c['line']}" stroke="{c['line']}" stroke-width="2.2"/>
    '''
    return svg(body + base(c, x=24, w=52))

PIECES = dict(pawn=pawn, knight=knight, bishop=bishop, rook=rook, queen=queen, king=king)
COLORS = dict(w=WHITE, b=BLACK)

for pname, fn in PIECES.items():
    for cname, c in COLORS.items():
        with open(os.path.join(OUT, f"{cname}{pname[0].upper() if pname!='knight' else 'N'}.svg"), "w") as f:
            # lichess-style names: wP wN wB wR wQ wK / bP ...
            f.write(fn(c))

# ---------------------------------------------------------------- preview ---
sq_light, sq_dark = "#f0d9b5", "#b58863"
cells = []
for cname in ("w", "b"):
    for i, pname in enumerate(["king", "queen", "rook", "bishop", "knight", "pawn"]):
        code = f"{cname}{pname[0].upper() if pname!='knight' else 'N'}"
        for j, sq in enumerate((sq_light, sq_dark)):
            cells.append(f'<div class="sq" style="background:{sq}"><img src="pieces/{code}.svg"></div>')

rows = ""
n = 6  # pieces per row
for r in range(0, len(cells), 12):
    pass
# layout: 4 rows x 6 cols: white/light, white/dark, black/light, black/dark
order = []
for cname in ("w", "b"):
    for j, sq in enumerate((sq_light, sq_dark)):
        row = ""
        for pname in ["king", "queen", "rook", "bishop", "knight", "pawn"]:
            code = f"{cname}{pname[0].upper() if pname!='knight' else 'N'}"
            row += f'<div class="sq" style="background:{sq}"><img src="pieces/{code}.svg"></div>'
        order.append(f'<div class="row">{row}</div>')

with open(os.path.join(os.path.dirname(__file__), "preview.html"), "w") as f:
    f.write(f'''<!doctype html><meta charset="utf-8"><style>
    body{{margin:0;background:#22201d;display:flex;flex-direction:column;align-items:center;padding:14px;gap:0}}
    .row{{display:flex}}
    .sq{{width:130px;height:130px;display:flex;align-items:center;justify-content:center}}
    .sq img{{width:118px;height:118px}}
    </style>{''.join(order)}''')

print("wrote", len(PIECES) * 2, "svgs + preview.html")
