// Ink Shorts engine - player: shots, camera, transitions, plates (images or video frames), sprites, captions,
// storyboard and sound events.
//   window.renderFrame(t) -> Promise<PNG data URL>     window.ready -> resolves once plates/sprites are loaded
//
// SCENE = {
//   dur, captions?: bool (defaults to CONFIG.captions),
//   plates: { name: { src: 'backgrounds/file.jpg', scale: [[footY, personH], [footY2, personH2]] }   (measured, see stand())
//             | 'backgrounds/file.jpg' | { video: 'backgrounds/clip/', fps: 30, count: 240, ext: 'jpg', scale }
//             | { src, set: true | 1.5, scale } (a big set: the whole picture is the world, see plateBox) },
//   sprites: { name: 'assets/x.png' | { src, split: true } }      (green/plain-background cut-outs, see sprites.js)
//   sfx: [ [t, 'name', volume?], ... ] or t => [...]               (sound effects; whips add whooshes automatically)
//   music: { mood: 'playful'|'tense'|'happy'|'sad'|'epic'|..., volume: 0..1 } | false
//   whooshVol: volume of the automatic 'whip' swipe on every whip transition (default 0.15 - barely there, short)
//   shots: [{ t, plate, light, match?, bgBlur?, cam: t => ({ z, cx, cy, noClamp? }), draw: t => {}, back?: t => {},
//             fore?: t => {} (foreground layer that moves 1.3x with the camera), post?: (t, toScreen) => {},
//             enter?: 'cut'|'whip'|'whipL'|'whipR'|'flash'|'zoom' (default: whip when the plate changes, else cut),
//             zoomAt?: [x, y], zoomFrom?: 2.5, zoomDur?: 0.8 (the 'zoom' reveal, see renderFrame),
//             plateTo?: { plate, t, dur } (cross-fade to another version of the same picture inside the shot),
//             stage?: stage3d(...), path?: stage.path([...]) (a 3D stage shot instead of a flat plate, see stage3d.js),
//             punch?: [beat times] (quick zoom kicks), shake?: t => px, whip?: t => px, capY?, key?: storyboard time }]
// }
const LAYER = newLayer(), LCTX = LAYER.getContext('2d');
const BLUR = newLayer();
const PLATES = {}, VIDEO_CACHE = new Map();
const WHIP = 0.24;              // seconds of a whip-pan transition

