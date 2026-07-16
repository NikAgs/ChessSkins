#!/usr/bin/env python3
"""Generate the Cosmos skin SVGs (white + black armies from shared templates)."""
import os

D = os.path.dirname(os.path.abspath(__file__))

WHITE = dict(
    OUT="#2e2a52",      # outline / detail color (dark navy)
    BODY="#fdf3d8",     # cream body
    SUN="#fbdc86",      # sun disc (white king)
    GOLD="#f4b942",     # accents
    CHEEK="#f2a25c",
    WIN="#333b6e",      # porthole space
    WINSTAR="#fdf3d8",
    GLASS="#cfe9f7", GO="0.5",
)
BLACK = dict(
    OUT="#f2ecdc",      # light outline
    BODY="#303566",     # space navy body
    SUN="#303566",
    GOLD="#f4b942",
    CHEEK="#8b90c4",
    WIN="#4a519b",
    WINSTAR="#fdf3d8",
    GLASS="#aebef5", GO="0.35",
)

HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<g stroke-linecap="round" stroke-linejoin="round">')
TAIL = '</g></svg>'

def plinth(x, w):
    return (f'<rect x="{x}" y="81.5" width="{w}" height="11" rx="5.5" '
            f'fill="{{BODY}}" stroke="{{OUT}}" stroke-width="5"/>')

K = HEAD + plinth(26, 48) + '''
<path d="M41,81.5 L43,56 L57,56 L59,81.5 Z" fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M59.0,24.6 L70.5,18.5 L64.4,30.0 Z M66.6,35.2 L79,39 L66.6,42.8 Z
         M64.4,48.0 L70.5,59.5 L59.0,53.4 Z M41.0,53.4 L29.5,59.5 L35.6,48.0 Z
         M33.4,42.8 L21,39 L33.4,35.2 Z M35.6,30.0 L29.5,18.5 L41.0,24.6 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<circle cx="50" cy="39" r="19.5" fill="{SUN}" stroke="{OUT}" stroke-width="5"/>
<path d="M41,22 L40,10.5 L45.5,15 L50,6.5 L54.5,15 L60,10.5 L59,22 Q50,18.5 41,22 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<circle cx="43.5" cy="36.5" r="2.4" fill="{OUT}" stroke="none"/>
<circle cx="56.5" cy="36.5" r="2.4" fill="{OUT}" stroke="none"/>
<path d="M43,43.5 Q50,49.5 57,43.5" fill="none" stroke="{OUT}" stroke-width="3.4"/>
<circle cx="38.5" cy="42" r="2.3" fill="{CHEEK}" stroke="none"/>
<circle cx="61.5" cy="42" r="2.3" fill="{CHEEK}" stroke="none"/>
''' + TAIL

Q = HEAD + plinth(27, 46) + '''
<path d="M42,81.5 L43.5,58 L56.5,58 L58.5,81.5 Z" fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M68.8,20.4 A24,24 0 1 1 68.8,59.6 A20,20 0 1 1 68.8,20.4 Z"
      fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M60,17.5 L61,9 L64.5,13 L66.5,6.5 L68.5,13 L72,9 L73,17.5 Q66.5,14 60,17.5 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<path d="M34,34 Q37.5,38 41,34" fill="none" stroke="{OUT}" stroke-width="3.2"/>
<path d="M36,45 Q39.5,48.5 43,45" fill="none" stroke="{OUT}" stroke-width="3.2"/>
<circle cx="33.5" cy="40.5" r="2.1" fill="{CHEEK}" stroke="none"/>
<path d="M55,33.5 L56.8,38.2 L61.5,40 L56.8,41.8 L55,46.5 L53.2,41.8 L48.5,40 L53.2,38.2 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="2"/>
<circle cx="60" cy="51" r="1.7" fill="{GOLD}" stroke="{OUT}" stroke-width="1.5"/>
''' + TAIL

R = HEAD + plinth(25, 50) + '''
<path d="M39,50 C29,57 26.5,68 26.5,80 L39,74 Z" fill="{GOLD}" stroke="{OUT}" stroke-width="5"/>
<path d="M61,50 C71,57 73.5,68 73.5,80 L61,74 Z" fill="{GOLD}" stroke="{OUT}" stroke-width="5"/>
<path d="M42.5,68 L39,80 L61,80 L57.5,68 Z" fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<path d="M38,72 L38,32 Q38,14 50,10.5 Q62,14 62,32 L62,72 Z"
      fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M38.6,28 Q42,15.5 50,12 Q58,15.5 61.4,28 Q50,23.5 38.6,28 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<circle cx="50" cy="44" r="9" fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<circle cx="50" cy="44" r="5.6" fill="{WIN}" stroke="{OUT}" stroke-width="2"/>
<circle cx="51.6" cy="42.4" r="1.3" fill="{WINSTAR}" stroke="none"/>
<path d="M23,15.5 L24.5,18.5 L27.5,20 L24.5,21.5 L23,24.5 L21.5,21.5 L18.5,20 L21.5,18.5 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="1.8"/>
<path d="M77,22.5 L78.5,25.5 L81.5,27 L78.5,28.5 L77,31.5 L75.5,28.5 L72.5,27 L75.5,25.5 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="1.8"/>
''' + TAIL

