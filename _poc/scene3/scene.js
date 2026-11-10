// POC ROUND 3 (2026-11-09): one room, three asset treatments (?set=kk KayKit | ph Poly Haven | st Blender-stylized),
// the reference-style treatment (soft two-tone light, cool purple shade, warm lamp pools, coloured outlines, flattened
// detail), a hand drawn over the jug it holds, a painted layered view outside.   ?cam=a|b|c|d|e|f|g|h|move
const R3 = (() => { const q2 = k => q.get(k); const SET = q2('set') || 'st', CAMK = q2('cam') || 'a';
  const xhr = u => { const r = new XMLHttpRequest(); r.open('GET', u, false); r.send(); return JSON.parse(r.responseText); };
  return { SET, CAMK, TOPS: xhr(`../tops_${SET}.json`), LAY: xhr('../layout.json') }; })();
const R8 = R3.SET === 'hero5', R7 = R3.SET === 'hero4' || R8, R6 = R3.SET === 'hero3' || R7, R5 = R3.SET === 'hero2' || R6;
const LM = q.get('lm') || 'mix';   // r7 light modes: day (window only) | lamp (evening, lamps only) | mix
const V = set3d({ look: 'clean', time: 'day', polish: 0, shadowCenter: [-.2, -.3], shadowSize: 6,
  fx: { ao: 1.0, dof: 2.0, glow: .28, sat: 1.0, con: 1.06, outline: +(q.get('outl') || 1), outlineW: 2.8, toon: 1, sunK: R5 ? .42 : .75, vignette: R6 ? .3 : R5 ? .38 : 0, aoK: R6 ? .6 : .85 } });
const R3NEWL = q.get('light') !== 'old';
V.cardShadows = true; V.cardLight = true;
V.U.sun.value.set(-.3, .5, .85).normalize();
if (R7) { if (LM === 'lamp') { V.U.sunC.value.set(.04, .04, .06); V.U.shdC.value.set(.34, .3, .52); } else if (R8 && LM === 'day') { V.U.sunC.value.set(1.1, 1.02, .9); V.U.shdC.value.set(.92, .76, 1.0); }   // r8: daylight has a sky bounce - the shade stays cool, but walls keep their colour
  else { V.U.sunC.value.set(1.1, 1.02, .9); V.U.shdC.value.set(.64, .54, .82); } }   // r7: plum-indigo shade like the references
else if (R6) { V.U.sunC.value.set(1.08, 1.02, .92); V.U.shdC.value.set(.6, .58, .92); }   // r6: a warmer sun, a richer violet-blue shade, a touch lighter so shadow stays readable
else if (R5) { V.U.sunC.value.set(1.06, 1.03, .97); V.U.shdC.value.set(.58, .6, .84); }
else if (R3NEWL) { V.U.sunC.value.set(1.06, 1.03, .97); V.U.shdC.value.set(.56, .58, .86); }   // r4: neutral daylight, cool blue-violet shade - only the flames are warm
else { V.U.sunC.value.set(1.16, 1.02, .84); V.U.shdC.value.set(.66, .62, .86); }
V.room(-1.8, 1.8, -1.5, 1.6, 1.7);
const R3TX = (() => { const tx = u => { const t = new THREE.TextureLoader().load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = ''; return t; };
  const o = { floor: tx(R6 ? '../assets2/floor3.png' : '../assets2/floor.png'), paper: tx('../assets2/wallpaper.png'), curtain: tx('../assets2/curtain.png'), rug: tx('../assets2/rug.png'), plaster: tx('../assets2/plaster.png'), out: tx('../assets2/outdoor.png'), grain: tx(R5 ? '../assets2/grain2.png' : '../assets2/grain.png'), wall2: tx(R6 ? '../assets2/wall3.png' : '../assets2/wall2.png'), wall4: tx('../assets2/wall4.png'), curtain2: tx('../assets2/curtain2.png'), rug2: tx('../assets2/rug2.png'), canvas: (() => { const t = tx('../assets2/outdoor.png'); t.flipY = false; return t; })() };
  PRELOAD.push(...Object.values(o).map(t => new Promise(r => { const i = setInterval(() => { if (t.image && t.image.complete) { clearInterval(i); r(); } }, 30); }))); return o; })();
