// Ink Shorts engine - the 3D parts kit for set3d.js. Every place in a story is laid out from these, like a floor plan:
// buildings (cottage, town house, shop, stone house), towers, town walls and gates, rooms and furniture, and outdoor
// things (trees, rocks, fences, paths, wells, pits, ponds, hills, clouds). Units: 1 = a person's height.
// Positions are [x, z] on the ground; rot = quarter turns (0: front faces +z, 1: +x, 2: -z, 3: -x).
// Every part returns what a story may need next (its group, door spots, lights, the pit floor...).
const KIT = {};
const QT = Math.PI / 2;
KIT.mats = S => S.M || (S.M = S.look === 'ink' ? KIT.inkMats(S) : S.look === 'vivid' ? KIT.vividMats(S) : KIT.canyonMats(S));
// the default 'ink' look: muted, hand-inked
KIT.inkMats = S => ({
  plaster: S.mat('#efe3c8', { pat: 'plaster', sc: .6 }), plasterY: S.mat('#f1d79e', { pat: 'plaster', sc: .6 }),
  plasterP: S.mat('#eec3b0', { pat: 'plaster', sc: .6 }), plasterB: S.mat('#cdd9df', { pat: 'plaster', sc: .6 }),
  timber: S.mat('#6b4a2e', { pat: 'boards', sc: .3 }), thatch: S.mat('#d4a95a', { pat: 'thatch', sc: .22 }),
  tiles: S.mat('#c25a3c', { pat: 'tiles', sc: .17 }), slate: S.mat('#66707e', { pat: 'tiles', sc: .15 }),
  stone: S.mat('#aaa398', { pat: 'stone', sc: .13 }), stoneD: S.mat('#8f887e', { pat: 'stone', sc: .16 }),
  cobbles: S.mat('#b5ab9b', { pat: 'cobbles', sc: .2 }), floor: S.mat('#b57d4b', { pat: 'boards', sc: .16, axis: 1 }),
  flags: S.mat('#9e968a', { pat: 'stone', sc: .3 }), door: S.mat('#8a5a34', { pat: 'boards', sc: .13, axis: 1 }),
  shutter: S.mat('#4f8a72', { pat: 'boards', sc: .1, axis: 1 }), grass: S.mat('#94c85c', { pat: 'grass', col2: '#7fb54c', sc: 1.2 }),
  dirt: S.mat('#cfa870', { pat: 'dirt', col2: '#b8905a', sc: .35 }), earth: S.mat('#9a6f45', { pat: 'dirt', col2: '#7e5634', sc: .3, side: 'double' }),
  leaves: S.mat('#62ab48', { pat: 'leaves', col2: '#4f963a', sc: .5 }), pine: S.mat('#3f8a52', { pat: 'leaves', col2: '#2f7444', sc: .4 }),
  trunk: S.mat('#7a5536', { pat: 'boards', sc: .09, axis: 1 }), wood: S.mat('#a8713f', { pat: 'boards', sc: .1 }),
  woodV: S.mat('#a8713f', { pat: 'boards', sc: .1, axis: 1 }), woodD: S.mat('#6e4628', { pat: 'boards', sc: .1 }),
  glass: S.mat('#a9cfe0'), dark: S.mat('#2a1b15', { emi: 1 }), flame: S.mat('#ff9a2a', { emi: 1 }), flame2: S.mat('#ffe27a', { emi: 1 }),
  lamp: S.mat('#ffd37a', { emi: 1 }), iron: S.mat('#4b4a52'), gold: S.mat('#e4bd45'), bronze: S.mat('#c58f3e'),
  red: S.mat('#e0483c'), yellow: S.mat('#f2c94c'), white: S.mat('#f4efe4'), cream: S.mat('#efe6d2'), paper: S.mat('#f7f2e2'),
  pot: S.mat('#c4713e'), jar: S.mat('#7da3bb'), rug: S.mat('#9a5a44'), bread: S.mat('#d9a35a'), apple: S.mat('#d8443a'),
  cloth: S.mat('#c8473a'), cloth2: S.mat('#f1e4c8'), velvet: S.mat('#8a2a3a'), blanket: S.mat('#4f7fb8'), sack: S.mat('#cdb68a'),
  water: S.mat('#5aa6c8', { pat: 'water', col2: '#478fb6', sc: .6, recv: 0 }), rock: S.mat('#a19b91'), rockD: S.mat('#857f76'),
  hill: S.mat('#a3cd80', { recv: 0 }), hill2: S.mat('#8fbd70', { recv: 0 }), mount: S.mat('#a9bccc', { recv: 0 }), cloud: S.mat('#ffffff', { recv: 0 }),
});
// the 'vivid' look (user's anime reference, the gold bell on the table): saturated warm colours, polished cel metal,
// lilac shade, soft clouds - same names, so every part takes it on
KIT.vividMats = S => ({
  plaster: S.mat('#f7e8c6', { pat: 'plaster', sc: .6 }), plasterY: S.mat('#f8d784', { pat: 'plaster', sc: .6 }),
  plasterP: S.mat('#f5b49c', { pat: 'plaster', sc: .6 }), plasterB: S.mat('#c4dcf4', { pat: 'plaster', sc: .6 }),
  timber: S.mat('#7c4424', { pat: 'boards', sc: .3 }), thatch: S.mat('#eab24a', { pat: 'thatch', sc: .22 }),
  tiles: S.mat('#e0552c', { pat: 'tiles', sc: .17 }), slate: S.mat('#5a6cb0', { pat: 'tiles', sc: .15 }),
  stone: S.mat('#c2b6c4', { pat: 'stone', sc: .13 }), stoneD: S.mat('#a294b0', { pat: 'stone', sc: .16 }),
  cobbles: S.mat('#d2c0aa', { pat: 'cobbles', sc: .2 }), floor: S.mat('#cc6a30', { pat: 'boards', sc: .16, axis: 1 }),
  flags: S.mat('#bfb0b8', { pat: 'stone', sc: .3 }), door: S.mat('#a9542a', { pat: 'boards', sc: .13, axis: 1 }),
  shutter: S.mat('#2fa58a', { pat: 'boards', sc: .1, axis: 1 }), grass: S.mat('#7cd24a', { pat: 'grass', col2: '#62bc38', sc: 1.2 }),
  dirt: S.mat('#e6b273', { pat: 'dirt', col2: '#cf9758', sc: .35 }), earth: S.mat('#aa6a3c', { pat: 'dirt', col2: '#8c5230', sc: .3, side: 'double' }),
  leaves: S.mat('#4cc246', { pat: 'leaves', col2: '#35a63a', sc: .5 }), pine: S.mat('#2a9e5c', { pat: 'leaves', col2: '#1f8650', sc: .4 }),
  trunk: S.mat('#8c5230', { pat: 'boards', sc: .09, axis: 1 }), wood: S.mat('#cc6a32', { pat: 'boards', sc: .1 }),
  woodV: S.mat('#cc6a32', { pat: 'boards', sc: .1, axis: 1 }), woodD: S.mat('#8c4422', { pat: 'boards', sc: .1 }),
  glass: S.mat('#8fd2f4'), dark: S.mat('#2a1810', { emi: 1 }), flame: S.mat('#ff9022', { emi: 1 }), flame2: S.mat('#ffe470', { emi: 1 }),
  lamp: S.mat('#ffd56e', { emi: 1 }), iron: S.mat('#7a82a4', { pat: 'gloss', col2: '#a8582c' }), gold: S.mat('#d49a24', { pat: 'gloss', col2: '#c0582a' }),
  bronze: S.mat('#d49a24', { pat: 'gloss', col2: '#c0582a' }),
  red: S.mat('#f0402e'), yellow: S.mat('#ffd23c'), white: S.mat('#fbf6ec'), cream: S.mat('#f6ecd4'), paper: S.mat('#fbf6e6'),
  pot: S.mat('#d86a32'), jar: S.mat('#5aa8d8'), rug: S.mat('#c2463a'), bread: S.mat('#e8a24a'), apple: S.mat('#ee3a2c'),
  cloth: S.mat('#e8402e'), cloth2: S.mat('#fbf0d8'), velvet: S.mat('#a8203a'), blanket: S.mat('#3f80d8'), sack: S.mat('#e0c48a'),
  water: S.mat('#3aa8ec', { pat: 'water', col2: '#2a8ed8', sc: .6, recv: 0 }), rock: S.mat('#b8aebc'), rockD: S.mat('#9a8ea6'),
  hill: S.mat('#8ad468', { recv: 0 }), hill2: S.mat('#72c256', { recv: 0 }), mount: S.mat('#a6b6ec', { recv: 0 }),
  cloud: S.mat('#ffffff', { pat: 'cloud', col2: '#c8c2ec', recv: 0 }),
});
// the 'canyon' look (the default, user's choice from the railroad reference): earthy saturated colours - orange-brown dirt,
// warm sandstone, olive grass, warm woods, terracotta roofs, plain dark iron - under a deep blue sky with cool blue shade.
// Built on the vivid set, so every material name exists; [colour, second colour, pattern] where they differ
KIT.CANYON = { dirt: ['#ad6f42', '#8e5530'], earth: ['#9a5530', '#7e4224'], grass: ['#8da244', '#76902f'], leaves: ['#5d9a36', '#4a8228'], pine: ['#3c7a3e', '#2f6632'],
  stone: '#c08a68', stoneD: '#93613f', flags: '#b07e5e', rock: '#b06e48', rockD: '#874f32', cobbles: '#c0906a', slate: '#5a5f78', tiles: '#b8462a',
  wood: '#a8622f', woodV: '#a8622f', woodD: '#653a1e', timber: '#5c3820', trunk: '#6e4426', door: '#8e4a24', shutter: '#3c7a6a', sack: '#d4b07a',
  plaster: '#ecd9b4', plasterY: '#e8c47e', plasterP: '#e0a888', plasterB: '#b8cbe0', floor: '#a8602e', iron: ['#4c505c', null, 'plain'],
  hill: '#b07a52', hill2: '#9c6644', mount: '#8c96b8' };
