// Ink Shorts engine - characters.
// Rig space (all character drawing): hip centre (620,1508), head centre (HX,HY), head radius R, D = 2R.
// Style: no neck (head overlaps the body), lumpy per-character head silhouettes, brush outline ~0.02D on the lit side
// and 0.07-0.09D on the shadow side; a broad-shouldered tunic body about as wide as the head with real clothes,
// sleeved arms with hands, legs in hose with boots, beards that grow from the jaw (user-approved lineup, build B).
const HX = 609, HY = 850, R = 243, D = 2 * R;
const HIP = [620, 1508], NECK = [HX, HY + R * 0.85];

// ---------- head silhouettes: radius multipliers at right, low-right, bottom, low-left, left, up-left, top, up-right ----------
const SHAPES = {
  round: [1.02, 1.02, 0.98, 1.0, 1.0, 1.0, 0.98, 1.0],
  chinRight: [1.05, 1.05, 0.97, 0.89, 0.97, 1.03, 0.99, 1.04],   // flat slanted left side, chin pushed right
  chinLeft: [0.97, 0.89, 0.97, 1.05, 1.05, 1.04, 0.99, 1.03],
  egg: [0.92, 0.97, 1.04, 0.97, 0.93, 1.0, 1.08, 1.0],           // tall
  pear: [1.0, 1.07, 1.0, 1.07, 1.02, 0.93, 0.9, 0.93],           // narrow under the hat, broad jaw
  wide: [1.04, 1.0, 0.95, 1.0, 1.04, 1.0, 0.95, 1.0],
  square: [1.02, 1.05, 0.97, 1.05, 1.02, 0.96, 0.95, 0.96],
  bean: [0.98, 1.04, 1.0, 0.94, 0.95, 1.02, 1.02, 1.0],
};
function shapeR(sh, a) {
  const u = ((a / (Math.PI / 4)) % 8 + 8) % 8, i = Math.floor(u), t = u - i, p = k => sh[(i + k + 8) % 8];
  const p0 = p(-1), p1 = p(0), p2 = p(1), p3 = p(2);
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}
function headContour(c, n = 240) {
  const sh = SHAPES[c.shape] || c.shape || SHAPES.round, o = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = R * shapeR(sh, a) * (1 + 0.006 * Math.sin(3 * a + 1.3) + 0.004 * Math.sin(5 * a + 0.4));
    o.push([HX + Math.cos(a) * r, HY + Math.sin(a) * r]);
  }
  return o;
}

let RIM = 'rgba(255,238,196,.9)';        // warm rim light on the lit edge; set by the lighting preset
let FACE = '#f3f5fb', FACE_SHADE = ['#c4bedf', '#b3abd4'];
let LITE = false;                        // cheap drawing for small/background figures (crowds): no blur passes
// GLOSS (v0.9.1 default, user-approved): glossy, colourful look - a shine streak, spot and rim light on the clothes, a sharp
// shine on the head, white (not lavender) heads, and the whole figure drawn saturated (GLOSS = strength 0..1, 0 = the old
// matte look; SATURATE = how much brighter the colours get)
let GLOSS = 1, SATURATE = 1.75;
function glossTorso(tp, B, cloth = 'gloss') {
  const ls = lightSide(), w = (B.x1 - B.x0) / 2, cx = (B.x0 + B.x1) / 2, a = GLOSS;
  if (cloth === 'matte') {          // POC r11: woven cloth - no shine streak; a soft lit side, a shadow side and two folds
    g.save(); path(tp); g.clip();
    g.filter = 'blur(26px)'; g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.ellipse(cx + ls * w * .45, 1300, w * .38, 330, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(10,6,20,.28)'; g.beginPath(); g.ellipse(cx - ls * w * .62, 1320, w * .34, 360, 0, 0, 7); g.fill();
    g.filter = 'blur(6px)'; g.strokeStyle = 'rgba(255,255,255,.09)'; g.lineWidth = 10;
    for (const f of [-.25, .2]) { g.beginPath(); g.moveTo(cx + f * w, 1150); g.quadraticCurveTo(cx + f * w * 1.2, 1350, cx + f * w * .9, 1560); g.stroke(); }
    g.restore(); return;
  }
  g.save(); path(tp); g.lineWidth = 60; g.strokeStyle = `rgba(255,255,255,${.3 * a})`; g.stroke();
  const sx = cx + ls * w * .52;
  g.fillStyle = `rgba(255,255,255,${.45 * a})`; g.beginPath(); g.ellipse(sx, 1250, w * .1, 190, ls * -.12, 0, 7); g.fill();
  g.fillStyle = `rgba(255,255,255,${.88 * a})`; g.beginPath(); g.ellipse(sx - ls * 4, 1225, w * .04, 125, ls * -.12, 0, 7); g.fill();
  g.beginPath(); g.arc(sx + ls * 6, 1440, w * .045, 0, 7); g.fillStyle = `rgba(255,255,255,${.8 * a})`; g.fill();
  g.restore();
}
function glossHead(c) {
  const ls = lightSide(), a = GLOSS;
  g.save(); path(headContour(c)); g.clip();
  g.fillStyle = `rgba(255,255,255,${.95 * a})`; g.beginPath(); g.ellipse(HX + ls * R * .36, HY - R * .5, R * .34, R * .14, ls * -.6, 0, 7); g.fill();
  g.beginPath(); g.arc(HX + ls * R * .68, HY - R * .1, R * .06, 0, 7); g.fill();
  g.restore();
}
function headDraw(c) {
  const ct = headContour(c), nrm = normals(ct);
  if (LITE) {
    g.fillStyle = c.skin || FACE; path(ct); g.fill();
    g.save(); path(ct); g.clip(); g.fillStyle = FACE_SHADE[0]; bandPath(ct, nrm, a => D * 0.07 * Math.pow(shadowK(a), 1.8)); g.fill('evenodd'); g.restore();
    bandPath(ct, nrm, a => D * (0.03 + 0.07 * Math.pow(shadowK(a), 1.8))); g.fillStyle = INK; g.fill('evenodd');
    return;
  }
  g.save(); path(ct); g.clip();
  g.fillStyle = c.skin || (GLOSS ? '#f8f7f5' : FACE); g.fillRect(HX - R * 1.3, HY - R * 1.3, R * 2.6, R * 2.6);
  // narrow lavender band hugging the inside of the shadow side, darker right at the edge
  g.filter = 'blur(9px)'; g.fillStyle = GLOSS ? '#cdc8c4' : FACE_SHADE[0];   // GLOSS: neutral grey shading so the head stays white
  bandPath(ct, nrm, a => D * (0.02 + 0.13 * Math.pow(shadowK(a), 1.8))); g.fill('evenodd');
  g.filter = 'blur(4px)'; g.fillStyle = GLOSS ? '#b9b3af' : FACE_SHADE[1];
  bandPath(ct, nrm, a => D * 0.05 * Math.pow(shadowK(a), 2.2)); g.fill('evenodd');
  // warm rim of light just inside the lit edge
  g.filter = 'blur(3px)'; g.fillStyle = GLOSS ? 'rgba(255,255,255,.9)' : RIM;
  bandPath(ct, nrm, a => D * 0.03 * Math.pow(1 - shadowK(a), 3)); g.fill('evenodd');
  g.filter = 'none';
  if (SOFT3D) {        // soft 3D: a deep soft core shadow, warm bounce light inside the shadow edge, a soft highlight
    const ls = lightSide(); g.globalAlpha = SOFT3D;
    g.filter = 'blur(16px)'; g.fillStyle = GLOSS ? 'rgba(92,88,96,.42)' : 'rgba(110,86,160,.5)';
    bandPath(ct, nrm, a => D * (0.04 + 0.38 * Math.pow(shadowK(a), 1.5))); g.fill('evenodd');
    g.filter = 'blur(5px)'; g.fillStyle = GLOSS ? 'rgba(195,225,255,.55)' : 'rgba(255,214,170,.75)';
    bandPath(ct, nrm, a => D * 0.115 * Math.pow(shadowK(a), 2.2)); g.fill('evenodd');
    g.filter = 'blur(14px)'; g.fillStyle = 'rgba(255,255,255,.9)';
    g.beginPath(); g.ellipse(HX + ls * R * .42, HY - R * .48, R * .34, R * .2, -.6 * ls, 0, 7); g.fill();
    g.filter = 'none'; g.globalAlpha = 1;
  }
  if (c.hat && c.hat !== 'bald' && c.hat !== 'none') shadowBlob(HX + R * 0.2, HY - R * 0.55, R * 0.9, R * 0.09, 'rgba(110,100,160,.35)', 12);
  if (c.blush) for (const sx of [-0.2, 0.2]) shadowBlob(HX + D * (sx + c.faceShift), HY + D * 0.08, D * 0.06, D * 0.03, 'rgba(240,120,130,.45)', 6);
  g.restore();
  // brush outline: hairline-ish on the lit side, heavy on the shadow side and under the chin, slow width wobble
  const ph = (c.key || 'x').length * 1.7;
  bandPath(ct, nrm, a => {
    const w = D * (0.019 + 0.058 * Math.pow(shadowK(a), 1.8)) + D * 0.012 * Math.exp(-Math.pow((a - Math.PI / 2 + 0.3) / 0.45, 2));
    return w * (1 + 0.1 * Math.sin(3 * a + ph) + 0.05 * Math.sin(7 * a + ph * 2));
  });
  g.fillStyle = INK; g.fill('evenodd');
}

// ---------- hats (drawn in head space) ----------
function tweedCap() {
  const crown = chain([[HX - R * 1.0, HY - R * 0.40], [HX - R * 1.08, HY - R * 0.82], [HX - R * 0.55, HY - R * 1.18], [HX + R * 0.15, HY - R * 1.2],
                       [HX + R * 0.8, HY - R * 1.2], [HX + R * 1.12, HY - R * 0.9], [HX + R * 1.06, HY - R * 0.55],
                       [HX + R * 0.6, HY - R * 0.62], [HX - R * 0.4, HY - R * 0.58], [HX - R * 1.0, HY - R * 0.40]], 30);
  const peak = chain([[HX - R * 0.42, HY - R * 0.6], [HX + R * 0.1, HY - R * 0.66], [HX + R * 0.8, HY - R * 0.68], [HX + R * 1.1, HY - R * 0.62],
                      [HX + R * 1.22, HY - R * 0.56], [HX + R * 1.14, HY - R * 0.46], [HX + R * 0.95, HY - R * 0.43],
                      [HX + R * 0.5, HY - R * 0.36], [HX - R * 0.05, HY - R * 0.4], [HX - R * 0.42, HY - R * 0.6]], 30);
  g.save(); g.translate(0, -R * 0.12);
  g.save(); path(crown); g.clip();
  let gr = g.createLinearGradient(HX - R, HY - R * 1.2, HX + R * .9, HY - R * .5);
  gr.addColorStop(0, '#a88a6c'); gr.addColorStop(.5, '#8a6c52'); gr.addColorStop(1, '#5e4636');
  g.fillStyle = gr; g.fillRect(HX - R * 1.3, HY - R * 1.3, R * 2.6, R);
  seed = 11;
  for (let i = 0; i < (LITE ? 0 : 1600); i++) { g.fillStyle = rnd() < .5 ? 'rgba(60,40,30,.35)' : 'rgba(210,190,160,.3)'; g.fillRect(HX - R * 1.15 + rnd() * R * 2.3, HY - R * 1.25 + rnd() * R * .9, 3 + rnd() * 5, 2); }
  shadowBlob(HX - R * 0.45, HY - R * 1.0, R * 0.35, R * 0.1, 'rgba(255,240,215,.4)', 12);
  brush(chain([[HX - R * 0.1, HY - R * 1.18], [HX + R * 0.1, HY - R * 0.95], [HX + R * 0.2, HY - R * 0.8], [HX + R * 0.25, HY - R * 0.62]]), () => 4, 'rgba(50,32,24,.6)', false);
  g.restore();
  inkRing(crown, D * 0.012, D * 0.032);
  g.fillStyle = INK; g.beginPath(); g.ellipse(HX + R * 0.15, HY - R * 1.2, 15, 9, 0, 0, 7); g.fill();
  g.save(); path(peak); g.clip();
  gr = g.createLinearGradient(0, HY - R * .68, 0, HY - R * .38); gr.addColorStop(0, '#8d7056'); gr.addColorStop(1, '#4a3428');
  g.fillStyle = gr; g.fillRect(HX - R * .5, HY - R * .75, R * 1.8, R * .4);
  g.restore();
  inkRing(peak, D * 0.012, D * 0.03);
  g.restore();
}
function hatDraw(c) {
  const hat = c.hat || 'none', col = c.hatColor;
  if (hat === 'none') return;
  if (hat === 'cap') return tweedCap();
  if (hat === 'bald') {
    for (const [dx, k] of [[-0.25, 1], [0, 1.1], [0.25, .9]])
      brush(chain([[HX + R * (dx - .25), HY - R * .9], [HX + R * (dx - .1), HY - R * (1.02 + .05 * k)], [HX + R * (dx + .15), HY - R * 1.04], [HX + R * (dx + .3), HY - R * .95]]), taper(7, .3, .3, .3));
    return;
  }
  if (hat === 'beret') {
    fillInk(ellPts(HX - R * .1, HY - R * .78, R * .85, R * .32, 48, -0.12), col || '#c8384a', D * .012, D * .03);
    brush(spline([[HX + R * .45, HY - R * .9], [HX + R * .75, HY - R * 1.3], [HX + R * 1.05, HY - R * 1.55]]), taper(34, .2, .4, .2), '#f6f4ee');
    return;
  }
  if (hat === 'visor') {   // bookie's green eyeshade
    fillInk([[HX - R * .95, HY - R * .55], [HX + R * .95, HY - R * .55], [HX + R * 1.15, HY - R * .32], [HX - R * 1.15, HY - R * .32]], col || '#3fae5a', D * .01, D * .025);
    brush([[HX - R * .95, HY - R * .6], [HX + R * .95, HY - R * .6]], () => D * .03, '#2a2030');
    return;
  }
  if (hat === 'helmet') {   // soldier's kettle helmet: a steel dome sitting on the head, a narrow brim, rivets.
    // No nose guard (user: the bar down the face read as a nose) and no flat lid: the dome follows the head's curve.
    const st = col || '#a9b0bc', y0 = HY - R * .46;
    shadedShape(ellPts(HX, y0 + R * .02, R * 1.24, R * .2, 48), shade(st, .35), st, shade(st, -.38), D * .008, D * .02);   // brim
    const dome = [];
    for (let i = 0; i <= 28; i++) { const a = Math.PI + .42 + (Math.PI - .84) * i / 28; dome.push([HX + Math.cos(a) * R * 1.1, HY + R * .0 + Math.sin(a) * R * 1.16]); }
    dome.push([HX + R * .99, y0], [HX - R * .99, y0]);
    shadedShape(dome, shade(st, .45), st, shade(st, -.35), D * .01, D * .026);
    if (LITE) return;
    g.fillStyle = 'rgba(255,255,255,.55)';                                                    // shine on the lit side
    path(spline([[HX - R * .62, HY - R * .62], [HX - R * .5, HY - R * .9], [HX - R * .22, HY - R * 1.06], [HX - R * .3, HY - R * .94], [HX - R * .5, HY - R * .7]], 6)); g.fill();
    brush(spline([[HX - R * .98, y0 - R * .1], [HX, y0 - R * .16], [HX + R * .98, y0 - R * .1]]), () => D * .008, shade(st, -.4), false);   // band seam
    for (const u of [-.7, -.35, 0, .35, .7]) { g.fillStyle = shade(st, -.5); g.beginPath(); g.arc(HX + R * u, y0 - R * .05 - R * .06 * (1 - u * u), D * .009, 0, 7); g.fill(); }
    return;
  }
  if (hat === 'crown') {
    const pts = [[HX - R * .75, HY - R * .55], [HX - R * .8, HY - R * 1.05], [HX - R * .5, HY - R * .8], [HX - R * .25, HY - R * 1.15], [HX, HY - R * .82],
                 [HX + R * .25, HY - R * 1.15], [HX + R * .5, HY - R * .8], [HX + R * .8, HY - R * 1.05], [HX + R * .75, HY - R * .55]];
    const cc = col || '#e3b83c';            // hatColor: '#c9d2dc' gives a silver crown
    shadedShape(pts, shade(cc, .45), cc, shade(cc, -.32), D * .01, D * .025);
    for (const [x, cc] of [[-.4, '#d63c30'], [0, '#3b7fd6'], [.4, '#3fae5a']]) { g.fillStyle = cc; g.beginPath(); g.arc(HX + R * x, HY - R * .68, R * .07, 0, 7); g.fill(); }
    return;
  }
  if (hat === 'jcap') {
    const dome = chain([[HX - R * .85, HY - R * .55], [HX - R * .9, HY - R * 1.15], [HX + R * .9, HY - R * 1.15], [HX + R * .85, HY - R * .55]], 20);
    shadedShape(dome, shade(col || '#d63c30', .3), col || '#d63c30', shade(col || '#d63c30', -.3), D * .012, D * .03);
    fillInk([[HX + R * .5, HY - R * .62], [HX + R * 1.3, HY - R * .55], [HX + R * 1.2, HY - R * .45], [HX + R * .4, HY - R * .5]], shade(col || '#d63c30', -.3), D * .01, D * .02);
    return;
  }
  // brimmed hats: bowler, boater, straw, tophat
  const def = { bowler: ['#6d4b38', 1.38, 0.98, .13, '#2a1c16'], boater: ['#f2dd9a', 1.22, 0.98, .13, '#b8322c'], straw: ['#f6dd8a', 1.22, 1.35, .2, '#3f6fc4'], tophat: ['#3a3040', 1.9, 1.0, .13, '#7a2a2a'] }[hat] || ['#6d4b38', 1.3, 1, .13, '#2a1c16'];
  const [base, top, bw, bh, band] = def, cc = col || base;
  const brim = ellPts(HX, HY - R * 0.66, R * bw, R * bh, 60);
  const crown = hat === 'bowler'
    ? chain([[HX - R * .62, HY - R * .66], [HX - R * .66, HY - R * 1.1], [HX - R * .4, HY - R * top], [HX, HY - R * top], [HX + R * .4, HY - R * top], [HX + R * .66, HY - R * 1.1], [HX + R * .62, HY - R * .66]], 20)
    : [[HX - R * .6, HY - R * .66], [HX - R * .58, HY - R * top], [HX + R * .58, HY - R * top], [HX + R * .6, HY - R * .66]];
  shadedShape(brim, shade(cc, .25), cc, shade(cc, -.35), D * .012, D * .03);
  g.save(); path(crown); g.clip();
  shadedShape(crown, shade(cc, .25), cc, shade(cc, -.35), 0, 0);
  g.fillStyle = band; g.fillRect(HX - R, HY - R * .86, R * 2, R * .14);
  g.restore();
  inkRing(crown, D * .012, D * .03);
}

// ---------- hair (head space): c.hair = style, c.hairColor ----------
// Each style has a 'back' layer (drawn behind the head: long hair, buns, tails, afros) and a 'front' layer (the cap
// over the skull and the fringe, drawn after the face). The cap follows the character's own head silhouette.
const HAIR_COLORS = ['#2a1d18', '#4a2e1e', '#6b4226', '#a0682e', '#d9a74a', '#c4552d', '#8a8a8a', '#e8e4dc', '#1c1c24'];
// cap: outer edge = head contour lifted by `thick`, inner edge = the hairline (right to left), optional jag on the hairline
function hairCap(c, thick, hairline, jag = 0, a0 = Math.PI - 0.12, a1 = 2 * Math.PI + 0.12) {
  const sh = SHAPES[c.shape] || c.shape || SHAPES.round, out = [];
  for (let i = 0; i <= 48; i++) {
    const a = L2(a0, a1, i / 48), t = typeof thick === 'function' ? thick(a) : thick;
    out.push([HX + Math.cos(a) * R * shapeR(sh, a) * (1 + t), HY + Math.sin(a) * R * shapeR(sh, a) * (1 + t)]);
  }
  let inner = spline(hairline.map(([x, y]) => [HX + x * R, HY + y * R]), 8);
  if (jag) inner = inner.map(([x, y], i) => [x, y + (i % 4 < 2 ? 1 : -1) * jag * R * (i > 2 && i < inner.length - 3 ? 1 : 0)]);
  return out.concat(inner);
}
function hairFill(pts, col, strands = 8, seed0 = 1) {
  const b = boundsOf(pts), gr = g.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
  gr.addColorStop(0, shade(col, .22)); gr.addColorStop(.5, col); gr.addColorStop(1, shade(col, -.28));
  g.fillStyle = gr; path(pts); g.fill();
  if (!LITE && strands) {
    g.save(); path(pts); g.clip(); g.globalAlpha = .5;
    for (let i = 0; i < strands; i++) {
      const u = (i + .5) / strands, x = L2(b.x0, b.x1, u), y0 = b.y0 + (b.y1 - b.y0) * hash(seed0 + i) * .3;
      brush(spline([[x, y0], [x + (u - .5) * 40, L2(y0, b.y1, .5)], [x + (u - .5) * 70, b.y1]]), taper(5, .3, .4, .2), hash(seed0 + i * 3) < .5 ? shade(col, .3) : shade(col, -.35), false);
    }
    g.restore();
  }
  inkRing(pts, D * .008, D * .02);
}
const STD_LINE = [[.98, .12], [.9, -.25], [.55, -.55], [0, -.62], [-.55, -.55], [-.9, -.25], [-.98, .12]];
const HAIR = {
  short: { front: (c, col) => hairFill(hairCap(c, a => .05 + .05 * Math.max(0, -Math.sin(a)), STD_LINE, .02), col) },
  side: { front: (c, col) => {
    hairFill(hairCap(c, a => .06 + .06 * Math.max(0, -Math.sin(a)), [[.98, .12], [.85, -.35], [.35, -.72], [-.15, -.5], [-.6, -.42], [-.92, -.15], [-.98, .12]]), col);
    if (!LITE) brush(spline([[HX + .35 * R, HY - .72 * R], [HX + .3 * R, HY - .95 * R], [HX + .2 * R, HY - 1.05 * R]]), taper(5, .3, .3, .3), shade(col, -.4));
  } },
  curly: { front: (c, col) => {
    hairFill(hairCap(c, a => .1 + .07 * Math.abs(Math.sin(a * 9)) + .06 * Math.max(0, -Math.sin(a)), STD_LINE, .03), col, 0);
    if (!LITE) { g.strokeStyle = shade(col, -.35); g.lineWidth = 4; for (let i = 0; i < 14; i++) { const a = Math.PI + .2 + i * .2; g.beginPath(); g.arc(HX + Math.cos(a) * R * .88, HY + Math.sin(a) * R * .9 - 4, 14, 0, 4); g.stroke(); } }
  } },
  spiky: { front: (c, col) => hairFill(hairCap(c, a => .06 + .2 * Math.max(0, -Math.sin(a)) * Math.pow(Math.abs(Math.sin(a * 6)), 3), STD_LINE, .02), col, 4) },
  buzz: { front: (c, col) => { g.save(); g.globalAlpha = .55; hairFill(hairCap(c, .015, STD_LINE), col, 0); g.restore(); } },
  mohawk: { front: (c, col) => hairFill(hairCap(c, a => .32 * Math.pow(Math.max(0, -Math.sin(a)), 8) * (0.7 + .3 * Math.abs(Math.sin(a * 10))), [[.22, -.95], [0, -1.0], [-.22, -.95]], 0, 1.5 * Math.PI - .32, 1.5 * Math.PI + .32), col, 3) },
  receding: { front: (c, col) => { for (const s of [-1, 1]) hairFill(loopPts([[HX + s * .82 * R, HY - .5 * R], [HX + s * 1.03 * R, HY - .2 * R], [HX + s * 1.0 * R, HY + .15 * R], [HX + s * .86 * R, HY + .1 * R], [HX + s * .8 * R, HY - .2 * R]], 8), col, 3); } },
  afro: {
    back: (c, col) => hairFill(loopPts(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2, r = R * (1.18 + .05 * Math.sin(i * 5)); return [HX + Math.cos(a) * r, HY - .2 * R + Math.sin(a) * r * .95]; }), 6), col, 0),
    front: (c, col) => hairFill(hairCap(c, .08, STD_LINE, .03), col, 0),
  },
  bob: {
    back: (c, col) => hairFill(loopPts([[HX - 1.12 * R, HY + .5 * R], [HX - 1.18 * R, HY - .4 * R], [HX - .7 * R, HY - 1.15 * R], [HX + .7 * R, HY - 1.15 * R], [HX + 1.18 * R, HY - .4 * R], [HX + 1.12 * R, HY + .5 * R], [HX + .8 * R, HY + .58 * R], [HX - .8 * R, HY + .58 * R]], 8), shade(col, -.1), 6),
    front: (c, col) => {
      hairFill(hairCap(c, .1, [[1.02, .5], [.88, .5], [.9, -.1], [.6, -.48], [0, -.5], [-.6, -.48], [-.9, -.1], [-.88, .5], [-1.02, .5]], 0, Math.PI - .55, 2 * Math.PI + .55), col, 10);
    },
  },
  long: {
    // slimmer and softer (user: "so big and cubic"): hugs the head, falls to the shoulders, rounded tips that curl in
    back: (c, col) => hairFill(loopPts([[HX - .62 * R, HY + 1.3 * R], [HX - .98 * R, HY + 1.0 * R], [HX - 1.08 * R, HY + .3 * R], [HX - .98 * R, HY - .7 * R], [HX, HY - 1.08 * R], [HX + .98 * R, HY - .7 * R], [HX + 1.08 * R, HY + .3 * R], [HX + .98 * R, HY + 1.0 * R], [HX + .62 * R, HY + 1.3 * R], [HX, HY + 1.2 * R]], 10), shade(col, -.12), 10, 5),
    front: (c, col) => hairFill(hairCap(c, .045, [[1.02, .72], [.9, .7], [.86, -.05], [.45, -.52], [.05, -.66], [-.05, -.66], [-.45, -.52], [-.86, -.05], [-.9, .7], [-1.02, .72]], 0, Math.PI - .25, 2 * Math.PI + .25), col, 12, 7),   // arc ends at the side locks
  },
  // the tail is tied high at the back of the head: hidden when she faces us (user: "no one sees stuff that's on the
  // back when looking from front"), showing behind the head - the side away from her face - once she turns
  ponytail: {
    back: (c, col, P) => { const tr = (P && P.turn) || 0; if (Math.abs(tr) >= .3) ponytailSide(c, col, -Math.sign(tr)); },
    front: (c, col, P) => {
      hairFill(hairCap(c, .06, [[.98, .12], [.9, -.3], [.5, -.62], [0, -.7], [-.5, -.62], [-.9, -.3], [-.98, .12]]), col, 6);
      const tr = (P && P.turn) || 0;
      if (Math.abs(tr) >= .3) scrunchie(c, HX - Math.sign(tr) * .9 * R, HY - .56 * R, -Math.sign(tr) * .75);
    },
  },
  bun: {
    back: (c, col) => hairFill(ellPts(HX + .1 * R, HY - 1.12 * R, .36 * R, .3 * R, 32), col, 4),
    front: (c, col) => hairFill(hairCap(c, .06, [[.98, .12], [.9, -.3], [.5, -.62], [0, -.7], [-.5, -.62], [-.9, -.3], [-.98, .12]]), col, 6),
  },
  pigtails: {
    back: (c, col) => { for (const s of [-1, 1]) hairFill(loopPts([[HX + s * .85 * R, HY - .45 * R], [HX + s * 1.35 * R, HY - .2 * R], [HX + s * 1.5 * R, HY + .35 * R], [HX + s * 1.15 * R, HY + .1 * R]], 8), col, 3); },
    front: (c, col) => { hairFill(hairCap(c, .06, STD_LINE, .02), col, 6); if (!LITE) for (const s of [-1, 1]) fillInk(ellPts(HX + s * .95 * R, HY - .38 * R, 15, 15, 12), '#e05a8a', 2, 4); },
  },
};
// ---------- the ponytail (user: the first one looked "drawn by a child"; the reference is a high tail with a scrunchie) ----------
// A lift of volume above the tie, the tail curving back and down, fullest in the middle, tapering into separate locks;
// strands follow the flow. s = the side it hangs on (behind the head); `back` = seen from behind, hanging down the middle.
function flowStrands(pts, col, lines, w = 5) {
  if (LITE) return;
  g.save(); path(pts); g.clip(); g.globalAlpha = .55;
  lines.forEach((l, i) => brush(spline(l), taper(w, .25, .45, .15), i % 2 ? shade(col, -.38) : shade(col, .32), false));
  g.restore();
}
function ponytailSide(c, col, s) {
  const P = (x, y) => [HX + s * x * R, HY + y * R];
  const pts = loopPts([P(.86, -.66), P(1.02, -.84), P(1.24, -.88), P(1.44, -.72), P(1.57, -.42), P(1.6, -.04), P(1.54, .36), P(1.42, .72),
    P(1.31, 1.0), P(1.2, 1.25), P(1.15, 1.05), P(1.07, 1.18), P(1.03, .97), P(.97, 1.07), P(.99, .8), P(1.05, .45), P(1.07, .1), P(1.03, -.22), P(.95, -.44)], 6);
  hairFill(pts, col, 0);
  flowStrands(pts, col, [0, 1, 2, 3, 4, 5, 6].map(i => { const u = i / 6; return [P(.95 + u * .1, -.62 + u * .1), P(1.18 + u * .3, -.72 + u * .25), P(1.12 + u * .38, .1 + u * .1), P(1.02 + u * .26, .95 + u * .2)]; }));
}
function ponytailBack(c, col) {
  const P = (x, y) => [HX + x * R, HY + y * R];
  const pts = loopPts([P(-.16, -.36), P(-.34, -.2), P(-.4, .16), P(-.34, .64), P(-.22, 1.02), P(-.12, 1.32), P(-.04, 1.12), P(.05, 1.36), P(.12, 1.1),
    P(.24, .98), P(.36, .6), P(.4, .14), P(.33, -.2), P(.16, -.36)], 6);
  hairFill(pts, col, 0);
  flowStrands(pts, col, [-3, -2, -1, 0, 1, 2, 3].map(i => [P(i * .04, -.3), P(i * .1, .1), P(i * .09, .7), P(i * .05, 1.2)]));
  scrunchie(c, HX, HY - .34 * R, Math.PI / 2);
}
// the band round the tail: a puffy fabric loop, gathered (ang = the direction across it)
function scrunchie(c, x, y, ang) {
  if (LITE) return;
  const col = c.tieColor || '#e8b42e';
  g.save(); g.translate(x, y); g.rotate(ang);
  shadedShape(loopPts([[-.1 * R, -.16 * R], [.1 * R, -.16 * R], [.13 * R, 0], [.1 * R, .16 * R], [-.1 * R, .16 * R], [-.13 * R, 0]], 8), shade(col, .3), col, shade(col, -.3), D * .004, D * .01);
  for (const v of [-.07, 0, .07]) brush([[v * R - .02 * R, -.13 * R], [v * R + .02 * R, .13 * R]], () => 3, shade(col, -.35), false);
  g.restore();
}
function hairDraw(c, layer, P) {
  const H = HAIR[c.hair]; if (!H || !H[layer]) return;
  H[layer](c, c.hairColor || HAIR_COLORS[Math.floor(hash(keyNum(c) + 5) * 6)], P);
}