const R3BK = R5 ? { bake: 3 } : { bake: 2, bakeK: q.get('light') === 'old' ? 2.6 : 2.15 };
const R3SURF = {
  S_floor: [R6 ? '#e6c2a2' : R3NEWL ? '#bba796' : '#e0bf9c', { map: R3TX.floor, world: 1, mapSc: [1.3, 1.3], mipB: 2.5 }],
  S_wallpaper: ['#ffffff', { map: R7 ? R3TX.wall4 : R5 ? R3TX.wall2 : R3TX.paper, world: 1, mapSc: R5 ? [.7, .7] : [.85, .85] }],
  S_panel: R7 ? ['#2f746e', { spec: .05 }] : [R6 ? '#cf7c48' : '#c27c4e', { map: R3TX.floor, world: 1, mapSc: [1.6, 1.6], mipB: 2 }],
  S_trim: [R7 ? '#7e3c22' : R6 ? '#aa5c32' : '#9a5a36', { map: R3TX.floor, world: 1, mapSc: [2.4, 2.4], mipB: 2, ...(R8 ? { spec: .05 } : {}) }],   // r9: wood trim is matte (it had the default gloss .35 and read as metal)
  S_ceiling: ['#fff1dc', { map: R3TX.plaster, world: 1, mapSc: [.7, .7], mipB: 3 }],
  S_beam: ['#8a4e2c', { map: R3TX.floor, world: 1, mapSc: [1.6, 1.6], mipB: 2 }],
  S_door: R7 ? ['#2a6460', { spec: .05 }] : ['#b46a40', { map: R3TX.floor, world: 1, mapSc: [1.4, 1.4], mipB: 2 }],
  S_curtain: ['#ffffff', { map: R7 ? R3TX.curtain2 : R3TX.curtain, world: 1, mapSc: [3, 3], mipB: 1 }],
  S_rug: ['#ffffff', { map: R7 ? R3TX.rug2 : R3TX.rug, mipB: .5 }],
  S_hall: ['#e0a860', { map: R3TX.plaster, world: 1, mapSc: [.7, .7], mipB: 3 }],
  P_canvas: ['#ffffff', { map: R3TX.canvas }],
  S_glass: ['#d8ecf4', { spec: .7, alpha: .18 }],
  // r4 hero props: painted wood with a few grain strokes, dark blue iron with a controlled highlight, warm lit glass
  P_glaze: ['#f2e2c0', { spec: .2 }], P_band: ['#2f746e', { spec: .1 }],
  P_paint: ['#3d7f8f', { spec: .08 }], P_paint2: ['#346c7a', { spec: .06 }],
  P_wood: ['#d18a52', { map: R3TX.grain, world: 1, mapSc: R5 ? [1.6, 1.6] : [2.2, 2.2] }], P_wood2: ['#b06a3a', { map: R3TX.grain, world: 1, mapSc: R5 ? [1.9, 1.9] : [2.6, 2.6] }],
  P_iron: ['#3a3f5a', { spec: .45 }], P_brass: ['#e0a940', { spec: .6 }], P_wax: ['#f4ead2', {}],
  P_glass: ['#ffd590', { spec: .7, alpha: .42 }], P_flame: ['#fff0b0', { emi: 1 }],
  S_brass: R8 ? ['#a87c34', { spec: .4 }] : R7 ? ['#c0913c', { spec: .3 }] : ['#e0b048', { spec: .6 }],
};
const R3MIP = { kk: 0, ph: 3.2, st: 3.5, hero: 3.2 }[R3.SET], R3GAIN = { kk: 1.15, ph: 3.2, st: 3.2, hero: 3.2 }[R3.SET];
const r3mat = (m, mesh) => {
  const name = (m.name || '').replace(/\.\d+$/, ''), geoBake = !!mesh.geometry.attributes.color;
  if (R3SURF[name]) { const [c, o] = R3SURF[name]; return V.mat(c, { ...o, ...(geoBake && name !== 'S_ceiling' ? R3BK : {}), side: 'double' }); }
  const glass = /glass/i.test(name), tex = m.map || null, arm = m.metalnessMap || m.roughnessMap || null;
  for (const t of [tex, arm]) if (t) { t.colorSpace = ''; t.needsUpdate = true; }
  return V.mat(tex ? '#ffffff' : '#' + m.color.getHexString(), { map: tex, arm, mipB: R3MIP, gain: R3GAIN, spec: glass ? .7 : .04, alpha: glass ? .25 : 1, ...(geoBake ? R3BK : {}), side: 'double' });
};
const r3load = (url, fn) => PRELOAD.push(new Promise((res, rej) => new GLTFLoader().load(url, gl => { fn(gl.scene); res(); }, null, rej)));
r3load(`room_${R3.SET}${R5 ? '_ao' : ''}.glb`, sc => { sc.traverse(o => { if (o.isMesh) o.material = r3mat(o.material, o); }); V.scene.add(sc); });
// outside: a fence and hedge in front, then the painted layered landscape (unlit, it is the daylight)
V.boxAt(-5.9, -1.85, -.01, 0, -8, 8, V.mat('#7cba52', { pat: 'grass', sc: .5, col2: '#5f9a3c', spec: 0 }));
for (let z = -4; z < 4; z += .3) V.boxAt(-2.6, -2.55, 0, .42, z, z + .11, V.mat('#f1e6cf', { spec: 0 }));
V.boxAt(-2.62, -2.52, .26, .31, -4, 4, V.mat('#f1e6cf', { spec: 0 }));
V.boxAt(-3.3, -2.9, 0, .38, -5, 5, V.mat('#4f8f45', { pat: 'leaves', sc: .4, col2: '#3c7a38', spec: 0 }));
V.mesh(new THREE.PlaneGeometry(16, 8).translate(0, 4, 0).rotateY(Math.PI / 2), V.mat(R7 && LM === 'lamp' ? '#3a4470' : '#ffffff', { map: R3TX.out, emi: 1 }), [-6, -2.85, 0]);   // r4: horizon at window height
KIT.sky(V, { clouds: [] });
// real light sources, each with a small glowing flame so the bloom has a cause
const R3T = R3.TOPS, lanY = (R3T.LANTERN_LOW || .44) + .1, chY = (R3T.CHANDELIER_LOW || 1.2) + .08;
if (R7) {             // r7: five real flames, each a light (lamp mode = evening, stronger; day mode = off)
  const K = LM === 'day' ? 0 : LM === 'lamp' ? 1.9 : 1, sy = R3T.SCONCE || 1.0;
  if (R8 && LM === 'day') V.light([-1.45, .95, -.35], '#d4dcff', 1.6);   // r8: in daylight this slot is the window's cool sky light
  else V.light([-.68, lanY, -.06], '#ffa752', .55 * K); V.light([-.62, (R3T.CHANDELIER_LOW || 1.26) + .2, 0], '#ffb766', .8 * K);
  V.light([-.55, (R3T.CANDLE || .65) - .01, -1.38], '#ff9a48', (R8 ? .5 : .35) * K, R8 ? 2.4 : 0);
  V.light([.25, sy - .03, -1.41], '#ffb060', (R8 ? .65 : .45) * K, R8 ? 2.4 : 0); V.light([-.95, sy - .03, -1.41], '#ffb060', (R8 ? .65 : .45) * K, R8 ? 2.4 : 0);   // r9: candle flames reach ~0.4, not the cornice
  if (R8) V.light([1.12, (R3T.SCONCE3 || 1.0) - .03, -2.81], '#ffa850', LM === 'lamp' ? .75 : .55);   // r8: the hallway sconce - an inside light, lit in every mode
} else {
V.light([-.68, lanY, -.06], '#ffa752', R6 ? .55 : R5 ? .5 : R3NEWL ? 1.1 : 1.3); V.light([-.62, chY, 0], '#ffb766', R6 ? .85 : R5 ? .7 : R3NEWL ? 1.5 : 1.6); V.light([-.55, (R3T.CANDLE || .8) + .02, -1.38], '#ff9a48', .5);
for (const [p, r] of [[[-.68, lanY - .02, -.06], .012], [[-.62, chY, 0], .02], [[-.55, (R3T.CANDLE || .8) + .01, -1.38], .008]]) V.ball(r, p, V.mat('#fff2c0', { emi: 1 }));
}
V.floors.push({ x0: -1.32, x1: .14, z0: -.42, z1: .5, y: .012 });

