// The CLEAN detail kit (2026-11-02, test - needs set3d-clean.js and kitmodern.js): ready-made pieces at the standard of
// the approved post-office room (out/room-clean.png) - every object built from many parts (panels, trims, studs, bolts,
// tape, labels, printed faces), real material patterns (wood grain, brushed paint, card fibres, paving), glossy, so a
// video session PLACES pieces instead of modelling them. 1 unit = a person's height. Each piece: KC.<name>(V, o) with
// o.at = [x, z] (floor point), o.rot = turn about y, o.y = height it stands on; returns its group.
const KC = {};
(function () {
const T = THREE, PI = Math.PI;
// ---- helpers ----
const grp = (V, o) => V.group([o.at[0], o.y || 0, o.at[1]], o.rot || 0, o.parent);
const rb = (V, w, h, d, r, pos, mat, rot, parent) => MK.rb(V, w, h, d, r, pos, mat, rot, parent);
const bx = (V, g, x0, x1, y0, y1, z0, z1, m) => V.boxAt(x0, x1, y0, y1, z0, z1, m, g);
// printed faces (dials, labels, pages, maps, signs): a canvas on a plane, unlit like print
KC.pic = (V, w, h, draw, pos, rot, parent, k = 256) => { const cv = document.createElement('canvas'); cv.width = Math.max(8, Math.round(k * w / h)); cv.height = k; draw(cv.getContext('2d'), cv.width, cv.height);
  const tex = new T.CanvasTexture(cv); tex.anisotropy = 8; const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, color: 0xeeeeee }));
  m.position.set(...pos); if (rot) m.rotation.set(...rot); (parent || V.group()).add(m); return m; };
KC.lines = (c, W, H, n, col, x0 = .12, x1 = .88) => { c.strokeStyle = col; c.lineWidth = H * .025; for (let i = 0; i < n; i++) { const y = H * (.22 + i * .6 / n); c.beginPath(); c.moveTo(W * x0, y); c.lineTo(W * (x1 - (i % 3) * .1), y); c.stroke(); } };
const text = (c, W, H, s, col, font = 'Georgia, serif', k = .62) => { c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = H * k; c.font = `900 ${fs}px ${font}`;
  while (c.measureText(s).width > W * .86 && fs > 8) { fs -= 2; c.font = `900 ${fs}px ${font}`; } c.fillText(s, W / 2, H / 2 + 2); };
KC.text = text;
// the kit's materials (our palette; any piece takes its own colours in o)
KC.mats = V => V.KCM || (V.KCM = {
  brass: V.mat('#d6a23e', { pat: 'metal' }), iron: V.mat('#2a2a30', { spec: .45 }), chrome: V.mat('#c8ccd4', { pat: 'metal' }),
  paper: V.mat('#f6f1e4', { spec: .05 }), kraft: V.mat('#c99a5c', { pat: 'card', sc: .05, spec: .1 }), red: V.mat('#c8382e', { spec: .3 }),
  walnut: V.mat('#7a4626', { pat: 'wood', sc: .06, spec: .7 }), oakW: V.mat('#b8753a', { pat: 'wood', sc: .05, spec: .65 }), pine: V.mat('#c89a5a', { pat: 'wood', sc: .05, spec: .5 }),
  cream: V.mat('#f1e6cc', { pat: 'paint', sc: .05, spec: .3 }), frame: V.mat('#e8dcc2', { pat: 'paint', sc: .05, spec: .18 }), glass: V.mat('#3d5c7a', { spec: .9 }),
  leaf: V.mat('#4f9a4a', { pat: 'leaves', col2: '#3c8240' }), pot: V.mat('#c8643a', { spec: .25 }), bulb: V.mat('#fff1c0', { emi: 1 }) });
const paint = (V, c, spec = .5) => V.mat(c, { pat: 'paint', sc: .06, spec });
const wood = (V, c, axis = 0) => V.mat(c, { pat: 'wood', sc: .05, spec: .6, axis });

// ---- the room shell ----
// o: { x0, x1, z0, z1, h, wall, floor ('oak' | colour), mirror, wains (colour | false), rail, ceiling ('coffer' | colour),
//      windows: [{ side: 'left'|'right'|'back'|'front', a0, a1, y0, y1, blinds } | { door: true, side, a0, a1, y1, open, sign }],
//      front: true }  - open at the front (+z) unless front: true (needed for reverse shots - the camera then stays inside)
KC.room = (V, o) => {
  const M = KC.mats(V), { x0, x1, z0, z1 } = o, h = o.h || 1.8, g = V.group();
  const wall = V.mat(o.wall || '#cbd9b4', { pat: 'plaster', spec: .12 }), W = o.windows || [];
  bx(V, g, x0, x1, 0, .012, z0, z1, V.mat(o.floorCol || '#c88a4c', { pat: o.floorPat || 'boards', sc: o.floorSc || .085, col2: o.floorCol2 || '#b57638', spec: .55, mirror: o.mirror ?? .6 }));
  // a wall with holes for its windows: along 'x' at z (back) or along 'z' at x (left/right)
  const wallRun = (side) => { const ws = W.filter(w => w.side === side).sort((a, b) => a.a0 - b.a0), alongX = side === 'back' || side === 'front';
    const A0 = alongX ? x0 : z0, A1 = alongX ? x1 : z1, put = (a0, a1, y0, y1) => alongX ? bx(V, g, a0, a1, y0, y1, side === 'front' ? z1 : z0 - .08, side === 'front' ? z1 + .08 : z0, wall)
      : bx(V, g, side === 'left' ? x0 - .08 : x1, side === 'left' ? x0 : x1 + .08, y0, y1, a0, a1, wall);
    let a = A0; for (const w of ws) { put(a, w.a0, 0, h); if (!w.door) put(w.a0, w.a1, 0, w.y0); put(w.a0, w.a1, w.door ? (w.y1 || 1.25) : w.y1, h); a = w.a1; } put(a, A1, 0, h); };
  wallRun('back'); wallRun('left'); wallRun('right'); if (o.front) wallRun('front');
  // ceiling: plain, or coffered (thin ribs in a grid, a cream diamond in every coffer)
  const ceil = V.mat(o.ceilCol || '#3c7d8a'); bx(V, g, x0 - .08, x1 + .08, h, h + .06, z0 - .08, z1 + (o.front ? .08 : 0), ceil);
  if ((o.ceiling || 'coffer') === 'coffer') { const rib = V.mat('#dccbaa'), s = o.coffer || .6;
    for (let x = x0 + s; x < x1; x += s) bx(V, g, x - .012, x + .012, h - .03, h, z0, z1, rib);
    for (let z = z0 + s; z < z1; z += s) bx(V, g, x0, x1, h - .03, h, z - .012, z + .012, rib);
    for (let x = x0 + s / 2; x < x1; x += s) for (let z = z0 + s / 2; z < z1; z += s) { V.box(s / 3, .006, s / 3, [x, h - .006, z], V.mat('#e2c98e'), [0, PI / 4, 0], g); V.box(s / 4, .007, s / 4, [x, h - .007, z], ceil, [0, PI / 4, 0], g); } }
  // wainscot panels, a brass rail, a crown moulding - round the three walls (skipping window openings below the rail)
  if (o.wains !== false) { const pl = paint(V, o.wains || '#5e2f4c', .35), pd = paint(V, o.wainsD || '#4a2440', .35), rail = o.rail ? V.mat(o.rail, { pat: 'metal' }) : M.brass, crown = M.cream, wh = o.wainsH || .5;
    const run = (alongX, fixed, a0, a1, sgn) => { const L = a1 - a0, n = Math.max(1, Math.round(L / .42));
      const B2 = (b0, b1, y0, y1, t0, t1, m) => { const p = fixed + sgn * t0, q2 = fixed + sgn * t1, lo = Math.min(p, q2), hi = Math.max(p, q2);
        return alongX ? bx(V, g, b0, b1, y0, y1, lo, hi, m) : bx(V, g, lo, hi, y0, y1, b0, b1, m); };
      B2(a0, a1, 0, wh, 0, .03, pl); B2(a0, a1, wh, wh + .035, 0, .05, rail); B2(a0, a1, h - .1, h - .05, 0, .05, crown);
      for (let i = 0; i < n; i++) { const c = a0 + (i + .5) * L / n, hw = L / n / 2 - .05; B2(c - hw, c + hw, .08, wh - .08, .03, .042, pd); } };
    const segs = (lo, hi, side) => { let a = lo; const out = []; for (const w of W.filter(w => w.side === side && (w.door || w.y0 < (o.wainsH || .5) + .05)).sort((p, q) => p.a0 - q.a0)) { out.push([a, w.a0]); a = w.a1; } out.push([a, hi]); return out; };
    for (const [a, b] of segs(x0, x1, 'back')) run(true, z0, a, b, 1);
    for (const [a, b] of segs(z0, z1, 'left')) run(false, x0, a, b, 1);
    for (const [a, b] of segs(z0, z1, 'right')) run(false, x1, a, b, -1);
    if (o.front) for (const [a, b] of segs(x0, x1, 'front')) run(true, z1, a, b, -1); }
  // a story's own part may wrap KC.window to build its doorways (the workspace parts' KC.roomD) - then it gets them
  for (const w of W) (w.door && KC.window === KC.window0 ? KC.door : KC.window)(V, { ...w, room: o, parent: g });
  return g;
};
// a window in a room wall's opening: frame, mullions, a deep sill, venetian blinds half down (their slats cast stripes)
KC.window = (V, o) => {
  const M = KC.mats(V), g = o.parent || V.group(), side = o.side, r = o.room, ac = (o.a0 + o.a1) / 2, al = o.a1 - o.a0, ym = (o.y0 + o.y1) / 2;
  // build in the wall's frame: u along the wall, n into the room
  const at = side === 'back' ? [ac, r.z0] : side === 'front' ? [ac, r.z1] : [side === 'left' ? r.x0 : r.x1, ac], rot = side === 'back' ? 0 : side === 'front' ? PI : side === 'left' ? PI / 2 : -PI / 2;
  const w = V.group([at[0], 0, at[1]], rot, g), F = M.frame, B = (u0, u1, y0, y1, n0, n1, m) => bx(V, w, u0, u1, y0, y1, n0, n1, m);
  const hu = al / 2;
  B(-hu - .06, hu + .06, o.y0 - .03, o.y0, 0, .06, F); B(-hu - .08, hu + .08, o.y0 - .05, o.y0 - .02, 0, .12, F); B(-hu - .06, hu + .06, o.y1, o.y1 + .04, 0, .06, F);
  for (const u of [-hu - .03, 0, hu + .03]) B(u - .025, u + .025, o.y0, o.y1, -.02, .05, F);
  B(-hu, hu, ym - .015, ym + .015, -.02, .05, F);
  if (o.blinds !== false) { const slat = V.mat('#f2ece0', { spec: .15 }), zl = al - .03, drop = o.drop ?? .5, n = Math.floor(drop / .05);
    rb(V, zl + .02, .045, .07, .01, [0, o.y1 - .05, .085], F, null, w);
    for (let i = 0, y = o.y1 - .085; i < n; i++, y -= .05) V.box(zl, .006, .055, [0, y, .085], slat, [-.5, 0, 0], w);
    rb(V, zl, .022, .06, .008, [0, o.y1 - drop - .05, .085], F, null, w);
    for (const u of [-hu + .22, hu - .22]) for (const dn of [-.028, .028]) B(u - .012, u + .012, o.y1 - drop - .03, o.y1 - .05, .085 + dn - .002, .085 + dn + .002, V.mat('#e6dcc6'));
    V.cyl(.003, .003, drop + .12, [hu - .06, o.y1 - drop - .17, .13], V.mat('#e8dcc0'), null, 6, w); V.lathe([[0, 0], [.012, .005], [.008, .04], [0, .045]], [hu - .06, o.y1 - drop - .22, .13], V.mat('#c8a060', { pat: 'metal' }), 16, w); }
  return w;
};
KC.window0 = KC.window;   // the original, so KC.room can tell when a story has wrapped it


