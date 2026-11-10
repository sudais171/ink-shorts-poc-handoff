// Ink Shorts engine - movement in 3D sets: people walking routes, and the camera moves a story picks from.
// Loaded after set3d.js. Every camera move is a function of time t -> { pos, at, fov } for S.render(...);
// every walk is a route a person card follows (S.person(c, R.pose(...), null, { walk: R })).
// Units: 1 = a person's height. Angles: 0 = towards +z, PI/2 = towards +x.

// ---------- walking ----------
// WALK.route(points [[x, z] or [x, z, y], ...], { t0, speed, stops: { index: seconds } }) - walks point to point from
// t0 at `speed` person-heights a second (.9 calm, 1.3 hurrying), waiting at stops; y lets a route climb stairs or
// drop into a hole. Returns at(t), y(t), face(t), vel(t), moving(t), dist(t), end, pose(t, extra).
const WALK = {
  route(pts, o = {}) {
    const sp = o.speed ?? .9, stops = o.stops || {}, P = pts.map(p => [p[0], p[2] ?? 0, p[1]]);
    const seg = []; let t = o.t0 ?? 0, d = 0;
    for (let i = 0; i < P.length - 1; i++) {
      if (stops[i]) { seg.push({ a: P[i], b: P[i], t0: t, t1: t + stops[i], d0: d, d1: d }); t += stops[i]; }
      const L = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][2] - P[i][2]) || 1e-6;
      seg.push({ a: P[i], b: P[i + 1], t0: t, t1: t + L / sp, d0: d, d1: d + L }); t += L / sp; d += L;
    }
    // people take longer steps when they walk faster (at a calm .75 the step is STRIDE_A; hurrying, up to 1.35x),
    // so a quick walker strides instead of scurrying; the leg cycle and the footstep sounds use the same angle
    const A0 = o.strideA ?? STRIDE_A * Math.max(.9, Math.min(1.35, sp / .75));
    const R = { end: t, dist: 0, run: !!o.run, strideA: A0 };
    const find = tt => seg.find(s => tt <= s.t1) || seg[seg.length - 1];
    const at3 = tt => { const s = tt <= seg[0].t0 ? seg[0] : find(tt), k = s.t1 > s.t0 ? clamp01((tt - s.t0) / (s.t1 - s.t0)) : 1; return [L2(s.a[0], s.b[0], k), L2(s.a[1], s.b[1], k), L2(s.a[2], s.b[2], k)]; };
    R.at = tt => { const p = at3(tt); return [p[0], p[2]]; };
    R.y = tt => at3(tt)[1];
    R.dist = tt => { if (tt <= seg[0].t0) return 0; const s = find(tt); return L2(s.d0, s.d1, s.t1 > s.t0 ? clamp01((tt - s.t0) / (s.t1 - s.t0)) : 1); };
    R.vel = tt => { const a = R.at(tt - .05), b = R.at(tt + .05); return [(b[0] - a[0]) * 10, (b[1] - a[1]) * 10]; };
    R.moving = tt => { const v = R.vel(tt); return Math.hypot(v[0], v[1]) > .05; };
    let lastFace = o.face ?? 0;
    R.face = tt => {                               // the way they face: the way they walk (kept while standing)
      const v = R.vel(tt); if (Math.hypot(v[0], v[1]) > .05) return Math.atan2(v[0], v[1]);
      for (let k = .1; k < 3; k += .1) { const w = R.vel(tt - k); if (Math.hypot(w[0], w[1]) > .05) return Math.atan2(w[0], w[1]); }
      return lastFace;
    };
    // the walking pose: legs driven by the distance walked (feet don't slide), arm swing, bob; an idle stance when still
    // (o.run: running - longer strides, pumping arms, leaning into it)
    R.pose = (tt, extra = {}) => {
      if (!R.moving(tt)) return { legs: 'stand', arms: [ARM.side(-1), ARM.side(1)], ...extra };
      if (o.run) { const p = R.dist(tt) * CHAR_H / 165; return { legs: 'run', walkPhase: p, face: 1, turn: .85, bounce: 26 * Math.abs(Math.cos(p)), lean: .26, hr: -.06 + .03 * Math.sin(p), arms: [ARM.pump(-1, p, 1), ARM.pump(1, p, 1)], ...extra }; }
      // the stride walk: PI of phase per step, a step = 2 * LEG * sin(strideA) rig units, so the feet keep pace
      const A = A0, p = R.dist(tt) * CHAR_H / (2 * LEG * Math.sin(A)) * Math.PI;
      return { legs: 'stride', walkPhase: p, strideA: A, face: 1, turn: .85, lean: -.02, hr: .015 * Math.sin(p * 2), arms: [ARM.swing(-1, p), ARM.swing(1, p)], ...extra };
    };
    return R;
  },
};