KIT.canyonMats = S => {
  const M = KIT.vividMats(S);
  for (const [k, v] of Object.entries(KIT.CANYON)) {
    const [hex, col2, pat] = Array.isArray(v) ? v : [v], spec = { ...M[k].userData.spec[1] };
    if (col2) spec.col2 = col2;
    if (pat) { spec.pat = pat; if (pat === 'plain') delete spec.col2; }
    M[k] = S.mat(hex, spec);
  }
  return M;
};
// world [x, z] of a point in a part's local frame (at, rot)
const kitW = (at, rot, lx, lz) => { const a = rot * QT, c = Math.cos(a), s = Math.sin(a); return [at[0] + lx * c + lz * s, at[1] - lx * s + lz * c]; };
const kitBox = (at, rot, x0, x1, z0, z1) => { const p = [kitW(at, rot, x0, z0), kitW(at, rot, x1, z1)]; return [Math.min(p[0][0], p[1][0]), Math.max(p[0][0], p[1][0]), Math.min(p[0][1], p[1][1]), Math.max(p[0][1], p[1][1])]; };
KIT.part = (S, at, rot = 0, y = 0) => S.group([at[0], y, at[1]], rot * QT);

// ---------- walls with openings ----------
// along x from x0 to x1 in a group, outer face at z, t thick (inwards = -z), from y = yb up h; holes [{ x0, x1, y0, y1 }]
// (cut column by column between every opening's edges, so a window above a door or another window works)
KIT.wall = (S, gr, x0, x1, z, h, t, holes, mat, yb = 0) => {
  const xs = [...new Set([x0, x1, ...holes.flatMap(o => [o.x0, o.x1])])].filter(x => x >= x0 && x <= x1).sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], m = (a + b) / 2; if (b - a < 1e-4) continue;
    let y = yb;
    for (const o of holes.filter(o => o.x0 < m && o.x1 > m).sort((p, q) => p.y0 - q.y0)) { if (o.y0 > y) S.boxAt(a, b, y, o.y0, z - t, z, mat, gr); y = Math.max(y, o.y1); }
    if (y < yb + h) S.boxAt(a, b, y, yb + h, z - t, z, mat, gr);
  }
};
// a beam between two points on a wall face (braces), w wide
KIT.beam = (S, gr, x0, y0, x1, y1, z, mat, w = .08, d = .035) => {
  const L = Math.hypot(x1 - x0, y1 - y0); return S.mesh(new THREE.BoxGeometry(L, w, d), mat, [(x0 + x1) / 2, (y0 + y1) / 2, z + d / 2], [0, 0, Math.atan2(y1 - y0, x1 - x0)], gr);
};
// a door in an opening: timber frame, a step, the leaf (open = swing angle inwards, 0 = shut; hinge 'left' or
// 'right' as seen from outside - pick the side that keeps the open leaf out of the way of what is inside)
KIT.doorFill = (S, gr, o, zf, t, open = 0, M = KIT.mats(S)) => {
  const { x0, x1, y1 } = o, w = x1 - x0, sd = o.hinge === 'right' ? -1 : 1;
  S.boxAt(x0 - .1, x0, 0, y1 + .1, zf, zf + .05, M.timber, gr); S.boxAt(x1, x1 + .1, 0, y1 + .1, zf, zf + .05, M.timber, gr);
  S.boxAt(x0 - .1, x1 + .1, y1, y1 + .1, zf, zf + .05, M.timber, gr);
  S.boxAt(x0 - .04, x1 + .04, 0, .06, zf - .02, zf + .34, M.stone, gr);
  const hz = open ? zf - t + .03 : zf - t / 2, hinge = S.group([sd > 0 ? x0 : x1, 0, hz], sd * open, gr);
  S.box(w - .02, y1 - .02, .05, [sd * w / 2, 0, 0], M.door, null, hinge);
  S.ball(.03, [sd * (w - .1), y1 * .5, .04], M.iron, [1, 1, 1], hinge); S.ball(.03, [sd * (w - .1), y1 * .5, -.04], M.iron, [1, 1, 1], hinge);
  for (const y of [.25, y1 - .3]) S.boxAt(sd > 0 ? .02 : -w * .6, sd > 0 ? w * .6 : -.02, y, y + .04, .025, .04, M.iron, hinge);
};
// a window in an opening: glass and glazing bars (or iron bars, or open like a stall), frame, sill, shutters, flower box
KIT.winFill = (S, gr, o, zf, t, w = {}, M = KIT.mats(S)) => {
  const { x0, x1, y0, y1 } = o, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
  if (w.bars) { for (let x = x0 + .08; x < x1 - .04; x += .11) S.cyl(.014, .014, y1 - y0, [x, y0, zf - t / 2], M.iron, null, 6, gr); S.boxAt(x0 + .02, x1 - .02, y0 - .02, y0 + .02, zf - t / 2 - .015, zf - t / 2 + .015, M.iron, gr); }
  else if (!w.open) {
    S.boxAt(x0, x1, y0, y1, zf - t * .6, zf - t * .45, M.glass, gr);
    S.boxAt(xm - .02, xm + .02, y0, y1, zf - t * .65, zf - t * .3, M.timber, gr); S.boxAt(x0, x1, ym - .02, ym + .02, zf - t * .65, zf - t * .3, M.timber, gr);
  }
  S.boxAt(x0 - .07, x0, y0 - .07, y1 + .07, zf, zf + .05, M.timber, gr); S.boxAt(x1, x1 + .07, y0 - .07, y1 + .07, zf, zf + .05, M.timber, gr);
  S.boxAt(x0 - .07, x1 + .07, y1, y1 + .07, zf, zf + .05, M.timber, gr); S.boxAt(x0 - .1, x1 + .1, y0 - .08, y0, zf, zf + .09, M.timber, gr);
  if (w.shutters) for (const [hx, s] of [[x0 - .07, 1], [x1 + .07, -1]]) {
    const sg = S.group([hx, y0, zf + .05], s * .6, gr); S.box((x1 - x0) / 2, y1 - y0, .035, [-s * (x1 - x0) / 4, 0, 0], w.shutterMat || M.shutter, null, sg);
  }
  if (w.box) {
    S.boxAt(x0 - .04, x1 + .04, y0 - .22, y0 - .1, zf + .02, zf + .18, M.wood, gr);
    const n = Math.max(3, Math.round((x1 - x0) / .12));
    for (let i = 0; i < n; i++) S.ball(.055, [x0 + .03 + i * (x1 - x0) / (n - .4), y0 - .07, zf + .1 + (i % 2) * .03], i % 3 === 1 ? M.yellow : M.red, [1, 1, 1], gr);
  }
};