// ---------- faces: built from parts ----------
// Each character mixes its own parts (picked automatically from its key when not given, so no two people share a face):
//   c.eyeStyle 'dot'|'round'|'bean'|'lid'|'narrow', c.brows 'wedge'|'thin'|'thick'|'arched'|'bushy'|'uni',
//   c.nose null|'dot'|'button'|'long'|'big', c.lashes, c.age 0..1 (lines, bags), c.freckles, c.glasses, c.blush.
// Each moment moves the parts (usually spread from EXPR.* in people.js):
//   eyes: override 'laugh'|'closed'|'squeeze'|'wide'|'shock' ('lid' = half-lidded own eyes), lid 0..1 (how open),
//   lidTilt (+ angry: inner corners down, - sad: outer corners down), look -1..1, blink, browL, browR (raise, D units),
//   browTilt (+ angry, - worried), mouth 'neutral'|'smile'|'smirk'|'laugh'|'talk'|'o'|'shock'|'wavy'|'frown'|'yawn'|
//   'teeth'|'cry', open 0..1, smug, grin, tears 0..1, sweat
const EYE_STYLES = ['dot', 'round', 'bean', 'narrow', 'dot', 'round'];   // 'lid' reads smug at rest: only when asked
const BROW_STYLES = ['wedge', 'thin', 'thick', 'arched', 'bushy', 'wedge'];
const NOSES = [null];                    // the style has no noses (user); c.nose 'dot'|'button'|'long'|'big' only when a story asks
const keyNum = c => (c.key || 'x').split('').reduce((s, ch, i) => s + ch.charCodeAt(0) * (i + 3), 0);
const partOf = (c, field, list, salt) => c[field] !== undefined ? c[field] : list[Math.floor(hash(keyNum(c) * 13 + salt) * list.length) % list.length];
const MOUTH_INK = '#2a1420', TONGUE = '#d4626e', TEETH = '#f7f5f0';