// a door in a room wall's opening (made by KC.room for windows with door: true): a frame with a head moulding, a
// panelled leaf with a glass top and a sign, a brass knob and a kick plate; open: 0..1 swings it into the room
KC.door = (V, o) => {
  const M = KC.mats(V), r = o.room, side = o.side, ac = (o.a0 + o.a1) / 2, al = o.a1 - o.a0, hu = al / 2, H = o.y1 || 1.25;
  const at = side === 'back' ? [ac, r.z0] : side === 'front' ? [ac, r.z1] : [side === 'left' ? r.x0 : r.x1, ac], rot = side === 'back' ? 0 : side === 'front' ? PI : side === 'left' ? PI / 2 : -PI / 2;
  const w = V.group([at[0], 0, at[1]], rot, o.parent), F = M.frame, B = (u0, u1, y0, y1, n0, n1, m) => bx(V, w, u0, u1, y0, y1, n0, n1, m);
  for (const s of [-1, 1]) B(s * hu - (s > 0 ? 0 : .07), s * hu + (s > 0 ? .07 : 0), 0, H + .02, -.02, .05, F);
  B(-hu - .09, hu + .09, H, H + .1, -.02, .06, F); B(-hu - .11, hu + .11, H + .1, H + .13, -.02, .08, F);
  const leaf = V.group([-hu, 0, .01], -(o.open || 0) * PI * .55, w), col = paint(V, o.col || '#2f6e4c', .55), colD = paint(V, o.colD || '#24573c', .55);
  rb(V, al, H - .01, .04, .01, [hu, 0, 0], col, null, leaf);
  rb(V, al - .14, H * .36, .02, .008, [hu, .1, .025], colD, null, leaf); bx(V, leaf, .07, al - .07, H * .55, H - .08, .015, .03, V.mat('#bcd8ec', { spec: 1 }));
  for (const [u0, u1, y0, y1] of [[.06, al - .06, H * .55 - .01, H * .55], [.06, al - .06, H - .08, H - .07], [.06, .07, H * .55, H - .07], [al - .07, al - .06, H * .55, H - .07], [hu - .005, hu + .005, H * .55, H - .07]]) bx(V, leaf, u0, u1, y0, y1, .02, .035, col);
  if (o.sign) KC.pic(V, al * .5, .07, (c, W, H2) => { c.fillStyle = '#f1e6cc'; c.beginPath(); c.roundRect(2, 2, W - 4, H2 - 4, 10); c.fill(); text(c, W, H2, o.sign, '#c8382e', 'Georgia, serif', .7); }, [hu, H * .72, .04], null, leaf);
  V.ball(.025, [al - .07, H * .48, .05], M.brass, [1, 1, .7], leaf); bx(V, leaf, .03, al - .03, 0, .1, .02, .026, M.brass);
  // V.doors[i] = { leaf, open(a) (radians, + swings into the room), hide() } - to open or remove it during the story
  (V.doors = V.doors || []).push({ leaf, open: a => { leaf.rotation.y = -a; }, hide: (v = true) => { leaf.visible = !v; }, at: w, w: al });
  return w;
};

