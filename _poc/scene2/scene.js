// POC ROUND 2 (2026-11-09): Poly Haven CC0 models with painted colour maps, a parlour built in Blender (bevelled panels,
// mouldings, panelled door, glazed window, beamed ceiling), lighting baked in Blender into the vertex colours.
// ?bake=0 live light only | 1 baked only | 2 baked bounce + live sun and lamp (default)   ?cam=a|b|c|d|move   ?nochar=1
const QV = k => q.get(k);
const BAKE = +(QV('bake') ?? 2), CAMK = QV('cam') || 'move';
const V = set3d({ look: 'clean', time: 'day', polish: 0, shadowCenter: [-.2, -.3], shadowSize: 6,
  fx: { ao: 1.2, dof: 2.4, glow: .35, sat: 1.06, con: 1.05, outline: .85 } });
V.cardShadows = true; V.cardLight = true;
V.U.sun.value.set(-.3, .5, .85).normalize();
V.U.sunC.value.set(1.12, 1.0, .84); V.U.shdC.value.set(.9, .85, .96);          // warm sun, cool lilac shade
V.room(-1.8, 1.8, -1.5, 1.6, 1.7);
const R2TOP = 0.5735;
const r2tx = u => { const t = new THREE.TextureLoader().load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = ''; return t; };
const R2TX = { floor: r2tx('../assets2/floor.png'), paper: r2tx('../assets2/wallpaper.png'), panel: r2tx('../assets2/panel.png'), fabric: r2tx('../assets2/fabric.png'), curtain: r2tx('../assets2/curtain.png'), rug: r2tx('../assets2/rug.png'), plaster: r2tx('../assets2/plaster.png') };
PRELOAD.push(...Object.values(R2TX).map(t => new Promise(r => { const i = setInterval(() => { if (t.image && t.image.complete) { clearInterval(i); r(); } }, 30); })));
const r2bk = BAKE ? { bake: BAKE, bakeK: BAKE === 1 ? 2.1 : 3.0 } : {};
// one material per kind of surface: matte painted wood, matte plaster, controlled metal, see-through glass
const R2SURF = {
  S_floor: ['#ffffff', { map: R2TX.floor, world: 1, mapSc: [1.3, 1.3], spec: .04 }],
  S_wallpaper: ['#ffffff', { map: R2TX.paper, world: 1, mapSc: [.85, .85], spec: 0 }],
  S_panel: ['#b8744a', { map: R2TX.floor, world: 1, mapSc: [1.6, 1.6], spec: .05 }],
  S_trim: ['#8e5232', { map: R2TX.floor, world: 1, mapSc: [2.4, 2.4], spec: .06 }],
  S_ceiling: ['#ffffff', { map: R2TX.plaster, world: 1, mapSc: [.7, .7], spec: 0 }],
  S_curtain: ['#ffffff', { map: R2TX.curtain, world: 1, mapSc: [3, 3], spec: 0 }],
  S_rug: ['#ffffff', { map: R2TX.rug, spec: 0 }],
  S_beam: ['#7c4426', { map: R2TX.floor, world: 1, mapSc: [1.6, 1.6], spec: .04 }],
  S_door: ['#a8603a', { map: R2TX.floor, world: 1, mapSc: [1.4, 1.4], spec: .05 }],
  S_glass: ['#cfe6f0', { spec: .7, alpha: .22 }],
  S_brass: ['#d7a43c', { spec: .6 }],
};
const r2toSet = (m, mesh) => {
  const name = m.name || '', geoBake = !!mesh.geometry.attributes.color;
  if (R2SURF[name]) { const [c, o] = R2SURF[name]; return V.mat(c, { ...o, ...(geoBake && name !== 'S_ceiling' ? r2bk : {}), side: 'double' }); }
  const glass = /glass/i.test(name), tex = m.map || null, arm = m.metalnessMap || m.roughnessMap || null;
  for (const t of [tex, arm]) if (t) { t.colorSpace = ''; t.needsUpdate = true; }
  return V.mat(tex ? '#ffffff' : '#' + m.color.getHexString(), { map: tex, arm, spec: glass ? .7 : .03, alpha: glass ? .25 : 1, ...(geoBake ? r2bk : {}), side: 'double' });
};
const r2load = (url, fn) => PRELOAD.push(new Promise((res, rej) => new GLTFLoader().load(url, gl => { fn(gl.scene); res(); }, null, rej)));
r2load(`room_full.glb`, sc => {
  sc.traverse(o => { if (o.isMesh) o.material = r2toSet(o.material, o); });
  V.scene.add(sc);
});
// outside the window: grass, a fence, hedges and trees in the sun (seen soft through the glass)
V.boxAt(-9, -1.85, -.01, 0, -6, 6, V.mat('#86c15a', { pat: 'grass', sc: .5, col2: '#5f9a3c', spec: 0 }));
for (let z = -4; z < 4; z += .32) V.boxAt(-3.2, -3.15, 0, .45, z, z + .12, V.mat('#e9dcc2', { spec: 0 }));
V.boxAt(-3.22, -3.12, .28, .33, -4, 4, V.mat('#e9dcc2', { spec: 0 }));
for (const [x, z, s] of [[-4.6, -1.8, 1.3], [-5.4, .9, 1.6], [-4.2, 2.6, 1.1], [-6.5, -.4, 1.8]]) KIT.tree(V, { at: [x, z], s });
for (const [x, z] of [[-2.6, -2.2], [-2.8, 1.4]]) KIT.bush(V, { at: [x, z], s: .8 });
KIT.sky(V, { clouds: [] });
// the lantern on the table is a real light
V.light([-.68, R2TOP + .17, -.06], '#ffad5a', 1.3);
V.light([-.62, 1.28, 0], '#ffb766', 1.8);            // the chandelier's candles
V.floors.push({ x0: -1.32, x1: .14, z0: -.42, z1: .5, y: .012 });