// one eye. side -1 = left on screen. op = how open (0 shut .. 1); lt = lid tilt; skin = colour under the lid
function eyeDraw(c, style, ex, ey, F, side, op, lt) {
  const look = F.look || 0, skin = c.skin || FACE, hw = D * 0.105;
  const lineEye = y => brush(chain([[ex - hw * .75, y], [ex - hw * .35, y + D * .025], [ex + hw * .35, y + D * .025], [ex + hw * .75, y]]), taper(D * 0.03, .3, .3, .4));
  if (op < 0.12) { lineEye(ey); return; }
  if (style === 'lid') {         // the house look: half-oval pupil under a heavy lid line
    const tilt = side < 0 ? 0.05 : -0.05, a = [ex - hw, ey - tilt * hw], b = [ex + hw, ey + tilt * hw], d = lt * D * .03;
    if (side < 0) { b[1] += d; a[1] -= d * .5; } else { a[1] += d; b[1] -= d * .5; }   // inner corner down = angry
    g.fillStyle = INK; g.beginPath(); g.ellipse(ex + D * 0.035 * look, ey + D * 0.004, D * 0.048, D * 0.085 * op, 0, 0, Math.PI); g.fill();
    brush([a, [ex, ey], b], taper(D * 0.034, .25, .25, .45));
    return;
  }
  let rx, ry, white = false, shine = false;
  if (style === 'round') { rx = D * .066; ry = D * .072; white = true; }
  else if (style === 'bean') { rx = D * .046; ry = D * .072; shine = true; }
  else if (style === 'narrow') { rx = D * .062; ry = D * .026; }
  else { rx = D * .04; ry = D * .058; }                 // dot
  const px = ex + D * .022 * look;
  // eyelid (not fully open, or tilted: sleepy, sad, angry): the eye is CUT along the lid line rather than painted over
  // with a skin-coloured block - on the glossy shaded head a flat lid showed as a pale rectangle (user, 2026-11-09)
  // inner corner = towards the nose: lt > 0 pulls it down (angry), lt < 0 pulls the outer corner down (sad)
  const lidOn = op < 0.97 || Math.abs(lt) > 0.05;
  const cut = ey - ry + 2 * ry * (1 - op), yIn = cut + lt * D * .045, yOut = cut - lt * D * .02;
  const lidA = [ex - rx * 1.5, side < 0 ? yOut : yIn], lidB = [ex + rx * 1.5, side < 0 ? yIn : yOut];
  if (lidOn) { g.save(); g.beginPath(); g.moveTo(...lidA); g.lineTo(...lidB); g.lineTo(ex + rx * 1.5, ey + ry * 2); g.lineTo(ex - rx * 1.5, ey + ry * 2); g.closePath(); g.clip(); }
  if (white) {
    g.fillStyle = '#fbfcff'; g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, 7); g.clip();
    g.fillStyle = INK; g.beginPath(); g.arc(px, ey + D * .01, D * .033, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = INK; g.lineWidth = D * .014; g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, 7); g.stroke();
  } else {
    g.fillStyle = INK; g.beginPath(); g.ellipse(px, ey, rx, ry, 0, 0, 7); g.fill();
    if (shine && !LITE) { g.fillStyle = '#fff'; g.beginPath(); g.arc(px - rx * .3, ey - ry * .4, rx * .28, 0, 7); g.fill(); }
  }
  if (lidOn) {
    g.restore();
    // the lid line, only as wide as the eye (it used to run past both corners)
    const k = (y0, y1, f) => y0 + (y1 - y0) * f, w = rx * 1.12 / (rx * 1.5);
    const a = [ex - rx * 1.12, k(lidA[1], lidB[1], .5 - w / 2)], b = [ex + rx * 1.12, k(lidA[1], lidB[1], .5 + w / 2)];
    brush([a, b], taper(D * .026, .2, .2, .5));
  }
}
function browDraw(c, style, pts, w0) {
  const W = { wedge: taper(D * .04, .5, .15, .35), thin: taper(D * .022, .3, .3, .4), thick: taper(D * .062, .2, .2, .7),
              arched: taper(D * .026, .3, .4, .3), bushy: taper(D * .058, .3, .3, .6), uni: taper(D * .055, .2, .2, .7) }[style] || taper(D * .04, .5, .15, .35);
  brush(chain(pts), W);
  if (style === 'bushy' && !LITE) for (let i = 0; i < 5; i++) {
    const p = chain(pts)[Math.floor(i * 6 + 3)]; if (!p) continue;
    brush([[p[0], p[1]], [p[0] + (i - 2) * 4, p[1] - D * .035]], taper(D * .014, .2, .6, .3));
  }
}
function noseDraw(c, nose, nx, ny) {
  const skin = c.skin || FACE;
  if (nose === 'dot') { g.fillStyle = INK; g.beginPath(); g.ellipse(nx, ny, D * .02, D * .014, 0, 0, 7); g.fill(); }
  else if (nose === 'button') {
    const pts = ellPts(nx, ny, D * .045, D * .038, 28);
    shadedShape(pts, '#ffffff', skin, FACE_SHADE[0], D * .006, D * .014);
  } else if (nose === 'big') {
    const pts = ellPts(nx + D * .01, ny + D * .005, D * .07, D * .056, 32);
    shadedShape(pts, '#fff4f4', '#f3dfe4', '#d8b6c6', D * .007, D * .016);
  } else if (nose === 'long') {
    brush(spline([[nx - D * .015, ny - D * .085], [nx + D * .02, ny - D * .02], [nx + D * .06, ny + D * .02], [nx + D * .01, ny + D * .03]]), taper(D * .02, .2, .3, .4));
  }
}
// the mouth's height: faces with a moustache or beard get a slightly longer upper lip (room for the moustache)
const mouthY = c => HY + D * 0.17 + (c.stache || c.beard ? D * .025 : 0);
function faceDraw(c, F) {
  const fs = c.faceShift || 0, look = F.look || 0;
  const tr = F.turn || 0, sh = D * fs + D * 0.02 * (look - Math.sign(fs)) * 0.5 + D * .17 * tr;   // turn: the face turned to one side (walking)
  const blink = F.blink || 0, ey = HY - D * 0.01;
  const style = partOf(c, 'eyeStyle', EYE_STYLES, 1), brows = partOf(c, 'brows', BROW_STYLES, 2), nose = partOf(c, 'nose', NOSES, 3);
  const eyesType = F.eyes === 'lid' ? null : F.eyes;
  const op = Math.max(0, (F.lid ?? (F.eyes === 'lid' ? 0.55 : 1)) * (1 - blink)), lt = F.lidTilt || 0;
  const sp = .135 * (1 - .3 * Math.abs(tr)), eyes = [HX - D * sp + sh, HX + D * sp + sh];
  eyes.forEach((ex, i) => {
    const side = i ? 1 : -1, hw = D * 0.105;
    if (eyesType === 'laugh') {
      brush(chain([[ex - hw * .8, ey + D * .02], [ex - hw * .4, ey - D * .05], [ex + hw * .4, ey - D * .05], [ex + hw * .8, ey + D * .02]]), taper(D * 0.032, .3, .3, .4));
    } else if (eyesType === 'closed') {
      brush(chain([[ex - hw * .8, ey], [ex - hw * .4, ey + D * .03], [ex + hw * .4, ey + D * .03], [ex + hw * .8, ey]]), taper(D * 0.03, .3, .3, .4));
    } else if (eyesType === 'squeeze') {        // screwed shut: > <, with creases at the outer corners
      const tip = ex - side * hw * .55, back = ex + side * hw * .6;
      brush([[back, ey - D * .045], [tip, ey], [back, ey + D * .04]], taper(D * .032, .2, .2, .5));
      if (!LITE) for (const dy of [-.05, 0, .05]) brush([[back + side * D * .03, ey + D * dy * 1.2], [back + side * D * .075, ey + D * dy * 1.7]], taper(D * .012, .2, .5, .3));
    } else if (eyesType === 'wide' || eyesType === 'shock') {
      const r = eyesType === 'shock' ? D * .085 : D * .07, pr = eyesType === 'shock' ? D * .022 : D * .036;
      g.fillStyle = '#fbfcff'; g.beginPath(); g.arc(ex, ey + D * .01, r, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineWidth = D * .016; g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(ex + D * .025 * look, ey - D * .005, pr, 0, 7); g.fill();
    } else eyeDraw(c, style, ex, ey, F, side, op, lt);
    if (c.lashes && eyesType !== 'squeeze') for (let k = 0; k < 3; k++)
      brush([[ex + side * D * (.03 + k * .025), ey - D * .05 + k * D * .008], [ex + side * D * (.055 + k * .035), ey - D * .085 + k * D * .02]], taper(D * .012, .2, .5, .3));
    if (c.age > 0.35 && !LITE) {                // crow's feet and a bag under the eye
      for (const dy of [-.02, .015]) brush([[ex + side * D * .1, ey + D * dy], [ex + side * D * .14, ey + D * (dy * 1.8)]], taper(D * .01, .2, .5, .3), 'rgba(33,22,42,.6)');
      brush(spline([[ex - D * .06, ey + D * .085], [ex, ey + D * .1], [ex + D * .06, ey + D * .085]]), taper(D * .01, .3, .3, .3), 'rgba(33,22,42,.45)');
    }
    if (F.tears && !LITE) {
      g.save(); g.globalAlpha = F.tears;
      const tx = ex + side * D * .05, len = D * (.08 + .25 * F.tears);
      brush(spline([[tx, ey + D * .05], [tx + side * D * .01, ey + D * .05 + len * .5], [tx, ey + D * .05 + len]]), taper(D * .03, .2, .2, .7), '#8fd0ff');
      g.restore();
    }
    if (c.glasses) { g.strokeStyle = INK; g.lineWidth = D * .014; g.beginPath(); g.arc(ex, ey + D * .015, D * .09, 0, 7); g.stroke(); }
  });
  if (c.glasses) brush([[eyes[0] + D * .09, ey + D * .005], [eyes[1] - D * .09, ey + D * .005]], () => D * .012);
  // brows (raise / tilt move them; each style has its own weight)
  const bl = (F.browL || 0) * D, br = (F.browR || 0) * D, dn = blink * D * 0.012, tl = (F.browTilt || 0) * D * 0.05, arch = brows === 'arched' ? D * .03 : 0;
  const [e0, e1] = eyes;
  const Lb = [[e0 - D * .095, HY - D * .15 - bl * .6 + dn - tl], [e0 - D * .055, HY - D * .2 - bl * 1.2 + dn - tl * .6 - arch], [e0 + D * .025, HY - D * .2 - bl + dn + tl * .3 - arch], [e0 + D * .075, HY - D * .17 - bl * .4 + dn + tl]];
  const Rb = [[e1 - D * .085, HY - D * .15 - br * .4 + dn + tl], [e1 - D * .025, HY - D * .17 - br + dn + tl * .3 - arch], [e1 + D * .045, HY - D * .17 - br * 1.2 + dn - tl * .6 - arch], [e1 + D * .095, HY - D * .15 - br * .6 + dn - tl]];
  browDraw(c, brows, Lb); browDraw(c, brows, Rb);
  if (brows === 'uni') brush([Lb[3], Rb[0]], taper(D * .045, .2, .2, .7));
  // nose, age lines, freckles
  const mx = HX + sh - D * 0.01, my = mouthY(c);
  noseDraw(c, nose, HX + sh + D * .01, HY + D * .075);
  if (c.age > 0.6 && !LITE) for (const dy of [-.33, -.29]) brush(spline([[HX + sh - D * .12, HY + D * dy], [HX + sh, HY + D * (dy - .012)], [HX + sh + D * .12, HY + D * dy]]), taper(D * .01, .3, .3, .3), 'rgba(33,22,42,.4)');
  if (c.freckles && !LITE) { g.fillStyle = 'rgba(190,110,80,.6)'; for (let i = 0; i < 10; i++) { const s = i < 5 ? -1 : 1; g.beginPath(); g.arc(HX + sh + s * D * (.17 + hash(i + 3) * .1), HY + D * (.06 + hash(i + 9) * .07), D * .008, 0, 7); g.fill(); } }
  // facial hair
  // moustaches rest just above the lip (the smile's corners rise to about my - .055D), centred on the mouth (it sits a
  // little right of mx), clear of the eyes, and lift with the upper lip as the mouth opens (user: they sat on the mouth)
  { const cx = mx + D * .02, y = my - D * .03 * (F.open || 0);
    if (c.stache === 'walrus') {
      g.fillStyle = '#3a2c30';
      path(chain([[cx - D * .13, y - D * .055], [cx - D * .1, y - D * .115], [cx - D * .02, y - D * .115], [cx, y - D * .095], [cx + D * .02, y - D * .115], [cx + D * .1, y - D * .115], [cx + D * .13, y - D * .055],
                  [cx + D * .08, y - D * .075], [cx - D * .08, y - D * .075], [cx - D * .13, y - D * .055]], 12)); g.fill();
    } else if (c.stache === 'brush') { g.fillStyle = '#2f2228'; g.beginPath(); g.ellipse(cx, y - D * .08, D * .085, D * .015, 0, 0, 7); g.fill(); }
    else if (c.stache === 'handlebar') {
      for (const s of [-1, 1]) brush(spline([[cx, y - D * .072], [cx + s * D * .07, y - D * .084], [cx + s * D * .125, y - D * .06], [cx + s * D * .14, y - D * .085]]), taper(D * .036, .1, .6, .2), '#2f2228');
    }
  }
  // (beards are drawn by beardDraw before the face, so the mouth sits on top)
  // mouth
  const m = F.mouth || 'neutral', o = F.open || 0;
  const hole = (pts, teethTop, tongue) => {
    g.fillStyle = MOUTH_INK; path(pts); g.fill();
    g.save(); path(pts); g.clip(); const b = boundsOf(pts);
    if (teethTop) { g.fillStyle = TEETH; g.fillRect(b.x0, b.y0 - 2, b.x1 - b.x0, Math.min(D * .045, (b.y1 - b.y0) * .3)); }
    if (tongue) { g.fillStyle = TONGUE; g.beginPath(); g.ellipse((b.x0 + b.x1) / 2, b.y1, (b.x1 - b.x0) * .35, (b.y1 - b.y0) * .3 + 1, 0, 0, 7); g.fill(); }
    g.restore(); inkRing(pts, D * .01, D * .02);
  };
  if (m === 'laugh' || m === 'shock') {
    const w = m === 'shock' ? D * .06 : D * .11, top = my - D * .015, depth = m === 'shock' ? D * .14 * Math.max(.4, o) : D * .12 * o;
    const pts = m === 'shock' ? ellPts(mx, my + depth * .3, w, depth * .6, 32)
      : chain([[mx - w, top], [mx - w * .4, top - D * .01], [mx + w * .4, top - D * .01], [mx + w, top], [mx + w * .9, top + depth], [mx - w * .9, top + depth], [mx - w, top]], 16);
    hole(pts, m === 'laugh', true);
  } else if (m === 'yawn') {                    // tall stretched-open mouth: top teeth, tongue, dark throat
    const w = D * (.06 + .035 * o), h = D * (.05 + .17 * o);
    hole(ellPts(mx + D * .01, my + h * .3, w, h * .62, 36), true, true);
  } else if (m === 'cry') {                     // open wobbly frown
    const w = D * .085, h = D * (.03 + .06 * o), t = my - D * .005;
    hole(chain([[mx - w, t + h], [mx - w * .6, t - h * .2], [mx + w * .6, t - h * .2], [mx + w, t + h], [mx + w * .5, t + h * .8], [mx - w * .5, t + h * .8], [mx - w, t + h]], 16), false, true);
  } else if (m === 'teeth') {                   // gritted teeth: scared, straining, angry
    const w = D * .1, h = D * .05, pts = loopPts([[mx - w, my - h * .4], [mx + w, my - h * .5], [mx + w * 1.05, my + h * .5], [mx - w, my + h * .5]], 6);
    g.fillStyle = TEETH; path(pts); g.fill();
    g.save(); path(pts); g.clip(); g.strokeStyle = 'rgba(33,22,42,.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(mx - w, my); g.lineTo(mx + w, my); for (let x = mx - w + w / 3; x < mx + w; x += w / 3) { g.moveTo(x, my - h); g.lineTo(x, my + h); } g.stroke(); g.restore();
    inkRing(pts, D * .01, D * .02);
  } else if (m === 'talk') {
    // visemes: M closed (m/b/p), O round (o/u/w), A wide open (a/i), E wide flat (e), F teeth on lip (f/v), rest
    const v = F.vis || 'rest', cx = mx + D * .02;
    if (v === 'M') { brush(chain([[cx - D * .055, my + D * .01], [cx - D * .02, my + D * .02], [cx + D * .02, my + D * .02], [cx + D * .055, my + D * .005]]), taper(D * .028, .3, .3, .4)); }
    else {
      const dims = { O: [0.032, 0.03 + 0.045 * o], A: [0.065, 0.02 + 0.075 * o], E: [0.075, 0.014 + 0.03 * o], F: [0.06, 0.018], rest: [0.055, 0.012 + 0.05 * o] }[v] || [0.055, 0.012 + 0.05 * o];
      const w = D * dims[0], h = D * dims[1], pts = ellPts(cx, my + h * .3, w, h, 28);
      g.fillStyle = MOUTH_INK; path(pts); g.fill();
      g.save(); path(pts); g.clip();
      if (v === 'E' || v === 'F' || v === 'A') { g.fillStyle = TEETH; g.fillRect(cx - w, my + h * .3 - h, w * 2, h * (v === 'F' ? 0.9 : 0.45)); }
      if (h > D * .04) { g.fillStyle = TONGUE; g.beginPath(); g.ellipse(cx, my + h * 1.1, w * .7, h * .5, 0, 0, 7); g.fill(); }
      g.restore();
      inkRing(pts, D * .008, D * .016);
    }
  } else if (m === 'o') { g.fillStyle = INK; g.beginPath(); g.ellipse(mx, my, D * .028, D * .038, 0, 0, 7); g.fill(); }
  else if (m === 'wavy') {
    brush(chain([[mx - D * .07, my], [mx - D * .04, my - D * .03], [mx - D * .01, my + D * .02], [mx + D * .02, my], [mx + D * .04, my - D * .02], [mx + D * .06, my + D * .01], [mx + D * .08, my - D * .005]]), taper(D * .026, .3, .3, .4));
  } else if (m === 'frown' || m === 'sad') {
    brush(chain([[mx - D * .07, my + D * .03], [mx - D * .03, my - D * .02], [mx + D * .04, my - D * .02], [mx + D * .08, my + D * .03]]), taper(D * .03, .3, .3, .3));
  } else if (m === 'neutral') {                 // relaxed resting mouth: a short, nearly flat line
    const gn = F.grin || 0;
    brush(chain([[mx - D * .055, my - D * .005 * gn], [mx - D * .02, my + D * (.01 + .02 * gn)], [mx + D * .03, my + D * (.01 + .02 * gn)], [mx + D * .065, my - D * .008 * gn]]), taper(D * .028, .3, .3, .35));
  } else {                                      // 'smirk' / 'smile'
    const s = F.smug || 0, gn = m === 'smile' ? Math.max(1, F.grin || 0) : (F.grin || 0);
    brush(chain([[mx - D * (0.025 + 0.05 * gn) - D * .015 * s, my - D * .03 * gn], [mx + D * 0.02, my + D * (0.03 + 0.01 * s + 0.035 * gn)],
                 [mx + D * 0.08, my + D * (0.025 + 0.005 * s + 0.02 * gn)], [mx + D * (0.105 + 0.02 * s + 0.02 * gn), my - D * (0.02 + 0.03 * s + 0.02 * gn)]]),
          taper(D * 0.03, .3, .45, .25));
  }
  if (F.sweat) { g.save(); g.globalAlpha = F.sweat; fillInk([[HX + R * .7, HY - R * .6], [HX + R * .62, HY - R * .4], [HX + R * .7, HY - R * .32], [HX + R * .78, HY - R * .4]], '#bfe6ff', 2, 4); g.restore(); }
}

// ---------- old flat costumes (drawn in the old torso box x 424-796, y 1040-1508; fitted into the new body) ----------
const COSTUMES = {
  cardigan() {
    let gr = g.createLinearGradient(0, 1360, 0, 1508); gr.addColorStop(0, 'rgba(120,70,10,0)'); gr.addColorStop(1, 'rgba(120,70,10,.35)');
    g.fillStyle = gr; g.fillRect(410, 1360, 400, 150);
    g.strokeStyle = 'rgba(130,80,15,.45)'; g.lineWidth = 3;
    for (let x = 430; x < 800; x += 15) { g.beginPath(); g.moveTo(x, 1458); g.lineTo(x + 2, 1508); g.stroke(); }
    brush(chain([[640, 1170], [644, 1300], [648, 1420], [648, 1508]]), () => 6, 'rgba(110,65,15,.85)', false);
    for (const y of [1270, 1370]) { g.fillStyle = '#5a3a1e'; g.beginPath(); g.arc(662, y, 11, 0, 7); g.fill(); g.fillStyle = '#c58a3b'; g.beginPath(); g.arc(660, y - 2, 6, 0, 7); g.fill(); }
    g.fillStyle = '#f2f1ec'; path([[565, 1080], [620, 1100], [598, 1168]]); g.fill(); path([[680, 1080], [632, 1100], [656, 1170]]); g.fill();
    g.fillStyle = '#2c3d7c'; path([[614, 1104], [640, 1104], [652, 1230], [628, 1254], [608, 1230]]); g.fill();
  },
  suit() {
    g.fillStyle = '#f1f0ec'; path([[560, 1060], [680, 1060], [624, 1250]]); g.fill();
    g.fillStyle = '#3b2b3a'; path([[612, 1090], [636, 1090], [646, 1200], [624, 1228], [604, 1200]]); g.fill();
    g.fillStyle = 'rgba(40,45,70,.45)'; path([[560, 1060], [624, 1250], [590, 1180]]); g.fill(); path([[680, 1060], [624, 1250], [660, 1180]]); g.fill();
    brush([[624, 1250], [626, 1508]], () => 5, 'rgba(40,45,70,.6)', false);
    for (const y of [1300, 1380, 1450]) { g.fillStyle = '#e4bd45'; g.beginPath(); g.arc(648, y, 9, 0, 7); g.fill(); }
  },
  braces() {
    g.fillStyle = '#efe6d2'; path([[540, 1050], [700, 1050], [690, 1140], [550, 1140]]); g.fill();
    g.fillStyle = '#26365e'; path([[600, 1080], [640, 1080], [628, 1150], [612, 1150]]); g.fill();
    for (const x of [545, 700]) { g.fillStyle = '#2d2442'; path([[x - 14, 1060], [x + 14, 1060], [x + 10, 1508], [x - 18, 1508]]); g.fill(); g.fillStyle = '#d9b24a'; g.fillRect(x - 14, 1420, 24, 20); }
  },
  plaid() {
    g.strokeStyle = 'rgba(120,70,20,.55)'; g.lineWidth = 5;
    for (let x = 420; x < 820; x += 44) { g.beginPath(); g.moveTo(x, 1040); g.lineTo(x, 1510); g.stroke(); }
    for (let y = 1080; y < 1510; y += 44) { g.beginPath(); g.moveTo(400, y); g.lineTo(840, y); g.stroke(); }
    g.fillStyle = '#7b3fa0'; path([[600, 1080], [640, 1080], [628, 1160], [612, 1160]]); g.fill();
  },
  overalls() {
    g.fillStyle = '#3f6fc4'; path([[500, 1230], [740, 1230], [760, 1510], [480, 1510]]); g.fill();
    for (const x of [520, 715]) { path([[x - 14, 1060], [x + 14, 1060], [x + 12, 1240], [x - 12, 1240]]); g.fill(); }
    g.fillStyle = '#e4bd45'; for (const x of [520, 715]) { g.beginPath(); g.arc(x, 1235, 10, 0, 7); g.fill(); }
    g.fillStyle = '#5a86d8'; g.fillRect(575, 1300, 90, 70);
  },
  apron() {
    g.fillStyle = '#8a5530'; path([[500, 1120], [740, 1120], [770, 1510], [470, 1510]]); g.fill();
    g.fillStyle = 'rgba(255,220,170,.25)'; g.fillRect(500, 1120, 240, 10);
    g.fillStyle = '#5a3418'; g.fillRect(560, 1300, 120, 70);
  },
  robe() {
    g.fillStyle = 'rgba(255,255,255,.18)'; path([[600, 1040], [640, 1040], [660, 1508], [580, 1508]]); g.fill();
    g.fillStyle = '#e4bd45'; g.fillRect(420, 1380, 400, 24);
  },
  bowtie() {
    g.fillStyle = '#d63c30'; path([[560, 1080], [615, 1100], [560, 1130]]); g.fill(); path([[680, 1080], [625, 1100], [680, 1130]]); g.fill();
    g.fillStyle = '#fff'; for (const [x, y] of [[575, 1092], [580, 1115], [665, 1092], [660, 1115]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
    g.fillStyle = '#b8322c'; g.fillRect(608, 1092, 24, 24);
  },
  plain() { g.fillStyle = 'rgba(20,40,60,.18)'; path([[560, 1060], [680, 1060], [620, 1160]]); g.fill(); },
};

// ---------- body: broad-shouldered tunic (build B, user-approved lineup) ----------
// The torso runs from under the head (y ~1048) to the hem (HEM), narrower than the head, with shoulders at
// chest height; legs run from the hem to the soles at 1508 + LEG. The hip anchor (1508) and FEET (LEG below it) are
// unchanged, so placement, perspective and props work as before. Seated characters lift so the hem rests on the seat.
// measured from the reference shorts: a narrow upright body (about 0.78 of the head's width, a little over one head
// tall) with round shoulders, gently rounded sides and a rounded hem; thin ink legs below. (user: wide straight
// sides looked like boxes, a flared hem like triangles, a waist pinch like a zigzag)
const BODY_HALF = [[650, 1048], [742, 1058], [794, 1104], [810, 1190], [814, 1340], [810, 1480], [798, 1548], [764, 1570], [700, 1574]];
// the capsule body (user: "sick of this cubic body" - the reference's soft rounded bean: no shoulders, tucked up under the
// head, ~.66 of the head wide, rounded bottom). c.bodyShape = 'box' gives the old broad-shouldered tunic.
const BODY_CAPSULE = [[650, 1042], [700, 1048], [742, 1066], [768, 1100], [780, 1160], [784, 1260], [784, 1380], [780, 1470], [766, 1530], [736, 1562], [690, 1576], [640, 1578]];
const HEM = 1572, LEG_TOP = 1550, SEAT_LIFT = HEM - 1508;
// the long body: the capsule's top moves up from 1042 to LONG_TOP (its bottom BODY_BASE stays); kids and 'box' keep the old one
const LONG_TOP = 852, BODY_BASE = 1578, LONG_DH = 1042 - LONG_TOP;
// proportions C (user picked the cowboy's ratio from a lineup, 2026-11-04): the short capsule body and long legs - legs
// about 1.2 times the body's length. c.bodyShape = 'long' brings back the long body, c.legLen sets one person's legs.
const longBody = c => c.bodyShape === 'long' && c.build !== 'kid';
const LEG = 720;                                   // hip to soles, rig units (was 560); kids keep 560
const legOf = c => c.legLen || (c.build === 'kid' ? 560 : LEG);
function loopPts(pts, n = 12) {             // smooth closed curve through points (Catmull-Rom loop)
  const o = [], m = pts.length;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  return o;
}
// mirror the right half of a shape (top to bottom) about the body centre into a closed contour
const symPts = (half, ws = 1, cx = HIP[0]) => loopPts([...half, ...half.slice().reverse()].map(([x, y], i) => [cx + (i < half.length ? 1 : -1) * (x - cx) * ws, y]));
const TORSO_CACHE = new Map();
function torsoPts(c) { const ws = c.ws || 1, box = c.bodyShape === 'box', key = (box ? 'b' : 'c') + ws; if (!TORSO_CACHE.has(key)) TORSO_CACHE.set(key, symPts(box ? BODY_HALF : BODY_CAPSULE, ws)); return TORSO_CACHE.get(key); }
// turned (walking): the body narrows and sits back a little, as seen three-quarter on
const turnX = (x, tr) => HIP[0] + (x - HIP[0]) * (1 - .24 * Math.abs(tr)) - 22 * tr;
function boundsOf(pts) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1 }; }

// ---------- outfits (drawn clipped inside the torso; optional layers behind/over it) ----------
// Each: inside(c, B), behind?, over?, sleeve(c) -> { col, cuff?, rolled? }, legs, boots, base? ([light, mid, dark]).
// The team/garment colour is c.body[1]. LITE (crowds, small figures) skips the fine detail.
const fold = (pts, col, w = 6) => brush(spline(pts), taper(w, .3, .3, .2), col, false);
const OUTFITS = {
  royal: {   // king: gold placket, belt and buckle, gold hem, ermine collar, cape behind
    behind(c, B) {
      const col = shade(c.body[1], -.38);
      shadedShape(symPts([[700, 1076], [836, 1116], [876, 1400], [906, 1760], [858, 1930], [700, 1950]], c.ws || 1), shade(col, .15), col, shade(col, -.35), 5, 12);
    },
    inside(c, B) {
      const gold = '#e4bd45', goldD = '#a8812a', cx = HIP[0];
      g.fillStyle = gold; g.fillRect(cx - 30, 1080, 60, 700);
      g.fillStyle = goldD; g.fillRect(cx - 30, 1080, 6, 700); g.fillRect(cx + 24, 1080, 6, 700);
      if (!LITE) for (let y = 1250; y < 1650; y += 70) { g.fillStyle = '#d63c30'; g.beginPath(); g.arc(cx, y, 9, 0, 7); g.fill(); }
      g.fillStyle = gold; g.fillRect(B.x0 - 10, B.y1 - 48, B.x1 - B.x0 + 20, 48);
      g.fillStyle = goldD; g.fillRect(B.x0 - 10, B.y1 - 48, B.x1 - B.x0 + 20, 6);
      g.fillStyle = '#4a2e1e'; g.fillRect(B.x0 - 10, 1420, B.x1 - B.x0 + 20, 44);
      fillInk([[cx - 34, 1410], [cx + 34, 1410], [cx + 34, 1474], [cx - 34, 1474]], gold, 3, 6);
      g.fillStyle = '#4a2e1e'; g.fillRect(cx - 14, 1428, 28, 28);
      if (LITE) return;
      const dk = shade(c.body[1], -.3);
      fold([[cx - 120, 1490], [cx - 135, 1560], [cx - 128, 1620]], dk); fold([[cx + 110, 1490], [cx + 128, 1560], [cx + 120, 1620]], dk);
      fold([[cx - 160, 1250], [cx - 150, 1330], [cx - 160, 1400]], dk, 5);
    },
    over(c, B) {
      const pts = symPts([[650, 1076], [772, 1086], [828, 1132], [824, 1200], [770, 1232], [700, 1226], [650, 1232]], c.ws || 1);
      shadedShape(pts, '#ffffff', '#ece6da', '#b9b0a0', 4, 11);
      if (LITE) return;
      g.save(); path(pts); g.clip(); g.fillStyle = INK;
      for (const [x, y] of [[-200, 1150], [-120, 1195], [-40, 1160], [60, 1200], [140, 1160], [210, 1190], [-230, 1200], [10, 1222]]) {
        const px = HIP[0] + x * (c.ws || 1); path([[px, y - 14], [px + 7, y + 4], [px, y + 14], [px - 7, y + 4]]); g.fill();
      }
      g.restore();
    },
    sleeve: c => ({ col: c.body[1], cuff: '#e4bd45' }), legs: '#3a2a3a', boots: '#4a2e1e',
  },
  smith: {   // shirt with rolled sleeves under a leather apron: neck straps, ties, stitched pocket, soot
    base: ['#f6ecd6', '#e9dcc0', '#bfae8c'],
    inside(c, B) {
      const cx = HIP[0];
      shadedShape([[cx - 150, 1205], [cx + 150, 1205], [cx + 160, 1300], [cx + 200, B.y1 + 10], [cx - 200, B.y1 + 10], [cx - 160, 1300]], '#9c6238', '#7a4a2a', '#4e2c18', 4, 10);
      brush([[cx - 120, 1210], [cx - 105, 1080]], () => 20, '#5a3418'); brush([[cx + 120, 1210], [cx + 105, 1080]], () => 20, '#5a3418');
      g.fillStyle = '#5a3418'; g.fillRect(B.x0 - 10, 1340, B.x1 - B.x0 + 20, 16);
      fillInk([[cx - 80, 1430], [cx + 80, 1430], [cx + 74, 1530], [cx - 74, 1530]], '#6a3e22', 3, 6);
      if (LITE) return;
      g.strokeStyle = 'rgba(240,200,150,.55)'; g.lineWidth = 3; g.setLineDash([10, 8]);
      g.strokeRect(cx - 68, 1442, 136, 76); g.beginPath(); g.moveTo(cx - 186, 1600); g.lineTo(cx - 150, 1300); g.moveTo(cx + 186, 1600); g.lineTo(cx + 150, 1300); g.stroke();
      g.setLineDash([]);
      for (const [x, y, r] of [[-60, 1580, 40], [90, 1380, 28], [-110, 1300, 22]]) shadowBlob(cx + x, y, r, r * .7, 'rgba(30,20,20,.3)', 10);
      fold([[B.x0 + 30, 1250], [B.x0 + 38, 1330], [B.x0 + 30, 1420]], 'rgba(150,120,80,.6)', 5);
      fold([[B.x1 - 30, 1250], [B.x1 - 38, 1330], [B.x1 - 30, 1420]], 'rgba(150,120,80,.6)', 5);
    },
    sleeve: () => ({ col: '#e9dcc0', rolled: true }), legs: '#3a3030', boots: '#2e2420',
  },
  soldier: {   // chainmail under a tabard in the army's colour with an emblem
    base: ['#c3c8d0', '#9aa0aa', '#6d7380'],
    inside(c, B) {
      const cx = HIP[0], col = c.body[1];
      if (!LITE) {
        g.strokeStyle = 'rgba(60,64,74,.55)'; g.lineWidth = 3;
        for (let y = 1060; y < 1700; y += 22) for (let x = B.x0 - 20 + ((y / 22) % 2) * 13; x < B.x1 + 20; x += 26) { g.beginPath(); g.arc(x, y, 12, 0.15, Math.PI - 0.15); g.stroke(); }
      }
      shadedShape([[cx - 150, 1130], [cx + 150, 1130], [cx + 160, B.y1 + 10], [cx - 160, B.y1 + 10]], shade(col, .25), col, shade(col, -.3), 4, 10);
      g.fillStyle = '#4a2e1e'; g.fillRect(B.x0 - 10, 1450, B.x1 - B.x0 + 20, 36);
      fillInk(ellPts(cx, 1310, 62, 62, 40), '#f2e6c0', 3, 7);
      brush([[cx, 1262], [cx, 1358]], () => 18, col); brush([[cx - 46, 1310], [cx + 46, 1310]], () => 18, col);
    },
    sleeve: () => ({ col: '#9aa0aa', cuff: '#7d838e' }), legs: '#3a3a44', boots: '#3a2a22',
  },
  messenger: {   // tunic with a satchel strap and a bag at the hip
    inside(c, B) {
      g.fillStyle = shade(c.body[1], .45); path([[HIP[0] - 70, 1080], [HIP[0] + 70, 1080], [HIP[0], 1220]]); g.fill();
      brush([[B.x1 - 40, 1120], [B.x0 + 30, 1560]], () => 34, '#6a4024');
      g.fillStyle = '#4a2e1e'; g.fillRect(B.x0 - 10, 1460, B.x1 - B.x0 + 20, 30);
      if (LITE) return;
      g.strokeStyle = 'rgba(240,200,150,.5)'; g.lineWidth = 3; g.setLineDash([8, 7]); g.beginPath(); g.moveTo(B.x1 - 40, 1120); g.lineTo(B.x0 + 30, 1560); g.stroke(); g.setLineDash([]);
      fold([[HIP[0] + 60, 1500], [HIP[0] + 70, 1580], [HIP[0] + 62, 1640]], shade(c.body[1], -.3));
    },
    over(c, B) {
      const x = B.x0 + 10, y = 1520;
      fillInk([[x - 70, y], [x + 70, y], [x + 76, y + 120], [x - 76, y + 120]], '#8a5530', 4, 9);
      fillInk([[x - 72, y - 4], [x + 72, y - 4], [x + 60, y + 56], [x - 60, y + 56]], '#6a4024', 3, 7);
      g.fillStyle = '#e4bd45'; g.beginPath(); g.arc(x, y + 50, 9, 0, 7); g.fill();
    },
    sleeve: c => ({ col: c.body[1], cuff: shade(c.body[1], .45) }), legs: '#3a3030', boots: '#5a3a24',
  },
  tunic: {   // plain everyday tunic: lighter collar, belt, darker hem band, a few folds
    inside(c, B) {
      const cx = HIP[0], col = c.body[1];
      g.fillStyle = shade(col, .4); path([[cx - 60, 1080], [cx + 60, 1080], [cx, 1190]]); g.fill();
      g.fillStyle = '#4a2e1e'; g.fillRect(B.x0 - 10, 1440, B.x1 - B.x0 + 20, 32);
      g.fillStyle = shade(col, -.25); g.fillRect(B.x0 - 10, B.y1 - 34, B.x1 - B.x0 + 20, 34);
      if (LITE) return;
      const dk = shade(col, -.3);
      fold([[cx - 110, 1490], [cx - 122, 1560], [cx - 116, 1610]], dk); fold([[cx + 100, 1490], [cx + 116, 1560], [cx + 110, 1610]], dk);
    },
    sleeve: c => ({ col: c.body[1], cuff: shade(c.body[1], -.2) }), legs: '#3a3030', boots: '#4a3424',
  },
};
// costume names -> outfits ('robe' and 'apron' are the old names of royal and smith); any other COSTUMES entry or a
// function is the old flat costume, fitted into the new torso over a plain tunic
const OUTFIT_OF = { robe: 'royal', royal: 'royal', apron: 'smith', smith: 'smith', soldier: 'soldier', armor: 'soldier', messenger: 'messenger', plain: 'tunic', tunic: 'tunic' };
function outfitOf(c) {
  if (c._outfit) return c._outfit;
  const name = typeof c.costume === 'string' ? c.costume : null;
  const legacy = typeof c.costume === 'function' ? c.costume : (name && !OUTFIT_OF[name] ? COSTUMES[name] : null) || (c.costumeFn && !name ? c.costumeFn : null);
  return (c._outfit = legacy ? Object.assign({}, OUTFITS.tunic, { legacy }) : OUTFITS[OUTFIT_OF[name] || 'tunic']);
}
// an old costume drew inside the old torso box (x 424-796, y 1040-1508): stretch that box onto the new torso
function drawLegacyCostume(fn, B) {
  g.save(); g.translate(B.x0 + 20, 1058); g.scale((B.x1 - B.x0 - 40) / 372, (HEM - 1058) / 468); g.translate(-424, -1040); fn(); g.restore();
}

// ---------- cast registry ----------
// def: { color, ws (body width), shape, hat, hatColor, glasses, stache, beard (colour), beardStyle, blush, faceShift,
//        costume: 'royal'|'smith'|'soldier'|'messenger'|'tunic' (or an old COSTUMES name / function), skin }
const CAST = {};
function defineCharacter(key, def) {
  const c = Object.assign({ ws: 1, shape: 'round', hat: 'none', faceShift: 0, costume: 'tunic' }, def, { key });
  const col = c.color || '#8fb0d8';
  c.body = c.body || [shade(col, .2), col, shade(col, -.32)];
  return (CAST[key] = c);
}
let HAND_BALLS = false;     // (user: no hand balls) the stick arm just ends; true brings back the ink-ball hands
let ARM_STYLE = 'stick';     // 'stick' (thin ink arms, ball hands - default) | 'sleeve' (cloth sleeves, pale hands)
// shoulders sit at chest height on the tunic's shoulder line; the arm starts there
const SHL = [440, 1180], SHR = [800, 1180];
const SHL_C = [482, 1150], SHR_C = [758, 1150];         // the capsule's arm roots: high on its sides
const shoulder = (c, side) => { const box = c.bodyShape === 'box', s = side < 0 ? (box ? SHL : SHL_C) : (box ? SHR : SHR_C); return [HIP[0] + (s[0] - HIP[0]) * (c.ws || 1), s[1]]; };
// elbow when a pose gives only the hand: the arms are stretchy (rubber hose), so no fixed bones - the arm makes one
// soft curve bowing slightly outward; a visible elbow only comes from an explicit `e` in an action pose (user: "they
// don't have sharp elbows until they're doing something")
function autoElbow(s, h, side) {
  const dx = h[0] - s[0], dy = h[1] - s[1], d = Math.hypot(dx, dy) || 1;
  let px = -dy / d, py = dx / d;
  if (px * side + py * 0.6 < 0) { px = -px; py = -py; }
  const bow = Math.min(28, d * 0.06);
  return [s[0] + dx / 2 + px * bow, s[1] + dy / 2 + py * bow];
}

// ---------- beards: grow from the jaw with a tufted edge and hair texture; moustache separate, mouth visible ----------
// beardStyle: big 'full' | 'pointed' | 'short' | 'forked', small 'stubble' | 'goatee' | 'trimmed'   (head space; mx,my = mouth centre)
const BEARDS = {
  full:    { out: mx => [[HX - .82 * R, HY + .02 * R], [HX - .88 * R, HY + .45 * R], [HX - .64 * R, HY + .95 * R], [mx - .32 * R, HY + 1.25 * R], [mx, HY + 1.4 * R], [mx + .32 * R, HY + 1.25 * R], [HX + .64 * R, HY + .95 * R], [HX + .88 * R, HY + .45 * R], [HX + .82 * R, HY + .02 * R]], tuft: .07 },
  pointed: { out: mx => [[HX - .72 * R, HY + .18 * R], [HX - .74 * R, HY + .6 * R], [mx - .32 * R, HY + 1.05 * R], [mx - .1 * R, HY + 1.42 * R], [mx, HY + 1.62 * R], [mx + .1 * R, HY + 1.42 * R], [mx + .32 * R, HY + 1.05 * R], [HX + .74 * R, HY + .6 * R], [HX + .72 * R, HY + .18 * R]], tuft: .05 },
  short:   { out: mx => [[HX - .86 * R, HY + .02 * R], [HX - .86 * R, HY + .55 * R], [HX - .55 * R, HY + .96 * R], [mx, HY + 1.12 * R], [HX + .55 * R, HY + .96 * R], [HX + .86 * R, HY + .55 * R], [HX + .86 * R, HY + .02 * R]], tuft: .04 },
  forked:  { out: mx => [[HX - .8 * R, HY + .05 * R], [HX - .84 * R, HY + .5 * R], [HX - .58 * R, HY + .98 * R], [mx - .3 * R, HY + 1.3 * R], [mx - .18 * R, HY + 1.55 * R], [mx - .04 * R, HY + 1.26 * R], [mx, HY + 1.2 * R], [mx + .04 * R, HY + 1.26 * R], [mx + .18 * R, HY + 1.55 * R], [mx + .3 * R, HY + 1.3 * R], [HX + .58 * R, HY + .98 * R], [HX + .84 * R, HY + .5 * R], [HX + .8 * R, HY + .05 * R]], tuft: .05 },
};
function tufted(pts, amt, cx, cy) {
  return pts.map(([x, y], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if (nx * (x - cx) + ny * (y - cy) < 0) { nx = -nx; ny = -ny; }
    const k = Math.pow(Math.abs(Math.sin(i * Math.PI / 5)), 0.6) * amt * R;
    return [x + nx * k, y + ny * k];
  });
}
function hairStrands(clipPts, col, x0, x1, y0, y1, n, seed0) {   // short wavy locks of varied length: texture, not stripes
  g.save(); path(clipPts); g.clip(); g.globalAlpha = .55;
  for (let i = 0; i < n * 2; i++) {
    const u = hash(seed0 + i * 3), x = L2(x0, x1, u), ya = L2(y0, y1, hash(seed0 + i * 5) * .7), len = (y1 - y0) * (.18 + hash(seed0 + i * 7) * .3);
    const bend = (u - .5) * 50 + (hash(seed0 + i * 11) - .5) * 20, light = hash(seed0 + i * 13) < .5;
    brush(spline([[x, ya], [x + bend * .3 + 6, ya + len * .5], [x + bend, ya + len]]), taper(light ? 6 : 5, .35, .5, .15), light ? shade(col, .28) : shade(col, -.3), false);
  }
  g.restore();
}
// the small beards stay on the face (clipped to the head) so they never look big
function smallBeardDraw(c, mx, my, P) {
  const col = c.beard, sty = c.beardStyle, cx = mx + .04 * R, lift = -((P && P.open) || 0) * .06 * R;
  const under = [[HX + .62 * R, HY + .06 * R], [cx + .3 * R, my + .1 * R], [cx, my + .2 * R], [cx - .3 * R, my + .1 * R], [HX - .62 * R, HY + .06 * R]];   // the clear patch round the mouth
  g.save(); path(headContour(c)); g.clip();
  if (sty === 'stubble') {
    const pts = spline([[HX - .9 * R, HY + .02 * R], [HX - .86 * R, HY + .5 * R], [HX - .56 * R, HY + .88 * R], [cx, HY + 1.02 * R], [HX + .56 * R, HY + .88 * R], [HX + .86 * R, HY + .5 * R], [HX + .9 * R, HY + .02 * R]], 10).concat(spline(under, 10));
    g.globalAlpha = .26; g.fillStyle = col; path(pts); g.fill();
    if (!LITE) { g.globalAlpha = .55; g.save(); path(pts); g.clip(); g.fillStyle = shade(col, -.3);
      for (let i = 0; i < 260; i++) { g.beginPath(); g.arc(L2(HX - R, HX + R, hash(i * 3 + 1)), L2(HY, HY + R * 1.05, hash(i * 7 + 2)), 3, 0, 7); g.fill(); }
      g.restore(); }
    g.globalAlpha = .3; g.fillStyle = col; g.beginPath(); g.ellipse(cx, my - .15 * R + lift, .3 * R, .05 * R, 0, 0, 7); g.fill();   // a shadow of a moustache
    g.globalAlpha = 1; g.restore(); return;
  }
  const out = sty === 'goatee'
    ? spline([[cx - .24 * R, my + .1 * R], [cx - .28 * R, my + .36 * R], [cx - .13 * R, my + .62 * R], [cx, my + .68 * R], [cx + .13 * R, my + .62 * R], [cx + .28 * R, my + .36 * R], [cx + .24 * R, my + .1 * R]], 10)
    : spline([[HX - .92 * R, HY + .3 * R], [HX - .84 * R, HY + .62 * R], [HX - .52 * R, HY + .92 * R], [cx, HY + 1.04 * R], [HX + .52 * R, HY + .92 * R], [HX + .84 * R, HY + .62 * R], [HX + .92 * R, HY + .3 * R]], 10);
  const inner = sty === 'goatee' ? spline([[cx + .24 * R, my + .1 * R], [cx, my + .2 * R], [cx - .24 * R, my + .1 * R]], 6)
    : spline([[HX + .78 * R, HY + .34 * R], [cx + .36 * R, my + .3 * R], [cx, my + .4 * R], [cx - .36 * R, my + .3 * R], [HX - .78 * R, HY + .34 * R]], 10);
  const pts = tufted(out, .025, cx, my + .3 * R).concat(inner), bb = boundsOf(pts), gr = g.createLinearGradient(0, bb.y0, 0, bb.y1);
  gr.addColorStop(0, shade(col, .12)); gr.addColorStop(1, shade(col, -.25));
  g.fillStyle = gr; path(pts); g.fill();
  if (!LITE) hairStrands(pts, col, bb.x0 + 10, bb.x1 - 10, bb.y0, bb.y1, 8, 3);
  inkRing(pts, D * .005, D * .011);
  g.restore();
  // a neat moustache just above the lip
  const half = [[cx, my - .17 * R + lift], [cx + .14 * R, my - .2 * R + lift], [cx + .3 * R, my - .15 * R + lift], [cx + .34 * R, my - .07 * R + lift], [cx + .24 * R, my - .1 * R + lift], [cx + .1 * R, my - .12 * R + lift], [cx, my - .11 * R + lift]];
  const st = loopPts(half.concat(half.slice(1, -1).reverse().map(([x, y]) => [2 * cx - x, y])), 8);
  shadedShape(st, shade(col, .2), col, shade(col, -.3), D * .004, D * .01);
}
function beardDraw(c, mx, my, P) {
  if (c.beardStyle === 'stubble' || c.beardStyle === 'goatee' || c.beardStyle === 'trimmed') return smallBeardDraw(c, mx, my, P);
  const B = BEARDS[c.beardStyle] || BEARDS.full, col = c.beard;
  const out = tufted(spline(B.out(mx), 10), B.tuft, mx, HY + .5 * R);
  const inner = spline([[HX + .6 * R, HY + .1 * R], [mx + .3 * R, my + .18 * R], [mx, my + .24 * R], [mx - .3 * R, my + .18 * R], [HX - .6 * R, HY + .1 * R]], 10);
  const pts = out.concat(inner), bb = boundsOf(pts), gr = g.createLinearGradient(0, bb.y0, 0, bb.y1);
  gr.addColorStop(0, shade(col, .12)); gr.addColorStop(.6, col); gr.addColorStop(1, shade(col, -.32));
  g.fillStyle = gr; path(pts); g.fill();
  if (!LITE) hairStrands(pts, col, bb.x0 + 20, bb.x1 - 20, bb.y0, bb.y1, 18, 3);
  inkRing(pts, D * .006, D * .016);
  // the moustache rests just above the lip, tips no lower than the smile's corners, and lifts as the mouth opens
  const sx = mx + .04 * R, ly = -((P && P.open) || 0) * .06 * R;
  const half = [[sx, my - .18 * R + ly], [sx + .14 * R, my - .22 * R + ly], [sx + .34 * R, my - .16 * R + ly], [sx + .42 * R, my - .06 * R + ly], [sx + .3 * R, my - .1 * R + ly], [sx + .12 * R, my - .12 * R + ly], [sx, my - .11 * R + ly]];
  const st = loopPts(half.concat(half.slice(1, -1).reverse().map(([x, y]) => [2 * sx - x, y])), 8);
  shadedShape(st, shade(col, .2), col, shade(col, -.3), D * .005, D * .012);
  if (!LITE) hairStrands(st, col, mx - .4 * R, mx + .4 * R, my - .2 * R, my + .05 * R, 10, 9);
}

// ---------- the character ----------
// P (pose): face fields (see faceDraw) + legs 'sit'|'stand'|'walk'|'run'|'crouch'|'tuck'|'none', legLen, kneeBend, swing,
//   walkPhase, face (+1 right/-1 left), seat (0..1: hem resting on a seat - sitDown/standUp set it), hx, hy, hr, lean,
//   bounce, br, hatLift, arms: [left, right], each { h: hand, e?: elbow, hh?: hand on head, hb?: blend, point?: angle,
//   prop?(hand), noHand? }
// feet: a small dark shoe at the end of the ink leg, like the reference (O.boots / c.shoes only tint it slightly)
function bootDraw(x, y, dir, col) {
  const pts = loopPts([[x - 16, y - 40], [x + 16, y - 40], [x + dir * 52, y - 18], [x + dir * 60, y + 2], [x - dir * 24, y + 4], [x - dir * 26, y - 16]], 6);
  fillInk(pts, col ? shade(col, -.55) : '#2a1d24', 3, 6);
}
function tube(line, w, col) { brush(line, () => w + 16, INK); brush(line, () => w, col); }
function handDraw(c, h, dir) {
  fillInk(ellPts(h[0], h[1], 38, 34, 32, -0.3 * dir), c.skin || FACE, 4, 9);
  if (!LITE) fillInk(ellPts(h[0] + dir * 30, h[1] - 18, 13, 18, 20, 0.5 * dir), c.skin || FACE, 3, 6);
}
// soft 3D on the torso (drawn inside its clip): rolls off into shadow away from the light, a deep soft shadow under
// the head, a soft highlight down the lit side and a warm rim along the shadow edge
function softTorso(B, hx, hy) {
  const ls = lightSide(), cx = (B.x0 + B.x1) / 2, w = (B.x1 - B.x0) / 2, far = ls < 0 ? B.x1 : B.x0;
  g.save(); g.globalAlpha = SOFT3D; g.globalCompositeOperation = 'multiply';
  const gr = g.createLinearGradient(cx + ls * w, 0, cx - ls * w, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.45, 'rgba(200,170,210,.18)'); gr.addColorStop(1, 'rgba(90,50,120,.8)');
  g.fillStyle = gr; g.fillRect(B.x0 - 30, 1000, w * 2 + 60, 760);
  g.filter = 'blur(22px)'; g.fillStyle = 'rgba(80,55,70,.42)'; g.beginPath(); g.ellipse(hx - ls * 10, hy + 20, R, R * .38, 0, 0, 7); g.fill();
  g.globalCompositeOperation = 'source-over';
  g.filter = 'blur(18px)'; g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(cx + ls * w * .45, 1300, w * .16, 230, 0, 0, 7); g.fill();
  g.filter = 'none'; softRim(far, ls, B.x0 - 30, 1000, w * 2 + 60, 760, 70);
  g.restore();
}
function charDraw(c, P) {
  const headXf = (x, y) => {
    const cs = Math.cos(P.hr || 0), sn = Math.sin(P.hr || 0), dx = x - NECK[0], dy = y - NECK[1];
    return [NECK[0] + dx * cs - dy * sn + (P.hx || 0), NECK[1] + dx * sn + dy * cs + (P.hy || 0) - DH];
  };
  const O = outfitOf(c), ws = c.ws || 1, LL = P.legLen || legOf(c), sole = 1508 + LL;
  // kids: shorter legs and a smaller body under a relatively bigger head (feet stay on the same floor line)
  const KID = c.build === 'kid', legK = KID ? .56 : 1, upK = KID ? .76 : 1, LT = sole - (sole - LEG_TOP) * legK;
  const seat = P.legs === 'sit' ? 1 : (P.seat || 0), lift = SEAT_LIFT * seat;
  // the long body (user: "make it longer", like the reference officer's ~1.5 heads): the torso grows upwards from its
  // bottom and the head rides up on top (hips, legs and feet stay put); outfits are drawn stretched with it
  const DH = longBody(c) ? BODY_BASE - LONG_TOP - (BODY_BASE - 1042) : 0, SYL = DH ? (BODY_BASE - LONG_TOP) / (BODY_BASE - 1042) : 1;
  const stY = y => BODY_BASE - (BODY_BASE - y) * SYL, stretch = () => { if (DH) { g.translate(0, BODY_BASE); g.scale(1, SYL); g.translate(0, -BODY_BASE); } };
  // legs are thin ink strokes like the arms (the reference look; user: "why are their legs real"); c.legColor overrides
  const legW = () => 24, legCol = c.legColor || INK;
  let strideDrop = 0;                      // the hip's dip while striding (the body comes down with it)
  // LIMB RULES (user): each leg stays on its own hip, a joint that moves with the torso - a quarter and three quarters
  // across seen from the front, close together under the body seen side-on, blended in between (it never slides with
  // the step). nearSd = the leg on the camera's side (+1 right on screen); far legs are drawn first, then near legs,
  // then the body over both tops.
  const legTR = P.turn || 0, sideL = Math.min(1, Math.max(0, (Math.abs(legTR) - .1) / .45)), nearSd = Math.sign(legTR) || (P.face || 1);
  const hipX = sd => HIP[0] + sd * 72 * ws * (1 - .8 * sideL) - 22 * legTR;
  // outfit parts drawn over or behind the body turn with it too (the wrap below covers what is painted on the body):
  // the front centre slides toward the way they face and narrows, as the garment's opening does; kS/kW blend it
  const turnAff = (kS, kW) => {
    const t = P.turn || 0; if (Math.abs(t) < .04 || LITE) return;
    const B0 = boundsOf(torsoPts(c)), cF = (B0.x0 + B0.x1) / 2, rF = (B0.x1 - B0.x0) / 2, rT = rF * (1 - .24 * Math.abs(t));
    const phi = Math.max(-1, Math.min(1, t)) * Math.PI / 2 * .7, sx = L2(1, (rT / rF) * Math.max(.55, Math.cos(phi)), kW);
    g.translate(turnX(cF, t) + rT * Math.sin(phi) * kS, 0); g.scale(sx, 1); g.translate(-cF, 0);
  };
  if (O.behind && !LITE) { g.save(); stretch(); turnAff(-.35, .5); O.behind(c, boundsOf(torsoPts(c))); g.restore(); }   // a cape swings round behind
  if (P.legs === 'sit') {
    const sw = P.swing || 0;
    for (const s of [-1, 1]) {
      const x0 = HIP[0] + s * 70 * ws, fx = HIP[0] + s * 96 * ws + (s > 0 ? 34 * sw : 0);
      brush(spline([[x0, 1490], [x0 + s * 8, 1700], [fx, 1930]]), legW, legCol);
      bootDraw(fx, 1990, s, O.boots);
    }
  } else if (P.legs === 'stand') {
    const kb = P.kneeBend || 0;
    for (const s of [-1, 1]) {
      const hx = hipX(s), fx = hx + s * 20 * ws * (1 - sideL);
      brush(spline([[hx, LT], [L2(hx, fx, .5) + s * 6 + kb * s * 20, L2(LT, sole, .5) - Math.abs(P.bounce || 0) * .3], [fx, sole - 30]]), legW, legCol);
      bootDraw(fx, sole, s, O.boots);
    }
  } else if (P.legs === 'walk' || P.legs === 'run') {
    // stride cycle: the foot swings forward lifted (cos>0) and plants (cos<0); running adds a back-kick and higher knees
    const dir = P.face || 1, run = P.legs === 'run', stride = (run ? 165 : 120) * (P.stride || 1), Lg = sole - LT;
    for (const [sd, s] of [[-nearSd, 1], [nearSd, -1]]) {   // far leg first (s > 0 = far, drawn darker); near = phase + PI
      const ph = (P.walkPhase || 0) + (s > 0 ? 0 : Math.PI), sw = Math.max(0, Math.cos(ph));
      const hx = hipX(sd), fx = hx + dir * stride * Math.sin(ph) * Math.max(.25, sideL) - (run ? dir * 60 * sw * Math.max(0, -Math.sin(ph)) : 0);
      const up = (run ? 110 : 55) * sw + (run ? 80 * sw * Math.max(0, -Math.sin(ph)) : 0), fy = sole - up;
      const kx = L2(hx, fx, .5) + dir * ((run ? 40 : 22) + (run ? 95 * Lg / 522 : 45) * sw), ky = LT + Lg * .5 - up * (run ? .55 : .3);
      brush(spline([[hx, LT], [kx, ky], [fx, fy - 30]]), legW, s > 0 ? shade(legCol, -.2) : legCol);
      bootDraw(fx, fy, dir, s > 0 ? shade(O.boots, -.15) : O.boots);
    }
  } else if (P.legs === 'stride' && WALK_LEGS === 'knee') {
    // the walk legs copied from the reference cast (user: "copy his legs ... ours look too stupid while his are so
    // natural"; studied frame by frame on the cowboy walk): each leg is a thigh and a shin with a real knee, the legs
    // hang close together under the body, the planted foot stays exactly on its spot, then peels off heel first, the
    // shin kicks up behind (the foot near knee height), the knee leads the swing through, and the leg reaches out
    // straight to land on the heel. The body dips onto the landing leg. walkPhase advances PI per step and a step is
    // 2 * LEG * sin(strideA) long - WALK.route keeps it in step with the distance, so feet don't slide.
    const dir = P.face || 1, Lg = sole - LT, A = P.strideA ?? STRIDE_A, ph0 = P.walkPhase || 0, S = LEG * Math.sin(A);
    const pw = Math.abs(P.turn || 0) > .3, Lb = Lg * .505;          // thigh = shin; together a touch longer than the leg (the knee never locks)
    const legAt = ph => {                                           // this leg's foot (rig units, relative to the hip) and tilt
      const q = ((ph + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      if (q >= Math.PI) {                                           // planted: from the front (+S) to behind (-S) at body speed
        const u = (q - Math.PI) / Math.PI;
        const tilt = u < .12 ? -.35 * (1 - u / .12) : u > .72 ? .75 * ((u - .72) / .28) ** 1.5 : 0;   // heel strike, flat, heel up
        return { x: S * (1 - 2 * u), lift: 0, tilt, u, stance: true };
      }
      const s = q / Math.PI;                                        // swinging: from behind to the front
      const e = s < .5 ? 2 * s * s * s * 2 : 1 - Math.pow(-2 * s + 2, 3) / 2;   // the foot hangs back, then whips forward
      const lift = Lg * .4 * Math.pow(Math.sin(Math.PI * Math.pow(s, .8)), 1.3);  // the back kick, peaking early in the swing
      return { x: -S + 2 * S * Math.min(1, Math.max(0, s < .5 ? 4 * s * s * s : e)), lift, tilt: s < .55 ? .9 * (1 - s / .55) + .2 : -.3 * (s - .55) / .45, s, stance: false };
    };
    const L = [legAt(ph0), legAt(ph0 + Math.PI)];
    // the hip sits low enough for the planted leg to reach its foot with the knee just soft; it dips onto a landing leg
    const st = L[0].stance ? L[0] : L[1], reach = Lg * .99;
    const wb = (P.walkBob ?? WALK_BOB) * Math.exp(-Math.pow((st.u - .15) / .14, 2));
    const drop = Lg - Math.sqrt(Math.max(0, reach * reach - st.x * st.x)) + wb, hy = LT + drop;
    strideDrop = drop;
    const knee = (hx, hy2, fx, fy) => {                             // two-bone leg, the knee bending forward (the way they face)
      const d = Math.min(Math.hypot(fx - hx, fy - hy2), 2 * Lb - .5), ux = (fx - hx) / (d || 1), uy = (fy - hy2) / (d || 1);
      const off = Math.sqrt(Math.max(0, Lb * Lb - d * d / 4));
      let px = -uy, py = ux; if (Math.sign(px || dir) !== dir) { px = -px; py = -py; }
      return [(hx + fx) / 2 + px * off, (hy2 + fy) / 2 + py * off];
    };
    // drawn as one soft curve through the knee (user: the sharp knee corner looked "so stupid"; the reference legs
    // curve), and from two separate hip points that never meet (user: "his legs aren't near and attached like A"): each
    // leg keeps its own side under the body, and the leg in front moves its hip point forward as the stride opens
    [[L[1], -nearSd], [L[0], nearSd]].forEach(([f, sd]) => {         // far leg first, then the near leg
      // user: "I told u no legs that look like A" - the legs come straight down from two fixed points at the bottom of
      // the body, about a quarter and three quarters across (also seen side-on); only the feet travel forward and back
      // seen from the front (walking at or away from the camera, user: "how will he look from front") the steps go
      // toward and away from us: the feet stay under their hips, a step shows as the foot lifting with the knee coming
      // forward (the shin foreshortened) - blended into the side view as the walker turns (sideK = how side-on)
      const sideK = sideL, s = sd === nearSd ? 1 : -1;               // s < 0 = the far leg (drawn darker)
      const hx = hipX(sd), ay = sole - 30 - f.lift * L2(.75, 1, sideK);
      const fxAbs = hx + dir * f.x * sideK + sd * 14 * ws * (1 - sideK);   // the planted foot stays on its spot
      const [kx0, ky0] = knee(hx, hy, fxAbs, ay), mx = (hx + fxAbs) / 2, my = (hy + ay) / 2;
      const kx = L2(mx + sd * 34 * (f.lift / (Lg * .4) + .15), kx0, sideK), ky = L2(my, ky0, sideK);   // front: the knee bows a little outward
      const soft = [L2(mx, kx, .8), L2(my, ky, .8)];                // the curve passes near the knee, not through a corner
      const col = s < 0 ? shade(legCol, -.2) : legCol;
      brush(spline([[hx, hy], soft, [fxAbs, ay]], 16), pw ? () => 18 : legW, col);
      // the shoe: heel strike (toe up), flat while planted, heel lifting off at the back, toe trailing in the swing
      const bdir = sideK > .5 ? dir : sd;                            // from the front the shoes point outward, as standing
      g.save(); g.translate(fxAbs, ay + 30); g.rotate(bdir * f.tilt * sideK); g.translate(-fxAbs, -ay - 30); bootDraw(fxAbs, ay + 30, bdir, s < 0 ? shade(O.boots, -.15) : O.boots); g.restore();
    });
  } else if (P.legs === 'stride') {
    // the reference walk (user: "see how they walk ? ours walk weird"): the legs swing like scissors, nearly straight,
    // the knee bending only while a leg swings through, the front foot landing heel first; the hip dips as the legs
    // spread so the planted foot stays on the floor. walkPhase advances PI per step and a step is 2 * leg * sin(strideA)
    // long (WALK.route keeps it in step with the distance, so feet don't slide). Each leg hangs from the hip on the side
    // its foot is stepping to, so there is a gap at the top and the legs never cross (user: "A shape, no gap")
    const dir = P.face || 1, Lg = sole - LT, A = P.strideA ?? STRIDE_A, ph0 = P.walkPhase || 0;
    // the step bob (measured on the reference walks: the body dips ~3% of its height on every step, ours dipped 1%):
    // the body sinks onto the front leg as it lands and rises as the legs pass; the standing knee bends to take it
    const wb = (P.walkBob ?? WALK_BOB) * Math.sin(ph0) ** 2;
    const stA = A * Math.abs(Math.sin(ph0)), drop = Lg * (1 - Math.cos(stA)) + wb, hy = LT + drop;
    const pw = Math.abs(P.turn || 0) > .3;      // walking side-on (the police walk): soft legs from under the body
    strideDrop = drop;
    for (const s of [1, -1]) {             // far leg first
      const ph = ph0 + (s > 0 ? 0 : Math.PI), fw = Math.sin(ph), swing = Math.max(0, Math.cos(ph));
      const a = A * fw, hx = HIP[0] + dir * (pw ? 22 : 55) * ws * Math.max(-1, Math.min(1, fw / .35));
      const lift = 70 * swing * swing, fx = hx + dir * Math.sin(a) * Lg, fy = Math.min(sole, hy + Math.cos(a) * Lg) - lift;
      const slack = Math.max(0, Lg - Math.hypot(fx - hx, fy - hy)) / Lg;   // a leg shorter than its length bends at the knee
      const bend = (pw ? .06 : 0) + .3 * swing + Math.min(.25, 1.6 * slack), kx = (hx + fx) / 2 + dir * bend * Lg * (pw ? .6 : .5), ky = (hy + fy) / 2 - bend * 40;
      brush(spline([[hx, hy], [kx, ky], [fx, fy - 30]]), pw ? () => 18 : legW, s > 0 ? shade(legCol, -.2) : legCol);
      // the foot: heel first when it lands in front, peeling up at the toe as it leaves behind
      const tilt = fw > .55 && swing < .5 ? -.25 : fw < -.6 ? .45 * (-fw - .6) / .4 : 0;
      g.save(); g.translate(fx, fy); g.rotate(dir * tilt); g.translate(-fx, -fy); bootDraw(fx, fy, dir, s > 0 ? shade(O.boots, -.15) : O.boots); g.restore();
    }
  } else if (P.legs === 'crouch' || P.legs === 'tuck') {
    // two-bone legs from the hem with the feet planted on a floor line (floorY, rig units; default standing): bending
    // as the body drops = crouching, sitting on a chair (seat), landing; 'tuck' pulls the feet up under the body
    const dir = P.face || 1, tuck = P.legs === 'tuck', hy = LT - lift, Lb = (sole - LT) / 2 + 6;
    for (const s of [1, -1]) {
      const hx = HIP[0] + s * 72 * ws;
      const fx = HIP[0] + s * 86 * ws + dir * ((P.footFwd || 0) + (tuck ? 60 : 0));
      const fy = tuck ? hy + Lb : Math.min(P.floorY ?? sole, hy + 2 * Lb - 2);
      const d = Math.min(Math.hypot(fx - hx, fy - hy), 2 * Lb - 1), ux = (fx - hx) / (d || 1), uy = (fy - hy) / (d || 1);
      let px = uy, py = -ux; if (Math.sign(px || dir) !== dir) { px = -px; py = -py; }
      const off = Math.sqrt(Math.max(0, Lb * Lb - d * d / 4));
      const kx = (hx + fx) / 2 + px * off, ky = (hy + fy) / 2 + py * off;
      brush(spline([[hx, hy], [kx, ky], [fx, fy - 30]], 6), legW, s > 0 ? shade(legCol, -.2) : legCol);
      bootDraw(fx, fy, dir, s > 0 ? shade(O.boots, -.15) : O.boots);
    }
  }
  g.save();
  g.translate(HIP[0], HIP[1] - (P.bounce || 0) + strideDrop); g.rotate(P.lean || 0); g.scale(1, 1 + (P.br || 0)); g.translate(-HIP[0], -HIP[1]);
  if (lift) g.translate(0, -lift);
  if (KID) { g.translate(HIP[0], LT + 30); g.scale(upK, upK); g.translate(-HIP[0], -HEM); }
  // jelly body (user: "add some jelly effect to their bodies"): the same spring as the head, smaller - the body above the
  // legs leans back as it sets off, sways past a stop and squashes on a landing, then settles; the head rides on it.
  // Its spring is fed by travel and jumps only (bodyJelly), never the walk's own step bounce - that kept it rocking
  if (P.bodyJelly && BODY_JELLY && !LITE) { const { sh, st } = P.bodyJelly, J = BODY_JELLY; g.translate(HIP[0], HEM); g.transform(1 - st * .8 * J, 0, sh * 1.6 * J, 1 + st * 1.2 * J, 0, 0); g.translate(-HIP[0], -HEM); }
  const TR = P.turn || 0;
  let tpU = TR ? torsoPts(c).map(([x, y]) => [turnX(x, TR), y]) : torsoPts(c);
  // the police walk (user's reference: "see how natural the police body is"): walking side-on the body is a soft sack -
  // the back rounds out low down like a puffy jacket, the front stays flatter, the top leans into the walk; the arms hang
  // relaxed (the near one along the front edge, the far hand peeking out behind); the head sits forward and dips a little
  const PW = P.legs === 'stride' && !P.planted && Math.abs(TR) > .3, wdir = Math.sign(TR) || 1;
  if (PW) {
    const b0 = boundsOf(tpU), cx0 = (b0.x0 + b0.x1) / 2;
    tpU = tpU.map(([x, y]) => {
      const u = (y - b0.y0) / (b0.y1 - b0.y0), back = (x - cx0) * wdir < 0;
      const dx = back ? -wdir * 58 * Math.sin(Math.PI * u * .62) ** 2 : -wdir * 16 * Math.sin(Math.PI * u);
      return [x + dx + wdir * 30 * (1 - u) ** 1.5, y];
    });
  }
  const BU = boundsOf(tpU);
  const tp = DH ? tpU.map(([x, y]) => [x, stY(y)]) : tpU, B = boundsOf(tp);
  if (seat) shadowBlob(HIP[0], HEM - 8, 250 * ws, 30, 'rgba(20,20,50,.4)', 12);
  // arms resolved once. Default 'stick' (the reference look, user: "like the original stickman"): a thin ink stroke
  // drawn behind the body and again on top except around the shoulder, so it grows out of the tunic's side, ending
  // in an ink-ball hand. c.armStyle = 'sleeve' gives the cloth sleeves with cuffs and pale hands instead.
  const sleeves = (c.armStyle || ARM_STYLE) === 'sleeve';
  const arms = (P.arms || []).map((a, i) => {
    if (!a) return null;
    // LIMB RULES (user, with a pictogram reference): each arm stays on its own shoulder, a joint that moves with the
    // torso - at the body's sides seen from the front, at the top of the body just under the head seen side-on, blended
    // in between - and limbs only rotate and bend from it. The near arm (the side toward the camera, not the way they
    // face) is drawn over the body, the far arm behind it; swinging never swaps them.
    const side = i === 0 ? -1 : 1, s0 = shoulder(c, side), sF = [TR ? turnX(s0[0], TR) : s0[0], stY(s0[1])];
    const sideK = Math.min(1, Math.max(0, (Math.abs(TR) - .1) / .45)), near = side === wdir;
    const s = [L2(sF[0], HIP[0] + wdir * (near ? 16 : -4) * ws, sideK), L2(sF[1], stY(1120), sideK)];
    const top = sideK > .5;
    const armL = Math.max(380, BODY_BASE + 70 - s[1]);
    if ((a.walk != null || a.pump != null) && !a.prop && !a.hh) {
      // walking: a big swing from behind the back to in front, the elbow bending as it comes forward (copied from the
      // reference walk); running (pump): the same swing, harder, with the elbow bent ~90 degrees. Each arm swings
      // opposite to the leg on its own side. Seen from the front the swing goes toward us: the hand rises and comes in.
      const run = a.pump != null, sw = Math.sin(run ? a.pump : a.walk), sw2 = sw * wdir;
      const upA = (run ? .95 : .62) * sw2, bendA = run ? 1.35 + .3 * Math.max(0, sw2) : .28 + .72 * Math.max(0, sw2);
      const eS = [s[0] + wdir * Math.sin(upA) * armL * .5, s[1] + Math.cos(upA) * armL * .5];
      const hS = [eS[0] + wdir * Math.sin(upA + bendA) * armL * .5, eS[1] + Math.cos(upA + bendA) * armL * .5];
      const fw = Math.max(0, sw), bk = Math.max(0, -sw);
      const hF = run ? [s[0] + side * (30 - 40 * fw), s[1] + armL * (.62 - .3 * fw)] : [s[0] + side * (46 - 34 * fw + 10 * bk), s[1] + armL * (.96 - .3 * fw - .03 * bk)];
      const eF = run ? [s[0] + side * (78 + 20 * fw), s[1] + armL * (.48 - .06 * fw)] : [s[0] + side * (54 + 26 * fw), s[1] + armL * (.5 - .06 * fw)];
      const e = [L2(eF[0], eS[0], sideK), L2(eF[1], eS[1], sideK)], hh = [L2(hF[0], hS[0], sideK), L2(hF[1], hS[1], sideK)];
      return { a, s, h: hh, e, side, near, top, line: spline([s, e, hh]) };
    }
    if (a.relax && !PW) {   // resting: hangs from the shoulder with a soft bend (beside the body; side-on, down its front edge)
      const hr = [L2(s[0] + side * 46, s[0] + wdir * 30, sideK), s[1] + armL * .97], er = [L2(s[0] + side * 40, s[0] + wdir * 42, sideK), s[1] + armL * .5];
      return { a, s, h: hr, e: er, side, near, top, line: spline([s, er, hr]) };
    }
    let h = a.h;
    if (P.handLag && !a.prop && !a.hh && !PW) h = [h[0] + P.handLag[0], h[1] + P.handLag[1]];   // follow-through: loose hands trail the body
    if (PW && !a.prop && !a.hh) {          // relaxed hanging arms while walking side-on (a held prop keeps its pose)
      const near = side === wdir, ph = (P.walkPhase || 0) + (near ? Math.PI : 0), sw = Math.sin(ph) * 30;
      const front = wdir > 0 ? BU.x1 : BU.x0, back = wdir > 0 ? BU.x0 : BU.x1;
      h = near ? [front + wdir * (14 + sw), stY(1540 + 8 * Math.cos(2 * ph))] : [back - wdir * (16 - sw * .6), stY(1500 + 8 * Math.cos(2 * ph))];
      a = { h };
    }
    if (a.hh) { const p = headXf(...a.hh); h = [L2(a.h[0], p[0], a.hb ?? 1), L2(a.h[1], p[1], a.hb ?? 1)]; }
    const e = a.e || autoElbow(s, h, side);
    return { a, s, h, e, side, near, top, line: spline([s, e, h]) };
  });
  const stickW = taper(26, .05, .1, .82);
  // head space: offsets, tilt, kid head scale, jelly wobble (used for the hair behind the body and for the head)
  const headSpace = () => {
    g.translate((P.hx || 0) + (PW ? wdir * 32 : 0), (P.hy || 0) - DH + (PW ? 8 : 0)); g.translate(NECK[0], NECK[1]); g.rotate((P.hr || 0) + (PW ? wdir * .05 : 0)); g.translate(-NECK[0], -NECK[1]);
    if (KID) { g.translate(HX, HY + R); g.scale(1.2, 1.2); g.translate(-HX, -HY - R); }
    if (P.jelly) {   // shear (top lags) + squash/stretch about the head's base; face and hat ride along
      const bx = HX, by = HY + R * 0.92, { sh, st } = P.jelly;
      g.translate(bx, by); g.transform(1 - st * 0.6, 0, sh, 1 + st, 0, 0); g.translate(-bx, -by);
    }
  };
  // long hair, buns, tails hang behind the body
  if (c.hair && c.hat !== 'helmet') {
    g.save(); headSpace();
    if (P.hairLag) {   // follow-through: the hanging hair swings from where it hangs (a ponytail from its tie) a beat behind the head
      const tr = P.turn || 0, pv = c.hair === 'ponytail' && Math.abs(tr) >= .3 ? [HX - Math.sign(tr) * .9 * R, HY - .56 * R] : [HX, HY - .55 * R];
      g.translate(pv[0], pv[1]); g.rotate(P.hairLag); g.translate(-pv[0], -pv[1]);
    }
    hairDraw(c, 'back', P); g.restore();
  }
  if (!sleeves) for (const A of arms) if (A) {
    brush(A.line, stickW);
    if (HAND_BALLS && TR && Math.abs(TR) > .3 && A.side === -Math.sign(TR)) { g.fillStyle = INK; g.beginPath(); g.ellipse(A.h[0], A.h[1], 34, 30, -0.3, 0, 7); g.fill(); }   // the far arm's hand, behind
  }
  // torso: garment gradient, outfit details, head shadow on the chest
  g.save(); stretch(); path(tpU); g.clip();
  const base = O.base || c.body, gx = Math.cos(LIGHT) * 260;
  const BF = TR ? boundsOf(torsoPts(c)) : BU;
  const paintFront = () => {                  // the garment as seen from the front (gradient, outfit details)
    const gr = g.createLinearGradient(HIP[0] + gx * ws, 0, HIP[0] - gx * ws, 0);
    gr.addColorStop(0, base[0]); gr.addColorStop(.55, base[1]); gr.addColorStop(1, base[2]);
    g.fillStyle = gr; g.fillRect(BF.x0 - 20, 1000, BF.x1 - BF.x0 + 40, 720);
    if (!LITE) { const vg = g.createLinearGradient(0, 1400, 0, 1680); vg.addColorStop(0, 'rgba(30,10,40,0)'); vg.addColorStop(1, 'rgba(30,10,40,.25)'); g.fillStyle = vg; g.fillRect(BF.x0 - 20, 1400, BF.x1 - BF.x0 + 40, 300); }
    O.inside(c, BF);
    if (O.legacy) drawLegacyCostume(O.legacy, BF);
  };
  if (Math.abs(TR) < .04 || LITE) paintFront();
  else {
    // the body turns with the limbs (user: "his belly is facing us in every way"): the front-view garment is wrapped
    // round the torso like a cylinder and turned - the opening and buttons slide toward the way they face and squeeze,
    // the near side panel spreads across, and past the side we see the garment's edge (its back) - strip by strip
    const tf = g.getTransform(), sc = Math.max(.35, Math.min(1.6, Math.hypot(tf.a, tf.b) * 1.25));
    const ox = BF.x0 - 30, oy = 1000, Wd = Math.ceil((BF.x1 - BF.x0 + 60) * sc), Hd = Math.ceil(740 * sc);
    const L = charDraw.L || (charDraw.L = document.createElement('canvas'));
    if (L.width < Wd || L.height < Hd) { L.width = Math.max(L.width, Wd); L.height = Math.max(L.height, Hd); }
    const lx = L.getContext('2d'); lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, L.width, L.height);
    lx.setTransform(sc, 0, 0, sc, -ox * sc, -oy * sc);
    const main = g; g = lx; try { paintFront(); } finally { g = main; }   // rig units; the main transform adds any body stretch
    const phi = Math.max(-1, Math.min(1, TR)) * Math.PI / 2 * .7;   // side-on (.85) the opening stays just inside the front edge
    const cF = (BF.x0 + BF.x1) / 2, rF = (BF.x1 - BF.x0) / 2, cT = (BU.x0 + BU.x1) / 2, rT = (BU.x1 - BU.x0) / 2;
    const src = x => { const th = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.asin(Math.max(-1, Math.min(1, (x - cT) / rT))) - phi)); return cF + rF * Math.sin(th); };
    // the strips are laid side by side on a second sheet (pixel-aligned, so no seams show when the body leans), then
    // the finished torso goes down in one piece
    const M = charDraw.M || (charDraw.M = document.createElement('canvas')), ox2 = BU.x0 - 30, Wm = Math.ceil((BU.x1 - BU.x0 + 60) * sc);
    if (M.width < Wm || M.height < Hd) { M.width = Math.max(M.width, Wm); M.height = Math.max(M.height, Hd); }
    const mx = M.getContext('2d'); mx.setTransform(1, 0, 0, 1, 0, 0); mx.clearRect(0, 0, M.width, M.height);
    for (let px = 0; px < Wm; px += 2) {
      const xa = ox2 + px / sc, xb = ox2 + (px + 2) / sc, s0 = src(xa), s1 = src(xb);
      mx.drawImage(L, (Math.min(s0, s1) - ox) * sc, 0, Math.max(.5, Math.abs(s1 - s0) * sc), Hd, px, 0, 2, Hd);
    }
    g.drawImage(M, 0, 0, Wm, Hd, ox2, oy, Wm / sc, Hd / sc);
  }
  const [sx, sy] = headXf(HX + 25, HY + R * 0.98);
  if (!LITE) shadowBlob(sx, BODY_BASE - (BODY_BASE - sy) / SYL, R * 0.85, R * 0.28 / SYL, 'rgba(60,30,20,.4)', 16);
  if (SOFT3D && !LITE) softTorso(BU, sx, BODY_BASE - (BODY_BASE - sy) / SYL);
  if (GLOSS && !LITE) glossTorso(tpU, BU, c.cloth);
  g.restore();
  inkRing(tp, 6, 20);
  if (O.over) { g.save(); if (O.flat) { turnAff(.45, .6); O.over(c, B, stY); } else { stretch(); if (Math.abs(TR) > .3) { path(tpU); g.clip(); } turnAff(1, 1); O.over(c, BU); } g.restore(); }   // turned: collars and ties stay on the body   // flat: drawn on the body as it stands (a dress turns softer, its skirt stays under the body)
  // head: skin, beard (under the face so the mouth stays on top), face, hat
  g.save();
  headSpace();
  headDraw(c);
  if (GLOSS && !LITE) glossHead(c);
  if (c.beard) {
    const fs = c.faceShift || 0, look = P.look || 0, sh = D * fs + D * 0.02 * (look - Math.sign(fs)) * 0.5 + D * .17 * (P.turn || 0);
    beardDraw(c, HX + sh - D * 0.01, mouthY(c), P);
  }
  faceDraw(c, P);
  if (c.hair && c.hat !== 'helmet') hairDraw(c, 'front', P);   // a helmet covers the hair (curls poked out over it)
  const hl = P.hatLift || 0;
  g.save(); g.translate(HX + R * .5, HY - R * .7); g.rotate(-0.35 * hl); g.translate(-HX - R * .5, -HY + R * .7 - hl * R * 0.45); hatDraw(c); g.restore();
  g.restore();
  // arms on top: stick arms (default) or sleeves from the shoulder seam (rolled up on the smith), cuff, hand
  arms.forEach(A => {
    if (!A) return;
    const { a, s, h, e, side } = A;
    if (!sleeves) {
      if (TR && Math.abs(TR) > .3 && !A.near) return;   // turned: the far arm stays behind the body (its identity never swaps)
      g.save(); if (!A.top) { g.beginPath(); g.rect(-2000, -2000, 6000, 6000); g.arc(s[0], s[1], 78 * ws, 0, 7); g.clip('evenodd'); }   // a top-of-body arm shows from its root
      brush(A.line, stickW); g.restore();
      if (a.prop) a.prop(h);
      g.fillStyle = INK;
      if (a.point != null) {
        if (HAND_BALLS) { g.beginPath(); g.ellipse(h[0], h[1], 27, 24, 0, 0, 7); g.fill(); }
        brush([[h[0], h[1]], [h[0] + Math.cos(a.point) * 50, h[1] + Math.sin(a.point) * 50]], taper(15, .1, .5, .5));
      } else if (!a.noHand && HAND_BALLS) { g.beginPath(); g.ellipse(h[0], h[1], 34, 30, -0.3, 0, 7); g.fill(); }
      return;
    }
    const S = O.sleeve(c), wrist = [L2(e[0], h[0], .82), L2(e[1], h[1], .82)];
    const at = (p, q, k) => [L2(p[0], q[0], k), L2(p[1], q[1], k)];
    if (S.rolled) {
      tube(spline([s, e]), 66, S.col);
      tube(spline([e, wrist]), 46, c.skin || FACE);
      const roll = spline([at(s, e, .78), e]); brush(roll, () => 82, INK); brush(roll, () => 68, shade(S.col, -.08));
    } else {
      tube(spline([s, e, wrist]), 62, S.col);
      if (!LITE) { const cuff = spline([at(e, wrist, .72), wrist]); brush(cuff, () => 82, INK); brush(cuff, () => 68, S.cuff || shade(S.col, .3)); }
    }
    if (a.prop) a.prop(h);
    if (a.point != null) {
      const tip = [h[0] + Math.cos(a.point) * 70, h[1] + Math.sin(a.point) * 70];
      brush([h, tip], () => 30, INK); brush([h, tip], () => 18, c.skin || FACE);
      fillInk(ellPts(h[0], h[1], 34, 30, 28, a.point), c.skin || FACE, 4, 9);
    } else if (!a.noHand) handDraw(c, h, side);
  });
  g.restore();
}
// ---------- jelly heads: the head shape lags, stretches and jiggles with its own inertia ----------
// The head's motion (pose offsets, body lean/bounce, and the character's travel in the world) is sampled over the
// last ~0.9 s and fed to a damped spring; the spring's displacement becomes a shear (top lags behind) and a
// squash/stretch of the head about its base. Faster moves and harder stops -> bigger wobble. Needs a pose
// FUNCTION of time (placed(c, t => ({...}), ...)); a plain pose object has no motion history and no wobble.
let JELLY = { strength: .25, freq: 3.4, damp: 0.3 };   // v1.0.4: 1 -> .25 (user: fast moves made the character stretch)
let BODY_JELLY = 0;   // v1.0.4: off - the body stretched like rubber on quick moves (user: "that looks bad")          // body wobble with the head's spring (0 = off)
const valAt = (v, t) => typeof v === 'function' ? v(t) : v;
// a walk or run cycle's own step bounce and head bob are left out (walkPhase set): they sit near the spring's rate and
// kept heads and bodies rocking the whole walk; starts, stops, turns and jumps still wobble
function headAnchor(P, x, y, k, t) {
  const p = valAt(P, t), cyc = p.walkPhase != null, lean = p.lean || 0, b = cyc ? 0 : p.bounce || 0, dx = NECK[0] - HIP[0], dy = NECK[1] - HIP[1];
  return [HIP[0] + dx * Math.cos(lean) - dy * Math.sin(lean) + (p.hx || 0) + valAt(x, t) / k,
          HIP[1] - b + dx * Math.sin(lean) + dy * Math.cos(lean) + (p.hy || 0) + (p.dy || 0) + valAt(y, t) / k,
          (cyc ? 0 : p.hr || 0) + lean + (p.rot || 0)];
}
// the body's spring sees only the travel (x, y) and jumps (dy): the steady bounce and sway of a walk cycle sit near the
// spring's own rate and would keep it rocking side to side the whole walk
function bodyAnchor(P, x, y, k, t) { return [valAt(x, t) / k, (valAt(P, t).dy || 0) + valAt(y, t) / k, 0]; }
function jellyAt(P, x, y, k, t, body = false) {
  if (typeof P !== 'function' || !JELLY.strength) return null;
  const anchor = body ? bodyAnchor : headAnchor;
  const dt = 1 / 120, span = 0.9, w = 2 * Math.PI * JELLY.freq, z = JELLY.damp;
  let d = [0, 0, 0], v = [0, 0, 0];
  let p0 = anchor(P, x, y, k, t - span - 2 * dt), p1 = anchor(P, x, y, k, t - span - dt);
  for (let s = t - span; s <= t + 1e-6; s += dt) {
    const p2 = anchor(P, x, y, k, s);
    for (let i = 0; i < 3; i++) {
      const acc = Math.max(-6000, Math.min(6000, (p2[i] - 2 * p1[i] + p0[i]) / (dt * dt)));
      v[i] += (-w * w * d[i] - 2 * z * w * v[i] - acc) * dt; d[i] += v[i] * dt;
    }
    p0 = p1; p1 = p2;
  }
  const S = JELLY.strength, cap = (a, m) => Math.max(-m, Math.min(m, a));
  // d is the spring's lag (opposite to the acceleration). The shear moves the top of the head by -sh per unit
  // height above the base, so sh = -lag puts the top behind the motion; st < 0 squashes when pushed upward.
  // gains tuned on a snappy 0.12 s head turn: peak shear ~0.07, 2-3 visible jiggles, settled in ~0.6 s
  return { sh: cap(-(d[0] / R) * 2.6 * S - d[2] * 0.7 * S, 0.1), st: cap((-d[1] / R) * 2.6 * S, 0.07) };
}
// draw a character with its rig hip at world (x,y), scale k. P may be a pose object or a function of time (enables
// jelly); x and y may also be functions of time (walking, falling) so travel feeds the wobble too.
// Whole-body pose fields used here: dy (rig units up/down, e.g. jumps, sitting down), rot (radians, about the feet:
// falling over), turnX (-1..1 horizontal scale: the squash-and-flip of a turnaround).
// ---------- idle life (rossark-motion: "nothing freezes on screen") ----------
// Everyone on screen gets, unless the pose says idle: false - blinks every ~3-4 s at their own seeded times (now and
// then a double blink), a blink when the head turns quickly, slow breathing, a small head drift and a weight shift.
// Each person runs on their own seeded phases, so a crowd never breathes or blinks together. Walkers keep their own
// walk motion (no breathing, drift or shift on top). IDLE = 0 turns it all off (the old frozen holds).
let IDLE = 1;
// a readable blink (user saw flicker): closes in .11 s, holds .04 s, opens in .19 s easing out; u = s since it began
const blinkShape = u => u <= 0 || u >= .34 ? 0 : u < .11 ? ss2(0, .11, u) : u < .15 ? 1 : (1 - (u - .15) / .19) ** 2;
const idleRand = (s, i) => { const x = Math.sin(s * 127.1 + i * 311.7) * 43758.5453; return x - Math.floor(x); };
function idleSeed(c) {
  if (c._idleSeed == null) { let h = (c.seed || 0) * 7.3 + 1; for (const ch of String(c.name || c.key || '')) h = (h * 31 + ch.charCodeAt(0)) % 9973; c._idleSeed = h; }
  return c._idleSeed;
}
function idleBlinks(c, t) {                    // the person's own blink times, built once up to the scene's end
  const s = idleSeed(c);
  if (!c._blinks || c._blinksTo < t) {
    const list = [], to = Math.max(t, typeof SCENE !== 'undefined' ? SCENE.dur : 60) + 5;
    for (let b = .4 + 2.2 * idleRand(s, 0), i = 1; b < to; i++) {
      list.push(b);
      if (idleRand(s, i * 2) < .15) list.push(b + .4);                      // a double blink now and then
      b += 2.8 + 1.4 * idleRand(s, i * 2 + 1);
    }
    c._blinks = list; c._blinksTo = to;
  }
  return c._blinks;
}
function idleAdd(c, P, pose, t) {
  if (!IDLE || pose.idle === false || LITE) return pose;
  const s = idleSeed(c), ph = k => 2 * Math.PI * idleRand(s, 50 + k);
  let bl = 0;
  for (const b of idleBlinks(c, t)) { if (b > t) break; bl = Math.max(bl, blinkShape(t - b)); }
  // a blink on a quick head turn: find where the look or head tilt started moving fast in the last .34 s
  if (typeof P === 'function') {
    const sp = u => { const a = P(u), b = P(u - 1 / 15); return Math.abs((a.look || 0) - (b.look || 0)) * 15 + Math.abs((a.hr || 0) - (b.hr || 0)) * 40; };
    for (let u = t - .34; u <= t; u += 1 / 30) if (sp(u) > 2.4 && sp(u - 1 / 30) <= 2.4) { bl = Math.max(bl, blinkShape(t - u)); break; }
  }
  pose.blink = Math.max(pose.blink || 0, bl);
  if (pose.legs === 'stride' || pose.legs === 'run' || pose.walkPhase != null) return pose;
  const per = 3.4 + .9 * idleRand(s, 9);                                     // one breath every 3.4-4.3 s
  if (pose.br == null) pose.br = .006 * Math.sin(2 * Math.PI * t / per + ph(1));
  pose.hr = (pose.hr || 0) + .022 * Math.sin(2 * Math.PI * t / 4.6 + ph(2)) + .01 * Math.sin(2 * Math.PI * t / 2.9 + ph(3));   // ~1.5 deg drift
  pose.lean = (pose.lean || 0) + .012 * Math.sin(2 * Math.PI * t / 5.3 + ph(4));                                                // weight shift
  return pose;
}

