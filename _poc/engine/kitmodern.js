// Modern kit (test): detailed street pieces at the medieval kit's standard - many parts per object, bevelled edges,
// trims, frames, sills, signs with lettering. 1 unit = a person's height (~1.75 m). Facades face +z in their own frame.
const MK = {};
(function () {
const T = THREE;
// a bevelled box (rounded edges), bottom-centre at pos
function rb(V, w, h, d, r, pos, mat, rot, parent) {
  r = Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001);
  const s = new T.Shape(), hw = w / 2 - r; s.moveTo(-hw, r); s.lineTo(hw, r); s.lineTo(hw, h - r); s.lineTo(-hw, h - r); s.closePath();
  const geo = new T.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 2, curveSegments: 4 }).translate(0, 0, -(d - 2 * r) / 2);
  return V.mesh(geo, mat, pos, rot, parent);
}
MK.rb = rb;
// lettering: a canvas texture on a plane (unlit, like a painted sign)
function sign(V, text, w, h, pos, parent, o = {}) {
  const cv = document.createElement('canvas'), k = 256; cv.width = Math.round(k * w / h); cv.height = k; const c = cv.getContext('2d');
  if (o.bg) { c.fillStyle = o.bg; c.beginPath(); c.roundRect(4, 4, cv.width - 8, k - 8, 26); c.fill(); if (o.edge) { c.lineWidth = 10; c.strokeStyle = o.edge; c.stroke(); } }
  c.fillStyle = o.fg || '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let fs = k * .62; c.font = `${o.italic ? 'italic ' : ''}900 ${fs}px ${o.font || 'Georgia, serif'}`; while (c.measureText(text).width > cv.width * .86 && fs > 20) { fs -= 4; c.font = `${o.italic ? 'italic ' : ''}900 ${fs}px ${o.font || 'Georgia, serif'}`; }
  c.fillText(text, cv.width / 2, k / 2 + 4);
  const tex = new T.CanvasTexture(cv); tex.anisotropy = 8;
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: !o.bg })); m.position.set(...pos); if (o.rotY) m.rotation.y = o.rotY; (parent || V.group()).add(m); return m;
}
MK.sign = sign;

