"""Generates the Kairos Life wordmark: heavy, condensed block capitals on a
bow-tie perspective (taller at the ends, pinched in the middle), each letter
nudged off-axis for a hand-cut feel. Letters are original polygons drawn on a
grid here, not a font. Writes public/brand/kairos-life-wordmark*.svg."""
import math, random

H = 100.0      # cap height
T = 24.0       # stroke weight
GAP = 10.0     # space between letters

def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]

# Each letter: (width, [polygons]); holes are drawn as separate polygons in the
# same path with even-odd fill. Coordinates: x right, y down, 0..H.
def K(w=60):
    return w, [[(0, 0), (T, 0), (T, 36), (w - 30, 0), (w, 0), (T + 18, 50), (w, H), (w - 28, H), (T + 2, 64), (T, H), (0, H)]]
def A(w=64):
    c = w / 2
    return w, [[(c - 11, 0), (c + 11, 0), (w, H), (w - T, H), (w - T - 5, H - 22), (T + 5, H - 22), (T, H), (0, H)],
               [(c, 26), (c + 9, H - 42), (c - 9, H - 42)]]
def I(w=T + 2):
    return w, [rect(0, 0, w, H)]
def R(w=58):
    return w, [[(0, 0), (w - 16, 0), (w, 14), (w, 42), (w - 12, 54), (w, H), (w - T, H), (w - T - 10, 60), (T, 60), (T, H), (0, H)],
               [(T, T - 4), (w - T - 6, T - 4), (w - T, T + 2), (w - T, 34), (w - T - 6, 40), (T, 40)]]
def O(w=60):
    k = 16
    return w, [[(k, 0), (w - k, 0), (w, k), (w, H - k), (w - k, H), (k, H), (0, H - k), (0, k)],
               [(T + 4, T), (w - T - 4, T), (w - T, T + 6), (w - T, H - T - 6), (w - T - 4, H - T), (T + 4, H - T), (T, H - T - 6), (T, T + 6)]]
def S(w=58):
    return w, [[(14, 0), (w, 0), (w, T - 2), (T + 2, T - 2), (T + 2, 38), (w - 14, 38), (w, 52), (w, H - 14), (w - 14, H), (0, H), (0, H - T + 2), (w - T - 2, H - T + 2), (w - T - 2, 62), (14, 62), (0, 48), (0, 14)]]
def L(w=50):
    return w, [[(0, 0), (T, 0), (T, H - T), (w, H - T), (w, H), (0, H)]]
def F(w=50):
    return w, [[(0, 0), (w, 0), (w, T - 2), (T, T - 2), (T, 40), (w - 6, 40), (w - 6, 60), (T, 60), (T, H), (0, H)]]
def E(w=50):
    return w, [[(0, 0), (w, 0), (w, T - 2), (T, T - 2), (T, 39), (w - 5, 39), (w - 5, 60), (T, 60), (T, H - T + 2), (w, H - T + 2), (w, H), (0, H)]]
GLYPH = {"K": K, "A": A, "I": I, "R": R, "O": O, "S": S, "L": L, "F": F, "E": E}

def layout(word, seed=7):
    rnd = random.Random(seed)
    x, letters = 0.0, []
    for ch in word:
        if ch == " ":
            x += 26; continue
        w, polys = GLYPH[ch]()
        tilt = rnd.uniform(-0.05, 0.05)   # a little hand-cut wobble
        lift = rnd.uniform(-3, 3)
        out = []
        for poly in polys:
            pts = []
            for (px, py) in poly:
                cx, cy = px - w / 2, py - H / 2
                rx = cx * math.cos(tilt) - cy * math.sin(tilt) + w / 2 + x
                ry = cx * math.sin(tilt) + cy * math.cos(tilt) + H / 2 + lift
                pts.append((rx, ry))
            out.append(pts)
        letters.append(out)
        x += w + GAP
    return letters, x - GAP

def warp(letters, width, amount=0.32):
    """Bow-tie perspective: letters grow taller towards both ends."""
    mid = H / 2
    res = []
    for polys in letters:
        res.append([[(px, mid + (py - mid) * (1 + amount * ((px - width / 2) / (width / 2)) ** 2)) for (px, py) in poly] for poly in polys])
    return res

def path_d(letters, ox, oy):
    d = []
    for polys in letters:
        for poly in polys:
            d.append("M" + " L".join(f"{px + ox:.1f} {py + oy:.1f}" for px, py in poly) + " Z")
    return " ".join(d)

def build(word, seed=7):
    letters, width = layout(word, seed)
    letters = warp(letters, width)
    pad = 40
    ys = [py for polys in letters for poly in polys for _, py in poly]
    top, bottom = min(ys), max(ys)
    vb_w, vb_h = width + pad * 2, bottom - top + pad * 2
    return path_d(letters, pad, pad - top), vb_w, vb_h, width, top, bottom, pad

def write():
    d, w, h, width, top, bottom, pad = build("KAIROS LIFE")
    # 1) Solid black wordmark
    open("public/brand/kairos-life-wordmark.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="Kairos Life">'
        f'<path d="{d}" fill="#111" fill-rule="evenodd"/></svg>\n')
    # 2) White letters cut out of a black banner (thick outline merges into one plate)
    open("public/brand/kairos-life-wordmark-badge.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="Kairos Life">'
        f'<path d="{d}" fill="#111" stroke="#111" stroke-width="34" stroke-linejoin="miter" fill-rule="evenodd"/>'
        f'<path d="{d}" fill="#ffffff" fill-rule="evenodd"/></svg>\n')
    # 3) Game colours: gold letters, ink plate, purple shadow, for the menu
    open("public/brand/kairos-life-wordmark-game.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h + 12:.0f}" role="img" aria-label="Kairos Life">'
        f'<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".55" stop-color="#f5c518"/><stop offset="1" stop-color="#e08a00"/></linearGradient></defs>'
        f'<path d="{d}" transform="translate(0 12)" fill="#3a1f6b" stroke="#3a1f6b" stroke-width="34" stroke-linejoin="miter" fill-rule="evenodd"/>'
        f'<path d="{d}" fill="#120c18" stroke="#120c18" stroke-width="34" stroke-linejoin="miter" fill-rule="evenodd"/>'
        f'<path d="{d}" fill="url(#g)" fill-rule="evenodd"/></svg>\n')

if __name__ == "__main__":
    write()
    print("wrote kairos-life-wordmark{,-badge,-game}.svg")
