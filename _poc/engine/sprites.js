// Ink Shorts engine - cut-out sprites from generated images.
// Images are drawn by an image generator on a plain background (green preferred); loadSprites() removes the
// background by the colour of the image corners, removes colour spill on the edges, crops, and - for sheets like
// "6 coins at different angles" - splits the separate objects into frames (left-to-right, top-to-bottom).
// The art comes from the image; the motion (bounce, squash, spin, shatter, flip-book, particles) comes from code.
const SPR = {};

function keyImage(img, tol = 40, soft = 55) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, c.width, c.height), d = id.data, w = c.width, h = c.height;
  // background colour = median of the four corner patches
  const samp = []; for (const [cx, cy] of [[4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5]]) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const k = ((cy + j) * w + cx + i) * 4; samp.push([d[k], d[k + 1], d[k + 2]]); }
  const med = [0, 1, 2].map(ch => samp.map(s => s[ch]).sort((a, b) => a - b)[samp.length >> 1]);
  // Only colours close to the background are removed, so green objects (dollar bills, leaves) survive on a green
  // screen. Spill is cleaned only on the soft edge pixels (partly transparent), never on solid parts of a piece.
  const isGreen = med[1] > med[0] + 30 && med[1] > med[2] + 30;
  for (let k = 0; k < d.length; k += 4) {
    const r = d[k], gg = d[k + 1], b = d[k + 2];
    const dist = Math.hypot(r - med[0], gg - med[1], b - med[2]);
    const a = Math.max(0, Math.min(1, (dist - tol) / soft));
    d[k + 3] = Math.round(a * 255);
    if (isGreen && a < 1 && gg > Math.max(r, b)) d[k + 1] = Math.round(L2(Math.max(r, b), gg, a));   // despill edges
  }
  // edge band: JPEG colour bleed leaves a green rim on dark outlines. Within 2 px of the cut, pull green down to the
  // other channels and choke the outermost pixel a little (green objects keep their colour away from the edge).
  if (isGreen) {
    const A = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) A[i] = d[i * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (A[i] < 128) continue;
      let near = 3;
      for (let dy = -2; dy <= 2 && near > 1; dy++) for (let dx = -2; dx <= 2; dx++) {
        const yy = y + dy, xx = x + dx; if (yy < 0 || xx < 0 || yy >= h || xx >= w) continue;
        if (A[yy * w + xx] < 128) near = Math.min(near, Math.max(Math.abs(dx), Math.abs(dy)));
      }
      if (near > 2) continue;
      const k = i * 4, m = Math.max(d[k], d[k + 2]);
      if (d[k + 1] > m) d[k + 1] = m;
      if (near === 1) d[k + 3] = Math.round(d[k + 3] * 0.8);
    }
  }
  x.putImageData(id, 0, 0);
  return { canvas: c, data: d, w, h };
}
// connected components on a coarse alpha grid -> object boxes
function splitBoxes(d, w, h, minFrac = 0.004) {
  const cell = Math.max(2, Math.round(Math.max(w, h) / 300)), gw = Math.ceil(w / cell), gh = Math.ceil(h / cell);
  const occ = new Uint8Array(gw * gh);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (d[(y * w + x) * 4 + 3] > 120) occ[Math.floor(y / cell) * gw + Math.floor(x / cell)] = 1;
  const seen = new Uint8Array(gw * gh), boxes = [];
  for (let s = 0; s < occ.length; s++) {
    if (!occ[s] || seen[s]) continue;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0; const st = [s]; seen[s] = 1;
    while (st.length) {
      const p = st.pop(), px = p % gw, py = (p - px) / gw; n++;
      x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const qx = px + dx, qy = py + dy; if (qx < 0 || qy < 0 || qx >= gw || qy >= gh) continue;
        const qi = qy * gw + qx; if (occ[qi] && !seen[qi]) { seen[qi] = 1; st.push(qi); }
      }
    }
    if (n >= minFrac * gw * gh) boxes.push({ x: x0 * cell, y: y0 * cell, w: (x1 - x0 + 1) * cell, h: (y1 - y0 + 1) * cell });
  }
  const rowH = Math.max(...boxes.map(b => b.h), 1) * 0.6;
  return boxes.sort((a, b) => Math.abs(a.y - b.y) > rowH ? a.y - b.y : a.x - b.x);
}
// map: { name: 'path' | { src: 'path' | ['a.png', 'a.jpg'], split, anchor, key, tol, soft, optional } }
// optional sprites (the shared library) are skipped quietly when the file does not exist yet.
async function loadSprites(map) {
  await Promise.all(Object.entries(map).map(([name, spec]) => new Promise((res, rej) => {
    const o = typeof spec === 'string' ? { src: spec } : spec, im = new Image();
    const srcs = [].concat(o.src); let si = 0;
    im.onerror = () => { if (++si < srcs.length) im.src = srcs[si]; else if (o.optional) res(); else rej(new Error('missing sprite ' + srcs.join(' / '))); };
    im.onload = () => {
      const k = o.key === false ? null : keyImage(im, o.tol, o.soft);
      const canvas = k ? k.canvas : im, w = im.width, h = im.height;
      const frames = k ? splitBoxes(k.data, w, h, o.minFrac) : [{ x: 0, y: 0, w, h }];
      const list = o.split ? frames : [frames.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y) }))];
      SPR[name] = { canvas, frames: list, anchor: o.anchor || 'bottom', surface: o.surface, grip: o.grip, tip: o.tip, handle: o.handle };
      res();
    };
    im.src = srcs[0];
  })));
}
// the shared starter-pack library (inkshorts/_library, see docs/STARTER_PACK.md); loaded automatically when present
// (confetti stays code-drawn: generated confetti pieces are too tiny to cut out cleanly, and green ones vanish on green)
const LIBRARY = Object.fromEntries([['coin', 'coins'], ['bill', 'bills'], ['cash', 'cash'], ['dust', 'dust'], ['smoke', 'smoke'], ['sparkle', 'sparkles'],
  ['paper', 'papers'], ['impact', 'impact'], ['marks', 'marks'], ['drops', 'drops']]
  .map(([n, f]) => [n, { src: [`../_library/${f}.png`, `../_library/${f}.jpg`], split: true, optional: true, anchor: 'center', minFrac: n === 'confetti' ? 0.00003 : n === 'impact' ? 0.02 : 0.0006 }]));
