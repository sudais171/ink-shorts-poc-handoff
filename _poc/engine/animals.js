// Ink Shorts engine - four-legged animals (side view, facing right; hooves/paws on y = 0 local).
// One rig, several species presets. Gaits: 'stand', 'walk', 'trot', 'gallop'.
// animalDraw({ kind, x, y, k, phase, gait, flip, col, ... overrides, rider:{c,P}, cloth, num, harness, sleepy, droop, look })

const SPECIES = {
  horse: { rx: 150, ry: 68, leg: 150, legW: 20, neckLen: 1, head: 'horse', tail: 'long', col: '#8a4b2a', mane: '#2a1a12', hoof: INK },
  pony: { rx: 120, ry: 62, leg: 115, legW: 19, neckLen: .85, head: 'horse', tail: 'long', col: '#b9b2a8', mane: '#f0ebe0', hoof: INK },
  dog: { rx: 95, ry: 46, leg: 85, legW: 17, neckLen: .45, head: 'dog', tail: 'up', col: '#c98a4a', ears: 'flop', hoof: INK },
  cow: { rx: 165, ry: 82, leg: 115, legW: 24, neckLen: .5, head: 'cow', tail: 'thin', col: '#f2efe8', spots: '#2f2a2e', hoof: INK },
  pig: { rx: 120, ry: 70, leg: 60, legW: 20, neckLen: .25, head: 'pig', tail: 'curl', col: '#f6a5b8', hoof: '#7a3a4a' },
  cat: { rx: 80, ry: 38, leg: 70, legW: 13, neckLen: .4, head: 'cat', tail: 'up', col: '#7a7a86', ears: 'point', hoof: INK },
};
const GAITS = {   // [front near, hind near, front far, hind far] phase offsets, swing amplitude, knee fold, cycles per metre
  stand: { off: [0, 0, 0, 0], A: 0, kb: 0 },
  walk: { off: [0, Math.PI * 1.5, Math.PI, Math.PI * .5], A: 0.3, kb: 0.5 },
  trot: { off: [0, Math.PI, Math.PI, 0], A: 0.45, kb: 0.9 },
  gallop: { off: [0, Math.PI * 1.25, Math.PI * .3, Math.PI * 1.55], A: 0.8, kb: 1.0 },
};