// ---------- the character and the jug (fingers drawn over the jug's handle) ----------
const R3TOP = R3T.TABLE || .44;
let R3JUG = null; r3load('../' + R3.LAY.jug[R3.SET], sc => { sc.traverse(o => { if (o.isMesh) o.material = r3mat(o.material, o); });
  const bb = new THREE.Box3().setFromObject(sc), s = R3.LAY.jug.h / (bb.max.y - bb.min.y); sc.scale.setScalar(s); R3JUG = new THREE.Group(); R3JUG.add(sc);
  const b2 = new THREE.Box3().setFromObject(sc); sc.position.set(-(b2.min.x + b2.max.x) / 2, -b2.min.y, -(b2.min.z + b2.max.z) / 2); V.scene.add(R3JUG); });
const R3HERO = q.get('nochar') ? null : age('host', 'adult', 'he', { costume: 'vest', color: '#2f6e4c', color2: '#e9d6a8', tie: '#b8382e', seed: 7 });
const R3PH = { px: null, w: null };
const r3l2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const R3K = window.R3K || { rest: [300, 1560], table: [70, 1395], hold: [380, 1090], put: [-60, 1395] };
const Q1 = 1.0, Q2 = 1.6, Q3 = 3.4, Q4 = 4.1;
const r3hand = t => t < Q1 ? r3l2(R3K.rest, R3K.table, ss2(.3, Q1, t)) : t < Q2 ? r3l2(R3K.table, R3K.hold, ss2(Q1 + .1, Q2, t))
  : t < Q3 ? r3l2(R3K.hold, R3K.put, ss2(Q2 + 1, Q3, t)) : r3l2(R3K.put, R3K.rest, ss2(Q4, Q4 + .6, t));