B = HEAD + plinth(26, 48) + '''
<path d="M45,56 L31,81.5 M45,56 L61,81.5 M45,56 L44,81.5" fill="none"
      stroke="{OUT}" stroke-width="5"/>
<path d="M35.4,55.1 L44.6,60.9 L68.6,22.9 L59.4,17.1 Z"
      fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M54.1,25.4 L63.4,31.3 L66.7,25.9 L57.4,20.1 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<circle cx="38.5" cy="59.5" r="4" fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<circle cx="45" cy="55.5" r="4.5" fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<path d="M73,3.5 L74.8,7.7 L79,9.5 L74.8,11.3 L73,15.5 L71.2,11.3 L67,9.5 L71.2,7.7 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="2"/>
''' + TAIL

N = HEAD + plinth(26, 48) + '''
<path d="M36,57 Q32.5,69 32,81.5 L62,81.5 Q61.5,69 58,57 Z"
      fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M47,66 L48.4,68.6 L51,70 L48.4,71.4 L47,74 L45.6,71.4 L43,70 L45.6,68.6 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="1.8"/>
<rect x="33.5" y="51.5" width="27" height="7.5" rx="3.75"
      fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<path d="M29,31.5 Q29,28.5 32.5,28 L40,27 Q42,19.5 49.5,18.5 Q57.5,17.8 60.5,25
         Q62.8,31.5 58.5,37.5 Q53.5,43.5 45.5,42.5 L33,40 Q29.5,39.3 29,35.5 Z"
      fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M55,19.5 Q62,17.5 63.5,24.5 Q64.5,31 59,32 Q60.5,25 55,19.5 Z"
      fill="{GOLD}" stroke="{OUT}" stroke-width="4"/>
<circle cx="30.5" cy="30.5" r="2.5" fill="{OUT}" stroke="none"/>
<circle cx="45.5" cy="28.5" r="2.5" fill="{OUT}" stroke="none"/>
<path d="M35,35.5 Q38.5,38.5 42,35.5" fill="none" stroke="{OUT}" stroke-width="3.2"/>
<circle cx="48" cy="36" r="2.2" fill="{CHEEK}" stroke="none"/>
<circle cx="47" cy="33" r="21" fill="{GLASS}" fill-opacity="{GO}"
        stroke="{OUT}" stroke-width="5"/>
<path d="M33,23.5 Q36,16.5 44,14.8" fill="none" stroke="#ffffff"
      stroke-width="3" stroke-opacity="0.85"/>
''' + TAIL

P = HEAD + plinth(29, 42) + '''
<path d="M44.5,81.5 L45.5,58 L54.5,58 L55.5,81.5 Z" fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<path d="M50,27 L55.9,38.9 L69,40.8 L59.5,50.1 L61.8,63.2 L50,57 L38.2,63.2
         L40.5,50.1 L31,40.8 L44.1,38.9 Z" fill="{BODY}" stroke="{OUT}" stroke-width="5"/>
<circle cx="45.5" cy="44.5" r="2.2" fill="{OUT}" stroke="none"/>
<circle cx="54.5" cy="44.5" r="2.2" fill="{OUT}" stroke="none"/>
<path d="M45.5,49.5 Q50,53.5 54.5,49.5" fill="none" stroke="{OUT}" stroke-width="3.2"/>
<circle cx="41.5" cy="48.5" r="1.9" fill="{CHEEK}" stroke="none"/>
<circle cx="58.5" cy="48.5" r="1.9" fill="{CHEEK}" stroke="none"/>
''' + TAIL

TEMPLATES = dict(K=K, Q=Q, R=R, B=B, N=N, P=P)

for side, pal in (("w", WHITE), ("b", BLACK)):
    for piece, tpl in TEMPLATES.items():
        svg = tpl.format(**pal)
        with open(os.path.join(D, f"{side}{piece}.svg"), "w") as f:
            f.write(svg)
print("wrote 12 svgs")