// ---------- camera moves ----------
const C3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  lerp: (a, b, k) => [L2(a[0], b[0], k), L2(a[1], b[1], k), L2(a[2], b[2], k)],
  dir: ang => [Math.sin(ang), 0, Math.cos(ang)],
};
const tgt = (p, t) => { const v = valAt(p, t); return v.length === 2 ? [v[0], 0, v[1]] : v; };   // [x, z] or [x, y, z]
// a camera's roll rides on the move ({ pos, at, fov, roll }) and on its pos array too, so V.render(c.pos, c.at, c.fov)
// in older scenes still tilts
const withRoll = (c, r) => { if (r) { c.pos = c.pos.slice(); c.pos.roll = r; } c.roll = r; return c; };
const CAM = {
  // stay put, creeping forward a little (drift = person-heights a second) so the frame never freezes
  hold: ({ pos, at, fov = 50, drift = .03, t0 = 0 }) => t => {
    const d = [at[0] - pos[0], at[1] - pos[1], at[2] - pos[2]], l = Math.hypot(...d) || 1, k = drift * Math.max(0, t - t0) / l;
    return { pos: C3.add(pos, C3.mul(d, k)), at, fov };
  },
  // push in (or pull out) on a target: from / to = distance, ang = the side the camera is on, h = camera height
  push: (target, { t0, t1, from = 4, to = 2, ang = 0, h = 1.1, h1, atY = .6, fov = 50 }) => t => {
    const k = ss2(t0, t1, t), T = tgt(target, t), d = L2(from, to, k), D = C3.dir(ang);
    return { pos: [T[0] + D[0] * d, L2(h, h1 ?? h, k), T[2] + D[2] * d], at: [T[0], T[1] + atY, T[2]], fov };
  },
  // crane: rise or sink while looking at a target (an establishing drop from the sky, or a rise to show the place)
  crane: (target, { t0, t1, dist = 5, ang = 0, h0 = 6, h1 = 1.3, atY0 = 2, atY1 = .7, dist1, fov = 50 }) => t => {
    const k = ss2(t0, t1, t), T = tgt(target, t), d = L2(dist, dist1 ?? dist, k), D = C3.dir(ang);
    return { pos: [T[0] + D[0] * d, L2(h0, h1, k), T[2] + D[2] * d], at: [T[0], T[1] + L2(atY0, atY1, k), T[2]], fov };
  },
  // arc: circle round a centre (two people talking, a reveal) from angle a0 to a1 at radius r
  arc: (center, { t0, t1, r = 2.5, a0 = -.6, a1 = .6, h = 1.1, atY = .62, fov = 52 }) => t => {
    const k = ss2(t0, t1, t), C = tgt(center, t), a = L2(a0, a1, k);
    return { pos: [C[0] + Math.sin(a) * r, h, C[2] + Math.cos(a) * r], at: [C[0], C[1] + atY, C[2]], fov };
  },
  // follow someone walking: the camera keeps to one side of them (ang = the side), smoothed so it glides
  follow: (who, { dist = 3, ang = 0, h = 1.15, atY = .62, lead = .3, lag = .35, fov = 50 }) => t => {
    let x = 0, z = 0, y = 0; const n = 6;
    for (let i = 0; i < n; i++) { const p = tgt(who, t - lag * i / n + lead * .3); x += p[0] / n; y += p[1] / n; z += p[2] / n; }
    const D = C3.dir(ang);
    return { pos: [x + D[0] * dist, y + h, z + D[2] * dist], at: [x, y + atY, z], fov };
  },
  // look up from low down (a tower, a giant, a scary moment): the camera near the ground, aiming high
  lookUp: (target, { t0 = 0, t1 = 1, from = 3, to = 2.4, ang = 0, h = .3, fov = 55 }) => t => {
    const k = ss2(t0, t1, t), T = tgt(target, t), d = L2(from, to, k), D = C3.dir(ang);
    return { pos: [T[0] + D[0] * d, h, T[2] + D[2] * d], at: T, fov };
  },
  // slide sideways past things in the foreground while watching a target (len = how far, + = to the camera's right)
  slide: (target, { t0, t1, dist = 4, ang = 0, h = 1, len = 2.5, atY = .7, fov = 50 }) => t => {
    const k = ss2(t0, t1, t), T = tgt(target, t), D = C3.dir(ang), Rt = [-D[2], 0, D[0]], s = L2(-len / 2, len / 2, k);
    return { pos: [T[0] + D[0] * dist - Rt[0] * s, h, T[2] + D[2] * dist - Rt[2] * s], at: [T[0] - Rt[0] * s * .4, T[1] + atY, T[2] - Rt[2] * s * .4], fov };
  },
  // a two-shot of two people for the frame's shape (9:16 needs to stand further back than 16:9): side = which side of
  // the line between them the camera stands
  twoShot: (a, b, { side = 1, h = 1.05, atY = .6, fov = 52, pad = .55, drift = .02 } = {}) => t => {
    const A = tgt(a, t), B = tgt(b, t), mx = (A[0] + B[0]) / 2, mz = (A[2] + B[2]) / 2, sep = Math.hypot(B[0] - A[0], B[2] - A[2]);
    const hf = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * W / H), d = (sep / 2 + pad) / Math.tan(hf / 2) - drift * t;
    const nx = -(B[2] - A[2]) / (sep || 1) * side, nz = (B[0] - A[0]) / (sep || 1) * side;
    return { pos: [mx + nx * d, h, mz + nz * d], at: [mx, (A[1] + B[1]) / 2 + atY, mz], fov };
  },
  // a long flowing move through key positions (through a gate, down a street): S.path
  path: (S, keys, t0, t1, acc, dec) => S.path(keys, t0, t1, acc, dec),
  // shake on hits: [[t, strength, duration], ...] (a gong, a door slam, a landing)
  shake: (move, hits) => t => {
    const c = move(t); let j = 0;
    for (const [th, a = .06, du = .5] of hits) if (t >= th && t < th + du) j += a * Math.exp(-6 * (t - th) / du);
    if (!j) return c;
    const o = [Math.sin(t * 61) * j, Math.sin(t * 47 + 1) * j * .7, Math.sin(t * 53 + 2) * j];
    // the frame twists a little too (a "flip-shake": ~2 degrees on a normal hit), so an impact jolts, not just jiggles
    return withRoll({ ...c, pos: C3.add(c.pos, o), at: C3.add(c.at, C3.mul(o, .5)) }, (c.roll || 0) + Math.sin(t * 43 + .5) * j * 35);
  },
  // tilt the frame (degrees, + = clockwise) on drama: [[t0, t1, deg, t2]] eases from level to deg over t0..t1 and holds;
  // with t2 it eases back to level over the same time from t2. 3-5 degrees for unease, a twist, a dizzy moment
  roll: (move, keys) => t => {
    const c = move(t); let r = c.roll || 0;
    for (const [t0, t1, deg = 4, t2] of keys) r += deg * ss2(t0, t1, t) * (t2 == null ? 1 : 1 - ss2(t2, t2 + (t1 - t0), t));
    return withRoll({ ...c }, r);
  },
  // blend from one move into another between t0 and t1 (a continuous camera that changes what it is doing)
  blend: (a, b, t0, t1) => t => {
    if (t <= t0) return a(t); if (t >= t1) return b(t);
    const k = ss2(t0, t1, t), A = a(t), B = b(t);
    return withRoll({ pos: C3.lerp(A.pos, B.pos, k), at: C3.lerp(A.at, B.at, k), fov: L2(A.fov || 50, B.fov || 50, k) }, L2(A.roll || 0, B.roll || 0, k));
  },
};
