from PIL import Image, ImageDraw, ImageFont
F = "C:/Windows/Fonts/"; ft = ImageFont.truetype(F + "arialbd.ttf", 30); fs = ImageFont.truetype(F + "arial.ttf", 22)
O = "scene3/out/"; TT = "turntable/out/"
def tile(p, w, h, crop=None):
    im = Image.open(p).convert("RGB")
    if crop: im = im.crop(crop)
    s = max(w / im.width, h / im.height); im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1))
    x, y = (im.width - w) // 2, (im.height - h) // 2; return im.crop((x, y, x + w, y + h))
def sheet(title, rows, out, w=300, h=533):
    cols = max(len(r[1]) for r in rows); lw = 170
    S = Image.new("RGB", (lw + cols * (w + 10) + 10, 60 + len(rows) * (h + 44)), (245, 242, 236)); d = ImageDraw.Draw(S)
    d.text((14, 14), title, font=ft, fill=(30, 30, 40))
    for r, (rlab, items) in enumerate(rows):
        y = 60 + r * (h + 44); d.text((12, y + h // 2 - 12), rlab, font=ft, fill=(40, 40, 60))
        for i, (p, lab, crop) in enumerate(items):
            x = lw + i * (w + 10); S.paste(tile(p, w, h, crop), (x, y)); d.text((x, y + h + 8), lab, font=fs, fill=(40, 40, 50))
    S.save(out, quality=90); print(out, S.size)
TC = (120, 380, 600, 900); V4 = ["0.50", "1.50", "2.50", "3.50"]; N4 = ["Front (handle left)", "Side", "Back", "Three-quarter"]
JC = (150, 200, 1080, 1300); JT = ["0.50", "1.05", "2.60", "3.45", "4.90"]; JN = ["Resting", "Reach + grip", "Held at chest", "Put down", "Hand back"]
sheet("1. New jug from four angles (same camera and light)", [("New jug", [(TT + f"jug5/t{t}.png", n, TC) for t, n in zip(V4, N4)])], "compare/r9_1_jug_turntable.jpg", w=300, h=325)
sheet("2. Old scanned jug (top) vs new designed jug (bottom): the full pickup and put-down, same camera, same code", [
    ("Old", [(O + f"J_old/t{t}.png", n, JC) for t, n in zip(JT, JN)]),
    ("New", [(O + f"J_new/t{t}.png", n, JC) for t, n in zip(JT, JN)])], "compare/r9_2_jug_sequence.jpg", w=260, h=307)
TRIM = (0, 450, 1080, 1250)
sheet("3. Ceiling trim: Round 8 (mixed) and Round 9 in daylight / lamps / mixed", [
    ("Trim", [(O + "R8_h_mix/t2.60.png", "Round 8, mixed", TRIM), (O + "R9_h_day/t2.60.png", "Round 9, daylight", TRIM), (O + "R9_h_lamp/t2.60.png", "Round 9, lamps", TRIM), (O + "R9_h_mix/t2.60.png", "Round 9, mixed", TRIM)])],
    "compare/r9_3_trim.jpg", w=330, h=244)
sheet("4. Full-room regression (Round 9): three light modes, hallway, close-ups", [
    ("Room", [(O + "R9_b_day/t2.60.png", "Daylight", None), (O + "R9_b_lamp/t2.60.png", "Lamps + candles", None), (O + "R9_b_mix/t2.60.png", "Mixed", None), (O + "R9_k/t2.60.png", "Foreground chair", None)]),
    ("Hall", [(O + "R9_q2_day/t2.60.png", "Hallway, daylight", None), (O + "R9_q2_lamp/t2.60.png", "Hallway, lamps", None), (O + "R9_q2_mix/t2.60.png", "Hallway, mixed", None), (O + "R9_a/t2.60.png", "Front, new jug held", None)]),
    ("Close", [(O + "R9_s/t2.60.png", "Brass, gilt, wine, teal", None), (O + "R9_g/t2.60.png", "Wood, iron, lantern", None), (O + "J_new/t0.50.png", "New jug on the table", None), (O + "J_new/t2.60.png", "New jug held", None)])],
    "compare/r9_4_regression.jpg")