// ---------------- a town building: shop on the ground floor, windowed floors above ----------------
// o: { at: [x, z], rot, w, floors, wall, trim, shutter, shop: { name, awning: [c1, c2], sign, signFg }, balcony: [floor indexes], flowers, brick, roof: 'tank'|'ac' }
MK.building = (V, o) => {
  const w = o.w || 3.4, F = o.floors || 3, FH = 1.62, G = 1.62, D = o.depth || 3, H = G + F * FH, gr = V.group([o.at[0], 0, o.at[1]], o.rot || 0);
  const wall = V.mat(o.wall || '#e8a25a', { pat: o.brick ? 'stone' : 'plaster', sc: o.brick ? .07 : 1, col2: o.wall2 }), trim = V.mat(o.trim || '#f6efe2', { pat: 'plaster' });
  const glass = V.mat('#2c4a72', { pat: 'gloss' }), glassShop = V.mat('#5a86b0', { pat: 'gloss' }), dark = V.mat('#3a2a22', { pat: 'boards', sc: .08 }), metal = V.mat('#3c4250', { pat: 'metal' });
  const stone = V.mat('#b8ab98', { pat: 'stone', sc: .2 }), B = (x0, x1, y0, y1, z0, z1, m) => V.boxAt(x0, x1, y0, y1, z0, z1, m, gr);
  B(-w / 2, w / 2, 0, H, -D, 0, wall);                                                     // the body
  B(-w / 2 - .03, w / 2 + .03, 0, .14, -.05, .05, stone);                                    // plinth
  for (const s of [-1, 1]) B(s * w / 2 - (s > 0 ? .14 : 0), s * w / 2 + (s < 0 ? .14 : 0), .14, H, -.02, .06, trim);   // corner pilasters
  // ground floor shop front
  const shop = o.shop || {}, sx0 = -w / 2 + .3, dx0 = w / 2 - .95, dx1 = w / 2 - .32;
  B(sx0 - .06, dx0 - .12, .3, 1.24, -.01, .04, trim);                                         // window surround
  B(sx0, dx0 - .18, .36, 1.18, .02, .045, glassShop);                                         // shop window
  for (let x = sx0 + (dx0 - .18 - sx0) / 3; x < dx0 - .2; x += (dx0 - .18 - sx0) / 3) B(x - .02, x + .02, .36, 1.18, .04, .07, trim);  // mullions
  B(sx0, dx0 - .18, .9, .93, .04, .07, trim);                                                 // transom bar
  B(sx0 - .1, dx0 - .08, .24, .3, -.01, .12, trim);                                           // window ledge
  B(dx0 - .06, dx1 + .06, 0, 1.3, -.01, .05, trim);                                           // door frame
  B(dx0, dx1, 0, 1.24, .02, .05, dark);                                                       // door
  for (const y of [.18, .7]) B(dx0 + .07, dx1 - .07, y, y + .42, .05, .07, V.mat('#5a4030', { pat: 'boards', sc: .06 }));  // door panels
  B(dx0 + .1, dx1 - .1, .95, 1.17, .05, .065, glassShop); V.ball(.025, [dx1 - .08, .62, .08], V.mat('#d8b040', { pat: 'metal' }), [1, 1, 1], gr);
  if (shop.name) {                                                                            // sign board + lettering
    B(-w / 2 + .18, w / 2 - .18, 1.32, 1.58, -.01, .07, V.mat(shop.sign || '#1f4a3a', { pat: 'boards', sc: .1 }));
    sign(V, shop.name, w - .6, .22, [0, 1.45, .075], gr, { fg: shop.signFg || '#f6e6b0' });
  }
  if (shop.awning) {                                                                          // striped awning with a scalloped valance
    const n = Math.round((w - .4) / .22), sw = (w - .4) / n, ang = .5, len = .62;
    for (let i = 0; i < n; i++) { const m = V.mat(shop.awning[i % 2], { pat: 'plain' }), x = -w / 2 + .2 + sw * (i + .5);
      V.box(sw, .02, len, [x, 1.3 - Math.sin(ang) * len / 2, Math.cos(ang) * len / 2 + .02], m, [ang, 0, 0], gr);
      V.box(sw * .96, .1, .015, [x, 1.3 - Math.sin(ang) * len - .1, Math.cos(ang) * len + .03], m, null, gr); }
  }
  B(-w / 2 - .02, w / 2 + .02, G - .02, G + .06, -.02, .08, trim);                           // string course
  // upper floors
  const n = Math.max(2, Math.floor((w - .3) / .95)), step = (w - .3) / n;
  for (let f = 0; f < F; f++) {
    const y0 = G + f * FH + .38, wh = .82, bal = (o.balcony || []).includes(f);
    for (let i = 0; i < n; i++) {
      const xc = -w / 2 + .15 + step * (i + .5), ww = .5;
      B(xc - ww / 2, xc + ww / 2, y0, y0 + wh, .005, .02, glass);                              // glass
      B(xc - ww / 2 - .05, xc + ww / 2 + .05, y0 - .05, y0, -.01, .05, trim); B(xc - ww / 2 - .05, xc + ww / 2 + .05, y0 + wh, y0 + wh + .05, -.01, .05, trim);
      for (const s of [-1, 1]) B(xc + s * ww / 2 - .03, xc + s * ww / 2 + .03, y0, y0 + wh, -.01, .05, trim);   // frame
      B(xc - .015, xc + .015, y0, y0 + wh, .02, .045, trim); B(xc - ww / 2, xc + ww / 2, y0 + wh * .62, y0 + wh * .62 + .025, .02, .045, trim);  // cross bars
      B(xc - ww / 2 - .09, xc + ww / 2 + .09, y0 - .1, y0 - .05, -.01, .1, trim);              // sill
      B(xc - ww / 2 - .08, xc + ww / 2 + .08, y0 + wh + .05, y0 + wh + .13, -.01, .07, trim);  // lintel
      if (o.shutter) for (const s of [-1, 1]) { B(xc + s * (ww / 2 + .08) - .07, xc + s * (ww / 2 + .08) + .07, y0, y0 + wh, -.01, .04, V.mat(o.shutter, { pat: 'boards', sc: .05, axis: 1 }));
        for (let k = 1; k < 6; k++) B(xc + s * (ww / 2 + .08) - .065, xc + s * (ww / 2 + .08) + .065, y0 + k * wh / 6, y0 + k * wh / 6 + .012, .04, .05, V.mat(dk2(o.shutter), {})); }
      if (o.flowers && !bal && (i + f) % 2 === 0) { B(xc - ww / 2, xc + ww / 2, y0 - .05, y0 + .08, .05, .18, V.mat('#8a4a2a', { pat: 'boards', sc: .05 }));
        for (let k = 0; k < 5; k++) V.ball(.05, [xc - ww / 2 + .06 + k * (ww - .12) / 4, y0 + .1, .12], V.mat(['#ff4a6a', '#ffd23a', '#ff7ac8', '#6ad04a'][(k + i) % 4], { pat: 'leaves' }), [1, 1, 1], gr); }
    }
    if (bal) { const y = G + f * FH + .26; B(-w / 2 + .3, w / 2 - .3, y, y + .07, -.01, .42, stone);    // balcony slab + railing
      for (let x = -w / 2 + .34; x <= w / 2 - .33; x += .12) V.cyl(.012, .012, .42, [x, y + .07, .39], metal, null, 6, gr);
      B(-w / 2 + .3, w / 2 - .3, y + .48, y + .52, .36, .42, metal); }
  }
  // cornice, parapet, roof clutter
  B(-w / 2 - .06, w / 2 + .06, H, H + .07, -.02, .1, trim); B(-w / 2 - .11, w / 2 + .11, H + .07, H + .15, -.02, .17, trim);
  for (let x = -w / 2 + .1; x < w / 2 - .05; x += .22) B(x, x + .08, H - .1, H, .02, .09, trim);        // dentils
  B(-w / 2, w / 2, H + .15, H + .42, -D, .05, wall); B(-w / 2 - .03, w / 2 + .03, H + .42, H + .47, -D, .08, trim);
  V.cyl(.03, .03, H, [w / 2 - .22, 0, .1], V.mat('#7a8290', { pat: 'metal' }), null, 8, gr);              // drainpipe
  if (o.roof === 'tank') { V.cyl(.32, .32, .5, [-.6, H + .42, -1.2], V.mat('#8a6a4a', { pat: 'boards', sc: .06 }), null, 16, gr); V.cone(.36, .2, [-.6, H + .92, -1.2], V.mat('#5a4a40'), 16, gr); for (const [x, z] of [[-.85, -1], [-.35, -1], [-.85, -1.45], [-.35, -1.45]]) V.cyl(.02, .02, .3, [x, H + .12, z], metal, null, 6, gr); }
  if (o.roof === 'ac') rb(V, .5, .3, .4, .03, [.6, H + .42, -1], V.mat('#c8ccd4', { pat: 'metal' }), null, gr);
  return gr;
};
const dk2 = c => { const n = parseInt(c.slice(1), 16), f = v => Math.round(v * .7).toString(16).padStart(2, '0'); return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255); };