// ---- furniture (front = +z in the piece's own frame) ----
// a shop/office counter: painted body, raised framed panels with pinstripes and brass corner studs, pilasters with brass
// caps, a moulding under an overhanging wooden top, a leather writing inlay with gold tooling, a plinth, a brass foot rail,
// a nameplate, a hinged flap at one end.  o: { w, d, h, col, colL, top, leather, sign, signBg, signFg, flap }
KC.counter = (V, o) => {
  const M = KC.mats(V), g = grp(V, o), w = o.w || 2.4, d = o.d || .5, h = o.h || .56, hw = w / 2, fz = d / 2;
  const body = paint(V, o.col || '#2b4a74'), bodyL = paint(V, o.colL || '#3a5d8c'), top = o.top ? wood(V, o.top) : M.walnut, pin = V.mat(o.pin || '#e8d9b4');
  rb(V, w, h, d, .045, [0, 0, 0], body, null, g);
  const n = o.panels || Math.max(1, Math.round(w / .8)), pw = w / n;
  for (let i = 0; i < n; i++) { const x = -hw + (i + .5) * pw, ww = pw - .14;
    rb(V, ww, h * .6, .04, .018, [x, h * .18, fz + .005], bodyL, null, g); rb(V, ww - .12, h * .43, .04, .014, [x, h * .27, fz + .018], body, null, g);
    for (const sx of [-1, 1]) for (const y of [h * .21, h * .75]) V.ball(.009, [x + sx * (ww / 2 - .02), y, fz + .028], M.brass, [1, 1, 1], g);
    const a = ww / 2 - .08, y0 = h * .3, y1 = h * .66; for (const [u0, u1, v0, v1] of [[-a, a, y0, y0 + .005], [-a, a, y1, y1 + .005], [-a, -a + .005, y0, y1], [a - .005, a, y0, y1]]) bx(V, g, x + u0, x + u1, v0, v1, fz + .036, fz + .038, pin); }
  for (let i = 0; i <= n; i++) { const x = -hw + i * pw; rb(V, .06, h * .82, .03, .01, [x, h * .1, fz + .012], bodyL, null, g); V.box(.075, .02, .04, [x, h * .92, fz + .012], M.brass, null, g); V.box(.075, .02, .04, [x, h * .1, fz + .012], M.brass, null, g); }
  rb(V, w + .1, .05, d + .1, .022, [0, h, .02], top, null, g);
  bx(V, g, -hw - .02, hw + .02, h - .05, h - .015, fz - .005, fz + .035, top); bx(V, g, -hw - .015, hw + .015, 0, .07, fz - .005, fz + .04, top);
  bx(V, g, -hw - .05, hw + .05, h - .025, h, fz + .05, fz + .08, M.brass);
  V.cyl(.012, .012, w, [-hw, .08, fz + .11], M.brass, [0, 0, -PI / 2], 10, g); for (const x of [-hw + .1, 0, hw - .1]) V.cyl(.01, .01, .08, [x, 0, fz + .11], M.brass, null, 8, g);
  if (o.leather !== false) { const L = V.mat(o.leather || '#2f5a3e', { pat: 'card', sc: .03, spec: .5 }), lx = hw * .55, lz = d * .38;
    bx(V, g, -hw + .07, -hw + .07 + lx * 2, h + .05, h + .053, -lz, lz, L);
    for (const [a, b, c, e] of [[0, lx * 2, -lz + .025, -lz + .032], [0, lx * 2, lz - .032, lz - .025], [.03, .037, -lz, lz], [lx * 2 - .037, lx * 2 - .03, -lz, lz]]) bx(V, g, -hw + .07 + a, -hw + .07 + b, h + .053, h + .055, c, e, M.brass); }
  if (o.sign) { const sg = o.sign; KC.pic(V, Math.min(.7, pw * .8), .1, (c, W, H) => { c.fillStyle = o.signBg || '#1c2f4c'; c.beginPath(); c.roundRect(3, 3, W - 6, H - 6, 18); c.fill(); c.lineWidth = 8; c.strokeStyle = '#d6a23e'; c.stroke(); text(c, W, H, sg, o.signFg || '#e9c46a'); }, [0, h * .78, fz + .04], null, g); }
  if (o.flap !== false) { bx(V, g, hw - .02, hw + .02, h - .01, h + .05, -fz, fz, top); for (const z of [-fz * .6, fz * .6]) V.cyl(.008, .008, .03, [hw, h + .045, z], M.brass, [0, 0, PI / 2], 8, g); }
  g.userData.top = h + .05; return g;
};
// a waiting bench: wooden slats with rounded ends on iron frames, armrests, a bolt head on every slat end, a cushion
// o: { len, wood, cushion: colour | false }
KC.bench = (V, o) => {
  const M = KC.mats(V), g = grp(V, o), L = o.len || 1.24, hl = L / 2, W = o.wood ? wood(V, o.wood, 1) : V.mat('#b8753a', { pat: 'wood', sc: .05, spec: .65 });
  for (const sx of [-1, 1]) { const x = sx * (hl - .02);
    bx(V, g, x - .02, x + .02, 0, .3, -.18, -.15, M.iron); bx(V, g, x - .02, x + .02, 0, .3, .15, .18, M.iron); bx(V, g, x - .02, x + .02, .26, .29, -.2, .2, M.iron); bx(V, g, x - .02, x + .02, .29, .62, -.26, -.23, M.iron);
    rb(V, .05, .025, .3, .012, [x, .5, .0], W, null, g); V.cyl(.012, .012, .2, [x, .3, .13], M.iron, null, 8, g); }
  for (let k = 0; k < 4; k++) { const z = -.15 + k * .095; rb(V, L, .025, .07, .01, [0, .29, z], W, null, g); for (const sx of [-1, 1]) V.ball(.007, [sx * (hl - .02), .318, z], M.iron, [1, 1, 1], g); }
  for (let k = 0; k < 3; k++) { const y = .38 + k * .085; rb(V, L, .07, .025, .01, [0, y, -.245], W, null, g); for (const sx of [-1, 1]) V.ball(.007, [sx * (hl - .02), y + .035, -.23], M.iron, [1, 1, 1], g); }
  if (o.cushion !== false) rb(V, .32, .04, .26, .02, [-hl * .5, .315, -.02], V.mat(o.cushion || '#5e2f4c', { pat: 'card', sc: .02, spec: .25 }), null, g);
  return g;
};
// a wall of pigeonholes: a back board, wooden dividers, a crown and a plinth, a brass number plate under every hole,
// letters standing in some (a few tied in red string).  o: { w, h, y0, cols, rows, depth, seed }
KC.cubbies = (V, o) => {
  const M = KC.mats(V), g = grp(V, o), w = o.w || 2.1, h = o.h || .88, y0 = o.y0 ?? .62, cols = o.cols || 9, rows = o.rows || 4, D = o.depth || .26, pw = w / cols, ph = h / rows, X0 = -w / 2;
  const W = o.wood ? wood(V, o.wood) : V.mat('#8a5432', { pat: 'wood', sc: .05, spec: .55 });
  bx(V, g, X0 - .03, -X0 + .03, y0 - .03, y0 + h + .03, 0, .02, V.mat('#4a2a16', { pat: 'wood', sc: .05 }));
  for (let i = 0; i <= cols; i++) bx(V, g, X0 + i * pw - .008, X0 + i * pw + .008, y0, y0 + h, 0, D, W);
  for (let j = 0; j <= rows; j++) bx(V, g, X0, -X0, y0 + j * ph - .008, y0 + j * ph + .008, 0, D, W);
  rb(V, w + .12, .05, D + .04, .015, [0, y0 + h + .01, D / 2], W, null, g); rb(V, w + .1, .04, D + .04, .012, [0, y0 - .05, D / 2], W, null, g);
  let sd = o.seed || 3; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, cols4 = ['#f6f1e4', '#f0d8a8', '#d9e6f2', '#f2c8c0'];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const xc = X0 + (i + .5) * pw, yb = y0 + j * ph;
    bx(V, g, xc - .028, xc + .028, yb + .009, yb + .024, D + .002, D + .006, M.brass);
    const n = Math.floor(rnd() * 4); for (let k = 0; k < n; k++) { const x = X0 + (i + .3 + k * .18) * pw; bx(V, g, x - .07 * pw / .233, x + .07 * pw / .233, yb + .012, yb + .012 + ph * (.45 + rnd() * .35), D - .07 - k * .03, D - .065 - k * .03, V.mat(cols4[Math.floor(rnd() * 4)], { spec: .05 })); }
    if (rnd() < .12) { rb(V, pw * .6, .06, .1, .006, [xc, yb + .01, D - .09], M.paper, null, g); bx(V, g, xc - .003, xc + .003, yb + .01, yb + .072, D - .145, D - .035, M.red); bx(V, g, xc - pw * .3, xc + pw * .3, yb + .066, yb + .071, D - .093, D - .087, M.red); } }
  if (o.sign) KC.pic(V, .5, .1, (c, W, H) => { c.fillStyle = '#f1e6cc'; c.beginPath(); c.roundRect(3, 3, W - 6, H - 6, 16); c.fill(); text(c, W, H, o.sign, '#2b4a74'); }, [0, y0 + h + .12, .02], null, g);
  return g;
};
// a filing cabinet: painted steel, drawers with brass pulls and card holders.  o: { col, drawers, w, h }
KC.cabinet = (V, o) => {
  const M = KC.mats(V), g = grp(V, o), w = o.w || .42, h = o.h || .95, n = o.drawers || 4, col = o.col || '#5e8a7a', dh = (h - .08) / n;
  rb(V, w, h, .4, .015, [0, 0, 0], V.mat(col, { spec: .5 }), null, g);
  for (let k = 0; k < n; k++) { const y = .05 + k * dh; rb(V, w - .04, dh - .025, .02, .008, [0, y, .2], V.mat(col, { spec: .55 }), null, g);
    bx(V, g, -.04, .04, y + dh * .62, y + dh * .62 + .02, .21, .23, M.brass); bx(V, g, -.035, .035, y + dh * .36, y + dh * .5, .211, .214, M.cream);
    KC.pic(V, .05, .02, (c, W, H) => { c.fillStyle = '#fbf7ec'; c.fillRect(0, 0, W, H); KC.lines(c, W, H, 1, '#3a3a52', .2, .8); }, [0, y + dh * .43, .216], null, g); }
  return g;
};
// a rug: a field, a border band, a scatter of small diamonds.  o: { w, d, col, border, dots }
KC.rug = (V, o) => {
  const M = KC.mats(V), g = grp(V, o), w = o.w || 1.6, d = o.d || .95, hw = w / 2, hd = d / 2, B = o.border ? V.mat(o.border, { pat: 'metal' }) : M.brass;
  bx(V, g, -hw, hw, .012, .02, -hd, hd, V.mat(o.col || '#2f6e4c', { pat: 'card', sc: .02, spec: .15 }));
  for (const [a, b, c, e] of [[-hw + .05, hw - .05, -hd + .05, -hd + .075], [-hw + .05, hw - .05, hd - .075, hd - .05], [-hw + .05, -hw + .075, -hd + .05, hd - .05], [hw - .075, hw - .05, -hd + .05, hd - .05]]) bx(V, g, a, b, .02, .024, c, e, B);
  if (o.dots !== false) for (let x = -hw + .16; x < hw - .1; x += .16) for (let z = -hd + .15; z < hd - .1; z += .16) V.box(.024, .004, .024, [x, .02, z], B, [0, PI / 4, 0], g);
  return g;
};
// a pendant lamp from the ceiling: cord, enamel shade, a warm bulb and its pool of light.  o: { at, top, drop, col, k }
KC.pendant = (V, o) => {
  const M = KC.mats(V), g = V.group(), [x, z] = o.at, top = o.top || 1.8, drop = o.drop || .42;
  V.cyl(.004, .004, drop, [x, top - drop, z], M.iron, null, 6, g); V.lathe([[.012, 0], [.16, -.11], [.17, -.12], [0, -.12]], [x, top - drop, z], V.mat(o.col || '#2f6e4c', { spec: .6 }), 32, g);
  V.ball(.04, [x, top - drop - .1, z], M.bulb, [1, 1, 1], g); if (o.k !== 0) V.light([x, top - drop - .18, z], o.light || '#ffd08a', o.k ?? .5);
  return g;
};
// a stool: a round wooden seat, a steel post, a foot ring.  o: { h }
KC.stool = (V, o) => { const M = KC.mats(V), g = grp(V, o), h = o.h || .36;
  V.cyl(.12, .12, .03, [0, h, 0], M.walnut, null, 18, g); V.cyl(.014, .014, h, [0, 0, 0], M.iron, null, 8, g); V.cyl(.1, .1, .01, [0, h * .35, 0], M.iron, null, 18, g); V.cyl(.11, .12, .02, [0, 0, 0], M.iron, null, 18, g); return g; };

