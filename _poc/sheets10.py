from PIL import Image, ImageDraw, ImageFont
F = "C:/Windows/Fonts/"; ft = ImageFont.truetype(F + "arialbd.ttf", 30); fs = ImageFont.truetype(F + "arial.ttf", 22)
R = "refs/"   # reference video frames (not included; see README)
C = "court/out/"; O = "scene3/out/"; TT = "turntable/out/"
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
sheet("1. Courtroom (Round 10) next to the saloon (Round 9) and the references", [
    ("Court", [(C + "C_w/t0.30.png", "Full courtroom", None), (C + "C_b/t0.30.png", "Judge's bench + chair", None), (C + "C_ws/t0.30.png", "Witness stand", None), (C + "C_p/t0.30.png", "Spectator pews", None)]),
    ("Saloon", [(O + "R9_b_mix/t2.60.png", "Saloon, wide", None), (O + "R9_k/t2.60.png", "Saloon, foreground chair", None), (R + "f4.jpg", "Ref: forge", None), (R + "f1.jpg", "Ref: casino", None)])],
    "compare/r10_1_court.jpg")
sheet("2. Courtroom light modes (same cameras): daylight / lamps / mixed", [
    ("Wide", [(C + "C_w_day/t0.30.png", "Daylight", None), (C + "C_w_lamp/t0.30.png", "Lamps", None), (C + "C_w/t0.30.png", "Mixed", None)]),
    ("Bench", [(C + "C_b_day/t0.30.png", "Daylight", None), (C + "C_b_lamp/t0.30.png", "Lamps", None), (C + "C_b/t0.30.png", "Mixed", None)])],
    "compare/r10_2_modes.jpg")
TC = (40, 200, 680, 1060); V4 = ["0.50", "1.50", "2.50", "3.50"]; N4 = ["Front", "Side", "Back", "Three-quarter"]
sheet("3. Designed courtroom furniture from four angles (neutral turntable)", [
    ("Chair", [(TT + f"c_judge_chair/t{t}.png", n, TC) for t, n in zip(V4, N4)]),
    ("Bench", [(TT + f"c_judge_bench/t{t}.png", n, TC) for t, n in zip(V4, N4)]),
    ("Witness", [(TT + f"c_witness_stand/t{t}.png", n, TC) for t, n in zip(V4, N4)]),
    ("Pew", [(TT + f"c_pew/t{t}.png", n, TC) for t, n in zip(V4, N4)])], "compare/r10_3_furniture.jpg", w=260, h=350)
GC = (0, 380, 1080, 1340); GT = ["0.30", "1.20", "1.50", "1.80", "2.20", "3.15", "4.20"]; GN = ["Resting", "Grip", "Raised", "Strike 1", "Strike 2", "Put down", "Hand back"]
sheet("4. Gavel interaction (same camera) and close-ups", [
    ("Gavel", [(C + f"gav/t{t}.png", n, GC) for t, n in zip(GT, GN)]),
    ("Close", [(C + "C_e/t0.30.png", "Evidence table", None), (C + "C_c/t0.30.png", "Chair + seal", None), (C + "gav/t1.80.png", "Contact on the block", (0, 700, 600, 1260)),
               (C + "C_b/t0.30.png", "Bench front", (100, 1000, 1000, 1900))])], "compare/r10_4_gavel.jpg", w=300, h=267)
