// The new cast (approved 2026-11-02) as a self-contained module for the 3D sets: no outlines, soft 3D shading, white head
// with the soft inner shade (stroke 8), lid-line eyes without sparkle, 1/4 head ratio, short arms, rounded tunic with
// rotating sleeves, rubber-hose limbs as tapered brush strokes, knees that bend toward the camera, arcs in all motion.
// NC.draw(ctx, c, t, x, y, k) draws character c with its feet at (x, y), k = pixels per rig unit (about 540 units tall).
(function () {
let g;
const h2 = h => [0, 2, 4].map(i => parseInt(h.slice(1).substr(i, 2), 16));
const mix = (a, b, t) => { const A = h2(a), B = h2(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const dk = (c, t) => mix(c, '#20182e', t), lt = (c, t) => mix(c, '#ffffff', t);
const STICK = '#221e1e', INKC = '#18161a';
const lin = (x0, y0, x1, y1, st) => { const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([t, c]) => gr.addColorStop(t, c)); return gr; };
const rad = (x, y, r, st) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); st.forEach(([t, c]) => gr.addColorStop(t, c)); return gr; };
const soft = (p, fn) => { g.save(); g.clip(p); fn(); g.restore(); };
function blob(x, y, rx, ry, col, b) { g.save(); g.filter = `blur(${b}px)`; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, 7); g.fill(); g.restore(); }
function stroke(pts, col, w) { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i += 2) g.quadraticCurveTo(...pts[i], ...pts[i + 1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
function sym(start, segs) { const p = new Path2D(); p.moveTo(...start); segs.forEach(s => p.bezierCurveTo(...s));
  const pts = [start, ...segs.map(s => [s[4], s[5]])];
  for (let i = segs.length - 1; i >= 0; i--) { const s = segs[i], st = pts[i]; p.bezierCurveTo(-s[2], s[3], -s[0], s[1], -st[0], st[1]); } p.closePath(); return p; }
const rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
const poly = pts => { const p = new Path2D(); pts.forEach((q, i) => p[i ? 'lineTo' : 'moveTo'](...q)); p.closePath(); return p; };
const fillSoft = (p, col, w = 40) => { g.fillStyle = lin(-w, 0, w, 0, [[0, lt(col, .16)], [.45, col], [1, dk(col, .24)]]); g.fill(p); };
const dot = (x, y, r, col) => { g.fillStyle = rad(x - r * .3, y - r * .3, r * 1.4, [[0, lt(col, .5)], [1, col]]); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
const star = (x, y, r) => { const p = new Path2D(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r * .45 : r; p[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } p.closePath(); g.fillStyle = rad(x - 2, y - 2, r * 1.5, [[0, '#fff3a0'], [1, '#e0a020']]); g.fill(p); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sst = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// ---- motion curves: monotone Hermite through the keys (no stop at in-between keys); hands splined round the shoulder ----
function herm(ts, vs, t, lins) {
  const n = ts.length; if (n === 1 || t <= ts[0]) return vs[0]; if (t >= ts[n - 1]) return vs[n - 1];
  let i = 1; while (t > ts[i]) i++;
  const t0 = ts[i - 1], t1 = ts[i], v0 = vs[i - 1], v1 = vs[i], h = t1 - t0, x = (t - t0) / h;
  if (lins && lins[i]) return v0 + (v1 - v0) * x;
  const m = k => { if (k <= 0 || k >= n - 1) return 0; const a = (vs[k] - vs[k - 1]) / (ts[k] - ts[k - 1]), b = (vs[k + 1] - vs[k]) / (ts[k + 1] - ts[k]); return a * b <= 0 ? 0 : 2 / (1 / a + 1 / b); };
  const m0 = m(i - 1), m1 = m(i), x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * v0 + (x3 - 2 * x2 + x) * h * m0 + (-2 * x3 + 3 * x2) * v1 + (x3 - x2) * h * m1;
}
const K = (keys, t) => herm(keys.map(k => k[0]), keys.map(k => k[1]), t, keys.map(k => k[2] === 'lin'));
function KH(keys, t, S) {
  const ts = keys.map(k => k[0]), ang = [], rs = [];
  keys.forEach((k, i) => { const p = k[1] === 'r' ? [S[0] + k[2], S[1] + k[3]] : [k[2], k[3]]; let a = Math.atan2(p[1] - S[1], p[0] - S[0]);
    if (i) { while (a - ang[i - 1] > Math.PI) a -= 2 * Math.PI; while (a - ang[i - 1] < -Math.PI) a += 2 * Math.PI; } ang.push(a); rs.push(Math.hypot(p[0] - S[0], p[1] - S[1])); });
  const a = herm(ts, ang, t), r = herm(ts, rs, t); return [S[0] + Math.cos(a) * r, S[1] + Math.sin(a) * r];
}
function ik(S, T, a, b, s) {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy); const dc = clamp(d, 1, a + b - .5);
  const ux = dx / (d || 1), uy = dy / (d || 1), end = [S[0] + ux * dc, S[1] + uy * dc];
  const ang = Math.acos(clamp((a * a + dc * dc - b * b) / (2 * a * dc), -1, 1));
  const cand = [1, -1].map(k => { const c = Math.cos(ang * k), sn = Math.sin(ang * k); return [S[0] + (ux * c - uy * sn) * a, S[1] + (ux * sn + uy * c) * a]; });
  return { mid: cand[0][0] * s > cand[1][0] * s ? cand[0] : cand[1], end };
}
// the same line as n evenly spaced points (so two outlines can be blended point by point)
function resample(pts, n) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const o = []; let j = 1; for (let k = 0; k < n; k++) { const d = L[L.length - 1] * k / (n - 1); while (j < pts.length - 1 && L[j] < d) j++; const u = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1); o.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u]); } return o; }
function spline(pts, n = 14) { const o = [];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
  o.push(pts[pts.length - 1]); return o; }
let NOLIMB = false;   // set while drawing the silhouette the outline is made from: stick limbs and hands stay out of it (stickman-thin)
function brushLine(pts, wf, col) { if (NOLIMB && col === STICK) return; const L = [], R = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wf(i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]); }
  g.fillStyle = col; g.beginPath(); [...L, ...R.reverse()].forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](...p)); g.closePath(); g.fill();
  for (const i of [0, pts.length - 1]) { g.beginPath(); g.arc(pts[i][0], pts[i][1], wf(i / (pts.length - 1)) / 2, 0, 7); g.fill(); } }
const taper = (w, s = .3, e = .3, min = .3) => t => { const k = Math.min(1, t / s, (1 - t) / e); return w * (min + (1 - min) * Math.sin(Math.max(0, k) * Math.PI / 2)); };
function softElbow(s, h, side) { const dx = h[0] - s[0], dy = h[1] - s[1], d = Math.hypot(dx, dy) || 1; let px = -dy / d, py = dx / d;
  if (px * side + py * .6 < 0) { px = -px; py = -py; } const bow = Math.min(20, d * .1); return [s[0] + dx / 2 + px * bow, s[1] + dy / 2 + py * bow]; }

// ---- hair and hats (head-local) ----
const HAIR = {
  short: (rx, ry) => { const p = new Path2D();
    p.moveTo(-rx - 3, -4); p.bezierCurveTo(-rx - 10, -40, -rx + 2, -ry - 14, -14, -ry - 20);
    p.bezierCurveTo(8, -ry - 27, 34, -ry - 26, 48, -ry - 12); p.bezierCurveTo(54, -ry - 10, 58, -ry - 8, 62, -ry - 9);
    p.bezierCurveTo(60, -ry + 4, 60, -40, rx + 3, -18); p.lineTo(rx + 1, -4);
    p.bezierCurveTo(rx - 4, -24, rx - 10, -36, 30, -40); p.bezierCurveTo(12, -44, -6, -36, -20, -50);
    p.bezierCurveTo(-26, -38, -40, -30, -rx + 4, -4); p.closePath();
    const t = new Path2D(); t.moveTo(10, -ry - 22); t.bezierCurveTo(22, -ry - 34, 36, -ry - 36, 44, -ry - 32); t.bezierCurveTo(38, -ry - 26, 30, -ry - 20, 22, -ry - 18); t.closePath();
    return { parts: [p, t], strands: [[[[-20, -50], [-4, -ry - 14], [40, -ry - 12]]], [[[-4, -42], [16, -ry - 8], [56, -ry - 6]]], [[[18, -42], [40, -56], [60, -ry - 6]]], [[[-30, -ry - 12], [0, -ry - 22], [30, -ry - 20]], 1]] }; },
  long: (rx, ry) => ({ back: sym([0, -82], [[40, -82, 60, -55, 60, -15], [60, 40, 58, 85, 52, 108], [36, 112, 18, 112, 0, 112]]),
    parts: [-1, 1].map(s => { const p = new Path2D();
      p.moveTo(0, -ry - 20); p.bezierCurveTo(s * 34, -ry - 22, s * 62, -55, s * 62, -10); p.bezierCurveTo(s * 60, 40, s * 58, 84, s * 52, 108);
      p.bezierCurveTo(s * 46, 111, s * 40, 110, s * 34, 106); p.bezierCurveTo(s * 37, 84, s * 42, 50, s * (rx - 3), 18);
      p.bezierCurveTo(s * (rx + 1), -14, s * (rx - 8), -42, s * 14, -56); p.bezierCurveTo(s * 8, -62, s * 3, -70, 0, -ry - 20); p.closePath(); return p; }),
    strands: [-1, 1].flatMap(s => [[[[s * 4, -ry - 16], [s * 50, -60], [s * 54, 100]]], [[[s * 10, -ry - 14], [s * 58, -40], [s * 56, 96]]], [[[s * 6, -ry - 18], [s * 44, -66], [s * 50, 30]], 1]]) }),
  buzz: (rx, ry) => { const p = new Path2D(); p.moveTo(-rx - 1, -6); p.bezierCurveTo(-rx - 4, -45, -rx * .6, -ry - 9, 0, -ry - 10); p.bezierCurveTo(rx * .6, -ry - 9, rx + 4, -45, rx + 1, -6);
    p.lineTo(rx - 3, -6); p.bezierCurveTo(rx - 5, -30, rx * .5, -ry * .62, 0, -ry * .64); p.bezierCurveTo(-rx * .5, -ry * .62, -rx + 5, -30, -rx + 3, -6); p.closePath(); return { parts: [p], strands: [] }; },
  bun: (rx, ry) => { const p = new Path2D(); p.moveTo(-rx - 2, -2); p.bezierCurveTo(-rx - 6, -45, -rx * .6, -ry - 10, 0, -ry - 11); p.bezierCurveTo(rx * .6, -ry - 10, rx + 6, -45, rx + 2, -2);
    p.lineTo(rx - 4, -2); p.bezierCurveTo(rx - 4, -30, rx * .45, -ry * .58, 2, -ry * .6); p.bezierCurveTo(-rx * .45, -ry * .58, -rx + 4, -30, -rx + 4, -2); p.closePath();
    const b = new Path2D(); b.ellipse(0, -ry - 16, 19, 16, 0, 0, 7);
    return { parts: [b, p], strands: [[[[0, -ry * .6], [-20, -ry - 4], [-rx + 4, -20]]], [[[0, -ry * .6], [20, -ry - 4], [rx - 4, -20]]], [[[-12, -ry - 18], [0, -ry - 30], [12, -ry - 18]], 1]] }; },
  bald: (rx, ry) => ({ parts: [-1, 1].map(s => { const p = new Path2D();
      p.moveTo(s * (rx + 2), 10); p.bezierCurveTo(s * (rx + 7), -12, s * (rx + 3), -36, s * (rx - 12), -46); p.bezierCurveTo(s * (rx - 12), -32, s * (rx - 5), -12, s * (rx - 4), 10); p.closePath(); return p; }), strands: [] }),
};
const helmet = col => (rx, ry) => { const d = new Path2D(); d.ellipse(0, -ry * .5, rx * 1.08, ry * .74, 0, Math.PI, 0); d.closePath();
  g.fillStyle = rad(-rx * .4, -ry, rx * 1.6, [[0, lt(col, .45)], [.5, col], [1, dk(col, .2)]]); g.fill(d);
  fillSoft(rr(-rx * 1.3, -ry * .54, rx * 2.6, 9, 4), col, rx); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-4, -ry * 1.22, 8, ry * .66); };
