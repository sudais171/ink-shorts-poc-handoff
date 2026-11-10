// PROOF OF CONCEPT (2026-11-09): KayKit CC0 models + procedural architecture + a painted floor picture, one shading
// treatment (no gloss, no polish streaks), real lights, the character's own shadow, a pocBottle that follows his hand.
// ?flags: noshadow=1 (no card shadow), notex=1 (no pictures), nochar=1 (no character), still=1 (no camera move)
const FL = k => q.get(k) === '1';
const V = set3d({ look: 'clean', time: 'day', polish: 0, shadowCenter: [-.2, 0], shadowSize: 6,
  fx: { ao: 1.6, dof: 2.2, glow: .25, sat: 1.0, con: 1.04 } });
V.cardShadows = !FL('noshadow');
V.ground(V.mat('#6b4a33', { spec: 0 }));
const tex = (url, rep) => { const t = new THREE.TextureLoader().load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = ''; return t; };
const floorTex = FL('notex') ? null : tex('../assets/floor_painted.png');
PRELOAD.push(new Promise(r => { if (!floorTex) return r(); const i = setInterval(() => { if (floorTex.image && floorTex.image.complete) { clearInterval(i); r(); } }, 30); }));

// ---------- procedural architecture: a small parlour, 3.6 x 3 person-units, open to the camera at +z ----------
const X0 = -1.8, X1 = 1.8, Z0 = -1.5, Z1 = 1.6, RH = 1.65;
V.room(X0, X1, Z0, Z1, RH);
V.U.sun.value.set(-.3, .5, .85).normalize();
const plaster = V.mat('#e9c99a', { pat: 'plaster', sc: .35, spec: 0 }), panel = V.mat('#7a4a2c', { pat: 'wood', sc: .08, spec: 0 });
const panelIn = V.mat('#8d5835', { pat: 'wood', sc: .08, spec: 0 }), trim = V.mat('#5a341e', { pat: 'wood', sc: .06, spec: 0 }), beam = V.mat('#4d2e1b', { pat: 'wood', sc: .1, spec: 0, axis: 1 });
V.mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2), floorTex ? V.mat('#ffffff', { map: floorTex, mapSc: [2.2, 1.9], spec: 0 }) : V.mat('#9a6a42', { pat: 'boards', sc: .12, spec: 0 }), [0, .002, (Z0 + Z1) / 2]);
// back wall (with a door), left wall (with a window the sun comes through), right wall
const TW = .08, win = { z0: -1.1, z1: .55, y0: .35, y1: 1.42 }, door = { x0: .55, x1: 1.15, y1: 1.2 };
V.boxAt(X0, door.x0, 0, RH, Z0 - TW, Z0, plaster); V.boxAt(door.x1, X1, 0, RH, Z0 - TW, Z0, plaster); V.boxAt(door.x0, door.x1, door.y1, RH, Z0 - TW, Z0, plaster);
V.boxAt(door.x0 + .02, door.x1 - .02, 0, door.y1, Z0 - TW - .02, Z0 - TW + .01, V.mat('#6e3f24', { pat: 'boards', sc: .1, axis: 1, spec: 0 }));   // the closed door leaf
V.boxAt(X0 - TW, X0, 0, win.y0, Z0, Z1, plaster); V.boxAt(X0 - TW, X0, win.y1, RH, Z0, Z1, plaster);
V.boxAt(X0 - TW, X0, win.y0, win.y1, Z0, win.z0, plaster); V.boxAt(X0 - TW, X0, win.y0, win.y1, win.z1, Z1, plaster);
V.boxAt(X1, X1 + TW, 0, RH, Z0, Z1, plaster);
// wainscot: a dark rail, raised panels below it, a baseboard; a crown moulding; ceiling and beams
const wains = (axis, fixed, a0, a1, inward) => {
  const B = (u0, u1, y0, y1, d0, d1, m) => axis === 'x' ? V.boxAt(u0, u1, y0, y1, fixed + d0 * inward, fixed + d1 * inward, m) : V.boxAt(fixed + d0 * inward, fixed + d1 * inward, y0, y1, u0, u1, m);
  const S2 = (u0, u1, y0, y1, d0, d1, m) => axis === 'x' ? B(u0, u1, y0, y1, Math.min(d0, d1), Math.max(d0, d1), m) : B(u0, u1, y0, y1, Math.min(d0, d1), Math.max(d0, d1), m);
  S2(a0, a1, 0, .52, 0, .02, panel); S2(a0, a1, .5, .55, 0, .04, trim); S2(a0, a1, 0, .07, 0, .035, trim);
  for (let u = a0 + .06; u < a1 - .3; u += .4) S2(u + .04, u + .34, .12, .44, .02, .03, panelIn);
  S2(a0, a1, RH - .06, RH, 0, .05, trim);
};
const back = (u0, u1) => wains('x', Z0, u0, u1, 1);
back(X0, door.x0 - .06); back(door.x1 + .06, X1);
wains('z', X0, Z0, win.z0 - .05, 1); wains('z', X0, win.z1 + .05, Z1, 1); wains('z', X1, Z0, Z1, -1);
for (const x of [door.x0 - .06, door.x1]) V.boxAt(x, x + .06, 0, door.y1 + .06, Z0, Z0 + .03, trim); V.boxAt(door.x0 - .06, door.x1 + .06, door.y1, door.y1 + .07, Z0, Z0 + .03, trim);
V.boxAt(X0, X0 + .04, win.y0 - .04, win.y0, win.z0 - .05, win.z1 + .05, trim); V.boxAt(X0, X0 + .1, win.y0 - .06, win.y0 - .02, win.z0 - .06, win.z1 + .06, trim);
V.boxAt(X0 - TW, X0, win.y1, win.y1 + .04, win.z0, win.z1, trim);
for (const z of [win.z0, (win.z0 + win.z1) / 2, win.z1]) V.boxAt(X0 - .05, X0 - .02, win.y0, win.y1, z - .015, z + .015, trim);
V.boxAt(X0 - .05, X0 - .02, (win.y0 + win.y1) / 2 - .015, (win.y0 + win.y1) / 2 + .015, win.z0, win.z1, trim);
V.boxAt(X0 - TW, X1 + TW, RH, RH + .05, Z0 - TW, Z1, V.mat('#d9b98c', { pat: 'plaster', sc: .4, spec: 0 }));
for (let x = X0 + .45; x < X1; x += .9) V.boxAt(x - .06, x + .06, RH - .12, RH, Z0, Z1, beam);
// outside the window: a bright yard so it is not a blank hole
V.boxAt(X0 - 3, X0 - .2, 0, .02, -4, 4, V.mat('#7dbb52', { pat: 'grass', sc: .5, col2: '#5f9a3c' }));
V.boxAt(X0 - 2.5, X0 - 2.3, 0, 1.4, -3, 3, V.mat('#c9a477', { pat: 'boards', sc: .1, axis: 1 }));