const r3grab = h => { const m = g.getTransform(); R3PH.px = [m.a * h[0] + m.c * h[1] + m.e, m.b * h[0] + m.d * h[1] + m.f]; };
const R3AT = window.R3AT || [-.2, -.02], r3pose = t => ({ legs: 'stand', ...EXPR.happy(.4), look: -.5, arms: [{ h: r3hand(t), prop: r3grab }, ARM.side(1)] });
const r3card = R3HERO ? V.person(R3HERO, r3pose, R3AT, { face: .35, noShadow: true }) : null;
// the same character again, only the holding hand, on a card a little nearer the camera than the jug
// a fist closing round the handle: the palm behind it, four knuckles over the front, the thumb on top
const r3fist = (g2, kk) => { if (!R3PH.px) return; const [x, y] = R3PH.px, s = Math.max(.6, kk * 9);
  g2.save(); g2.translate(x, y); g2.lineJoin = 'round';
  g2.fillStyle = '#2c1e3c'; g2.beginPath(); g2.ellipse(-2 * s, 1 * s, 9 * s, 10 * s, -.3, 0, 7); g2.fill();
  for (let i = 0; i < 4; i++) { g2.beginPath(); g2.ellipse(-6 * s, (-6 + i * 4.4) * s, 4.2 * s, 2.6 * s, 0, 0, 7); g2.fill(); }
  g2.strokeStyle = '#4a3a62'; g2.lineWidth = 1.2 * s; for (let i = 1; i < 4; i++) { g2.beginPath(); g2.moveTo(-9.5 * s, (-8 + i * 4.4) * s); g2.lineTo(-3 * s, (-8 + i * 4.4) * s); g2.stroke(); }
  g2.fillStyle = '#2c1e3c'; g2.beginPath(); g2.ellipse(-4 * s, -9 * s, 6 * s, 3 * s, -.5, 0, 7); g2.fill();
  g2.restore(); };