// ---------------- street furniture ----------------
MK.lamp = (V, at, rot = 0) => {
  const gr = V.group([at[0], 0, at[1]], rot), m = V.mat('#2e3440', { pat: 'metal' });
  V.lathe([[.1, 0], [.1, .06], [.07, .1], [.05, .3], [.035, .34], [.03, 2.3], [.04, 2.34], [0, 2.36]], [0, 0, 0], m, 16, gr);
  V.cyl(.016, .016, .46, [0, 2.3, 0], m, [0, 0, -Math.PI / 2], 8, gr); V.cyl(.012, .012, .2, [.1, 2.3, 0], m, [0, 0, -Math.PI / 4], 6, gr);   // arm + brace
  V.lathe([[0, 0], [.13, .02], [.1, .12], [.03, .16], [0, .17]], [.44, 2.14, 0], m, 16, gr);
  V.ball(.07, [.44, 2.14, 0], V.mat('#fff2b0', { emi: 1 }), [1, .6, 1], gr); V.cyl(.008, .008, .02, [.44, 2.3, 0], m, null, 6, gr);
  return gr;
};
MK.bench = (V, at, rot = 0) => {
  const gr = V.group([at[0], 0, at[1]], rot), wood = V.mat('#b0703a', { pat: 'boards', sc: .05 }), m = V.mat('#2e3440', { pat: 'metal' });
  for (let i = 0; i < 3; i++) rb(V, 1.1, .03, .08, .012, [0, .26, -.1 + i * .1], wood, null, gr);
  for (let i = 0; i < 2; i++) rb(V, 1.1, .08, .03, .012, [0, .36 + i * .12, -.17], wood, [-.18, 0, 0], gr);
  for (const s of [-1, 1]) { V.boxAt(s * .48 - .02, s * .48 + .02, 0, .26, -.16, .16, m, gr); V.boxAt(s * .48 - .02, s * .48 + .02, .26, .6, -.2, -.16, m, gr); V.boxAt(s * .48 - .02, s * .48 + .02, .36, .4, -.18, .1, m, gr); }
  return gr;
};
MK.hydrant = (V, at) => { const red = V.mat('#e3302a', { pat: 'gloss' });
  V.lathe([[.1, 0], [.1, .04], [.07, .05], [.07, .3], [.09, .31], [.09, .34], [.06, .36], [.05, .42], [.02, .45], [0, .46]], [at[0], 0, at[1]], red, 16);
  for (const s of [-1, 1]) V.cyl(.03, .03, .08, [at[0] + s * .1, .22, at[1]], red, [0, 0, Math.PI / 2], 10); };