// ---------- buildings ----------
// KIT.building(S, { at, rot, w, d, h, floors, wall, timber, roof, pitch, over, doors, windows, interior, chimney, footing })
//   wall: a material name (plaster, plasterY, stone...); roof: 'thatch'|'tiles'|'slate'|'flat'; floors 1|2 (h = total
//   wall height; the upper floor starts at h1); doors [{ side, x, w, h, open }]; windows [{ side, x, y, w, h, shutters,
//   box, bars, open }] - side 'front'|'back'|'left'|'right', x along that side as seen from outside.
//   interior: true = a floor and a warm room inside (seen through open doors / open windows). Returns { group, room, doors }.
KIT.building = (S, b) => {
  const M = KIT.mats(S), at = b.at, rot = b.rot || 0, w = b.w ?? 4.4, d = b.d ?? 3.6, h = b.h ?? 1.8, t = b.t ?? .15;
  const floors = b.floors || 1, h1 = b.h1 ?? (floors > 1 ? h * .53 : h), wm = typeof b.wall === 'string' ? M[b.wall] : (b.wall || M.plaster);
  const gr = KIT.part(S, at, rot), hw = w / 2, hd = d / 2;
  // each side: a sub-group whose local x runs along the wall (seen from outside) and whose outer face is at z = half
  const sides = { front: [0, hw, hd], back: [Math.PI, hw, hd], right: [QT, hd - t, hw], left: [-QT, hd - t, hw] };
  const doorsOut = [];
  for (const [name, [ry, half, zf]] of Object.entries(sides)) {
    const sg = S.group([0, 0, 0], ry, gr);
    const ds = (b.doors || []).filter(o => (o.side || 'front') === name).map(o => ({ ...o, x0: (o.x || 0) - (o.w || .84) / 2, x1: (o.x || 0) + (o.w || .84) / 2, y0: 0, y1: o.h || 1.45 }));
    const ws = (b.windows || []).filter(o => (o.side || 'front') === name).map(o => ({ ...o, x0: o.x - (o.w || .7) / 2, x1: o.x + (o.w || .7) / 2, y0: o.y ?? .72, y1: (o.y ?? .72) + (o.h || .56) }));
    // windows at different heights in the same column would break the simple wall cutter: keep them in separate x ranges
    KIT.wall(S, sg, -half, half, zf, h, t, [...ds, ...ws], wm);
    for (const o of ds) { KIT.doorFill(S, sg, o, zf, t, o.open || 0); doorsOut.push({ side: name, world: kitW(at, rot, ...(() => { const a = ry, c = Math.cos(a), s = Math.sin(a); return [o.x * c + (zf + .4) * s, -o.x * s + (zf + .4) * c]; })()) }); }
    for (const o of ws) KIT.winFill(S, sg, o, zf, t, o);
    if (b.footing !== false) {                // a stone footing course, broken at doors
      let x = -half - (name === 'front' || name === 'back' ? .05 : 0);
      for (const o of ds.slice().sort((p, q) => p.x0 - q.x0)) { if (o.x0 - .1 > x) S.boxAt(x, o.x0 - .1, 0, .22, zf - .02, zf + .04, M.stone, sg); x = o.x1 + .1; }
      const xe = half + (name === 'front' || name === 'back' ? .05 : 0); if (xe > x) S.boxAt(x, xe, 0, .22, zf - .02, zf + .04, M.stone, sg);
    }
    if (b.timber) {                           // timber framing: plates, corner posts, posts beside openings, braces
      const fz = zf, ex = name === 'front' || name === 'back' ? .05 : 0;
      S.boxAt(-half - ex, half + ex, h - .12, h, fz, fz + .035, M.timber, sg);
      if (floors > 1) S.boxAt(-half - ex, half + ex, h1 - .06, h1 + .06, fz, fz + .04, M.timber, sg);
      if (ex) { S.boxAt(-half - ex, -half + .1, .22, h, fz, fz + .035, M.timber, sg); S.boxAt(half - .1, half + ex, .22, h, fz, fz + .035, M.timber, sg); }
      const openX = [...ds, ...ws].flatMap(o => [o.x0 - .1, o.x1 + .1]).concat([-half + .1, half - .1]).sort((p, q) => p - q);
      for (let i = 0; i < openX.length - 1; i += 1) {
        const a = openX[i], c = openX[i + 1], inOpen = [...ds, ...ws].some(o => a >= o.x0 - .11 && c <= o.x1 + .11);
        if (inOpen || c - a < .45) continue;
        const ylo = .24, yhi = floors > 1 ? h1 - .06 : h - .12;
        KIT.beam(S, sg, a + .04, ylo, c - .04, yhi, fz, M.timber);
        if (floors > 1) KIT.beam(S, sg, c - .04, h1 + .08, a + .04, h - .14, fz, M.timber);
      }
    }
  }
  // roof
  const rs = b.roof || 'thatch', over = b.over ?? .3;
  if (rs === 'flat') {
    S.boxAt(-hw - .05, hw + .05, h, h + .12, -hd - .05, hd + .05, M.stoneD, gr);
    for (let x = -hw + .15; x < hw; x += .5) for (const z of [hd - .1, -hd + .1]) S.boxAt(x, x + .28, h + .12, h + .42, z - .1, z + .1, wm, gr);
    for (let z = -hd + .6; z < hd - .3; z += .5) for (const x of [hw - .1, -hw + .1]) S.boxAt(x - .1, x + .1, h + .12, h + .42, z, z + .28, wm, gr);
  } else {
    const rise = hd * Math.tan(b.pitch ?? .7), th = Math.atan(rise / hd), L = Math.hypot(hd, rise) + over;
    let rm = M[rs] || M.thatch; if (rot % 2) rm = S.turned(rm);
    const rth = rs === 'thatch' ? .16 : .08;
    for (const s of [1, -1]) {
      const m = S.mesh(new THREE.BoxGeometry(w + 2 * over * .8, rth, L), rm, [0, h + rise - Math.sin(th) * L / 2 + Math.cos(th) * rth / 2, s * (Math.cos(th) * L / 2 + Math.sin(th) * rth / 2)], null, gr);
      m.rotation.x = s > 0 ? th : Math.PI - th;
    }
    for (const x of [hw - t / 2, -hw + t / 2]) S.tri(-hd, hd, h, h + rise, t, wm, [x, 0], QT, gr);
    if (rs === 'thatch') S.cyl(.11, .11, w + 2 * over * .8, [(w + 2 * over * .8) / 2, h + rise + .1, 0], M.thatch, [0, 0, QT], 16, gr);
    else S.cyl(.07, .07, w + 2 * over * .8, [(w + 2 * over * .8) / 2, h + rise + .04, 0], rs === 'slate' ? M.iron : M.tiles, [0, 0, QT], 12, gr);
    b._rise = rise;
  }
  if (b.chimney) {
    const [cx, cz] = b.chimney, top = h + (b._rise || 0) + .55;
    S.boxAt(cx - .35, cx + .35, 0, top, cz - .3, cz + .3, M.stone, gr); S.boxAt(cx - .4, cx + .4, top, top + .07, cz - .35, cz + .35, M.stone, gr);
  }
  // inside: floor boards, a ceiling under the upper floor, a warm room
  let room = null;
  if (b.interior) {
    S.boxAt(-hw + t, hw - t, 0, .02, -hd + t, hd - t, b.floorMat ? M[b.floorMat] : M.floor, gr);
    if (floors > 1) S.boxAt(-hw + t, hw - t, h1 - .05, h1, -hd + t, hd - t, M.woodD, gr);
    const box = kitBox(at, rot, -hw + t, hw - t, -hd + t, hd - t); S.room(box[0], box[1], box[2], box[3], floors > 1 ? h1 : h + (b._rise || 0)); room = box;
  }
  return { group: gr, room, doors: doorsOut, rise: b._rise || 0 };
};
// presets
KIT.cottage = (S, o = {}) => KIT.building(S, { w: 4.4, d: 3.6, h: 1.8, timber: true, roof: 'thatch', pitch: .7, chimney: [1.2, -1.95],
  doors: [{ x: 0, open: o.open ?? 1.75 }], windows: [{ x: -1.3, shutters: true, box: true }, { x: 1.3, shutters: true, box: true }, { side: 'left', x: 0 }, { side: 'right', x: 0 }, { side: 'back', x: -1 }], ...o });
