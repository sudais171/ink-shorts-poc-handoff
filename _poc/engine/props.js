// Ink Shorts engine - props. World-space draw functions (x, y = where the prop stands/sits) and
// hand props (factories returning fn(hand) drawn in rig space at the hand).
// Props follow the character style: flat lit-to-shadow fills, shadow-weighted ink outlines.

// ----- hand props -----
function malletProp(ang, len = 260) {
  return h => {
    const ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux, e = [h[0] + ux * len, h[1] + uy * len];
    brush([[h[0] - ux * 30, h[1] - uy * 30], e], () => 22, INK); brush([[h[0] - ux * 26, h[1] - uy * 26], e], () => 13, '#a8743e');
    const hw = 105, hd = 66;
    const box = [[e[0] - px * hw - ux * hd * .4, e[1] - py * hw - uy * hd * .4], [e[0] + px * hw - ux * hd * .4, e[1] + py * hw - uy * hd * .4],
                 [e[0] + px * hw + ux * hd, e[1] + py * hw + uy * hd], [e[0] - px * hw + ux * hd, e[1] - py * hw + uy * hd]];
    fillInk(box, '#8a5530', 5, 12);
    g.fillStyle = 'rgba(255,220,170,.35)'; path([box[0], box[1], V2(box[1], box[2], .25), V2(box[0], box[3], .25)]); g.fill();
  };
}
function handMirrorProp(k = 1) {
  return h => {
    if (k <= 0.01) return;
    g.save(); g.translate(h[0], h[1]); g.scale(k, k);
    brush([[0, 20], [0, -110]], () => 26, INK); brush([[0, 16], [0, -108]], () => 15, '#d9a63a');
    fillInk(ellPts(0, -190, 92, 100, 48), '#e3b54a', 6, 12);
    const glass = ellPts(0, -190, 72, 80, 48);
    g.save(); path(glass); g.clip();
    const gr = g.createLinearGradient(-70, -270, 70, -110); gr.addColorStop(0, '#f2fbff'); gr.addColorStop(.5, '#9fd2f4'); gr.addColorStop(1, '#d6efff');
    g.fillStyle = gr; g.fillRect(-80, -280, 160, 180);
    g.fillStyle = 'rgba(255,255,255,.75)'; path([[-50, -250], [-15, -250], [-60, -150], [-75, -175]]); g.fill();
    g.restore(); g.restore();
  };
}
function cashProp(k = 1) {            // a fat stack of bills held in the hand
  return h => { if (k <= .01) return; g.save(); g.translate(h[0], h[1] - 40); g.scale(k, k); moneyStack(0, 0, 1.2, 3); g.restore(); };
}
function slipProp(k = 1) {            // a betting slip / paper
  return h => { if (k <= .01) return; g.save(); g.translate(h[0] + 20, h[1] - 60); g.rotate(-0.2); g.scale(k, k); fillInk([[-50, -70], [50, -70], [50, 70], [-50, 70]], '#f4efe2', 3, 6);
    g.fillStyle = 'rgba(60,50,40,.6)'; for (let i = 0; i < 5; i++) g.fillRect(-35, -45 + i * 22, 70 - (i % 2) * 25, 6); g.restore(); };
}