// ---------- the jug he picks up, the character ----------
let R2JUG = null; r2load('../downloads/ph/jug_01/jug_01_1k.gltf', sc => { sc.traverse(o => { if (o.isMesh) o.material = r2toSet(o.material, o); }); sc.scale.setScalar(1 / 1.75); R2JUG = sc; V.scene.add(sc); });
const R2HERO = QV('nochar') ? null : age('host', 'adult', 'he', { costume: 'vest', color: '#2f6e4c', color2: '#e9d6a8', tie: '#b8382e', seed: 7 });
const R2PH = { px: null, w: null };
const r2l2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const R2PKS = { rest: [300, 1560], table: [70, 1150], hold: [380, 1080], put: [-90, 1165] };
const P1 = 1.0, P2 = 1.6, P3 = 3.4, P4 = 4.1;
const r2handAt = t => t < P1 ? r2l2(R2PKS.rest, R2PKS.table, ss2(.3, P1, t)) : t < P2 ? r2l2(R2PKS.table, R2PKS.hold, ss2(P1 + .1, P2, t))
  : t < P3 ? r2l2(R2PKS.hold, R2PKS.put, ss2(P2 + 1, P3, t)) : r2l2(R2PKS.put, R2PKS.rest, ss2(P4, P4 + .6, t));
const r2grab = h => { const m = g.getTransform(); R2PH.px = [m.a * h[0] + m.c * h[1] + m.e, m.b * h[0] + m.d * h[1] + m.f]; };
const R2AT = [-.11, -.03];
const r2card = R2HERO ? V.person(R2HERO, t => ({ legs: 'stand', ...EXPR.happy(.4), look: -.5, arms: [{ h: r2handAt(t), prop: r2grab }, ARM.side(1)] }), R2AT, { face: .35, noShadow: true }) : null;
const SPOT_A = [-.423, R2TOP, .086], SPOT_B = [-.512, R2TOP, .103], GRIP = .1;
V.afterCards = t => {
  if (!R2JUG) return;
  if (r2card && R2PH.px) { r2card.mesh.updateMatrixWorld(); const u = R2PH.px[0] / r2card.cw, v = 1 - R2PH.px[1] / r2card.ch;
    R2PH.w = r2card.mesh.localToWorld(new THREE.Vector3((u - .5) * (r2card.opt.w || 1), v * (r2card.opt.h || 1.25), 0)); }
  if (R2PH.w && t >= P1 && t < P4) R2JUG.position.set(R2PH.w.x, R2PH.w.y - GRIP, R2PH.w.z + .01); else R2JUG.position.set(...(t < P1 ? SPOT_A : SPOT_B));
  R2JUG.rotation.y = 2.4;
};
// ---------- cameras: a = the round-1 framing, b = wide, c = close on the table, d = low, move = slow arc ----------
const R2CAMS = { a: { pos: [.3, .9, 2.1], at: [-.3, .55, .05], fov: 44 }, b: { pos: [1.55, 1.35, 1.55], at: [-.5, .45, -.55], fov: 58 },
  c: { pos: [.32, .82, .78], at: [-.38, .62, .02], fov: 42 }, d: { pos: [.85, .28, 1.4], at: [-.4, .62, -.4], fov: 52 } };
const r2camNow = t => { if (R2CAMS[CAMK]) return R2CAMS[CAMK]; const k = ss2(0, 6, t), a = -.35 + .7 * k;
  return { pos: [-.3 + Math.sin(a) * 2.0, .9 - .15 * k, .2 + Math.cos(a) * 2.0], at: [-.3, .55, .05], fov: 44 }; };
const SCENE = { dur: 6, captions: false, plates: {}, sfx: [], shots: [{ t: 0, light: 'day', cam: () => ({ noClamp: true }),
  back: () => { const c = r2camNow(TNOW || 0); V.render(c.pos, c.at, c.fov); } }] };