KIT.townhouse = (S, o = {}) => {
  const w = o.w ?? 3.2, dx = o.doorX ?? -w * .24;
  return KIT.building(S, { w, d: 3.2, h: 3.3, floors: 2, wall: o.wall || 'plasterY', timber: true, roof: 'tiles', pitch: .9, over: .25,
    doors: [{ x: dx, open: o.open ?? 0 }], windows: [{ x: -dx, y: .7, w: .62, h: .55, box: true }, { x: -w * .26, y: 2.15, w: .58, h: .62, shutters: true }, { x: w * .26, y: 2.15, w: .58, h: .62, shutters: true },
      { side: 'left', x: 0, y: 2.15, w: .5, h: .55 }, { side: 'right', x: 0, y: 2.15, w: .5, h: .55 }, { side: 'back', x: 0, y: 2.15, w: .58, h: .62 }], chimney: [w * .3, -.4], ...o });
};
// a shop: an open stall window with a counter, a striped awning over it, a hanging sign board
KIT.shop = (S, o = {}) => {
  const M = KIT.mats(S), w = o.w ?? 4, d = o.d ?? 3.4;
  const B = KIT.building(S, { w, d, h: 2.0, wall: o.wall || 'plasterP', timber: true, roof: 'tiles', pitch: .75, interior: true, floorMat: 'flags',
    doors: [{ x: w * .3, open: 1.6 }], windows: [{ x: -w * .14, y: .75, w: w * .45, h: .7, open: true }, { side: 'left', x: 0 }, { side: 'right', x: 0 }], ...o });
  const gr = B.group, zf = d / 2, cx = -w * .14, cw = w * .45;
  S.boxAt(cx - cw / 2, cx + cw / 2, 0, .75, zf - .1, zf + .25, M.wood, gr);                 // counter under the stall window
  S.boxAt(cx - cw / 2 - .05, cx + cw / 2 + .05, .75, .8, zf - .12, zf + .3, M.woodD, gr);
  // awning: a sloping cloth with stripes
  const aw = cw + .5, ad = .75, ag = S.group([cx, 1.62, zf], 0, gr);
  for (let i = 0; i < 7; i++) { const sw = aw / 7, m = S.mesh(new THREE.BoxGeometry(sw, .03, ad), i % 2 ? M.cloth2 : M.cloth, [-aw / 2 + sw * (i + .5), -ad * .22, ad / 2], [.45, 0, 0], ag); }
  for (const s of [-1, 1]) S.cyl(.025, .025, .62, [s * aw / 2, -ad * .5 - .58, ad * .95], M.woodD, null, 8, ag);
  // the sign: a board on an iron bracket by the door
  const sx = w * .3 + .62, sg = S.group([sx, 1.75, zf + .05], 0, gr);
  S.boxAt(-.02, .02, 0, .04, 0, .5, M.iron, sg); S.cyl(.01, .01, .14, [-.12, -.14, .4], M.iron, null, 6, sg); S.cyl(.01, .01, .14, [.12, -.14, .4], M.iron, null, 6, sg);
  S.boxAt(-.24, .24, -.5, -.14, .37, .42, M.wood, sg); B.sign = { group: sg };
  // shelves with goods inside
  KIT.shelves(S, { at: kitW(at0(o), o.rot || 0, -w * .15, -d / 2 + .3), rot: o.rot || 0, w: 1.6 });
  return B;
};
const at0 = o => o.at || [0, 0];
// a stone house: thick stone walls, slate roof, small barred windows (office, jail, guard house)
KIT.stonehouse = (S, o = {}) => KIT.building(S, { w: 4.6, d: 3.8, h: 2.1, t: .22, wall: 'stone', roof: 'slate', pitch: .6, footing: false, interior: true, floorMat: 'flags',
  doors: [{ x: 1.2, open: o.open ?? 1.7 }], windows: [{ x: -1.1, y: .85, w: .55, h: .5, bars: true }, { side: 'left', x: 0, y: .85, w: .55, h: .5, bars: true }], chimney: [-1.5, -1.95], ...o });