const hasSprite = n => !!SPR[n];
// draw a sprite: height h in world units (or scale), anchor bottom-centre by default.
// o: { frame, h, scale, rot, sx, sy (squash/stretch), alpha, flip, anchor: 'bottom'|'center', shadow }
function drawSprite(name, x, y, o = {}) {
  const s = SPR[name]; if (!s) return;
  const f = s.frames[((o.frame || 0) % s.frames.length + s.frames.length) % s.frames.length];
  const sc = o.h ? o.h / f.h : (o.scale || 1), anc = o.anchor || s.anchor;
  const ay = anc === 'center' ? f.h / 2 : f.h;
  if (o.shadow) shadowBlob(x, y + (anc === 'center' ? f.h * sc / 2 : 0), f.w * sc * 0.42, f.w * sc * 0.07, 'rgba(20,10,10,.35)', 8);
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot);
  g.scale((o.flip ? -1 : 1) * sc * (o.sx || 1), sc * (o.sy || 1));
  if (o.alpha != null) g.globalAlpha = o.alpha;
  g.drawImage(s.canvas, f.x, f.y, f.w, f.h, -f.w / 2, -ay, f.w, f.h);
  g.restore();
}
// ---------- surfaces: the flat panel of a cut-out (phone screen, sign face, paper, board, label) ----------
// Found automatically: the largest area of one flat colour inside the picture, with its tilt; the rectangle returned
// lies wholly inside it. A sprite spec may give it instead: surface: [x0, y0, x1, y1] as fractions of the frame.
// Returns { cx, cy, w, h, rot } in frame pixels (cx, cy from the frame's top-left), or null.
const SURF = new Map();
function surfaceOf(name, frame = 0) {
  const key = name + '#' + frame; if (SURF.has(key)) return SURF.get(key);
  const s = SPR[name]; if (!s) return null;
  const f = s.frames[frame % s.frames.length];
  if (s.surface) { const [a, b, c2, d2] = s.surface; const r = { cx: f.w * (a + c2) / 2, cy: f.h * (b + d2) / 2, w: f.w * (c2 - a), h: f.h * (d2 - b), rot: 0 }; SURF.set(key, r); return r; }
  const N = 96, sc = N / Math.max(f.w, f.h), gw = Math.max(4, Math.round(f.w * sc)), gh = Math.max(4, Math.round(f.h * sc));
  const cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(s.canvas, f.x, f.y, f.w, f.h, 0, 0, gw, gh);
  const d = x.getImageData(0, 0, gw, gh).data, at = (i, j) => (j * gw + i) * 4;
  const col = (i, j) => [d[at(i, j)], d[at(i, j) + 1], d[at(i, j) + 2]], dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  // flat = opaque and the same colour as its four neighbours
  const flat = new Uint8Array(gw * gh);
  for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) {
    if (d[at(i, j) + 3] < 230) continue; const c = col(i, j);
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([u, v]) => d[at(i + u, j + v) + 3] > 230 && dist(c, col(i + u, j + v)) < 22)) flat[j * gw + i] = 1;
  }
  // biggest region of flat cells of one colour
  const lab = new Int32Array(gw * gh).fill(-1); let best = null;
  for (let s0 = 0; s0 < flat.length; s0++) {
    if (!flat[s0] || lab[s0] >= 0) continue;
    const seed = col(s0 % gw, (s0 / gw) | 0), cells = [], st = [s0]; lab[s0] = s0;
    while (st.length) {
      const p = st.pop(), pi = p % gw, pj = (p / gw) | 0; cells.push(p);
      for (const [u, v] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const qi = pi + u, qj = pj + v, q = qj * gw + qi;
        if (qi < 0 || qj < 0 || qi >= gw || qj >= gh || !flat[q] || lab[q] >= 0 || dist(seed, col(qi, qj)) > 30) continue;
        lab[q] = s0; st.push(q);
      }
    }
    if (!best || cells.length > best.cells.length) best = { id: s0, cells };
  }
  if (!best || best.cells.length < gw * gh * 0.04) { SURF.set(key, null); return null; }
  // tilt from the region's second moments (folded to -45..45 degrees), then the largest upright rectangle in that frame
  let mx = 0, my = 0; for (const p of best.cells) { mx += p % gw; my += (p / gw) | 0; } mx /= best.cells.length; my /= best.cells.length;
  let m20 = 0, m02 = 0, m11 = 0; for (const p of best.cells) { const u = p % gw - mx, v = ((p / gw) | 0) - my; m20 += u * u; m02 += v * v; m11 += u * v; }
  let rot = 0.5 * Math.atan2(2 * m11, m20 - m02); while (rot > Math.PI / 4) rot -= Math.PI / 2; while (rot < -Math.PI / 4) rot += Math.PI / 2;
  if (Math.abs(rot) < 0.03) rot = 0;
  const cs = Math.cos(rot), sn = Math.sin(rot), M = Math.ceil(Math.hypot(gw, gh)), inR = (u, v) => {
    const i = Math.round(mx + (u - M / 2) * cs - (v - M / 2) * sn), j = Math.round(my + (u - M / 2) * sn + (v - M / 2) * cs);
    return i >= 0 && j >= 0 && i < gw && j < gh && lab[j * gw + i] === best.id;
  };
  const hgt = new Int32Array(M); let R = null;
  for (let v = 0; v < M; v++) {
    for (let u = 0; u < M; u++) hgt[u] = inR(u, v) ? hgt[u] + 1 : 0;
    const stk = [];                           // largest rectangle under the histogram of this row
    for (let u = 0; u <= M; u++) {
      const hh = u < M ? hgt[u] : 0;
      while (stk.length && hgt[stk[stk.length - 1]] >= hh) {
        const top = stk.pop(), H0 = hgt[top], u0 = stk.length ? stk[stk.length - 1] + 1 : 0, area = H0 * (u - u0);
        if (!R || area > R.area) R = { area, u0, u1: u, v0: v - H0 + 1, v1: v + 1 };
      }
      stk.push(u);
    }
  }
  if (!R) { SURF.set(key, null); return null; }
  const uc = (R.u0 + R.u1 - 1) / 2 - M / 2, vc = (R.v0 + R.v1 - 1) / 2 - M / 2;
  const out = { cx: (mx + uc * cs - vc * sn + .5) / sc, cy: (my + uc * sn + vc * cs + .5) / sc, w: (R.u1 - R.u0 - 1) / sc, h: (R.v1 - R.v0 - 1) / sc, rot };
  SURF.set(key, out); return out;
}
// a sprite with words on its surface (phone screen, sign, letter, label): same options as drawSprite, plus
// o.text = { font, weight, color, pad, lines, max, alpha }. The words move, turn and squash with the sprite and can
// never leave the surface; if no surface is found the words are skipped and the render reports it.
function spriteText(name, text, x, y, o = {}) {
  drawSprite(name, x, y, o);
  const s = SPR[name]; if (!s || !text) return;
  const fi = ((o.frame || 0) % s.frames.length + s.frames.length) % s.frames.length, f = s.frames[fi], S = surfaceOf(name, fi);
  if (!S) { fitWarn(text, `no flat surface found on sprite '${name}' (give it surface: [x0,y0,x1,y1])`); return; }
  const sc = o.h ? o.h / f.h : (o.scale || 1), ay = (o.anchor || s.anchor) === 'center' ? f.h / 2 : f.h;
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot);
  g.scale((o.flip ? -1 : 1) * sc * (o.sx || 1), sc * (o.sy || 1));
  g.translate(S.cx - f.w / 2, S.cy - ay); g.rotate(S.rot); if (o.flip) g.scale(-1, 1);   // words never read mirrored
  if (o.alpha != null) g.globalAlpha = o.alpha;
  fitText(text, { x: -S.w / 2, y: -S.h / 2, w: S.w, h: S.h }, o.text || {});
  g.restore();
}