MK.bin = (V, at) => { const g2 = V.mat('#2f7a4a', { pat: 'metal' });
  V.lathe([[.15, 0], [.17, .48], [.18, .5], [.18, .53], [.12, .58], [0, .6]], [at[0], 0, at[1]], g2, 16); for (let y = .1; y < .45; y += .12) V.cyl(.165, .165, .02, [at[0], y, at[1]], V.mat('#246040', {}), null, 16); };
MK.trafficLight = (V, at, rot = 0) => {
  const gr = V.group([at[0], 0, at[1]], rot), m = V.mat('#2a2e38', { pat: 'metal' }), y = V.mat('#e8b828', { pat: 'gloss' });
  V.cyl(.035, .045, 1.9, [0, 0, 0], m, null, 10, gr); rb(V, .2, .56, .16, .04, [0, 1.6, .02], y, null, gr);
  [['#ff3a2a', 1, 2.02], ['#ffb020', 0, 1.86], ['#3aff7a', 0, 1.7]].forEach(([c, on, yy]) => { V.cyl(.055, .055, .03, [0, yy, .1], V.mat(on ? c : '#2a2a2a', { emi: on }), [Math.PI / 2, 0, 0], 16, gr); V.box(.14, .015, .07, [0, yy + .06, .14], m, null, gr); });
  return gr;
};
MK.planter = (V, at) => { rb(V, .5, .34, .5, .04, [at[0], 0, at[1]], V.mat('#a8a094', { pat: 'stone', sc: .25 })); KIT.bush(V, { at: [at[0], at[1]], s: .55, y: .32 }); };
MK.streetTree = (V, at, s = 1) => { V.boxAt(at[0] - .4, at[0] + .4, 0, .11, at[1] - .4, at[1] + .4, V.mat('#3a3e46', { pat: 'metal' })); KIT.tree(V, { at, s }); };
MK.mailbox = (V, at, rot = 0) => { const gr = V.group([at[0], 0, at[1]], rot), b = V.mat('#2456c8', { pat: 'gloss' });
  for (const s of [-1, 1]) V.boxAt(s * .14 - .02, s * .14 + .02, 0, .22, -.14, .14, b, gr); rb(V, .36, .4, .32, .05, [0, .22, 0], b, null, gr); V.cyl(.16, .16, .34, [0, .62, 0], b, [0, 0, Math.PI / 2], 16, gr);
  V.boxAt(-.1, .1, .52, .55, .16, .17, V.mat('#1a2a60', {}), gr); };

