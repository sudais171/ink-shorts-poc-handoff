// POC ROUND 10: the courtroom, built with the same production system as the saloon (designed props, Blender room +
// AO bake, the r5-r9 light budget and metal response, three light modes, card shadows, the hand-to-prop attachment).
// ?cam=w|b|ws|p|e|g|c|move  ?lm=day|lamp|mix
const CQ = k => q.get(k);
const CT = (() => { const r = new XMLHttpRequest(); r.open('GET', '../tops_court.json', false); r.send(); return JSON.parse(r.responseText); })();
const CLM = CQ('lm') || 'mix', CCAM = CQ('cam') || 'w';
const V = set3d({ look: 'clean', time: 'day', polish: 0, shadowCenter: [-.3, -.6], shadowSize: 7.5,
  fx: { ao: 1.0, dof: 1.6, glow: .28, sat: 1.0, con: 1.06, outline: 1, outlineW: 2.8, toon: 1, sunK: .42, vignette: +(CQ('vig') ?? .2), aoK: .6 } });
V.cardShadows = true; V.cardLight = true;
V.U.sun.value.set(-.72, .5, .3).normalize();                      // the sun comes in through the left windows
if (CLM === 'lamp') { V.U.sunC.value.set(.04, .04, .06); V.U.shdC.value.set(.3, .32, .55); }
else if (CLM === 'day') { V.U.sunC.value.set(1.1, 1.04, .94); V.U.shdC.value.set(.78, .8, 1.02); }
else { V.U.sunC.value.set(1.1, 1.03, .92); V.U.shdC.value.set(.62, .62, .9); }   // courtroom: a cool blue shade, warm lamps
V.room(-2.6, 2.6, -2.4, 2.6, 2.3);
const CTX = (() => { const tx = u => { const t = new THREE.TextureLoader().load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = ''; return t; };
  const o = { floor: tx('../assets2/court_floor.png'), wall: tx('../assets2/court_wall.png'), runner: tx('../assets2/court_runner.png'), velvet: tx('../assets2/court_velvet.png'),
    grain: tx('../assets2/grain2.png'), plaster: tx('../assets2/plaster.png'), out: tx('../assets2/outdoor.png') };
  PRELOAD.push(...Object.values(o).map(t => new Promise(r => { const i = setInterval(() => { if (t.image && t.image.complete) { clearInterval(i); r(); } }, 30); }))); return o; })();
const CBK = { bake: 3 };
const W1 = ['#a0603a', { map: CTX.grain, world: 1, mapSc: [1.6, 1.6], spec: .05 }], W2 = ['#7a4226', { map: CTX.grain, world: 1, mapSc: [1.9, 1.9], spec: .05 }];
const CSURF = {
  S_floor: ['#ffffff', { map: CTX.floor, world: 1, mapSc: [.83, .83], spec: .04 }],
  S_wall: ['#ffffff', { map: CTX.wall, world: 1, mapSc: [.7, .7], spec: 0 }],
  S_panel: W1, S_dais: W2, S_beam: ['#6e3a22', { map: CTX.grain, world: 1, mapSc: [1.6, 1.6], spec: .05 }],
  S_trim: ['#6a3820', { map: CTX.grain, world: 1, mapSc: [2.2, 2.2], spec: .05 }],
  S_door: ['#8a4a2a', { map: CTX.grain, world: 1, mapSc: [1.4, 1.4], spec: .05 }],
  S_ceiling: ['#f0e2c4', { map: CTX.plaster, world: 1, mapSc: [.7, .7], mipB: 3, spec: 0 }],
  S_gold: ['#b8893a', { spec: .4 }], S_runner: ['#ffffff', { map: CTX.runner, world: 1, mapSc: [1.19, 1.19], spec: 0 }],
  S_banner: ['#8a2632', { spec: .05 }], S_seal: ['#2a3b6a', { spec: .1 }], S_curtain: ['#ffffff', { map: CTX.velvet, world: 1, mapSc: [3, 3], spec: 0 }],
  S_glass: ['#d8ecf4', { spec: .7, alpha: .18 }],
  P_wood: W1, P_wood2: W2, P_brass: ['#c99a42', { spec: .5 }], P_leather: ['#8a2632', { spec: .2 }], P_iron: ['#3a3f5a', { spec: .45 }],
  P_paper: ['#efe6cf', {}], P_tag: ['#d8b070', {}], P_green: ['#2f8a5a', { spec: .3 }], P_glass: ['#ffd590', { spec: .7, alpha: .42 }],
  P_wax: ['#f4ead2', {}], P_flame: ['#fff0b0', { emi: 1 }],
};
const cmat = (m, mesh) => { const n = (m.name || '').replace(/\.\d+$/, ''), bake = !!mesh.geometry.attributes.color;
  const [c, o] = CSURF[n] || ['#' + m.color.getHexString(), {}]; return V.mat(c, { ...o, ...(bake && n !== 'S_ceiling' ? CBK : {}), side: 'double' }); };