// ---------- models (KayKit CC0, scaled to real sizes: 1 unit = a person's height) ----------
const pocTop = .43;
V.gltf(A.F + 'table_medium.gltf', [-.62, 0, .05], { s: .43 / 1.0 * 1, rot: .1 }).then(g => g.scale.set(.42, .43, .3));
V.gltf(A.F + 'chair_A_wood.gltf', [-.95, 0, .3], { s: .42, rot: 1.2 });
V.gltf(A.F + 'lamp_table.gltf', [-.8, pocTop, -.02], { s: .2 });
V.gltf(A.F + 'rug_rectangle_A.gltf', [.1, 0, .35], { s: .46 }); V.floors.push({ x0: .1 - .69, x1: .1 + .69, z0: .35 - .46, z1: .35 + .46, y: .046 });
V.gltf(A.F + 'shelf_B_small_decorated.gltf', [-.2, .78, Z0 + .02], { s: .5 });
V.gltf(A.D + 'barrel_large.gltf.glb', [-1.35, 0, -.55], { s: .26 });
V.gltf(A.R + 'crate.gltf', [1.25, 0, -.9], { s: .16, rot: .3 });
V.gltf(A.R + 'crate.gltf', [1.3, .128, -.88], { s: .13, rot: -.2 });
V.gltf(A.D + 'candle_lit.gltf.glb', [1.3, .232, -.88], { s: .14 });
let pocBottle; V.gltf(A.D + 'bottle_A_labeled_brown.gltf.glb', [0, 0, 0], { s: .19 }).then(g => pocBottle = g);
// real lights where the scene shows a source: the table lamp's bulb, the candle on the crates
V.light([-.8, pocTop + .3, -.02], '#ffb35c', 1.1);
V.light([1.3, .42, -.88], '#ff9440', .7);

