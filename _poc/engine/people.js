// Ink Shorts engine - people: modern outfits, the expression library and makePerson (varied people from a seed).
// Loaded after character.js. Everything here is a building block: scenes combine them instead of inventing drawings.

// ---------- modern outfits (same contract as OUTFITS in character.js; garment colour c.body[1], second colour c.color2) ----------
// Like the reference, the top runs to the hem and the legs below are thin ink strokes: no trouser bands or coloured legs.
const PANTS = { jeans: '#3d5a8a', dark: '#2e2f3a', khaki: '#b89a6a', grey: '#6d7280' };   // for c.legColor when a story really wants coloured trousers
function sleeveCaps(c, col, len = 1) {           // short sleeves: a seam and hem inside the shoulder (no pads sticking out)
  if (LITE) return;
  for (const s of [-1, 1]) {
    const x = shoulder(c, s)[0], y1 = 1170 + 70 * len;
    brush(spline([[x - s * 95, 1085], [x - s * 70, 1160], [x - s * 52, y1]]), taper(6, .3, .3, .3), shade(col, -.32), false);
    brush(spline([[x - s * 52, y1], [x - s * 20, y1 + 6], [x + s * 10, y1]]), taper(5, .3, .3, .3), shade(col, -.32), false);
  }
}
const PRINTS = {
  star: (x, y, col) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 26 : 62; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } fillInk(p, col, 3, 6); },
  circle: (x, y, col) => fillInk(ellPts(x, y, 55, 55, 32), col, 3, 6),
  heart: (x, y, col) => fillInk(loopPts([[x, y + 50], [x - 60, y - 5], [x - 40, y - 45], [x, y - 25], [x + 40, y - 45], [x + 60, y - 5]], 8), col, 3, 6),
  stripe: (x, y, col, B) => { g.fillStyle = col; g.fillRect(B.x0 - 10, y - 30, B.x1 - B.x0 + 20, 26); g.fillRect(B.x0 - 10, y + 16, B.x1 - B.x0 + 20, 26); },
};
Object.assign(OUTFITS, {
  tshirt: {
    inside(c, B) {
      const col = c.body[1];
      g.fillStyle = shade(col, -.25); g.beginPath(); g.ellipse(HIP[0], 1068, 105, 44, 0, 0, Math.PI); g.fill();
      if (c.print !== 'none') (PRINTS[c.print] || PRINTS.star)(HIP[0], 1310, c.color2 || '#f2e6c0', B);
      g.fillStyle = shade(col, -.2); g.fillRect(B.x0 - 10, B.y1 - 26, B.x1 - B.x0 + 20, 26);   // hem
    },
    over: (c, B) => sleeveCaps(c, c.body[1]),
    sleeve: c => ({ col: c.body[1] }), legs: PANTS.jeans, boots: '#e9e6e0',
  },
  hoodie: {
    inside(c, B) {
      const col = c.body[1], cx = HIP[0];
      fillInk(loopPts([[cx - 115, 1380], [cx + 115, 1380], [cx + 140, 1490], [cx - 140, 1490]], 6), shade(col, -.08), 3, 7);
      for (const s of [-1, 1]) { brush([[cx + s * 45, 1100], [cx + s * 50, 1270]], () => 9, '#f4f1ea'); g.fillStyle = '#c9c4ba'; g.fillRect(cx + s * 50 - 7, 1268, 14, 26); }
      g.fillStyle = shade(col, -.22); g.fillRect(B.x0 - 10, B.y1 - 46, B.x1 - B.x0 + 20, 46);
      if (!LITE) { g.strokeStyle = shade(col, -.35); g.lineWidth = 3; for (let x = B.x0; x < B.x1; x += 18) { g.beginPath(); g.moveTo(x, B.y1 - 44); g.lineTo(x, B.y1); g.stroke(); } }
    },
    over(c, B) {                                  // the hood folded behind the neck shows as a thick collar
      const col = c.body[1];
      for (const s of [-1, 1]) shadedShape(loopPts([[HIP[0] + s * 70, 1060], [HIP[0] + s * 140, 1068], [HIP[0] + s * 168, 1130], [HIP[0] + s * 100, 1135]], 6), shade(col, .15), shade(col, -.05), shade(col, -.35), 4, 9);
    },
    sleeve: c => ({ col: c.body[1] }), legs: PANTS.jeans, boots: '#2e2f3a',
  },
  office: {
    base: null,
    inside(c, B) {
      const cx = HIP[0], tie = c.tie || c.color2 || '#c8384a';
      if (!LITE) for (let y = 1180; y < 1550; y += 70) { g.fillStyle = 'rgba(40,40,60,.35)'; g.beginPath(); g.arc(cx + 4, y, 6, 0, 7); g.fill(); }
      fillInk(loopPts([[cx - 18, 1100], [cx + 18, 1100], [cx + 30, 1420], [cx, 1470], [cx - 30, 1420]], 5), tie, 3, 6);
      fillInk([[cx - 22, 1080], [cx + 22, 1080], [cx + 14, 1118], [cx - 14, 1118]], shade(tie, -.15), 2, 4);
      fillInk([[cx + 70, 1230], [cx + 165, 1230], [cx + 160, 1320], [cx + 75, 1320]], shade(c.body[1], -.06), 2, 5);
      g.fillStyle = '#2d5fbf'; g.fillRect(cx + 95, 1205, 10, 50);
    },
    over(c) {                                     // pointed shirt collar under the chin
      for (const s of [-1, 1]) fillInk([[HIP[0] + s * 10, 1078], [HIP[0] + s * 105, 1072], [HIP[0] + s * 80, 1150]], '#ffffff', 3, 6);
    },
    sleeve: c => ({ col: c.body[1] }), legs: PANTS.dark, boots: '#2a1d18',
  },
  sweater: {
    inside(c, B) {
      const col = c.body[1];
      if (!LITE) {
        g.strokeStyle = shade(col, -.18); g.lineWidth = 4;
        for (let x = B.x0 + 10; x < B.x1; x += 22) { g.beginPath(); g.moveTo(x, 1100); g.lineTo(x, B.y1); g.stroke(); }
        g.strokeStyle = shade(col, .25); g.lineWidth = 5;
        for (const cx of [HIP[0] - 110, HIP[0] + 110]) for (let y = 1200; y < 1560; y += 50) { g.beginPath(); g.moveTo(cx - 18, y); g.quadraticCurveTo(cx, y + 25, cx + 18, y); g.moveTo(cx - 18, y + 25); g.quadraticCurveTo(cx, y, cx + 18, y + 25); g.stroke(); }
      }
      g.fillStyle = shade(col, -.25); g.fillRect(B.x0 - 10, B.y1 - 50, B.x1 - B.x0 + 20, 50);
      g.fillStyle = shade(col, -.22); path([[HIP[0] - 110, 1070], [HIP[0] + 110, 1070], [HIP[0], 1210]]); g.fill();
      g.fillStyle = c.color2 || '#f4f1ea'; path([[HIP[0] - 70, 1075], [HIP[0] + 70, 1075], [HIP[0], 1170]]); g.fill();
    },
    sleeve: c => ({ col: c.body[1] }), legs: PANTS.khaki, boots: '#4a2e1e',
  },
  suit: {
    inside(c, B) {
      const cx = HIP[0], col = c.body[1];
      g.fillStyle = '#f4f2ec'; path([[cx - 95, 1070], [cx + 95, 1070], [cx, 1380]]); g.fill();
      fillInk(loopPts([[cx - 14, 1090], [cx + 14, 1090], [cx + 24, 1330], [cx, 1370], [cx - 24, 1330]], 5), c.tie || c.color2 || '#7a2a3a', 3, 6);
      for (const s of [-1, 1]) shadedShape([[cx + s * 100, 1070], [cx + s * 180, 1080], [cx + s * 60, 1300], [cx + s * 8, 1390]], shade(col, .2), shade(col, -.05), shade(col, -.35), 3, 7);
      for (const y of [1420, 1500]) { g.fillStyle = '#1a1520'; g.beginPath(); g.arc(cx + 30, y, 10, 0, 7); g.fill(); }
      fillInk([[cx + 110, 1220], [cx + 170, 1220], [cx + 165, 1245], [cx + 115, 1245]], c.color2 || '#e8d27a', 2, 4);
      brush([[cx, 1390], [cx + 8, B.y1]], () => 5, shade(col, -.4), false);
    },
    sleeve: c => ({ col: c.body[1] }), legs: null, boots: '#1a1520',
  },
  dress: {   // (user: "that grils dress is so stupid") a fitted top with a round neckline and a sash at the waist; an
    // A-line skirt flaring from the waist to below the knee with a soft hem, folds and a trim band. The skirt is drawn
    // on the body as it stands (flat), not stretched with the long body; small dots on the skirt only (pattern 'dots')
    flat: true,
    inside(c, B) {
      const col = c.body[1], cx = HIP[0], trim = c.color2 || shade(col, .45);
      g.save(); g.beginPath(); g.rect(cx - 120, 1098, 240, 60); g.clip(); fillInk(ellPts(cx, 1098, 72, 34, 28), trim, 3, 6); g.restore();   // a small scoop neckline
      if (!LITE) for (const s of [-1, 1]) brush(spline([[cx + s * 58, 1150], [cx + s * 66, 1270], [cx + s * 62, 1390]]), taper(5, .3, .3, .3), shade(col, -.25), false);
      g.fillStyle = shade(col, -.32); g.fillRect(B.x0 - 10, 1388, B.x1 - B.x0 + 20, 36);
    },
    over(c, B, stY = y => y) {
      const col = c.body[1], trim = c.color2 || shade(col, .45), cx = (B.x0 + B.x1) / 2, w = (B.x1 - B.x0) / 2, top = stY(1418), hem = 1812, mid = L2(top, hem, .45);
      const sk = loopPts([[cx - w * .88, top], [cx + w * .88, top], [cx + w * 1.3, mid], [cx + w * 1.82, hem - 18], [cx + w * 1.0, hem + 12], [cx, hem + 4], [cx - w * 1.0, hem + 12], [cx - w * 1.82, hem - 18], [cx - w * 1.3, mid]], 10);
      shadedShape(sk, shade(col, .2), col, shade(col, -.3), 5, 12);
      if (!LITE) {
        g.save(); path(sk); g.clip();
        if (c.pattern === 'dots') { g.fillStyle = trim; for (let y = top + 40; y < hem; y += 58) for (let x = cx - w * 1.6 + ((y / 58) % 2) * 29; x < cx + w * 1.6; x += 58) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); } }
        g.fillStyle = trim; path(loopPts([[cx - w * 2, hem - 26], [cx + w * 2, hem - 26], [cx + w * 2, hem + 30], [cx - w * 2, hem + 30]], 4)); g.fill();
        for (const u of [-.6, -.2, .2, .6]) brush(spline([[cx + u * w * .6, top + 40], [cx + u * w * 1.0, mid], [cx + u * w * 1.6, hem - 30]]), taper(6, .3, .3, .2), shade(col, -.3), false);
        g.restore();
        fillInk(loopPts([[cx + w * .55, top - 14], [cx + w * .85, top - 30], [cx + w * .9, top + 4], [cx + w * .62, top + 10]], 6), shade(col, -.32), 2, 4);
      }
    },
    sleeve: c => ({ col: c.body[1] }), legs: '#e8d9cf', boots: '#a8323a',
  },
  jacket: {
    inside(c, B) {
      const cx = HIP[0], col = c.body[1], tee = c.color2 || '#f2e6c0';
      g.fillStyle = tee; g.fillRect(cx - 110, 1060, 220, 560);
      if (c.print !== 'none') (PRINTS[c.print] || PRINTS.circle)(cx, 1320, shade(tee, -.4), B);
      for (const s of [-1, 1]) shadedShape([[cx + s * 100, 1060], [cx + s * 330, 1060], [cx + s * 330, 1700], [cx + s * 110, 1700]], shade(col, .2), col, shade(col, -.3), 3, 7);
      if (!LITE) for (const s of [-1, 1]) { brush([[cx + s * 112, 1080], [cx + s * 112, 1640]], () => 6, shade(col, -.45), false); fillInk([[cx + s * 150, 1440], [cx + s * 240, 1440], [cx + s * 240, 1452], [cx + s * 150, 1452]], shade(col, -.4), 1, 2); }
    },
    over(c) { for (const s of [-1, 1]) shadedShape([[HIP[0] + s * 70, 1065], [HIP[0] + s * 125, 1075], [HIP[0] + s * 120, 1185]], shade(c.body[1], .3), shade(c.body[1], .05), shade(c.body[1], -.3), 3, 7); },
    sleeve: c => ({ col: c.body[1] }), legs: PANTS.jeans, boots: '#4a3424',
  },
  overalls: {
    base: ['#f6d6c8', '#e9b8a6', '#c48c7c'],
    inside(c, B) {
      const col = c.body[1], cx = HIP[0];
      if (!LITE) { g.strokeStyle = 'rgba(160,60,60,.35)'; g.lineWidth = 8; for (let x = B.x0; x < B.x1; x += 46) { g.beginPath(); g.moveTo(x, 1040); g.lineTo(x, 1700); g.stroke(); } for (let y = 1080; y < 1700; y += 46) { g.beginPath(); g.moveTo(B.x0 - 20, y); g.lineTo(B.x1 + 20, y); g.stroke(); } }
      shadedShape([[cx - 160, 1260], [cx + 160, 1260], [cx + 190, 1700], [cx - 190, 1700]], shade(col, .2), col, shade(col, -.3), 3, 8);
      for (const s of [-1, 1]) { brush([[cx + s * 140, 1265], [cx + s * 150, 1060]], () => 34, col); g.fillStyle = '#e4bd45'; g.beginPath(); g.arc(cx + s * 140, 1272, 12, 0, 7); g.fill(); }
      fillInk([[cx - 70, 1320], [cx + 70, 1320], [cx + 64, 1410], [cx - 64, 1410]], shade(col, -.1), 2, 5);
    },
    sleeve: c => ({ col: '#e9b8a6' }), legs: '#3f6fc4', boots: '#4a2e1e',
  },
});
Object.assign(OUTFIT_OF, { tshirt: 'tshirt', tee: 'tshirt', hoodie: 'hoodie', office: 'office', shirt: 'office', sweater: 'sweater', cardigan: 'sweater',
  suit: 'suit', dress: 'dress', jacket: 'jacket', overalls: 'overalls' });