// ---------- tools in the hand (hammer, shovel, spear, axe, broom, torch...) ----------
// The handle end and the working end of a cut-out, found from its shape: the picture's long axis, and of its two ends
// the thinner one is the handle. A sprite spec may give them instead: grip: [fx, fy] (handle end), tip: [fx, fy]
// (working end), as fractions of the frame. Returns { a: handle end, b: working end } in frame pixels, or null.
const AXIS = new Map();
function toolAxis(name, frame = 0) {
  const key = name + '#' + frame; if (AXIS.has(key)) return AXIS.get(key);
  const s = SPR[name]; if (!s) return null;
  const f = s.frames[frame % s.frames.length];
  if (s.grip && s.tip) { const r = { a: [s.grip[0] * f.w, s.grip[1] * f.h], b: [s.tip[0] * f.w, s.tip[1] * f.h] }; AXIS.set(key, r); return r; }
  const N = 128, sc = N / Math.max(f.w, f.h), gw = Math.max(4, Math.round(f.w * sc)), gh = Math.max(4, Math.round(f.h * sc));
  const cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(s.canvas, f.x, f.y, f.w, f.h, 0, 0, gw, gh);
  const d = x.getImageData(0, 0, gw, gh).data, P = [];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (d[(j * gw + i) * 4 + 3] > 128) P.push([i + .5, j + .5]);
  if (P.length < 8) { AXIS.set(key, null); return null; }
  let mx = 0, my = 0; for (const [i, j] of P) { mx += i; my += j; } mx /= P.length; my /= P.length;
  let m20 = 0, m02 = 0, m11 = 0; for (const [i, j] of P) { const u = i - mx, v = j - my; m20 += u * u; m02 += v * v; m11 += u * v; }
  const th = 0.5 * Math.atan2(2 * m11, m20 - m02), ux = Math.cos(th), uy = Math.sin(th);
  const pr = P.map(([i, j]) => [(i - mx) * ux + (j - my) * uy, -(i - mx) * uy + (j - my) * ux]);
  const u0 = Math.min(...pr.map(p => p[0])), u1 = Math.max(...pr.map(p => p[0])), span = u1 - u0 || 1;
  // thickness and centre line of the last fifth at each end
  const end = lo => { const q = pr.filter(p => lo ? p[0] < u0 + span * .2 : p[0] > u1 - span * .2), vs = q.map(p => p[1]);
    return { wid: Math.max(...vs) - Math.min(...vs), v: vs.reduce((a, b) => a + b, 0) / (vs.length || 1) }; };
  const A = end(true), B = end(false), pt = (u, v) => [(mx + u * ux - v * uy) / sc, (my + u * uy + v * ux) / sc];
  const lo = [pt(u0, A.v), A.wid], hi = [pt(u1, B.v), B.wid];
  // thinner end = handle works for hammers, axes, spears, torches - but a blade or a pen tapers to its POINT, so for
  // those the wider end is the handle (user, 2026-11-09: a knife held by the blade). s.handle: 'thin' | 'wide' forces it
  const wide = s.handle ? s.handle === 'wide' : /knife|sword|dagger|blade|machete|cleaver|razor|scalpel|scissor|pen$|pencil|quill|key/i.test(name);
  const r = (lo[1] <= hi[1]) !== wide ? { a: lo[0], b: hi[0] } : { a: hi[0], b: lo[0] };
  AXIS.set(key, r); return r;
}
// hold a cut-out tool in a character's hand: arms: [..., { h, prop: holdProp('hammer', ang, { len: 380 }) }].
// The hand closes on the handle near its end, the working end points along ang (radians: 0 = right, -PI/2 = up), and
// the ink-ball hand is drawn over the handle by the character. o: { len: handle-to-head length in rig units (hammer
// ~380, axe ~520, shovel ~900, spear ~1300), grip: where the hand holds, 0 = handle end .. 1 = working end (default
// .1; a spear or broom ~.4), flip: mirror the picture across its own axis (claw / blade on the other side), frame }.
// Never draw a tool by its centre at the hand (user: a hammer held by the head).
function holdProp(name, ang, o = {}) { return h => drawHeld(name, h, ang, o); }
function drawHeld(name, h, ang, o = {}) {
  const s = SPR[name]; if (!s) return;
  const fi = ((o.frame || 0) % s.frames.length + s.frames.length) % s.frames.length, f = s.frames[fi], A = toolAxis(name, fi); if (!A) return;
  const dx = A.b[0] - A.a[0], dy = A.b[1] - A.a[1], L = Math.hypot(dx, dy) || 1, sc = (o.len || 380) / L, k = o.grip ?? .1;
  g.save(); g.translate(h[0], h[1]); g.rotate(ang); g.scale(sc, sc * (o.flip ? -1 : 1)); g.rotate(-Math.atan2(dy, dx));
  g.translate(-L2(A.a[0], A.b[0], k), -L2(A.a[1], A.b[1], k));
  if (o.alpha != null) g.globalAlpha = o.alpha;
  g.drawImage(s.canvas, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  g.restore();
}
// rig point of a held tool's working end (for the hit spark / dust / what it touches): heldEnd(hand, ang, { len, grip })
const heldEnd = (h, ang, o = {}) => { const l = (o.len || 380) * (1 - (o.grip ?? .1)); return [h[0] + Math.cos(ang) * l, h[1] + Math.sin(ang) * l]; };

// squash & stretch for a landing / hit at t0 (returns {sx, sy}); amount 0..1
function squashAt(t, t0, amount = 1) {
  if (t < t0) return { sx: 1, sy: 1 };
  const k = Math.exp(-6 * (t - t0)) * Math.cos(14 * (t - t0)) * 0.22 * amount;
  return { sx: 1 + k, sy: 1 - k };
}
// bounce in from above, landing at t0 on (x, y)
function dropIn(name, t, t0, x, y, o = {}) {
  if (t < t0 - 0.4) return;
  const k = clamp01((t - (t0 - 0.4)) / 0.4), yy = y - (1 - k * k) * 600;
  drawSprite(name, x, t < t0 ? yy : y, Object.assign({ shadow: t >= t0 }, o, squashAt(t, t0, 1)));
}
// shatter a sprite into pieces of its own picture at t0 (pieces fly, spin, fall, bounce once on floorY)
const SHARDS = new Map();
function shardsOf(name, n) {
  const key = name + n; if (SHARDS.has(key)) return SHARDS.get(key);
  const f = SPR[name].frames[0], cols = Math.max(2, Math.round(Math.sqrt(n * f.w / f.h))), rows = Math.max(2, Math.ceil(n / cols));
  const P = (i, j) => [f.x + f.w * (i + (i > 0 && i < cols ? (hash(i * 31 + j) - .5) * .6 : 0)) / cols, f.y + f.h * (j + (j > 0 && j < rows ? (hash(i * 17 + j * 5) - .5) * .6 : 0)) / rows];
  const out = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1), flip = hash(i + j * 7) < .5;
    for (const tri of flip ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]) out.push(tri);
  }
  SHARDS.set(key, out); return out;
}
function shatterSprite(name, t, t0, x, y, o = {}) {
  const s = SPR[name]; if (!s) return;
  const f = s.frames[0], sc = o.h ? o.h / f.h : (o.scale || 1);
  if (t < t0) { drawSprite(name, x, y, o); return; }
  const pieces = shardsOf(name, o.pieces || 16), dt = 1 / 120;
  pieces.forEach((tri, i) => {
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
    // start at its place in the sprite (anchor bottom-centre at x,y), fly outward from the centre
    let px = x + (cx - f.x - f.w / 2) * sc, py = y + (cy - f.y - f.h) * sc;
    const ox = cx - (f.x + f.w / 2), oy = cy - (f.y + f.h / 2), l = Math.hypot(ox, oy) || 1;
    let vx = ox / l * (500 + hash(i) * 700) * (o.speed || 1), vy = -500 - hash(i + 9) * 900 + oy / l * 300;
    let tt = t0, bounced = false;
    while (tt + dt <= t) { vy += 2600 * dt; px += vx * dt; py += vy * dt; tt += dt; if (!bounced && o.floorY && vy > 0 && py > o.floorY) { py = o.floorY; vy *= -0.3; vx *= 0.5; bounced = true; } }
    const rot = (t - t0) * (hash(i + 3) - .5) * 14;
    g.save(); g.translate(px, py); g.rotate(rot); g.scale(sc, sc);
    g.beginPath(); tri.forEach(([qx, qy], k) => (k ? g.lineTo(qx - cx, qy - cy) : g.moveTo(qx - cx, qy - cy))); g.closePath(); g.clip();
    g.drawImage(s.canvas, f.x, f.y, f.w, f.h, f.x - cx, f.y - cy, f.w, f.h);
    g.restore();
  });
}
// flip-book: cycle a sheet's frames (e.g. 4 gallop poses) at fps, with a small bob
function flipbook(name, t, fps, x, y, o = {}) {
  const s = SPR[name]; if (!s) return;
  const fr = Math.floor(t * fps), bob = (o.bob ?? 10) * Math.abs(Math.sin(t * fps * Math.PI / s.frames.length));
  drawSprite(name, x, y - bob, Object.assign({}, o, { frame: (o.frame0 || 0) + fr }));
}