// ---------- the character, and the pocBottle he picks up from the table, holds, and sets down on the barrel ----------
const pocHero = FL('nochar') ? null : age('host', 'adult', 'he', { costume: 'vest', color: '#2f6e4c', color2: '#e9d6a8', tie: '#b8382e', seed: 7 });
const POCHAND = { px: null, w: null };
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const PK = { rest: [300, 1560], table: [60, 1370], hold: [390, 1120], barrel: [20, 1375] };
const T1 = 1.0, T2 = 1.6, T3 = 3.4, T4 = 4.1;          // reach the table, lift, reach the barrel, let go
const pocHandAt = t => t < T1 ? lerp2(PK.rest, PK.table, ss2(.3, T1, t)) : t < T2 ? lerp2(PK.table, PK.hold, ss2(T1 + .1, T2, t))
  : t < T3 ? lerp2(PK.hold, PK.barrel, ss2(T2 + 1, T3, t)) : lerp2(PK.barrel, PK.rest, ss2(T4, T4 + .6, t));
const pocCapture = h => { const m = g.getTransform(); POCHAND.px = [m.a * h[0] + m.c * h[1] + m.e, m.b * h[0] + m.d * h[1] + m.f]; };
let pocCard = null;
if (pocHero) pocCard = V.person(pocHero, t => ({ legs: 'stand', ...EXPR.happy(.4), look: -.5,
  arms: [{ h: pocHandAt(t), prop: pocCapture }, ARM.side(1)] }), [-.12, .12], { face: .35, noShadow: true });
V.afterCards = (t) => {
  if (!pocBottle) return;
  if (pocCard && POCHAND.px) { const k = pocCard; k.mesh.updateMatrixWorld();
    const u = POCHAND.px[0] / k.cw, v = 1 - POCHAND.px[1] / k.ch, w = k.opt.w || 1, h = k.opt.h || 1.25;
    POCHAND.w = k.mesh.localToWorld(new THREE.Vector3((u - .5) * w, v * h, 0)); }
  const onTable = [-.453, pocTop, .052], onBarrel = [-.478, pocTop, .168];
  const held = POCHAND.w && t >= T1 && t < T4;
  if (held) pocBottle.position.set(POCHAND.w.x, POCHAND.w.y - .1, POCHAND.w.z + .005);
  else if (t < T1) pocBottle.position.set(...onTable); else pocBottle.position.set(...onBarrel);
};

// ---------- camera: a slow arc round the room, always framed on him and the table ----------
const pocCam = t => { const k = FL('still') ? 0 : ss2(0, 6, t), a = -.35 + .7 * k;
  return { pos: [-.35 + Math.sin(a) * 2.0, .9 - .15 * k, .25 + Math.cos(a) * 2.0], at: [-.3, .55, .05] }; };
const SCENE = { dur: 6, captions: false, plates: {}, sfx: [], shots: [{ t: 0, light: 'day', cam: () => ({ noClamp: true }),
  back: () => { const c = FL('wide') ? { pos: [1.0, 1.45, 2.3], at: [-.25, .25, -.1] } : pocCam(TNOW || 0); V.render(c.pos, c.at, FL('wide') ? 56 : 44); } }] };
