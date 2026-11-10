// TURNTABLE (POC r6): one prop, camera and light fixed, the prop turned: t=0 front, 1 side, 2 back, 3 three-quarter.
const TP = q.get('prop') || 'barrel.glb', TH = +(q.get('h') || .5);
const V = set3d({ look: 'clean', time: 'day', polish: 0, shadowCenter: [0, 0], shadowSize: 4,
  fx: { ao: 1.2, dof: 0, glow: .25, sat: 1.0, con: 1.05, outline: 1, outlineW: 2.8, toon: 1, sunK: .42 } });
V.U.sun.value.set(-.45, .65, .62).normalize(); V.U.sunC.value.set(1.06, 1.03, .97); V.U.shdC.value.set(.6, .62, .86);
const TTX = (() => { const t = new THREE.TextureLoader().load('../assets2/grain2.png'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = ''; PRELOAD.push(new Promise(r => { const i = setInterval(() => { if (t.image && t.image.complete) { clearInterval(i); r(); } }, 30); })); return t; })();
const TM = { P_wood: ['#d18a52', { map: TTX, world: 1, mapSc: [1.6, 1.6] }], P_wood2: ['#b06a3a', { map: TTX, world: 1, mapSc: [1.9, 1.9] }],
  P_iron: ['#3a3f5a', { spec: .45 }], P_brass: ['#e0a940', { spec: .6 }], P_wax: ['#f4ead2', {}], P_glass: ['#ffd590', { spec: .7, alpha: .42 }], P_flame: ['#fff0b0', { emi: 1 }],
  P_canvas: ['#ffffff', { map: (() => { const t = new THREE.TextureLoader().load('../assets2/outdoor.png'); t.colorSpace = ''; PRELOAD.push(new Promise(r => { const i = setInterval(() => { if (t.image && t.image.complete) { clearInterval(i); r(); } }, 30); })); return t; })() }],
  P_glaze: ['#f2e2c0', { spec: .2 }], P_band: ['#2f746e', { spec: .1 }],
  P_paint: ['#3d7f8f', { spec: .08 }], P_paint2: ['#346c7a', { spec: .06 }] };
if (q.get('pal') === 'court') Object.assign(TM, { P_wood: ['#a0603a', { map: TTX, world: 1, mapSc: [1.6, 1.6], spec: .05 }], P_wood2: ['#7a4226', { map: TTX, world: 1, mapSc: [1.9, 1.9], spec: .05 }],
  P_brass: ['#d09a40', { spec: .55 }] });
Object.assign(TM, { P_leather: ['#8a2632', { spec: .2 }], P_paper: ['#efe6cf', {}], P_tag: ['#d8b070', {}], P_green: ['#2f8a5a', { spec: .3 }] });
const tmat = m => { const n = (m.name || '').replace(/\.\d+$/, ''); const [c, o] = TM[n] || ['#' + m.color.getHexString(), {}]; return V.mat(c, { ...o, side: 'double' }); };
let TPROP = null;
PRELOAD.push(new Promise(res => new GLTFLoader().load('../downloads/hero/' + TP, gl => { const sc = gl.scene; sc.traverse(o => { if (o.isMesh) o.material = tmat(o.material); });
  const bb = new THREE.Box3().setFromObject(sc), s = TH / (bb.max.y - bb.min.y); sc.scale.setScalar(s); const b2 = new THREE.Box3().setFromObject(sc);
  sc.position.set(-(b2.min.x + b2.max.x) / 2, -b2.min.y, -(b2.min.z + b2.max.z) / 2); TPROP = new THREE.Group(); TPROP.add(sc); V.scene.add(TPROP); res(); })));
V.ground(V.mat('#c9b8a6', { spec: 0 }));
const ANG = [0, Math.PI / 2, Math.PI, -Math.PI / 4];
const SCENE = { dur: 4, captions: false, plates: {}, sfx: [], shots: [{ t: 0, light: 'day', cam: () => ({ noClamp: true }), back: () => {
  if (TPROP) TPROP.rotation.y = ANG[Math.min(3, Math.floor(TNOW || 0))];
  const d = Math.max(TH * 2.6 + .5, (q.get("d") || 0) * 1); V.render([0, TH * .95 + .2, d], [0, TH * .45, 0], 36); } }] };