// ---- props: small things for tables, counters and shelves (o.y = the surface they stand on; o.s = size, 1.6 default:
// props read best a little bigger than life, as in the reference) ----
const prop = (V, o) => { const g = grp(V, o); g.scale.setScalar(o.s ?? 1.6); return g; };
// a parcel: card box, tape along the top, string tied both ways, an address label, maybe a FRAGILE stripe
// o: { w, h, d, tape, string, label, fragile, s: 1 }  - full size by default (s 1)
KC.parcel = (V, o) => {
  const M = KC.mats(V), g = grp(V, o), w = o.w || .3, h = o.h || .22, d = o.d || .26; g.scale.setScalar(o.s || 1);
  rb(V, w, h, d, .012, [0, 0, 0], M.kraft, null, g);
  if (o.tape !== false) V.box(w * .18, .004, d + .004, [0, h, 0], V.mat('#d8b47a', { spec: .6 }), null, g);
  if (o.string) { const st = V.mat('#6a4024'); bx(V, g, -.004, .004, 0, h + .003, -d / 2 - .003, d / 2 + .003, st); bx(V, g, -w / 2 - .003, w / 2 + .003, h - .001, h + .003, -.004, .004, st); V.ball(.012, [0, h + .008, 0], st, [1.4, .6, 1], g); }
  if (o.label !== false) KC.pic(V, w * .5, h * .4, (c, W, H) => { c.fillStyle = '#fbf7ec'; c.fillRect(0, 0, W, H); c.fillStyle = '#c8382e'; c.fillRect(W * .78, H * .12, W * .14, H * .3); KC.lines(c, W, H, 3, '#3a3a52', .1, .72); }, [-w * .12, h * .55, d / 2 + .003], null, g);
  if (o.fragile) KC.pic(V, d * .8, h * .18, (c, W, H) => { c.fillStyle = '#c8382e'; c.fillRect(0, 0, W, H); text(c, W, H, 'FRAGILE', '#fff', 'Arial', .7); }, [w / 2 + .003, h * .5, 0], [0, PI / 2, 0], g);
  return g;
};
// a stack of parcels, each a little turned
KC.parcels = (V, o) => { const g = grp(V, o); let y = 0; (o.sizes || [[.3, .22, .26], [.24, .18, .2], [.18, .14, .16]]).forEach(([w, h, d], i) => {
  KC.parcel(V, { at: [i * .02, i * .01], y, rot: .2 * i, w, h, d, fragile: i === 0, string: i === 2, parent: g }); y += h; }); return g; };
// postal scales: brass base, a pan on a stem, a printed dial with a needle
KC.scales = (V, o) => { const M = KC.mats(V), g = prop(V, o);
  bx(V, g, -.1, .1, 0, .03, -.09, .08, M.brass); V.cyl(.075, .075, .012, [0, .09, 0], M.brass, null, 24, g); V.cyl(.012, .012, .06, [0, .03, 0], M.brass, null, 8, g); V.cyl(.045, .045, .006, [0, .022, .085], M.cream, [PI / 2, 0, 0], 24, g);
  KC.pic(V, .07, .07, (c, W) => { c.fillStyle = '#fbf6e6'; c.beginPath(); c.arc(W / 2, W / 2, W * .48, 0, 7); c.fill(); c.strokeStyle = '#2a2a30'; c.lineWidth = 4;
    for (let i = 0; i < 24; i++) { const a = -2.4 + i * 4.8 / 23, r1 = i % 4 ? .37 : .32; c.beginPath(); c.moveTo(W / 2 + Math.sin(a) * W * .42, W / 2 - Math.cos(a) * W * .42); c.lineTo(W / 2 + Math.sin(a) * W * r1, W / 2 - Math.cos(a) * W * r1); c.stroke(); }
    c.strokeStyle = '#c8382e'; c.lineWidth = 6; c.beginPath(); c.moveTo(W / 2, W / 2); c.lineTo(W * .72, W * .25); c.stroke(); }, [0, .022, .0885], null, g); return g; };
// a rack of rubber stamps with coloured handles
KC.stamps = (V, o) => { const M = KC.mats(V), g = prop(V, o); bx(V, g, -.11, .11, 0, .02, -.06, .06, M.walnut);
  ['#c8382e', '#2f6e4c', '#2b4a74', '#d6a23e', '#5e2f4c'].forEach((c, i) => { const x = -.09 + i * .045; V.cyl(.012, .016, .05, [x, .02, 0], V.mat(c, { spec: .4 }), null, 10, g); V.ball(.014, [x, .078, 0], M.walnut, [1, 1, 1], g); }); return g; };
