from PIL import Image, ImageDraw, ImageFont
F = "C:/Windows/Fonts/"; ft = ImageFont.truetype(F + "arialbd.ttf", 30); fs = ImageFont.truetype(F + "arial.ttf", 22)
C = "court/out/"
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
sheet("1. Steep chair view (same camera): Round 11 vs Round 12, at rest and at the strike", [
    ("Chair cam", [(C + "R11_c/t0.30.png", "Round 11", None), (C + "r12_c/t0.30.png", "Round 12, at rest", None), (C + "r12_c/t1.80.png", "Round 12, strike", None),
                   (C + "r12_g/t0.30.png", "Cinematic, at rest", None), (C + "r12_sd/t1.80.png", "Side camera, strike", None)])], "compare/r12_1_seated.jpg")
T = ["0.30", "0.90", "1.20", "1.50", "1.80", "2.20", "3.15", "3.60", "4.20"]; N = ["Rest", "Reaching", "Grip", "Raised", "Strike 1", "Strike 2", "Put down", "Release", "Hand back"]
sheet("2. Full gavel interaction (Round 12) from the cinematic, side and steep chair cameras", [
    ("Cinematic", [(C + f"r12_g/t{t}.png", n, (0, 400, 1080, 1340)) for t, n in zip(T, N)]),
    ("Side", [(C + f"r12_sd/t{t}.png", n, (0, 400, 1080, 1340)) for t, n in zip(T, N)]),
    ("Chair cam", [(C + f"r12_c/t{t}.png", n, (0, 300, 1080, 1240)) for t, n in zip(T, N)])], "compare/r12_2_interaction.jpg", w=230, h=200)
sheet("3. Nearest pew (same camera and exposure): before vs after, and the three light modes", [
    ("Wide", [(C + "R12_w_before/t0.30.png", "Before", None), (C + "R12_w_mix/t0.30.png", "After (mixed)", None), (C + "R12_w_day/t0.30.png", "After, daylight", None), (C + "R12_w_lamp/t0.30.png", "After, lamps", None)]),
    ("Pews", [(C + "R12_p_before/t0.30.png", "Before", None), (C + "R12_p_mix/t0.30.png", "After (mixed)", None), (C + "R12_p_day/t0.30.png", "After, daylight", None), (C + "R12_p_lamp/t0.30.png", "After, lamps", None)])],
    "compare/r12_3_pews.jpg", w=260, h=462)
sheet("4. Regression: bench in all three modes, matte coat", [
    ("Bench", [(C + "R12_b_day/t0.30.png", "Daylight", None), (C + "R12_b_lamp/t0.30.png", "Lamps", None), (C + "R12_b_mix/t0.30.png", "Mixed", None), (C + "R12_coat/t2.60.png", "Matte coat, held gavel", None)])],
    "compare/r12_4_regression.jpg", w=260, h=462)