const cload = (url, fn) => PRELOAD.push(new Promise((res, rej) => new GLTFLoader().load(url, gl => { fn(gl.scene); res(); }, null, rej)));
cload('room_court.glb', sc => { sc.traverse(o => { if (o.isMesh) o.material = cmat(o.material, o); }); V.scene.add(sc); });
V.floors.push({ x0: -1.6, x1: 1.6, z0: -2.4, z1: -1.1, y: .25 });
// outside the windows: lawn, a hedge, the painted town
V.boxAt(-7, -2.65, -.01, 0, -8, 8, V.mat('#7cba52', { pat: 'grass', sc: .5, col2: '#5f9a3c', spec: 0 }));
V.boxAt(-3.4, -3.0, 0, .45, -5, 5, V.mat('#4f8f45', { pat: 'leaves', sc: .4, col2: '#3c7a38', spec: 0 }));
V.mesh(new THREE.PlaneGeometry(16, 8).translate(0, 4, 0).rotateY(Math.PI / 2), V.mat(CLM === 'lamp' ? '#3a4470' : '#ffffff', { map: CTX.out, emi: 1 }), [-6.5, -2.6, 0]);
KIT.sky(V, { clouds: [] });
// lights: two chandeliers, the banker's lamp, two sconces; daylight swaps one lamp for the windows' sky light
{ const K = CLM === 'day' ? 0 : CLM === 'lamp' ? 1.8 : 1, chY = (CT.CHAND1_LOW || 1.86) + .12, sY = (CT.SCONCE1 || 1.52) - .05;
  V.light([-1.0, chY, .1], '#ffb766', 1.0 * K, .9); V.light([1.0, chY, .1], '#ffb766', 1.0 * K, .9);
  if (CLM === 'day') V.light([-2.3, 1.2, -.3], '#d4dcff', 1.8); else V.light([.36, (CT.LAMP_LOW || .8) + .16, -1.6], '#ffd27a', .9 * K, 1.8);
  V.light([-1.5, sY, -2.32], '#ffb060', .7 * K, 2.2); V.light([1.5, sY, -2.32], '#ffb060', .7 * K, 2.2);
  if (CQ('bounce') !== '0') V.light([.2, .7, 2.45], CLM === 'lamp' ? '#d89060' : '#c8d0f0', (CLM === 'lamp' ? .35 : CLM === 'day' ? .75 : .6) * +(CQ('bk') ?? 1.5), .75); }   // r11: light bounced off the gallery floor under the windows - lifts the pews, low and soft

