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
    cols = max(len(r[1]) for r in rows); lw = 160
    S = Image.new("RGB", (lw + cols * (w + 10) + 10, 60 + len(rows) * (h + 44)), (245, 242, 236)); d = ImageDraw.Draw(S)
    d.text((14, 14), title, font=ft, fill=(30, 30, 40))
    for r, (rlab, items) in enumerate(rows):
        y = 60 + r * (h + 44); d.text((12, y + h // 2 - 12), rlab, font=ft, fill=(40, 40, 60))
        for i, (p, lab, crop) in enumerate(items):
            x = lw + i * (w + 10); S.paste(tile(p, w, h, crop), (x, y)); d.text((x, y + h + 8), lab, font=fs, fill=(40, 40, 50))
    S.save(out, quality=90); print(out, S.size)
REF = [(R + "full2.png", "Ref: water bowl", None), (R + "f4.jpg", "Ref: forge", None), (R + "f1.jpg", "Ref: casino", None), (R + "f3.jpg", "Ref: saloon", None)]
sheet("1. Full room: references vs round 4 (new props, fixed outlines, new light)", [
    ("Refs", REF),
    ("Round 4", [(O + "R4_hero_a/t2.60.png", "Front", None), (O + "R4_hero_b/t2.60.png", "Wide corner", None), (O + "R4_hero_d/t2.60.png", "Low angle + window", None), (O + "F_st_a/t2.60.png", "Round 3 (before)", None)])],
    "compare/r4_1_room.jpg")
sheet("2. Outline fix (same frame, 1080p crop) and lighting fix (same frame)", [
    ("Outline", [(O + "R4_nooutline/t2.60.png", "Outline off / old (invisible)", (0, 700, 760, 1460)), (O + "R4_ph_a/t2.60.png", "Fixed outline", (0, 700, 760, 1460))]),
    ("Light", [(O + "R4_lightold/t0.50.png", "Round 3 light", None), (O + "R4_lightnew/t0.50.png", "Round 4 light", None)])],
    "compare/r4_2_outline_light.jpg", w=420, h=560)
sheet("3. Designed props (row 1) vs the closest Poly Haven models (row 2), same camera, same treatment", [
    ("Designed", [(O + "R4_hero_e/t2.60.png", "Barrel", None), (O + "R4_hero_f/t2.60.png", "Chair", None), (O + "R4_hero_g/t2.60.png", "Table + lantern", None)]),
    ("Poly H.", [(O + "R4_ph_e/t2.60.png", "Barrel", None), (O + "R4_ph_f/t2.60.png", "Chair", None), (O + "R4_ph_g/t2.60.png", "Table + lantern", None)]),
    ("Refs", [(R + "full2.png", "Ref barrel", (0, 900, 700, 1920)), (R + "f3.jpg", "Ref table", None), (R + "f4.jpg", "Ref lantern + anvil", None)])],
    "compare/r4_3_props.jpg")
J = O + "R4_jug/"
sheet("4. Jug and hand (designed set): before, pickup, held, put down, hand back - and wall + ceiling", [
    ("Jug", [(J + "t0.50.png", "Before", None), (J + "t1.05.png", "Pickup", None), (J + "t2.60.png", "Held", None), (J + "t3.45.png", "Put down", None), (J + "t4.90.png", "Hand back", None)]),
    ("Room", [(O + "R4_hero_h/t2.60.png", "Wall + ceiling", None), (J + "t1.05.png", "Grip close-up", (250, 350, 950, 1050))])],
    "compare/r4_4_jug.jpg", w=260, h=462)