// ---------- horse: one side-profile silhouette (chest, barrel, rump, neck, head), tapered legs with a real hock ----------
// local units: ground y = 0, ~360 long and ~330 to the ears at scale 1, facing right
const HORSE_BODY = [[60, -300], [-20, -284], [-90, -290], [-150, -300], [-195, -270], [-207, -222], [-190, -180], [-150, -150], [-40, -138], [60, -148], [118, -175], [140, -222], [134, -262]];
const HORSE_NECKHEAD = [[134, -262], [196, -356], [264, -322], [276, -334], [268, -352], [218, -414], [180, -424], [118, -368], [60, -300]];
function horseDraw(o) {
  const s = 0.75, gait = GAITS[o.gait || 'stand'], ph = o.phase || 0;
  const col = o.col || '#8a4b2a', light = o.light || shade(col, .28), dark = o.dark || shade(col, -.3), far = shade(col, -.42), mane = o.mane || '#2a1a12';
  g.save(); g.translate(o.x, o.y); g.scale((o.flip ? -1 : 1) * o.k * s, o.k * s);
  const gal = o.gait === 'gallop';
  const bob = gal ? -16 * Math.sin(2 * ph) : o.gait === 'trot' ? -9 * Math.abs(Math.sin(ph)) : o.gait === 'walk' ? -4 * Math.abs(Math.sin(ph)) : 0;
  g.translate(0, bob); if (gal) { g.translate(0, -170); g.rotate(0.05 * Math.sin(ph + 0.6)); g.translate(0, 170); }
  // neck/head pivot at the base of the neck: droop hangs it, a gallop stretches it forward
  const nAng = (o.droop || 0) * 0.95 + (gal ? 0.22 : 0) + 0.04 * Math.sin(ph * (gal ? 2 : 1)), pv = [100, -282];
  const rot = p => { const dx = p[0] - pv[0], dy = p[1] - pv[1], c = Math.cos(nAng), sn = Math.sin(nAng); return [pv[0] + dx * c - dy * sn, pv[1] + dx * sn + dy * c]; };
  const nh = HORSE_NECKHEAD.map((p, i) => (i === 0 || i === HORSE_NECKHEAD.length - 1) ? p : rot(p));
  const legDef = [[100, -172, 'f', 0], [-150, -176, 'h', 1], [78, -172, 'f', 2], [-170, -180, 'h', 3]];
  const leg = (i, c) => {
    const [ax, ay, kind, gi] = legDef[i], p = ph + gait.off[gi], lift = Math.max(0, Math.cos(p));
    let a1, a2;
    if (kind === 'f') { a1 = gait.A * Math.sin(p); a2 = -gait.kb * 1.3 * lift; }
    else { a1 = -0.3 + gait.A * 0.85 * Math.sin(p); a2 = 0.3 + gait.kb * 0.6 * lift; }
    const L1 = kind === 'f' ? 82 : 86, Lb = kind === 'f' ? 92 : 92;
    const k = [ax + Math.sin(a1) * L1, ay + Math.cos(a1) * L1], f = [k[0] + Math.sin(a1 + a2) * Lb, k[1] + Math.cos(a1 + a2) * Lb];
    const w = t => t < 0.5 ? L2(34, 17, t * 2) : L2(17, 14, (t - .5) * 2);
    brush(spline([[ax, ay], k, f], 6), t => w(t) + 9, INK); brush(spline([[ax, ay], k, f], 6), w, c);
    g.fillStyle = INK; g.beginPath(); g.ellipse(f[0] + 5, f[1] - 2, 15, 11, 0, 0, 7); g.fill();
  };
  leg(2, far); leg(3, far);
  // tail from the top of the rump: hangs and swishes, streams out behind at a gallop
  const tw = Math.sin(ph * (gal ? 1 : .5));
  for (let i = 0; i < 3; i++) {
    const pts = gal ? [[-196, -272], [-250, -282 + i * 10], [-320 - i * 12, -262 + 14 * tw + i * 14]] : [[-196, -272], [-238, -250 + i * 8], [-246 - i * 8 + 10 * tw, -150 + i * 10]];
    brush(spline(pts), taper(26 - i * 5, .15, .5, .25), mane);
  }
  // body + neck/head silhouette
  const sil = spline(HORSE_BODY.concat(nh.slice(1, -1)).concat([HORSE_BODY[0]]), 8);
  let gr = g.createLinearGradient(0, -420, 0, -140); gr.addColorStop(0, light); gr.addColorStop(.55, col); gr.addColorStop(1, dark);
  g.fillStyle = gr; path(sil); g.fill();
  if (o.dapple) { g.save(); path(sil); g.clip(); for (let i = 0; i < 46; i++) { g.fillStyle = 'rgba(255,255,255,.32)'; g.beginPath(); g.arc(-200 + hash(i) * 330, -300 + hash(i + 40) * 150, 7 + hash(i + 80) * 11, 0, 7); g.fill(); } g.restore(); }
  inkRing(sil, 3, 10);
  // mane along the crest, ear, eye, nostril
  for (let i = 0; i < 6; i++) { const p = V2(rot([176, -420]), [64, -302], i / 5); brush([[p[0] + 4, p[1] - 6], [p[0] - 22, p[1] + 16]], taper(18, .3, .3, .3), mane); }
  fillInk([rot([176, -420]), rot([186, -466]), rot([202, -418])], col, 2, 5);
  const eye = rot([206, -394]); g.fillStyle = INK; g.beginPath(); g.arc(eye[0], eye[1], 7, 0, 7); g.fill();
  if (o.sleepy) brush([[eye[0] - 11, eye[1] - 3], [eye[0] + 11, eye[1] - 3]], () => 6);
  const nos = rot([262, -334]); g.beginPath(); g.ellipse(nos[0], nos[1], 5, 4, 0, 0, 7); g.fill();
  if (o.harness) { brush(spline([rot([150, -300]), [150, -240], [128, -186]]), () => 22, '#5a3418'); brush([[120, -230], [260, -205]], () => 9, '#3a2418'); }
  // saddle cloth and crouched rider
  if (o.cloth) {
    fillInk([[-60, -296], [52, -300], [56, -212], [-64, -208]], o.cloth, 2, 5);
    if (o.num) { g.fillStyle = INK; g.font = '900 60px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.num, -4, -252); }
  }
  if (o.rider) {
    g.save(); g.translate(10, -298); const jk = 0.22; g.scale(jk, jk); g.translate(-HIP[0], -HIP[1]);
    charDraw(o.rider.c, Object.assign({ legs: 'none' }, o.rider.P));
    g.restore();
    brush(spline([[8, -300], [56, -262], [30, -214]]), taper(20, .1, .1, .8));        // rider's leg and boot in the stirrup
    g.fillStyle = INK; g.beginPath(); g.ellipse(38, -212, 15, 9, 0, 0, 7); g.fill();
  }
  leg(0, col); leg(1, col);
  g.restore();
}

function animalDraw(o) {
  if (!o.kind || o.kind === 'horse' || o.kind === 'pony') return horseDraw(o.kind === 'pony' ? Object.assign({ col: '#b9b2a8', mane: '#f0ebe0' }, o, { k: o.k * 0.8 }) : o);
  const sp = Object.assign({}, SPECIES[o.kind], o);
  const gait = GAITS[o.gait || 'stand'], ph = o.phase || 0;
  const col = sp.col, light = sp.light || shade(col, .25), dark = sp.dark || shade(col, -.3), far = sp.far || shade(col, -.42);
  g.save(); g.translate(o.x, o.y); g.scale((o.flip ? -1 : 1) * o.k, o.k);
  const bob = o.gait === 'gallop' ? -14 * Math.sin(2 * ph) : o.gait === 'trot' ? -8 * Math.abs(Math.sin(ph)) : o.gait === 'walk' ? -3 * Math.abs(Math.sin(ph)) : -2 * Math.sin(ph * .3);
  const pitch = o.gait === 'gallop' ? 0.06 * Math.sin(ph + 0.6) : 0;
  const by = -(sp.leg + sp.ry * 0.55);     // body centre height above the ground
  g.translate(0, by + bob); g.rotate(pitch);
  const legAt = [[sp.rx * .62, sp.ry * .35, 'f'], [-sp.rx * .62, sp.ry * .35, 'h'], [sp.rx * .52, sp.ry * .3, 'f'], [-sp.rx * .72, sp.ry * .3, 'h']];
  const leg = (i, c) => {
    const [ax, ay, kind] = legAt[i], p = ph + gait.off[i];
    const lift = Math.max(0, Math.cos(p)), a1 = gait.A * Math.sin(p) * (kind === 'h' ? 0.8 : 1);
    const a2 = gait.kb * lift * (kind === 'f' ? -1 : 0.7);
    const L1 = sp.leg * 0.5, L2_ = sp.leg * 0.52 - (kind === 'h' ? 0 : 0);
    const kx = ax + Math.sin(a1) * L1, ky = ay + Math.cos(a1) * L1;
    const fx = kx + Math.sin(a1 + a2) * L2_, fy = ky + Math.cos(a1 + a2) * L2_;
    brush([[ax, ay], [kx, ky], [fx, fy]], () => sp.legW * 1.6, INK); brush([[ax, ay], [kx, ky], [fx, fy]], () => sp.legW, c);
    g.fillStyle = sp.hoof; g.beginPath(); g.ellipse(fx + 5, fy + 4, sp.legW * .75, sp.legW * .5, 0, 0, 7); g.fill();
  };
  leg(2, far); leg(3, far);
  // tail
  const tw = Math.sin(ph * (o.gait === 'gallop' ? 1 : .5));
  const tx = -sp.rx * .95, ty = -sp.ry * .45;
  if (sp.tail === 'long') for (let i = 0; i < 3; i++) brush(spline([[tx, ty], [tx - 60, ty + 20 + i * 10 - (o.gait === 'gallop' ? 30 : 0)], [tx - 85 - 10 * i, ty + 110 + 20 * tw + i * 12 - (o.gait === 'gallop' ? 70 : 0)]]), taper(22 - i * 4, .2, .4, .3), sp.mane || dark);
  else if (sp.tail === 'up') brush(spline([[tx + 10, ty], [tx - 30, ty - 40 + 8 * tw], [tx - 20, ty - 90 + 10 * tw]]), taper(16, .2, .5, .3), col);
  else if (sp.tail === 'curl') brush(spline([[tx, ty + 10], [tx - 30, ty], [tx - 30, ty - 25], [tx - 12, ty - 20]]), () => 7, INK);
  else brush(spline([[tx, ty], [tx - 20, ty + 60], [tx - 15 + 6 * tw, ty + 130]]), taper(8, .1, .1, .6), dark);
  // body
  const body = ellPts(0, 0, sp.rx, sp.ry, 60);
  g.save(); path(body); g.clip();
  let gr = g.createLinearGradient(0, -sp.ry, 0, sp.ry); gr.addColorStop(0, light); gr.addColorStop(.6, col); gr.addColorStop(1, dark);
  g.fillStyle = gr; g.fillRect(-sp.rx - 10, -sp.ry - 10, sp.rx * 2 + 20, sp.ry * 2 + 20);
  if (sp.dapple) for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc((hash(i) - .5) * sp.rx * 1.8, (hash(i + 40) - .5) * sp.ry * 1.5, 8 + hash(i + 80) * 12, 0, 7); g.fill(); }
  if (sp.spots) for (let i = 0; i < 7; i++) { g.fillStyle = sp.spots; g.beginPath(); g.ellipse((hash(i * 3) - .5) * sp.rx * 1.6, (hash(i * 3 + 1) - .6) * sp.ry * 1.4, 25 + hash(i) * 30, 18 + hash(i + 9) * 20, hash(i) * 3, 0, 7); g.fill(); }
  g.restore();
  inkRing(body, 3, 9);
  // neck + head (droop 0..1 hangs the head low)
  const droop = o.droop || 0, nl = sp.neckLen;
  const hx = sp.rx * .62 + 90 * nl, hy = -sp.ry * .55 - 120 * nl + droop * 150 * nl;
  if (nl > 0.3) {
    const nk = spline([[sp.rx * .62, -sp.ry * .55], [L2(sp.rx * .62, hx, .5) + 10, L2(-sp.ry * .55, hy, .5) - 8], [hx - 10, hy - 10], [hx + 30, hy + 20], [L2(sp.rx * .75, hx, .5) + 35, L2(sp.ry * .1, hy, .5) + 20], [sp.rx * .8, sp.ry * .25], [sp.rx * .62, -sp.ry * .55]], 8);
    g.save(); path(nk); g.clip(); g.fillStyle = gr; g.fillRect(sp.rx * .3, hy - 60, 260, 300); g.restore(); inkRing(nk, 3, 8);
    if (sp.mane && sp.head === 'horse') for (let i = 0; i < 5; i++) { const p = V2([sp.rx * .6, -sp.ry * .6], [hx - 15, hy - 15], i / 4); brush([[p[0] + 4, p[1] - 4], [p[0] - 14, p[1] + 18]], taper(16, .3, .3, .3), sp.mane); }
  }
  if (sp.harness) { brush(spline([[sp.rx * .55, -sp.ry * .7], [sp.rx * .78, -sp.ry * .1], [sp.rx * .7, sp.ry * .4]]), () => 18, '#5a3418'); brush([[sp.rx * .65, -sp.ry * .1], [sp.rx * 1.2, sp.ry * .1]], () => 8, '#3a2418'); }
  headOf(sp, hx, hy, droop, o, gr);
  // saddle cloth and rider
  if (o.cloth) {
    fillInk([[-sp.rx * .4, -sp.ry * .9], [sp.rx * .3, -sp.ry * .9], [sp.rx * .33, sp.ry * .25], [-sp.rx * .43, sp.ry * .25]], o.cloth, 2, 5);
    if (o.num) { g.fillStyle = INK; g.font = `900 ${Math.round(sp.ry * .75)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.num, -sp.rx * .05, -sp.ry * .3); }
  }
  if (o.rider) {
    g.save(); g.translate(-10, -sp.ry * .9); const jk = 0.24 * sp.rx / 150; g.scale(jk, jk); g.translate(-HIP[0], -HIP[1]);
    charDraw(o.rider.c, Object.assign({ legs: 'none' }, o.rider.P));
    brush(spline([[640, 1480], [700, 1640], [660, 1760]]), () => 28);   // rider's leg down the horse's side
    g.restore();
  }
  leg(0, col); leg(1, col);
  g.restore();
}

function headOf(sp, hx, hy, droop, o, gr) {
  const eye = (x, y, r = 6) => { g.fillStyle = INK; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); if (o.sleepy) brush([[x - 10, y - 2], [x + 10, y - 2]], () => 5); };
  if (sp.head === 'horse') {
    const rot = 0.55 + droop * 0.5, hd = ellPts(hx + 35, hy + 15, 64, 30, 40, rot);
    g.save(); path(hd); g.clip(); g.fillStyle = gr; g.fillRect(hx - 60, hy - 80, 200, 200); g.restore(); inkRing(hd, 3, 8);
    fillInk([[hx - 8, hy - 18], [hx, hy - 55], [hx + 14, hy - 14]], sp.col, 2, 5);
    eye(hx + 10, hy - 2); g.fillStyle = INK; g.beginPath(); g.arc(hx + 35 + Math.cos(rot) * 55, hy + 15 + Math.sin(rot) * 55, 4, 0, 7); g.fill();
  } else if (sp.head === 'dog') {
    fillInk(ellPts(hx + 15, hy + 5, 48, 42, 36), sp.col, 3, 8);
    fillInk(ellPts(hx + 58, hy + 20, 30, 20, 24), shade(sp.col, .3), 2, 6);
    g.fillStyle = INK; g.beginPath(); g.ellipse(hx + 84, hy + 12, 10, 8, 0, 0, 7); g.fill();
    eye(hx + 30, hy - 8);
    const flap = Math.sin((o.phase || 0) * 1.2) * 0.2;
    g.save(); g.translate(hx - 5, hy - 25); g.rotate(0.5 + flap); fillInk(ellPts(0, 30, 16, 36, 24), shade(sp.col, -.35), 2, 5); g.restore();
    if (o.tongue) fillInk(ellPts(hx + 62, hy + 44, 9, 16, 16), '#e46a7c', 2, 4);
  } else if (sp.head === 'cow') {
    fillInk([[hx - 30, hy - 40], [hx + 50, hy - 40], [hx + 70, hy + 50], [hx - 10, hy + 55]], sp.col, 3, 8);
    fillInk(ellPts(hx + 32, hy + 50, 44, 26, 30), '#f2b4b4', 3, 6);
    for (const s of [-1, 1]) brush(spline([[hx + 10 + s * 25, hy - 38], [hx + 10 + s * 45, hy - 62], [hx + 10 + s * 40, hy - 80]]), taper(14, .1, .6, .3), '#efe2c0');
    eye(hx + 30, hy - 8);
  } else if (sp.head === 'pig') {
    fillInk(ellPts(hx + 20, hy + 20, 50, 46, 36), sp.col, 3, 8);
    fillInk(ellPts(hx + 66, hy + 26, 22, 18, 24), shade(sp.col, .2), 2, 6);
    g.fillStyle = INK; for (const d of [-6, 6]) { g.beginPath(); g.ellipse(hx + 70, hy + 26 + d, 4, 6, 0, 0, 7); g.fill(); }
    eye(hx + 34, hy + 4); fillInk([[hx, hy - 20], [hx + 20, hy - 50], [hx + 30, hy - 15]], sp.col, 2, 5);
  } else if (sp.head === 'cat') {
    fillInk(ellPts(hx + 15, hy + 5, 40, 34, 36), sp.col, 3, 8);
    for (const s of [-1, 1]) fillInk([[hx + 15 + s * 12, hy - 22], [hx + 15 + s * 30, hy - 58], [hx + 15 + s * 34, hy - 12]], sp.col, 2, 5);
    eye(hx + 4, hy, 5); eye(hx + 30, hy, 5);
    for (const s of [-1, 1]) brush([[hx + 40, hy + 14], [hx + 70, hy + 10 + s * 8]], () => 2);
  }
}