// ---------- follow-through (rossark-motion: "delay, not springs") ----------
// A child part reads its parent a beat late: part += .45 * (parent(t - .09 s) - parent(t)). Loose hands (no prop, not
// on the head, not a walker's swing) trail the body's travel, bounce and jumps; the hanging back hair trails the head's
// tilt, the body's lean and the travel. FOLLOW = 0 turns it off; a pose can set its own handLag / hairLag.
let FOLLOW = 1;
function followAdd(P, x, y, k, sgn, pose, t, c) {
  if (!FOLLOW || pose.idle === false || LITE) return pose;
  const dt = .09, was = idleAdd(c, P, Object.assign({}, valAt(P, t - dt)), t - dt);   // the parent as it was, idle drift included
  const bx = s => valAt(x, s) / (k * sgn), by = s => valAt(y, s) / k;
  const lx = .45 * (bx(t - dt) - bx(t)), ly = .45 * ((by(t - dt) - (was.bounce || 0) + (was.dy || 0)) - (by(t) - (pose.bounce || 0) + (pose.dy || 0)));
  const walking = pose.legs === 'stride' || pose.legs === 'run' || pose.walkPhase != null;
  if (pose.handLag == null && !walking) pose.handLag = [Math.max(-60, Math.min(60, lx)), Math.max(-60, Math.min(60, ly))];
  if (pose.hairLag == null) {
    const A = p => (p.hr || 0) + (p.lean || 0);
    pose.hairLag = Math.max(-.12, Math.min(.12, .45 * (A(was) - A(pose)) - lx / (2.5 * R)));
  }
  return pose;
}