// ----- standing props (world space) -----
function piggyDraw(x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const lx of [-70, -25, 30, 75]) fillInk([[lx - 18, 60], [lx + 18, 60], [lx + 16, 105], [lx - 16, 105]], '#e8708a', 3, 6);
  const body = ellPts(0, 0, 140, 100, 64);
  g.save(); path(body); g.clip();
  const gr = g.createRadialGradient(-50, -40, 10, 0, 0, 160); gr.addColorStop(0, '#ffd0da'); gr.addColorStop(.5, '#ff9cb2'); gr.addColorStop(1, '#d9587a');
  g.fillStyle = gr; g.fillRect(-150, -110, 300, 220); g.restore();
  inkRing(body, 4, 11);
  fillInk([[-60, -80], [-30, -135], [-10, -88]], '#f489a2', 3, 6); fillInk([[40, -88], [70, -135], [92, -78]], '#f489a2', 3, 6);
  fillInk(ellPts(140, 10, 36, 30, 32), '#f7a0b5', 3, 8);
  g.fillStyle = INK; for (const dy of [-8, 12]) { g.beginPath(); g.ellipse(146, 10 + dy, 6, 8, 0, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(92, -32, 8, 11, 0, 0, 7); g.fill();
  g.fillStyle = '#5a2a3a'; g.fillRect(-35, -96, 60, 9);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-60, -50, 26, 12, -0.5, 0, 7); g.fill();
  brush(spline([[-138, -10], [-165, -30], [-160, -55], [-140, -45]]), () => 7);
  g.restore();
}
// ----- wood: every code-drawn wooden thing (posts, beams, planks, frames, tables, platforms, fences, tripods) is made
// of these, so it reads as wood - grain lines, a knot, light and shadow, ink outline (user: plain brown shapes "dont
// even look wood"). col: '#a06a3c' (default), lighter '#c08a52' (fresh pine), darker '#6e4a2c' (old / wet) -
// pick it from the plate's own wood. seed varies the grain so neighbouring planks differ.
const WOOD = '#a06a3c';
// fill pts with wood whose grain runs along u: P(u, v) maps u 0..1 along the grain and v 0..1 across it to a point
function woodFill(pts, P, len, wid, o = {}) {
  const col = o.col || WOOD, sd = (o.seed ?? 1) * 13.7;
  shadedShape(pts, shade(col, .2), col, shade(col, -.3), 0, 0);
  if (!LITE && wid > 6) {
    g.save(); path(pts); g.clip();
    const n = Math.max(2, Math.min(8, Math.round(wid / 15)));
    for (let i = 0; i < n; i++) {
      const v0 = (i + .25 + hash(sd + i * 7) * .5) / n, amp = .35 / n, ph = hash(sd + i * 3) * 6, u0 = hash(sd + i * 5) * .25, u1 = 1 - hash(sd + i * 9) * .25;
      const line = []; for (let k = 0; k <= 18; k++) { const u = L2(u0, u1, k / 18); line.push(P(u, v0 + amp * Math.sin(ph + u * len / 70))); }
      brush(line, taper(Math.max(2, Math.min(5, wid * .06)), .35, .35, .15), i % 3 === 2 ? 'rgba(255,232,190,.28)' : 'rgba(58,30,12,.42)', false);
    }
    if (len > wid * 2.5 && hash(sd + 1) < .85) {                     // a knot with the grain bending around it
      const uk = .25 + hash(sd + 2) * .5, vk = .3 + hash(sd + 4) * .4, c = P(uk, vk), c2 = P(uk + .02, vk);
      const a = Math.atan2(c2[1] - c[1], c2[0] - c[0]), r = Math.min(wid * .08, 8);   // small and long: big round knots read as eyes
      g.fillStyle = 'rgba(58,30,12,.5)'; g.beginPath(); g.ellipse(c[0], c[1], r * 2.6, r, a, 0, 7); g.fill();
      g.strokeStyle = 'rgba(58,30,12,.3)'; g.lineWidth = 2; g.beginPath(); g.ellipse(c[0], c[1], r * 4.5, r * 1.9, a, Math.PI * .1, Math.PI * .9); g.stroke();
      g.beginPath(); g.ellipse(c[0], c[1], r * 4.5, r * 1.9, a, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    }
    g.restore();
  }
  inkRing(pts, o.lw ?? 3, o.ws ?? 7);
}
// a post / beam / stake / handle from a to b, w thick (o.point: sharpened end at b, for fence stakes; o.wb: thickness
// at b if it tapers). Returns nothing; draw order = back to front.
function woodBeam(a, b, w, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const wa = w / 2, wb = (o.wb ?? w) / 2, tipL = o.point ? Math.min(w * .9, len * .3) : 0, c = [b[0] - ux * tipL, b[1] - uy * tipL];
  const pts = [[a[0] + nx * wa, a[1] + ny * wa], [c[0] + nx * wb, c[1] + ny * wb]];
  if (o.point) pts.push(b);
  pts.push([c[0] - nx * wb, c[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]);
  woodFill(pts, (u, v) => { const ww = L2(wa, wb, u) * 2; return [a[0] + dx * u + nx * (v - .5) * ww, a[1] + dy * u + ny * (v - .5) * ww]; }, len, w, o);
}
// planks side by side filling a 4-corner area p0 p1 p2 p3 (grain along p0->p1, planks stacked from p0p1 to p3p2):
// table tops, platforms, floors, crates, doors, sign boards. o: { n planks, nails: true, col, seed }
function woodPlanks(q, o = {}) {
  const [p0, p1, p2, p3] = q, n = o.n || 3, B = (u, v) => V2(V2(p0, p1, u), V2(p3, p2, u), v);
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), wid = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / n;
  for (let i = 0; i < n; i++) {
    const v0 = i / n, v1 = (i + 1) / n, P = (u, v) => B(u, L2(v0, v1, v));
    woodFill([P(0, 0), P(1, 0), P(1, 1), P(0, 1)], P, len, wid, { ...o, seed: (o.seed ?? 1) * 7 + i, col: shade(o.col || WOOD, (hash(i * 3 + (o.seed ?? 1)) - .5) * .16), lw: 2, ws: 4 });
    if (o.nails !== false && !LITE && wid > 14) for (const u of [.04, .96]) { const p = P(u, .5); g.fillStyle = '#2a2024'; g.beginPath(); g.arc(p[0], p[1], Math.max(2.5, wid * .07), 0, 7); g.fill(); }
  }
  inkRing(q, 3, 8);
}
// table seen slightly from above: plank top between y and y+depth, front apron and legs down to floorY
function tableDraw(x0, x1, y, depth = 90, floorY = 1930, col = '#c9692e') {
  for (const x of [x0 + 40, x1 - 100]) woodBeam([x + 30, y + depth + 60], [x + 30, floorY], 56, { col: shade(col, -.25), wb: 46, seed: x });
  woodPlanks([[x0, y + depth], [x1, y + depth], [x1, y + depth + 75], [x0, y + depth + 75]], { n: 1, col: shade(col, -.15), seed: 4, nails: false });
  woodPlanks([[x0 + 30, y], [x1 - 30, y], [x1, y + depth], [x0, y + depth]], { n: 3, col, seed: 2 });
}

// ----- holes in the ground -----
// H = { cx, cy, rx, ry }: the hole's opening, an ellipse on the floor (front rim = its lower half). Whatever is in the
// hole (a bell being lowered, a man who jumped in) is hidden below the front rim and darkens the deeper it goes - never
// stands in front of the opening (user: "stupid inground bell").
//   holeDraw(H)          the dark opening with its far wall and a dirt lip (skip it when the plate already has the hole)
//   inHole(H, () => {...})  draws what is inside: cut at the front rim, shaded into the dark
// Order: holeDraw -> fenceRing back -> inHole -> fenceRing front -> people in front.
// a round thing lying on the floor (hole, well, fence ring, rug, shadow) sized and squashed for the plate's camera:
// r in person heights at that depth, tilt = how round a circle on this floor looks (plate meta tilt: ~.25 eye level,
// ~.45 high angle, ~.8 near top-down - read it off a round thing on the plate's grid). -> { cx, cy, rx, ry }
function floorRing(x, footY, r, plate = PLATE_NOW) {
  const rx = r * personH(footY, plate), m = PLATE_META[plate] || {};
  return { cx: x, cy: footY, rx, ry: rx * (m.tilt ?? .32) };
}
function holeDraw(H, o = {}) {
  const { cx, cy, rx, ry } = H, soil = o.soil || '#7a5534', rim = ellPts(cx, cy, rx, ry, 64);
  g.save(); path(rim); g.clip();
  g.fillStyle = '#120a06'; g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  // the far inside wall: the band between the back rim and the same ellipse sunk by the hole's depth - lit soil at the
  // top fading into the dark, with layers of earth, so the hole reads as a real pit (the near wall is hidden by the rim)
  const dep = ry * (o.depth ?? 1.25), wall = [];
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; wall.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  for (let i = 40; i >= 0; i--) { const a = Math.PI + i / 40 * Math.PI; wall.push([cx + Math.cos(a) * rx * .96, cy + dep + Math.sin(a) * ry * .96]); }
  const gr = g.createLinearGradient(0, cy - ry, 0, cy + dep * .5); gr.addColorStop(0, shade(soil, .02)); gr.addColorStop(.3, shade(soil, -.5)); gr.addColorStop(.75, '#1a0f08'); gr.addColorStop(1, '#120a06');
  g.fillStyle = gr; path(wall); g.fill();
  if (!LITE) {
    g.save(); path(wall); g.clip();
    for (let j = 1; j <= 4; j++) {                                     // layers of earth following the curve
      const k = j / 5, line = []; for (let i = 0; i <= 30; i++) { const a = Math.PI + .15 + i / 30 * (Math.PI - .3); line.push([cx + Math.cos(a) * rx * (1 - .04 * k), cy + dep * k * .8 + Math.sin(a) * ry * (1 - .04 * k)]); }
      brush(line, taper(4, .2, .2, .2), `rgba(40,24,12,${.35 - k * .2})`, false);
    }
    for (let i = 0; i < 8; i++) {                                      // roots and stones
      const a = Math.PI + .3 + hash(i * 5 + 1) * (Math.PI - .6), d = hash(i * 3) * .5, x = cx + Math.cos(a) * rx * .97, y = cy + Math.sin(a) * ry + dep * d * .6;
      if (i % 2) brush(spline([[x, y], [x + 8, y + dep * .12], [x - 5, y + dep * .25]]), taper(5, .2, .6, .1), 'rgba(40,24,12,.6)', false);
      else { g.fillStyle = `rgba(170,140,110,${.4 - d * .5})`; g.beginPath(); g.ellipse(x, y, rx * .05, ry * .1, 0, 0, 7); g.fill(); }
    }
    g.restore();
  }
  g.restore();
  inkRing(rim, 4, 9);
  const lip = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI; lip.push([cx + Math.cos(a) * rx * 1.02, cy + Math.sin(a) * ry * 1.02]); }
  brush(lip, taper(ry * .22, .25, .25, .3), shade(soil, .12), false);
  brush(lip.map(([x, y]) => [x, y - ry * .08]), taper(5, .2, .2, .3), INK, false);
}
let HOLE_L = null;
function inHole(H, fn, o = {}) {
  const { cx, cy, rx, ry } = H;
  if (!HOLE_L || HOLE_L.width !== g.canvas.width || HOLE_L.height !== g.canvas.height) { HOLE_L = document.createElement('canvas'); HOLE_L.width = g.canvas.width; HOLE_L.height = g.canvas.height; }
  const lg = HOLE_L.getContext('2d'); lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, HOLE_L.width, HOLE_L.height); lg.setTransform(g.getTransform());
  const g0 = g; g = lg;
  try {
    fn();
    // deeper = darker: from the back rim (ground level, fully lit) down to the front rim
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, cy - ry, 0, cy + ry * (o.deep ?? 1.4)); gr.addColorStop(0, 'rgba(18,10,6,0)'); gr.addColorStop(1, `rgba(18,10,6,${o.dark ?? .8})`);
    g.fillStyle = gr; g.fillRect(cx - rx * 2, cy - ry, rx * 4, ry * 6);
    g.globalCompositeOperation = 'source-over';
  } finally { g = g0; }
  g.save();
  g.beginPath(); g.moveTo(cx - rx, cy - 6000); g.lineTo(cx - rx, cy);
  for (let i = 0; i <= 40; i++) { const a = Math.PI - i / 40 * Math.PI; g.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
  g.lineTo(cx + rx, cy - 6000); g.closePath(); g.clip();
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(HOLE_L, 0, 0);
  g.restore();
}