// stacked letter trays with papers
KC.trays = (V, o) => { const M = KC.mats(V), g = prop(V, o), t = V.mat('#8a5a32', { pat: 'wood', sc: .03, spec: .5 });
  for (let k = 0; k < (o.n || 3); k++) { const y = k * .045; bx(V, g, -.15, .15, y, y + .008, -.11, .11, t); bx(V, g, -.15, .15, y, y + .035, -.115, -.105, t); for (const sx of [-1, 1]) bx(V, g, sx * .15 - .005, sx * .15 + .005, y, y + .03, -.11, .11, t);
    bx(V, g, -.13, .13, y + .008, y + .02 + k * .004, -.09, .09, M.paper); KC.pic(V, .2, .14, (c, W, H) => { c.fillStyle = '#fbf8ee'; c.fillRect(0, 0, W, H); KC.lines(c, W, H, 5, '#5a5a72'); }, [0, y + .0215 + k * .004, 0], [-PI / 2, 0, 0], g); }
  return g; };
// a counter bell on a wooden base
KC.bell = (V, o) => { const M = KC.mats(V), g = prop(V, o); V.cyl(.03, .035, .012, [0, 0, 0], M.walnut, null, 16, g); V.lathe([[0, 0], [.03, 0], [.028, .02], [.016, .036], [0, .042]], [0, .012, 0], M.brass, 24, g); V.ball(.006, [0, .058, 0], M.brass, [1, 1, 1], g); return g; };
// a mug of tea
KC.mug = (V, o) => { const g = prop(V, o), c = V.mat(o.col || '#f4f0e8', { spec: .6 }); V.cyl(.025, .023, .06, [0, 0, 0], c, null, 16, g); V.cyl(.022, .022, .004, [0, .054, 0], V.mat('#5a3420'), null, 16, g);
  V.mesh(new T.TorusGeometry(.016, .005, 8, 16, PI), c, [.025, .03, 0], [0, 0, -PI / 2], g); return g; };
// a banker's desk lamp: weighted base, brass arm, green shade, a lit bulb
KC.deskLamp = (V, o) => { const M = KC.mats(V), g = prop(V, o), sh = V.mat(o.col || '#2f6e4c', { spec: .7 });
  V.cyl(.06, .07, .012, [0, 0, 0], sh, null, 20, g); V.cyl(.006, .006, .22, [0, .01, 0], M.brass, [0, 0, .25], 8, g); V.cyl(.006, .006, .16, [-.055, .22, 0], M.brass, [0, 0, -1.1], 8, g);
  V.lathe([[.012, 0], [.05, -.07], [.055, -.075], [0, -.075]], [-.18, .3, 0], sh, 24, g); V.ball(.018, [-.18, .235, 0], M.bulb, [1, 1, 1], g); V.cyl(.008, .008, .015, [.03, .012, .03], M.brass, null, 8, g); return g; };
// a rotary telephone: body, handset on its cradle, a printed dial with finger holes, a coiled cord
KC.phone = (V, o) => { const M = KC.mats(V), g = prop(V, o), b = V.mat(o.col || '#1f1f26', { spec: .8 });
  rb(V, .14, .05, .1, .015, [0, 0, 0], b, null, g); rb(V, .15, .025, .035, .012, [0, .055, 0], b, null, g); V.cyl(.03, .03, .006, [0, .05, .05], M.cream, [PI / 2, 0, 0], 20, g);
  KC.pic(V, .07, .07, (c, W) => { c.fillStyle = '#f1e6cc'; c.beginPath(); c.arc(W / 2, W / 2, W * .48, 0, 7); c.fill(); c.fillStyle = '#1f1f26';
    for (let i = 0; i < 10; i++) { const a = -.6 + i * .5; c.beginPath(); c.arc(W / 2 + Math.cos(a) * W * .32, W / 2 + Math.sin(a) * W * .32, W * .07, 0, 7); c.fill(); } c.beginPath(); c.arc(W / 2, W / 2, W * .14, 0, 7); c.fillStyle = '#c8382e'; c.fill(); },
    [0, .051, .02], [-PI / 2, 0, 0], g, 128);
  V.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => new T.Vector3(.07 + i * .003 + Math.cos(i * 1.3) * .006, .02 + Math.sin(i * 1.3) * .006, -i * .0015))), 90, .002, 6), b, [0, 0, 0], null, g); return g; };
// an open ledger with ruled pages and writing
KC.ledger = (V, o) => { const M = KC.mats(V), g = prop(V, o); rb(V, .2, .02, .14, .005, [0, 0, 0], V.mat(o.col || '#3a2a5a', { spec: .4 }), null, g);
  for (const sx of [-1, 1]) { V.box(.095, .006, .13, [sx * .05, .02, 0], M.paper, [0, 0, -sx * .05], g);
    KC.pic(V, .09, .125, (c, W, H) => { c.fillStyle = '#fbf8ee'; c.fillRect(0, 0, W, H); c.strokeStyle = '#9ab0d0'; c.lineWidth = 2; for (let y = 18; y < H; y += 14) { c.beginPath(); c.moveTo(6, y); c.lineTo(W - 6, y); c.stroke(); }
      c.strokeStyle = '#d06060'; c.beginPath(); c.moveTo(W * .2, 0); c.lineTo(W * .2, H); c.stroke(); KC.lines(c, W, H, 6, '#2a2a52', .25, .85); }, [sx * .05, .027 + .003, 0], [-PI / 2, -sx * .05, 0], g); }
  return g; };
// an inkwell and pen, a receipt spike with slips, a dish of coins, a stamp pad, a cup of pens
KC.inkwell = (V, o) => { const M = KC.mats(V), g = prop(V, o); V.cyl(.018, .022, .03, [0, 0, 0], V.mat('#3a6a8a', { spec: 1 }), null, 12, g); V.cyl(.01, .01, .006, [0, .03, 0], M.iron, null, 10, g); V.cyl(.002, .001, .12, [0, .03, 0], M.cream, [.3, 0, .2], 6, g); return g; };
KC.spike = (V, o) => { const M = KC.mats(V), g = prop(V, o); V.cyl(.025, .025, .006, [0, 0, 0], M.walnut, null, 12, g); V.cyl(.0015, .0015, .1, [0, 0, 0], M.iron, null, 4, g); for (let k = 0; k < 4; k++) V.box(.05, .002, .035, [0, .02 + k * .012, 0], M.paper, [0, k * .5, 0], g); return g; };
KC.coins = (V, o) => { const M = KC.mats(V), g = prop(V, o); V.cyl(.04, .03, .012, [0, 0, 0], M.brass, null, 16, g); for (const [dx, dz] of [[-.01, .005], [.008, -.006], [.012, .01], [-.004, -.012]]) V.cyl(.01, .01, .003, [dx, .012, dz], V.mat('#e2c060', { pat: 'metal' }), [.2, 0, .1], 12, g); return g; };
KC.stampPad = (V, o) => { const M = KC.mats(V), g = prop(V, o); rb(V, .08, .012, .05, .004, [0, 0, 0], M.iron, null, g); bx(V, g, -.035, .035, .012, .014, -.015, .015, V.mat('#7a2a4a')); return g; };
KC.pens = (V, o) => { const M = KC.mats(V), g = prop(V, o); V.cyl(.025, .022, .07, [0, 0, 0], M.walnut, null, 14, g); for (const [dx, c] of [[-.008, '#c8382e'], [.006, '#2b4a74'], [0, '#1f1f26']]) V.cyl(.004, .004, .1, [dx, .03, dx], V.mat(c), [0, 0, dx * 8], 6, g); return g; };
KC.books = (V, o) => { const g = prop(V, o), cols = o.cols || ['#7a2a3a', '#2b4a74', '#2f6e4c', '#c8902e']; let y = 0;
  cols.forEach((c, i) => { const h = .022 + (i % 2) * .008; rb(V, .16 - i * .01, h, .11, .004, [0, y, 0], V.mat(c, { spec: .45 }), [0, (i - 1.5) * .08, 0], g); bx(V, g, -.07, .07, y + .003, y + h - .003, .054 - .001, .057, KC.mats(V).paper); y += h; }); return g; };

