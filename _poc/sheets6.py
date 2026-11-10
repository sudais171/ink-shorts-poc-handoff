from PIL import Image, ImageDraw, ImageFont
F = "C:/Windows/Fonts/"; ft = ImageFont.truetype(F + "arialbd.ttf", 30); fs = ImageFont.truetype(F + "arial.ttf", 22)
R = "refs/"   # reference video frames (not included; see README)
O = "scene3/out/"; LB = "lightbox/out/"; TT = "turntable/out/"
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
TC = (40, 200, 680, 1120); V4 = ["0.50", "1.50", "2.50", "3.50"]; N4 = ["Front", "Side", "Back", "Three-quarter"]
sheet("1. Redesigned chair from four angles (same camera, same light), with the barrel for comparison", [
    ("Chair", [(TT + f"chair3/t{t}.png", n, TC) for t, n in zip(V4, N4)]),
    ("Old chair", [(TT + f"chair2/t{t}.png", n, TC) for t, n in zip(V4, N4)]),
    ("Barrel", [(TT + f"barrel/t{t}.png", n, TC) for t, n in zip(V4, N4)])], "compare/r6_1_chair.jpg", w=280, h=400)
sheet("2. Table: Round 5 (bench-like) vs Round 6 (corrected proportions), and the new sideboard", [
    ("Round 5", [(TT + f"table2/t{t}.png", n, TC) for t, n in zip(V4, N4)]),
    ("Round 6", [(TT + f"table3/t{t}.png", n, TC) for t, n in zip(V4, N4)]),
    ("Sideboard", [(TT + f"cabinet3/t{t}.png", n, TC) for t, n in zip(V4, N4)])], "compare/r6_2_table_sideboard.jpg", w=280, h=400)
WIDE = (0, 480, 1080, 1500)
sheet("3. All four hero props together: sun / warm lamp / cool shade", [
    ("Props", [(LB + "X_sun/t0.20.png", "Direct sun", WIDE), (LB + "X_lamp/t0.20.png", "Warm lamp only", WIDE), (LB + "X_shade/t0.20.png", "Cool shade only", WIDE)])],
    "compare/r6_3_props.jpg", w=500, h=470)
sheet("4. Room colour: Round 5 (top) vs Round 6 (bottom), and the references", [
    ("Refs", [(R + "f1.jpg", "Ref: casino", None), (R + "f4.jpg", "Ref: forge", None), (R + "f3.jpg", "Ref: saloon", None), (R + "full2.png", "Ref: water bowl", None)]),
    ("Round 5", [(O + "R5_b/t2.60.png", "Wide", None), (O + "R5_k/t2.60.png", "Foreground chair", None), (O + "R5_a/t2.60.png", "Front", None), (O + "R5_d/t2.60.png", "Low angle", None)]),
    ("Round 6", [(O + "R6_b/t2.60.png", "Wide", None), (O + "R6_k/t2.60.png", "Foreground chair (final shot)", None), (O + "R6_a/t2.60.png", "Front", None), (O + "R6_d/t2.60.png", "Low angle", None)])],
    "compare/r6_4_room.jpg")