// ---------- towers, town walls, gates ----------
// round tower: r radius, h high, roof 'cone' (slate) or 'crenel'; slit windows; door at the bottom facing +z; flag
KIT.tower = (S, o = {}) => {
  const M = KIT.mats(S), r = o.r ?? 1.1, h = o.h ?? 5, gr = KIT.part(S, o.at, o.rot || 0);
  S.cyl(r, r * 1.06, h, [0, 0, 0], M.stone, null, 28, gr);
  for (let i = 0; i < (o.slits ?? 8); i++) {
    const a = i * 2.4 + .5, y = 1.2 + (i % 4) * (h - 2) / 4, n = [Math.sin(a), Math.cos(a)];
    S.mesh(new THREE.BoxGeometry(.12, .38, .1), M.dark, [n[0] * (r - .02), y, n[1] * (r - .02)], [0, a, 0], gr);
  }
  if (o.door !== false) { S.boxAt(-.36, .36, 0, 1.25, r - .2, r + .06, M.door, gr); S.boxAt(-.44, .44, 1.25, 1.36, r - .2, r + .09, M.stoneD, gr); }
  if ((o.roof || 'cone') === 'cone') {
    S.cyl(r + .12, r + .12, .14, [0, h, 0], M.stoneD, null, 28, gr);
    S.cone(r + .35, r * 2, [0, h + .14, 0], M.slate, 28, gr);
    S.cyl(.02, .02, .7, [0, h + .14 + r * 2 - .05, 0], M.iron, null, 6, gr);
    S.tri(0, .5, 0, .3, .02, M.red, [0, 0], 0, S.group([0, h + .14 + r * 2 + .3, 0], 0, gr)).position.set(0, 0, 0);
  } else {
    S.cyl(r + .15, r + .15, .16, [0, h, 0], M.stoneD, null, 28, gr);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; S.mesh(new THREE.BoxGeometry(.32, .36, .26).translate(0, .18, 0), M.stone, [Math.sin(a) * (r + .02), h + .16, Math.cos(a) * (r + .02)], [0, a, 0], gr); }
  }
  return { group: gr, top: h };
};
// a bell tower: a square stone tower with an open belfry on top (four posts, a pyramid roof) and the bell hanging in it
KIT.belltower = (S, o = {}) => {
  const M = KIT.mats(S), s = o.s ?? 1.7, h = o.h ?? 5.2, gr = KIT.part(S, o.at, o.rot || 0), hs = s / 2;
  S.boxAt(-hs, hs, 0, h, -hs, hs, M.stone, gr);
  S.boxAt(-.34, .34, 0, 1.3, hs - .1, hs + .05, M.door, gr); S.boxAt(-.42, .42, 1.3, 1.4, hs - .1, hs + .08, M.stoneD, gr);
  for (const [x, z, a] of [[0, hs, 0], [hs, 0, QT], [-hs, 0, -QT]]) S.mesh(new THREE.BoxGeometry(.14, .45, .1), M.dark, [x * 1.01, h * .55, z * 1.01], [0, a, 0], gr);
  S.boxAt(-hs - .12, hs + .12, h, h + .14, -hs - .12, hs + .12, M.stoneD, gr);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) S.boxAt(x * hs - .12 * (x > 0 ? 1 : -1) - .07, x * hs - .12 * (x > 0 ? 1 : -1) + .07, h + .14, h + 1.45, z * hs - .12 * (z > 0 ? 1 : -1) - .07, z * hs - .12 * (z > 0 ? 1 : -1) + .07, M.timber, gr);
  S.boxAt(-hs - .05, hs + .05, h + 1.45, h + 1.55, -hs - .05, hs + .05, M.timber, gr);
  const roof = S.cone(s * .9, 1.3, [0, h + 1.55, 0], M.slate, 4, gr); roof.rotation.y = Math.PI / 4;
  S.boxAt(-hs + .1, hs - .1, h + 1.3, h + 1.36, -.04, .04, M.timber, gr);
  const bell = KIT.bell(S, { at: [0, 0], y: h + 1.28, s: .85, parent: gr });
  return { group: gr, bell, top: h + 1.55 };
};
// a stretch of town wall from one point to another: stone, battlements on the outer edge, a walkway, buttresses
KIT.townWall = (S, o) => {
  const M = KIT.mats(S), [ax, az] = o.from, [bx, bz] = o.to, L = Math.hypot(bx - ax, bz - az), h = o.h ?? 2.6, t = o.t ?? .7;
  const gr = S.group([(ax + bx) / 2, 0, (az + bz) / 2], Math.atan2(-(bz - az), bx - ax));
  S.boxAt(-L / 2, L / 2, 0, h, -t / 2, t / 2, M.stone, gr);
  for (let x = -L / 2 + .1; x < L / 2 - .2; x += .55) S.boxAt(x, x + .32, h, h + .38, t / 2 - .2, t / 2, M.stone, gr);
  S.boxAt(-L / 2, L / 2, h, h + .14, -t / 2, -t / 2 + .12, M.stone, gr);
  for (let x = -L / 2 + 1.5; x < L / 2 - .5; x += 3.2) S.boxAt(x - .25, x + .25, 0, h * .7, t / 2, t / 2 + .3, M.stoneD, gr);
  return { group: gr };
};
// a gatehouse: a wall with an arched gateway (open wooden gates), between two square towers. Faces +z (outside).
KIT.gate = (S, o = {}) => {
  const M = KIT.mats(S), w = o.w ?? 4.4, h = o.h ?? 3.2, t = o.t ?? .9, aw = o.archW ?? 1.6, ah = o.archH ?? 2.1, gr = KIT.part(S, o.at, o.rot || 0);
  const sh = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h), new THREE.Vector2(-w / 2, h)]);
  const arch = new THREE.Path(); arch.moveTo(-aw / 2, 0); arch.lineTo(-aw / 2, ah - aw / 2); arch.absarc(0, ah - aw / 2, aw / 2, Math.PI, 0, true); arch.lineTo(aw / 2, 0); arch.lineTo(-aw / 2, 0);
  sh.holes.push(arch);
  S.mesh(new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 18 }).translate(0, 0, -t / 2), M.stone, [0, 0, 0], null, gr);
  for (let x = -w / 2 + .1; x < w / 2 - .2; x += .55) S.boxAt(x, x + .32, h, h + .38, t / 2 - .22, t / 2, M.stone, gr);
  // the gates, swung open inside
  for (const s of [-1, 1]) { const hg = S.group([s * aw / 2, 0, -t / 2 + .05], s * -1.45, gr); S.box(aw / 2 - .02, ah - aw / 2 - .05, .07, [-s * (aw / 4), 0, 0], M.door, null, hg);
    for (const y of [.3, ah - aw / 2 - .4]) S.boxAt(-s * .05 - (s > 0 ? aw / 2 - .1 : 0), -s * .05 + (s < 0 ? aw / 2 - .1 : 0), y, y + .05, .04, .05, M.iron, hg); }
  // towers either side
  const tw = o.towerW ?? 1.6, th = h + 1.2;
  for (const s of [-1, 1]) {
    const tx = s * (w / 2 + tw / 2 - .1);
    S.boxAt(tx - tw / 2, tx + tw / 2, 0, th, -tw / 2, tw / 2, M.stone, gr);
    S.boxAt(tx - tw / 2 - .1, tx + tw / 2 + .1, th, th + .14, -tw / 2 - .1, tw / 2 + .1, M.stoneD, gr);
    for (let i = 0; i < 3; i++) S.boxAt(tx - tw / 2 + .05 + i * (tw - .4) / 2, tx - tw / 2 + .35 + i * (tw - .4) / 2, th + .14, th + .5, tw / 2 - .1, tw / 2 + .1, M.stone, gr);
    S.mesh(new THREE.BoxGeometry(.12, .4, .1), M.dark, [tx, th * .6, tw / 2 + .01], null, gr);
  }
  return { group: gr };
};