// ---- wall pieces (o.at = [x, z] on the wall's face, o.y = centre height, o.rot = which way it faces: 0 = +z) ----
// a wall clock: iron rim, cream face with hour marks, two hands
KC.clock = (V, o) => { const M = KC.mats(V), g = grp(V, { ...o, y: 0 }), y = o.y || 1.38, r = o.r || .15;
  V.cyl(r, r, .03, [0, y, 0], M.iron, [PI / 2, 0, 0], 32, g); V.cyl(r * .87, r * .87, .032, [0, y, 0], V.mat('#fbf7ec'), [PI / 2, 0, 0], 32, g);
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, rr = r * .73; bx(V, g, Math.sin(a) * rr - .005, Math.sin(a) * rr + .005, y + Math.cos(a) * rr - .005, y + Math.cos(a) * rr + .005, .03, .036, M.iron); }
  V.box(.01, r * .53, .006, [0, y, .038], M.iron, [0, 0, -.9], g); V.box(.008, r * .67, .006, [0, y, .04], M.iron, [0, 0, 2.2], g); V.ball(.01, [0, y, .042], M.brass, [1, 1, .5], g); return g; };
// a cork notice board with pinned papers (printed with lines) and red pins
KC.noticeBoard = (V, o) => { const M = KC.mats(V), g = grp(V, { ...o, y: 0 }), w = o.w || 1.15, h = o.h || .65, y = o.y || 1.08;
  bx(V, g, -w / 2, w / 2, y - h / 2, y + h / 2, 0, .03, V.mat('#5a3420', { pat: 'wood', sc: .04 })); bx(V, g, -w / 2 + .04, w / 2 - .04, y - h / 2 + .04, y + h / 2 - .04, .03, .04, V.mat('#c09060', { pat: 'card', sc: .02 }));
  let sd = o.seed || 5; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, pc = ['#fffaf0', '#f2d48a', '#d9e6f2', '#f4c8c0', '#c8e0c0'];
  for (let i = 0; i < (o.n || 8); i++) { const pw = .13 + rnd() * .08, ph = .12 + rnd() * .08, x = -w / 2 + .12 + (i % 4) * (w - .24) / 3.4 + rnd() * .04, yy = y + (i < 4 ? .13 : -.15) + rnd() * .04, col = pc[Math.floor(rnd() * pc.length)];
    KC.pic(V, pw, ph, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); KC.lines(c, W, H, 4, '#4a4a62'); }, [x, yy, .042 + i * .0005], [0, 0, (rnd() - .5) * .16], g); V.ball(.012, [x, yy + ph / 2 - .02, .05], M.red, [1, 1, 1], g); }
  return g; };
// a framed picture or map: a wooden frame, a printed picture (draw(c, W, H)) or a title
KC.framed = (V, o) => { const g = grp(V, { ...o, y: 0 }), w = o.w || .8, h = o.h || .62, y = o.y || 1.1;
  bx(V, g, -w / 2, w / 2, y - h / 2, y + h / 2, 0, .035, V.mat(o.frame || '#8a5432', { pat: 'wood', sc: .04, spec: .6 }));
  KC.pic(V, w - .08, h - .08, o.draw || ((c, W, H) => { c.fillStyle = '#efe2c4'; c.fillRect(0, 0, W, H); text(c, W, H * .4, o.title || '', '#2b4a74'); }), [0, y, .037], null, g); return g; };
// a printed map (roads, a river, pins) for KC.framed's draw
KC.mapDraw = (title) => (c, W, H) => { c.fillStyle = '#efe6cc'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8ab8d8'; c.lineWidth = H * .05; c.beginPath(); c.moveTo(0, H * .7); c.bezierCurveTo(W * .3, H * .5, W * .6, H * .9, W, H * .6); c.stroke();
  c.strokeStyle = '#c8a878'; c.lineWidth = H * .02; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(W * i / 6, 0); c.lineTo(W * i / 6 + W * .05, H); c.stroke(); c.beginPath(); c.moveTo(0, H * i / 6); c.lineTo(W, H * i / 6 - H * .04); c.stroke(); }
  c.fillStyle = '#9ac080'; c.fillRect(W * .62, H * .12, W * .2, H * .2); c.strokeStyle = '#c8382e'; c.lineWidth = H * .012; c.setLineDash([H * .03, H * .02]); c.beginPath(); c.moveTo(W * .15, H * .2); c.lineTo(W * .45, H * .45); c.lineTo(W * .8, H * .35); c.stroke(); c.setLineDash([]);
  for (const [x, y] of [[.15, .2], [.45, .45], [.8, .35]]) { c.fillStyle = '#c8382e'; c.beginPath(); c.arc(W * x, H * y, H * .03, 0, 7); c.fill(); }
  c.fillStyle = '#2b4a74'; c.font = `900 ${H * .1}px Georgia`; c.textAlign = 'left'; c.fillText(title || '', W * .05, H * .93); };
// a calendar
KC.calendar = (V, o) => { const g = grp(V, { ...o, y: 0 }), y = o.y || 1.2; KC.pic(V, .2, .26, (c, W, H) => { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H); c.fillStyle = '#c8382e'; c.fillRect(0, 0, W, H * .25); c.fillStyle = '#fff'; c.font = `900 ${H * .16}px Georgia`; c.textAlign = 'center'; c.fillText(o.month || 'NOV', W / 2, H * .18);
  c.fillStyle = '#3a3a52'; for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) c.fillRect(W * (.08 + k * .125), H * (.32 + r * .13), W * .07, H * .06); c.strokeStyle = '#c8382e'; c.lineWidth = 3; c.beginPath(); c.arc(W * .49, H * .48, W * .07, 0, 7); c.stroke(); }, [0, y, .01], null, g); return g; };

// ---- floor pieces ----
// a potted plant: a terracotta pot with a rim, a clump of leaves
KC.plant = (V, o) => { const M = KC.mats(V), g = grp(V, o), s = o.s || 1.4; g.scale.setScalar(s);
  V.lathe([[0, 0], [.07, 0], [.09, .14], [.1, .145], [.1, .16], [0, .16]], [0, 0, 0], M.pot, 24, g); V.cyl(.085, .085, .01, [0, .15, 0], V.mat('#4a3020'), null, 20, g);
  for (const [dx, dz, r, y] of [[0, 0, .1, .25], [.06, .04, .08, .22], [-.05, -.03, .08, .23], [.02, -.06, .07, .3], [-.03, .05, .07, .31]]) V.ball(r, [dx, y, dz], M.leaf, [1, 1, 1], g); return g; };
// a coat stand with hooks and a hat
KC.coatStand = (V, o) => { const M = KC.mats(V), g = grp(V, o); V.cyl(.012, .012, 1.15, [0, 0, 0], M.walnut, null, 8, g); V.cyl(.11, .12, .02, [0, 0, 0], M.walnut, null, 16, g);
  for (let k = 0; k < 4; k++) { V.cyl(.006, .006, .12, [0, 1.05, 0], M.walnut, [.9, k * PI / 2, 0], 6, g); V.ball(.012, [Math.sin(k * PI / 2) * .1, 1.13, Math.cos(k * PI / 2) * .1], M.brass, [1, 1, 1], g); }
  if (o.hat !== false) { const hc = V.mat(o.hat || '#5e2f4c', { pat: 'card', sc: .02, spec: .3 }); V.cyl(.07, .065, .07, [.04, 1.1, .04], hc, null, 16, g); V.cyl(.11, .11, .008, [.04, 1.1, .04], hc, null, 20, g); bx(V, g, -.03, .11, 1.11, 1.125, -.031, .111, V.mat('#2a1a22')); }
  return g; };