// ----- a fence ring around a hole / a well / anything on the ground -----
// Posts stand on an ellipse F = { cx, cy, rx, ry } (make it wider than the hole), two rails nailed between them, back
// posts smaller by perspective. Draw part 'back' before what is inside the ring and 'front' after it.
// o: { h: post height at the front, n: posts all round (14), gap: [a0, a1] opening (radians: 0 = right, PI/2 = front),
//      built: 0..1 (posts go up one by one round the ring, for a building shot), far: back-post scale (.8), col, w }
// Never stand flat fence pictures in a row in front of the hole (user: "cant it build around the hole").
function fenceRing(F, part, o = {}) {
  const { cx, cy, rx, ry } = F, n = o.n || 14, h0 = o.h || 200, far = o.far ?? .8, col = o.col || WOOD, gap = o.gap;
  const inGap = a => { if (!gap) return false; const m = x => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); const A = m(a), g0 = m(gap[0]), g1 = m(gap[1]); return g0 <= g1 ? A > g0 && A < g1 : A > g0 || A < g1; };
  const all = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI + Math.PI / n; if (!inGap(a)) all.push({ i, a, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, k: L2(far, 1, (Math.sin(a) + 1) / 2) }); }
  const show = Math.round(all.length * clamp01(o.built ?? 1)), posts = all.slice(0, show);
  const front = p => Math.sin(p.a) > 0, mine = posts.filter(p => (part === 'front') === front(p)).sort((p, q) => p.y - q.y);
  const rails = [];
  for (let j = 0; j + 1 < posts.length + (show === all.length && !gap ? 1 : 0); j++) {
    const p = posts[j], q = posts[(j + 1) % posts.length]; if (!q || (q.i - p.i + n) % n !== 1) continue;
    const mid = Math.atan2((p.y + q.y) / 2 - cy, ((p.x + q.x) / 2 - cx) * ry / rx);
    if ((part === 'front') === (Math.sin(mid) > 0)) rails.push([p, q]);
  }
  const W = o.w || h0 * .2, drawRails = () => { for (const [p, q] of rails.sort((r, s) => (r[0].y + r[1].y) - (s[0].y + s[1].y)))
    for (const f of [.32, .72]) woodBeam([p.x, p.y - h0 * p.k * f], [q.x, q.y - h0 * q.k * f], W * .7 * (p.k + q.k) / 2, { col: shade(col, .06), seed: p.i * 3 + f * 10 }); };
  if (part !== 'front') drawRails();
  for (const p of mine) {
    if (!LITE) shadowBlob(p.x + 8, p.y, W * p.k * .8, W * p.k * .25, 'rgba(20,12,6,.35)', 6);
    woodBeam([p.x, p.y], [p.x, p.y - h0 * p.k], W * p.k, { col, point: true, seed: p.i });
  }
  if (part === 'front') drawRails();
}
// chalk lines on an existing board in the plate: rows [[col1, col2, col3], ...], rect [x0,y0,x1,y1], circle = row index to ring the last column
function chalkBoard(rows, rect, circle = -1, cols = [0.07, 0.17, 0.78]) {
  const [x0, y0, x1, y1] = rect, rh = (y1 - y0) / (rows.length + 0.5);
  g.save();
  // each entry fits its own cell (up to the next column), so long entries shrink instead of running into the next
  rows.forEach((r, i) => r.forEach((txt, j) => {
    const cx0 = x0 + (x1 - x0) * cols[j], cx1 = x0 + (x1 - x0) * (cols[j + 1] ?? 0.98);
    fitText(txt, { x: cx0, y: y0 + rh * (i + 0.3), w: cx1 - cx0, h: rh * 0.9 }, { font: '"Segoe Print", "Comic Sans MS", cursive', weight: 700, color: 'rgba(245,242,230,.88)', align: 'left', pad: .05, max: rh * 0.55, lines: 1 });
  }));
  if (circle >= 0) { const y = y0 + rh * (circle + 0.75), cx = x0 + (x1 - x0) * (cols[2] + 0.08); g.strokeStyle = 'rgba(245,235,200,.85)'; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, y, (x1 - x0) * 0.12, rh * 0.45, -0.05, 0, 7); g.stroke(); }
  g.restore();
}
function giantMirror(x, y, s, flash = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const [a, b] of [[[-150, -300], [-260, 560]], [[150, -300], [260, 560]], [[0, -380], [0, 600]]]) { brush([a, b], () => 30, INK); brush([a, b], () => 18, '#8a5a34'); }
  fillInk([[-300, 330], [300, 330], [300, 362], [-300, 362]], '#8a5a34', 4, 8);
  const fr = spline([[-280, 360], [-300, -260], [-200, -470], [0, -540], [200, -470], [300, -260], [280, 360]], 12).concat([[280, 360], [-280, 360]]);
  shadedShape(fr, '#ffe08a', '#d9a63a', '#9c6e1e', 6, 16);
  const glass = spline([[-220, 310], [-240, -230], [-160, -410], [0, -470], [160, -410], [240, -230], [220, 310]], 12).concat([[-220, 310]]);
  g.save(); path(glass); g.clip();
  const gr = g.createLinearGradient(-240, -470, 240, 310); gr.addColorStop(0, '#f4fbff'); gr.addColorStop(.4, '#a8d8f6'); gr.addColorStop(.75, '#d2edfb'); gr.addColorStop(1, '#7fb8e0');
  g.fillStyle = gr; g.fillRect(-260, -480, 520, 800);
  g.fillStyle = 'rgba(255,255,255,.55)'; path([[-170, -380], [-90, -400], [-210, 0], [-235, -60]]); g.fill(); path([[-40, -420], [10, -425], [-150, 120], [-180, 80]]); g.fill();
  g.fillStyle = `rgba(255,255,240,${0.85 * flash})`; g.fillRect(-260, -480, 520, 800);
  g.restore();
  inkRing(glass, 3, 6, () => 0, 'rgba(90,60,10,.7)');
  for (const [dx, dy] of [[0, -505], [-250, -300], [250, -300]]) { g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(dx, dy, 22, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); }
  g.restore();
}
function dollarBill(x, y, ang = 0, flip = 1, s = 1) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s * Math.max(0.15, Math.abs(flip)));
  fillInk([[-60, -28], [60, -28], [60, 28], [-60, 28]], '#9fd39a', 3, 5);
  g.strokeStyle = '#4f8f4c'; g.lineWidth = 3; g.strokeRect(-50, -19, 100, 38);
  g.fillStyle = '#3c7a3a'; g.font = '900 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, 2);
  g.restore();
}
function moneyStack(x, y, s = 1, layers = 4) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = layers - 1; i >= 0; i--) {
    const yy = -i * 22;
    fillInk([[-70, yy - 18], [70, yy - 18], [78, yy + 8], [-62, yy + 8]], i % 2 ? '#8fcb8a' : '#a6dba0', 3, 6);
    g.fillStyle = '#f4efe2'; g.fillRect(-12, yy - 14, 24, 20);
  }
  g.restore();
}
function coin(x, y, spin, s = 1) {
  const w = 22 * s * Math.max(0.2, Math.abs(Math.cos(spin)));
  g.fillStyle = '#e8b830'; g.beginPath(); g.ellipse(x, y, w, 22 * s, 0, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = 4 * s; g.stroke();
  g.fillStyle = 'rgba(255,245,180,.8)'; g.beginPath(); g.ellipse(x - w * .3, y - 7 * s, w * .3, 5 * s, 0, 0, 7); g.fill();
}
function crate(x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shadedShape([[-90, -150], [90, -150], [90, 0], [-90, 0]], '#d9a36a', '#b8834a', '#8a5a2c', 4, 9);
  g.strokeStyle = 'rgba(80,45,15,.6)'; g.lineWidth = 6; for (const yy of [-100, -50]) { g.beginPath(); g.moveTo(-88, yy); g.lineTo(88, yy); g.stroke(); }
  g.beginPath(); g.moveTo(-88, -148); g.lineTo(88, -2); g.stroke();
  g.restore();
}
function barrel(x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const pts = spline([[-70, 0], [-85, -90], [-70, -180], [70, -180], [85, -90], [70, 0]], 10).concat([[-70, 0]]);
  shadedShape(pts, '#c98a4a', '#9c6430', '#6a3e1a', 4, 10);
  for (const yy of [-40, -140]) brush([[-80, yy], [80, yy]], () => 14, '#6a6a74');
  g.restore();
}
function bottle(x, y, s = 1, col = '#f4f1e8') {
  g.save(); g.translate(x, y); g.scale(s, s);
  shadedShape([[-30, 0], [-30, -90], [-14, -120], [-14, -150], [14, -150], [14, -120], [30, -90], [30, 0]], shade(col, .2), col, shade(col, -.3), 3, 7);
  g.restore();
}
// ---------- words that respect their surface ----------
// fitText(text, box, o) draws words inside box { x, y, w, h } in the current transform, so they move, turn and squash
// with whatever they are on. The size is the largest that fits with a margin; long text wraps onto up to o.lines lines;
// everything is clipped to the box, so words can never spill off a sign, screen, label or board (user: "YAWN" ran
// off the phone). o: { font, weight, color, pad (share of the smaller side, default .1), lines (2, tall boxes 4), max (px),
// align 'center'|'left', outline (colour) }. Text that had to get too small to read is reported by the renderer.
const FIT_LOG = [];
function fitWarn(text, why) { if (!FIT_LOG.some(e => e.text === text && e.why === why)) FIT_LOG.push({ text, why, t: +(typeof TNOW === 'number' ? TNOW : 0).toFixed(2) }); }
function fitText(text, box, o = {}) {
  text = String(text ?? '').trim(); if (!text) return;
  const pad = (o.pad ?? 0.1) * Math.min(box.w, box.h), bw = box.w - 2 * pad, bh = box.h - 2 * pad;
  const maxLines = o.lines || (box.h > box.w * 1.3 ? 4 : 2);   // tall surfaces (phone screens, posters) stack words
  if (bw <= 0 || bh <= 0) return;
  const fam = o.font || '"Arial Black", Arial, sans-serif', wt = o.weight || 900, words = text.split(/\s+/);
  g.save();
  let best = null;
  for (let n = 1; n <= Math.min(maxLines, words.length); n++) {
    const target = text.length / n, lines = [''];         // break into n lines of about equal length
    for (const w of words) { const cur = lines[lines.length - 1]; if (cur && lines.length < n && (cur + ' ' + w).length > target * 1.15) lines.push(w); else lines[lines.length - 1] = cur ? cur + ' ' + w : w; }
    let size = Math.min(o.max || 1e9, bh / (lines.length * 1.12));
    g.font = `${wt} ${size}px ${fam}`;
    const wide = Math.max(...lines.map(l => g.measureText(l).width));
    if (wide > bw) size *= bw / wide;
    if (!best || size > best.size * 1.05) best = { size, lines };
  }
  const { size, lines } = best, m = g.getTransform(), onScreen = size * Math.hypot(m.a, m.b) / RES;
  if (onScreen < 16) fitWarn(text, `only ${onScreen.toFixed(0)} px tall on screen - shorten it or give it a bigger surface`);
  g.beginPath(); g.rect(box.x, box.y, box.w, box.h); g.clip();
  g.font = `${wt} ${size}px ${fam}`; g.textBaseline = 'middle'; g.textAlign = o.align === 'left' ? 'left' : 'center';
  const x = o.align === 'left' ? box.x + pad : box.x + box.w / 2, lh = size * 1.12, y0 = box.y + box.h / 2 - lh * (lines.length - 1) / 2 + size * 0.04;
  lines.forEach((l, i) => {
    if (o.outline) { g.lineJoin = 'round'; g.lineWidth = size * 0.14; g.strokeStyle = o.outline; g.strokeText(l, x, y0 + i * lh); }
    g.fillStyle = o.color || INK; g.fillText(l, x, y0 + i * lh);
  });
  g.restore();
}
// sign with lettering that always fits. Signs never float: o.post = floorY stands it on two posts, o.hang = topY hangs
// it from two ropes (from a beam, branch or bracket in the plate); a sign held by someone needs neither.
function signBoard(x, y, w, h, text, col = '#e9c46a', ink = '#3a2418', font = 'Georgia', o = {}) {
  if (o.post != null) for (const s of [-1, 1]) { const px = x + s * w * .32; fillInk([[px - 12, y], [px + 12, y], [px + 12, o.post], [px - 12, o.post]], '#8a5a34', 3, 7); }
  if (o.hang != null) for (const s of [-1, 1]) brush([[x + s * w * .36, o.hang], [x + s * w * .36, y - h / 2 + 6]], () => 6, '#5a4030');
  shadedShape([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], shade(col, .2), col, shade(col, -.3), 4, 9);
  fitText(text, { x: x - w / 2, y: y - h / 2, w, h }, { font, color: ink, pad: .16 });
}
// four-wheeled delivery cart (side view, facing right), body text optional; wheels spin with `roll`
function cartDraw(x, y, s = 1, roll = 0, text = '', col = '#d63c30') {
  g.save(); g.translate(x, y); g.scale(s, s);
  brush([[180, -120], [360, -150]], () => 16, INK); brush([[180, -120], [360, -150]], () => 9, '#8a5a34');      // shafts
  shadedShape([[-220, -320], [200, -320], [200, -110], [-220, -110]], shade(col, .25), col, shade(col, -.35), 5, 12);
  fillInk([[-230, -340], [210, -340], [210, -318], [-230, -318]], '#f2efe6', 3, 6);
  if (text) fitText(text, { x: -210, y: -310, w: 400, h: 190 }, { font: 'Georgia', color: '#f7f3e8', max: 80 });
  for (const wx of [-140, 120]) {
    const r = 85; g.fillStyle = INK; g.beginPath(); g.arc(wx, -40, r, 0, 7); g.fill();
    g.fillStyle = '#e8c35a'; g.beginPath(); g.arc(wx, -40, r - 14, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = 8;
    for (let i = 0; i < 8; i++) { const a = roll + i * Math.PI / 4; g.beginPath(); g.moveTo(wx, -40); g.lineTo(wx + Math.cos(a) * (r - 14), -40 + Math.sin(a) * (r - 14)); g.stroke(); }
    g.fillStyle = INK; g.beginPath(); g.arc(wx, -40, 16, 0, 7); g.fill();
  }
  g.restore();
}