const HAT = {
  hardhat: helmet('#ffc400'), whitehat: helmet('#f4f4f8'), kettle: helmet('#a9b2bc'),   // kettle: a guard's iron helmet
  // the police cap: the crown and band are round (the same from every side); the visor and badge are pinned to the front
  // of the head and turn with it - the visor sticks out forward side-on and goes behind the head facing away
  police: (rx, ry, psi = 0, layer) => { const cp = Math.cos(psi);
    const visor = () => { const O = [], I = []; for (let i = 0; i <= 24; i++) { const a = -1.1 + 2.2 * i / 24 + psi; O.push([rx * 1.3 * Math.sin(a), -ry * .5 + 10 * Math.cos(a)]); I.push([rx * .98 * Math.sin(a), -ry * .53]); }
      const v = new Path2D(); O.forEach((p, i) => v[i ? 'lineTo' : 'moveTo'](...p)); I.reverse().forEach(p => v.lineTo(...p)); v.closePath(); g.fillStyle = lin(0, -ry * .55, 0, -ry * .3, [[0, '#1a2034'], [1, '#080a14']]); g.fill(v); };
    if (layer === 'behind') return;                            // (facing away the visor is hidden by the head)
    const cr = new Path2D(); cr.moveTo(-rx * .98, -ry * .52); cr.lineTo(-rx * 1.2, -ry - 16); cr.quadraticCurveTo(0, -ry - 30, rx * 1.2, -ry - 16); cr.lineTo(rx * .98, -ry * .52); cr.closePath();
    fillSoft(cr, '#2348b8', rx); fillSoft(rr(-rx, -ry * .74, rx * 2, ry * .22, 3), '#141c3c', rx);
    const va = clamp((cp + .35) / .25, 0, 1); if (va > 0) { g.save(); g.globalAlpha = va; visor(); g.restore(); }   // fades as it goes round the back
    const k = Math.cos(psi); if (k > -.1) { g.save(); g.globalAlpha = clamp((k + .1) / .3, 0, 1); g.translate(rx * 1.02 * Math.sin(psi), 0); g.scale(Math.max(.3, k), 1);
      g.fillStyle = rad(-2, -ry - 6, 8, [[0, '#fff2a0'], [1, '#e0a020']]); g.beginPath(); g.ellipse(0, -ry - 3, 6, 7, 0, 0, 7); g.fill(); g.restore(); } },
  // the straw hat: a domed crown with a dent on top, woven straw, a red ribbon with a bow (pinned to his left side, it
  // turns with the head), a wide brim with a darker underside and a frayed edge, and the brim's shadow on the forehead
  straw: (rx, ry, psi = 0) => { const by = -ry * .6, bw = rx * 1.9, bh = ry * .2;
    const weave = (p, step) => soft(p, () => { g.strokeStyle = 'rgba(140,90,20,.22)'; g.lineWidth = 1.2; for (let x = -bw; x < bw; x += step) { g.beginPath(); g.moveTo(x, -ry * 2); g.lineTo(x + ry * 1.2, 0); g.stroke(); g.beginPath(); g.moveTo(x, -ry * 2); g.lineTo(x - ry * 1.2, 0); g.stroke(); } });
    blob(0, -ry * .42, rx * .95, ry * .14, 'rgba(90,50,10,.28)', 6);                  // the brim's shadow across the forehead
    const under = new Path2D(); under.ellipse(0, by + 4, bw, bh, 0, 0, 7); g.fillStyle = lin(0, by - bh, 0, by + bh + 4, [[0, '#c8902e'], [1, '#8a5a1a']]); g.fill(under);
    const top = new Path2D(); top.ellipse(0, by, bw, bh, 0, 0, 7); g.fillStyle = lin(-bw, 0, bw, 0, [[0, '#ffeaa8'], [.5, '#f2cd6a'], [1, '#c8963a']]); g.fill(top); weave(top, 7);
    g.strokeStyle = 'rgba(150,100,30,.55)'; g.lineWidth = 1.3; for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2, ex = Math.cos(a) * bw, ey = by + 2 + Math.sin(a) * bh;      // frayed edge
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex * 1.03 + Math.sin(i * 7) * 1.5, ey + Math.sin(a) * 2 + 1.5); g.stroke(); }
    const cr = new Path2D(); cr.moveTo(-rx * .8, by + 1); cr.bezierCurveTo(-rx * .9, -ry * 1.18, -rx * .62, -ry * 1.46, -rx * .22, -ry * 1.42); cr.quadraticCurveTo(0, -ry * 1.34, rx * .22, -ry * 1.42);
    cr.bezierCurveTo(rx * .62, -ry * 1.46, rx * .9, -ry * 1.18, rx * .8, by + 1); cr.quadraticCurveTo(0, by + 7, -rx * .8, by + 1); cr.closePath();
    g.fillStyle = lin(-rx, 0, rx, 0, [[0, '#ffeeb4'], [.45, '#f4d270'], [1, '#c4903a']]); g.fill(cr); weave(cr, 6);
    soft(cr, () => { blob(-rx * .35, -ry * 1.25, rx * .25, ry * .12, 'rgba(255,255,230,.5)', 5); g.fillStyle = 'rgba(130,80,20,.3)'; g.beginPath(); g.ellipse(0, -ry * 1.38, rx * .2, ry * .05, 0, 0, 7); g.fill();   // gloss, the dent
      g.fillStyle = lin(0, by - 12, 0, by + 4, [[0, '#ff4a40'], [1, '#c01c22']]); g.fillRect(-rx, by - 13, rx * 2, 15); });                                           // the ribbon
    const k = Math.cos(1.25 + psi), bx = rx * .82 * Math.sin(1.25 + psi);                 // the bow, pinned to the side of the crown
    if (k > -.15) { g.save(); g.globalAlpha = clamp((k + .15) / .3, 0, 1); g.translate(bx, by - 6); g.scale(Math.max(.4, k) * 1.5, 1.5); g.fillStyle = '#d82a2a';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 12, -10, s * 13, 2); g.quadraticCurveTo(s * 8, 5, 0, 0); g.fill(); g.beginPath(); g.moveTo(s * 2, 2); g.lineTo(s * 7, 16); g.lineTo(s * 3, 15); g.closePath(); g.fill(); }
      dot(0, 0, 3.5, '#ff5a50'); g.restore(); } },
  chef: (rx, ry) => { const p = new Path2D(); for (const [x, y, r] of [[-24, -ry - 24, 22], [0, -ry - 36, 26], [24, -ry - 24, 22]]) { p.moveTo(x + r, y); p.arc(x, y, r, 0, 7); }
    p.rect(-rx * .9, -ry - 24, rx * 1.8, 24); g.fillStyle = rad(-14, -ry - 44, 70, [[0, '#ffffff'], [.6, '#f2f2f6'], [1, '#c9cad8']]); g.fill(p);
    fillSoft(rr(-rx * .92, -ry * .78 - 8, rx * 1.84, 20, 4), '#f6f6fa', rx); },
};

// ---- outfits in layers, painted onto the one garment (body frame: x -W..W, y sh at the neck .. hm at the hem) ----
// o = { pat: 'plaid' | 'stripe' | 'mail' (the shirt, sleeves too), kind: 'vest' | 'coat' | 'tabard' | 'bodice' (over it),
//   col: its colour, inner: what shows in a coat's opening, buttons, pockets, trim (piping), collar, tie: 'kerchief' |
//   'bow' | 'cravat', tieCol, belt, chain, suspenders, apron, cross }. The sleeves stay the shirt (c.top) - or the coat,
//   when c.top is the coat's colour - so the layers read as clothes worn, never pieces stuck on
function drawOutfit(o, W, sh, hm, back) {
  const H = hm - sh, X = W + 90, sd = (p, col) => { g.fillStyle = col; g.fill(p); };
  const pat = (kind, col, a) => { g.save(); g.globalAlpha = a;
    if (kind === 'plaid') { g.fillStyle = col; for (let x = -X; x < X; x += 26) g.fillRect(x, sh - 40, 10, H + 80); for (let y = sh - 40; y < hm + 40; y += 26) g.fillRect(-X, y, 2 * X, 10);
      g.globalAlpha = a * .8; g.fillStyle = 'rgba(255,255,255,.7)'; for (let x = -X + 18; x < X; x += 26) g.fillRect(x, sh - 40, 2, H + 80); for (let y = sh - 22; y < hm + 40; y += 26) g.fillRect(-X, y, 2 * X, 2); }
    else if (kind === 'stripe') { g.fillStyle = col; for (let x = -X; x < X; x += 18) g.fillRect(x, sh - 40, 8, H + 80); }
    else if (kind === 'mail') { g.strokeStyle = col; g.lineWidth = 2; for (let y = sh - 20, r = 0; y < hm + 30; y += 7, r++) for (let x = -X + (r % 2) * 5; x < X; x += 10) { g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI); g.stroke(); } }
    g.restore(); };
  if (o.pat) pat(o.pat, o.patCol || 'rgba(30,20,40,.35)', o.patA ?? 1);
  // a vest / bodice: two front panels with a V between them and arm-holes cut in at the shoulders
  const panel = (vDepth, vTop, low = 0) => { const p = new Path2D(); p.moveTo(-W * vTop, sh - 4 + low); p.bezierCurveTo(-W * .5, sh - 2 + low, -W * .62, sh + 16, -W + 3, sh + 42);
    p.lineTo(-W - 6, hm + 6); p.lineTo(W + 6, hm + 6); p.lineTo(W - 3, sh + 42); p.bezierCurveTo(W * .62, sh + 16, W * .5, sh - 2 + low, W * vTop, sh - 4 + low);
    p.lineTo(0, sh + H * vDepth); p.closePath(); return p; };
  const vee = (depth, top) => { const p = new Path2D(); p.moveTo(-W * top, sh - 6); p.lineTo(W * top, sh - 6); p.lineTo(0, sh + H * depth); p.closePath(); return p; };
  const buttons = (x, y0, y1, n, col) => { for (let i = 0; i < n; i++) dot(x, y0 + (y1 - y0) * i / Math.max(1, n - 1), 3.4, col); };
  const pocket = (x, y, w, col, flap) => { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - w / 2, y, w, w * .75); g.strokeStyle = 'rgba(255,240,200,.45)'; g.lineWidth = 1.4; g.setLineDash([3, 3]); g.strokeRect(x - w / 2 + 2, y + 2, w - 4, w * .75 - 4); g.setLineDash([]);
    if (flap) { g.fillStyle = flap; g.beginPath(); g.moveTo(x - w / 2 - 1, y - 1); g.lineTo(x + w / 2 + 1, y - 1); g.lineTo(x + w / 2, y + 7); g.lineTo(x, y + 11); g.lineTo(x - w / 2, y + 7); g.closePath(); g.fill(); } };
  const trim = (p, col, w = 3) => { g.save(); g.clip(p); g.strokeStyle = col; g.lineWidth = w * 2; g.stroke(p); g.restore(); };
  if (back) {                                                                // from behind: the layer's back panel and the belt
    if (o.kind === 'vest' || o.kind === 'bodice') { const p = panel(-.1, .3); sd(p, o.col); if (o.trim) trim(p, o.trim); }
    if (o.kind === 'tabard') { const p = new Path2D(); p.rect(-W * .62, sh + 4, W * 1.24, H + 4); sd(p, o.col); if (o.trim) trim(p, o.trim, 4); }
    if (o.belt) { g.fillStyle = o.belt; g.fillRect(-X, hm - 40, 2 * X, 10); }
    if (o.suspenders && !o.kind) { g.fillStyle = o.suspenders; for (const s of [-1, 1]) g.fill(poly([[s * W * .5 - 4, sh], [s * W * .5 + 4, sh], [s * 5 + 4, sh + H * .55], [s * 5 - 4, sh + H * .55]])); }
    return;
  }
  // a coat: c.top is the coat; its open front shows what's under it (inner), with lapels and trim down the edges
  if (o.kind === 'coat') { const v = vee(.62, .3); sd(v, o.inner || '#f2ead8');
    if (o.innerButtons) buttons(0, sh + 30, sh + H * .58, 4, o.innerButtons);
    for (const s of [-1, 1]) { const l = new Path2D(); l.moveTo(s * W * .3, sh - 6); l.lineTo(s * W * .52, sh + 8); l.lineTo(s * W * .2, sh + H * .5); l.lineTo(s * 3, sh + H * .62); l.closePath(); sd(l, o.lapel || dk(o.col, .2)); }
    if (o.trim) { g.strokeStyle = o.trim; g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * W * .3, sh - 6); g.lineTo(s * 2, sh + H * .62); g.lineTo(s * W * .12, hm + 4); g.stroke(); } }
    if (o.chain) { g.strokeStyle = '#ffd84a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, sh + H * .42); g.quadraticCurveTo(-W * .1, sh + H * .52, -W * .18, sh + H * .44); g.stroke(); dot(-W * .18, sh + H * .44, 4, '#ffd84a'); }
    if (o.buttons) for (const s of [-1, 1]) buttons(s * W * .3, sh + H * .66, hm - 18, 2, o.buttons);
    if (o.pockets) for (const s of [-1, 1]) pocket(s * W * .52, hm - 50, 22, o.col, dk(o.col, .18)); }
  // a vest over the shirt: the shirt shows in the V and on the sleeves
  if (o.kind === 'vest') { const p = panel(.5, .26); sd(p, o.col);
    soft(p, () => { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-1.5, sh, 3, H + 10); if (o.stitch) { g.strokeStyle = o.stitch; g.lineWidth = 1.4; g.setLineDash([4, 3]); g.stroke(p); g.setLineDash([]); } });
    if (o.trim) trim(p, o.trim);
    if (o.pockets) for (const s of [-1, 1]) pocket(s * W * .45, sh + H * .58, 20, o.col, dk(o.col, .2));
    if (o.buttons) buttons(-5, sh + H * .54, hm - 14, 3, o.buttons);
    if (o.chain) { g.strokeStyle = '#ffd84a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-5, sh + H * .62); g.quadraticCurveTo(W * .2, sh + H * .74, W * .42, sh + H * .6); g.stroke(); dot(W * .42, sh + H * .6, 3.6, '#ffd84a'); } }
  // a laced bodice with an apron below
  if (o.kind === 'bodice') { const p = panel(.3, .34, 10); sd(p, o.col); if (o.trim) trim(p, o.trim);
    g.strokeStyle = o.lace || '#f4ead8'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const y = sh + H * .32 + i * 13; g.beginPath(); g.moveTo(-8, y); g.lineTo(8, y + 13); g.moveTo(8, y); g.lineTo(-8, y + 13); g.stroke(); } }
  if (o.apron) { const p = new Path2D(); p.moveTo(-W * .6, sh + H * .62); p.lineTo(W * .6, sh + H * .62); p.lineTo(W * .66, hm + 6); p.lineTo(-W * .66, hm + 6); p.closePath(); sd(p, o.apron);
    g.fillStyle = 'rgba(0,0,0,.1)'; for (const x of [-W * .25, W * .2]) g.fillRect(x, sh + H * .66, 2, H * .4); }
  // a guard's tabard: a front panel to the hem with a cross, trimmed
  if (o.kind === 'tabard') { const p = new Path2D(); p.moveTo(-W * .55, sh + 2); p.lineTo(W * .55, sh + 2); p.lineTo(W * .62, hm + 6); p.lineTo(-W * .62, hm + 6); p.closePath(); sd(p, o.col);
    if (o.cross) { g.fillStyle = o.cross; g.fillRect(-6, sh + 14, 12, H - 22); g.fillRect(-W * .44, sh + H * .32, W * .88, 12); }
    if (o.trim) trim(p, o.trim, 4); }
  // braces over a shirt (no vest)
  if (o.suspenders && !o.kind) { g.fillStyle = o.suspenders; for (const s of [-1, 1]) { g.fill(poly([[s * W * .5 - 4, sh], [s * W * .5 + 4, sh], [s * W * .3 + 4, hm], [s * W * .3 - 4, hm]])); dot(s * W * .3, hm - 42, 3, '#d8d0b8'); } }
  if (o.belt) { g.fillStyle = o.belt; g.fillRect(-X, hm - 40, 2 * X, 10); g.fillStyle = o.buckle || '#d8b040'; g.fillRect(-7, hm - 42, 14, 14); g.fillStyle = o.belt; g.fillRect(-4, hm - 39, 8, 8); }
  // at the neck: a collar's two points, then the tie
  if (o.collar) for (const s of [-1, 1]) sd(poly([[s * 4, sh - 4], [s * 18, sh - 6], [s * 14, sh + 14]]), o.collar);
  const tc = o.tieCol || '#d8382e';
  if (o.tie === 'kerchief') { sd(poly([[-20, sh - 2], [20, sh - 2], [0, sh + 30]]), tc); g.fillStyle = 'rgba(255,255,255,.8)'; for (const [x, y] of [[-8, sh + 4], [7, sh + 6], [0, sh + 16]]) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); } g.fillStyle = tc; g.beginPath(); g.arc(0, sh, 6, 0, 7); g.fill(); }
  if (o.tie === 'bow') { g.fillStyle = tc; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, sh + 4); g.lineTo(s * 14, sh - 3); g.lineTo(s * 14, sh + 11); g.closePath(); g.fill(); } dot(0, sh + 4, 3.5, dk(tc, .2)); }
  if (o.tie === 'cravat') { g.fillStyle = tc; g.beginPath(); g.moveTo(-12, sh - 2); g.quadraticCurveTo(0, sh + 8, 12, sh - 2); g.lineTo(7, sh + 26); g.quadraticCurveTo(0, sh + 34, -7, sh + 26); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-4, sh + 8); g.lineTo(-2, sh + 26); g.moveTo(4, sh + 8); g.lineTo(2, sh + 26); g.stroke(); }
}
// ---- face edge: the chosen soft inner shade (stroke 8) ----
const SHADOW = .75, shadowK = a => (1 + Math.cos(a - SHADOW)) / 2;
function facePts(rx, ry, j) {
  const segs = [[[0, -ry], [rx * .56, -ry], [rx, -ry * .56], [rx, -ry * .04]], [[rx, -ry * .04], [rx, ry * .38], [rx * (.84 + j * .1), ry * .72], [rx * (.42 + j * .12), ry * .93]],
    [[rx * (.42 + j * .12), ry * .93], [rx * .24, ry], [rx * .1, ry], [0, ry]]];
  const cub = (s, t) => [0, 1].map(k => (1 - t) ** 3 * s[0][k] + 3 * (1 - t) ** 2 * t * s[1][k] + 3 * (1 - t) * t * t * s[2][k] + t ** 3 * s[3][k]);
  const right = segs.flatMap(s => Array.from({ length: 24 }, (_, i) => cub(s, i / 24)));
  return [...right, ...right.slice().reverse().map(([x, y]) => [-x, y])];
}
function band(rx, ry, j, wfn) {
  const P = facePts(rx, ry, j), n = P.length;
  const nrm = P.map((q, i) => { const a = P[(i - 1 + n) % n], b = P[(i + 1) % n]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if (nx * q[0] + ny * q[1] < 0) { nx = -nx; ny = -ny; } return [nx, ny]; });
  g.beginPath(); P.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.closePath();
  P.map((p, i) => { const k = wfn(Math.atan2(nrm[i][1], nrm[i][0])); return [p[0] - nrm[i][0] * k, p[1] - nrm[i][1] * k]; }).reverse().forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.closePath();
  g.fill('evenodd');
}
function faceShade(rx, ry, j, f) { const D = rx * 2;
  g.save(); g.clip(f); g.filter = 'blur(5px)'; g.fillStyle = 'rgba(80,56,110,.45)'; band(rx, ry, j, a => D * (.02 + .12 * Math.pow(shadowK(a), 1.6))); g.restore();
  g.fillStyle = 'rgba(40,28,60,.5)'; band(rx, ry, j, a => D * .012 * Math.pow(shadowK(a), 2)); }

