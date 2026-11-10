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
    cols = max(len(r[1]) for r in rows); lw = 150
    S = Image.new("RGB", (lw + cols * (w + 10) + 10, 60 + len(rows) * (h + 44)), (245, 242, 236)); d = ImageDraw.Draw(S)
    d.text((14, 14), title, font=ft, fill=(30, 30, 40))
    for r, (rlab, items) in enumerate(rows):
        y = 60 + r * (h + 44); d.text((12, y + h // 2 - 12), rlab, font=ft, fill=(40, 40, 60))
        for i, (p, lab, crop) in enumerate(items):
            x = lw + i * (w + 10); S.paste(tile(p, w, h, crop), (x, y)); d.text((x, y + h + 8), lab, font=fs, fill=(40, 40, 50))
    S.save(out, quality=90); print(out, S.size)
REF = [(R + "full2.png", "Reference: water bowl", None), (R + "f4.jpg", "Reference: forge", None), (R + "f1.jpg", "Reference: casino", None), (R + "f3.jpg", "Reference: saloon", None)]
sheet("1. Same scene, same camera - three asset treatments, with the references", [
    ("Refs", REF),
    ("Round 3", [(O + "F_kk_a/t2.60.png", "A: KayKit + style", None), (O + "F_ph_a/t2.60.png", "B: Poly Haven + style", None), (O + "F_st_a/t2.60.png", "C: Blender-stylized + style", None), ("scene2/out/fa/t2.60.png", "Round 2 (for scale)", None)])],
    "compare/r3_1_treatments.jpg")
sheet("2. Close-ups - barrel, chair, table + lantern (same camera per row)", [
    ("KayKit", [(O + "F_kk_e/t0.50.png", "Barrel", None), (O + "F_kk_f/t0.50.png", "Chair", None), (O + "F_kk_g/t0.50.png", "Table + lantern", None)]),
    ("Poly H.", [(O + "F_ph_e/t0.50.png", "Barrel", None), (O + "F_ph_f/t0.50.png", "Chair", None), (O + "F_ph_g/t0.50.png", "Table + lantern", None)]),
    ("Stylized", [(O + "F_st_e/t0.50.png", "Barrel", None), (O + "F_st_f/t0.50.png", "Chair", None), (O + "F_st_g/t0.50.png", "Table + lantern", None)])],
    "compare/r3_2_closeups.jpg", w=300, h=533)
J = O + "F_st_jug/"
sheet("3. Jug and hand: before, pickup, held, put down, hand back", [
    ("Jug", [(J + "t0.50.png", "Before", None), (J + "t1.05.png", "Pickup", None), (J + "t2.60.png", "Held", None), (J + "t3.45.png", "Put down", None), (J + "t4.90.png", "Hand back", None)])],
    "compare/r3_3_jug.jpg", w=260, h=462)
sheet("4. Walls, ceiling, light and shadow, view out of the window (treatment C)", [
    ("Room", [(O + "F_st_h/t0.50.png", "Wall + ceiling", None), (O + "F_st_b/t0.50.png", "Light pools + shadows", None), (O + "F_st_d/t0.50.png", "Low angle, window view", None), (R + "full1.png", "Reference: casino room", None)])],
    "compare/r3_4_room.jpg")