function placed(c, P, x, y, k, flip = false) {
  const t = TNOW, pose = idleAdd(c, P, Object.assign({}, valAt(P, t)), t);
  if (!pose.jelly) pose.jelly = jellyAt(P, x, y, k, t);
  if (!pose.bodyJelly && BODY_JELLY && !LITE) pose.bodyJelly = jellyAt(P, x, y, k, t, true);
  const sx = (flip ? -1 : 1) * (pose.turnX ?? 1);
  followAdd(P, x, y, k, (flip ? -1 : 1) * (Math.sign(pose.turnX ?? 1) || 1), pose, t, c);
  g.save(); g.translate(valAt(x, t), valAt(y, t)); g.scale(k * sx, k); g.translate(-HIP[0], -HIP[1] + (pose.dy || 0));
  if (pose.rot) { const fy = 1508 + (pose.legLen || legOf(c)); g.translate(HIP[0], fy); g.rotate(pose.rot); g.translate(-HIP[0], -fy); }
  if (GLOSS && SATURATE !== 1) {   // GLOSS: draw on a layer, then lay it down saturated (the rig's own blur filters stay intact)
    const L = placed.L || (placed.L = document.createElement('canvas')), main = g;
    if (L.width !== main.canvas.width || L.height !== main.canvas.height) { L.width = main.canvas.width; L.height = main.canvas.height; }
    const lx = L.getContext('2d'); lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, L.width, L.height); lx.setTransform(main.getTransform());
    g = lx; try { charDraw(c, pose); } finally { g = main; }
    g.restore(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `saturate(${SATURATE}) contrast(1.06)`; g.drawImage(L, 0, 0); g.restore(); return;
  }
  charDraw(c, pose); g.restore();
}
const rigToWorld = (at, x, y) => [at[0] + (x - HIP[0]) * at[2], at[1] + (y - HIP[1]) * at[2]];