// ---- the figure ----
function drawChar(c, P, t) {
  const sh = c.sh, hm = c.hem, W = c.bodyW, Wh = W - 4, rx = c.rx, ry = c.ry, sx = .86, sy = .84;
  // the police walk (walk = how much, ph = step phase, PI per step; sd = side-on, sign = the way they go on screen):
  // scissor legs from one hip point, the hip dipping as the legs spread; seen side-on the body narrows into a soft sack
  // (the back rounds out low, the top leans in), the arms hang relaxed, the far one behind the body, the head sits forward
  // independent turns (all optional, default = one facing for all): the hips and legs face P.yaw / P.sd, the chest
  // P.cyaw / P.csd, the head P.hyaw / P.hsd - so the eyes, head, chest and hips can each lead or follow in a turn
  const sdP = P.sd, sideP = Math.abs(sdP), dirP = Math.sign(sdP) || 1, CY = P.cyaw ?? P.yaw;
  const sd = P.csd ?? P.sd, side = Math.abs(sd), dir = Math.sign(sd) || 1, wk = P.walk, ph0 = P.ph, SA = .3, Lg0 = -4 - hm;
  const drop = wk * Lg0 * (1 - Math.cos(SA * Math.abs(Math.sin(ph0)))), bw = 1 - .38 * side;
  // wsh: the hips shift over the standing foot (the feet stay); chestTilt: the chest bends further than the hips lean,
  // more toward the shoulders (a flexible torso: a counter-tilt over a dropped hip, a curve forward or back)
  const H = [P.x + (P.wsh || 0), hm + P.hipY + drop], CT = P.chestTilt || 0;
  const TX = (px, py) => { const u = clamp((py - sh) / (hm - sh), 0, 1); let lx = px * bw;
    if (side) lx += side * (NCX.TURN2 ? .45 + .55 * wk : 1) * ((px * dir < 0 ? -dir * 12 * Math.sin(Math.PI * u * .62) ** 2 * Math.min(1, Math.abs(px) / 20) : -dir * 4 * Math.sin(Math.PI * u)) + dir * 8 * (1 - u) ** 1.5);
    const ly = (py - hm) * P.sq, a = P.lean + CT * (1 - u) ** 1.5, cs = Math.cos(a), sn = Math.sin(a); return [H[0] + cs * lx - sn * ly, H[1] + sn * lx + cs * ly]; };
  const HP = P.hsd != null ? { ...P, yaw: P.hyaw, sd: P.hsd } : P;   // what the head is drawn with
  const hair = HAIR[c.hair](rx, ry), hk = c.headK || .25 * -(sh - 8) / (.75 * 2 * ry * sy); // head = 1/4 of the height
  if (c.behind) c.behind(t);
  // long hair hangs behind the shoulders: drawn before the body, so the neck and shirt sit in front of it (from behind,
  // drawHeadYaw lays it over the back as well)
  if (NCX.ROT && (HSTYLE[c.hair] || {}).long) { const nk = TX(0, sh - 8), fw = side * wk; g.save(); g.translate(nk[0] + dir * fw * 5, nk[1] + fw * 3); g.rotate(P.lean * .6 + P.tilt + dir * fw * .04);
    g.translate(0, -ry * sy * hk + P.nod); g.scale(sx * hk, sy * hk); longHair(c, HP); g.restore(); }
  if (hair.back && !NCX.ROT) { const nk = TX(0, sh - 8); g.save(); g.translate(nk[0], nk[1]); g.rotate(P.lean * .6 + P.tilt); g.translate(0, -ry * sy * hk + P.nod); g.scale(sx * hk, sy * hk);
    g.fillStyle = lin(-60, 0, 60, 0, [[0, lt(c.hairCol, .05)], [1, dk(c.hairCol, .3)]]); g.fill(hair.back); g.restore(); }
  const legL = (-hm - 9) / 2;
  // planted feet (P.feetAbs, optional): the scene gives each foot's place as [x, y, tilt] in rig units from the card's foot
  // point (y up = lifted), screen-left hip first - so a standing foot stays put on the floor while the body travels;
  // hipTilt drops the hip over the free leg
  const legOrder = P.feetAbs && P.feetAbs[2] ? [1, -1] : [-1, 1];    // the nearer leg last
  for (const s of legOrder) {
    const FA = P.feetAbs && P.feetAbs[s < 0 ? 0 : 1];
    let hip = [H[0] + s * 14 * (1 - .7 * sideP), H[1] - 5 + s * (P.hipTilt || 0) * 14], foot = FA ? [FA[0], -9 - FA[1]] : [P.x + s * P.feet * (1 - .6 * sideP) + (s > 0 ? P.footR : 0), -9 - (s > 0 ? P.lift : 0)];
    let { mid: knee } = ik(hip, foot, legL, legL, FA && sideP > .4 ? dirP : s);   // planted feet seen side-on: knees bend the way he faces
    const lm = [(hip[0] + foot[0]) / 2, (hip[1] + foot[1]) / 2], kf = FA ? .65 : .3; knee = [lm[0] + (knee[0] - lm[0]) * kf, lm[1] + (knee[1] - lm[1]) * kf];
    if (P.sit > 0) { const kk = [hip[0] + s * 9, hip[1] + 14]; knee = [knee[0] + (kk[0] - knee[0]) * P.sit, knee[1] + (kk[1] - knee[1]) * P.sit]; }
    let tilt = FA ? FA[2] || 0 : 0, toe = s * 5 + (dirP * 6 - s * 5) * sideP;   // side-on, both shoes point the way he faces
    if (wk > 0) {   // the stride: nearly straight legs, the knee bending only on the swing, heel strike, toe-off
      const ph = ph0 + (s > 0 ? 0 : Math.PI), fw = Math.sin(ph), swing = Math.max(0, Math.cos(ph)), a = SA * fw;
      // side-on the feet travel across the screen; walking at the camera they stay under the hips, the swinging foot
      // lifts with the knee coming up at us, and the leading foot lands a touch lower (nearer)
      const fr = 1 - sideP, wh = [H[0] + dirP * 3 * clamp(fw / .35, -1, 1) * sideP + fr * s * 10, H[1] - 5];
      const wf = [wh[0] + dirP * Math.sin(a) * Lg0 * sideP, Math.min(-9, wh[1] + Math.cos(a) * Lg0) - 22 * swing * swing + fr * fw * 5];
      const bend = .06 + .3 * swing, wkn = [(wh[0] + wf[0]) / 2 + dirP * bend * Lg0 * .5 * sideP + fr * s * bend * 10, (wh[1] + wf[1]) / 2 - bend * 13 - fr * bend * 12];
      const L2 = (p, q) => [p[0] + (q[0] - p[0]) * wk, p[1] + (q[1] - p[1]) * wk];
      hip = L2(hip, wh); knee = L2(knee, wkn); foot = L2(foot, wf);
      tilt = wk * dirP * (fw > .55 && swing < .5 ? -.25 : fw < -.6 ? .45 * (-fw - .6) / .4 : 0);
    }
    brushLine(spline([hip, knee, foot]), taper(7, .05, .1, .85), STICK);
    g.save(); g.translate(foot[0], foot[1]); g.rotate(tilt); g.translate(-foot[0], -foot[1]);
    const e = new Path2D(); e.ellipse(foot[0] + toe, foot[1] + 4, 15, 6.5, s * .08 * (1 - sideP * wk), 0, 7); g.fillStyle = lin(0, -12, 0, 2, [[0, lt(c.shoe, .25)], [1, dk(c.shoe, .3)]]); g.fill(e); g.restore();
  }
  // arms first (geometry only), so the sleeves can go BEHIND the body: the body's own round shoulder covers the join
  // turning, the shoulders slide in toward the middle (side-on both sit mid-body): the arm on the side he turns away from
  // comes toward us and stays in front, the other goes behind. Nearly side-on (SEP) the near sleeve lies over the torso
  // TURN2 (smooth turn): nothing switches in one frame - the far arm fades behind the body, the side-on sleeve fades in,
  // the elbows ease round to bend backward, the hands meet the middle as he reaches profile
  const T2 = NCX.TURN2, fS = Math.sqrt(Math.max(0, 1 - side * side)), wS = T2 ? sst(.78, .96, side) : side > .87 ? 1 : 0, SEP = wS >= 1;
  const ARMS = [[0, -1], [1, 1]].map(([i, s]) => {
    const S = TX(s * (W - 6) * fS, sh + 20); let T = KH(c.hands[i], t - .06, S), TL = KH(c.hands[i], t, S);
    if (T2) { const k = 1 - .9 * sst(.82, 1, side); T = [S[0] + (T[0] - S[0]) * k, T[1]]; TL = [S[0] + (TL[0] - S[0]) * k, TL[1]]; }
    const aw = P.awalk ?? wk, aph = P.aph ?? ph0;   // the arms' swing can be driven apart from the legs (planted-foot steps)
    if (aw > 0) {   // walking: relaxed hanging arms, a small swing against the opposite leg
      const ap = Math.sin(aph + (s > 0 ? Math.PI : 0)), sw = ap * 12 * dir * side;   // facing us, the forward swing lifts the hand instead
      const hw = [S[0] + (s === dir ? dir * 4 : -dir * 2) * side + sw - (1 - side) * s * 3, S[1] + 148 - (1 - side) * (ap + 1) * 7];
      T = [T[0] + (hw[0] - T[0]) * aw, T[1] + (hw[1] - T[1]) * aw]; TL = [TL[0] + (hw[0] - TL[0]) * aw, TL[1] + (hw[1] - TL[1]) * aw];
    }
    const elbow = es => { const { mid: ikEl, end } = ik(S, T, c.arm, c.arm, es), rub = softElbow(S, TL, es); return { e: [rub[0] + (ikEl[0] - rub[0]) * .3, rub[1] + (ikEl[1] - rub[1]) * .3], end }; };
    const E1 = elbow(s), hd = E1.end; let el = E1.e;
    if (T2 && side > .45) { const e2 = elbow(-dir).e, k = sst(.45, .95, side); el = [el[0] + (e2[0] - el[0]) * k, el[1] + (e2[1] - el[1]) * k]; }
    const line = spline([S, el, hd]);
    const u = [line[5][0] - S[0], line[5][1] - S[1]], ul = Math.hypot(...u) || 1, uu = [u[0] / ul, u[1] / ul], nn = [-uu[1], uu[0]];
    const isFar = s === (CY > 1 ? -dir : dir), fw = !isFar ? 0 : T2 ? sst(.12, .6, side) : side > .5 ? 1 : 0;   // seen from behind the other arm is near
    return { s, S, hd, line, uu, nn, far: fw >= 1, fw };
  });
  // ONE GARMENT: the shirt is a single outline - body, round shoulders and sleeves together - filled and shaded as one
  // piece (all parts wound the same way so the union has no holes). Only a long sleeve's forearm is drawn on top.
  const GRAD = lin(P.x - W - 14, 0, P.x + W + 14, 0, [[0, lt(c.top, .16)], [.45, c.top], [1, dk(c.top, .24)]]);
  const M = new DOMMatrix().translate(H[0], H[1]).rotate(P.lean * 180 / Math.PI).scale(1, P.sq).translate(0, -hm);
  const body = sym([0, sh], [[12, sh, W - 10, sh + 1, W - 2, sh + 8], [W + 4, sh + 14, W + 2, sh + 40, W - 1, sh + 60], [W - 2, sh + 90, Wh, hm - 30, Wh, hm - 9], [Wh, hm, Wh - 6, hm + 1, Wh - 14, hm + 1], [10, hm + 1, 4, hm + 1, 0, hm + 1]]);
  // the shirt's outline traced as ONE smooth line: neck, shoulder slope, along the sleeve top, round the sleeve end,
  // into the armpit, down the side, the hem - then back up the other side (no circles, no separate pieces)
  const nz = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  for (const a of ARMS) {
    const { s, S, line, uu, nn } = a, o = [nn[0] * -s, nn[1] * -s], ii = [-o[0], -o[1]];
    let E, U = uu, w0 = 16, w1 = 13;
    if (c.longSleeve) { a.slv = line.slice(0, Math.round(line.length * .86)); const k = Math.round(a.slv.length * .5); E = a.slv[k]; U = nz([E[0] - a.slv[k - 1][0], E[1] - a.slv[k - 1][1]]); w0 = 10; w1 = 8; }
    else { E = [S[0] + uu[0] * 34, S[1] + uu[1] * 34]; a.E = E; }
    let oE = [-U[1], U[0]]; if (oE[0] * o[0] + oE[1] * o[1] < 0) oE = [-oE[0], -oE[1]]; const iE = [-oE[0], -oE[1]];
    const sepSide = () => spline([TX(s * 12, sh), TX(s * (W - 8), sh + 4), TX(s * W, sh + 26), TX(s * (W - 1), sh + 62), TX(s * (W - 2), sh + 100), TX(s * Wh, hm - 22), TX(s * (Wh - 5), hm + 1), TX(0, hm + 1)], 8);
    a.side = SEP ? sepSide() : spline([TX(s * 12, sh), TX(s * (W - 8), sh + 4), [S[0] + o[0] * w0 - uu[0] * 5, S[1] + o[1] * w0 - uu[1] * 5], [E[0] + oE[0] * w1, E[1] + oE[1] * w1], [E[0] + U[0] * 4, E[1] + U[1] * 4],
      [E[0] + iE[0] * w1, E[1] + iE[1] * w1], [S[0] + ii[0] * (w0 - 5) + uu[0] * 18, S[1] + ii[1] * (w0 - 5) + uu[1] * 18], TX(s * (W - 1), sh + 62), TX(s * (W - 2), sh + 100), TX(s * Wh, hm - 22), TX(s * (Wh - 5), hm + 1), TX(0, hm + 1)], 8);
    if (wS > 0 && !SEP) { const A0 = resample(a.side, 48), A1 = resample(sepSide(), 48); a.side = A0.map((p, k) => [p[0] + (A1[k][0] - p[0]) * wS, p[1] + (A1[k][1] - p[1]) * wS]); }   // the sleeve melts into the body's side
    // the sleeve's own area, used to keep the arm inside it
    if (c.longSleeve) { const L = [], R = []; a.slv.forEach((p, k) => { const b = a.slv[Math.min(a.slv.length - 1, k + 1)], f0 = a.slv[Math.max(0, k - 1)], d = nz([b[0] - f0[0], b[1] - f0[1]]); L.push([p[0] - d[1] * 8.5, p[1] + d[0] * 8.5]); R.push([p[0] + d[1] * 8.5, p[1] - d[0] * 8.5]); }); a.cut = [...L, ...R.reverse()]; }
    else a.cut = [[S[0] + o[0] * w0 - uu[0] * 14, S[1] + o[1] * w0 - uu[1] * 14], [E[0] + oE[0] * w1, E[1] + oE[1] * w1], [E[0] + U[0] * 5, E[1] + U[1] * 5], [E[0] + iE[0] * w1, E[1] + iE[1] * w1], [S[0] + ii[0] * w0 - uu[0] * 14, S[1] + ii[1] * w0 - uu[1] * 14]];
  }
  const garment = new Path2D(), Rs = ARMS[1].side, Ls = ARMS[0].side.slice().reverse();
  garment.moveTo(...Rs[0]); Rs.slice(1).forEach(p => garment.lineTo(...p)); Ls.forEach(p => garment.lineTo(...p)); garment.closePath();
  // a separate sleeve (side-on only): a soft tube over the arm's top, the near one later in front of the body
  const sleeve = (a, col) => { if (c.longSleeve) { brushLine(a.slv, taper(15, .1, .12, .88), col); return; }
    const p = new Path2D(), q = spline([...a.cut, a.cut[0]], 6); q.forEach((v, k) => p[k ? 'lineTo' : 'moveTo'](...v)); p.closePath(); g.fillStyle = col; g.fill(p);
    soft(p, () => { blob(a.E[0], a.E[1], 10, 7, dk(c.top, .4) + 'aa', 3); blob(a.S[0] - dir * 10, a.S[1] + 14, 7, 20, dk(c.top, .3) + '88', 5); });
    g.save(); g.clip(p, 'evenodd'); g.strokeStyle = dk(c.top, .45); g.lineWidth = 3; g.globalAlpha = .7; g.stroke(p); g.restore(); };   // a soft fold line so it reads as a sleeve
  for (const a of ARMS) if (a.fw > 0) {                       // turned: the far arm hangs behind the body
    brushLine(a.line.slice(4), taper(6, .05, .1, .82), STICK);
    if (!NOLIMB && NCX.HANDS) { g.fillStyle = rad(a.hd[0] - 2.5, a.hd[1] - 2.5, 9, [[0, '#5a5456'], [.5, '#252021'], [1, '#141112']]); g.beginPath(); g.arc(a.hd[0], a.hd[1], 7.5, 0, 7); g.fill(); }
    if (wS > 0) { g.save(); g.globalAlpha = wS; sleeve(a, dk(c.top, .25)); g.restore(); } }
  g.fillStyle = GRAD; g.fill(garment);
  const mid = (sh + hm) / 2, half = (hm - sh) / 2;
  soft(garment, () => { g.save(); g.transform(M.a, M.b, M.c, M.d, M.e, M.f);       // all shading in the body's frame, across the sleeves too
    g.translate(side * dir * 4, 0); const W = c.bodyW * bw;                          // side-on: shading follows the narrower body (no scaling: blur breaks into blocks)
    const back = CY > 1;                                                        // from behind: no front details on the shirt
    if (c.outfit) drawOutfit(c.outfit, W, sh, hm, back); else if (c.over && !back) c.over(c, W, sh, hm);
    blob(W + 10, mid, 18, half * .85, dk(c.top, .35) + '77', 9); blob(-W + 2, mid - 15, 9, half * .6, lt(c.top, .35) + '55', 8); blob(0, hm, W + 10, 9, dk(c.top, .3) + '66', 6); blob(0, sh + 6, 30, 14, dk(c.top, .45) + '99', 7);
    if (NCX.CEL) { const p = new Path2D(); p.moveTo(W * .3, sh - 30); p.bezierCurveTo(W * .12, sh + 70, W * .4, hm - 60, W * .22, hm + 4); p.lineTo(W + 80, hm + 4); p.lineTo(W + 80, sh - 30); p.closePath();
      // CELSOFT: the shade darkens whatever is underneath in its own colour (multiply, a soft edge) - a hard shape in the
      // shirt's own darker colour read as a patch of different cloth over vests and coats (user, 2026-11-02)
      if (NCX.CELSOFT) { g.save(); g.globalCompositeOperation = 'multiply'; g.filter = 'blur(9px)'; g.fillStyle = 'rgba(92,70,128,.42)'; g.fill(p); g.restore(); }
      else { g.save(); g.globalAlpha = .55; g.fillStyle = dk(c.top, .4); g.fill(p); g.restore(); } /* see-through: prints stay visible in the shade */ if (!back) { g.fillStyle = dk(c.top, .3); g.beginPath(); g.ellipse(4, sh + 4, 30, 15, 0, 0, Math.PI); g.fill(); } }
    if (NCX.GLOSS) { g.save(); g.filter = 'blur(3px)'; g.strokeStyle = 'rgba(255,255,255,.42)'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-W * .5, sh + 26); g.bezierCurveTo(-W * .72, sh + 60, -W * .7, hm - 60, -W * .58, hm - 22); g.stroke(); g.restore(); }
    g.restore();
    for (const a of ARMS) if (a.E) blob(a.E[0], a.E[1], 9, 6, dk(c.top, .4) + 'aa', 3);   // inside of the sleeve openings
  });
  g.save(); g.transform(M.a, M.b, M.c, M.d, M.e, M.f); g.translate(side * dir * 8, 0);
  const ot = c.outfit && (c.outfit.tie || c.outfit.collar);                // a collar or tie: a short neck above it, not a turtleneck
  const nc = ot ? (c.face || NCX.FACE) : c.neck || c.top; g.fillStyle = lin(-15, 0, 15, 0, [[0, lt(nc, .12)], [1, dk(nc, .3)]]);
  if (ot) g.fill(rr(-11, sh - 13, 22, 11, 5)); else { g.fill(rr(-15, sh - 11, 30, 16, 6)); if (NCX.CEL) { g.fillStyle = dk(nc, .3); g.fill(rr(2, sh - 11, 13, 16, 5)); } }
  g.restore();
  if (wS > 0) for (const a of ARMS) if (!a.far) { g.save(); g.globalAlpha = wS; sleeve(a, GRAD); g.restore(); }   // side-on: the near sleeve lies over the side of the body
  const hands = [];
  for (const a of ARMS) {                                     // in front: long-sleeve lower halves (cross the body), sticks
    if (a.far) continue;
    g.save(); g.globalAlpha = 1 - a.fw;                       // the far arm fades out in front as it goes behind
    const cp = new Path2D(); cp.rect(-1e4, -1e4, 2e4, 2e4); cp.moveTo(...a.cut[0]); a.cut.slice(1).forEach(p => cp.lineTo(...p)); cp.closePath();
    g.save(); g.clip(cp, 'evenodd'); brushLine(a.line.slice(c.longSleeve ? Math.round(a.line.length * .5) : 4), taper(6, .05, .1, .82), STICK); g.restore();   // the arm comes out of the sleeve, never over it
    if (c.longSleeve && !SEP) { const slv = a.slv, half = slv.slice(Math.round(slv.length * .45)); brushLine(half, taper(15, .1, .12, .88), GRAD);
      if (NCX.CEL) brushLine(slv.slice(2).map(([x, yy]) => [x + 3.5, yy + 1]), taper(6.5, .05, .15, .7), dk(c.top, .26)); brushLine(slv.slice(2).map(([x, yy]) => [x - 2, yy - 1.5]), taper(6, .1, .2, .5), lt(c.top, .14)); }
    g.restore(); hands.push([a.hd, 1 - a.fw]);
  }
  // props get both hands (even one hidden behind the body); a scene's own prop draws on NC.g, the canvas in use now
  if (c.held) { NC.g = g; c.held(ARMS.map(a => a.hd), t); }
  if (!NOLIMB && NCX.HANDS) for (const [hd, al] of hands) { g.globalAlpha = al; g.fillStyle = rad(hd[0] - 2.5, hd[1] - 2.5, 9, [[0, '#6a6466'], [.5, '#2a2526'], [1, '#141112']]); g.beginPath(); g.arc(hd[0], hd[1], 7.5, 0, 7); g.fill(); g.globalAlpha = 1; }
  const neck = TX(0, sh - 8), fwd = side * wk;
  g.save(); g.translate(neck[0] + dir * fwd * 5, neck[1] + fwd * 3); g.rotate(P.lean * .6 + CT * .8 + P.tilt + dir * fwd * .04); g.translate(0, -ry * sy * hk + P.nod); g.scale(sx * hk, sy * hk);
  drawHead(c, HP, hair); g.restore();
}
// the head seen from any angle (yaw: 0 front, 1 profile, 2 back; the way it turns = the sign of sd): the face parts sit
// on a round head and slide round it (foreshortening, the far eye hiding), the hair covers whatever the face doesn't -
// a cap from the front, the back half in profile, all but the nape from behind
function drawHeadYaw(c, P) {
  const rx = c.rx, ry = c.ry, j = c.jaw, hcol = c.hairCol, dir = Math.sign(P.sd) || 1, psi = P.yaw * Math.PI / 2 * dir, cp = Math.cos(psi), spi = Math.sin(psi);
  g.transform(1, 0, spi * .14, 1, 0, 0);          // seen from the side the chin sits forward and the back of the skull back
  const f = sym([0, -ry], [[rx * .56, -ry, rx, -ry * .56, rx, -ry * .04], [rx, ry * .38, rx * (.84 + j * .1), ry * .72, rx * (.42 + j * .12), ry * .93], [rx * .24, ry, rx * .1, ry, 0, ry]]);
  hairYaw(c, P, f, psi, cp, spi, 'behind');                 // long hair, a bun facing away: behind the head
  if (c.hat === 'police') HAT.police(rx, ry, psi, 'behind'); // and a cap's visor when he faces away
  const FC = c.face || NCX.FACE; g.fillStyle = rad(-rx * .3, -ry * .35, rx * 1.6, [[0, lt(FC, .35)], [.55, FC], [1, dk(FC, .14)]]); g.fill(f);
  soft(f, () => blob(0, -ry * .66, rx * .9, ry * .16, 'rgba(90,50,50,.1)', 7));
  faceShade(rx, ry, j, f);
  // face parts sit at fixed spots round the head (th = angle from the face's middle) and slide round it as he turns,
  // narrowing toward the edge and fading out behind
  const part = (th, fn) => { const a = th + psi, k = Math.cos(a), al = clamp((k + .12) / .3, 0, 1); if (al <= 0) return;
    g.save(); g.globalAlpha = al; g.translate(rx * .82 * Math.sin(a), 0); g.scale(Math.max(.35, k), 1); fn(); g.restore(); };
  const FD = dk(FC, .45);
  soft(f, () => { if (c.blush) for (const s of [-1, 1]) part(s * .62, () => blob(0, ry * .32, 9, 5, `rgba(255,120,130,${c.blush})`, 5));
    if (c.stubble) part(0, () => blob(0, ry * .66, rx * .78, ry * .32, `rgba(70,45,45,${c.stubble})`, 7)); });
  for (const s of [-1, 1]) part(s * .48, () => {             // .48: the same eye spacing as the front head
    const y = -2, by = y - 18 - P.browUp * 5, ang = P.browAng * s;
    if (P.eyeArc > .5) stroke([[-6.5, y + 3], [0, y - 4.5], [6.5, y + 3]], INKC, 2.4);
    else { const lid = y - 1 + P.blink * 8 - P.eyeWide * 3.5; g.save(); g.beginPath(); g.rect(-14, lid, 28, 18); g.clip(); g.fillStyle = INKC; g.beginPath(); g.ellipse(P.lookX * 2.6, y + 2.4 + P.lookY * 1.2, 4.4, 5, 0, 0, 7); g.fill(); g.restore();
      stroke([[-8.5, lid + .9], [0, lid - 1], [8.5, lid + 1]], INKC, 2.2); }
    stroke([[-s * 10, by + ang * 3], [s * 1, by - 5], [s * 10, by + 1 - ang * 1.5]], c.brow || dk(hcol, .3), c.thickBrow ? 2.8 : 2);
    if (c.wrinkles) { g.save(); g.globalAlpha *= c.wrinkles; stroke([[s * 11, -6], [s * 14, -2], [s * 12, 3]], FD, 1.4); g.restore(); }
    if (c.glasses) { g.strokeStyle = '#2a2430'; g.lineWidth = 2.2; g.beginPath(); g.arc(0, y + 2, 11, 0, 7); g.stroke(); } });
  if (c.glasses) part(0, () => stroke([[-7, 0], [0, -3], [7, 0]], '#2a2430', 2.2));
  if (c.wrinkles) { part(0, () => { g.globalAlpha *= c.wrinkles; stroke([[-rx * .32, -ry * .5], [0, -ry * .55], [rx * .32, -ry * .5]], FD, 1.6); });
    for (const s of [-1, 1]) part(s * .36, () => { g.globalAlpha *= c.wrinkles; stroke([[0, ry * .28], [s * 3, ry * .42], [0, ry * .56]], dk(FC, .4), 1.5); }); }
  if (c.beard) beardYaw(c, psi, f);
  if (c.stache) part(0, () => { const m = sym([0, ry * .33], [[8, ry * .27, 18, ry * .3, 21, ry * .44], [12, ry * .45, 5, ry * .42, 0, ry * .42]]); g.fillStyle = lin(-20, 0, 20, 0, [[0, lt(c.stache, .2)], [1, dk(c.stache, .25)]]); g.fill(m); });
  part(0, () => mouth(0, c.stache ? ry * .58 : ry * .5, P.smile, P.open, P.round));
  hairYaw(c, P, f, psi, cp, spi, 'front');
  if (c.hat) HAT[c.hat](rx, ry, psi);
}
// beards for the rotating head: a band round the jaw between a top line (under the lip in front, up the cheeks to a
// sideburn at the ear) and a bottom line (below the chin by the beard's bulk), placed on the round head and seen from
// whatever angle he faces - so a beard turns with him like the hair. full | short | goatee; c.beardCol (else hair colour)
const BEARD = {
  full: { span: 1.5, top: [.62, .36, .1], bot: [1.34, 1.24], a: 1, edge: true },
  short: { span: 1.5, top: [.64, .42, .16], bot: [1.2, 1.12], a: 1, edge: true },
  goatee: { span: .42, top: [.66, .66, .66], bot: [1.16, .98], a: 1 },
};
function beardYaw(c, psi, f) {
  const B = BEARD[c.beard]; if (!B) return;
  const rx = c.rx, ry = c.ry, col = c.beardCol || c.hairCol, N = 48;
  const topY = th => { const a = Math.abs(th); return B.top[0] + (B.top[1] - B.top[0]) * sst(.2, .62, a) + (B.top[2] - B.top[1]) * sst(.62, B.span, a); };
  const botY = th => B.bot[0] + (B.bot[1] - B.bot[0]) * sst(0, B.span, Math.abs(th)) ** 1.4;
  // edge beards overshoot sideways and are cut to the face, so the whole jaw line is covered; below the chin they hang
  // as a full rounded mass down over the neck (no gap between the beard and the collar)
  const pt = (th, Y) => { const Yc = clamp(Y, -.98, .98), r0 = Math.sqrt(1 - Yc * Yc) * (Y > .98 ? Math.max(.55, 1 - (Y - .98) * 1.5) : 1), r = B.edge && Y > .5 ? Math.max(r0, .92) : r0, a = th + psi;   /* edge beards keep a wide bottom, not the sphere's narrow underside */ return [rx * (B.edge ? 1.35 : 1.03) * r * Math.sin(a), Y * ry, Math.cos(a)]; };
  const T = [], Bo = [];
  for (let i = 0; i <= N; i++) { const th = -B.span + 2 * B.span * i / N, p = pt(th, topY(th)), q = pt(th, botY(th)); if (p[2] > -.02) { T.push(p); Bo.push(q); } }
  if (T.length < 3) return;
  const p = new Path2D(); T.forEach((v, i) => p[i ? 'lineTo' : 'moveTo'](v[0], v[1])); Bo.reverse().forEach(v => p.lineTo(v[0], v[1])); p.closePath();
  const paint = () => { g.globalAlpha = B.a; g.filter = 'blur(1.2px)';
    g.fillStyle = lin(-rx, -ry * .2, rx, ry * 1.3, [[0, lt(col, .16)], [.5, col], [1, dk(col, .35)]]); g.fill(p); g.filter = 'none';
    soft(p, () => { g.globalAlpha = .3; for (let i = 0; i < 9; i++) { const th = -B.span * .8 + 1.6 * B.span * i / 8, a = pt(th, topY(th) + .08), b = pt(th * 1.05, botY(th) - .06);
      if (a[2] > .1) stroke([[a[0], a[1]], [(a[0] + b[0]) / 2 + 2, (a[1] + b[1]) / 2], [b[0], b[1]]], i % 2 ? dk(col, .5) : lt(col, .3), 1.6); }
      blob(-rx * .3, ry * .75, rx * .3, ry * .12, lt(col, .4) + '44', 6); }); };
  if (!B.edge) { g.save(); paint(); g.restore(); return; }
  const fg = new Path2D(); fg.addPath(f, new DOMMatrix().translate(0, -ry * .3).scale(1.03, 1.1).translate(0, ry * .3));
  const sp = Math.sin(psi), hw = rx * (.86 - .3 * Math.abs(sp)), lo = rr(rx * .45 * sp - hw, ry * .4, hw * 2, (B.bot[0] - .4) * ry, hw * .7);
  for (const cl of [fg, lo]) { g.save(); g.clip(cl); paint(); g.restore(); }
}
// hairstyles for the rotating head. Each is a hairline ring round the head - yHL(th) = ry * (a - b * cos th), th = the
// angle from the face (0) round to the back (PI) - placed on the round head and projected for the angle he's seen
// from, so a style is the same hair from every side; w/h = how far the hair mass grows out. Extras: a short swept
// fringe (crop), a centre parting, a bun on the crown, long hair hanging behind, or (bald) only a band round the back
const HSTYLE = {
  short: { a: -.03, b: .58, w: 1.09, h: 1.16, fringe: true },
  buzz: { a: -.08, b: .62, w: 1.035, h: 1.035 },
  bun: { a: -.04, b: .64, w: 1.05, h: 1.07, bun: true, part: true },
  long: { a: .5, b: 1.1, w: 1.09, h: 1.1, long: true, part: true },
  bald: { a: .25, b: .25, w: 1.04, h: 1.02, bald: true },
};
// the shading for long hair: one gradient for the hair on the head and the hair hanging down, so they read as one piece
const longFill = (rx, hcol) => lin(-rx * 1.2, 0, rx * 1.2, 0, [[0, lt(hcol, .12)], [.45, hcol], [1, dk(hcol, .32)]]);
// long hair hanging down behind the head (head space): as wide as the head is from this side at the top, falling past
// the shoulders, shifted to the back of the head as it turns
function longHair(c, P) {
  const rx = c.rx, ry = c.ry, hcol = c.hairCol, dir = Math.sign(P.sd) || 1, psi = P.yaw * Math.PI / 2 * dir, spi = Math.sin(psi);
  g.save(); g.transform(1, 0, spi * .14, 1, 0, 0);
  let x0 = 1e9, x1 = -1e9; for (let i = 0; i <= 40; i++) { const th = 1.45 + i / 40 * (Math.PI - 1.45); for (const s of [-1, 1]) { const x = rx * 1.13 * Math.sin(s * th + psi); x0 = Math.min(x0, x); x1 = Math.max(x1, x); } }
  // it starts inside the head's round outline (no corners poking out) and flares out smoothly below it
  const p = new Path2D(), yb = ry * 2.1, mx = (x0 + x1) / 2, s0 = mx + (x0 - mx) * .86, s1 = mx + (x1 - mx) * .86;
  p.moveTo(s0, -ry * .1); p.quadraticCurveTo(mx, -ry * 1.3, s1, -ry * .1); p.bezierCurveTo(x1 + 2, ry * .45, x1 + 5, ry * 1.4, x1 - 6, yb);
  p.quadraticCurveTo(mx, yb + 12, x0 + 6, yb); p.bezierCurveTo(x0 - 5, ry * 1.4, x0 - 2, ry * .45, s0, -ry * .1); p.closePath();
  g.fillStyle = longFill(rx, hcol); g.fill(p);
  soft(p, () => { g.save(); g.filter = 'blur(.8px)'; for (let i = 1; i < 6; i++) { const x = x0 + (x1 - x0) * i / 6; g.globalAlpha = .28; stroke([[x, ry * .3], [x + 2, ry * 1.1], [x - 1, yb - 6]], i % 2 ? dk(hcol, .45) : lt(hcol, .3), 1.8); } g.restore();
    blob(x1 - 6, ry, 8, ry, dk(hcol, .4) + '66', 8); });
  g.restore();
}
function hairYaw(c, P, f, psi, cp, spi, layer) {
  const rx = c.rx, ry = c.ry, hcol = c.hairCol, S = HSTYLE[c.hair] || HSTYLE.short;
  const HG = S.long ? longFill(rx, hcol) : lin(-rx, -ry - 25, rx, 20, [[0, lt(hcol, .14)], [.5, hcol], [1, dk(hcol, .35)]]), cx0 = -spi * rx * .25;
  // a point on the head; a hairline below the chin (long hair at the back) keeps its height, so the hair covers right down
  const pt = (th, Y) => { const Yc = clamp(Y, -.98, .98), r = Math.sqrt(1 - Yc * Yc), a = th + psi; return { x: rx * 1.03 * r * Math.sin(a), y: clamp(Y, -.98, 1.6) * ry, z: Math.cos(a), th }; };
  const yHL = th => ry * (S.a - S.b * Math.cos(th));
  if (layer === 'behind') {
    // the bun sits on the crown toward the back: behind the head while it faces away from us
    if (S.bun) { const b = pt(Math.PI, -.86); if (b.z < 0) bunDraw(b.x, b.y - 13); }
    return;
  }
  // the ring's side facing us, and the region above it (where the hair is)
  const ringOf = yf => { const R = []; for (let i = 0; i <= 120; i++) { const th = -Math.PI + i / 120 * 2 * Math.PI; R.push(pt(th, yf(th) / ry)); }
    let s0 = R.findIndex((p, i) => p.z > 0 && R[(i + R.length - 1) % R.length].z <= 0); if (s0 < 0) s0 = 0;
    const vis = []; for (let k = 0; k < R.length; k++) { const p = R[(s0 + k) % R.length]; if (p.z <= 0) break; vis.push(p); }
    const hp = new Path2D(), A = vis[0], Z = vis[vis.length - 1];
    // beyond the ring's ends (where it goes round the back) everything at that height and above is hair: run out sideways
    hp.moveTo(-4 * rx, A.y); vis.forEach(p => hp.lineTo(p.x, p.y)); hp.lineTo(4 * rx, Z.y); hp.lineTo(4 * rx, -3 * ry); hp.lineTo(-4 * rx, -3 * ry); hp.closePath(); return { hp, vis }; };
  // turned away from us, the long hair lies over the back of the head and the shirt (faded in as the back turns to us)
  if (S.long) { const k = clamp((-.15 - cp) / .08, 0, 1);   /* a quick switch, never half see-through for long */ if (k > 0) { g.save(); g.globalAlpha = k; g.setTransform(g.getTransform().multiply(new DOMMatrix([1, 0, -spi * .14, 1, 0, 0]))); longHair(c, P); g.restore(); } }
  const { hp, vis } = ringOf(yHL);
  const grown = new Path2D(); grown.addPath(f, new DOMMatrix().translate(0, -4).translate(0, ry * .4).scale(c.hairW || S.w, c.hairH || S.h).translate(0, -ry * .4));
  g.save(); g.clip(hp); g.clip(grown);
  // bald: a horseshoe of hair - fuller above the ears, thinner across the back - the crown bare
  if (S.bald) { const up = th => { const a = Math.abs(th), k = clamp((a - 1.15) / .45, 0, 1), top = ry * (-.15 + .4 * clamp((a - 1.6) / (Math.PI - 1.6), 0, 1)); return yHL(th) + (top - yHL(th)) * k; };
    const m = new Path2D(); m.rect(-4 * rx, -4 * ry, 8 * rx, 8 * ry); m.addPath(ringOf(up).hp); g.clip(m, 'evenodd'); g.filter = 'blur(1px)'; }
  if (c.hair === 'buzz') g.globalAlpha = .82;                               // a buzz cut lets a little skin through
  if (!S.bald) g.fillStyle = HG, g.fillRect(-2 * rx, -2 * ry, 4 * rx, 4 * ry); g.globalAlpha = 1; g.filter = 'none';
  if (S.bald) { g.restore(); g.save(); g.clip(grown);                       // the horseshoe as soft puffs of hair, fluffy at the edges
    for (let i = 0; i <= 48; i++) { const th = -Math.PI + i / 48 * 2 * Math.PI, a = Math.abs(th); if (a < 1.25) continue;
      const lo = yHL(th), hi = ry * (-.15 + .4 * clamp((a - 1.6) / (Math.PI - 1.6), 0, 1)) * clamp((a - 1.15) / .45, 0, 1) + lo * (1 - clamp((a - 1.15) / .45, 0, 1));
      const q = pt(th, (lo + hi) / 2 / ry), tk = (lo - hi) * clamp((a - 1.2) / .35, 0, 1); if (q.z <= -.05 || tk < 3) continue;
      g.fillStyle = rad(q.x - tk * .2, q.y - tk * .3, tk * .9, [[0, lt(hcol, .35)], [.6, hcol], [1, dk(hcol, .18)]]);
      g.beginPath(); g.ellipse(q.x, q.y, tk * (.35 + .45 * Math.max(0, q.z)) + 2, tk * .62, 0, 0, 7); g.fill(); } }
  g.save(); g.filter = 'blur(.8px)';                                        // a few strands sweeping from the crown round the head
  const lum = h2(hcol).reduce((a, v) => a + v, 0) / 765, sa = lum > .6 ? .1 : S.long ? .3 : .25;   // faint strands on white or grey hair
  if (!S.bald) for (let i = 0; i < 4; i++) { const u = (i - 1.5) / 1.8; g.globalAlpha = sa; stroke([[cx0 + u * 8, -ry - 2], [cx0 + u * rx * .8, -ry * .55], [cx0 + u * rx * 1.05, ry * .3]], dk(hcol, .6), 1.8); }
  g.restore(); if (!S.bald) { blob(cx0 - rx * .15, -ry * .9, rx * .5, ry * .1, lt(hcol, .55) + '77', 7); if (!S.long) { blob(cx0 - rx * .35, -ry * .3, rx * .12, ry * .35, lt(hcol, .4) + '44', 6); blob(rx * .6, 0, rx * .4, ry * .8, dk(hcol, .4) + '55', 10); } }
  g.restore();
  // a centre parting: a soft line from the crown to the hairline, pinned to the middle of the head
  if (S.part) { const P0 = [], top = yHL(0) / ry; for (let i = 0; i <= 8; i++) P0.push(pt(0, -.97 + (top + .97) * i / 8));
    if (P0[8].z > .05) { g.save(); g.clip(grown); g.globalAlpha = clamp(P0[8].z / .4, 0, 1) * .55; g.filter = 'blur(.6px)'; stroke([[P0[0].x, P0[0].y], [P0[4].x, P0[4].y], [P0[8].x, P0[8].y + 2]], dk(hcol, .5), 2.2); g.restore(); } }
  // the crop's short swept fringe: three locks at fixed spots on the hairline (they slide round and thin out as he turns)
  if (S.fringe) { g.save(); g.clip(f); g.fillStyle = HG;
    for (const [th0, len] of [[-.55, 9], [-.15, 10], [.25, 7]]) { const q = pt(th0, yHL(th0) / ry); if (q.z <= 0) continue;
      const w = clamp(q.z / .4, 0, 1), sx2 = q.z * 9, lk = new Path2D(); lk.moveTo(q.x - 11 * w, q.y - 3); lk.quadraticCurveTo(q.x - 4 * w, q.y + len * .7 * w, q.x + sx2 * w, q.y + len * w);
      lk.quadraticCurveTo(q.x + 6 * w, q.y + len * .4 * w, q.x + 11 * w, q.y - 3); lk.closePath(); g.fill(lk); }
    g.restore(); }
  if (S.bun) { const b = pt(Math.PI, -.86); if (b.z >= 0) bunDraw(b.x, b.y - 13); }
  function bunDraw(x, y) { const b = new Path2D(); b.ellipse(x, y, 19, 16, 0, 0, 7); g.fillStyle = rad(x - 6, y - 6, 26, [[0, lt(hcol, .3)], [.6, hcol], [1, dk(hcol, .3)]]); g.fill(b);
    soft(b, () => { g.globalAlpha = .4; stroke([[x - 12, y - 4], [x, y - 12], [x + 12, y - 4]], dk(hcol, .5), 1.8); stroke([[x - 10, y + 6], [x + 2, y - 2], [x + 13, y + 3]], dk(hcol, .5), 1.6); }); }
}
// the approved front head up to a slight turn, the angle-aware head beyond, cross-faded in between (on a spare layer,
// so the two never show through each other)
function drawHead(c, P, hair) {
  const y = P.yaw; if (NCX.ROT || c.hairRot || y >= .25) return drawHeadYaw(c, P);   // hairRot: one rotating hairstyle at every angle, no separate front drawing if (y <= .08) return drawHeadFront(c, P, hair);
  drawHeadYaw(c, P);
  const L = NC._h || (NC._h = document.createElement('canvas')), cv = g.canvas; if (L.width !== cv.width || L.height !== cv.height) { L.width = cv.width; L.height = cv.height; }
  const lx = L.getContext('2d'); lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, L.width, L.height); lx.setTransform(g.getTransform());
  const keep = g; g = lx; drawHeadFront(c, P, hair); g = keep;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - (y - .08) / .17; g.drawImage(L, 0, 0); g.restore();
}
function drawHeadFront(c, P, hair) {
  // turned a little (a yaw given): the face slides exactly as far as on the turning head, so the cross-fade lines up
  const rx = c.rx, ry = c.ry, j = c.jaw, hcol = c.hairCol, fx = P.yaw > 0 ? rx * .82 * Math.cos(.48) * Math.sin(P.yaw * Math.PI / 2) * (Math.sign(P.sd) || 1) : P.turn * rx * (.3 + .1 * Math.abs(P.sd));
  const f = sym([0, -ry], [[rx * .56, -ry, rx, -ry * .56, rx, -ry * .04], [rx, ry * .38, rx * (.84 + j * .1), ry * .72, rx * (.42 + j * .12), ry * .93], [rx * .24, ry, rx * .1, ry, 0, ry]]);
  const FC = c.face || NCX.FACE; g.fillStyle = rad(-rx * .3, -ry * .35, rx * 1.6, FC ? [[0, lt(FC, .35)], [.55, FC], [1, dk(FC, .14)]] : [[0, '#ffffff'], [.55, '#fbf7f5'], [1, '#e8dcdc']]); g.fill(f);
  soft(f, () => { blob(0, -ry * .66, rx * .9, ry * .16, 'rgba(90,50,50,.1)', 7);
    if (c.blush) for (const s of [-1, 1]) blob(fx + s * rx * .52, ry * .32, 9, 5, `rgba(255,120,130,${c.blush})`, 5);
    if (c.stubble) blob(fx, ry * .66, rx * .78, ry * .32, `rgba(70,45,45,${c.stubble})`, 7); });   // a shadow of stubble round the jaw
  faceShade(rx, ry, j, f);
  if (c.wrinkles) { const a = c.wrinkles;                                  // age lines: a forehead crease, crow's feet, smile folds
    g.save(); g.globalAlpha = a; stroke([[fx - rx * .32, -ry * .5], [fx, -ry * .55], [fx + rx * .32, -ry * .5]], dk(c.face || NCX.FACE, .45), 1.6);
    for (const s of [-1, 1]) { const ex = fx + s * rx * .38; stroke([[ex + s * 11, -6], [ex + s * 14, -2], [ex + s * 12, 3]], dk(c.face || NCX.FACE, .45), 1.4);
      stroke([[fx + s * rx * .3, ry * .28], [fx + s * rx * .36, ry * .42], [fx + s * rx * .32, ry * .56]], dk(c.face || NCX.FACE, .4), 1.5); }
    g.restore(); }
  const sp = 1 - Math.abs(P.turn) * .12;
  for (const s of [-1, 1]) {
    const x = fx + s * rx * .38 * sp, y = -2, by = y - 18 - P.browUp * 5, ang = P.browAng * s;
    if (P.eyeArc > .5) stroke([[x - 6.5, y + 3], [x, y - 4.5], [x + 6.5, y + 3]], INKC, 2.4);
    else { const lx = P.lookX * 2.6, ly = P.lookY * 1.2, lid = y - 1 + P.blink * 8 - P.eyeWide * 3.5;
      g.save(); g.beginPath(); g.rect(x - 14, lid, 28, 18); g.clip(); g.fillStyle = INKC; g.beginPath(); g.ellipse(x + lx, y + 2.4 + ly, 4.4, 5, 0, 0, 7); g.fill(); g.restore();
      stroke([[x - 8.5, lid + .9], [x, lid - 1], [x + 8.5, lid + 1]], INKC, 2.2); }
    stroke([[x - s * 10, by + ang * 3], [x + s * 1, by - 5], [x + s * 10, by + 1 - ang * 1.5]], c.brow || dk(hcol, .3), c.thickBrow ? 2.8 : 2);
    if (c.glasses) { g.strokeStyle = '#2a2430'; g.lineWidth = 2.2; g.beginPath(); g.arc(x, y + 2, 11, 0, 7); g.stroke(); }
  }
  if (c.glasses) stroke([[fx - rx * .38 * sp + 11, 0], [fx, -3], [fx + rx * .38 * sp - 11, 0]], '#2a2430', 2.2);
  if (c.stache) { const m = sym([0, ry * .33], [[8, ry * .27, 18, ry * .3, 21, ry * .44], [12, ry * .45, 5, ry * .42, 0, ry * .42]]); g.save(); g.translate(fx, 0); g.fillStyle = lin(-20, 0, 20, 0, [[0, lt(c.stache, .2)], [1, dk(c.stache, .25)]]); g.fill(m); g.restore(); }
  mouth(fx, c.stache ? ry * .58 : ry * .5, P.smile, P.open, P.round);
  g.save(); g.translate(-P.turn * 2.5, 0);
  g.fillStyle = lin(-rx, -ry - 25, rx, 20, [[0, lt(hcol, .14)], [.5, hcol], [1, dk(hcol, .35)]]); hair.parts.forEach(p => g.fill(p));
  hair.parts.forEach(p => soft(p, () => { g.save(); g.filter = 'blur(.8px)'; hair.strands.forEach(([pts, light]) => { g.globalAlpha = light ? .45 : .35; stroke(pts, light ? lt(hcol, .45) : dk(hcol, .55), light ? 2.6 : 1.8); }); g.restore();
    blob(-rx * .3, -ry - 6, rx * .45, 8, lt(hcol, .5) + '66', 6); blob(rx * .6, 0, rx * .4, ry * .8, dk(hcol, .4) + '55', 10); }));
  if (c.hat) HAT[c.hat](rx, ry);
  g.restore();
}
function mouth(x, my, smile, open, round) {
  const w = 11 * (1 - .45 * round) * (1 + .15 * smile), cy = my - smile * 4;
  if (open < .07) { stroke([[x - w, cy], [x, my + smile * 7], [x + w, cy]], '#2a2226', 2.2); return; }
  const top = my + smile * 2 - open * 2 - round * 2, bot = my + smile * 5 + open * 16 + round * 3;
  const p = new Path2D(); p.moveTo(x - w, cy); p.quadraticCurveTo(x, top, x + w, cy); p.quadraticCurveTo(x, bot, x - w, cy); p.closePath();
  g.fillStyle = '#5a2430'; g.fill(p);
  soft(p, () => { g.fillStyle = '#ee7484'; g.beginPath(); g.ellipse(x, bot - 2, w * .6, 6, 0, 0, 7); g.fill(); if (open > .3 && round < .5) { g.fillStyle = '#fff'; g.fillRect(x - w, top - 4, w * 2, 5 + open * 2); } });
  g.strokeStyle = '#2a2226'; g.lineWidth = 1.4; g.stroke(p);
}

