// Ink Shorts engine - characters seen from behind. Loaded after character.js and people.js.
// placedBack(c, P, x, y, k, flip) draws the same person, pose and size as placed() but from the back: no face, the
// back of the hair covering the head, the back of the hat, the back of the outfit (cape over the royal robe, apron
// straps crossing on the smith, a hood hanging on a hoodie...). It is the front view mirrored - a person's left side
// is on the other side of the screen from behind - with the light mirrored too, so it still comes from the same side.
// hair from behind comes down low (a high hairline left a white crescent that read as a grinning mouth)
const NAPE = [[.93, .62], [.5, .8], [0, .86], [-.5, .8], [-.93, .62]];
const backCap = (c, thick, jag = .02) => hairCap(c, thick, NAPE, jag, Math.PI - .72, 2 * Math.PI + .72);
const atR = pts => pts.map(([x, y]) => [HX + x * R, HY + y * R]);
const HAIR_BACK = {
  short: (c, col) => hairFill(backCap(c, a => .05 + .05 * Math.max(0, -Math.sin(a))), col),
  side: (c, col) => hairFill(backCap(c, a => .06 + .06 * Math.max(0, -Math.sin(a))), col),
  curly: (c, col) => {
    hairFill(backCap(c, a => .1 + .07 * Math.abs(Math.sin(a * 9)) + .06 * Math.max(0, -Math.sin(a)), .03), col, 0);
    if (!LITE) { g.strokeStyle = shade(col, -.35); g.lineWidth = 4; for (let i = 0; i < 22; i++) { const x = HX + (hash(i * 3) - .5) * 1.5 * R, y = HY - .9 * R + hash(i * 7) * 1.3 * R; g.beginPath(); g.arc(x, y, 14, 0, 4); g.stroke(); } }
  },
  spiky: (c, col) => hairFill(backCap(c, a => .06 + .2 * Math.max(0, -Math.sin(a)) * Math.pow(Math.abs(Math.sin(a * 6)), 3)), col, 4),
  buzz: (c, col) => { g.save(); g.globalAlpha = .55; hairFill(backCap(c, .015, 0), col, 0); g.restore(); },
  mohawk: (c, col) => hairFill(loopPts(atR([[-.17, -1.32], [.17, -1.32], [.15, .5], [-.15, .5]]), 6), col, 3),
  receding: (c, col) => hairFill(loopPts(atR([[-1.0, -.1], [-.95, .55], [0, .86], [.95, .55], [1.0, -.1], [.75, .22], [0, .4], [-.75, .22]]), 8), col, 5),
  afro: (c, col) => { HAIR.afro.back(c, col); },
  bob: (c, col) => hairFill(loopPts(atR([[-1.12, .5], [-1.18, -.4], [-.7, -1.15], [.7, -1.15], [1.18, -.4], [1.12, .5], [.8, .62], [0, .66], [-.8, .62]]), 8), col, 10),
  long: (c, col) => hairFill(loopPts(atR([[-.62, 1.3], [-.98, 1.0], [-1.08, .3], [-.98, -.7], [0, -1.08], [.98, -.7], [1.08, .3], [.98, 1.0], [.62, 1.3], [0, 1.36]]), 10), col, 14, 5),   // slim, to the shoulders (matches the front)
  ponytail: (c, col) => { hairFill(backCap(c, .06, 0), col, 6); ponytailBack(c, col); },
  bun: (c, col) => { hairFill(backCap(c, .06, 0), col, 6); hairFill(ellPts(HX, HY - .72 * R, .36 * R, .32 * R, 32), col, 4); },
  pigtails: (c, col) => {
    hairFill(backCap(c, .06), col, 6); HAIR.pigtails.back(c, col);
    if (!LITE) for (const s of [-1, 1]) fillInk(ellPts(HX + s * .95 * R, HY - .38 * R, 15, 15, 12), '#e05a8a', 2, 4);
  },
};
// the back of the head: the bit of neck below the hair sits in shade (white read as a blank face); under a helmet
// the hair shows at the back; a man with no hair keeps the usual fringe round the back of the head
function backHair(c) {
  g.save(); path(headContour(c)); g.clip(); g.fillStyle = 'rgba(120,108,170,.32)'; g.fillRect(HX - R * 1.3, HY - R * 1.3, R * 2.6, R * 2.6); g.restore();
  const col = c.hairColor || HAIR_COLORS[Math.floor(hash(keyNum(c) + 5) * 6)];
  if (c.hat === 'helmet') return HAIR_BACK.short(c, col);
  if (!c.hair) return c.build === 'kid' || c.hat === 'bald' ? null : HAIR_BACK.receding(c, c.beard || col);
  (HAIR_BACK[c.hair] || HAIR_BACK.short)(c, col);
}
// hats from behind: peaks and visors point away from us; crowns, helmets, berets and brimmed hats look the same
const HAT_FRONT = hatDraw;
function hatBack(c) {
  const hat = c.hat || 'none', col = c.hatColor;
  if (hat === 'cap') {
    const crown = chain([[HX - R * 1.05, HY - R * .42], [HX - R * 1.1, HY - R * .85], [HX - R * .6, HY - R * 1.2], [HX + R * .6, HY - R * 1.2],
                         [HX + R * 1.1, HY - R * .85], [HX + R * 1.05, HY - R * .42], [HX, HY - R * .5], [HX - R * 1.05, HY - R * .42]], 30);
    g.save(); g.translate(0, -R * .12); shadedShape(crown, '#a88a6c', '#8a6c52', '#5e4636', D * .012, D * .032);
    if (!LITE) brush(chain([[HX - R * .98, HY - R * .5], [HX, HY - R * .58], [HX + R * .98, HY - R * .5]]), () => 5, 'rgba(50,32,24,.6)', false);
    g.restore(); return;
  }
  if (hat === 'jcap') {
    const cc = col || '#d63c30', dome = chain([[HX - R * .85, HY - R * .55], [HX - R * .9, HY - R * 1.15], [HX + R * .9, HY - R * 1.15], [HX + R * .85, HY - R * .55]], 20);
    shadedShape(dome, shade(cc, .3), cc, shade(cc, -.3), D * .012, D * .03);
    fillInk(ellPts(HX, HY - R * .6, R * .28, R * .1, 20), shade(cc, -.45), 2, 4); return;      // the strap gap at the back
  }
  if (hat === 'visor') { brush([[HX - R * .98, HY - R * .55], [HX + R * .98, HY - R * .55]], () => D * .03, '#2a2030'); return; }
  HAT_FRONT(c);
}
// ---------- outfits from behind (same contract as OUTFITS; `over: null` removes a front-only layer) ----------
const backBelt = (B, y, h, col = '#4a2e1e') => { g.fillStyle = col; g.fillRect(B.x0 - 10, y, B.x1 - B.x0 + 20, h); };
const backHem = (B, col, h) => { g.fillStyle = col; g.fillRect(B.x0 - 10, B.y1 - h, B.x1 - B.x0 + 20, h); };
const OUTFIT_BACKS = {
  royal: {
    behind: null,
    inside(c, B) { backHem(B, '#e4bd45', 48); backBelt(B, 1420, 44); },
    over(c, B) {                                  // the cape hangs over the whole back, ermine collar on top
      const col = shade(c.body[1], -.3), cape = symPts([[700, 1070], [836, 1112], [876, 1400], [906, 1760], [858, 1930], [700, 1950]], c.ws || 1);
      shadedShape(cape, shade(col, .2), col, shade(col, -.35), 5, 12);
      if (!LITE) {
        g.save(); path(cape); g.clip();
        g.fillStyle = '#e4bd45'; g.fillRect(HIP[0] - 400, 1890, 800, 70);
        for (const x of [-150, -60, 40, 140]) brush(spline([[HIP[0] + x * .7, 1180], [HIP[0] + x * .95, 1550], [HIP[0] + x * 1.1, 1900]]), taper(7, .3, .3, .2), shade(col, -.3), false);
        g.restore();
      }
      OUTFITS.royal.over(c, B);
    },
  },
  smith: {
    inside(c, B) {                                // apron straps crossing on the back, tied in a bow at the waist
      const cx = HIP[0], lt = '#5a3418';
      for (const s of [-1, 1]) shadedShape([[s < 0 ? B.x0 - 10 : B.x1 + 10, 1330], [cx + s * 150, 1330], [cx + s * 175, B.y1 + 10], [s < 0 ? B.x0 - 10 : B.x1 + 10, B.y1 + 10]], '#9c6238', '#7a4a2a', '#4e2c18', 3, 8);
      brush([[cx - 115, 1075], [cx + 95, 1335]], () => 20, lt); brush([[cx + 115, 1075], [cx - 95, 1335]], () => 20, lt);
      backBelt(B, 1335, 16, lt);
      for (const s of [-1, 1]) fillInk(loopPts([[cx, 1343], [cx + s * 46, 1318], [cx + s * 58, 1350], [cx + s * 40, 1372]], 6), '#6a3e22', 2, 5);
      brush([[cx - 8, 1350], [cx - 30, 1440]], () => 12, lt); brush([[cx + 8, 1350], [cx + 34, 1435]], () => 12, lt);
      if (LITE) return;
      for (const [x, y, r] of [[70, 1560, 34], [-90, 1250, 22]]) shadowBlob(cx + x, y, r, r * .7, 'rgba(30,20,20,.25)', 10);
    },
  },
  soldier: {
    inside(c, B) {
      const cx = HIP[0], col = c.body[1];
      if (!LITE) {
        g.strokeStyle = 'rgba(60,64,74,.55)'; g.lineWidth = 3;
        for (let y = 1060; y < 1700; y += 22) for (let x = B.x0 - 20 + ((y / 22) % 2) * 13; x < B.x1 + 20; x += 26) { g.beginPath(); g.arc(x, y, 12, 0.15, Math.PI - 0.15); g.stroke(); }
      }
      shadedShape([[cx - 150, 1130], [cx + 150, 1130], [cx + 160, B.y1 + 10], [cx - 160, B.y1 + 10]], shade(col, .25), col, shade(col, -.3), 4, 10);
      backBelt(B, 1450, 36);
    },
  },
  messenger: {
    inside(c, B) {
      brush([[B.x1 - 40, 1120], [B.x0 + 30, 1560]], () => 34, '#6a4024');
      backBelt(B, 1460, 30);
      if (!LITE) fold([[HIP[0] - 60, 1500], [HIP[0] - 70, 1580], [HIP[0] - 62, 1640]], shade(c.body[1], -.3));
    },
  },
  tunic: {
    inside(c, B) {
      const cx = HIP[0], col = c.body[1];
      backBelt(B, 1440, 32); backHem(B, shade(col, -.25), 34);
      if (LITE) return;
      const dk = shade(col, -.3);
      fold([[cx - 100, 1490], [cx - 112, 1560], [cx - 106, 1610]], dk); fold([[cx + 110, 1490], [cx + 122, 1560], [cx + 116, 1610]], dk);
      fold([[cx + 4, 1120], [cx, 1300], [cx + 4, 1420]], shade(col, -.15), 4);
    },
  },
  tshirt: { inside(c, B) { backHem(B, shade(c.body[1], -.2), 26); } },
  hoodie: {
    inside(c, B) {
      const col = c.body[1]; backHem(B, shade(col, -.22), 46);
      if (!LITE) { g.strokeStyle = shade(col, -.35); g.lineWidth = 3; for (let x = B.x0; x < B.x1; x += 18) { g.beginPath(); g.moveTo(x, B.y1 - 44); g.lineTo(x, B.y1); g.stroke(); } }
    },
    over(c) {                                     // the hood hanging down the back
      const col = c.body[1], cx = HIP[0], hood = loopPts([[cx - 160, 1070], [cx + 160, 1070], [cx + 140, 1190], [cx, 1290], [cx - 140, 1190]], 8);
      shadedShape(hood, shade(col, .12), shade(col, -.04), shade(col, -.35), 4, 10);
      if (!LITE) brush(spline([[cx - 95, 1110], [cx, 1215], [cx + 95, 1110]]), taper(6, .3, .3, .3), shade(col, -.4), false);
    },
  },
  office: {
    inside(c, B) {
      const cx = HIP[0], dk = 'rgba(40,40,60,.3)';
      brush(spline([[B.x0, 1150], [cx, 1162], [B.x1, 1150]]), () => 4, dk, false);         // yoke seam
      brush([[cx, 1165], [cx, 1300]], () => 4, dk, false);
    },
    over: null,
  },
  sweater: {
    inside(c, B) {
      const col = c.body[1];
      if (!LITE) { g.strokeStyle = shade(col, -.18); g.lineWidth = 4; for (let x = B.x0 + 10; x < B.x1; x += 22) { g.beginPath(); g.moveTo(x, 1100); g.lineTo(x, B.y1); g.stroke(); } }
      backHem(B, shade(col, -.25), 50);
    },
  },
  suit: {
    inside(c, B) {                                // centre seam and the vent at the bottom
      const cx = HIP[0], dk = shade(c.body[1], -.4);
      brush([[cx, 1100], [cx, 1500]], () => 5, dk, false); brush([[cx, 1500], [cx - 14, B.y1]], () => 5, dk, false); brush([[cx, 1500], [cx + 14, B.y1]], () => 5, dk, false);
    },
  },
  dress: {
    inside(c, B) {
      g.fillStyle = shade(c.body[1], -.32); g.fillRect(B.x0 - 10, 1388, B.x1 - B.x0 + 20, 36);   // the sash (no neckline at the back)
      if (!LITE) brush([[HIP[0], 1090], [HIP[0], 1420]], () => 5, shade(c.body[1], -.35), false);   // zip
    },
  },
  jacket: {
    inside(c, B) {
      const col = c.body[1];
      g.fillStyle = col; g.fillRect(B.x0 - 20, 1040, B.x1 - B.x0 + 40, 700);
      if (!LITE) for (const s of [-1, 1]) brush(spline([[HIP[0] + s * 150, 1110], [HIP[0] + s * 120, 1400], [HIP[0] + s * 140, B.y1]]), () => 5, shade(col, -.35), false);
      backHem(B, shade(col, -.2), 40);
    },
    over: null,
  },
  overalls: {
    inside(c, B) {                                // checked shirt, straps crossing down to a small back panel
      const col = c.body[1], cx = HIP[0];
      if (!LITE) { g.strokeStyle = 'rgba(160,60,60,.35)'; g.lineWidth = 8; for (let x = B.x0; x < B.x1; x += 46) { g.beginPath(); g.moveTo(x, 1040); g.lineTo(x, 1700); g.stroke(); } for (let y = 1080; y < 1700; y += 46) { g.beginPath(); g.moveTo(B.x0 - 20, y); g.lineTo(B.x1 + 20, y); g.stroke(); } }
      shadedShape([[cx - 170, 1400], [cx + 170, 1400], [cx + 190, 1700], [cx - 190, 1700]], shade(col, .2), col, shade(col, -.3), 3, 8);
      brush([[cx - 140, 1065], [cx + 70, 1405]], () => 34, col); brush([[cx + 140, 1065], [cx - 70, 1405]], () => 34, col);
    },
  },
};
const BACK_CACHE = new Map();
function outfitBack(O) {
  if (BACK_CACHE.has(O)) return BACK_CACHE.get(O);
  const name = O.legacy ? 'tunic' : Object.keys(OUTFITS).find(k => OUTFITS[k] === O) || 'tunic';
  const B = Object.assign({}, O, { behind: null }, OUTFIT_BACKS[name] || OUTFIT_BACKS.tunic, { legacy: null });
  BACK_CACHE.set(O, B); return B;
}
function placedBack(c, P, x, y, k, flip = false) {
  const O = outfitOf(c), keep = { faceDraw, beardDraw, hairDraw, hatDraw }, light = LIGHT;
  c._outfit = outfitBack(O);
  faceDraw = () => {}; beardDraw = () => {};
  hairDraw = (cc, layer) => { if (layer === 'front') backHair(cc); };
  hatDraw = cc => { if (!cc.hair || cc.hat === 'helmet') backHair(cc); hatBack(cc); };   // charDraw skips hair for these
  setLight(Math.PI - light);
  try { placed(c, P, x, y, k, !flip); }
  finally { ({ faceDraw, beardDraw, hairDraw, hatDraw } = keep); setLight(light); c._outfit = O; }
}