// ---------- the judge, seated behind the bench, and the gavel ----------
const JUDGE = CQ('nochar') ? null : age('judge', 'elder', 'he', { costume: 'coat', color: '#1d1b28', color2: '#f2efe6', seed: 9 });
if (JUDGE && CQ('coat') !== 'gloss') JUDGE.cloth = 'matte';   // r11: woven robe, no shine streak
const cl2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const TI = +(CQ('ti') ?? (CCAM === 'move' ? 8.6 : 0));          // when the gavel action starts
// r12: the hand path is set in WORLD positions on the desk (the gavel's grip), so grip and contact are exact by construction
const BLOCK = [-.38, (CT.BLOCK || .826), -1.72], REST = window.GREST || [-.1, (CT.BENCH || .804) + .026, -1.72];
const HW = { rest: [.03, .828, -1.70], pick: REST, up: [-.18, 1.0, -1.72], hit: [-.24, BLOCK[1] + .0375, -1.72], put: REST };
const cl3 = (a, b, k) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * k);
const lift = (p, k, d) => [p[0], p[1] + d * Math.sin(Math.PI * k), p[2]];
const ACT = u => {
  const E = ss2;
  if (u < .6) return { h: HW.rest, th: 0, held: false };
  if (u < 1.2) { const k = E(.6, 1.2, u); return { h: lift(cl3(HW.rest, HW.pick, k), k, .06), th: 0, held: false }; }    // an arc over the desk
  if (u < 1.6) { const k = E(1.2, 1.6, u); return { h: cl3(HW.pick, HW.up, k), th: -1.0 * k, lie: 1 - k, held: true }; }
  if (u < 1.8) { const k = E(1.6, 1.8, u); return { h: cl3(HW.up, HW.hit, k * k), th: -1.0 + 1.0 * k * k, held: true }; }     // strike 1
  if (u < 2.05) { const k = E(1.8, 2.05, u); return { h: cl3(HW.hit, cl3(HW.hit, HW.up, .55), k), th: -.55 * k, held: true }; }
  if (u < 2.2) { const k = E(2.05, 2.2, u); return { h: cl3(cl3(HW.hit, HW.up, .55), HW.hit, k * k), th: -.55 + .55 * k * k, held: true }; }   // strike 2
  if (u < 2.7) return { h: HW.hit, th: 0, held: true };
  if (u < 3.2) { const k = E(2.7, 3.2, u); return { h: cl3(HW.hit, HW.put, k), th: 0, lie: k, held: true }; }
  if (u < 3.9) { const k = E(3.3, 3.9, u); return { h: lift(cl3(HW.put, HW.rest, k), k, .05), th: 0, held: false }; }
  return { h: HW.rest, th: 0, held: false };
};
// r12: the judge sits IN the chair - his card is 0.12 in front of the backrest and his hips on the cushion (0.345 above
// the dais = the cushion top). The gavel arm is not drawn on the card (it cannot reach 0.35 forward inside a flat
// plane): the card only reports where its left shoulder is, and the arm is a stroke in 3D from there to the hand.
const CPH = { sh: null, shw: null };
const cshoulder = h => { const m = g.getTransform(); CPH.sh = [m.a * h[0] + m.c * h[1] + m.e, m.b * h[0] + m.d * h[1] + m.f]; };
const jpose = t => { const a = ACT(t - TI); return { ...POSE.sitDown(t, -9, .345), mouth: 'neutral', lidTilt: .45, browTilt: .7,
  ...(a.held && Math.abs(a.th) < .05 && t - TI > 1.7 && t - TI < 2.3 ? { mouth: 'teeth', browTilt: 1.1 } : {}),
  arms: [{ h: [412, 1186], prop: cshoulder }, ARM.side(1)] }; };
const JAT = [0, -2.08];
const jcard = JUDGE ? V.person(JUDGE, jpose, JAT, { face: 0, seat: .345, noShadow: true, yaw: 0, depthBias: 0 }) : null;
const ARMM = V.mat('#2a2134', { spec: 0 }); let ARMMESH = null, ARMTIP = null;
const armTube = (S, H) => {               // a two-part arm (upper .2, fore .2) with the elbow bent out and down
  const s = new THREE.Vector3(...S), h = new THREE.Vector3(...H), d = h.clone().sub(s), L = .205, n = d.length(), m = s.clone().add(h).multiplyScalar(.5);
  const bend = new THREE.Vector3(-.55, -.8, .15); bend.sub(d.clone().multiplyScalar(bend.dot(d) / (n * n))).normalize();
  const e = m.add(bend.multiplyScalar(Math.sqrt(Math.max(0, L * L - n * n / 4))));
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([s, e, h]), 16, .011, 8, false);
  if (ARMMESH) { ARMMESH.geometry.dispose(); ARMMESH.geometry = geo; } else { ARMMESH = new THREE.Mesh(geo, ARMM); V.scene.add(ARMMESH); ARMTIP = new THREE.Mesh(new THREE.SphereGeometry(.011, 10, 8), ARMM); V.scene.add(ARMTIP); }
  ARMTIP.position.copy(h);   // a plain rounded stick end, like his other arm
  return e;
};
// the hand: a small flat drawing that always faces the camera - a white cuff toward the elbow, a fist round the handle
// while holding, an open hand lying on the desk otherwise
let CELB = null;
const handCard = JUDGE ? V.card2d((cw, ch, ppu, side, cam) => {
  const a = ACT(TNOW - TI); if (!CELB || !CQ('fist')) return;   // plain stick end by default (the cast has no hands) const H = new THREE.Vector3(...a.h), E2 = CELB.clone().sub(H), e = cam.matrixWorld.elements;
  let ux = E2.x * e[0] + E2.y * e[1] + E2.z * e[2], uy = -(E2.x * e[4] + E2.y * e[5] + E2.z * e[6]); const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
  const s = ppu * .0055, x = cw / 2, y = ch / 2;
  g.save(); g.lineCap = 'round';
  g.strokeStyle = '#1a1424'; g.lineWidth = 9 * s; g.beginPath(); g.moveTo(x + ux * 7 * s, y + uy * 7 * s); g.lineTo(x + ux * 15 * s, y + uy * 15 * s); g.stroke();
  g.strokeStyle = '#f2efe6'; g.lineWidth = 6.6 * s; g.stroke();
  g.translate(x, y); g.fillStyle = '#2c1e3c';
  if (a.held) { g.beginPath(); g.ellipse(-2 * s, 1 * s, 9 * s, 10 * s, -.3, 0, 7); g.fill();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-6 * s, (-6 + i * 4.4) * s, 4.2 * s, 2.6 * s, 0, 0, 7); g.fill(); }
    g.strokeStyle = '#4a3a62'; g.lineWidth = 1.2 * s; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-9.5 * s, (-8 + i * 4.4) * s); g.lineTo(-3 * s, (-8 + i * 4.4) * s); g.stroke(); } }
  else { g.rotate(Math.atan2(-uy, -ux)); g.beginPath(); g.ellipse(2 * s, 0, 10 * s, 6.5 * s, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(4 * s, -6 * s, 4 * s, 2.4 * s, -.5, 0, 7); g.fill(); }
  g.restore(); }, t => { const h = ACT(t - TI).h; return [h[0], h[2]]; }, { w: .14, h: .14, y: t => ACT(t - TI).h[1] - .07 + 40 / 1024, noShadow: true, depthBias: .02 }) : null;   // centre of the drawing = the hand point