// ---- poses: any channel not given takes its default ----
const DEF = { hipY: 0, lean: 0, sit: 0, feet: 17, footR: 0, shiftX: 0, turn: 0, lookX: 0, lookY: 0, nod: 0, tilt: 0, smile: .5, open: 0, round: 0, eyeArc: 0, eyeWide: 0, browUp: 0, browAng: 0, talk: 0, walk: 0, ph: 0, sd: 0, yaw: 0 };
function pose(c, t) {
  const T = c.tracks || {}, k = n => T[n] ? K(T[n], t) : DEF[n], ph = c.ph || 0;
  const talk = k('talk'), syl = Math.max(0, Math.sin(t * 13 + ph) * .6 + Math.sin(t * 7.7 + ph * 2) * .45);
  const blink = Math.max(0, ...(T.blinks || []).map(b => Math.max(0, 1 - Math.abs(t - b) / .09)));
  const frv = T.footR ? Math.abs(K(T.footR, t + .04) - K(T.footR, t - .04)) / .08 : 0;
  return { x: Math.sin(t * .9 + ph) * 1.6 + k('shiftX'), hipY: k('hipY'), lean: k('lean') + Math.sin(t * .7 + ph) * .006, sq: 1 + Math.sin(t * 2.2 + ph) * .01,
    sit: k('sit'), feet: k('feet'), footR: k('footR'), lift: Math.min(12, frv * .25), turn: k('turn'), lookX: k('lookX'), lookY: k('lookY'),
    nod: k('nod') + talk * Math.sin(t * 6.5 + ph) * 1.6, tilt: (T.tilt ? K(T.tilt, t - .1) : 0) + Math.sin(t * .8 + ph) * .012,
    smile: k('smile'), open: Math.max(k('open'), talk * syl * .65), round: k('round'), eyeArc: k('eyeArc'), eyeWide: k('eyeWide'),
    browUp: k('browUp'), browAng: k('browAng'), blink, walk: k('walk'), ph: k('ph'), sd: k('sd'), yaw: k('yaw'), ...(c.live ? c.live(t) : null) };
}

