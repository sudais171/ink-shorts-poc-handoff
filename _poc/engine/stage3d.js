// Ink Shorts engine - 3D stage. A painted plate becomes a real little stage: its floor lies on a 3D floor, the scenery
// behind the floor line stands up as a backdrop wall, and walls you mark (house fronts, a room's side walls, a tower)
// stand where the painting shows them. A real camera (WebGL, built into Chrome) looks at it: near things slide faster
// than far ones, the floor changes shape as the angle changes, the camera can push in, circle a little and rise.
// Characters and cut-outs stand in it as cards drawn by the 2D engine at their projected place and size.
//
// Geometry comes from what is measured anyway: the plate's scale gives the horizon (where a person would be 0 px tall)
// and the painting camera's height ((footY - horizon) / personH, in person heights). Units: 1 = a person's height.
//   const S = stage3d('office', { wall: 1110, walls: [{ base: [[0, 1250], [230, 1120]] }] })
//     wall  = y on the plate's grid where the floor meets the backdrop (the far end of the floor)
//     walls = extra upright walls, each by two floor points on the grid where it meets the floor; h = height in person
//             heights for low ones (the front of a desk or counter ~.45, a garden wall ~.6, a market stall front) -
//             painted furniture stands up instead of lying flat on the floor and stretching when the camera moves;
//             extend: [a, b] lengthens it past its ends (fractions of its length)
//   shot: { t, stage: S, path: S.path([...stops]), draw: t => { S.stand(...); S.sprite(...); } }   (flushed by the player)
const ST3 = { gl: null, cv: null, buf: null, loc: {}, tex: new Map() };
function st3gl() {
  if (ST3.gl) return ST3.gl;
  const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
  const gl = c.getContext('webgl', { preserveDrawingBuffer: true, antialias: true, depth: true });
  if (!gl) throw new Error('3D stage: WebGL is not available in this browser');
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec4 clip; attribute vec3 nd; varying vec3 v; void main(){ gl_Position = clip; v = nd; }'));
  // nd = the painting camera's projection of the point as numerator/denominator: dividing per pixel samples exactly
  // the right spot of the painting (projective mapping, the floor never swims). Past the painting's edges it continues
  // as a mirror image at the sides and bottom (grass, cobbles, boards read fine) instead of smeared streaks; above the
  // top it holds the top row (sky), since a mirrored roof would hang upside down.
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, 'precision highp float; varying vec3 v; uniform sampler2D tex; uniform vec4 map; void main(){ vec2 uv = (v.xy / v.z - map.xy) / map.zw; uv.y = max(uv.y, 0.0); uv = 1.0 - abs(mod(uv, 2.0) - 1.0); gl_FragColor = texture2D(tex, clamp(uv, vec2(0.001), vec2(0.999))); }'));
  gl.linkProgram(p); gl.useProgram(p);
  ST3.loc = { clip: gl.getAttribLocation(p, 'clip'), nd: gl.getAttribLocation(p, 'nd'), map: gl.getUniformLocation(p, 'map') };
  ST3.gl = gl; ST3.cv = c; ST3.buf = gl.createBuffer();
  return gl;
}
function st3tex(img) {
  const gl = st3gl(); if (ST3.tex.has(img)) return ST3.tex.get(img);
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  ST3.tex.set(img, t); return t;
}
const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp: (a, b, k) => [L2(a[0], b[0], k), L2(a[1], b[1], k), L2(a[2], b[2], k)] };