// trousers of a suit match the jacket
OUTFITS.suit.legsOf = c => shade(c.body[1], -.1);

// ---------- expressions: spread into a pose. Timed ones take (t, t0) and build up / settle by themselves ----------
// Faces move the parts (lid, lidTilt, brows, mouth); a few also move the head and arms. Use any of them on anybody.
const EXPR = {
  neutral: () => ({ mouth: 'neutral' }),
  happy: (k = 1) => ({ mouth: 'smile', grin: .6 + .4 * k, browL: .015 * k, browR: .015 * k }),
  laugh: (t, t0 = 0) => POSE.laugh(t, t0),
  smug: () => ({ eyes: 'lid', mouth: 'smirk', smug: .8, browTilt: .4 }),
  sad: (k = 1) => ({ mouth: 'frown', lid: .8, lidTilt: -1 * k, browTilt: -1.1 * k, browL: .01, browR: .01, hy: 6 * k }),
  crying: (t, t0 = 0) => { const k = ss2(t0, t0 + .4, t); return { mouth: 'cry', open: .5 + .3 * Math.abs(Math.sin(t * 9)), eyes: 'squeeze', tears: k, browTilt: -1.2 * k, hy: 4 * Math.sin(t * 18) * k }; },
  worried: (k = 1) => ({ mouth: 'wavy', lidTilt: -.6 * k, browTilt: -1.2 * k, browL: .02, browR: .02, sweat: .6 * k }),
  scared: (t = 0) => ({ eyes: 'wide', mouth: 'teeth', browTilt: -1, browL: .04, browR: .04, sweat: 1, hx: 3 * Math.sin(t * 40) }),
  angry: (k = 1) => ({ mouth: 'teeth', lidTilt: 1.2 * k, browTilt: 1.4 * k, lid: .85 }),
  furious: (t = 0) => ({ mouth: 'shock', open: .6, lidTilt: 1.4, browTilt: 1.6, lid: .8, hx: 2 * Math.sin(t * 50) }),
  surprised: () => ({ eyes: 'wide', mouth: 'o', browL: .05, browR: .05 }),
  shocked: (t, t0) => POSE.shocked(t, t0),
  tired: () => ({ lid: .4, mouth: 'neutral', browTilt: -.4, hy: 8, hr: .05 }),
  sleeping: (t = 0) => ({ eyes: 'closed', mouth: 'o', hr: .12 + .02 * Math.sin(t * 2), hy: 10 }),
  thinking: () => ({ look: .6, mouth: 'wavy', browL: .03, browR: -.01, arms: [ARM.chin(), ARM.side(1)] }),
  disgust: () => ({ mouth: 'wavy', lid: .7, lidTilt: .4, browL: -.01, browR: .045, hr: -.06 }),
  // yawn from t0: eyes squeeze shut, mouth stretches tall, head tips back, arms stretch up, a tear at the peak, then settles
  yawn: (t, t0, dur = 1.6, arms = true) => {
    const u = (t - t0) / dur; if (u < 0 || u > 1) return {};
    const k = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** .7, peak = bmp(t, t0 + dur * .35, t0 + dur * .8);
    const P = { mouth: 'yawn', open: k, eyes: k > .35 ? 'squeeze' : null, lid: 1 - k, browL: .03 * k, browR: .03 * k, hr: -.12 * k, hy: -10 * k, tears: .5 * peak };
    if (arms) P.arms = [ARM.up(-1, k * .9, 0), ARM.up(1, k * .9, 0)];
    return P;
  },
  // sneeze at t0: "ah... ah..." head tips back with a wince, then "choo" snaps forward
  sneeze: (t, t0) => {
    if (t < t0 - .8) return {};
    if (t < t0) { const k = ss2(t0 - .8, t0 - .05, t); return { eyes: 'squeeze', mouth: 'o', hr: -.14 * k, hy: -12 * k, browL: .04 * k, browR: .04 * k }; }
    const k = Math.exp(-6 * (t - t0)); return { eyes: 'closed', mouth: 'shock', open: .7 * k, hr: .16 * k, hy: 14 * k, lean: .08 * k };
  },
};

