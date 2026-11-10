from PIL import Image, ImageDraw, ImageFont
F = "C:/Windows/Fonts/"; ft = ImageFont.truetype(F + "arialbd.ttf", 30); fs = ImageFont.truetype(F + "arial.ttf", 22)
O = "scene3/out/"
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
TRIM = (0, 450, 1080, 1250)
sheet("1. Hallway through the door (same camera): Round 7 vs Round 8, and Round 8 in each light mode", [
    ("Hallway", [(O + "B7_q2/t2.60.png", "Round 7 (mixed)", None), (O + "R8_q2_mix/t2.60.png", "Round 8 (mixed)", None), (O + "R8_q2_day/t2.60.png", "Round 8 daylight", None), (O + "R8_q2_lamp/t2.60.png", "Round 8 lamps", None)])],
    "compare/r8_1_hallway.jpg")
sheet("2. Gold crown trim and wine wall (same camera): Round 7 (top) vs Round 8 (bottom) in daylight / lamps / mixed", [
    ("Round 7", [(O + "B7_h_day/t2.60.png", "Daylight", TRIM), (O + "B7_h_lamp/t2.60.png", "Lamps + candles", TRIM), (O + "R7_h/t2.60.png", "Mixed", TRIM)]),
    ("Round 8", [(O + "R8_h_day/t2.60.png", "Daylight", TRIM), (O + "R8_h_lamp/t2.60.png", "Lamps + candles", TRIM), (O + "R8_h_mix/t2.60.png", "Mixed", TRIM)])],
    "compare/r8_2_gold_walls.jpg", w=420, h=311)
sheet("3. Full room (same camera): Round 7 (top) vs Round 8 (bottom) in daylight / lamps / mixed", [
    ("Round 7", [(O + "R7L_day/t2.60.png", "Daylight", None), (O + "R7L_lamp/t2.60.png", "Lamps + candles", None), (O + "R7L_mix/t2.60.png", "Mixed", None)]),
    ("Round 8", [(O + "R8_b_day/t2.60.png", "Daylight", None), (O + "R8_b_lamp/t2.60.png", "Lamps + candles", None), (O + "R8_b_mix/t2.60.png", "Mixed", None)])],
    "compare/r8_3_room_modes.jpg")
sheet("4. Material close-ups (Round 8, mixed) and the jug audit", [
    ("Close", [(O + "R8_s/t2.60.png", "Brass, gilt frame, wine wall, teal paint", None), (O + "R8_g/t2.60.png", "Wood, iron, lantern glass", None), (O + "R8_a/t2.60.png", "Front", None),
               (O + "R8_c/t2.60.png", "Jug in hand (scanned)", (150, 0, 1080, 1100))])],
    "compare/r8_4_closeups.jpg")