function stage3d(plate, o = {}) {
  const S = { plate, queue: [], cam: null };
  // geometry is worked out on first use (the plate and its scale are loaded by then)
  const init = () => {
    if (S.f0) return S;
    const m = PLATE_META[plate], s = m && m.scale;
    if (!s || s.length < 2) throw new Error(`3D stage '${plate}': the plate needs two scale pairs (they give the horizon and camera height)`);
    const slope = (s[1][1] - s[0][1]) / (s[1][0] - s[0][0]), B = plateBox(plate);
    S.yh = s[0][0] - s[0][1] / slope; S.camH = 1 / slope; S.pcx = B.w / 2; S.B = B;
    S.f0 = o.f0 || (H / 2) / Math.tan((o.fov || 50) * Math.PI / 360);
    S.syh = S.yh - (B.h - H) / 2;                                         // the horizon row on screen in the home view
    S.Zw = S.f0 * S.camH / Math.max(4, o.wall - S.yh); S.Zn = S.f0 * S.camH / (B.h - S.yh);
    // surfaces: { n: normal facing the painting camera, d: plane offset (n.p = d), quad corners }
    const top = Z => S.camH + S.yh * Z / S.f0 + 2 + Z * .8, wx = B.w / 2 * S.Zw / S.f0 * (o.extend || 3);
    S.surf = [{ kind: 'back', n: [0, 0, -1], d: -S.Zw, quad: [[-wx, top(S.Zw), S.Zw], [wx, top(S.Zw), S.Zw], [wx, 0, S.Zw], [-wx, 0, S.Zw]] }];
    for (const w of o.walls || []) {
      const a = S.floor(...w.base[0]), b = S.floor(...w.base[1]), [e0, e1] = w.extend || [0, 0], dl = v3.sub(b, a);
      const a2 = v3.sub(a, v3.mul(dl, e0)), b2 = v3.add(b, v3.mul(dl, e1)), ht = w.h ?? Math.max(top(a2[2]), top(b2[2]));
      let n = v3.norm(v3.cross(dl, [0, 1, 0])); if (v3.dot(n, v3.sub([0, S.camH, 0], a)) < 0) n = v3.mul(n, -1);
      S.surf.push({ kind: 'wall', n, d: v3.dot(n, a), a: a2, b: b2, h: ht, quad: [[a2[0], ht, a2[2]], [b2[0], ht, b2[2]], [b2[0], 0, b2[2]], [a2[0], 0, a2[2]]] });
      if (w.h && w.depth) {                    // a box: its flat top (desk top, counter, table), `depth` person heights deep
        const back = v3.mul(n, -w.depth), ta = [a2[0], ht, a2[2]], tb = [b2[0], ht, b2[2]];
        S.surf.push({ kind: 'top', n: [0, 1, 0], d: ht, a: ta, b: tb, back, quad: [ta, tb, v3.add(tb, back), v3.add(ta, back)] });
      }
    }
    return S;
  };
  S.init = init;
  S.home = () => { init(); return { pos: [0, S.camH, 0], at: [0, S.camH, 10], f: S.f0 }; };
  // a painting point on the floor -> world [X, 0, Z]
  S.floor = (x, footY) => { const Z = S.f0 * S.camH / Math.max(1, footY - S.yh); return [(x - S.pcx) * Z / S.f0, 0, Z]; };
  // whatever surface the painting shows at (x, y): the nearest of floor / walls hit by the painting camera's ray there
  S.point = (x, y) => {
    init();
    const o0 = [0, S.camH, 0], d = [(x - S.pcx) / S.f0, (S.yh - y) / S.f0, 1];
    let best = null;
    if (d[1] < 0) { const t = -S.camH / d[1]; best = { t, p: v3.add(o0, v3.mul(d, t)), n: [0, 1, 0] }; }
    for (const s of S.surf) {
      const den = v3.dot(s.n, d); if (Math.abs(den) < 1e-6) continue;
      const t = (s.d - v3.dot(s.n, o0)) / den; if (t <= 0 || (best && t >= best.t)) continue;
      const p = v3.add(o0, v3.mul(d, t));
      if (s.kind === 'wall') { const ab = v3.sub(s.b, s.a), u = v3.dot(v3.sub(p, s.a), ab) / v3.dot(ab, ab); if (u < 0 || u > 1 || p[1] > s.h) continue; }
      if (s.kind === 'top') {
        const ab = v3.sub(s.b, s.a), q = v3.sub(p, s.a), u = v3.dot(q, ab) / v3.dot(ab, ab), w = v3.dot(q, s.back) / v3.dot(s.back, s.back);
        if (u < 0 || u > 1 || w < 0 || w > 1) continue;
      }
      best = { t, p, n: s.n };
    }
    return best || { p: S.floor(x, Math.max(y, S.yh + 2)), n: [0, 1, 0] };
  };
  S.view = c => {
    init();
    const fwd = v3.norm(v3.sub(c.at, c.pos)), right = v3.norm(v3.cross([0, 1, 0], fwd)), up = v3.cross(fwd, right);
    S.cam = { ...c, f: c.f || S.f0, fwd, right, up };
  };
  S.toCam = p => { const d = v3.sub(p, S.cam.pos); return [v3.dot(d, S.cam.right), v3.dot(d, S.cam.up), v3.dot(d, S.cam.fwd)]; };
  S.project = p => { const [xc, yc, zc] = S.toCam(p); return [W / 2 + S.cam.f * xc / zc, S.syh - S.cam.f * yc / zc, zc]; };
  S.drawBack = () => {
    init();
    const gl = st3gl(), img = PLATES[plate], c = S.cam, B = S.B, f0 = S.f0, camH = S.camH, yh = S.yh, pcx = S.pcx;
    gl.viewport(0, 0, ST3.cv.width, ST3.cv.height); gl.clearColor(0, 0, 0, 1); gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, st3tex(img));
    const m = PLATE_META[plate];
    if (m && m.set) gl.uniform4f(ST3.loc.map, 0, 0, B.w, B.h);
    else { const k = Math.max(W / img.width, H / img.height); gl.uniform4f(ST3.loc.map, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k); }
    const wx = B.w / 2 * S.Zw / f0 * (o.extend || 3), zNear = Math.max(.6, Math.min(S.Zn, c.pos[2] + .3));
    const quads = S.surf.map(s => s.quad).concat([[[-wx, 0, S.Zw], [wx, 0, S.Zw], [wx, 0, zNear], [-wx, 0, zNear]]]);
    const data = [];
    for (const q of quads) for (const i of [0, 1, 2, 0, 2, 3]) {
      const p = q[i], [xc, yc, zc] = S.toCam(p);
      // clip coordinates written linearly in camera space, so the GPU clips anything behind the camera correctly
      data.push((2 * (W / 2) / W - 1) * zc + 2 * c.f / W * xc, (1 - 2 * S.syh / H) * zc + 2 * c.f / H * yc, zc - .1, zc,
                f0 * p[0] + pcx * p[2], f0 * (camH - p[1]) + yh * p[2], p[2]);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, ST3.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(ST3.loc.clip); gl.vertexAttribPointer(ST3.loc.clip, 4, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(ST3.loc.nd); gl.vertexAttribPointer(ST3.loc.nd, 3, gl.FLOAT, false, 28, 16);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 7);
    g.drawImage(ST3.cv, 0, 0, W, H);
  };
  // ---- cards (characters, cut-outs, drawn things), queued with their distance and drawn far to near ----
  S.add = (p, fn) => { const q = S.project(p); if (q[2] > .2) S.queue.push({ z: q[2], fn: () => fn(q, S.cam.f / q[2]) }); };
  S.flush = () => { S.queue.sort((a, b) => b.z - a.z).forEach(e => e.fn()); S.queue = []; };
  const at = (x, y) => typeof x === 'function' ? x(TNOW) : x, ay = y => typeof y === 'function' ? y(TNOW) : y;
  const shadow = (p, ppu, u, v) => {
    const r = .26, a = S.project([p[0], 0, p[2] - r]), b = S.project([p[0], 0, p[2] + r]);
    shadowBlob(u + 6, v, r * ppu, Math.max(3, Math.abs(a[1] - b[1]) / 2), 'rgba(25,25,15,.35)', 8);
  };
  // a character standing on the floor at a painting point (x, footY are grid units, may be functions of t)
  S.stand = (c, P, x, footY, opt = {}) => {
    const p = S.point(at(x), ay(footY)).p;
    S.add(p, ([u, v], ppu) => { const k = ppu * (c.size || 1) * (opt.size || 1) / CHAR_H; if (!opt.noShadow) shadow(p, ppu, u, v); placed(c, P, u, v - legOf(c) * k, k, opt.flip); });
  };
  // a character on a wall (climbing, hanging from a window ledge): hip at the painting point (x, y) on that wall,
  // a little in front of it
  S.hang = (c, P, x, y, opt = {}) => {
    const h = S.point(at(x), ay(y)), p = v3.add(h.p, v3.mul(h.n, opt.off ?? .18));
    S.add(p, ([u, v], ppu) => { const k = ppu * (c.size || 1) * (opt.size || 1) / CHAR_H; placed(c, P, u, v, k, opt.flip); });
  };
  // a cut-out standing at a painting point, h in person heights (bush ~.8, barrel ~.5, banner pole ~2.5)
  S.sprite = (name, x, y, h, opt = {}) => { const p = S.point(at(x), ay(y)).p; S.add(v3.add(p, [0, 0, opt.dz || 0]), ([u, v], ppu) => drawSprite(name, u, v, { ...opt, h: h * ppu })); };
  // anything else: fn(u, v, ppu) at the projected point, ppu = screen pixels per person height there
  S.card = (x, y, fn, opt = {}) => { const p = S.point(at(x), ay(y)).p; S.add(v3.add(p, [0, 0, opt.dz || 0]), ([u, v], ppu) => fn(u, v, ppu)); };
  // ---- camera paths: stops { t, pos, at, f?, move? } or { t, home: true } or { t, look: [x, footY, dist, opts] } ----
  S.look = (x, footY, dist = 3, lo = {}) => { const p = S.point(x, footY).p; return { pos: [p[0] + (lo.side || 0), (lo.h ?? 1.15), Math.max(.7, p[2] - dist)], at: [p[0], lo.atY ?? .62, p[2]], f: lo.f }; };
  S.path = (stops, po = {}) => {
    let R = null;
    const mv = i => stops[i].move ?? po.move ?? 1.2, drift = po.drift ?? .06;
    return t => {
      if (!R) R = stops.map(s => ({ t: s.t, move: s.move, ...(s.home ? S.home() : s.look ? S.look(...s.look) : s) }));
      const hold = (i, tau) => { const s = R[i], dir = v3.norm(v3.sub(s.at, s.pos)); return { pos: v3.add(s.pos, v3.mul(dir, drift * Math.max(0, tau - s.t))), at: s.at, f: s.f || null }; };
      const mix = (a, b, k) => ({ pos: v3.lerp(a.pos, b.pos, k), at: v3.lerp(a.at, b.at, k), f: a.f && b.f ? Math.exp(L2(Math.log(a.f), Math.log(b.f), k)) : (b.f || a.f) });
      let cur = hold(0, Math.min(t, R[1] ? R[1].t - mv(1) : t));
      for (let i = 1; i < R.length; i++) {
        const a = R[i].t - mv(i); if (t <= a) break;
        const next = R[i + 1] ? R[i + 1].t - mv(i + 1) : Infinity;
        cur = mix(hold(i - 1, a), hold(i, Math.min(t, next)), ss2(a, R[i].t, t));
      }
      return cur;
    };
  };
  return S;
}
