// LIGHT TEST (POC r5): the four hero props in three zones - direct sun | warm lamp only | cool shade only.
// Same light budget as the room (fill ~0.6 cool, sun share .42 - a sunlit surface is its own colour). ?zone=sun|lamp|shade
const LZ = q.get('zone') || 'sun';
const V = set3d({ look: 'clean', time: 'day', polish: 0, shadowCenter: [0, 0], shadowSize: 8,
  fx: { ao: 1.2, dof: 0, glow: .28, sat: 1.0, con: 1.06, outline: 1, outlineW: 2.8, toon: 1, sunK: .42 } });
V.U.sun.value.set(-.35, .6, .7).normalize(); V.U.sunC.value.set(1.06, 1.03, .97); V.U.shdC.value.set(.58, .6, .84);
const LBTX = (() => { const t = new THREE.TextureLoader().load('../assets2/grain2.png'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = ''; PRELOAD.push(new Promise(r => { const i = setInterval(() => { if (t.image && t.image.complete) { clearInterval(i); r(); } }, 30); })); return t; })();
const LBM = { P_wood: ['#d18a52', { map: LBTX, world: 1, mapSc: [1.6, 1.6] }], P_wood2: ['#b06a3a', { map: LBTX, world: 1, mapSc: [1.9, 1.9] }],
  P_iron: ['#3a3f5a', { spec: .45 }], P_brass: ['#e0a940', { spec: .6 }], P_wax: ['#f4ead2', {}], P_glass: ['#ffd590', { spec: .7, alpha: .42 }], P_flame: ['#fff0b0', { emi: 1 }], P_paint: ['#3d7f8f', { spec: .08 }], P_paint2: ['#346c7a', { spec: .06 }] };
const lbmat = m => { const n = (m.name || '').replace(/\.\d+$/, ''); const [c, o] = LBM[n] || ['#' + m.color.getHexString(), {}]; return V.mat(c, { ...o, side: 'double' }); };
const lbload = (f, at, h, rot) => PRELOAD.push(new Promise(res => new GLTFLoader().load('../downloads/hero/' + f, gl => { const sc = gl.scene;
  sc.traverse(o => { if (o.isMesh) o.material = lbmat(o.material); }); const bb = new THREE.Box3().setFromObject(sc), s = h / (bb.max.y - bb.min.y);
  sc.scale.setScalar(s); sc.rotation.y = rot; sc.position.set(at[0], -bb.min.y * s, at[1]); V.scene.add(sc); res(); })));
V.ground(V.mat('#b9a28a', { spec: 0 }));
V.boxAt(-4, 4, 0, 2.2, -1.4, -1.3, V.mat('#8fa39a', { spec: 0 }));                  // a back wall
if (LZ !== 'sun') V.boxAt(-4, 4, 1.5, 1.55, -1.3, 4, V.mat('#7a6a5a', { spec: 0 }));  // a roof: no sun reaches the props
if (LZ === 'lamp') { V.light([0, .75, .25], '#ffa752', 1.4); V.ball(.02, [0, .75, .25], V.mat('#fff2c0', { emi: 1 })); }
lbload('barrel.glb', [-.75, -.2], .5, .5); lbload('table3.glb', [0, -.3], .44, 0); lbload('chair3.glb', [.72, -.15], .6, -.5); lbload('lantern.glb', [0, .25], .2, .4);
const SCENE = { dur: 1, captions: false, plates: {}, sfx: [], shots: [{ t: 0, light: 'day', cam: () => ({ noClamp: true }), back: () => V.render([.15, 1.0, 2.75], [0, .26, -.25], 50) }] };
