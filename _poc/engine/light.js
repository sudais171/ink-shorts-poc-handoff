// Ink Shorts engine - lighting presets. A preset sets the light direction (which side the ink is heavy on),
// the rim light colour, a tint laid over everything drawn on top of the plate (characters + props) so they
// sit in the plate's light, and a light whole-frame grade + vignette.
// The plate carries the scene's light (ask for "at dusk", "at night", "warm lamplight" in the background prompt);
// the preset matches the cast to it. On top of the preset tint, the player also pulls the cast slightly towards the
// plate's own average colour (shot.match, default 0.1), so characters never look pasted onto a differently lit plate.
const LIGHTS = {
  day:    { dir: -2.2, rim: 'rgba(255,238,196,.9)', tint: null, grade: null, vignette: 0.12 },
  sunny:  { dir: -2.2, rim: 'rgba(255,232,170,.95)', tint: 'rgba(255,220,150,.05)', grade: ['soft-light', 'rgba(255,214,140,.18)'], vignette: 0.1 },
  warm:   { dir: -1.0, rim: 'rgba(255,205,130,.95)', tint: 'rgba(255,170,70,.1)', grade: ['soft-light', 'rgba(255,170,80,.25)'], vignette: 0.28 },
  dusk:   { dir: -0.25, rim: 'rgba(255,160,120,.95)', tint: 'rgba(120,70,150,.1)', grade: ['soft-light', 'rgba(160,80,170,.3)'], vignette: 0.3 },
  night:  { dir: -2.4, rim: 'rgba(150,180,255,.6)', tint: 'rgba(40,50,110,.14)', grade: ['multiply', 'rgba(90,100,160,.55)'], vignette: 0.45 },
  red:    { dir: -1.2, rim: 'rgba(255,190,140,.85)', tint: 'rgba(160,40,40,.08)', grade: ['soft-light', 'rgba(170,50,50,.22)'], vignette: 0.35 },
  candle: { dir: -0.4, rim: 'rgba(255,190,100,.95)', tint: 'rgba(255,140,40,.12)', grade: ['multiply', 'rgba(140,90,70,.4)'], vignette: 0.5 },
};
// average colour of a plate (cached), used to pull the cast towards the plate's light
const PLATE_MEAN = new Map();
function plateMean(img) {
  if (!PLATE_MEAN.has(img)) {
    const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d');
    x.drawImage(img, 0, img.height * 0.35, img.width, img.height * 0.65, 0, 0, 1, 1);
    const d = x.getImageData(0, 0, 1, 1).data; PLATE_MEAN.set(img, [d[0], d[1], d[2]]);
  }
  return PLATE_MEAN.get(img);
}
function applyLight(name) {
  const L = LIGHTS[name] || LIGHTS.day;
  setLight(L.dir); RIM = L.rim;
  return L;
}
// tint the offscreen layer (only where something was drawn)
function tintLayer(ctx, L, mean, match = 0.1) {
  ctx.save(); baseXf(ctx); ctx.globalCompositeOperation = 'source-atop';
  if (mean && match > 0) { ctx.fillStyle = `rgba(${mean[0]},${mean[1]},${mean[2]},${match})`; ctx.fillRect(0, 0, W, H); }
  if (L.tint) { ctx.fillStyle = L.tint; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
function gradeFrame(L) {
  const c = MAIN; c.save(); baseXf(c);
  if (L.grade) { c.globalCompositeOperation = L.grade[0]; c.fillStyle = L.grade[1]; c.fillRect(0, 0, W, H); }
  if (L.vignette) {
    c.globalCompositeOperation = 'multiply';
    const gr = c.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .45, H * .75);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, `rgba(${Math.round(255 * (1 - L.vignette))},${Math.round(255 * (1 - L.vignette))},${Math.round(255 * (1 - L.vignette * .8))},1)`);
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
  }
  c.restore();
}