// ---------------- cars ----------------
// o: { col, police }  - length along the car's x (front = +x)
MK.car = (V, at, rot, o = {}) => {
  const gr = V.group([at[0], 0, at[1]], rot), L = 2.4, Wd = .94;
  const body = V.mat(o.police ? '#f6f6f8' : (o.col || '#d8402e'), { pat: 'gloss' }), glass = V.mat('#1e2c40', { pat: 'gloss' }), tyre = V.mat('#18181c'), rim = V.mat('#c8ccd4', { pat: 'metal' }), dkm = V.mat('#2a2c32', { pat: 'metal' });
  const prof = [[-L / 2, .16], [L / 2, .16], [L / 2 + .02, .38], [L / 2 - .05, .48], [L / 2 - .62, .52], [L / 2 - 1.02, .86], [-L / 2 + .62, .88], [-L / 2 + .2, .56], [-L / 2 - .02, .52]];
  const s = new T.Shape(prof.map(([x, y]) => new T.Vector2(x, y)));
  V.mesh(new T.ExtrudeGeometry(s, { depth: Wd - .12, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 3 }).translate(0, 0, -(Wd - .12) / 2), body, [0, 0, 0], null, gr);
  const win = [[L / 2 - .66, .55], [L / 2 - 1.0, .82], [-L / 2 + .64, .84], [-L / 2 + .26, .56]], ws = new T.Shape(win.map(([x, y]) => new T.Vector2(x, y)));
  V.mesh(new T.ExtrudeGeometry(ws, { depth: Wd + .005, bevelEnabled: false }).translate(0, 0, -(Wd + .005) / 2), glass, [0, 0, 0], null, gr);
  V.boxAt(-.08, -.02, .55, .84, -Wd / 2 - .004, Wd / 2 + .004, body, gr);                    // door pillar
  for (const x of [L / 2 - .5, -L / 2 + .5]) for (const z of [-1, 1]) { V.cyl(.2, .2, .16, [x, .2, z * (Wd / 2 - .05)], tyre, [Math.PI / 2, 0, 0], 20, gr); V.cyl(.12, .12, .17, [x, .2, z * (Wd / 2 - .05)], rim, [Math.PI / 2, 0, 0], 16, gr);
    V.boxAt(x - .26, x + .26, .38, .42, z * (Wd / 2) - .02, z * (Wd / 2) + .02, dkm, gr); }
  rb(V, .1, .12, Wd + .02, .03, [L / 2 + .04, .18, 0], dkm, null, gr); rb(V, .1, .12, Wd + .02, .03, [-L / 2 - .04, .18, 0], dkm, null, gr);   // bumpers
  for (const z of [-1, 1]) { V.boxAt(L / 2 + .02, L / 2 + .06, .34, .42, z * .32 - .1, z * .32 + .1, V.mat('#fff6d0', { emi: 1 }), gr); V.boxAt(-L / 2 - .06, -L / 2 - .02, .38, .46, z * .32 - .1, z * .32 + .1, V.mat('#ff2a2a', { emi: 1 }), gr);
    V.boxAt(L / 2 - 1.0, L / 2 - .9, .6, .66, z * (Wd / 2 + .02) - .04, z * (Wd / 2 + .02) + .04, body, gr);   // mirrors
    V.boxAt(-.4, -.3, .44, .47, z * (Wd / 2 + .005) - .006, z * (Wd / 2 + .005) + .006, dkm, gr); V.boxAt(.4, .5, .44, .47, z * (Wd / 2 + .005) - .006, z * (Wd / 2 + .005) + .006, dkm, gr); }  // handles
  rb(V, .5, .06, .6, .02, [L / 2 + .02, .24, 0], dkm, [0, 0, 0], gr);                        // grille
  if (o.police) {
    const blue = V.mat('#1f4fd0', { pat: 'gloss' });
    V.boxAt(-L / 2 + .05, L / 2 - .05, .3, .42, -Wd / 2 - .007, Wd / 2 + .007, blue, gr);
    for (const z of [-1, 1]) sign(V, 'POLICE', .9, .16, [0, .5, z * (Wd / 2 + .02)], gr, { fg: '#1f3fa8', font: 'Arial Black, Arial', rotY: z > 0 ? 0 : Math.PI });
    rb(V, .3, .08, .7, .02, [-.08, .88, 0], dkm, null, gr); V.boxAt(-.21, .05, .9, .98, -.32, -.02, V.mat('#ff2a2a', { emi: 1 }), gr); V.boxAt(-.21, .05, .9, .98, .02, .32, V.mat('#2a6aff', { emi: 1 }), gr);
  }
  return gr;
};

