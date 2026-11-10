from PIL import Image, ImageDraw, ImageFont
F = "C:/Windows/Fonts/"; ft = ImageFont.truetype(F + "arialbd.ttf", 30); fs = ImageFont.truetype(F + "arial.ttf", 22)
R = "refs/"   # reference video frames (not included; see README)
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
sheet("1. Same cameras: Round 6 (top) vs Round 7 (bottom), with the references", [
    ("Refs", [(R + "f3.jpg", "Ref: saloon", None), (R + "f1.jpg", "Ref: casino", None), (R + "f4.jpg", "Ref: forge", None), (R + "f2.jpg", "Ref: western street", None)]),
    ("Round 6", [(O + "R6_b/t2.60.png", "Wide", None), (O + "R6_k/t2.60.png", "Foreground chair", None), (O + "R6_q/t2.60.png", "Toward the door", None), (O + "R6_d/t2.60.png", "Low angle", None)]),
    ("Round 7", [(O + "R7_b/t2.60.png", "Wide", None), (O + "R7_k/t2.60.png", "Foreground chair", None), (O + "R7_q/t2.60.png", "Toward the door + hall", None), (O + "R7_d/t2.60.png", "Low angle", None)])],
    "compare/r7_1_before_after.jpg")
sheet("2. Close-ups (Round 7): wall, floor, furniture and the new decorative pieces", [
    ("Close", [(O + "R7_s/t2.60.png", "Sideboard, candlestick, painting, sconce", None), (O + "R7_h/t2.60.png", "Wall, crown, chandelier, ceiling", None), (O + "R7_g/t2.60.png", "Table, lantern, barrel", None), (O + "R7_e/t2.60.png", "Barrel corner, curtain", None)]),
    ("Round 6", [(O + "R6_s/t2.60.png", "Same camera, round 6", None), (O + "R6_h/t2.60.png" if False else O + "R5_h/t2.60.png", "Wall + ceiling (round 5)", None), (O + "R6_g/t2.60.png", "Same camera, round 6", None), (O + "R6_e/t2.60.png", "Same camera, round 6", None)])],
    "compare/r7_2_closeups.jpg")
sheet("3. Light modes (same camera): window daylight only | lantern and candles only (evening) | mixed", [
    ("Light", [(O + "R7L_day/t2.60.png", "Daylight only", None), (O + "R7L_lamp/t2.60.png", "Lamps + candles only", None), (O + "R7L_mix/t2.60.png", "Mixed (default)", None), (R + "f4.jpg", "Ref: forge (lamp-lit)", None)])],
    "compare/r7_3_light.jpg")
sheet("4. Final full-room frames (Round 7)", [
    ("Room", [(O + "R7_a/t2.60.png", "Front", None), (O + "R7_b/t2.60.png", "Wide corner", None), (O + "R7_q/t2.60.png", "Doorway and hall", None), (O + "R7_k/t2.60.png", "Foreground chair", None)])],
    "compare/r7_4_final.jpg")
