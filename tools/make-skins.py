"""Kairos skin pack: 60+ original Minecraft-format (64x64) skins, painted on the
standard box-UV layout so they work on the Kairos human and in Minecraft.
Writes public/skins/<id>.png and public/skins/index.json.  python3 tools/make-skins.py"""
import json, os, random
from PIL import Image

OUT = "public/skins"
# Box-UV origins (u, v) and sizes (w, h, d) for each part, base and overlay layers.
PARTS = {
    "head": ((0, 0), (8, 8, 8)), "hat": ((32, 0), (8, 8, 8)),
    "body": ((16, 16), (8, 12, 4)), "jacket": ((16, 32), (8, 12, 4)),
    "rarm": ((40, 16), (4, 12, 4)), "rsleeve": ((40, 32), (4, 12, 4)),
    "larm": ((32, 48), (4, 12, 4)), "lsleeve": ((48, 48), (4, 12, 4)),
    "rleg": ((0, 16), (4, 12, 4)), "rpant": ((0, 32), (4, 12, 4)),
    "lleg": ((16, 48), (4, 12, 4)), "lpant": ((0, 48), (4, 12, 4)),
}

def faces(part):
    (u, v), (w, h, d) = PARTS[part]
    return {"top": (u + d, v, w, d), "bottom": (u + d + w, v, w, d), "right": (u, v + d, d, h),
            "front": (u + d, v + d, w, h), "left": (u + d + w, v + d, d, h), "back": (u + 2 * d + w, v + d, w, h)}

def hexc(c, a=255):
    c = c.lstrip("#"); return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)

def shade(c, f):
    r, g, b, a = c
    if f >= 0: return (int(r + (255 - r) * f), int(g + (255 - g) * f), int(b + (255 - b) * f), a)
    return (int(r * (1 + f)), int(g * (1 + f)), int(b * (1 + f)), a)

class Skin:
    def __init__(self, seed):
        self.img = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); self.px = self.img.load(); self.r = random.Random(seed)
    def put(self, x, y, c):
        if 0 <= x < 64 and 0 <= y < 64: self.px[x, y] = c
    def fill_part(self, part, col, rows=None, noise=0.05, sides=("top", "bottom", "right", "front", "left", "back")):
        """Fill faces of a part; rows=(y0,y1) restricts to rows of the vertical faces (0 = top of limb)."""
        for name, (x, y, w, h) in faces(part).items():
            if name not in sides: continue
            for j in range(h):
                if rows and name not in ("top", "bottom") and not (rows[0] <= j < rows[1]): continue
                if rows and name == "top" and rows[0] > 0: continue
                if rows and name == "bottom" and rows[1] < h: continue
                for i in range(w):
                    self.put(x + i, y + j, shade(col, (self.r.random() - 0.5) * noise * 2))
    def face_px(self, part, face, i, j, col):
        x, y, w, h = faces(part)[face]
        if 0 <= i < w and 0 <= j < h: self.put(x + i, y + j, col)

# ---- building blocks -------------------------------------------------------
SKINS = ["#f2c7a5", "#e9c09a", "#d9a778", "#c08b62", "#a6734d", "#8a5a3c", "#6e4630", "#482e25"]
HAIRS = ["#241a18", "#4e3025", "#8c512e", "#bf7540", "#d7b771", "#d8d5cb", "#1b1b1b"]

