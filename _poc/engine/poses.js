// Ink Shorts engine - reusable poses and arm presets (rig space). Combine with Object.assign / spread.
// Arms are [left, right] as seen by the viewer. Every helper is a pure function of its arguments.
const ARM = {
  // resting: the arm hangs down the side of the body, the hand just outside it (elbows bend naturally)
  side: s => s < 0 ? { h: [378, 1556], relax: 1 } : { h: [862, 1556], relax: 1 },   // relax: reach from the real shoulder
  belly: (s, k = 1, beat = 0) => s < 0 ? { h: V2([378, 1556], [540, 1450], k) } : { h: V2([862, 1556], [700, 1440 - 10 * beat], k) },
  hip: s => s < 0 ? { e: [300, 1330], h: [428, 1430] } : { e: [940, 1330], h: [812, 1430] },
  chin: (tap = 0) => ({ h: [588, 1122], hh: [588, 1122 - 9 * tap], hb: 1 }),          // left hand props the chin
  lap: s => s < 0 ? { h: [500, 1610] } : { h: [740, 1610] },
  // point: k = 0..1 raise, ang = finger direction (radians, 0 = right), reach multiplies the distance
  point: (s, k, ang = 0, reach = 1) => {
    const base = s < 0 ? [378, 1556] : [862, 1556], sh = s < 0 ? SHL : SHR;
    const tgt = [sh[0] + Math.cos(ang) * 380 * reach, sh[1] + Math.sin(ang) * 380 * reach];
    return { e: V2(V2(sh, base, .55), V2(sh, tgt, .5), k), h: V2(base, tgt, k), point: k > 0.3 ? ang : null };
  },
  scratch: (s, k, t) => {          // scratch the side of the head
    const wob = Math.sin(2 * Math.PI * 6 * t) * 12 * clamp01(k * 2 - 1);
    return s > 0 ? { e: [L2(820, 940, k), L2(1390, 1060, k)], h: [862, 1556], hh: [HX + R * 0.86 + wob, HY - R * 0.5], hb: k }
                 : { e: [L2(420, 300, k), L2(1390, 1060, k)], h: [378, 1556], hh: [HX - R * 0.86 + wob, HY - R * 0.5], hb: k };
  },
  up: (s, k, wave = 0) => {        // raise the hand high above the head (cheer / wave / jump / hold something up)
    const sh = s < 0 ? SHL : SHR;
    return { e: V2(s < 0 ? [420, 1380] : [820, 1380], [sh[0] + s * 210, sh[1] - 300], k), h: V2(s < 0 ? [378, 1556] : [862, 1556], [sh[0] + s * 170 + wave * 40, sh[1] - 690], k) };
  },
  onHead: (s, k) => {              // both hands clutching the head (shock, panic, "oh no")
    const sh = s < 0 ? SHL : SHR;
    return { e: V2(s < 0 ? [420, 1380] : [820, 1380], [sh[0] + s * 170, sh[1] - 180], k), h: V2(s < 0 ? [378, 1556] : [862, 1556], [sh[0] + s * 20, sh[1] - 450], k) };
  },
  // hold something: give the hand position (and a prop); the elbow bends naturally unless given
  hold: (h, prop, e) => ({ e, h, prop }),
  // hand out in front (giving / receiving / slamming on a counter)
  out: (s, k, dist = 1) => {
    const sh = s < 0 ? SHL : SHR, tgt = [sh[0] + s * 300 * dist, 1300];
    return { e: V2(s < 0 ? [420, 1380] : [820, 1380], [sh[0] + s * 150 * dist, 1390], k), h: V2(s < 0 ? [378, 1556] : [862, 1556], tgt, k) };
  },
  // walking arm swing (copied from the reference walk): forward and back against the legs, the elbow softly bent and
  // bending more as the arm comes forward; worked out from the character's own shoulder in charDraw (walkArm)
  swing: (s, phase) => ({ walk: phase + (s < 0 ? 0 : Math.PI) }),
  // running arms: elbows bent ~90 degrees, pumping hard opposite to the legs - worked out from the shoulder in charDraw
  pump: (s, phase, face = 1) => ({ pump: phase + (s < 0 ? 0 : Math.PI) }),
  flail: (t, ph = 0) => [0, 1].map(i => { const s = i ? 1 : -1, a = Math.sin(t * 22 + ph + i * 2), sh = s < 0 ? SHL : SHR;
    return { e: [sh[0] + s * 180, sh[1] - 120 + a * 60], h: [sh[0] + s * 260, sh[1] - 350 + a * 120] }; }),
};