// ---------------- the street itself ----------------
// a road along z between x = -rw and rw, sidewalks out to sw, from z0 to z1
MK.street = (V, o = {}) => {
  const rw = o.rw || 2.1, sw = o.sw || 4.3, z0 = o.z0 ?? -46, z1 = o.z1 ?? 9;
  const walk = V.mat('#d6cfc2', { pat: 'stone', sc: .45, col2: '#c4bcae' }), curb = V.mat('#b8b4ac', { pat: 'stone', sc: 1.2 }), line = V.mat('#f2f0e8'), yel = V.mat('#f2c230');
  for (const s of [-1, 1]) { V.boxAt(s < 0 ? -sw : rw, s < 0 ? -rw : sw, 0, .1, z0, z1, walk); rb(V, .14, .13, z1 - z0, .03, [s * (rw + .03), 0, (z0 + z1) / 2], curb, null); }
  for (let z = z0; z < z1; z += 2.2) { V.boxAt(-.07, -.02, 0, .006, z, z + 1.1, yel); V.boxAt(.02, .07, 0, .006, z, z + 1.1, yel); }
  for (const s of [-1, 1]) V.boxAt(s * (rw - .3) - .03, s * (rw - .3) + .03, 0, .006, z0, z1, line);
  if (o.cross != null) for (let x = -rw + .2; x < rw - .2; x += .42) V.boxAt(x, x + .26, 0, .007, o.cross - .7, o.cross + .7, line);
  for (const z of o.manholes || []) V.cyl(.24, .24, .012, [-.9, 0, z], V.mat('#3a3e46', { pat: 'metal' }), null, 20);
};
// bunting strung across the street
MK.bunting = (V, x0, x1, y, z) => { const cols = ['#ff3a4a', '#ffd23a', '#2a8aff', '#3ac46a', '#ff7a1a'];
  const n = Math.round((x1 - x0) / .28);
  for (let i = 0; i < n; i++) { const x = x0 + (i + .5) * (x1 - x0) / n, sag = .45 * Math.sin(Math.PI * (i + .5) / n);
    V.tri(-.1, .1, 0, -.22, .01, V.mat(cols[i % cols.length], { side: 'double' }), [x, z], 0).position.y = y - sag; }
  const cord = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(x0, y, z), new T.Vector3((x0 + x1) / 2, y - .9, z), new T.Vector3(x1, y, z)), 24, .006, 4), V.mat('#3a3a3a'));
  V.group().add(cord); return cord;
};
})();