def person(s, skin, hair, style, eyes="#2a1d18", beard=False):
    sk = hexc(skin); hc = hexc(hair)
    s.fill_part("head", sk, noise=0.03)
    for limb in ("rarm", "larm"): s.fill_part(limb, sk, noise=0.03)
    for leg in ("rleg", "lleg"): s.fill_part(leg, sk, noise=0.03)
    s.fill_part("body", sk, noise=0.03)
    # hair
    s.fill_part("head", hc, sides=("top",), noise=0.08)
    depth = {"crop": 1, "short": 2, "long": 7, "bob": 5, "afro": 3, "braids": 8, "bald": 0, "puffs": 2, "bun": 2}[style]
    for face in ("right", "left", "back"):
        x, y, w, h = faces("head")[face]
        for j in range(min(h, depth if face != "back" else max(depth, 2 if style != "bald" else 0))):
            for i in range(w): s.put(x + i, y + j, shade(hc, (s.r.random() - .5) * .16))
    x, y, w, h = faces("head")["front"]
    for i in range(w):
        for j in range(1 if style in ("crop", "bald") else 2):
            if style != "bald": s.put(x + i, y + j, shade(hc, (s.r.random() - .5) * .16))
    if style in ("long", "braids", "bob"):
        for j in range(2, 7): s.put(x, y + j, hc); s.put(x + 7, y + j, hc)
    if style == "afro":
        hx, hy, hw, hh = faces("hat")["top"]
        for i in range(hw):
            for j in range(hh): s.put(hx + i, hy + j, shade(hc, (s.r.random() - .5) * .2))
        for face in ("front", "right", "left", "back"):
            fx, fy, fw, fh = faces("hat")[face]
            for i in range(fw):
                for j in range(3 if face == "front" else 6): s.put(fx + i, fy + j, shade(hc, (s.r.random() - .5) * .2))
    if style == "puffs" or style == "bun":
        hx, hy, hw, hh = faces("hat")["top"]
        for (i, j) in ((1, 1), (2, 1), (1, 2), (2, 2), (5, 1), (6, 1), (5, 2), (6, 2)) if style == "puffs" else ((3, 5), (4, 5), (3, 6), (4, 6)):
            s.put(hx + i, hy + j, hc)
    # face: eyes, brows, mouth
    e = hexc(eyes); white = hexc("#ffffff")
    s.put(x + 1, y + 4, white); s.put(x + 2, y + 4, e); s.put(x + 5, y + 4, e); s.put(x + 6, y + 4, white)
    s.put(x + 1, y + 3, shade(hc, -.2)); s.put(x + 2, y + 3, shade(hc, -.2)); s.put(x + 5, y + 3, shade(hc, -.2)); s.put(x + 6, y + 3, shade(hc, -.2))
    s.put(x + 3, y + 5, shade(sk, -.15)); s.put(x + 4, y + 5, shade(sk, -.15))
    s.put(x + 3, y + 6, hexc("#9c4a4a")); s.put(x + 4, y + 6, hexc("#9c4a4a"))
    if beard:
        for i in range(1, 7): s.put(x + i, y + 7, shade(hc, -.1))
        s.put(x + 1, y + 6, hc); s.put(x + 6, y + 6, hc)