// ---------- makePerson: a believable, varied person from a seed ----------
// opts: { kind: 'man'|'woman'|'boy'|'girl'|'old'|'any', outfit, color, hair, ... any defineCharacter field to force }
// Every face part, hair, outfit and colour comes from the seed, so a crowd or a cast never repeats a face.
const PEOPLE_COLORS = ['#d63c30', '#3b7fd6', '#56b454', '#e0a93a', '#8296b6', '#ae574d', '#45abc0', '#7a64b8', '#c98a4a', '#e07aa0', '#4a4a5a', '#2f8f6f', '#e86a4a', '#5a6fd6'];
function makePerson(seed, opts = {}) {
  const r = i => hash(seed * 31 + i * 7.13), pick = (arr, i) => arr[Math.floor(r(i) * arr.length) % arr.length];
  const kind = opts.kind && opts.kind !== 'any' ? opts.kind : pick(['man', 'woman', 'man', 'woman', 'man', 'woman', 'old', 'boy', 'girl'], 1);
  const kid = kind === 'boy' || kind === 'girl', fem = kind === 'woman' || kind === 'girl', old = kind === 'old';
  const p = {
    shape: pick(Object.keys(SHAPES), 2), color: pick(PEOPLE_COLORS, 3), color2: pick(['#f2e6c0', '#ffffff', '#e4bd45', '#2e2f3a', '#c8384a', '#3b7fd6'], 4),
    eyeStyle: kid ? pick(['bean', 'round', 'dot'], 5) : pick(EYE_STYLES, 5), brows: fem ? pick(['arched', 'thin'], 6) : pick(BROW_STYLES, 6),
    nose: null, faceShift: (r(8) - .5) * .06,
    lashes: fem, freckles: kid && r(9) < .4, glasses: r(10) < (old ? .45 : .15), age: old ? .7 + r(11) * .3 : (kind === 'man' && r(11) < .3 ? .45 : 0),
    hair: fem ? pick(kid ? ['pigtails', 'ponytail', 'bob', 'long'] : ['long', 'bob', 'ponytail', 'bun', 'curly', 'afro'], 12)
              : old ? pick(['receding', 'short', 'buzz', null], 12) : pick(['short', 'side', 'curly', 'spiky', 'buzz', 'afro', 'side', null], 12),
    hairColor: old ? pick(['#8a8a8a', '#e8e4dc', '#b9b4ac'], 13) : pick(HAIR_COLORS.slice(0, 6).concat(['#1c1c24']), 13),
    costume: kid ? pick(['tshirt', 'hoodie', 'overalls', fem ? 'dress' : 'tshirt'], 14) : fem ? pick(['dress', 'sweater', 'tshirt', 'office', 'jacket', 'hoodie'], 14)
                 : old ? pick(['sweater', 'suit', 'office', 'overalls'], 14) : pick(['tshirt', 'hoodie', 'office', 'sweater', 'suit', 'jacket'], 14),
    print: pick(['star', 'circle', 'heart', 'stripe', 'none'], 15), pattern: pick(['dots', 'plain'], 16),
    build: kid ? 'kid' : null, ws: kid ? .9 : .9 + r(17) * .28, size: kid ? .9 : 1,
  };
  // facial hair on about 1 man in 4, mostly small (user: too many beards, too big); big bushy beards mostly on older men
  if (!fem && !kid && r(18) < (old ? .2 : .1)) { p.beard = p.hair === 'receding' || old ? '#b9b4ac' : p.hairColor; p.beardStyle = pick(old ? ['full', 'pointed', 'short', 'trimmed'] : ['stubble', 'stubble', 'goatee', 'trimmed', 'short'], 19); }
  else if (!fem && !kid && r(18) < .25) p.stache = pick(['brush', 'walrus', 'handlebar'], 20);
  if (r(23) < .12 && !fem) p.hat = pick(['cap', 'beret', 'bowler'], 24);
  // forced choices first, then colours that suit the outfit (unless a colour was forced too)
  Object.assign(p, Object.fromEntries(Object.entries(opts).filter(([k]) => k !== 'kind')));
  if (p.costume === 'office' || p.costume === 'suit') p.tie = opts.tie || pick(['#c8384a', '#2d5fbf', '#2f8f6f', '#7a2a3a', '#e0a93a'], 21);
  if (!opts.color && p.costume === 'office') p.color = pick(['#f4f6fb', '#d8e6f8', '#f8efe2', '#e6f2e6', '#fbe9ec'], 22);
  if (!opts.color && p.costume === 'suit') p.color = pick(['#2e3550', '#3a3a44', '#5a4636', '#4a5468', '#23232b'], 22);
  if (!opts.color && p.costume === 'overalls') p.color = pick(['#3f6fc4', '#5a7d9a', '#7a5a3a'], 22);
  return p;
}
// define a named cast member from makePerson: person('dad', 4, { kind: 'man', costume: 'sweater' })
function person(key, seed, opts = {}) { return defineCharacter(key, makePerson(seed, opts)); }