// ---------- inside: furniture and fittings (at = [x, z] on the floor, rot quarter turns, y = floor height) ----------
KIT.table = (S, o) => {
  const M = KIT.mats(S), w = o.w ?? 1.5, d = o.d ?? .5, h = o.h ?? .41, gr = KIT.part(S, o.at, o.rot || 0, o.y || 0);
  S.boxAt(-w / 2, w / 2, h - .05, h, -d / 2, d / 2, M.wood, gr);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.boxAt(x * (w / 2 - .07) - .035, x * (w / 2 - .07) + .035, 0, h - .05, z * (d / 2 - .07) - .035, z * (d / 2 - .07) + .035, M.woodV, gr);
  return { group: gr, top: h };
};
KIT.bench = (S, o) => {
  const M = KIT.mats(S), w = o.w ?? 1.8, gr = KIT.part(S, o.at, o.rot || 0, o.y || 0);
  S.boxAt(-w / 2, w / 2, .17, .22, -.15, .15, M.wood, gr);
  for (const x of [-1, 1]) S.boxAt(x * (w / 2 - .1) - .05, x * (w / 2 - .1) + .05, 0, .17, -.12, .12, M.woodV, gr);
  return { group: gr, seat: .22 };
};
KIT.stool = (S, o) => { const M = KIT.mats(S), gr = KIT.part(S, o.at, 0, o.y || 0); S.cyl(.14, .14, .04, [0, .18, 0], M.wood, null, 16, gr); for (let i = 0; i < 3; i++) { const a = i * 2.1; S.cyl(.02, .025, .18, [Math.sin(a) * .09, 0, Math.cos(a) * .09], M.woodD, null, 6, gr); } return { group: gr, seat: .22 }; };
// a chair facing +z (its back behind)
KIT.chair = (S, o) => {
  const M = KIT.mats(S), gr = KIT.part(S, o.at, o.rot || 0, o.y || 0);
  S.boxAt(-.17, .17, .18, .22, -.15, .15, M.wood, gr);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.boxAt(x * .13 - .025, x * .13 + .025, 0, .18, z * .11 - .025, z * .11 + .025, M.woodV, gr);
  for (const x of [-1, 1]) S.boxAt(x * .13 - .025, x * .13 + .025, .22, .58, -.15, -.1, M.woodV, gr);
  S.boxAt(-.16, .16, .44, .55, -.15, -.11, M.wood, gr);
  return { group: gr, seat: .22 };
};
// a royal chair: tall back, gold trim, red velvet
KIT.throne = (S, o) => {
  const M = KIT.mats(S), gr = KIT.part(S, o.at, o.rot || 0, o.y || 0);
  S.boxAt(-.38, .38, 0, .26, -.3, .3, M.gold, gr); S.boxAt(-.32, .32, .26, .3, -.26, .26, M.velvet, gr);
  S.boxAt(-.38, .38, .26, 1.25, -.34, -.22, M.gold, gr); S.boxAt(-.3, .3, .34, 1.12, -.23, -.2, M.velvet, gr);
  for (const x of [-1, 1]) { S.boxAt(x * .38 - .06, x * .38 + .06, .26, .5, -.3, .3, M.gold, gr); S.ball(.07, [x * .38, 1.3, -.28], M.gold, [1, 1, 1], gr); }
  S.ball(.06, [0, 1.32, -.28], M.red, [1, 1, 1], gr);
  return { group: gr, seat: .3 };
};
KIT.bed = (S, o) => {
  const M = KIT.mats(S), gr = KIT.part(S, o.at, o.rot || 0, o.y || 0), L = o.l ?? 1.3, w = o.w ?? .7;
  S.boxAt(-w / 2, w / 2, .08, .22, -L / 2, L / 2, M.wood, gr);
  S.boxAt(-w / 2 + .03, w / 2 - .03, .22, .3, -L / 2 + .03, L / 2 - .03, M.cream, gr);
  S.boxAt(-w / 2 + .02, w / 2 - .02, .25, .32, -L / 2 + .35, L / 2 - .02, M.blanket, gr);
  S.ball(.13, [0, .34, -L / 2 + .2], M.white, [1.6, .55, 1], gr);
  S.boxAt(-w / 2 - .03, w / 2 + .03, 0, .62, -L / 2 - .06, -L / 2, M.woodD, gr); S.boxAt(-w / 2 - .03, w / 2 + .03, 0, .4, L / 2, L / 2 + .06, M.woodD, gr);
  return { group: gr };
};
// shelves against a wall (their back towards -z), with pots and jars
KIT.shelves = (S, o) => {
  const M = KIT.mats(S), w = o.w ?? 1.1, gr = KIT.part(S, o.at, o.rot || 0, o.y || 0);
  for (const y of o.levels || [.95, 1.3]) {
    S.boxAt(-w / 2, w / 2, y, y + .04, -.1, .1, M.wood, gr);
    let x = -w / 2 + .12, i = 0;
    while (x < w / 2 - .1) {
      const k = hash(i * 7 + y * 13), r = .04 + k * .04;
      if (k < .35) S.cyl(r, r * .8, .08 + k * .15, [x, y + .04, 0], M.pot, null, 14, gr);
      else if (k < .7) S.cyl(r * .8, r * .8, .14 + k * .08, [x, y + .04, 0], M.jar, null, 14, gr);
      else S.ball(r, [x, y + .04 + r, 0], M.cream, [1, 1, 1], gr);
      x += .14 + k * .12; i++;
    }
  }
  return { group: gr };
};
// a writing desk: drawers, papers, a quill in an ink pot, a candle (lit: true adds its light)
KIT.desk = (S, o) => {
  const M = KIT.mats(S), w = o.w ?? 1.3, gr = KIT.part(S, o.at, o.rot || 0, o.y || 0);
  S.boxAt(-w / 2, w / 2, .42, .47, -.3, .3, M.woodD, gr);
  S.boxAt(w / 2 - .45, w / 2 - .03, 0, .42, -.27, .27, M.wood, gr);
  for (const y of [.08, .22]) { S.boxAt(w / 2 - .42, w / 2 - .06, y, y + .1, .27, .285, M.woodD, gr); S.ball(.015, [w / 2 - .24, y + .05, .29], M.gold, [1, 1, 1], gr); }
  S.boxAt(-w / 2 + .03, -w / 2 + .1, 0, .42, -.27, .27, M.woodV, gr);
  S.boxAt(-.3, .05, .47, .475, -.12, .14, M.paper, gr); S.mesh(new THREE.BoxGeometry(.3, .004, .24), M.paper, [-.05, .478, 0], [0, .3, 0], gr);
  S.cyl(.03, .035, .05, [.22, .47, -.12], M.iron, null, 12, gr);
  S.mesh(new THREE.ConeGeometry(.012, .24, 6).translate(0, .12, 0), M.white, [.22, .5, -.12], [0, 0, -.35], gr);
  S.cyl(.022, .022, .12, [-.45, .47, -.15], M.cream, null, 10, gr); S.cone(.016, .045, [-.45, .59, -.15], M.flame2, 8, gr);
  if (o.lit) { const p = kitW(o.at, o.rot || 0, -.45, -.15); return { group: gr, light: S.light([p[0], (o.y || 0) + .7, p[1]], '#ffb45a', t => .32 + .04 * Math.sin(t * 19)) }; }
  return { group: gr };
};
// a fireplace against a wall (its back towards -z), with flames and its light
KIT.fireplace = (S, o) => {
  const M = KIT.mats(S), gr = KIT.part(S, o.at, o.rot || 0, o.y || 0), w = o.w ?? 1.1, h = o.h ?? 1.8;
  S.boxAt(-w / 2, w / 2, 0, 1.15, -.35, 0, M.stone, gr); S.boxAt(-.3, .3, 0, .68, -.2, .01, M.dark, gr);
  S.boxAt(-w / 2 - .08, w / 2 + .08, 1.15, 1.23, -.35, .07, M.wood, gr); S.boxAt(-w * .36, w * .36, 1.23, h, -.35, -.1, M.stone, gr);
  const fl = [[-.12, .2, .5, M.flame], [0, .24, .62, M.flame], [.13, .2, .48, M.flame], [0, .12, .36, M.flame2]].map(([x, r, hh, m]) => S.cone(r * .5, hh * .55, [x, .02, -.12], m, 9, gr));
  fl.forEach((f, i) => S.tick(t => { f.scale.y = 1 + .18 * Math.sin(t * 13 + i * 2.1) + .08 * Math.sin(t * 29 + i); f.scale.x = f.scale.z = 1 - .06 * Math.sin(t * 17 + i); }));
  const p = kitW(o.at, o.rot || 0, 0, .25);
  return { group: gr, light: o.light === false ? null : S.light([p[0], (o.y || 0) + .35, p[1]], '#ff8a30', t => .9 + .12 * Math.sin(t * 11) + .06 * Math.sin(t * 23)) };
};
// a jail cell front: a row of iron bars from floor to ceiling with a barred door (open: swing angle)
KIT.cellBars = (S, o) => {
  const M = KIT.mats(S), w = o.w ?? 1.8, h = o.h ?? 2.0, gr = KIT.part(S, o.at, o.rot || 0, o.y || 0), dw = .6;
  for (let x = -w / 2 + .06; x < w / 2 - dw - .05; x += .13) S.cyl(.018, .018, h, [x, 0, 0], M.iron, null, 6, gr);
  for (const y of [.1, h * .5, h - .08]) S.boxAt(-w / 2, w / 2 - dw - .02, y, y + .05, -.025, .025, M.iron, gr);
  const dg = S.group([w / 2 - dw, 0, 0], -(o.open || 0), gr);
  for (let x = .06; x < dw - .03; x += .13) S.cyl(.018, .018, h - .05, [x, 0, 0], M.iron, null, 6, dg);
  for (const y of [.1, h * .5, h - .12]) S.boxAt(0, dw - .02, y, y + .05, -.025, .025, M.iron, dg);
  S.boxAt(dw - .12, dw - .02, h * .5 - .08, h * .5 + .12, -.04, .04, M.iron, dg);
  return { group: gr };
};
KIT.stairs = (S, o) => {
  const M = KIT.mats(S), gr = KIT.part(S, o.at, o.rot || 0, o.y || 0), n = o.steps ?? 8, rise = o.rise ?? .12, run = o.run ?? .2, w = o.w ?? .8;
  for (let i = 0; i < n; i++) S.boxAt(-w / 2, w / 2, 0, rise * (i + 1), -run * (i + 1), -run * i, o.mat ? M[o.mat] : M.wood, gr);
  return { group: gr, top: rise * n };
};
KIT.rug = (S, o) => { const M = KIT.mats(S); const gr = KIT.part(S, o.at, o.rot || 0, o.y || 0); S.boxAt(-(o.w ?? 1.8) / 2, (o.w ?? 1.8) / 2, .02, .026, -(o.d ?? 1.2) / 2, (o.d ?? 1.2) / 2, o.mat ? M[o.mat] : M.rug, gr); return { group: gr }; };
KIT.barrel = (S, o) => { const M = KIT.mats(S), gr = KIT.part(S, o.at, 0, o.y || 0), s = o.s ?? 1; S.lathe([[0, 0], [.13 * s, 0], [.155 * s, .21 * s], [.13 * s, .42 * s], [0, .42 * s]], [0, 0, 0], M.woodV, 20, gr); for (const y of [.07, .35]) S.cyl(.15 * s, .15 * s, .03 * s, [0, y * s, 0], M.iron, null, 20, gr); return { group: gr }; };
KIT.crate = (S, o) => { const M = KIT.mats(S), gr = KIT.part(S, o.at, o.rot || 0, o.y || 0), s = o.s ?? .4; S.box(s, s, s, [0, 0, 0], M.wood, null, gr); for (const z of [s / 2, -s / 2]) KIT.beam(S, gr, -s / 2 + .03, .03, s / 2 - .03, s - .03, z - (z > 0 ? 0 : .035), M.woodD, .06); return { group: gr }; };
KIT.sack = (S, o) => { const M = KIT.mats(S), gr = KIT.part(S, o.at, 0, o.y || 0); S.ball(.17, [0, .15, 0], M.sack, [1, .95, .85], gr); S.cyl(.04, .06, .07, [0, .29, 0], M.sack, null, 10, gr); return { group: gr }; };
// a bell (bronze, lathe-turned): s scale, y height of its crown; parent = hang it inside a tower group
KIT.bell = (S, o) => {
  const M = KIT.mats(S), s = o.s ?? 1, gr = o.parent ? S.group([o.at[0], o.y || 0, o.at[1]], 0, o.parent) : KIT.part(S, o.at, 0, o.y || 0);
  const prof = [[0, -.02], [.45, 0], [.42, .06], [.34, .2], [.3, .45], [.26, .62], [.17, .7], [0, .72]].map(([r, h]) => [r * s, h * s]);
  S.lathe(prof, [0, -.72 * s, 0], M.bronze, 36, gr);
  S.mesh(new THREE.TorusGeometry(.43 * s, .025 * s, 8, 36).rotateX(QT), M.bronze, [0, -.7 * s, 0], null, gr);
  S.mesh(new THREE.TorusGeometry(.08 * s, .025 * s, 8, 16), M.bronze, [0, .03 * s, 0], null, gr);
  S.ball(.06 * s, [0, -.62 * s, 0], M.iron, [1, 1, 1], gr);
  return { group: gr };
};
// a lantern on a post (lit: adds its light) or hanging (post: false)
KIT.lantern = (S, o) => {
  const M = KIT.mats(S), gr = KIT.part(S, o.at, 0, o.y || 0), h = o.h ?? 1.6;
  if (o.post !== false) { S.cyl(.04, .05, h, [0, 0, 0], M.iron, null, 8, gr); S.boxAt(-.02, .25, h - .05, h - .02, -.02, .02, M.iron, gr); }
  const lx = o.post !== false ? .22 : 0;
  S.box(.12, .17, .12, [lx, h - .3, 0], M.iron, null, gr); S.box(.09, .12, .09, [lx, h - .275, 0], M.lamp, null, gr); S.cone(.09, .07, [lx, h - .13, 0], M.iron, 4, gr);
  const p = kitW(o.at, 0, lx, 0);
  return { group: gr, light: o.lit ? S.light([p[0], (o.y || 0) + h - .2, p[1]], '#ffb050', o.k ?? .8) : null };
};