// ---------- movement along a path ----------
// track(keys): x(t) through [[t, x], ...] (rossark-motion "flow, don't stop"): it eases out of the first key and into
// the last, stops at a hold (repeat a value) or where the motion turns back, and passes through every other key without
// stopping or overshooting (a monotone curve) - the old version stopped at every key, so moves looked like a robot
// going pose to pose. [t, x, 'lin'] makes the segment ending there keep a constant speed (clouds, a conveyor).
function track(keys) {
  const n = keys.length, T = keys.map(k => k[0]), X = keys.map(k => k[1]), lin = keys.map(k => k[2] === 'lin'), m = new Array(n).fill(0);
  const d = T.slice(1).map((t, i) => (X[i + 1] - X[i]) / (t - T[i]));
  for (let i = 1; i < n - 1; i++) if (d[i - 1] * d[i] > 0) {
    const w1 = 2 * (T[i + 1] - T[i]) + (T[i] - T[i - 1]), w2 = (T[i + 1] - T[i]) + 2 * (T[i] - T[i - 1]);
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  for (let i = 1; i < n; i++) if (lin[i]) {             // a constant-speed segment hands its speed on to its neighbours
    if (i > 1 && d[i - 2] * d[i - 1] > 0) m[i - 1] = d[i - 1];
    if (i < n - 1 && d[i] * d[i - 1] > 0) m[i] = d[i - 1];
  }
  return t => {
    if (n < 2 || t <= T[0]) return X[0];
    for (let i = 1; i < n; i++) if (t <= T[i]) {
      const h = T[i] - T[i - 1], u = (t - T[i - 1]) / h;
      if (lin[i]) return L2(X[i - 1], X[i], u);
      const u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * X[i - 1] + (u3 - 2 * u2 + u) * h * m[i - 1] + (-2 * u3 + 3 * u2) * X[i] + (u3 - u2) * h * m[i];
    }
    return X[n - 1];
  };
}
const flow = track;   // the same thing (name used in the idle-life tests)

const POSE = {
  breathe: (t, ph = 0) => IDLE ? {} : ({ br: 0.006 * Math.sin(2 * Math.PI * t / 2.5 + ph) }),   // idle life breathes for everyone now
  blinkAt: (t, times) => ({ blink: times.reduce((s, b) => Math.max(s, IDLE ? blinkShape(t - b) : bmp(t, b, b + 0.17)), 0) }),
  // laughing fit starting at t0: bouncing body, closed happy eyes, open mouth on a 3 Hz chuckle
  laugh: (t, t0, ph = 0, until = 1e9) => {
    const L = ss2(t0, t0 + 0.25, t) * (1 - ss2(until, until + 0.2, t)), beat = Math.abs(Math.sin(2 * Math.PI * 3.1 * t + ph));
    return { L, beat, eyes: L > 0.35 ? 'laugh' : 'lid', mouth: L > 0.2 ? 'laugh' : 'smirk', open: L * (0.55 + 0.45 * beat), grin: 0.8, smug: 0.4,
      bounce: L * 14 * beat, hr: -0.09 * L + 0.025 * L * Math.sin(2 * Math.PI * 1.6 * t + ph), hy: -6 * L * beat, browL: 0.03 * L, browR: 0.03 * L };
  },
  // talking (lip sync): mouth shape from the letters of the word being spoken at t (WORDS), size from the voice
  // loudness ENV; both written by tools/transcribe.py. Use it only for the character who says the line.
  talk: (t, from, to) => {
    if (t < from || t > to) return { mouth: 'smirk' };
    const e = (typeof ENV !== 'undefined') ? envAt(t) : Math.abs(Math.sin(t * 17)) * 0.8;
    return { mouth: 'talk', vis: visemeAt(t), open: e, hr: 0.015 * Math.sin(t * 7), hy: -3 * e };
  },
  puzzled: (t, t0) => { const k = spr(t, t0); return { eyes: 'wide', look: 0.6, mouth: 'wavy', browL: -0.01, browR: 0.06 * k, hr: 0.1 * k, lean: 0.05 * k }; },
  shocked: (t, t0) => { const k = spr(t, t0); return { eyes: k > .3 ? 'shock' : 'lid', mouth: k > .3 ? 'shock' : 'smirk', open: k, browL: 0.06 * k, browR: 0.06 * k, hy: -18 * bmp(t, t0, t0 + .3), bounce: 10 * bmp(t, t0, t0 + .3) }; },
  angry: (t, t0) => { const k = ss2(t0, t0 + .2, t); return { browTilt: 1.2 * k, mouth: 'frown', hr: 0.02 * Math.sin(t * 30) * k }; },
  // walking in place: the scissor stride (legs from one hip point, heel first), turned the way it goes, arm swing.
  // Move the character in world space with placed(..., x(t)); speed = strides a second (1 = a relaxed stroll)
  walk: (t, speed = 1, face = 1, ph = 0) => {
    const p = t * speed * Math.PI * 2 + ph;
    return { legs: 'stride', walkPhase: p, strideA: STRIDE_A, face, turn: .85 * face, lean: -.02 * face, hr: .015 * Math.sin(p * 2),
      arms: [ARM.swing(-1, p), ARM.swing(1, p)] };
  },
  run: (t, speed = 2.8, face = 1, ph = 0) => {
    const p = t * speed * Math.PI * 2 + ph;
    return { legs: 'run', walkPhase: p, face, bounce: 26 * Math.abs(Math.cos(p)), lean: 0.26 * face, hr: -0.06 * face + 0.03 * Math.sin(p), grin: .3,
      arms: [ARM.pump(-1, p, face), ARM.pump(1, p, face)] };
  },
  // walk or run along x(t) (world units) at scale k: the leg cycle is driven by the distance travelled, so planted
  // feet do not slide; facing follows the direction; standing still in between returns an idle stance.
  along: (t, xFn, k, opts = {}) => {
    const dt = 1 / 60, v = (xFn(t + dt) - xFn(t - dt)) / (2 * dt), run = opts.run ?? Math.abs(v) > 520;
    const face = Math.abs(v) > 5 ? Math.sign(v) : (opts.face || 1);
    // moving left mirrors the whole character (turnX = -1) so hats, lean and feet all point the way it goes
    if (Math.abs(v) < 25) return { legs: 'stand', turnX: face, look: 1, arms: [ARM.side(-1), ARM.side(1)] };
    // walking: PI of phase per step and a step = 2 * leg * sin(strideA) rig units, so the planted foot keeps pace
    const p = run ? xFn(t) * face / (165 * k) + (opts.ph || 0) : xFn(t) * face / k / (2 * LEG * Math.sin(STRIDE_A)) * Math.PI + (opts.ph || 0);
    const P = run ? POSE.run(0, 0, 1) : POSE.walk(0, 0, 1);
    P.walkPhase = p; P.look = 1; P.turnX = face; P.turn = .85;
    if (run) { P.bounce = 26 * Math.abs(Math.cos(p)); P.hr = -0.06 + 0.02 * Math.sin(p); }
    P.arms = run ? [ARM.pump(-1, p, 1), ARM.pump(1, p, 1)] : [ARM.swing(-1, p), ARM.swing(1, p)];
    return P;
  },
  // jump at t0 (feet leave the ground) lasting `air` s and peaking `height` rig units up: crouch before, tuck in the air,
  // squash on landing. Spread over a pose: { ...POSE.jump(t, 2.0) }.
  jump: (t, t0, height = 520, air = 0.6) => {
    const pre = ss2(t0 - 0.18, t0 - 0.02, t) * (t < t0 ? 1 : 0), u = (t - t0) / air;
    if (t < t0) return { legs: 'crouch', floorY: 1508 + LEG, dy: 90 * pre, br: -0.06 * pre, arms: [ARM.side(-1), ARM.side(1)] };
    if (u < 1) return { legs: 'tuck', dy: -height * 4 * u * (1 - u), br: 0.05 * (1 - u * 2), arms: [ARM.up(-1, 1), ARM.up(1, 1)], eyes: 'wide', mouth: 'o' };
    const l = t - (t0 + air), sq = Math.exp(-9 * l) * Math.cos(12 * l) * (l < 0.6 ? 1 : 0);
    return { legs: 'crouch', floorY: 1508 + LEG, dy: 70 * Math.max(0, sq), br: -0.08 * Math.max(0, sq), arms: [ARM.side(-1), ARM.side(1)] };
  },
  // sit down onto a seat between t0 and t0+dur. `drop` = how far the hip falls (rig units: standing hip height above the
  // seat / k); place the character at the SEAT line. Feet stay planted on the floor (chair sitting). In 3D sets give
  // the seat's height instead (a number up to 1, as in V.person's `seat`: bench .22): the drop then follows the legs.
  sitDown: (t, t0, drop = 300, dur = 0.45) => {
    if (drop <= 1) drop = LEG - drop * CHAR_H;
    const k = Math.min(1.08, spr(t, t0));      // drops onto the seat with a small settle (the jelly head adds the wobble)
    return { legs: 'crouch', dy: -(1 - k) * drop, floorY: 1508 + LEG - drop, lean: -0.1 * bmp(t, t0, t0 + dur), footFwd: 40 * k, seat: Math.min(1, k) };
  },
  standUp: (t, t0, drop = 300, dur = 0.4) => {
    if (drop <= 1) drop = LEG - drop * CHAR_H;
    const k = 1 - ss2(t0, t0 + dur, t);
    return { legs: 'crouch', dy: -(1 - k) * drop, floorY: 1508 + LEG - drop, lean: 0.12 * bmp(t, t0, t0 + dur), footFwd: 40 * k, seat: k };
  },
  // turnaround: squash to edge-on and flip between t0 and t0+dur (classic cartoon turn). from/to = facing (+1 right).
  turn: (t, t0, from = 1, to = -1, dur = 0.18) => {
    // the body is drawn facing right; turnX = facing * edge-on squash (|cos| dips to ~0 halfway, where the flip happens)
    const k = ss2(t0, t0 + dur, t), face = k < 0.5 ? from : to;
    return { turnX: face * Math.max(0.12, Math.abs(Math.cos(Math.PI * k))), look: 1, face: 1 };
  },
  // fall flat backwards (dir -1) or forwards (+1) at t0: tips over around the feet with a bounce, dazed face
  fall: (t, t0, dir = -1) => {
    const k = t < t0 ? 0 : Math.min(1, spr(t, t0) * 1.02);
    return { rot: dir * 1.45 * k, eyes: k > .2 ? 'shock' : 'lid', mouth: k > .2 ? 'shock' : 'smirk', open: .8, arms: ARM.flail(t), browL: .05, browR: .05 };
  },
  // crawling flat on the belly (under bushes, under a fence, sneaking): the body lies forward along the floor (dir +1
  // = heading right), head up looking ahead, arms reaching forward in turn, legs kicking. Move x with t for travel.
  crawl: (t, dir = 1, rate = 1.4) => {
    const a = t * rate * Math.PI * 2, s = Math.sin(a);
    const reach = k => ({ h: V2([540, 1200], [540 + 40 * k, 760], .55 + .45 * k) });
    return { legs: 'walk', walkPhase: a, stride: .45, face: 1, rot: dir * 1.42, hr: -dir * 1.25, look: dir, hy: -6 * Math.abs(s),
      arms: [reach(Math.max(0, s)), reach(Math.max(0, -s))] };
  },
  // climbing up a wall or a ladder: hands reach up in turn, knees step up in turn, a little bob each pull. Move the
  // hang point up with t (stage S.hang, or y in 2D) - about 0.5 person heights per cycle looks right.
  climb: (t, rate = 1.1) => {
    const a = t * rate * Math.PI * 2, s = Math.sin(a);
    return { legs: 'walk', walkPhase: a, stride: .55, kneeBend: .4, bounce: 14 * Math.abs(s), lean: .02 * s, hr: .04 * s, look: 0, eyes: 'wide',
      arms: [ARM.up(-1, .72 + .28 * Math.max(0, s)), ARM.up(1, .72 + .28 * Math.max(0, -s))] };
  },
  // knocked back: a short hop backwards, arms thrown up (combine with a world x that slides back)
  knockback: (t, t0, dir = -1) => {
    const u = clamp01((t - t0) / 0.35);
    return t < t0 ? {} : { dy: -160 * 4 * u * (1 - u), lean: -dir * 0.3 * (1 - u), eyes: 'shock', mouth: 'shock', open: .9, arms: ARM.flail(t) };
  },
};

// when a word is said, from words.js: atWord('slams') = the moment to START the action for it - LEAD (2 frames) before
// the word, so a head snap, a slam or a push-in lands a hair ahead of the voice like a tight edit (a reaction that
// starts on or after its word feels late). n = which time the word is said (1 = first); wordEnd() = when it ends.
// Matching ignores case and punctuation and is whole-word; only a word never said whole falls back to the start of a
// word ("slam" finds "slammed" when "slam" itself is not in the voiceover). Unknown words throw.
let LEAD = 2 / 30;
function wordHit(text, n = 1) {
  const key = String(text).toLowerCase().replace(/[^a-z0-9']/g, ''), list = typeof WORDS === 'undefined' ? [] : WORDS;
  // whole-word matches first ("the" must not land on "there"/"them"); the start of a word only when none exist
  const norm = w => w.w.toLowerCase().replace(/[^a-z0-9']/g, '');
  const exact = list.some(w => norm(w) === key);
  let k = 0;
  for (const w of list) if ((exact ? norm(w) === key : norm(w).startsWith(key)) && ++k === n) return w;
  throw new Error(`atWord: "${text}" (${n}) is not in words.js`);
}
const atWord = (text, n = 1) => Math.max(0, wordHit(text, n).s - LEAD);
const wordEnd = (text, n = 1) => wordHit(text, n).e;
// loudness envelope lookup (ENV = {fps, v:[...]}, written by tools/transcribe.py into words.js)
function envAt(t) {
  const u = voiceMap() && URDU.env, E = u ? URDU.env : ENV, tt = u ? voiceT(t) : t;   // mouths follow the voice you hear
  const i = Math.max(0, Math.min(E.v.length - 1, Math.round(tt * E.fps))); return E.v[i]; }
// mouth shape for the letter being spoken: the word's letters are spread evenly across its duration
function visemeAt(t) {
  if (typeof WORDS === 'undefined') return 'rest';
  const w = WORDS.find(w => t >= w.s && t < w.e); if (!w) return 'M';
  const letters = w.w.toLowerCase().replace(/[^a-z]/g, ''); if (!letters) return 'rest';
  const ch = letters[Math.min(letters.length - 1, Math.floor((t - w.s) / Math.max(0.01, w.e - w.s) * letters.length))];
  if ('mbp'.includes(ch)) return 'M';
  if ('ouwq'.includes(ch)) return 'O';
  if ('ai'.includes(ch)) return 'A';
  if ('ey'.includes(ch)) return 'E';
  if ('fv'.includes(ch)) return 'F';
  return 'rest';
}

// ---------- snappy acting (v1.0.4; studied frame by frame on hand-drawn stick animation, user: "so smooth and human") ----------
// Every action: a small wind-up the other way, a fast snap into the pose, a little past it, then it settles - with the
// whole body in it (lean, bounce, head first, weight on one leg). The main move gets faster, not slower; start the
// wind-up that much earlier so the hit still lands on the word (atWord).
// snap(keys, t): a keyed value [[t, v], ...]; each segment starts fast and slows into its key (ease-out), so values
// snap and settle instead of gliding evenly. Use it for lean, bounce, hr, hx, hy, dy and arm blends.
function snap(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const u = Math.min(1, Math.max(0, (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
    return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * (1 - (1 - u) ** 3);
  }
  return keys[keys.length - 1][1];
}
// act(t, t0, o) -> progress of one action that HITS at t0: 0 before, dips to -wind during the wind-up (.15 s before),
// shoots to 1 + over in `go` s, settles to 1. Blend with it: ARM.point(1, act(t, hit)) - the negative part pulls the
// hand back first. o = { wind: .15, windT: .15, go: .08, over: .12, settle: .25 }
function act(t, t0, o = {}) {
  const w = o.wind ?? .15, wt = o.windT ?? .15, go = o.go ?? .08, ov = o.over ?? .12, se = o.settle ?? .25;
  return snap([[t0 - wt - go, 0], [t0 - go, -w], [t0, 1 + ov], [t0 + se, 1]], t);
}
Object.assign(POSE, {
  // a split stance: one foot back (k 0..1 how far apart), weight on the back leg; stays put (no walking). Use for a
  // step back in shock, bracing, leaning in to point. planted keeps the pose's own arms even when side-on.
  stance: (k = 1, a = .34) => k < .02 ? { legs: 'stand' } : { legs: 'stride', walkPhase: Math.PI / 2 * k, strideA: a * k, walkBob: 0, planted: true },
  // squat by d rig units with the feet kept on the floor (peek at the ground, wind-up before a jump, landing)
  squat: d => d < 1 ? { legs: 'stand' } : { legs: 'crouch', dy: d, floorY: 1508 + LEG - d },
  // a jump with a real wind-up: sinks and swings the arms back (.4 s), takes off at t0, tucks, lands with a squash
  hop: (t, t0, height = 460, air = .55) => {
    if (t < t0) { const k = snap([[t0 - .45, 0], [t0 - .05, 1]], t);
      return { ...POSE.squat(150 * k), lean: .12 * k, hy: 6 * k, arms: [{ h: [L2(378, 300, k), L2(1556, 1620, k)] }, { h: [L2(862, 960, k), L2(1556, 1620, k)] }] }; }
    const u = (t - t0) / air;
    if (u < 1) return { legs: 'tuck', dy: -height * 4 * u * (1 - u), lean: -.06 * Math.sin(Math.PI * u), arms: [ARM.up(-1, Math.min(1, u * 3)), ARM.up(1, Math.min(1, u * 3), .5)] };
    const l = t - t0 - air, sq = Math.max(0, Math.exp(-7 * l) * Math.cos(11 * l));
    return { ...POSE.squat(140 * sq), lean: .1 * sq, hy: 8 * sq, arms: [ARM.up(-1, Math.max(0, 1 - l * 4)), ARM.up(1, Math.max(0, 1 - l * 4))] };
  },
});