// a red pillar post box: plinth, body, a cap with a rim, the slot, a collection plate
KC.pillarBox = (V, o) => { const g = grp(V, o), red = V.mat(o.col || '#c42a24', { spec: .8 }), blk = V.mat('#1f1f26', { spec: .6 });
  V.cyl(.16, .17, .05, [0, 0, 0], blk, null, 24, g); V.lathe([[0, 0], [.15, 0], [.15, .58], [.16, .6], [.12, .7], [0, .74]], [0, .05, 0], red, 32, g); V.cyl(.165, .165, .02, [0, .6, 0], red, null, 32, g);
  bx(V, g, -.06, .06, .5, .52, .14, .16, blk); KC.pic(V, .14, .08, (c, W, H) => { c.fillStyle = '#f1e6cc'; c.fillRect(0, 0, W, H); KC.lines(c, W, H, 3, '#3a3a52'); }, [0, .38, .152], null, g);
  KC.pic(V, .16, .05, (c, W, H) => { c.fillStyle = '#c42a24'; c.fillRect(0, 0, W, H); text(c, W, H, 'LETTERS', '#f1e6cc', 'Georgia, serif', .7); }, [0, .45, .152], null, g); return g; };
// an indoor waste bin: a slatted wooden or steel bin
KC.wasteBin = (V, o) => { const g = grp(V, o), m = V.mat(o.col || '#3c7d8a', { spec: .4 }); V.lathe([[0, 0], [.09, 0], [.11, .26], [.115, .27], [.1, .27], [.08, .02], [0, .02]], [0, 0, 0], m, 24, g);
  V.cyl(.112, .112, .012, [0, .2, 0], V.mat('#2f6670', { spec: .5 }), null, 24, g); return g; };

// ---- outdoors ----
// the ground pieces: a road (asphalt, a dashed centre line, edge lines), pavements of small slabs, bevelled kerb stones
// with joints.  KC.street(V, { x0, x1 (road), z0, z1, walk: width of each pavement, kerb })   - the road runs along z
KC.street = (V, o) => {
  const g = V.group(), { x0, x1, z0, z1 } = o, wk = o.walk ?? 1.6, asphalt = V.mat(o.road || '#585a64', { pat: 'card', sc: .6, spec: .25 }), line = V.mat('#f2f0e8'), yel = V.mat('#f2c230');
  bx(V, g, x0, x1, 0, .01, z0, z1, asphalt); const xm = (x0 + x1) / 2;
  for (let z = z0; z < z1; z += 1.6) bx(V, g, xm - .035, xm + .035, .01, .013, z, z + .8, yel);
  for (const x of [x0 + .25, x1 - .25]) bx(V, g, x - .025, x + .025, .01, .013, z0, z1, line);
  const slab = V.mat(o.paving || '#d6cfc2', { pat: 'paving', sc: .28, spec: .2 }), kerb = V.mat('#bdb8ae', { pat: 'card', sc: .3, spec: .3 });
  for (const s of [-1, 1]) { const a = s < 0 ? x0 - wk : x1, b = s < 0 ? x0 : x1 + wk; bx(V, g, a, b, 0, .1, z0, z1, slab);
    if (V.floors) V.floors.push({ x0: a, x1: b, z0, z1, y: .1 });                  // people walk on the pavement, not in it
    for (let z = z0; z < z1 - .05; z += .62) rb(V, .14, .13, .6, .03, [s < 0 ? x0 - .02 : x1 + .02, 0, z + .31], kerb, null, g);
    for (let z = z0 + 1.2; z < z1; z += 2.4) { V.cyl(.025, .025, .004, [s < 0 ? x0 + .08 : x1 - .08, .01, z], V.mat('#3a3e46', { pat: 'metal' }), null, 10, g); } }
  if (o.cross != null) for (let x = x0 + .25; x < x1 - .25; x += .42) bx(V, g, x, x + .26, .01, .013, o.cross - .7, o.cross + .7, line);
  return g;
};
// a car with curves: a smooth bevelled body from a side profile, glass with chrome frames, door seams and chrome handles,
// arches over tyres with tread, spoked chrome hubs, lensed headlights with chrome rings, tail lights, a chrome grille and
// bumpers, mirrors, number plates; police: a light bar, a blue band, POLICE lettering.  front = +x.  o: { col, police }
KC.car = (V, o) => {
  const M = KC.mats(V), g = grp(V, o), L = 2.4, Wd = .94, hl = L / 2;
  const body = V.mat(o.police ? '#dfe2e8' : (o.col || '#d8402e'), { spec: .8 }), glass = V.mat('#1e2c40', { spec: 1 }), tyre = V.mat('#18181c', { spec: .2 }), dkm = V.mat('#2a2c32', { spec: .5 });
  const sh = new T.Shape(); sh.moveTo(-hl, .2); sh.lineTo(hl - .05, .2); sh.quadraticCurveTo(hl + .04, .22, hl + .02, .38); sh.quadraticCurveTo(hl, .47, hl - .2, .5);
  sh.lineTo(hl - .62, .53); sh.quadraticCurveTo(hl - .82, .58, hl - 1.0, .84); sh.quadraticCurveTo(hl - 1.06, .9, hl - 1.2, .9); sh.lineTo(-hl + .7, .9); sh.quadraticCurveTo(-hl + .58, .9, -hl + .48, .8);
  sh.lineTo(-hl + .22, .57); sh.quadraticCurveTo(-hl - .02, .55, -hl - .03, .42); sh.quadraticCurveTo(-hl - .03, .22, -hl, .2);
  V.mesh(new T.ExtrudeGeometry(sh, { depth: Wd - .16, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 4, curveSegments: 10 }).translate(0, 0, -(Wd - .16) / 2), body, [0, 0, 0], null, g);
  const ws = new T.Shape(); ws.moveTo(hl - .66, .56); ws.quadraticCurveTo(hl - .84, .62, hl - .98, .82); ws.lineTo(-hl + .68, .84); ws.lineTo(-hl + .5, .58); ws.closePath();
  V.mesh(new T.ExtrudeGeometry(ws, { depth: Wd + .02, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -(Wd + .02) / 2), glass, [0, 0, 0], null, g);
  for (const z of [-1, 1]) { const zz = z * (Wd / 2 + .012);
    bx(V, g, -.06, .0, .56, .85, zz - .006, zz + .006, body); bx(V, g, -hl + .5, hl - .66, .555, .57, zz - .008, zz + .008, M.chrome);
    for (const x of [-.04, hl - .66]) bx(V, g, x - .004, x + .004, .24, .55, zz - .004, zz + .004, dkm);
    for (const x of [-.32, .42]) bx(V, g, x - .05, x + .05, .44, .465, zz - .01, zz + .01, M.chrome);
    bx(V, g, hl - .98, hl - .86, .6, .67, z * (Wd / 2 + .04) - .04, z * (Wd / 2 + .04) + .04, body); }
  for (const x of [hl - .52, -hl + .52]) for (const z of [-1, 1]) { const zz = z * (Wd / 2 - .06);
    V.mesh(new T.TorusGeometry(.25, .04, 8, 20, PI), dkm, [x, .22, z * (Wd / 2 + .02)], null, g);
    V.cyl(.21, .21, .18, [x, .21, zz], tyre, [PI / 2, 0, 0], 24, g); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; V.box(.03, .015, .19, [x + Math.cos(a) * .205, .21 + Math.sin(a) * .205 - .0075, zz], V.mat('#222226'), [0, 0, a], g); }
    V.cyl(.13, .13, .19, [x, .21, zz], M.chrome, [PI / 2, 0, 0], 20, g); for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; V.box(.02, .1, .02, [x + Math.cos(a) * .05, .21 + Math.sin(a) * .05 - .05, zz + z * .1], dkm, [0, 0, a + PI / 2], g); }
    V.cyl(.035, .035, .2, [x, .21, zz], M.chrome, [PI / 2, 0, 0], 12, g); }
  for (const z of [-1, 1]) { V.cyl(.07, .07, .04, [hl + .03, .38, z * .3], M.chrome, [0, 0, PI / 2], 20, g); V.cyl(.055, .055, .045, [hl + .035, .38, z * .3], V.mat('#fff6d0', { emi: 1 }), [0, 0, PI / 2], 20, g);
    rb(V, .04, .09, .18, .015, [-hl - .03, .36, z * .3], V.mat('#e02a2a', { emi: 1 }), null, g); }
  for (let k = 0; k < 5; k++) bx(V, g, hl + .02, hl + .05, .25 + k * .025, .262 + k * .025, -.18, .18, M.chrome);
  for (const s of [-1, 1]) rb(V, .1, .1, Wd + .04, .04, [s * (hl + .04), .14, 0], M.chrome, null, g);
  for (const s of [-1, 1]) KC.pic(V, .26, .07, (c, W, H) => { c.fillStyle = '#f4f0dc'; c.fillRect(0, 0, W, H); c.strokeStyle = '#222'; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6); text(c, W, H, 'KB 21 SV', '#222', 'Arial', .6); }, [s * (hl + .1), .2, 0], [0, s * PI / 2, 0], g);
  V.cyl(.004, .002, .4, [-hl + .5, .88, .3], dkm, null, 4, g);
  if (o.police) { const blue = V.mat('#1f4fd0', { spec: .9 });
    for (const z of [-1, 1]) { bx(V, g, -hl + .02, hl - .02, .3, .4, z * (Wd / 2 + .005) - .006, z * (Wd / 2 + .005) + .006, blue);
      KC.pic(V, .8, .14, (c, W, H) => text(c, W, H, 'POLICE', '#1f3fa8', 'Arial Black, Arial', .8), [.05, .5, z * (Wd / 2 + .03)], [0, z > 0 ? 0 : PI, 0], g); }
    rb(V, .3, .06, .76, .02, [-.1, .9, 0], dkm, null, g); for (const [z, c] of [[-.2, '#ff2a2a'], [.2, '#2a6aff']]) rb(V, .24, .07, .3, .025, [-.1, .955, z], V.mat(c, { emi: 1 }), null, g); }
  return g;
};
// an ornate street lamp: a stepped base, a fluted post, a scroll arm and a glass lantern with a cap and finial
KC.streetLamp = (V, o) => {
  const g = grp(V, o), m = V.mat(o.col || '#2e3440', { spec: .7 }), h = o.h || 2.3;
  V.lathe([[.13, 0], [.13, .05], [.1, .07], [.1, .14], [.07, .18], [.055, .34], [.045, .36]], [0, 0, 0], m, 24, g);
  V.cyl(.035, .042, h - .36, [0, .36, 0], m, null, 16, g); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; V.box(.008, h - .5, .008, [Math.sin(a) * .04, .42, Math.cos(a) * .04], m, null, g); }
  V.cyl(.055, .05, .05, [0, h - .02, 0], m, null, 16, g); V.lathe([[0, 0], [.09, .02], [.1, .04], [.06, .06], [.06, .1], [0, .1]], [0, h + .03, 0], m, 20, g);
  V.cyl(.065, .055, .26, [0, h + .13, 0], V.mat('#fff4c8', { emi: 1 }), null, 8, g); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; V.box(.008, .26, .008, [Math.sin(a) * .066, h + .13, Math.cos(a) * .066], m, null, g); }
  V.lathe([[0, 0], [.12, 0], [.08, .07], [.02, .12], [0, .13]], [0, h + .39, 0], m, 20, g); V.ball(.02, [0, h + .53, 0], m, [1, 1, 1], g);
  return g;
};
// a street bin: green steel with vertical slats, a domed lid, a gold band
KC.streetBin = (V, o) => { const g = grp(V, o), m = V.mat(o.col || '#2f6e4c', { spec: .7 }), gd = V.mat('#d6a23e', { pat: 'metal' });
  V.cyl(.17, .17, .04, [0, 0, 0], m, null, 24, g); for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; V.box(.05, .48, .02, [Math.sin(a) * .155, .04, Math.cos(a) * .155], m, [0, a, 0], g); }
  V.cyl(.165, .165, .04, [0, .3, 0], gd, null, 24, g); V.lathe([[.17, 0], [.17, .03], [.12, .1], [.05, .13], [0, .14]], [0, .52, 0], m, 24, g); V.ball(.025, [0, .66, 0], gd, [1, 1, 1], g); return g; };
