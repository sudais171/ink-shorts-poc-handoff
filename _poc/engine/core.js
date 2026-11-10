// Ink Shorts engine - core: canvas, timing and ink-drawing helpers.
// Everything draws through the global context `g` (swapped to an offscreen layer by the player).
// The design space is 1080x1920 (9:16) or 1920x1080 (16:9) from config.js (CONFIG.aspect); `?res=` scales the
// output pixels (0.667 = 720p, 1 = 1080p, 1.333 = 1440p/2K) without changing any scene coordinates.
const q = new URLSearchParams(location.search);
const CFG = Object.assign({ aspect: '9:16', captions: true }, typeof CONFIG !== 'undefined' ? CONFIG : {});
const W = CFG.aspect === '16:9' ? 1920 : 1080, H = CFG.aspect === '16:9' ? 1080 : 1920;
const RES = +(q.get('res') || 1);
const cv = document.getElementById('c'); cv.width = Math.round(W * RES); cv.height = Math.round(H * RES);
const MAIN = cv.getContext('2d');
let g = MAIN;
function baseXf(c) { c.setTransform(RES, 0, 0, RES, 0, 0); }
function newLayer() { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; return c; }
let TNOW = 0;      // current frame time, set by the player (used by animated helpers such as jelly heads)

// ---------- another language's voiceover (urdu.js, written by tools/urdu.py) ----------
// URDU = { map: [[voiceTime, storyTime], ...] rising, dur, env: {fps, v} }. The scene keeps its English timing
// ("story time"); the video runs on the new voice's clock and each sentence is stretched to fit. No URDU = no change.
// looked up on first use, so urdu.js may load anywhere in index.html
const voiceMap = () => (typeof URDU !== 'undefined' && URDU.map && URDU.map.length > 1) ? URDU.map : null;
function mapLin(m, t, a, b) {     // piecewise-linear lookup in m (column a -> column b), held flat past the ends
  if (t <= m[0][a]) return m[0][b] + (t - m[0][a]);
  for (let i = 1; i < m.length; i++) if (t <= m[i][a]) { const p = m[i - 1], n = m[i], d = n[a] - p[a]; return d > 1e-6 ? p[b] + (n[b] - p[b]) * (t - p[a]) / d : n[b]; }
  const l = m[m.length - 1]; return l[b] + (t - l[a]);
}
const storyT = t => { const m = voiceMap(); return m ? mapLin(m, t, 0, 1) : t; };    // voice clock -> scene time
const voiceT = t => { const m = voiceMap(); return m ? mapLin(m, t, 1, 0) : t; };    // scene time -> voice clock

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function hash(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- timing ----------
const clamp01 = x => Math.min(1, Math.max(0, x));
const L2 = (a, b, k) => a + (b - a) * k;
const V2 = (a, b, k) => [L2(a[0], b[0], k), L2(a[1], b[1], k)];
const ss2 = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };      // smoothstep a->b
const spr = (t, t0) => t < t0 ? 0 : 1 - Math.exp(-6 * (t - t0)) * Math.cos(9 * (t - t0));          // spring step at t0 (overshoots ~10%)
const bmp = (t, a, b) => (t > a && t < b) ? Math.sin(Math.PI * (t - a) / (b - a)) : 0;             // 0->1->0 bump

// ---------- light direction (ink is heaviest facing away from the light) ----------
let LIGHT = -2.2;                // radians the light comes FROM; -2.2 = upper left
let SHADOW = LIGHT + Math.PI;
function setLight(a) { LIGHT = a; SHADOW = a + Math.PI; }
const shadowK = a => (1 + Math.cos(a - SHADOW)) / 2;   // 1 facing away from the light, 0 facing it

// ---------- geometry ----------
function path(pts, close = true) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath();
}
function bez(p0, p1, p2, p3, n = 40) {
  const o = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return o;
}
// chain of cubic segments: [p0, c1, c2, p1, c1, c2, p2, ...]
function chain(ctrl, n = 30) {
  let o = [];
  for (let i = 0; i + 3 < ctrl.length; i += 3) { const s = bez(ctrl[i], ctrl[i + 1], ctrl[i + 2], ctrl[i + 3], n); o = o.concat(i ? s.slice(1) : s); }
  return o;
}
// smooth curve through points (Catmull-Rom)
function spline(pts, n = 14) {
  const o = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  o.push(pts[pts.length - 1]);
  return o;
}
const ellPts = (cx, cy, rx, ry, n = 48, rot = 0) => Array.from({ length: n }, (_, i) => {
  const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});