if (R3HERO) V.person(R3HERO, r3pose, R3AT, { face: .35, noShadow: true, depthBias: .32, after: r3fist,
  clip: () => R3PH.px && (TNOW >= Q1 - .05 && TNOW < Q4 + .05) ? [R3PH.px[0], R3PH.px[1], 34, 30] : null });
const R3SPOT = { a: [-.559, R3TOP, .125], b: [-.633, R3TOP, .142] };
V.afterCards = (t, cam) => {
  if (!R3JUG) return;
  if (r3card && R3PH.px) { r3card.mesh.updateMatrixWorld(); const u = R3PH.px[0] / r3card.cw, v = 1 - R3PH.px[1] / r3card.ch;
    R3PH.w = r3card.mesh.localToWorld(new THREE.Vector3((u - .5) * (r3card.opt.w || 1), v * (r3card.opt.h || 1.25), 0)); }
  const rx = .957, rz = -.29, side = .055;                   // the jug sits on the far side of the hand
  const yaw = 1.28 + (window.R3JYAW ?? Math.PI);
  if (R3PH.w && t >= Q1 && t < Q4) R3JUG.position.set(R3PH.w.x - rx * side, R3PH.w.y - .085, R3PH.w.z - rz * side + .01);
  else { const s = t < Q1 ? R3SPOT.a : R3SPOT.b; R3JUG.position.set(s[0], s[1], s[2]); }
  R3JUG.rotation.y = yaw;
};
const R3CAMS = { a: { pos: [.3, .9, 2.1], at: [-.3, .5, .05], fov: 44 }, b: { pos: [1.55, 1.35, 1.55], at: [-.5, .45, -.55], fov: 58 },
  c: { pos: [-.05, .72, .9], at: [-.55, .55, .06], fov: 44 }, d: { pos: [.85, .28, 1.4], at: [-.4, .62, -.4], fov: 52 },
  e: { pos: [-.75, .55, -.35], at: [-1.42, .25, -1.12], fov: 40 }, f: { pos: [-.55, .6, 1.25], at: [-1.25, .3, .55], fov: 40 },
  g: { pos: [-.2, .75, .55], at: [-.66, .48, -.06], fov: 38 }, k: { pos: [-1.6, .62, 1.35], at: [-.4, .45, -.1], fov: 46 }, p: { pos: [-.15, .85, 1.0], at: [-.95, .3, -.55], fov: 50 }, h: { pos: [.4, .7, .4], at: [-.1, 1.35, -1.2], fov: 60 } };
const r3cam = t => { if (R3CAMS[R3.CAMK]) return R3CAMS[R3.CAMK];
  if (R3.CAMK === 's') return { pos: [-.15, .78, -.55], at: [-.4, .72, -1.5], fov: 48 };
  if (R3.CAMK === 'q2') return { pos: [1.05, .74, .55], at: [.95, .6, -2.9], fov: 46 };
  if (R3.CAMK === 'q') return { pos: [-.1, .8, 1.3], at: [.95, .55, -1.6], fov: 48 };
  if (R3.CAMK === 'through') { const k = ss2(0, 6, t); return { pos: [1.15 - 1.0 * k, .78 - .1 * k, 1.9 - 1.25 * k], at: [-.25 + .9 * k, .5 + .08 * k, -.3 - 1.6 * k], fov: 50 }; }
  if (R3.CAMK === 'orbit') { const k = ss2(0, 6, t), a = .25 + 1.35 * k; return { pos: [-.62 + Math.sin(a) * 1.45, .62 + .12 * Math.sin(k * 3.14), Math.cos(a) * 1.45], at: [-.62, .32, -.1], fov: 50 }; } const k = ss2(0, 6, t), a = -.35 + .7 * k;
  return { pos: [-.3 + Math.sin(a) * 2.0, .9 - .15 * k, .2 + Math.cos(a) * 2.0], at: [-.3, .5, .05], fov: 44 }; };
const SCENE = { dur: 6, captions: false, plates: {}, sfx: [], shots: [{ t: 0, light: 'day', cam: () => ({ noClamp: true }),
  back: () => { const c = r3cam(TNOW || 0); V.render(c.pos, c.at, c.fov); } }] };
