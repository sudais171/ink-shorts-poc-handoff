// Ink Shorts engine - age presets and more modern outfits for the v0.8 characters (moved over from the v0.9 test rig).
// Loaded after people.js.
//
//   age('mum', 'adult', 'she', { costume: 'coat', color: '#c8643a', seed: 4 })   -> a cast member (CAST.mum)
// ages: kid | teen | young | adult | elder. Grown-ups get grown-up cues (the user reads bare round faces as kids):
// heavier brows, facial hair on men, age lines from adult on, grey hair, glasses and a smaller frame for elders.
// facial (men): stubble | stache | goatee | short | full | pointed | none - picked from the seed when not given.

// ---------- more modern outfits (same contract as OUTFITS: inside / over drawn in the torso, c.body[1] = garment colour) ----------
Object.assign(OUTFITS, {
  vest: {   // a buttoned waistcoat over a white shirt, a bow tie or a tie (c.tieStyle 'bow' | 'tie', c.tie colour)
    base: ['#ffffff', '#f3efe8', '#cfc8bc'],
    inside(c, B) {
      const cx = HIP[0], col = c.body[1];
      for (const s of [-1, 1]) {
        const pts = [[cx + s * 46, 1056], [cx + s * 260, 1056], [cx + s * 260, B.y1 + 10], [cx + s * 6, B.y1 + 10], [cx + s * 6, 1330]];
        shadedShape(pts, shade(col, .2), col, shade(col, -.32), 3, 8);
      }
      for (let y = 1360; y < B.y1 - 30; y += 52) { fillInk(ellPts(cx + 22, y, 11, 11, 14), c.color2 || '#e4bd45', 2, 4); }
      if (!LITE) for (const s of [-1, 1]) { g.fillStyle = shade(col, -.25); g.fillRect(cx + s * 110 - 34, 1440, 68, 8); }
      if ((c.tieStyle || 'bow') === 'bow') {
        const t = c.tie || '#c8384a';
        fillInk([[cx - 62, 1072], [cx - 6, 1094], [cx - 62, 1122]], t, 2, 5); fillInk([[cx + 62, 1072], [cx + 6, 1094], [cx + 62, 1122]], t, 2, 5);
        fillInk(ellPts(cx, 1096, 14, 14, 12), shade(t, -.2), 2, 4);
      } else fillInk(loopPts([[cx - 16, 1084], [cx + 16, 1084], [cx + 24, 1300], [cx, 1336], [cx - 24, 1300]], 5), c.tie || '#2d5fbf', 3, 6);
    },
    sleeve: () => ({ col: '#f3efe8' }), legs: '#2e2f3a', boots: '#2a1d18',
  },
  coat: {   // a long belted coat: lapels, a lighter collar (c.color2), two rows of buttons, a belt with a buckle
    inside(c, B) {
      const cx = HIP[0], col = c.body[1], dk = shade(col, -.3);
      g.fillStyle = c.inner || '#f4ead8'; path([[cx - 50, 1056], [cx + 50, 1056], [cx, 1170]]); g.fill();
      for (const s of [-1, 1]) fillInk([[cx + s * 6, 1060], [cx + s * 120, 1064], [cx + s * 26, 1290]], dk, 3, 6);
      for (const s of [-1, 1]) fillInk([[cx + s * 50, 1054], [cx + s * 150, 1058], [cx + s * 120, 1110]], c.color2 || '#f4ead8', 2, 5);
      g.fillStyle = dk; g.fillRect(cx - 3, 1290, 6, 300);
      for (const s of [-1, 1]) for (let y = 1320; y < 1560; y += 70) fillInk(ellPts(cx + s * 48, y, 12, 12, 14), c.buttons || '#e4bd45', 2, 4);
      g.fillStyle = c.belt || shade(col, -.42); g.fillRect(B.x0 - 10, 1410, B.x1 - B.x0 + 20, 38);
      fillInk([[cx - 30, 1404], [cx + 30, 1404], [cx + 30, 1454], [cx - 30, 1454]], c.buttons || '#e4bd45', 3, 6);
      if (LITE) return;
      fold([[cx - 120, 1480], [cx - 132, 1550], [cx - 126, 1600]], dk); fold([[cx + 112, 1480], [cx + 126, 1550], [cx + 118, 1600]], dk);
    },
    sleeve: c => ({ col: c.body[1] }), legs: '#2e2f3a', boots: '#3a2a22',
  },
  police: {   // a uniform shirt: badge, two flapped pockets, button placket, a dark tie, a black belt with a silver buckle
    inside(c, B) {
      const cx = HIP[0], col = c.body[1], dk = shade(col, -.3);
      g.fillStyle = dk; g.fillRect(cx - 4, 1120, 8, 330);
      for (let y = 1180; y < 1420; y += 62) fillInk(ellPts(cx + 16, y, 10, 10, 12), '#e8eef8', 2, 4);
      fillInk(loopPts([[cx - 14, 1080], [cx + 14, 1080], [cx + 20, 1260], [cx, 1290], [cx - 20, 1260]], 5), '#1c2238', 3, 6);
      for (const s of [-1, 1]) { fillInk([[cx + s * 50, 1200], [cx + s * 150, 1200], [cx + s * 146, 1290], [cx + s * 54, 1290]], shade(col, -.06), 2, 5); fillInk([[cx + s * 48, 1192], [cx + s * 152, 1192], [cx + s * 150, 1222], [cx + s * 50, 1222]], dk, 2, 4); }
      const star = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; star.push([cx - 100 + Math.cos(a) * r, 1150 + Math.sin(a) * r]); }
      fillInk(star, '#ffcc1a', 2, 5);
      g.fillStyle = '#16161c'; g.fillRect(B.x0 - 10, 1450, B.x1 - B.x0 + 20, 44);
      fillInk([[cx - 30, 1444], [cx + 30, 1444], [cx + 30, 1500], [cx - 30, 1500]], '#d8dde6', 3, 6);
    },
    over(c) { for (const s of [-1, 1]) fillInk([[HIP[0] + s * 10, 1076], [HIP[0] + s * 100, 1070], [HIP[0] + s * 78, 1140]], shade(c.body[1], .12), 3, 6); },
    sleeve: c => ({ col: c.body[1] }), legs: '#1c2238', boots: '#16161c',
  },
});
Object.assign(OUTFIT_OF, { vest: 'vest', waistcoat: 'vest', coat: 'coat', police: 'police', uniform: 'police' });