// ---- the cast ----
const ARMK = .82;   // short arms
const M = { sh: -395, hem: -205, bodyW: 44, rx: 46, ry: 58, jaw: .8, arm: 96 }, F = { sh: -378, hem: -202, bodyW: 37, rx: 43, ry: 56, jaw: .1, arm: 96 };
const REST = [[[0, 'r', -8, 186]], [[0, 'r', 8, 186]]];
const mk = d => ({ ...d, arm: d.arm * ARMK, hands: (d.hands || REST).map(keys => keys.map(k => k[1] === 'r' ? [k[0], 'r', k[2] * ARMK, k[3] * ARMK] : k)) });
const HIP = s => [[0, 'r', s * -4, 150]];         // a hand resting on the hip
// ---- age presets: a person's look from their age and he/she, so every story casts the same approved look ----
//   NC.age('adult', 'he', { top, outfit, shoe, hair, hairCol, facial, seed })   -> a character
// ages: kid | teen | young | adult | elder. Grown-ups get grown-up cues (the user reads bare round faces as kids): the
// guard's face under wide hair, heavier brows, facial hair on men, wrinkles from adult on, grey hair and a smaller
// frame for elders. facial (men): stubble | stache | goatee | short | full | none - picked by seed when not given.
const AGE = {
  kid: { he: { sh: -262, hem: -138, bodyW: 33, rx: 44, ry: 52, jaw: .2, arm: 72, headK: 1.22, blush: .2, hair: 'short' },
    she: { sh: -262, hem: -138, bodyW: 32, rx: 43, ry: 52, jaw: .1, arm: 72, headK: 1.22, blush: .24, hair: 'long' } },
  teen: { he: { sh: -366, hem: -198, bodyW: 37, rx: 47, ry: 56, jaw: .5, arm: 92, hair: 'short', hairW: 1.12, hairH: 1.07 },
    she: { ...F, sh: -366, hem: -198, bodyW: 34, hair: 'long', blush: .1 } },
  young: { he: { ...M, rx: 46, ry: 58, jaw: .8, bodyW: 44, hair: 'short', hairW: 1.17, hairH: 1.09, thickBrow: true, facial: 'stubble' },
    she: { ...F, bodyW: 37, hair: 'long', blush: .1 } },
  adult: { he: { ...M, rx: 46, ry: 58, jaw: .8, bodyW: 48, hair: 'buzz', hairW: 1.17, hairH: 1.09, thickBrow: true, wrinkles: .15 },
    she: { ...F, bodyW: 40, hair: 'bun', wrinkles: .25 } },
  elder: { he: { ...M, sh: -380, hem: -200, rx: 50, ry: 56, jaw: .8, bodyW: 46, hair: 'bald', thickBrow: true, wrinkles: .7, grey: .85, facial: 'stache' },
    she: { ...F, sh: -366, hem: -196, bodyW: 42, hair: 'bun', wrinkles: .6, grey: .9, glasses: true, blush: .12 } },
};
const HAIRS = ['#2a1c16', '#3a2618', '#5a3a22', '#141012', '#7a5a3a', '#4a2a1a'], FACIAL = ['short', 'stache', 'full', 'stubble', 'goatee'];
function ageChar(age, sex = 'he', o = {}) {
  const A = AGE[age] && AGE[age][sex]; if (!A) throw new Error(`NC.age: no '${age}' / '${sex}'`);
  const seed = o.seed || 0, hc0 = o.hairCol || HAIRS[seed % HAIRS.length], grey = A.grey || 0, hc = grey ? mix(hc0, '#e6e6ea', grey) : hc0;
  const c = { ...A, hairCol: hc, top: '#efe2c4', shoe: '#4a3020', ...o, hairCol: hc };
  if (grey) c.brow = mix('#2a2026', '#d6d6dc', grey);
  if (sex === 'he' && (age === 'young' || age === 'adult' || age === 'elder')) {
    const fa = o.facial || A.facial || FACIAL[seed % FACIAL.length];
    if (fa === 'stubble') c.stubble = c.stubble || .3;
    if (fa === 'stache' || fa === 'goatee') c.stache = c.stache || dk(hc, .1);
    if (fa === 'goatee' || fa === 'short' || fa === 'full') c.beard = fa;
    if (fa !== 'none' && fa !== 'stubble' && !c.stubble) c.stubble = .15;
  }
  delete c.facial; delete c.grey; delete c.seed;
  return mk(c);
}
const CAST = {
  builder: mk({ ...M, hair: 'buzz', hairCol: '#5a3a22', hat: 'hardhat', top: '#ff7a12', neck: '#4a6a9a', shoe: '#7a4a1e', thickBrow: true, ph: 0,
    over: (c, W, sh, hm) => { for (const y of [sh + 60, sh + 86]) { g.fillStyle = '#f2ff6a'; g.fillRect(-W - 4, y, W * 2 + 8, 7); } for (const s of [-1, 1]) { g.fillStyle = '#f2ff6a'; g.fillRect(s * 16 - 3, sh, 6, 60); } fillSoft(rr(-W - 2, hm - 24, W * 2 + 4, 9, 2), '#8a5a2a', W); },
    hands: [HIP(-1), [[0, 'r', 30, 120]]], held: h => { const [x, y] = h[1]; g.save(); g.translate(x, y); g.rotate(-.5); fillSoft(rr(-4, -54, 8, 60, 3), '#8a5a2a', 6); fillSoft(rr(-18, -64, 36, 16, 4), '#6a7080', 18); g.restore(); },
    tracks: { smile: [[0, .6]], turn: [[0, .3]], lookX: [[0, .6]] } }),
  engineer: mk({ ...F, hair: 'long', hairCol: '#1c1618', hat: 'whitehat', top: '#2f86ff', shoe: '#2a2a34', ph: 1,
    over: (c, W, sh, hm) => { for (const s of [-1, 1]) fillSoft(rr(s * W * .5 - 9, sh + 30, 18, 14, 3), dk('#2f86ff', .15), 9); },
    hands: [[[0, 'r', 30, 90]], [[0, 'r', 8, 186]]], held: h => { const [x, y] = h[0]; g.save(); g.translate(x, y); g.rotate(.9); fillSoft(rr(-60, -9, 120, 18, 9), '#eef4ff', 60); g.fillStyle = '#7ab0ff'; g.fillRect(-60, -9, 6, 18); g.restore(); },
    tracks: { smile: [[0, .7]], turn: [[0, -.35]], lookX: [[0, -.8]], browUp: [[0, .4]] } }),
  police: mk({ ...M, hair: 'buzz', hairCol: '#2a1c16', hat: 'police', top: '#2a5ad8', shoe: '#14161c', thickBrow: true, ph: 2,
    over: (c, W, sh, hm) => { fillSoft(rr(-W - 2, hm - 34, W * 2 + 4, 10, 2), '#141820', W); fillSoft(rr(-6, hm - 35, 12, 12, 2), '#ffcc33', 6); star(-W * .45, sh + 44, 8);
      for (const s of [-1, 1]) fillSoft(rr(s * W * .5 - 10, sh + 30, 20, 5, 2), dk('#2a5ad8', .25), 10); },
    hands: [HIP(-1), [[0, 'r', 46, -10]]], tracks: { smile: [[0, .3]], browAng: [[0, .3]], turn: [[0, .25]], lookX: [[0, .5]] } }),
  policewoman: mk({ ...F, hair: 'long', hairCol: '#3a2418', hat: 'police', top: '#2a5ad8', shoe: '#14161c', ph: 3,
    over: (c, W, sh, hm) => { fillSoft(rr(-W - 2, hm - 32, W * 2 + 4, 9, 2), '#141820', W); fillSoft(rr(-6, hm - 33, 12, 11, 2), '#ffcc33', 6); star(-W * .45, sh + 40, 7); },
    hands: [[[0, 'r', 20, 120]], HIP(1)], held: h => { const [x, y] = h[0]; fillSoft(rr(x - 12, y - 30, 24, 34, 4), '#222630', 12); g.fillStyle = '#7adfff'; g.fillRect(x - 8, y - 26, 16, 12); },
    tracks: { smile: [[0, .6]], turn: [[0, -.3]], lookX: [[0, -.7]] } }),
  farmer: mk({ ...F, hair: 'long', hairCol: '#c2501c', hat: 'straw', top: '#ff3f4a', shoe: '#6a3a1a', ph: 4,
    over: (c, W, sh, hm) => { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 9, sh); g.lineTo(i * 9, hm); g.stroke(); g.beginPath(); g.moveTo(-W - 9, sh + 12 + (i + 6) * 14); g.lineTo(W + 9, sh + 12 + (i + 6) * 14); g.stroke(); }
      fillSoft(rr(-W * .62, sh + 34, W * 1.24, hm - sh, 6), '#2f7cf0', W); fillSoft(rr(-W - 9, hm - 36, W * 2 + 18, 40, 4), '#2f7cf0', W);
      for (const s of [-1, 1]) { stroke([[s * W * .5, sh + 36], [s * W * .62, sh + 18], [s * W * .7, sh + 2]], '#2f7cf0', 7); dot(s * W * .48, sh + 40, 3.5, '#ffcc33'); } },
    hands: [[[0, 'r', -8, 186]], [[0, 'r', 34, 110]]],
    behind: () => {}, held: h => { const [x, y] = h[1]; fillSoft(rr(x - 3.5, -470, 7, 462, 3), '#a8743a', 4); for (const dx of [-14, 0, 14]) fillSoft(rr(x + dx - 2, -530, 4, 62, 2), '#8a8f9a', 3); fillSoft(rr(x - 17, -474, 34, 7, 3), '#8a8f9a', 17); },
    tracks: { smile: [[0, .8]], turn: [[0, .3]], lookX: [[0, .6]] } }),
  grandpa: mk({ ...M, sh: -380, hem: -200, bodyW: 47, hair: 'bald', hairCol: '#d8d8dc', glasses: true, stache: '#e4e4e8', brow: '#b8b8c0', thickBrow: true, top: '#ffb21c', neck: '#ffffff', shoe: '#5a3a22', longSleeve: true, ph: 5,
    over: (c, W, sh, hm) => { g.fillStyle = '#ffffff'; g.fill(poly([[-12, sh], [12, sh], [0, sh + 44]])); for (let y = sh + 52; y < hm - 8; y += 20) dot(0, y, 3.2, '#8a5a12'); },
    hands: [[[0, 'r', -8, 186]], [[0, 'r', 14, 182]]], held: h => { const [x, y] = h[1]; fillSoft(rr(x - 3.5, y - 6, 7, -y + 2, 3), '#6a3a1a', 4); stroke([[x, y - 4], [x - 12, y - 22], [x - 26, y - 8]], '#6a3a1a', 7); },
    tracks: { smile: [[0, .7]], turn: [[0, -.3]], lookX: [[0, -.7]], browUp: [[0, .3]] } }),
  teacher: mk({ ...F, hair: 'bun', hairCol: '#6a3a1e', glasses: true, top: '#8a4dff', neck: '#ffd23a', shoe: '#5a2a8a', longSleeve: true, blush: .16, ph: 6,
    over: (c, W, sh, hm) => { g.fillStyle = '#ffd23a'; g.fill(poly([[-12, sh], [12, sh], [0, sh + 46]])); for (let y = sh + 54; y < hm - 8; y += 20) dot(0, y, 3, '#ffd23a'); },
    hands: [[[0, 'r', -110, -40]], [[0, 'r', 8, 186]]], held: h => { const [x, y] = h[0]; stroke([[x, y], [x - 50, y - 36], [x - 100, y - 74]], '#a8743a', 5); },
    tracks: { smile: [[0, .7]], turn: [[0, -.25]], lookX: [[0, -.5]], browUp: [[0, .4]] } }),
  // the student's look (locked 2026-11-02): a round face with a soft jaw and the rotating crop - the same from every side
  student: mk({ ...M, rx: 50, ry: 55, jaw: 1.2, hair: 'short', hairRot: true, hairW: 1.17, hairH: 1.09, hairCol: '#141012', top: '#22b573', shoe: '#2a2a34', ph: 7,
    over: (c, W, sh, hm) => { fillSoft(rr(-W * .5, hm - 70, W, 34, 8), dk('#22b573', .12), W * .5); },
    hands: [[[0, 'r', 34, 100]], [[0, 'r', -26, 104]]], held: h => { const [x, y] = [(h[0][0] + h[1][0]) / 2, (h[0][1] + h[1][1]) / 2]; fillSoft(rr(x - 34, y - 26, 68, 40, 4), '#e23a3a', 34); g.fillStyle = '#fff6e0'; g.fillRect(x - 30, y - 22, 60, 5); },
    tracks: { smile: [[0, .5]], turn: [[0, -.35]], lookX: [[0, -.9]], lookY: [[0, -.4]], browUp: [[0, .5]] } }),
  // ---- age variants (2026-11-02): from a kid to an old man ----
  kid: mk({ sh: -262, hem: -138, bodyW: 33, rx: 44, ry: 52, jaw: .2, arm: 72, headK: 1.22, hair: 'short', hairCol: '#7a4a24', top: '#ffd21c', shoe: '#e8322e', blush: .22, ph: 8,
    over: (c, W, sh, hm) => { for (const y of [sh + 34, sh + 62, sh + 90]) { g.fillStyle = 'rgba(255,90,60,.75)'; g.fillRect(-W - 4, y, W * 2 + 8, 9); } },
    hands: [[[0, 'r', -10, 186]], [[0, 'r', 30, 40]]], held: h => { const [x, y] = h[1]; stroke([[x, y], [x + 8, y - 90], [x + 14, y - 170]], '#d8d8d8', 1.6);
      g.fillStyle = rad(x + 8, y - 212, 40, [[0, '#ff9a9a'], [.6, '#ff3a4a'], [1, '#c8202e']]); g.beginPath(); g.ellipse(x + 14, y - 205, 26, 32, 0, 0, 7); g.fill(); },
    tracks: { smile: [[0, 1]], open: [[0, .35]], turn: [[0, .2]], lookX: [[0, .4]], browUp: [[0, .7]] } }),
  teen: mk({ ...F, sh: -366, hem: -198, bodyW: 34, hair: 'long', hairCol: '#4a2216', top: '#ff5fa2', shoe: '#f4f4f8', ph: 9,
    over: (c, W, sh, hm) => { fillSoft(rr(-W * .55, hm - 62, W * 1.1, 34, 10), dk('#ff5fa2', .14), W * .55); for (const s of [-1, 1]) stroke([[s * 7, sh + 4], [s * 8, sh + 30], [s * 6, sh + 46]], '#fff2f8', 2.4); },
    hands: [[[0, 'r', 24, 112]], [[0, 'r', 8, 186]]], held: h => { const [x, y] = h[0]; fillSoft(rr(x - 11, y - 30, 22, 34, 4), '#262a36', 11); g.fillStyle = '#9ae6ff'; g.fillRect(x - 7, y - 26, 14, 12); },
    tracks: { smile: [[0, .45]], turn: [[0, -.3]], lookX: [[0, -.4]], lookY: [[0, .6]], browUp: [[0, .2]] } }),
  youngman: mk({ ...M, hair: 'short', hairCol: '#3a2618', top: '#ffb21c', shoe: '#2a2a34', ph: 10,
    over: (c, W, sh, hm) => { stroke([[-W * .7, sh + 6], [0, sh + 70], [W * .8, hm - 10]], '#7a4a24', 6); fillSoft(rr(W * .45, hm - 34, 22, 30, 5), '#8a5a2a', 11); },
    hands: [[[0, 'r', -8, 186]], [HIP(1)[0]]], tracks: { smile: [[0, .75]], turn: [[0, .25]], lookX: [[0, .5]], browUp: [[0, .3]] } }),
  woman: mk({ ...F, hair: 'long', hairCol: '#d88a3a', top: '#18b5c8', shoe: '#8a3a2a', blush: .14, ph: 11,
    over: (c, W, sh, hm) => { g.fillStyle = '#f4fbfc'; g.fill(poly([[-14, sh], [0, sh + 22], [14, sh]])); for (let y = sh + 34; y < hm - 10; y += 22) dot(0, y, 3, '#f4fbfc'); },
    hands: [HIP(-1), [[0, 'r', 8, 186]]], tracks: { smile: [[0, .7]], turn: [[0, -.2]], lookX: [[0, -.3]], browUp: [[0, .3]] } }),
  dad: mk({ ...M, bodyW: 50, hair: 'buzz', hairCol: '#3a2a22', top: '#e2483a', shoe: '#5a3a22', thickBrow: true, stubble: .38, wrinkles: .2, ph: 12,
    over: (c, W, sh, hm) => { g.strokeStyle = 'rgba(40,20,30,.28)'; g.lineWidth = 4; for (let x = -W; x <= W; x += 16) { g.beginPath(); g.moveTo(x, sh); g.lineTo(x, hm); g.stroke(); }
      for (let y = sh + 14; y < hm; y += 18) { g.beginPath(); g.moveTo(-W - 8, y); g.lineTo(W + 8, y); g.stroke(); } },
    hands: [[[0, 'r', -8, 186]], [[0, 'r', 26, 120]]], held: h => { const [x, y] = h[1]; fillSoft(rr(x - 12, y - 20, 24, 26, 5), '#f4f4f8', 12); g.fillStyle = '#7a4a24'; g.fillRect(x - 10, y - 16, 20, 6); stroke([[x + 12, y - 12], [x + 20, y - 6], [x + 12, y + 1]], '#f4f4f8', 3.5); },
    tracks: { smile: [[0, .6]], turn: [[0, .2]], lookX: [[0, .3]], browUp: [[0, .2]] } }),
  mom: mk({ ...F, bodyW: 41, hair: 'bun', hairCol: '#6a4a3a', glasses: true, top: '#7b5cff', shoe: '#3a2a4a', wrinkles: .35, ph: 13,
    over: (c, W, sh, hm) => { fillSoft(rr(-W * .12, sh, W * .24, hm - sh, 2), dk('#7b5cff', .2), 6); for (let y = sh + 24; y < hm - 8; y += 22) dot(W * .2, y, 3, '#ffd23a'); },
    hands: [[[0, 'r', 28, 96]], [[0, 'r', -18, 100]]], tracks: { smile: [[0, .65]], turn: [[0, -.25]], lookX: [[0, -.4]], browUp: [[0, .35]] } }),
  grandma: mk({ ...F, sh: -366, hem: -196, bodyW: 42, hair: 'bun', hairCol: '#e6e6ec', glasses: true, brow: '#b8b8c2', top: '#e86aa0', shoe: '#6a3a4a', wrinkles: .6, blush: .16, longSleeve: true, ph: 14,
    over: (c, W, sh, hm) => { const p = new Path2D(); p.moveTo(-W - 6, sh + 4); p.quadraticCurveTo(0, sh + 70, W + 6, sh + 4); p.lineTo(W + 6, sh - 6); p.lineTo(-W - 6, sh - 6); p.closePath(); g.fillStyle = '#fff0f6'; g.fill(p);
      g.fillStyle = 'rgba(232,106,160,.5)'; for (let x = -W; x < W; x += 12) { g.beginPath(); g.arc(x, sh + 10 + 30 * (1 - (x / W) ** 2), 2.5, 0, 7); g.fill(); } },
    hands: [[[0, 'r', -8, 186]], [[0, 'r', 14, 150]]], held: h => { const [x, y] = h[1]; stroke([[x - 9, y + 2], [x, y - 12], [x + 9, y + 2]], '#6a3a2a', 3); fillSoft(rr(x - 22, y + 2, 44, 32, 7), '#8a4a6a', 22); dot(x, y + 12, 3, '#ffd23a'); },
    tracks: { smile: [[0, .8]], turn: [[0, .2]], lookX: [[0, .3]], browUp: [[0, .4]], lean: [[0, .03]], nod: [[0, 3]] } }),
  oldman: mk({ ...M, sh: -372, hem: -198, bodyW: 44, hair: 'bald', hairCol: '#e4e4e8', stache: '#eeeef2', brow: '#d0d0d6', thickBrow: true, top: '#5a8a5a', neck: '#f2ead8', shoe: '#3a2a1e', wrinkles: .75, longSleeve: true, ph: 15,
    over: (c, W, sh, hm) => { fillSoft(rr(-W - 2, sh + 2, W * 2 + 4, hm - sh, 6), dk('#5a8a5a', .1), W); for (let y = sh + 30; y < hm - 8; y += 24) dot(0, y, 3.4, '#c8a050'); },
    hands: [[[0, 'r', -8, 186]], [[0, 'r', 22, 176]]], held: h => { const [x, y] = h[1]; fillSoft(rr(x - 3.5, y - 6, 7, -y + 2, 3), '#7a4a24', 4); stroke([[x, y - 4], [x - 12, y - 22], [x - 26, y - 8]], '#7a4a24', 7); },
    tracks: { smile: [[0, .55]], turn: [[0, -.2]], lookX: [[0, -.3]], browUp: [[0, .2]], lean: [[0, -.04]], nod: [[0, 5]] } }),
};