async function plateImage(name, shot, t) {
  const p = PLATES[name]; if (!p) return null;
  if (!p.video) return p;
  const i = Math.max(0, Math.min(p.count - 1, Math.floor((t - shot.t + (p.start || 0)) * p.fps)));
  const src = `${p.video}${String(i + 1).padStart(4, '0')}.${p.ext || 'jpg'}`;
  if (!VIDEO_CACHE.has(src)) {
    if (VIDEO_CACHE.size > 90) VIDEO_CACHE.delete(VIDEO_CACHE.keys().next().value);
    VIDEO_CACHE.set(src, new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('missing frame ' + src)); im.src = src; }));
  }
  return VIDEO_CACHE.get(src);
}
// The world of a shot is its plate. A normal plate is cover-fitted to the screen and cropped (world = W x H). A big set
// (plate meta set: true) keeps the whole picture: scaled so it covers the screen, top-left at 0,0, nothing cropped -
// a 16:9 painting in a 9:16 video is a world ~3 screens wide (3413 x 1920) for the camera to travel across.
// set: 1.5 paints it 1.5x bigger, which leaves room to pull back (z down to 1/1.5 shows the whole height).
function plateBox(name) {
  const p = name && PLATES[name], m = (name && PLATE_META[name]) || {};
  if (!p || p.video || !m.set) return { x: 0, y: 0, w: W, h: H };
  const k = Math.max(W / p.width, H / p.height) * (m.set === true ? 1 : m.set);
  return { x: 0, y: 0, w: p.width * k, h: p.height * k };
}
function drawPlate(img, blur = 0, name = null) {
  g.save(); if (blur) g.filter = `blur(${blur}px)`;
  const m = name && PLATE_META[name];
  if (m && m.set && !PLATES[name].video) { const b = plateBox(name); g.drawImage(img, b.x, b.y, b.w, b.h); }
  else { const k = Math.max(W / img.width, H / img.height); g.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k); }
  g.restore();
}
// (camera paths across a big set: camPath / camStop in character.js, next to the placing helpers)
function shotIndex(t) { let i = 0; while (i + 1 < SCENE.shots.length && t >= SCENE.shots[i + 1].t) i++; return i; }
function enterOf(i) {
  const s = SCENE.shots[i]; if (!s) return 'cut';
  if (s.enter) return s.enter;
  return i > 0 && SCENE.shots[i - 1].plate !== s.plate ? (i % 2 ? 'whipL' : 'whipR') : 'cut';
}
// camera with transitions: whip-in at the start of a shot, whip-out at its end when the next shot whips in
function camOf(i, t) {
  const shot = SCENE.shots[i], S = Object.assign({ z: 1, cx: W / 2, cy: H / 2 }, shot.cam ? shot.cam(t) : {});
  let blur = shot.whip ? shot.whip(t) : 0;
  for (const b of shot.punch || []) S.z *= 1 + 0.1 * (t >= b ? Math.exp(-7 * (t - b)) * Math.cos(10 * (t - b)) * Math.min(1, (t - b) * 30) : 0);
  const en = enterOf(i), next = SCENE.shots[i + 1], ex = next ? enterOf(i + 1) : 'cut';
  const dirOf = e => e === 'whipL' ? -1 : 1;
  if (en.startsWith('whip') && t < shot.t + WHIP) { const k = 1 - ss2(shot.t, shot.t + WHIP, t); S.cx += dirOf(en) * k * k * 0.45 * W / S.z; blur = Math.max(blur, 110 * k); }
  if (next && ex.startsWith('whip') && t > next.t - WHIP * 0.6) { const k = ss2(next.t - WHIP * 0.6, next.t, t); S.cx -= dirOf(ex) * k * k * 0.45 * W / S.z; blur = Math.max(blur, 110 * k); }
  if (!S.noClamp) {                      // stay inside the plate's world (a big set is wider/taller than the screen)
    const B = plateBox(shot.plate); S.z = Math.max(S.z, W / B.w, H / B.h);
    const vw = W / S.z, vh = H / S.z;
    S.cx = Math.min(B.x + B.w - vw / 2, Math.max(B.x + vw / 2, S.cx)); S.cy = Math.min(B.y + B.h - vh / 2, Math.max(B.y + vh / 2, S.cy));
  }
  S.blur = blur; S.flash = en === 'flash' ? 1 - ss2(shot.t, shot.t + 0.25, t) : 0;
  return S;
}

