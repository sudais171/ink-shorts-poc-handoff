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
GC = (0, 560, 1080, 1340); T = ["0.30", "0.90", "1.20", "1.50", "1.80", "2.20", "3.15", "3.60", "4.20"]
N = ["Rest", "Reaching", "Grip", "Raised", "Strike 1", "Strike 2", "Put down", "Release", "Hand back"]
sheet("1. Gavel reach: Round 10 (top, same camera) vs Round 11 (cinematic camera, and side inspection camera)", [
    ("Round 10", [(C + f"gav/t{t}.png", n, GC) for t, n in zip(["0.30", "1.00", "1.20", "1.50", "1.80", "2.20", "3.15", "4.20"], ["Rest", "Reaching", "Grip", "Raised", "Strike 1", "Strike 2", "Put down", "Hand back"])]),
    ("Cinematic", [(C + f"r11_g/t{t}.png", n, GC) for t, n in zip(T, N)]),
    ("Side", [(C + f"r11_sd/t{t}.png", n, GC) for t, n in zip(T, N)])], "compare/r11_1_gavel.jpg", w=230, h=166)
sheet("2. Wide shot: Round 10 vs Round 11 (gallery bounce light), then Round 11 in all three light modes", [
    ("Wide", [(C + "C_w/t0.30.png", "Round 10 (mixed)", None), (C + "R11_w_nobounce/t0.30.png", "Round 11, bounce off", None), (C + "R11_w_mix/t0.30.png", "Round 11, mixed", None),
              (C + "R11_w_day/t0.30.png", "Round 11, daylight", None), (C + "R11_w_lamp/t0.30.png", "Round 11, lamps", None)]),
    ("Pews", [(C + "C_p/t0.30.png", "Round 10 pews", None), (C + "R11_p_nobounce/t0.30.png", "Round 11, bounce off", None), (C + "R11_p_mix/t0.30.png", "Round 11, mixed", None), (C + "R11_p_day/t0.30.png", "Round 11, daylight", None), (C + "R11_p_lamp/t0.30.png", "Round 11, lamps", None)])],
    "compare/r11_2_wide_pews.jpg", w=260, h=462)
sheet("3. Judge's coat: Round 10 glossy vs Round 11 matte (same frame) and the regression views", [
    ("Coat", [(C + "coat_gloss/t2.60.png", "Before (glossy)", (300, 500, 800, 1100)), (C + "coat_matte/t2.60.png", "After (matte)", (300, 500, 800, 1100)),
              (C + "R11_b_mix/t0.30.png", "Bench + chair, mixed", None), (C + "R11_b_day/t0.30.png", "Bench, daylight", None), (C + "R11_b_lamp/t0.30.png", "Bench, lamps", None)]),
    ("Room", [(C + "R11_ws/t0.30.png", "Witness stand", None), (C + "R11_e/t0.30.png", "Evidence table", None), (C + "R11_c/t0.30.png", "Chair + seal", None), (C + "r11_sd/t1.80.png", "Contact, side view", (0, 560, 1080, 1340))])],
    "compare/r11_3_coat_regression.jpg", w=260, h=462)
