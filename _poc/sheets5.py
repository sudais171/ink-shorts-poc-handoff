from PIL import Image, ImageDraw, ImageFont
F = "C:/Windows/Fonts/"; ft = ImageFont.truetype(F + "arialbd.ttf", 30); fs = ImageFont.truetype(F + "arial.ttf", 22)
R = "refs/"   # reference video frames (not included; see README)
O = "scene3/out/"; LB = "lightbox/out/"
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
WIDE = (0, 480, 1080, 1500)
sheet("1. The four hero props together: Round 4 barrel + lantern with the redesigned table and chair, in sun / lamp / shade", [
    ("Props", [(LB + "W_sun/t0.20.png", "Direct sun", WIDE), (LB + "W_lamp/t0.20.png", "Warm lamp only", WIDE), (LB + "W_shade/t0.20.png", "Cool shade only", WIDE)])],
    "compare/r5_1_props_light.jpg", w=500, h=470)
sheet("2. Table and chair: Round 4 (top) vs Round 5 redesign (bottom), next to the benchmark barrel", [
    ("Round 4", [(O + "R4_hero_g/t2.60.png", "Old table + lantern", None), (O + "R4_hero_f/t2.60.png", "Old chair", None), (O + "R4_hero_e/t2.60.png", "Barrel (benchmark)", None)]),
    ("Round 5", [(O + "R5_g/t2.60.png", "New table + lantern", None), (O + "R5_f/t2.60.png", "New chair", None), (O + "R5_e/t2.60.png", "Barrel (unchanged)", None)])],
    "compare/r5_2_table_chair.jpg")
sheet("3. Full room with the calmer wall vs the references", [
    ("Refs", [(R + "full2.png", "Ref: water bowl", None), (R + "f4.jpg", "Ref: forge", None), (R + "f1.jpg", "Ref: casino", None), (R + "f3.jpg", "Ref: saloon", None)]),
    ("Round 5", [(O + "R5_k/t2.60.png", "Foreground chair, focus on him", None), (O + "R5_b/t2.60.png", "Wide corner", None), (O + "R5_a/t2.60.png", "Front", None), (O + "R4_hero_b/t2.60.png", "Round 4 (before)", None)])],
    "compare/r5_3_room.jpg")
J = O + "R5_jug/"
sheet("4. Jug and hand (Round 5 room) and wall + ceiling", [
    ("Jug", [(J + "t0.50.png", "Before", None), (J + "t1.05.png", "Pickup", None), (J + "t2.60.png", "Held", None), (J + "t3.45.png", "Put down", None), (J + "t4.90.png", "Hand back", None)]),
    ("Room", [(O + "R5_h/t2.60.png", "Wall + ceiling", None), (O + "R5_p/t2.60.png", "Barrel corner", None), (O + "R5_d/t2.60.png", "Low angle + window", None)])],
    "compare/r5_4_jug_room.jpg", w=260, h=462)