// ---------- captions: 1-2 words per card, timed from WORDS [{w, s, e}] ----------
let CARDS = [];
function buildCards(words, dur) {
  const out = [], endP = w => /[.,!?;:]$/.test(w), clean = s => s.replace(/[.,!?;:"]/g, '');
  for (let i = 0; i < words.length; i++) {
    const a = words[i], b = words[i + 1];
    if (a.s >= dur) break;
    if (b && !endP(a.w) && clean(a.w).length + clean(b.w).length <= 9 && b.s - a.s < 0.35) { out.push({ text: clean(a.w) + ' ' + clean(b.w), s: a.s, e: b.e, end: endP(b.w) }); i++; }
    else out.push({ text: clean(a.w), s: a.s, e: a.e, end: endP(a.w) });
  }
  out.forEach((c, i) => { const n = out[i + 1]; c.e = n ? (c.end ? Math.min(n.s, c.e + 0.12) : n.s) : dur; });
  return out;
}
const CAP_SIZE = H > W ? 84 : 72;
function captionText(text, x, y, size = CAP_SIZE) {
  g.save();
  g.font = `900 ${size}px "Arial Black", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(text, x + 4, y + 6);
  g.strokeStyle = '#000'; g.lineWidth = size * 0.155; g.strokeText(text, x, y);
  g.fillStyle = '#fff'; g.fillText(text, x, y);
  g.restore();
}
function captionAt(t, y) {
  const c = CARDS.find(c => t >= c.s && t < c.e); if (!c) return;
  const pop = 0.88 + 0.12 * ss2(c.s, c.s + 0.08, t);
  g.save(); g.translate(W / 2, y); g.scale(pop, pop); captionText(c.text, 0, 0); g.restore();
}
const captionsOn = () => (q.get('captions') ? q.get('captions') !== '0' : (SCENE.captions ?? CFG.captions)) !== false;

// ---------- frame ----------
const TRANS = newLayer();
// 'zoom' reveal (enter: 'zoom'): the previous shot keeps pulling back and shrinks away while this shot - usually the
// same place painted from high above - starts zoomed in on zoomAt (the spot where the previous view sits in this
// picture) and pulls back with it, so the two read as one rising camera move.
window.renderFrame = async t => {
  t = storyT(t);                                   // another language's voice: its clock -> the scene's own timing
  TNOW = t;
  const i = shotIndex(t), shot = SCENE.shots[i], zd = shot.zoomDur ?? .8;
  if (i > 0 && enterOf(i) === 'zoom' && t < shot.t + zd) {
    const k = ss2(shot.t, shot.t + zd, t), f = shot.zoomFrom ?? 2.5;
    await drawFrame(i - 1, t);
    const tc = TRANS.getContext('2d'), tw = TRANS.width, th = TRANS.height, fe = .22 * Math.min(1, k * 3);
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, tw, th); tc.drawImage(cv, 0, 0);
    if (fe > 0) {                                  // feather the old picture's edges so it melts into the new one (no box)
      tc.globalCompositeOperation = 'destination-in';
      for (const [x1, y1] of [[tw, 0], [0, th]]) {
        const gr = tc.createLinearGradient(0, 0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(fe, '#000'); gr.addColorStop(1 - fe, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        tc.fillStyle = gr; tc.fillRect(0, 0, tw, th);
      }
      tc.globalCompositeOperation = 'source-over';
    }
    const toS = await drawFrame(i, t, { z: L2(f, 1, k), at: shot.zoomAt, w: 1 - k });
    const p = shot.zoomAt ? toS(...shot.zoomAt) : [W / 2, H / 2], s = L2(1, 1 / f, k);
    MAIN.save(); baseXf(MAIN); MAIN.globalAlpha = 1 - ss2(.25, .9, k);
    MAIN.translate(p[0], p[1]); MAIN.scale(s, s); MAIN.translate(-W / 2, -H / 2); MAIN.drawImage(TRANS, 0, 0, W, H); MAIN.restore();
  } else await drawFrame(i, t);
  baseXf(MAIN); g = MAIN;
  if (captionsOn() && CARDS.length) captionAt(t, shot.capY || (H > W ? 1248 : 900));
  return cv.toDataURL('image/png');
};
// one shot's picture at time t into MAIN (no captions); mod = { z: zoom multiplier, at: [x, y], w: 0..1 pull of the
// camera centre towards `at` } (used by the zoom reveal). Returns toScreen.
async function drawFrame(i, t, mod = null) {
  const shot = SCENE.shots[i];
  PLATE_NOW = shot.plate || (shot.stage && shot.stage.plate) || null;
  const S = camOf(i, t), L = applyLight(shot.light);
  if (mod) { S.z *= mod.z; if (mod.at) { S.cx = L2(S.cx, mod.at[0], mod.w); S.cy = L2(S.cy, mod.at[1], mod.w); } }
  const sh = shot.shake ? shot.shake(t) : 0;
  const camXf = (c, depth = 1) => { baseXf(c); c.translate(W / 2 + sh * Math.sin(t * 70), H / 2 + sh * Math.cos(t * 55)); c.scale(S.z, S.z); c.translate(-(W / 2 + (S.cx - W / 2) * depth), -(H / 2 + (S.cy - H / 2) * depth)); };
  const toScreen = (x, y) => [W / 2 + (x - S.cx) * S.z, H / 2 + (y - S.cy) * S.z];
  const img = shot.plate ? await plateImage(shot.plate, shot, t) : shot.stage ? PLATES[shot.stage.plate] : null;
  g = MAIN; baseXf(MAIN); MAIN.globalCompositeOperation = 'source-over'; MAIN.globalAlpha = 1;
  MAIN.fillStyle = '#000'; MAIN.fillRect(0, 0, W, H);
  camXf(MAIN);
  // a 3D stage shot (stage3d.js): the painting seen by the stage's camera; its cards are drawn after shot.draw
  if (shot.stage) { shot.stage.view(shot.path ? shot.path(t) : shot.stage.home()); shot.stage.drawBack(); }
  else if (img) drawPlate(img, shot.bgBlur || 0, shot.plate);
  // a second version of the same picture (the bell now in the hole, the fence built) fades in over the first
  const pt = shot.plateTo;
  if (pt && t > pt.t) { const im2 = await plateImage(pt.plate, shot, t); if (im2) { g.save(); g.globalAlpha = ss2(pt.t, pt.t + (pt.dur ?? .6), t); drawPlate(im2, shot.bgBlur || 0, pt.plate); g.restore(); } }
  if (shot.back) shot.back(t);
  // everything drawn over the plate goes to a layer so the light preset can tint it
  baseXf(LCTX); LCTX.clearRect(0, 0, W, H); camXf(LCTX);
  g = LCTX; if (shot.draw) shot.draw(t, toScreen);
  if (shot.stage) shot.stage.flush();
  if (shot.fore) { camXf(LCTX, 1.3); shot.fore(t, toScreen); }
  g = MAIN;
  tintLayer(LCTX, L, img ? plateMean(img) : null, shot.match ?? 0.1);
  MAIN.setTransform(1, 0, 0, 1, 0, 0); MAIN.drawImage(LAYER, 0, 0); baseXf(MAIN);
  if (shot.post) shot.post(t, toScreen);
  gradeFrame(L);
  // motion blur for whips / fast moves: smear copies of the frame along x
  if (S.blur > 1) {
    const b = BLUR.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, BLUR.width, BLUR.height); b.drawImage(cv, 0, 0);
    MAIN.save(); MAIN.setTransform(1, 0, 0, 1, 0, 0); MAIN.globalAlpha = 0.16;
    for (let j = -4; j <= 4; j++) if (j) MAIN.drawImage(BLUR, j * S.blur * RES / 4, 0);
    MAIN.restore();
  }
  if (S.flash > 0) { MAIN.save(); baseXf(MAIN); MAIN.fillStyle = `rgba(255,255,255,${S.flash})`; MAIN.fillRect(0, 0, W, H); MAIN.restore(); }
  baseXf(MAIN);
  return toScreen;
}

// ---------- storyboard: one frame per shot with its time and words ----------
window.storyboardInfo = () => SCENE.shots.map((s, i) => {
  const end = SCENE.shots[i + 1] ? SCENE.shots[i + 1].t : SCENE.dur;
  const words = (typeof WORDS !== 'undefined' ? WORDS : []).filter(w => w.s >= s.t - 0.05 && w.s < end).map(w => w.w).join(' ');
  return { i: i + 1, t: s.t, end, key: s.key ?? Math.min(end - 0.05, s.t + (end - s.t) * 0.55), words, plate: s.plate || '', light: s.light || 'day', enter: enterOf(i) };
});
window.composeBoard = async (pngs, info, title = '') => {
  const cols = H > W ? 4 : 3, tw = H > W ? 300 : 480, th = Math.round(tw * H / W), lab = 120, pad = 18;
  const rows = Math.ceil(pngs.length / cols), c = document.createElement('canvas');
  c.width = cols * (tw + pad) + pad; c.height = rows * (th + lab + pad) + pad + 70;
  const x = c.getContext('2d'); x.fillStyle = '#16141a'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#fff'; x.font = '700 34px Arial'; x.fillText(title || 'Storyboard', pad, 48);
  for (let k = 0; k < pngs.length; k++) {
    const im = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.src = pngs[k]; });
    const cx = pad + (k % cols) * (tw + pad), cy = 70 + pad + Math.floor(k / cols) * (th + lab + pad), s = info[k];
    x.drawImage(im, cx, cy, tw, th);
    x.fillStyle = '#2b2733'; x.fillRect(cx, cy + th, tw, lab - 8);
    x.fillStyle = '#ffd25a'; x.font = '700 20px Arial'; x.fillText(`#${s.i}  ${s.t.toFixed(1)}-${s.end.toFixed(1)}s  ${s.enter !== 'cut' ? s.enter : ''}`, cx + 8, cy + th + 24);
    x.fillStyle = '#fff'; x.font = '16px Arial';
    const words = s.words.split(' '); let line = '', ly = cy + th + 48;
    for (const w of words) { if (x.measureText(line + w).width > tw - 16) { x.fillText(line, cx + 8, ly); line = ''; ly += 20; if (ly > cy + th + lab - 14) break; } line += w + ' '; }
    if (ly <= cy + th + lab - 14) x.fillText(line, cx + 8, ly);
  }
  return c.toDataURL('image/png');
};

// ---------- sound events for the mixer: explicit SCENE.sfx plus a whoosh on every whip ----------
// (whip.wav is 0.24 s and peaks in its middle, so it starts 0.12 s before the cut)
window.soundEvents = () => {
  const list = (typeof SCENE.sfx === 'function' ? SCENE.sfx() : (SCENE.sfx || [])).map(([t, name, vol = 1]) => ({ t, name, vol }));
  SCENE.shots.forEach((s, i) => {
    if (i && enterOf(i).startsWith('whip')) list.push({ t: Math.max(0, s.t - 0.12), name: 'whip', vol: SCENE.whooshVol ?? 0.15 });
    if (enterOf(i) === 'flash') list.push({ t: s.t, name: 'sparkle', vol: 0.6 });
  });
  // music volume 0.18 puts the music ~22 dB under the narration, as measured on the reference (Demucs-separated stems)
  const vm = voiceMap();
  if (vm) list.forEach(e => { e.t = Math.max(0, voiceT(e.t)); });   // each sound moves with its sentence
  const dur = vm ? URDU.dur : SCENE.dur;
  return { events: list.filter(e => e.t < dur).sort((a, b) => a.t - b.t), music: SCENE.music ?? { mood: 'playful', volume: 0.18 }, dur };
};

window.ready = (async () => {
  await Promise.all(window.PRELOAD || []);
  await Promise.all(Object.entries(SCENE.plates || {}).map(([n, src]) => {
    if (typeof src === 'object') PLATE_META[n] = src;                 // { src | video, scale, horizon }
    if (typeof src === 'object' && src.video) { PLATES[n] = Object.assign({ fps: 30, ext: 'jpg' }, src); return null; }
    const file = typeof src === 'object' ? src.src : src;
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => { PLATES[n] = im; res(); }; im.onerror = () => rej(new Error('missing plate ' + file)); im.src = file; });
  }));
  if (typeof loadSprites === 'function') await loadSprites(Object.assign({}, typeof LIBRARY !== 'undefined' ? LIBRARY : {}, SCENE.sprites || {}));
  if (typeof WORDS !== 'undefined') CARDS = buildCards(WORDS, SCENE.dur);
  await window.renderFrame(+(q.get('t') || 0));
  return true;
})();