// the gavel: grip at its group origin, handle along +x, head at -x (head centre 0.14 from the grip)
let GAV = null; cload('../downloads/court/gavel.glb', sc => { sc.traverse(o => { if (o.isMesh) o.material = cmat(o.material, o); });
  sc.position.x = -.07; GAV = new THREE.Group(); GAV.add(sc); V.scene.add(GAV); });
V.afterCards = (t, cam) => {
  const a = ACT(t - TI);
  if (jcard && CPH.sh) { jcard.mesh.updateMatrixWorld(); const u = CPH.sh[0] / jcard.cw, v = 1 - CPH.sh[1] / jcard.ch;
    const sw = jcard.mesh.localToWorld(new THREE.Vector3((u - .5) * (jcard.opt.w || 1), v * (jcard.opt.h || 1.25), 0));
    CELB = armTube([sw.x, sw.y, sw.z], a.h); }
  if (!GAV) return;
  if (a.held) GAV.position.set(...a.h); else GAV.position.set(...REST);
  GAV.rotation.set((a.lie ?? (a.held ? 0 : 1)) * Math.PI / 2, 0, a.th);
};
// ---------- cameras ----------
const CC = { w: { pos: [1.6, 1.65, 2.45], at: [-.3, .7, -1.2], fov: 60 }, b: { pos: [0, 1.05, .55], at: [0, .95, -1.9], fov: 50 },
  ws: { pos: [-.35, .85, .45], at: [-1.55, .45, -.75], fov: 48 }, p: { pos: [2.3, .95, 2.45], at: [-.5, .35, 1.3], fov: 55 },
  e: { pos: [.75, .85, .5], at: [1.45, .5, -.45], fov: 42 }, g: { pos: [-.05, 1.12, -.15], at: [-.1, .88, -1.7], fov: 46 },
  c: { pos: [.9, 1.25, -.95], at: [0, .95, -2.0], fov: 52 }, sd: { pos: [1.15, 1.15, -.6], at: [-.14, .9, -1.85], fov: 50 } };
const PATH = [[0, 'w'], [2.4, 'w'], [3.6, 'p'], [4.8, 'p'], [5.9, 'ws'], [6.8, 'ws'], [7.7, 'e'], [8.1, 'e'], [8.9, 'g']];
const ccam = t => { if (CCAM !== 'move') return CC[CCAM];
  for (let i = 0; i < PATH.length - 1; i++) { const [ta, A] = PATH[i], [tb, Bk] = PATH[i + 1]; if (t < tb) { const k = ss2(ta, tb, t), a = CC[A], b = CC[Bk];
    const L = (p, r) => p.map((v, j) => v + (r[j] - v) * k); return { pos: L(a.pos, b.pos), at: L(a.at, b.at), fov: a.fov + (b.fov - a.fov) * k }; } }
  return CC.g; };
const SCENE = { dur: 13, captions: false, plates: {}, sfx: [], shots: [{ t: 0, light: 'day', cam: () => ({ noClamp: true }),
  back: () => { const c = ccam(TNOW || 0); V.render(c.pos, c.at, c.fov); } }] };