def top(s, col, sleeves="long", pattern=None, col2=None, number=None):
    c = hexc(col); c2 = hexc(col2) if col2 else shade(c, -.3)
    s.fill_part("body", c)
    rows = (0, 12) if sleeves == "long" else (0, 4) if sleeves == "short" else (0, 0)
    for arm in ("rarm", "larm"):
        if rows[1]: s.fill_part(arm, c, rows=rows)
    fx, fy, fw, fh = faces("body")["front"]
    bx, by, bw, bh = faces("body")["back"]
    if pattern == "stripes":
        for j in range(0, 12, 2):
            for i in range(8): s.put(fx + i, fy + j, c2); s.put(bx + i, by + j, c2)
    elif pattern == "checks":
        for j in range(12):
            for i in range(8):
                if (i // 2 + j // 2) % 2: s.put(fx + i, fy + j, c2); s.put(bx + i, by + j, c2)
    elif pattern == "camo":
        for _ in range(40): s.put(fx + s.r.randrange(8), fy + s.r.randrange(12), c2); s.put(bx + s.r.randrange(8), by + s.r.randrange(12), shade(c2, .2))
    elif pattern == "zip":
        for j in range(12): s.put(fx + 3, fy + j, c2); s.put(fx + 4, fy + j, shade(c, .15))
    elif pattern == "tie":
        for j in range(12): s.put(fx + 3, fy + j, hexc("#ffffff")); s.put(fx + 4, fy + j, hexc("#ffffff"))
        for j in range(1, 10): s.put(fx + 3, fy + j, c2); s.put(fx + 4, fy + j, c2)
        for j in range(12): s.put(fx + 2, fy + j, shade(c, -.2)); s.put(fx + 5, fy + j, shade(c, -.2))
    elif pattern == "chest-stripe":
        for i in range(8): s.put(fx + i, fy + 5, c2); s.put(fx + i, fy + 6, c2); s.put(bx + i, by + 5, c2); s.put(bx + i, by + 6, c2)
    elif pattern == "hivis":
        y2 = hexc("#c9d6d6")
        for i in range(8):
            for j in (4, 9): s.put(fx + i, fy + j, y2); s.put(bx + i, by + j, y2)
    elif pattern == "apron":
        for j in range(3, 12):
            for i in range(1, 7): s.put(fx + i, fy + j, c2)
    elif pattern == "cross":
        for j in range(3, 10): s.put(fx + 3, fy + j, c2); s.put(fx + 4, fy + j, c2)
        for i in range(1, 7): s.put(fx + i, fy + 5, c2)
    if number is not None:
        digits = {"1": ["010", "110", "010", "010", "111"], "7": ["111", "001", "010", "010", "010"], "9": ["111", "101", "111", "001", "111"], "4": ["101", "101", "111", "001", "001"], "0": ["111", "101", "101", "101", "111"]}
        for k, ch in enumerate(str(number)[:2]):
            for j, row in enumerate(digits.get(ch, digits["0"])):
                for i, bit in enumerate(row):
                    if bit == "1": s.put(bx + 1 + k * 4 + i, by + 3 + j, hexc("#ffffff"))

def legs(s, col, shoes="#33313a", skirt=False, shorts=False):
    c = hexc(col)
    for leg in ("rleg", "lleg"):
        s.fill_part(leg, c, rows=(0, 6) if shorts else (0, 12))
        s.fill_part(leg, hexc(shoes), rows=(10, 12), noise=.02)
    if skirt:
        for pant in ("rpant", "lpant"): s.fill_part(pant, c, rows=(0, 7))

def gown(s, col):
    """A long robe/gown covering body and legs (body, both legs, overlays)."""
    c = hexc(col)
    s.fill_part("body", c)
    for leg in ("rleg", "lleg", "rpant", "lpant"): s.fill_part(leg, c, rows=(0, 12))
    for arm in ("rarm", "larm"): s.fill_part(arm, c, rows=(0, 10))

def hat(s, kind, col="#222222", col2=None):
    c = hexc(col); c2 = hexc(col2) if col2 else shade(c, .3)
    if kind == "cap":
        s.fill_part("hat", c, sides=("top",)); x, y, w, h = faces("hat")["front"]
        for i in range(w): s.put(x + i, y, c); s.put(x + i, y + 1, c2)
        for f in ("right", "left", "back"):
            fx, fy, fw, fh = faces("hat")[f]
            for i in range(fw): s.put(fx + i, fy, c)
    elif kind in ("helmet", "beanie", "police", "fire", "chef", "crown", "hijab", "turban", "headset", "grad"):
        s.fill_part("hat", c, sides=("top",))
        depth = {"helmet": 2, "beanie": 3, "police": 2, "fire": 3, "chef": 3, "crown": 2, "hijab": 8, "turban": 3, "headset": 1, "grad": 1}[kind]
        for f in ("front", "right", "left", "back"):
            fx, fy, fw, fh = faces("hat")[f]
            d = depth if not (kind == "hijab" and f == "front") else 0
            for j in range(d):
                for i in range(fw): s.put(fx + i, fy + j, c if not (kind == "police" and j == 1) else c2)
        if kind == "hijab":
            fx, fy, fw, fh = faces("hat")["front"]
            for j in range(8): s.put(fx, fy + j, c); s.put(fx + 7, fy + j, c)
            for i in range(8): s.put(fx + i, fy, c)
        if kind == "crown":
            fx, fy, fw, fh = faces("hat")["front"]
            for i in (0, 2, 4, 6): s.put(fx + i, fy, c2)
        if kind == "headset":
            for f in ("right", "left"):
                fx, fy, fw, fh = faces("hat")[f]
                for j in range(3, 6):
                    for i in range(2, 6): s.put(fx + i, fy + j, c)

def glasses(s, col="#111111"):
    x, y, w, h = faces("hat")["front"]; c = hexc(col)
    for i in (1, 2, 5, 6): s.put(x + i, y + 4, c)
    for i in (0, 3, 4, 7): s.put(x + i, y + 4, c)

# ---- the pack --------------------------------------------------------------
def make(spec, idx):
    s = Skin(idx * 101 + 7)
    sk = spec.get("skin", SKINS[idx % len(SKINS)]); hr = spec.get("hairc", HAIRS[idx % len(HAIRS)])
    person(s, sk, hr, spec.get("hair", "short"), beard=spec.get("beard", False))
    if spec.get("gown"): gown(s, spec["gown"])
    else:
        legs(s, spec.get("legs", "#38495e"), spec.get("shoes", "#33313a"), skirt=spec.get("skirt", False), shorts=spec.get("shorts", False))
        top(s, spec.get("top", "#6b3fa0"), spec.get("sleeves", "long"), spec.get("pattern"), spec.get("top2"), spec.get("number"))
    if spec.get("hat"): hat(s, spec["hat"], spec.get("hatc", "#222222"), spec.get("hatc2"))
    if spec.get("glasses"): glasses(s)
    return s.img

PACK = [
    ("police-officer", "Police officer", "Work", dict(top="#14213d", top2="#f5f5f5", pattern="chest-stripe", legs="#14213d", hat="police", hatc="#14213d", hatc2="#f5f5f5", hair="crop")),
    ("firefighter", "Firefighter", "Work", dict(top="#2b2b2b", top2="#f2d21b", pattern="hivis", legs="#2b2b2b", hat="fire", hatc="#c0392b", hair="short")),
    ("paramedic", "Paramedic", "Work", dict(top="#2f7a4f", top2="#f2d21b", pattern="hivis", legs="#2f7a4f", hair="bob")),
    ("nurse", "Nurse", "Work", dict(top="#3d8bd9", sleeves="short", legs="#3d8bd9", shoes="#ece7dc", hair="bun")),
    ("doctor", "Doctor", "Work", dict(top="#ece7dc", top2="#3d8bd9", pattern="tie", legs="#334963", hair="short", glasses=True)),
    ("surgeon", "Surgeon", "Work", dict(top="#2fa48a", sleeves="short", legs="#2fa48a", hat="beanie", hatc="#2fa48a", hair="crop")),
    ("chef", "Chef", "Work", dict(top="#f5f5f5", top2="#d6d6d6", pattern="zip", legs="#2b2b2b", hat="chef", hatc="#f5f5f5", hair="short")),
    ("builder", "Builder", "Work", dict(top="#f2a93b", top2="#c9d6d6", pattern="hivis", legs="#3d5a80", hat="helmet", hatc="#f5c518", beard=True, hair="crop")),
    ("pilot", "Pilot", "Work", dict(top="#1d2340", top2="#f5c518", pattern="tie", legs="#1d2340", hat="police", hatc="#1d2340", hatc2="#f5c518", hair="crop")),
    ("barista", "Barista", "Work", dict(top="#e9dfc7", top2="#5a3a22", pattern="apron", legs="#2b2b2b", hair="long")),
    ("teacher", "Teacher", "Work", dict(top="#a44760", sleeves="long", legs="#334963", glasses=True, hair="bob")),
    ("scientist", "Scientist", "Work", dict(top="#f5f5f5", top2="#9fb6ff", pattern="zip", legs="#38495e", glasses=True, hair="short")),
    ("postie", "Postal worker", "Work", dict(top="#c0392b", sleeves="short", legs="#1d2340", hat="cap", hatc="#c0392b", hair="crop")),
    ("bus-driver", "Bus driver", "Work", dict(top="#2b5fd9", top2="#ffffff", pattern="tie", legs="#22263a", hair="short")),
    ("judge", "Judge", "Work", dict(gown="#1d1d22", hair="long", hairc="#d8d5cb", glasses=True)),
    ("businessman", "Navy suit", "Smart", dict(top="#1d2340", top2="#a44760", pattern="tie", legs="#1d2340", shoes="#1b1b1b", hair="crop")),
    ("businesswoman", "Grey suit", "Smart", dict(top="#5d6673", top2="#ffffff", pattern="tie", legs="#5d6673", hair="bob")),
    ("wedding-suit", "Wedding suit", "Smart", dict(top="#e9dfc7", top2="#d6b25e", pattern="tie", legs="#e9dfc7", hair="short")),
    ("wedding-dress", "Wedding dress", "Smart", dict(gown="#fbf7ee", hair="long", hat="hijab", hatc="#fbf7ee")),
    ("sunday-best", "Sunday best", "Smart", dict(top="#6b3fa0", top2="#f5c518", pattern="tie", legs="#22263a", hair="short")),
    ("gold-dress", "Gold dress", "Smart", dict(gown="#e0ab3c", hair="braids")),
    ("plum-dress", "Plum dress", "Smart", dict(gown="#6b3fa0", hair="puffs")),
    ("pastor", "Pastor (yellow hoodie)", "Church", dict(top="#f5c518", top2="#1b1b1b", pattern="chest-stripe", legs="#22263a", hair="crop")),
    ("choir", "Choir robe", "Church", dict(gown="#6b1f3a", hair="afro")),
    ("usher", "Church usher", "Church", dict(top="#1d1d22", top2="#f5c518", pattern="tie", legs="#1d1d22", hair="short")),
    ("worship-leader", "Worship leader", "Church", dict(top="#ffffff", top2="#2b5fd9", pattern="cross", legs="#22263a", hair="long")),
    ("youth-worker", "Youth worker", "Church", dict(top="#2fa48a", top2="#ffffff", pattern="cross", sleeves="short", legs="#38495e", hat="cap", hatc="#2fa48a", hair="short")),
    ("shepherd", "Shepherd", "Bible", dict(gown="#b08d57", hat="turban", hatc="#e9dfc7", beard=True, hair="long")),
    ("king", "King", "Bible", dict(gown="#6b1f3a", hat="crown", hatc="#f5c518", hatc2="#ffe680", beard=True, hair="short")),
    ("queen", "Queen", "Bible", dict(gown="#2b5fd9", hat="crown", hatc="#f5c518", hatc2="#ffe680", hair="long")),
    ("fisherman", "Galilean fisherman", "Bible", dict(top="#c9b08a", sleeves="short", legs="#8a6a44", shoes="#5a3a22", beard=True, hair="long")),
    ("roman-soldier", "Roman soldier", "Bible", dict(top="#a6302a", top2="#c9a646", pattern="chest-stripe", shorts=True, legs="#a6302a", hat="helmet", hatc="#c9a646", hair="crop")),
    ("prophet", "Prophet", "Bible", dict(gown="#7a6a58", beard=True, hair="long", hairc="#d8d5cb")),
    ("footballer-red", "Footballer (red, 9)", "Sport", dict(top="#c0392b", sleeves="short", number=9, legs="#ffffff", shorts=True, shoes="#1b1b1b", hair="crop")),
    ("footballer-blue", "Footballer (blue, 7)", "Sport", dict(top="#2b5fd9", sleeves="short", number=7, legs="#ffffff", shorts=True, shoes="#1b1b1b", hair="short")),
    ("footballer-green", "Footballer (green, 10)", "Sport", dict(top="#2f7a4f", top2="#ffffff", pattern="stripes", sleeves="short", number=10, legs="#1b1b1b", shorts=True, hair="afro")),
    ("basketball", "Basketball (14)", "Sport", dict(top="#e98a1f", sleeves="none", number=14, legs="#e98a1f", shorts=True, hair="crop")),
    ("runner", "Runner", "Sport", dict(top="#ff6b8a", sleeves="none", legs="#1b1b1b", shorts=True, shoes="#ffffff", hair="puffs")),
    ("gym", "Gym kit", "Sport", dict(top="#1b1b1b", sleeves="short", legs="#5d6673", shoes="#ffffff", hair="crop")),
    ("cyclist", "Cyclist", "Sport", dict(top="#f5c518", top2="#1b1b1b", pattern="chest-stripe", sleeves="short", legs="#1b1b1b", shorts=True, hat="helmet", hatc="#1b1b1b", hair="short")),
    ("swimmer", "Lifeguard", "Sport", dict(top="#c0392b", sleeves="none", legs="#f5c518", shorts=True, hair="short")),
    ("hoodie-purple", "Purple hoodie", "Casual", dict(top="#6b3fa0", top2="#4a2a72", pattern="zip", legs="#22263a", hair="short")),
    ("hoodie-black", "Black hoodie", "Casual", dict(top="#1b1b1b", top2="#333333", pattern="zip", legs="#38495e", hat="beanie", hatc="#5d6673", hair="crop")),
    ("camo", "Camo jacket", "Casual", dict(top="#566c4d", top2="#3b4a32", pattern="camo", legs="#3b3b44", hair="short")),
    ("checked-shirt", "Checked shirt", "Casual", dict(top="#c0392b", top2="#5a1a14", pattern="checks", legs="#2b4a6b", hair="long", beard=True)),
    ("stripy-tee", "Stripy tee", "Casual", dict(top="#f2efe6", top2="#2b5fd9", pattern="stripes", sleeves="short", legs="#2b4a6b", hair="bob")),
    ("denim", "Denim jacket", "Casual", dict(top="#3d8bd9", top2="#2b5f9d", pattern="zip", legs="#1b1b1b", hair="braids")),
    ("varsity", "Varsity jacket", "Casual", dict(top="#1d2340", top2="#f2efe6", pattern="chest-stripe", legs="#22263a", hair="crop")),
    ("raincoat", "Yellow raincoat", "Casual", dict(top="#f5c518", top2="#c99a00", pattern="zip", legs="#38495e", shoes="#2f7a4f", hair="bob")),
    ("puffer", "Puffer jacket", "Casual", dict(top="#c0392b", top2="#8a2a1f", pattern="stripes", legs="#1b1b1b", hat="beanie", hatc="#1b1b1b", hair="short")),
    ("summer", "Summer tee & shorts", "Casual", dict(top="#9fd3a5", sleeves="short", legs="#e1cba0", shorts=True, shoes="#ad6844", hair="afro")),
    ("gamer", "Gamer", "Casual", dict(top="#1b1b1b", top2="#43f2ff", pattern="chest-stripe", legs="#22263a", hat="headset", hatc="#43f2ff", glasses=True, hair="short")),
    ("artist", "Artist", "Casual", dict(top="#f2efe6", top2="#e2556b", pattern="camo", legs="#2b4a6b", hat="cap", hatc="#a44760", hair="long")),
    ("student", "Student", "Casual", dict(top="#a44760", top2="#f2efe6", pattern="chest-stripe", legs="#38495e", glasses=True, hair="short")),
    ("graduate", "Graduate", "Smart", dict(gown="#1d1d22", hat="grad", hatc="#1d1d22", hair="short")),
    ("abaya", "Abaya & hijab", "Smart", dict(gown="#1d1d22", hat="hijab", hatc="#5d6673")),
    ("kente", "Kente shirt", "Smart", dict(top="#e0ab3c", top2="#2f7a4f", pattern="checks", legs="#1d1d22", hair="crop")),
    ("sari", "Sari", "Smart", dict(gown="#e2556b", hair="long")),
    ("farmer", "Farmer", "Work", dict(top="#c0392b", top2="#5a1a14", pattern="checks", legs="#3d8bd9", shoes="#5a3a22", hat="cap", hatc="#2f7a4f", beard=True, hair="short")),
    ("astronaut", "Astronaut", "Fun", dict(top="#f2efe6", top2="#c0392b", pattern="chest-stripe", legs="#f2efe6", shoes="#9aa3ad", hat="helmet", hatc="#dfe8ff", hair="crop")),
    ("ninja", "Ninja", "Fun", dict(top="#1b1b1b", legs="#1b1b1b", hat="hijab", hatc="#1b1b1b", hair="crop")),
    ("detective", "Detective", "Fun", dict(top="#8a6a44", top2="#5a4632", pattern="zip", legs="#3b3b44", hat="cap", hatc="#5a4632", hair="short")),
    ("prisoner", "Prison jumpsuit", "Fun", dict(top="#e98a1f", legs="#e98a1f", shoes="#d8d5cb", hair="crop")),
    ("pyjamas", "Pyjamas", "Fun", dict(top="#9fb6ff", top2="#ffffff", pattern="stripes", legs="#9fb6ff", shoes="#ffffff", hair="afro")),
]

def main():
    os.makedirs(OUT, exist_ok=True)
    index = []
    for i, (sid, name, cat, spec) in enumerate(PACK):
        make(spec, i).save(f"{OUT}/{sid}.png")
        index.append({"id": sid, "name": name, "category": cat, "file": f"/skins/{sid}.png"})
    json.dump(index, open(f"{OUT}/index.json", "w"), indent=1)
    print(f"wrote {len(index)} skins")

if __name__ == "__main__":
    main()