const NCX = { CEL: true, GLOSS: false, OUTLINE: false, FACE: '#e6c7a2', ROT: true, TURN2: true, HANDS: false, CELSOFT: true };   // TURN2: the smooth snap-ready turn (approved 2026-11-02); HANDS: ball hands (off: plain stick ends, user's choice)   // ROT: every head drawn by the rotating head (hair the same from every angle)   // face colour: warm sand (chosen)   // cel shapes: approved; gloss and outline: on test
window.NC = { opts: NCX,
  CAST, pose, mk, HEIGHT: 545, age: ageChar, AGE,
  // a character standing in a 3D set (set3d): o = { face (world angle, 0 = toward +z; number or t => angle), head
  // (t => angle the head looks, leads the body), walk (t => 0..1 stride), ph (t => step phase), y, h }. `at` may be
  // [x, z] or t => [x, z] (an NC.route's at). Which side we see comes from the camera every frame, so the camera can
  // go anywhere; the scene's own c.live(t) is laid over it (expressions, hands, extra pose channels).
  place(V, c, at, o = {}) {
    let VIEW = {};
    const view = (th, x, z, cam) => { const thC = Math.atan2(cam.position.x - x, cam.position.z - z), rel = Math.atan2(Math.sin(th - thC), Math.cos(th - thC)), yaw = Math.abs(rel) / (Math.PI / 2), dir = Math.sign(rel) || 1;
      return { yaw: yaw < .002 ? 0 : yaw, sd: dir * Math.max(Math.sin(Math.min(2, yaw) * Math.PI / 2), 1e-6) }; };
    const me = { ...c, live: t => ({ ...VIEW, ...(c.live ? c.live(t) : {}) }) };
    const val = (v, t, d) => typeof v === 'function' ? v(t) : v ?? d;
    const card = V.card2d((cw, ch, ppu, side, cam) => { const t = TNOW || 0, [x, z] = val(at, t), b = view(val(o.face, t, 0), x, z, cam);
      VIEW = { ...b, walk: val(o.walk, t, 0), ph: val(o.ph, t, 0) };
      if (o.head) { const h = view(o.head(t), x, z, cam); VIEW.hyaw = h.yaw; VIEW.hsd = h.sd; VIEW.lookX = .6 * h.sd; }
      NC.draw(card.cv.getContext('2d'), me, t, cw / 2, ch - 40, ppu / NC.HEIGHT * (o.scale || 1)); }, at, { w: 1.1 * (o.scale || 1), h: (o.h || 1.32) * (o.scale || 1), y: o.y || 0, noShadow: true });
    return card;
  },
  // a walking route through points [[x, z], ...] from time t0 at speed v (person heights a second): eases in and out,
  // faces the way it goes, feet in step with the distance (the police walk). -> { at, face, walk, ph, end }
  route(pts, t0, v = .45) {
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), total = seg.reduce((a, b) => a + b, 0), dur = total / v + .5, STEP = 2 * 201 * Math.sin(.3) / 545;
    const ease = u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u), sp = t => { const u = (t - t0) / dur; return u <= 0 || u >= 1 ? 0 : Math.min(1, Math.min(u, 1 - u) * 5); };
    const dist = t => total * ease(clamp((t - t0) / dur, 0, 1));
    const where = d => { for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const u = Math.min(1, d / (seg[i] || 1)), a = pts[i], b = pts[i + 1]; return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], th: Math.atan2(b[0] - a[0], b[1] - a[1]) }; } d -= seg[i]; } };
    return { at: t => where(dist(t)).p, face: t => where(Math.min(total - .001, dist(t) + .02)).th, walk: sp, ph: t => dist(t) / STEP * Math.PI, end: t0 + dur };
  },
  // a quick cartoon turn from angle a to b starting at t0 (dur seconds): a small wind-up the other way, a fast swing,
  // a little overshoot that settles - for fast narration. Give the head t0 a few frames earlier so it leads the body.
  snap(t, t0, a, b, dur = .24) { const d = b - a, x = clamp((t - t0) / dur, 0, 1), e = x * x * x * (x * (x * 6 - 15) + 10);
    const wind = t > t0 - .12 && t < t0 ? -.05 * Math.sin(Math.PI * (t - t0 + .12) / .12) : 0, over = t > t0 + dur * .6 && t < t0 + dur + .2 ? .07 * Math.sin(Math.PI * (t - t0 - dur * .6) / (dur * .4 + .2)) : 0;
    return a + d * (e + wind + over); },
  draw(ctx, c, t, x, y, k) { const keep = g;
    if (!NCX.OUTLINE) { g = ctx; g.save(); g.translate(x, y); g.scale(k, k); drawChar(c, pose(c, t), t); g.restore(); g = keep; return; }
    // a dark outline round the whole silhouette: draw to a spare canvas, stamp it in black round itself, then on top
    const W = ctx.canvas.width, H = ctx.canvas.height, a = NC._a || (NC._a = document.createElement('canvas')), b = NC._b || (NC._b = document.createElement('canvas'));
    a.width = b.width = W; a.height = b.height = H; const P = pose(c, t);
    g = b.getContext('2d'); g.save(); g.translate(x, y); g.scale(k, k); NOLIMB = true; drawChar(c, P, t); NOLIMB = false; g.restore();   // silhouette without the sticks
    g = a.getContext('2d'); g.save(); g.translate(x, y); g.scale(k, k); drawChar(c, P, t); g.restore();
    // line style (NCX.LINE): w = width, vary = how much heavier on the shadow side (0 even .. 1 all on one side),
    // style solid | brush (thickness swells and thins along the line) | sketch (loose double line) | color (each part's own darker colour) | sticker (white rim + ink)
    const L = NCX.LINE || {}, st = L.style || 'solid', w = L.w == null ? 4.5 : L.w, vy = L.vary == null ? .24 : L.vary, bc = b.getContext('2d');
    if (st !== 'color') { bc.globalCompositeOperation = 'source-in'; bc.fillStyle = L.col || '#1c1626'; bc.fillRect(0, 0, W, H); bc.globalCompositeOperation = 'source-over'; }
    const ring = (to, r0, filt, al, jx, jy) => { to.save(); if (filt) to.filter = filt; to.globalAlpha = al || 1;
      for (let i = 0; i < 40; i++) { const an = i / 40 * Math.PI * 2, sk = (1 + Math.cos(an - .75)) / 2, r = Math.max(.8, k * r0 * ((1 - vy) + 2 * vy * sk));
        to.drawImage(b, Math.cos(an) * r + (jx || 0) * k, Math.sin(an) * r + (jy || 0) * k); } to.restore(); };
    if (st === 'color') ring(ctx, w, 'brightness(.38) saturate(1.6)');
    else if (st === 'sticker') { ring(ctx, w * 2.6, 'brightness(0) invert(1)'); ring(ctx, w * .7); }
    else if (st === 'sketch') { ring(ctx, w, null, .6, 3, -2.2); ring(ctx, w * .8, null, .8, -2.4, 2.4); }
    else if (st === 'brush') { const o = NC._o || (NC._o = document.createElement('canvas')); o.width = W; o.height = H; const oc = o.getContext('2d');
      const m = NC._m || (NC._m = document.createElement('canvas')); m.width = W; m.height = H; const mc = m.getContext('2d'); let sd = 7;
      const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;   // soft blobs keep the thick line only in patches: it swells and tapers like a brush
      for (let i = 0; i < 90; i++) { const bx = x + (rnd() - .5) * 340 * k, by = y - rnd() * 600 * k, br = (30 + rnd() * 34) * k, gr = mc.createRadialGradient(bx, by, 0, bx, by, br);
        gr.addColorStop(0, '#000'); gr.addColorStop(.6, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); mc.fillStyle = gr; mc.fillRect(bx - br, by - br, br * 2, br * 2); }
      ring(oc, w * 2.4); oc.globalCompositeOperation = 'destination-in'; oc.drawImage(m, 0, 0); oc.globalCompositeOperation = 'source-over';
      ring(ctx, w * .45); ctx.drawImage(o, 0, 0); }
    else ring(ctx, w);   // clean, even line, a touch heavier on the shadow side
    ctx.drawImage(a, 0, 0); g = keep; },
};
})();