// ---------- outdoors ----------
KIT.tree = (S, o) => {
  const M = KIT.mats(S), s = o.s ?? 1.3, [x, z] = o.at, gr = KIT.part(S, o.at);
  if (o.kind === 'pine') {
    S.cyl(.07 * s, .1 * s, .7 * s, [0, 0, 0], M.trunk, null, 10, gr);
    for (let i = 0; i < 3; i++) S.cone((.62 - i * .14) * s, (.95 - i * .1) * s, [0, (.45 + i * .55) * s, 0], M.pine, 14, gr);
  } else {
    S.cyl(.09 * s, .14 * s, 1.2 * s, [0, 0, 0], M.trunk, null, 12, gr);
    const leaf = o.kind === 'autumn' ? S.mat('#e09a3a', { pat: 'leaves', col2: '#c8742a', sc: .5 }) : M.leaves;
    for (const [dx, dy, dz, r] of [[0, 1.5, 0, .66], [-.45, 1.25, .12, .46], [.47, 1.3, -.1, .5], [.05, 1.95, .05, .46], [-.2, 1.7, -.3, .4]]) S.ball(r * s, [dx * s, dy * s, dz * s], leaf, [1, 1, 1], gr);
  }
  return { group: gr };
};
KIT.bush = (S, o) => { const M = KIT.mats(S), s = o.s ?? 1, gr = KIT.part(S, o.at); for (const [dx, dz, r] of [[-.2, 0, .26], [.15, .05, .3], [0, -.12, .28]]) S.ball(r * s, [dx * s, .12 * s, dz * s], M.leaves, [1, 1, 1], gr); return { group: gr }; };
// a rock: a lumpy stone (same seed = same rock)
KIT.rock = (S, o) => {
  const M = KIT.mats(S), s = o.s ?? .5, seed = o.seed ?? 1, geo = new THREE.SphereGeometry(1, 14, 10), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = .75 + .4 * hash(Math.round(x * 20) * 7 + Math.round(y * 20) * 13 + Math.round(z * 20) * 17 + seed * 31);
    p.setXYZ(i, x * k * 1.15, Math.max(-.2, y) * k * .75, z * k);
  }
  geo.computeVertexNormals();
  return { mesh: S.mesh(geo, o.dark ? M.rockD : M.rock, [o.at[0], s * .1, o.at[1]], [0, seed, 0]).scale.set(s, s, s) };
};
// a fence from one point to another: 'picket' (white pointed) or 'rail' (rough wood); gap [a, b] = a gate opening
// (fractions along it); built 0..1 = how much of it is up (for a fence going up through a shot)
KIT.fence = (S, o) => {
  const M = KIT.mats(S), [ax, az] = o.from, [bx, bz] = o.to, L = Math.hypot(bx - ax, bz - az), h = o.h ?? .6, kind = o.kind || 'picket';
  const gr = S.group([ax, 0, az], Math.atan2(-(bz - az), bx - ax)), mat = kind === 'picket' ? M.white : M.wood, [g0, g1] = o.gap || [2, 2];
  for (let x = .06; x < L; x += kind === 'picket' ? .2 : .9) {
    const f = x / L; if (f > g0 && f < g1) continue;
    if (kind === 'picket') { S.box(.09, h, .03, [x, 0, .035], mat, null, gr); S.cone(.064, .1, [x, h, .035], mat, 4, gr).rotation.y = Math.PI / 4; }
    else S.box(.1, h + .1, .1, [x, 0, 0], M.woodV, null, gr);
  }
  for (const [a, b] of [[0, Math.min(1, g0)], [Math.max(0, g1), 1]]) if (b > a) for (const y of kind === 'picket' ? [.18, .42] : [h * .35, h * .8]) S.boxAt(a * L, b * L, y, y + .06, -.02, .02, mat, gr);
  return { group: gr };
};
// a fence ring round a point (round a pit): posts and two rails; gapAt = angle of a gap (or null), built 0..1
KIT.fenceRing = (S, o) => {
  const M = KIT.mats(S), r = o.r ?? 1.6, h = o.h ?? .75, n = o.n ?? 16, gr = KIT.part(S, o.at), posts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2; if (o.gapAt != null && Math.abs(Math.atan2(Math.sin(a - o.gapAt), Math.cos(a - o.gapAt))) < (o.gapW ?? .35)) continue;
    posts.push(S.box(.1, h + .08, .1, [Math.sin(a) * r, 0, Math.cos(a) * r], M.woodV, [0, a, 0], gr));
    const a2 = (i + 1) / n * Math.PI * 2; if (o.gapAt != null && Math.abs(Math.atan2(Math.sin(a2 - o.gapAt), Math.cos(a2 - o.gapAt))) < (o.gapW ?? .35)) continue;
    const L = 2 * r * Math.sin(Math.PI / n);
    for (const y of [h * .38, h * .82]) S.mesh(new THREE.BoxGeometry(L + .06, .06, .04), M.wood, [Math.sin((a + a2) / 2) * r * Math.cos(Math.PI / n), y, Math.cos((a + a2) / 2) * r * Math.cos(Math.PI / n)], [0, (a + a2) / 2, 0], gr);
  }
  return { group: gr };
};
// a path through points [[x, z], ...]: w wide, dirt (or cobbles)
KIT.path = (S, pts, o = {}) => {
  const M = KIT.mats(S), w = o.w ?? .95, mat = o.mat ? M[o.mat] : M.dirt;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0);
    S.box(w, .012, L, [(x0 + x1) / 2, 0, (z0 + z1) / 2], mat, [0, Math.atan2(x1 - x0, z1 - z0), 0]);
    S.cyl(w / 2, w / 2, .012, [x1, 0, z1], mat, null, 24);
  }
};
// a paved area (a town square): cobbles from x0..x1, z0..z1
KIT.paving = (S, x0, x1, z0, z1, mat = 'cobbles') => S.boxAt(x0, x1, 0, .014, z0, z1, KIT.mats(S)[mat]);
// a well: stone ring, dark water deep inside, two posts, a little roof, crank and bucket
KIT.well = (S, o) => {
  const M = KIT.mats(S), gr = KIT.part(S, o.at, o.rot || 0);
  S.cyl(.55, .58, .62, [0, 0, 0], M.stone, null, 24, gr); S.cyl(.42, .42, .01, [0, .5, 0], S.mat('#1c2a33', { emi: 1 }), null, 24, gr);
  S.mesh(new THREE.CylinderGeometry(.43, .43, .12, 24, 1, true).translate(0, .56, 0), M.stoneD, [0, 0, 0], null, gr).material = S.mat('#8f887e', { pat: 'stone', sc: .16, side: 'double' });
  for (const s of [-1, 1]) S.boxAt(s * .5 - .05, s * .5 + .05, .62, 1.55, -.05, .05, M.timber, gr);
  for (const s of [1, -1]) { const m = S.mesh(new THREE.BoxGeometry(1.35, .05, .5), M.thatch, [0, 1.62, s * .2], [s * .55, 0, 0], gr); m.rotation.x = s * .55; }
  S.cyl(.04, .04, 1.1, [.55, 1.25, 0], M.woodD, [0, 0, QT], 8, gr);
  S.cyl(.008, .008, .5, [0, .78, 0], M.iron, null, 4, gr);
  S.lathe([[0, 0], [.09, 0], [.11, .16], [0, .16]], [0, .62, 0], M.woodV, 14, gr);
  return { group: gr };
};
// a pit dug in the ground: a hole cut in the ground sheet, earth walls, floor, a lip of dug-out earth. Returns its floor y.
KIT.pit = (S, o) => {
  const M = KIT.mats(S), r = o.r ?? 1.0, dep = o.depth ?? 1.3, [x, z] = o.at;
  S.hole(x, z, r);
  S.mesh(new THREE.CylinderGeometry(r, r * .92, dep, 36, 1, true).translate(0, -dep / 2, 0), M.earth, [x, 0, z]);
  S.cyl(r * .92, r * .92, .02, [x, -dep - .02, z], M.earth, null, 36);
  S.mesh(new THREE.TorusGeometry(r + .12, .1, 8, 40).rotateX(QT), M.dirt, [x, .02, z]).scale.set(1, .45, 1);
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + .4; KIT.rock(S, { at: [x + Math.sin(a) * (r + .3), z + Math.cos(a) * (r + .3)], s: .1 + hash(i) * .08, seed: i + 3, dark: true }); }
  return { floor: -dep };
};
// a pond: water with drifting ripples, stones round the edge, reeds
KIT.pond = (S, o) => {
  const M = KIT.mats(S), [x, z] = o.at, rx = o.rx ?? 2, rz = o.rz ?? 1.3;
  S.mesh(new THREE.CircleGeometry(1, 48).rotateX(-QT), M.water, [x, .012, z]).scale.set(rx, 1, rz);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + hash(i) * .3; KIT.rock(S, { at: [x + Math.cos(a) * (rx + .05), z + Math.sin(a) * (rz + .05)], s: .12 + hash(i + 9) * .1, seed: i }); }
  const reed = S.mat('#6f9a3a');
  for (let i = 0; i < 9; i++) { const a = 2.2 + hash(i * 3) * 1.4, rr = .8 + hash(i * 5) * .15; S.mesh(new THREE.ConeGeometry(.02, .5 + hash(i) * .3, 5).translate(0, .3, 0), reed, [x + Math.cos(a) * rx * rr, 0, z + Math.sin(a) * rz * rr], [hash(i) * .2 - .1, 0, hash(i + 2) * .2 - .1]); }
};
// the far distance: rolling hills and puffy clouds (or a Flow backdrop with S.backdrop)
KIT.sky = (S, o = {}) => {
  const M = KIT.mats(S);
  for (const [x, y, z, r, sx] of o.hills || [[-18, -9, -45, 14, 1.5], [16, -12, -58, 18, 1.6], [-2, -8, -70, 12, 2], [40, -10, 20, 14, 1.4], [-42, -12, 10, 16, 1.5], [10, -14, 60, 18, 1.8]])
    S.ball(r, [x, y, z], x % 2 ? M.hill : M.hill2, [sx, .75, 1]);
  for (const [x, y, z, s] of o.clouds || [[-26, 17, -75, 1.2], [14, 21, -88, 1.5], [36, 15, -60, 1], [-6, 25, -110, 1.8], [-48, 22, -90, 1.3], [60, 20, 10, 1.4], [-60, 18, 30, 1.2]])
    for (const [dx, dy, r] of [[0, .4, 3.2], [-3.6, 0, 2.4], [3.4, .1, 2.6], [-1.6, 1.8, 2.3], [1.8, 1.7, 2.1], [6, -.3, 1.7]]) { const m = S.ball(r * s, [x + dx * s, y + dy * s, z], M.cloud, [1, .78, .7]); if (S.look !== 'ink') m.layers.set(3); }
};
