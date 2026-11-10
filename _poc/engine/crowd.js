// Ink Shorts engine - crowds: many varied background people in the house style, in rows with depth.
// crowd(t, { x0, x1, yFar, yNear, kFar, kNear, rows, n, seed, mood: 'idle'|'watch'|'cheer'|'laugh'|'march'|'mixed', look,
//            colors, hats, costumes, hatColor, faceShift, face (+1/-1 facing), speed, dx (shift the whole crowd) })
//   rows run far (smaller, higher) to near (bigger, lower); y is the rig hip line of each row in world units.
//   feet: true -> yFar/yNear are where the feet stand and sizes come from the plate's measured scale (preferred).
const CROWD_LOOKS = {
  colors: ['#d63c30', '#3b7fd6', '#56b454', '#e0a93a', '#8296b6', '#ae574d', '#45abc0', '#7a64b8', '#c98a4a', '#e07aa0', '#4a4a5a', '#d9c49a'],
  hats: ['none', 'none', 'cap', 'bowler', 'boater', 'beret', 'tophat', 'bald', 'straw'],
  shapes: Object.keys(SHAPES),
  costumes: ['tunic', 'suit', 'braces', 'plaid', 'bowtie', 'tunic'],   // armies: costumes: ['soldier'] (+ hats: ['helmet'])
  staches: [null, null, null, null, null, null, null, 'brush', 'walrus', 'handlebar'],
};
const CROWD_CACHE = new Map();
function crowdMembers(o) {
  // o.colors / o.hats / o.costumes override the random looks (e.g. an army: one team colour, helmets)
  const L = { colors: o.colors || CROWD_LOOKS.colors, hats: o.hats || CROWD_LOOKS.hats, costumes: o.costumes || CROWD_LOOKS.costumes, staches: o.staches || CROWD_LOOKS.staches };
  const key = JSON.stringify([o.seed, o.n, o.rows, o.x0, o.x1, o.colors, o.hats, o.costumes, o.kind]);
  if (CROWD_CACHE.has(key)) return CROWD_CACHE.get(key);
  const pick = (arr, i) => arr[Math.floor(hash(i) * arr.length) % arr.length], list = [], per = Math.ceil(o.n / o.rows);
  for (let r = 0; r < o.rows; r++) for (let j = 0; j < per; j++) {
    const id = (o.seed || 1) * 1000 + r * 100 + j;
    let c;
    if (typeof makePerson === 'function' && !o.colors && !o.hats && !o.costumes) {
      // an ordinary crowd: varied modern people (men, women, kids, older people), every face different
      c = Object.assign(makePerson(id, { kind: o.kind }), { key: 'crowd' + id });
      if (o.faceShift != null) c.faceShift = o.faceShift;
      c.body = [shade(c.color, .2), c.color, shade(c.color, -.32)];
    } else {
      // a uniform group (an army, a team): colours/hats/costumes from the options; face parts still vary per person
      const col = pick(L.colors, id);
      c = { key: 'crowd' + id, ws: 0.85 + hash(id + 1) * 0.3, shape: pick(CROWD_LOOKS.shapes, id + 2), hat: pick(L.hats, id + 3), hatColor: o.hatColor || pick(CROWD_LOOKS.colors, id + 4),
        faceShift: (o.faceShift ?? (hash(id + 5) - .5) * .06), stache: pick(L.staches, id + 6), glasses: hash(id + 7) < .15, blush: hash(id + 8) < .2,
        body: [shade(col, .2), col, shade(col, -.32)], color: col };
      c.costume = pick(L.costumes, id + 9);
    }
    const rowK = o.rows > 1 ? r / (o.rows - 1) : 1;
    const x = L2(o.x0, o.x1, (j + 0.5 + (hash(id + 10) - .5) * .5 + (r % 2) * .5) / per);
    list.push({ c, r, x, y: L2(o.yFar, o.yNear, rowK) + (hash(id + 11) - .5) * 20, jit: 0.92 + hash(id + 12) * .16, ph: hash(id + 13) * 6.28, mood: o.mood === 'mixed' ? pick(['idle', 'watch', 'cheer', 'laugh'], id + 14) : o.mood });
  }
  // at most one in three with facial hair (user: too many beards)
  let fh = 0; const capFH = Math.ceil(list.length / 3);
  for (const m of list) if (m.c.stache || m.c.beard) { if (++fh > capFH) { m.c = { ...m.c, stache: null, beard: null }; } }
  list.sort((a, b) => a.r - b.r || a.y - b.y);
  CROWD_CACHE.set(key, list); return list;
}
function crowdPose(m, t, o) {
  const base = { legs: 'stand', legLen: 600, look: o.look ?? (hash(m.ph) - .5) * 2, br: 0.008 * Math.sin(t * 2.3 + m.ph), blink: bmp((t + m.ph) % 3.7, 0, .17) };
  if (m.mood === 'march') return Object.assign(base, POSE.walk(t, o.speed || 1.7, 1, m.ph * 0.3), { turnX: o.face || 1, look: 1, smug: .3 });   // in step; move the crowd with o.dx
  if (m.mood === 'cheer') { const b = Math.abs(Math.sin(t * 6 + m.ph)); return Object.assign(base, { eyes: 'laugh', mouth: 'laugh', open: .6 + .4 * b, bounce: 18 * b, arms: [ARM.up(-1, 1, Math.sin(t * 8 + m.ph)), ARM.up(1, 1, Math.sin(t * 8 + m.ph + 1))] }); }
  if (m.mood === 'laugh') return Object.assign(base, POSE.laugh(t, -1, m.ph), { arms: [ARM.belly(-1, 1), ARM.belly(1, 1, Math.abs(Math.sin(t * 19 + m.ph)))] });
  if (m.mood === 'watch') return Object.assign(base, { hr: 0.04 * Math.sin(t * 1.3 + m.ph), arms: [ARM.side(-1), ARM.side(1)] });
  return Object.assign(base, { hr: 0.03 * Math.sin(t * .9 + m.ph), arms: [ARM.side(-1), hash(m.ph * 3) < .3 ? ARM.hip(1) : ARM.side(1)] });
}
function crowd(t, o) {
  o = Object.assign({ rows: 3, n: 18, kFar: 0.16, kNear: 0.26, mood: 'idle', seed: 1 }, o);
  const was = LITE;
  for (const m of crowdMembers(o)) {
    // feet: true -> yFar/yNear are the FEET lines and every member is sized by the plate's measured perspective;
    // otherwise yFar/yNear are hip lines and kFar/kNear the scales
    const rowK = o.rows > 1 ? m.r / (o.rows - 1) : 1;
    const k = (o.feet ? depthK(m.y) : L2(o.kFar, o.kNear, rowK)) * m.jit * (o.size || 1) * (m.c.size || 1), y = o.feet ? m.y - 600 * k : m.y;
    LITE = k < 0.3;
    const P = crowdPose(m, t, o), sx = P.turnX ?? 1;
    g.save(); g.translate(m.x + (o.dx || 0), y); g.scale(k * sx, k); g.translate(-HIP[0], -HIP[1]); charDraw(m.c, P); g.restore();
  }
  LITE = was;
}