// a fire hydrant: a stepped body, side caps with nuts, a bonnet, bolts round the flange
KC.hydrant = (V, o) => { const g = grp(V, o), red = V.mat(o.col || '#e3302a', { spec: .9 }), M = KC.mats(V);
  V.lathe([[.11, 0], [.11, .04], [.08, .05], [.075, .3], [.095, .31], [.095, .34], [.07, .36], [.06, .42], [.025, .46], [0, .47]], [0, 0, 0], red, 24, g);
  for (const s of [-1, 1]) { V.cyl(.035, .035, .07, [s * .075, .22, 0], red, [0, 0, PI / 2], 14, g); V.cyl(.025, .025, .02, [s * .145, .22, 0], M.chrome, [0, 0, PI / 2], 6, g); }
  V.cyl(.04, .04, .06, [0, .22, .075], red, [PI / 2, 0, 0], 14, g); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; V.ball(.01, [Math.sin(a) * .1, .325, Math.cos(a) * .1], M.chrome, [1, 1, 1], g); }
  V.cyl(.018, .018, .03, [0, .46, 0], M.chrome, null, 6, g); return g; };
// a stone planter with flowers
KC.planter = (V, o) => { const g = grp(V, o), w = o.w || .5;
  rb(V, w, .34, w, .04, [0, 0, 0], V.mat('#b0a898', { pat: 'card', sc: .2, spec: .3 }), null, g); rb(V, w + .05, .04, w + .05, .015, [0, .32, 0], V.mat('#c8c0b2', { spec: .3 }), null, g);
  V.cyl(w * .44, w * .44, .02, [0, .34, 0], V.mat('#4a3020'), null, 16, g);
  let sd = o.seed || 9; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, fl = ['#ff4a6a', '#ffd23a', '#ff7ac8', '#ffffff', '#7a5ad8'];
  for (let i = 0; i < 7; i++) V.ball(.07 + rnd() * .04, [(rnd() - .5) * w * .6, .4 + rnd() * .06, (rnd() - .5) * w * .6], KC.mats(V).leaf, [1, 1, 1], g);
  for (let i = 0; i < 12; i++) V.ball(.025, [(rnd() - .5) * w * .7, .46 + rnd() * .08, (rnd() - .5) * w * .7], V.mat(fl[i % 5], { spec: .4 }), [1, 1, 1], g); return g; };
// a bollard: black with a gold band and a domed top
KC.bollard = (V, o) => { const g = grp(V, o), m = V.mat('#22242a', { spec: .8 }); V.lathe([[.07, 0], [.07, .04], [.055, .06], [.05, .55], [.06, .58], [.04, .64], [0, .66]], [0, 0, 0], m, 20, g); V.cyl(.053, .053, .03, [0, .44, 0], V.mat('#d6a23e', { pat: 'metal' }), null, 20, g); return g; };
// a street name sign on a post
KC.streetSign = (V, o) => { const g = grp(V, o), m = V.mat('#2e3440', { spec: .6 }); V.cyl(.025, .03, 1.7, [0, 0, 0], m, null, 10, g); V.ball(.035, [0, 1.72, 0], m, [1, 1, 1], g);
  KC.pic(V, .62, .14, (c, W, H) => { c.fillStyle = o.bg || '#1f4a3a'; c.beginPath(); c.roundRect(2, 2, W - 4, H - 4, 14); c.fill(); c.lineWidth = 6; c.strokeStyle = '#f2ead2'; c.stroke(); text(c, W, H, o.name || 'HIGH STREET', '#f2ead2', 'Georgia, serif', .62); }, [.3, 1.5, .03], null, g);
  KC.pic(V, .62, .14, (c, W, H) => { c.fillStyle = o.bg || '#1f4a3a'; c.beginPath(); c.roundRect(2, 2, W - 4, H - 4, 14); c.fill(); c.lineWidth = 6; c.strokeStyle = '#f2ead2'; c.stroke(); text(c, W, H, o.name || 'HIGH STREET', '#f2ead2', 'Georgia, serif', .62); }, [.3, 1.5, -.03], [0, PI, 0], g);
  bx(V, g, 0, .62, 1.43, 1.57, -.025, .025, m); return g; };
})();