// tapered brush stroke along a polyline; wf(t) gives width
function brush(pts, wf, col = INK, caps = true) {
  const L = [], Rr = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = wf(i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); Rr.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  g.fillStyle = col; path(L.concat(Rr.reverse())); g.fill();
  if (caps) for (const i of [0, pts.length - 1]) { g.beginPath(); g.arc(pts[i][0], pts[i][1], wf(i / (pts.length - 1)) / 2, 0, 7); g.fill(); }
}
const taper = (w, s = 0.3, e = 0.3, min = 0.3) => t => {
  const k = Math.min(1, t / s, (1 - t) / e);
  return w * (min + (1 - min) * Math.sin(Math.max(0, k) * Math.PI / 2));
};

// outward unit normals of a closed contour
function normals(pts) {
  let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
    return [nx, ny];
  });
}
// path of the band between a contour and its inset by w(normalAngle); fill with 'evenodd'
function bandPath(pts, nrm, w) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  const inner = pts.map((p, i) => { const k = w(Math.atan2(nrm[i][1], nrm[i][0])); return [p[0] - nrm[i][0] * k, p[1] - nrm[i][1] * k]; }).reverse();
  inner.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
}
// shadow-weighted ink ring drawn inside a closed contour
function inkRing(pts, wLit, wShadow, extra = () => 0, col = INK) {
  bandPath(pts, normals(pts), a => wLit + (wShadow - wLit) * Math.pow(shadowK(a), 1.6) + extra(a));
  g.fillStyle = col; g.fill('evenodd');
}
function fillInk(pts, fill, wl = 3, ws = 8) { g.fillStyle = fill; path(pts); g.fill(); inkRing(pts, wl, ws); }
function shadowBlob(x, y, rx, ry, col, blur) {
  g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = col;
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.restore();
}
// fill a closed shape with a lit-to-shadow gradient along the light direction, then ink it
function shadedShape(pts, light, mid, dark, wl = 3, ws = 8) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.max(x1 - x0, y1 - y0) / 2;
  const gr = g.createLinearGradient(cx + Math.cos(LIGHT) * r, cy + Math.sin(LIGHT) * r, cx - Math.cos(LIGHT) * r, cy - Math.sin(LIGHT) * r);
  gr.addColorStop(0, light); gr.addColorStop(.55, mid); gr.addColorStop(1, dark);
  g.fillStyle = gr; path(pts); g.fill(); softShape(pts, x0, y0, x1, y1); inkRing(pts, wl, ws);
}
// soft 3D (user's choice, v0.8.0): every shaded part rolls off into shadow away from the light, with a soft highlight
// on the lit side and a warm rim of bounce light on the shadow edge. SOFT3D = 0 gives the old flat look.
let SOFT3D = 1;
const lightSide = () => (Math.cos(LIGHT) < 0 ? -1 : 1);      // -1: the light is on the left
function softRim(far, ls, x, y, w, h, width) {
  const rim = g.createLinearGradient(far, 0, far + ls * width, 0);
  rim.addColorStop(0, 'rgba(255,196,150,0)'); rim.addColorStop(.3, RIM_SOFT); rim.addColorStop(1, 'rgba(255,196,150,0)');
  g.fillStyle = rim; g.fillRect(x, y, w, h);
}
let RIM_SOFT = 'rgba(255,196,150,.5)';                         // the bounce light's colour (set3d tints it by time of day)
function softShape(pts, x0, y0, x1, y1) {
  const w = x1 - x0, h = y1 - y0; if (!SOFT3D || LITE || w < 90 || h < 90) return;   // buttons and buckles stay as they are
  const ls = lightSide(), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, far = ls < 0 ? x1 : x0;
  g.save(); path(pts); g.clip(); g.globalAlpha = SOFT3D;
  g.globalCompositeOperation = 'multiply';
  const gr = g.createLinearGradient(cx + ls * w / 2, 0, cx - ls * w / 2, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(210,185,220,.12)'); gr.addColorStop(1, 'rgba(90,50,120,.55)');
  g.fillStyle = gr; g.fillRect(x0 - 10, y0 - 10, w + 20, h + 20);
  g.globalCompositeOperation = 'source-over';
  g.filter = 'blur(14px)'; g.fillStyle = 'rgba(255,255,255,.3)';
  g.beginPath(); g.ellipse(cx + ls * w * .25, cy - h * .15, w * .14, h * .3, 0, 0, 7); g.fill(); g.filter = 'none';
  softRim(far, ls, x0 - 10, y0 - 10, w + 20, h + 20, Math.min(60, w * .2));
  g.restore();
}

// colour helpers: shade('#rrggbb', k) k<0 darker, k>0 lighter
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k));
  return '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
const INK = '#21162a';