// ---------- perspective: a character's size comes from where its feet stand on the plate ----------
// Every plate is measured once on its grid (grid.html, SHOTS.md "Scale"): SCENE.plates.name =
//   { src, scale: [[footY, height], [footY2, height2]] }   world px; height = a standing person, soles to top of head,
//   worked out from objects of known size in the painting (door, barrel, table, wall block). Two depths give a line;
//   { src, horizon: y, scale: [[footY, height]] } works for eye-level views (height shrinks to 0 at the horizon).
// stand(c, P, x, footY, { size, flip }) then places the character with its feet on footY at the right size, so
// nobody is sized by eye (user: kings were 8 wall blocks tall, smiths pressed against the camera).
const CHAR_H = 1480 + LEG - 560, FEET = LEG;   // soles to head top of an adult; hip to soles
// the walk's step: each leg swings this far (radians) either side; a step is 2 * LEG * sin(STRIDE_A) rig units, about a
// fifth of the body's height (user: the first walk took "too big steps" at .42)
let WALK_BOB = 30;      // extra dip of the body on each step, rig units (0 = the old walk); a pose can set walkBob
let WALK_LEGS = 'knee';  // 'knee' = the reference walk legs (thigh, shin, knee, back kick); 'scissor' = the old ones
const STRIDE_A = .232;   // with the longer legs (LEG 720) this keeps the approved step length: 2*720*sin(.232) = 2*560*sin(.3)
const PLATE_META = {};
let PLATE_NOW = null;
function personH(footY, plate = PLATE_NOW) {
  const m = PLATE_META[plate], s = m && m.scale;
  if (!s || !s.length) throw new Error(`plate '${plate}' has no scale: measure it on its grid (SHOTS.md "Scale")`);
  if (s.length === 1) {
    if (m.horizon == null) throw new Error(`plate '${plate}': one scale pair needs a horizon`);
    return Math.max(10, s[0][1] * (footY - m.horizon) / (s[0][0] - m.horizon));
  }
  const [[y1, h1], [y2, h2]] = s;
  return Math.max(10, h1 + (footY - y1) * (h2 - h1) / (y2 - y1));
}
const depthK = (footY, plate) => personH(footY, plate) / CHAR_H;
// ---------- camera paths: one long take travelling across a big set (pan, push in, pull back) ----------
// camPath(stops, o) -> a shot's cam. Each stop is where the camera ARRIVES at time t:
//   { t, x, y, z }               a point of the world (centre) and zoom
//   { t, on: [x, footY], frame } a character standing at x, feet on footY, framed by the plate's scale - frame = view
//                                height in person heights (2.4 = full body with room, default; 1.4 = waist up; 0.9 = face)
//   { t, all: true }             the whole set, as far out as the plate allows
// It glides there over `move` seconds (stop.move ?? o.move ?? 0.9) with ease-in-out, then holds, creeping in slowly
// (o.creep, default 0.025 per second) so it is never dead still. Moves must not overlap (stop.t - move >= previous t).
function camStop(s, plate) {
  if (s.all) { const B = plateBox(plate); return { x: B.x + B.w / 2, y: B.y + B.h / 2, z: Math.max(W / B.w, H / B.h) }; }
  if (s.on) { const [x, fy] = s.on, h = personH(fy, plate), f = s.frame || 2.4; return { x, y: fy - h * Math.min(.62, .3 + f * .13), z: s.z || H / (h * f) }; }
  return { x: s.x, y: s.y, z: s.z || 1 };
}
function camPath(stops, o = {}) {
  const creep = o.creep ?? .025, mv = i => stops[i].move ?? o.move ?? .9;
  return t => {
    const P = stops.map(s => camStop(s, PLATE_NOW));
    const at = (i, tau) => ({ ...P[i], z: P[i].z * (1 + creep * Math.max(0, tau - stops[i].t)) });
    const lerp = (a, b, k) => ({ x: L2(a.x, b.x, k), y: L2(a.y, b.y, k), z: Math.exp(L2(Math.log(a.z), Math.log(b.z), k)) });
    let cur = at(0, Math.min(t, stops[1] ? stops[1].t - mv(1) : t));
    for (let i = 1; i < stops.length; i++) {
      const a = stops[i].t - mv(i); if (t <= a) break;
      const next = stops[i + 1] ? stops[i + 1].t - mv(i + 1) : Infinity;
      cur = lerp(at(i - 1, a), at(i, Math.min(t, next)), ss2(a, stops[i].t, t));
    }
    return { cx: cur.x, cy: cur.y, z: cur.z };
  };
}
function stand(c, P, x, footY, o = {}) {
  const fy = valAt(footY, TNOW), k = (o.k ?? depthK(fy, o.plate)) * (o.size || c.size || 1);
  placed(c, P, x, typeof footY === 'function' ? t => footY(t) - legOf(c) * k : fy - legOf(c) * k, k, o.flip);
  return k;
}
// [x, hipY, k] of a character standing with its feet on footY of a plate: placed(c, P, ...spot('forge', 470, 1300))
const spot = (plate, x, footY, size = 1) => { const k = depthK(footY, plate) * size; return [x, footY - FEET * k, k]; };
// world point of a rig point for a character placed with stand() (props, glints, speech anchors)
const standToWorld = (x, footY, k, rx, ry) => [x + (rx - HIP[0]) * k, footY - FEET * k + (ry - HIP[1]) * k];