// ---------- age presets ----------
const AGE_SET = {
  kid:   { he: { kind: 'boy', hair: 'spiky' }, she: { kind: 'girl', hair: 'pigtails' } },
  teen:  { he: { kind: 'man', hair: 'side', size: .92, ws: .88, age: 0 }, she: { kind: 'woman', hair: 'ponytail', size: .92, ws: .86, age: 0 } },
  young: { he: { kind: 'man', hair: 'short', ws: 1, age: 0, facial: 'stubble' }, she: { kind: 'woman', hair: 'long', ws: .95, age: 0 } },
  adult: { he: { kind: 'man', hair: 'side', ws: 1.08, age: .4, brows: 'thick' }, she: { kind: 'woman', hair: 'bun', ws: 1, age: .35 } },
  elder: { he: { kind: 'old', hair: 'receding', ws: 1.02, size: .96, age: .85, brows: 'bushy', facial: 'stache', grey: 1 },
           she: { kind: 'old', hair: 'bun', ws: 1, size: .95, age: .8, glasses: true, grey: 1 } },
};
const AGE_HAIR = ['#2a1d18', '#4a2e1e', '#6b4226', '#1c1c24', '#a0682e', '#5a3a22'], AGE_GREY = ['#d9d6d0', '#bdb9b2', '#e8e4dc'];
const AGE_FACIAL = ['short', 'stache', 'full', 'stubble', 'goatee'];
function age(key, ageName, sex = 'he', o = {}) {
  const A = AGE_SET[ageName] && AGE_SET[ageName][sex]; if (!A) throw new Error(`age: no '${ageName}' / '${sex}'`);
  const seed = o.seed || 0, grown = sex === 'he' && (ageName === 'young' || ageName === 'adult' || ageName === 'elder');
  const p = { glasses: false, hat: 'none', beard: null, stache: null, ...A, hairColor: A.grey ? AGE_GREY[seed % 3] : AGE_HAIR[seed % AGE_HAIR.length], ...o };
  if (grown) {
    const fa = o.facial || A.facial || AGE_FACIAL[seed % AGE_FACIAL.length], col = p.hairColor;
    if (fa === 'stache') p.stache = 'walrus';
    else if (fa !== 'none') { p.beard = col; p.beardStyle = { stubble: 'stubble', goatee: 'goatee', short: 'short', full: 'full', pointed: 'pointed' }[fa] || 'short'; }
  }
  for (const k of ['facial', 'grey', 'seed']) delete p[k];
  return person(key, seed + 1, p);
}
