// Ink Shorts engine - 3D sets (three.js). v0.9: the CLEAN look (look: 'clean' - no outlines, smooth light, sun through
// windows, gloss, mirror floors, polished furniture (polish), glow; patterns wood / paint / card / paving; times interior and sunny) - see CLEAN.md.
// A real 3D set built from code parts (kit3d.js) and drawn in the ink style:
// flat toon tones, ink outlines found from the shapes (edge detection on normals and depth), painted patterns (boards,
// stones, thatch, tiles, grass, water), real sun shadows, dim warm rooms lit by their own fires and candles, times of
// day, paper grain. Our 2D characters stand in it as cards that turn to the camera, are hidden by walls like anything
// else and show their backs when the camera goes behind them. Units: 1 = a person's height (soles to head top).
//   const S = set3d({ time: 'day' })
//   S.box(w, h, d, [x, y, z], S.mat('#efe3c8', { pat: 'plaster' }))      y = the bottom
//   S.person(CAST.kingA, t => ({...}), [x, z], { face: 0, seat: .2 })      a character card
//   shot: { t, cam: () => ({ noClamp: true }), back: t => S.render(pos, at, fov) }
THREE.ColorManagement.enabled = false;
const PAT = { plain: 0, boards: 1, stone: 2, thatch: 3, grass: 4, dirt: 5, plaster: 6, leaves: 7, tiles: 8, water: 9, cobbles: 10, metal: 11, gloss: 12, cloud: 13, wood: 14, paint: 15, card: 16, paving: 17 };
const INK_FRAG = `
varying vec3 vN; varying vec3 vW; varying vec2 vUv; uniform sampler2D map; uniform float useMap; uniform vec2 mapSc; varying vec3 vBake; uniform sampler2D arm; uniform float useArm, bakeMode, bakeK, alpha, toon, mipB, gain, sunK, aoK, hiCap;
uniform vec3 col, col2, sun, fogC, sunC, shdC; uniform float pat, sc, emi, axis, recv, time, shPx, hatch, soft;
uniform vec4 lp[6]; uniform vec3 lc[6]; uniform float lfo[6]; uniform vec4 rooms[4]; uniform float roomH[4]; uniform vec2 fogR; uniform float vary, clean, specU, mirror, polish; uniform sampler2D refl; uniform mat4 reflM;
uniform mat4 shM; uniform sampler2D shD;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
// an ink line where coordinate x crosses a whole number, about w pixels wide at any distance
float seam(float x, float w){ float fw = max(fwidth(x), 1e-4), d = abs(x - floor(x + .5)); return 1. - smoothstep(fw * w * .5, fw * (w * .5 + 1.), d); }
// small detail fades out when it gets too fine to draw (far away), instead of shimmering
float detail(vec2 p){ vec2 fw = fwidth(p); return 1. - smoothstep(.15, .4, max(fw.x, fw.y)); }
// the sun's shadow map (rendered from the sun each frame): 0 lit .. 1 in shadow, a little softened at the edge
float sunShadow(vec3 w, vec3 n){
  vec4 s = shM * vec4(w + n * .03, 1.); vec3 p = s.xyz / s.w * .5 + .5;
  if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1. || p.z > 1.) return 0.;
  float sh = 0.;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) sh += p.z - .0012 > texture2D(shD, p.xy + vec2(float(i), float(j)) * shPx).x ? 1. : 0.;
  return smoothstep(.3, .7, sh / 9.);
}
bool inRoom(vec3 w){
  for (int i = 0; i < 4; i++) if (w.x > rooms[i].x && w.x < rooms[i].y && w.z > rooms[i].z && w.z < rooms[i].w && w.y < roomH[i] && w.y > -.05) return true;
  return false;
}
void main(){
  float spec = specU; float metK = 1.;
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 a = abs(n);
  vec2 p = a.y > .6 ? vW.xz : (a.x > a.z ? vW.zy : vW.xy);
  if (axis > .5) p = p.yx;
  p /= sc;
  vec3 c = col;
  if (useMap > 1.5) { vec3 an = abs(normalize(vN)); vec2 tp = an.y > max(an.x, an.z) ? vW.xz : an.x > an.z ? vW.zy : vW.xy;
    c = pow(texture2D(map, tp * mapSc, mipB).rgb, vec3(2.2)) * col; }
  else if (useMap > .5) c = pow(texture2D(map, vUv * mapSc, mipB).rgb, vec3(2.2)) * col;
  if (gain != 1.) c = 1. - pow(1. - clamp(c, 0., 1.), vec3(gain));   // lift dark woods without blowing out whites
  if (useArm > .5) { vec3 am = texture2D(arm, vUv).rgb; spec = mix(spec, .6, am.b) * (1. - .6 * am.g); } float ink = 0., dt = detail(p);
  if (vary > 0. && emi < .5) {        // no surface is one flat colour: soft patches, mottling, a warm/cool drift (the canyon look)
    float n1 = noise(vW.xz * .32 + vW.y * .21), n2 = noise(p * 1.6 + 3.1), n3 = noise(vW.xz * .11 + 9.);
    c *= mix(1., (.86 + .26 * n1) * (.93 + .14 * n2), vary);
    c *= mix(vec3(1.), mix(vec3(1.05, .99, .93), vec3(.95, .99, 1.05), n3), vary);
  }
  if (pat == 1.) {                       // boards: seams, staggered butt joints, grain
    float row = floor(p.y), u = p.x / 7. + hash(vec2(row, 1.7));
    c *= .9 + .18 * hash(vec2(row, floor(u)));
    c *= 1. - .12 * smoothstep(.6, .68, noise(vec2(p.x * .6, fract(p.y) * 5. + row * 13.))) * dt;
    ink = max(seam(p.y, 1.6), seam(u, 1.4));
  } else if (pat == 2.) {                // stones: wobbly courses, each stone its own shade
    vec2 q = p + (vec2(noise(p * 1.7), noise(p * 1.7 + 5.)) - .5) * .35;
    float row = floor(q.y), u = q.x / 1.7 + hash(vec2(row, 4.));
    c *= .84 + .24 * hash(vec2(row, floor(u)));
    ink = max(seam(q.y, 1.8), seam(u, 1.8));
  } else if (pat == 3.) {                // thatch: straw streaks down the slope in layered rows
    c *= .86 + .22 * noise(vec2(p.x * 9., p.y * .8));
    float row = p.y + .12 * sin(p.x * 3.1);
    c *= 1. - .2 * smoothstep(.55, 1., fract(row));
    ink = max(seam(row, 1.6) * .85, smoothstep(.8, .84, noise(vec2(p.x * 24., p.y * 2.))) * .45 * dt);
  } else if (pat == 4.) {                // grass: two greens in patches
    c = mix(col, col2, smoothstep(.48, .56, noise(p * .9) * .7 + noise(p * 3.1) * .3));
  } else if (pat == 5.) {                // dirt with pebbles
    c = mix(col, col2, smoothstep(.45, .6, noise(p * 1.3)));
    vec2 cell = floor(p * 1.5), f = fract(p * 1.5) - .5;
    float peb = step(.8, hash(cell)) * (1. - smoothstep(.1, .14, length(f - (vec2(hash(cell + 3.), hash(cell + 7.)) - .5) * .5)));
    c = mix(c, col2 * .8, peb * dt);
  } else if (pat == 6.) {                // plaster: soft patches
    c *= .95 + .08 * noise(p * .8);
  } else if (pat == 7.) {                // leaves: two greens in clumps
    c = mix(col, col2, smoothstep(.5, .58, noise(p * 2.2)));
  } else if (pat == 8.) {                // roof tiles: staggered rows with rounded lower edges, each tile its own shade
    float row = floor(p.y), fy = fract(p.y), u = p.x + row * .5, fu = fract(u);
    float e = .25 * (1. - pow(2. * abs(fu - .5), 2.));
    c *= .86 + .2 * hash(vec2(row, floor(u)));
    c *= 1. - .15 * smoothstep(.6, 1., fy);
    float fw = max(fwidth(p.y), 1e-4);
    ink = max(1. - smoothstep(fw * .9, fw * 1.9, abs(fy - e)), seam(u, 1.3) * step(e, fy)) * (.6 + .4 * dt);
  } else if (pat == 9.) {                // water: two blues and drifting inked ripples
    vec2 q = p + vec2(time * .15, time * .07);
    c = mix(col, col2, smoothstep(.4, .7, noise(q * .7)));
    float r = noise(vec2(q.x * 1.3, q.y * 4.) + time * .2);
    ink = (smoothstep(.62, .64, r) - smoothstep(.66, .68, r)) * .6 * dt;
    c = mix(c, vec3(1.), (smoothstep(.7, .72, r) - smoothstep(.74, .76, r)) * .5 * dt);
  } else if (pat == 10.) {               // cobbles: rounded stones in rows
    vec2 q = p + (vec2(noise(p * 2.1), noise(p * 2.1 + 3.)) - .5) * .4;
    vec2 cell = floor(vec2(q.x + floor(q.y) * .5, q.y)), f = fract(vec2(q.x + floor(q.y) * .5, q.y)) - .5;
    c *= .84 + .24 * hash(cell);
    float d = max(abs(f.x), abs(f.y)), fw = max(fwidth(q.y), 1e-4);
    if (vary > 0.) {                     // every stone its own colour, rounded - darker toward its edges, lit on top
      c *= mix(vec3(1.), mix(vec3(1.1, .94, .8), vec3(.86, .9, .97), hash(cell + 7.3)), .55 * vary);
      c *= 1. - .3 * vary * smoothstep(.12, .5, d) + .1 * vary * (1. - smoothstep(0., .3, length(f + vec2(.12, -.12))));
    }
    ink = smoothstep(.5 - fw * 2.2, .5 - fw * .6, d) * (.5 + .5 * dt);
  }
  if (pat == 14.) {                      // wood grain (clean look): long fibres, darker growth streaks along the length
    float w1 = noise(vec2(p.x * .7, p.y * 16.)), w2 = noise(vec2(p.x * 2.2, p.y * 48.)), ring = fract(p.y * 5. + noise(p * vec2(.5, 2.)) * 2.2);
    c *= .8 + .26 * w1 + .1 * w2; c *= 1. - .24 * smoothstep(.7, .96, ring) * dt;
  } else if (pat == 15.) {               // painted wood: faint brush strokes running along the boards
    c *= .975 + .035 * noise(vec2(p.x * 1.5, p.y * 22.)) * dt + .03 * noise(p * 3.);   // soft: fine stripes read as lines
  } else if (pat == 16.) {               // cardboard and paper: fibres and soft blotches
    c *= .9 + .1 * noise(p * 30.) * dt + .06 * noise(p * 4.);
  } else if (pat == 17.) {               // paving: small square slabs in staggered rows, each its own shade, grout lines
    vec2 q = p + vec2(floor(p.y) * .5, 0.), cell = floor(q), f = fract(q) - .5;
    c *= .86 + .2 * hash(cell); c *= 1. - .08 * noise(p * 3.) - .05 * noise(p * 17.) * dt;
    float fw = max(fwidth(q.x), 1e-4); ink = max(ink, smoothstep(.5 - fw * 1.8, .5 - fw * .5, max(abs(f.x), abs(f.y))) * (.6 + .4 * dt));
  }
  if (pat == 13.) {                      // a soft painted cloud: white in the sun, lilac underneath, no lines
    float k = smoothstep(-.35, .75, dot(n, sun) + .25 * n.y);
    c = mix(col2, col, k); c = mix(c, vec3(1.), smoothstep(.85, 1., k) * .4);
  } else if (pat == 11. && emi < .5) {          // painted metal (bronze, iron, gold): smooth light-to-dark, a highlight that moves
    vec3 vd = normalize(cameraPosition - vW);  // with the camera, darker curving edges, brushed streaks, patina (col2) in blotches
    float d = dot(n, sun), k = smoothstep(-.45, .9, d);
    vec3 dark = col * .38, lite = mix(col, vec3(1., .94, .78), .5);
    c = mix(dark, col, smoothstep(0., .55, k)); c = mix(c, lite, smoothstep(.6, 1., k));
    float br = noise(vec2(p.x * 9., p.y * .7)) * .6 + noise(vec2(p.x * 23., p.y * 1.6)) * .4;
    c *= mix(.86 + .28 * br, .97 + .06 * br, clean);              // clean: smooth polished metal, no stripy brushing
    float sp = pow(max(dot(reflect(-sun, n), vd), 0.), 9.);
    c += vec3(1., .88, .62) * min(sp, .7) * (.4 + .6 * br) * .8;
    float fr = 1. - max(dot(n, vd), 0.); c *= 1. - .5 * smoothstep(.4, .95, fr);
    // patina gathers where water sits: under rings and lips (faces turned down), plus a few small spots
    float pt = noise(p * 2.6 + 3.) * .6 + noise(p * 9.) * .4;
    float pm = (smoothstep(.7, .73, pt) + smoothstep(-.05, -.45, n.y) * smoothstep(.42, .5, pt)) * step(.001, distance(col, col2));
    pm = min(pm, 1.);
    c = mix(c, col2 * (.6 + .35 * k), pm * .88);
    ink = max(ink, pm * (1. - smoothstep(.0, .02, abs(pt - .615))) * .5);
    ink = max(ink, smoothstep(.93, .95, noise(vec2(p.x * 40., p.y * 3.))) * .35 * dt * (1. - clean));    // scratches (not in the clean look)
    bool inside = inRoom(vW);
    if (!inside && recv > .5) c *= mix(1., .72, sunShadow(vW, n));
    if (inside) c *= vec3(.85, .78, .7);
    vec3 add = vec3(0.);
    for (int i = 0; i < 6; i++) { vec3 tl = lp[i].xyz - vW; float dd = length(tl); add += lc[i] * lp[i].w * exp(-dd * 1.25) * max(dot(n, tl / max(dd, 1e-3)), 0.); }
    c += col * add;
  } else if (pat == 12. && emi < .5) {   // polished cel metal (anime gold, brass, chrome): hard-edged bands from the
    vec3 vd = normalize(cameraPosition - vW), vn = normalize((viewMatrix * vec4(n, 0.)).xyz);   // view-space normal,
    float d = dot(n, sun);                 // a sharp highlight streak on the lit side, the ground (col2) reflected underneath
    vec3 dark = col * .5, darkR = col * .36 + vec3(.07, .02, 0.), lite = mix(col, vec3(1., .95, .62), .4), hi = vec3(1., .985, .88);
    float aa = .03;
    c = mix(col, dark, smoothstep(-.05, -.05 - aa * 3., d) * .7);
    // a broad light band on the lit side with one sharp streak in it; a deep brown reflection on the far side, a warm rim
    c = mix(c, lite, smoothstep(.04, .04 + aa, -vn.x) * (1. - smoothstep(.58, .58 + aa, -vn.x)));
    c = mix(c, hi, 1. - smoothstep(.05, .05 + aa, abs(-vn.x - .27)));
    c = mix(c, darkR, smoothstep(.14, .14 + aa, vn.x) * (1. - smoothstep(.64, .64 + aa, vn.x)) * .85);
    c = mix(c, col * .95, smoothstep(.66, .66 + aa, vn.x) * .55);
    c = mix(c, col2, smoothstep(-.2, -.2 - aa * 3., vn.y) * .8);
    c = mix(c, hi, smoothstep(.82, .82 + aa * 3., vn.y) * .55);
    c += hi * pow(max(dot(reflect(-sun, n), vd), 0.), 60.) * .9;
    bool inside = inRoom(vW);
    if (!inside && recv > .5) c *= mix(1., .75, sunShadow(vW, n));
    if (inside) c *= vec3(.86, .8, .72);
    vec3 add = vec3(0.);
    for (int i = 0; i < 6; i++) { vec3 tl = lp[i].xyz - vW; float dd = length(tl); add += lc[i] * lp[i].w * exp(-dd * 1.25) * max(dot(n, tl / max(dd, 1e-3)), 0.); }
    c += col * add;
  } else if (emi < .5 && clean > .5) {
    // the CLEAN look (test, 2026-11-02): smooth light, real sun coming in through openings (shadow map indoors too),
    // a bright sky/bounce fill so shade stays readable, glossy surfaces (spec): a sun glint and a sheen at grazing angles
    float d = dot(n, sun), sh = recv > .5 ? sunShadow(vW, n) : 0., lit = smoothstep(-.15, .45, d) * (1. - sh);
    vec3 base = c, vd = normalize(cameraPosition - vW);
    vec3 amb = shdC * (.72 + .16 * (n.y * .5 + .5));
    vec3 lightL = amb + sunC * lit * .78;
    if (toon > .5) {
      float lt = smoothstep(-.02, .22, d) * (1. - sh);
      vec3 shade = shdC * (.9 + .1 * (n.y * .5 + .5));
      lightL = shade + sunC * lt * sunK;
      // r5 light budget: the shade fill is ~0.6 of the colour (cool), full sun adds the rest, so a sunlit surface is
      // its own colour (x ~1), never 1.5x. AO baked in Blender only darkens the fill (contact shadows, corners) - it
      // holds no sunlight, so the sun is counted once.
      if (bakeMode > 2.5) lightL = shade * mix(1., vBake.r, aoK) + sunC * lt * sunK;
      else if (bakeMode > .5) lightL = shade * clamp(vBake * bakeK, .5, 1.35) + sunC * lt * sunK;
      if (bakeMode > .5 && bakeMode < 2.5) { float L0 = max(dot(lightL, vec3(.3, .55, .15)), 1e-3); lightL *= 1.3 * (1. - exp(-L0 * 1.05)) / L0; }   // r4 only   // r4: soft exposure on brightness only - hue kept
      lit = lt;
    }
    if (bakeMode > .5 && bakeMode < 1.5) lightL = vBake * bakeK;
    else if (bakeMode > 1.5) lightL = amb * clamp(vBake * bakeK, .22, 1.35) + sunC * lit * .78;   // baked bounce + corners shape the fill; the sun stays live
    // r8 METAL RESPONSE: polished metal (gold, brass, iron) scatters little diffuse light - its colour comes from a darker
    // body plus a crisp highlight. Without this, gold strips near a lamp took full diffuse sun + lamp light and
    // read as glowing yellow bars.
    metK = toon > .5 ? 1. - .42 * smoothstep(.25, .5, spec) : 1.;
    c = base * lightL * metK;
    // a glossy coat on everything: the room reflected at grazing angles (warm floor below, bright walls, the ceiling, the
    // sun's glow), a sun glint, glints of the lamps
    if (toon > .5) {                    // a crisp painted highlight on metal, glaze and glass; nothing on wood or cloth
      float hl = smoothstep(.88, .93, dot(reflect(-sun, n), vd)) * lit + .55 * smoothstep(.9, .95, dot(reflect(-normalize(lp[0].xyz - vW), n), vd)) * step(.01, lp[0].w);
      c += mix(vec3(1., .96, .88), base * 1.5, .65) * hl * smoothstep(.25, .5, spec) * .55;   // r8: metal highlights carry the metal's own colour (gold reads gold, not white)
      spec = 0.;
    }
    vec3 rd = reflect(-vd, n), env = mix(vec3(.6, .44, .3), vec3(1., .93, .82), smoothstep(-.35, .05, rd.y));
    env = mix(env, vec3(.5, .7, .76), smoothstep(.3, .9, rd.y)) + sunC * .5 * pow(max(dot(rd, sun), 0.), 5.);
    float fr = .06 + .94 * pow(1. - max(dot(n, vd), 0.), 3.);
    c = mix(c, c * .55 + env * .65, clamp(spec * fr * 1.1, 0., .65));
    c += env * spec * .12 * smoothstep(.55, 1., 1. - max(dot(n, vd), 0.));      // a bright sheen along rounded edges
    c += sunC * spec * lit * pow(max(dot(reflect(-sun, n), vd), 0.), 26.) * .9;
    float pol = polish * smoothstep(.2, .5, spec) * (1. - step(.001, mirror));
    if (pol > 0.) {   // POLISH: lacquered furniture - a clear reflection even seen head-on, the window and lamps mirrored in it, hot glints
      vec2 rh = normalize(rd.xz + 1e-4), shh = normalize(sun.xz + 1e-4);
      float win = smoothstep(.82, .96, dot(rh, shh)) * smoothstep(-.15, .1, rd.y) * smoothstep(.55, .25, rd.y), lamp = smoothstep(.86, .97, rd.y);
      vec3 env2 = mix(vec3(.22, .14, .09), env * 1.05, smoothstep(-.3, .08, rd.y)) + vec3(1., .97, .9) * (win * 1.4 + lamp * .7);   // dark floor below, bright room above: contrast like lacquer
      c = mix(c, c * .5 + env2 * .62, clamp(pol * (.3 + .6 * fr), 0., .8));
      // glossy light streaks across the surfaces; the 14th power by multiplying - pow() of values near 0 gave single black
      // pixels on graphics chips (Intel), dotted lines along the streaks' troughs
      float bx = .5 + .5 * sin(dot(vW, vec3(2.2, 3.1, 1.4)) * 2.), b2 = bx * bx, b4 = b2 * b2, band = b4 * b4 * b4 * b2;
      c += vec3(1., .98, .92) * pol * band * .24 * (.4 + .6 * lit + .3);
      c += sunC * pol * lit * pow(max(dot(reflect(-sun, n), vd), 0.), 120.) * 1.4;
      c += vec3(1.) * pol * .1 * smoothstep(.75, 1., 1. - max(dot(n, vd), 0.));
    }    vec3 add = vec3(0.);
    for (int i = 0; i < 6; i++) { vec3 tl = lp[i].xyz - vW; float dd = length(tl); vec3 tn = tl / max(dd, 1e-3);
      add += lc[i] * lp[i].w * exp(-dd * (lfo[i] > 0. ? lfo[i] : mix(1.4, .95, toon))) * (.3 + .7 * max(dot(n, tn), 0.)) * mix(1., 1.25, toon);
      c += lc[i] * lp[i].w * spec * pow(max(dot(reflect(-tn, n), vd), 0.), 40.) * exp(-dd * .5) * .9;
      c += lc[i] * lp[i].w * pol * pow(max(dot(reflect(-tn, n), vd), 0.), 220.) * exp(-dd * .4) * 2.5; }   // polish: sharp lamp glints
    c += base * add;
    if (mirror > 0.) {                   // a mirror-polished floor: the room above, reflected (a pass from below the floor)
      vec4 rp = reflM * vec4(vW, 1.); vec2 ru = rp.xy / rp.w;
      vec4 rt = vec4(0.); for (int i = 0; i < 12; i++) { float a = float(i) * 2.39996; rt += texture2D(refl, ru + vec2(cos(a) * .014, sin(a) * .022) * (.3 + .7 * fract(float(i) * .618 + .3))); }
      rt /= 12.; c = mix(c, rt.rgb * 1.08, mirror * (.3 + .5 * pow(1. - max(dot(n, vd), 0.), 2.)) * rt.a); }
    ink *= .5;
  } else if (emi < .5) {
    float d = dot(n, sun), tone = d > .3 ? 1. : (d > -.15 ? .8 : .64);
    bool inside = inRoom(vW);
    if (inside) tone = mix(tone, .88, .45);
    else if (recv > .5 && tone > .7) tone = mix(tone, .68, sunShadow(vW, n));
    vec3 base = c;
    // indoors the light is the room's own (fire, candles) whatever the time of day; outdoors it is the sun or moon
    c *= tone * (inside ? (tone > .9 ? vec3(1.) : vec3(.93, .95, 1.07)) : (tone > .9 ? sunC : shdC));
    if (tone < .7) ink = max(ink, seam((p.x + p.y) * 2.2, 1.) * .28 * dt * hatch);   // hatching in the deepest shade (off in the vivid look)
    if (inside) c *= vec3(.8, .73, .66);
    if (vW.y < -.02) c *= mix(1., .4, clamp(-vW.y / 1.3, 0., 1.));          // down in a hole it gets dark
    // light from things in the scene (fire, lanterns, candles, lava): warm pools that fall off with distance
    vec3 add = vec3(0.);
    for (int i = 0; i < 6; i++) { vec3 tl = lp[i].xyz - vW; float dd = length(tl);
      add += lc[i] * lp[i].w * exp(-dd * 1.25) * (.35 + .65 * max(dot(n, tl / max(dd, 1e-3)), 0.)); }
    if (toon > .5) { float La = max(dot(add, vec3(.3, .55, .15)), 1e-3); add *= 1. / (1. + La * .9); }          // r4: a lamp's pool rolls off softly instead of burning to white next to it
    c += base * add * metK * (bakeMode > .5 && bakeMode < 1.5 ? 0. : 1.);
    if (hiCap > 0.) c = min(c, base * hiCap);   // r9: long flat gilt trim in direct sun: lit + highlight never past hiCap x its own colour
    if (toon > .5 && bakeMode > .5 && bakeMode < 2.5) { float Lc = max(dot(c, vec3(.3, .55, .15)), 1e-3); if (Lc > .8) c *= (.8 + (Lc - .8) / (1. + (Lc - .8) * 2.5)) / Lc; }   // r4 only   // r4: highlights roll off, hue kept
  }
  // pattern lines: black ink in the ink look; in the vivid look a darker shade of the surface's own colour, lighter
  c = mix(c, mix(vec3(.13, .1, .12), c * .58, soft), ink * mix(1., .75, soft));
  c = mix(c, fogC, smoothstep(fogR.x, fogR.y, distance(cameraPosition, vW)));
  gl_FragColor = vec4(c, alpha);
}`;
const INK_VERT = `varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vBake;
void main(){ vUv = uv;
#ifdef USE_COLOR
 vBake = mix(vec3(dot(color.rgb, vec3(.3, .55, .15))), color.rgb, .35);   // keep the bounce's brightness, little of its colour (bake noise was blotchy green)
#else
 vBake = vec3(1.);
#endif
 vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
// the finishing pass: ink outlines where the shapes' direction or distance jumps, a wobbly hand-drawn line of varying
// weight (thinner far away), the sky (stars and moon at night), paper grain
const POST_FRAG = `
varying vec2 vUv;
uniform sampler2D tCol, tN, tD; uniform vec2 px; uniform float near, far, res; uniform mat4 projInv, camW;
uniform vec3 skyTop, skyBot, inkC, moon; uniform float stars;
uniform vec3 sunDir, sunCol; uniform float ao, dof, focus, ppu, glow, gsat, gcon, clean, outl, outW, vig;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float lin(float d){ float z = d * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
void main(){
  vec2 uv = vUv;
  vec4 pv = projInv * vec4(uv * 2. - 1., 1., 1.); pv /= pv.w; vec3 vdir = normalize((camW * vec4(pv.xyz, 0.)).xyz);
  float sunA = max(dot(vdir, normalize(sunDir)), 0.);
  vec2 wob = (vec2(noise(uv * vec2(7., 12.)), noise(uv * vec2(7., 12.) + 7.3)) - .5) * px * 3. * res;
  vec3 c = texture2D(tCol, uv).rgb;
  float d0 = texture2D(tD, uv).x;
  if (texture2D(tCol, uv).a < .5) {
    vec4 v = projInv * vec4(uv * 2. - 1., 1., 1.); v /= v.w;
    vec3 dir = normalize((camW * vec4(v.xyz, 0.)).xyz);
    c = mix(skyBot, skyTop, smoothstep(-.02, .45, dir.y));
    if (stars > 0. && dir.y > 0.) {
      vec2 sp = dir.xz / (dir.y + .35) * 70.; vec2 cell = floor(sp), f = fract(sp) - .5;
      float st = step(.985, hash(cell)) * (1. - smoothstep(.04, .12, length(f))) * smoothstep(.0, .2, dir.y);
      c = mix(c, vec3(1., .97, .85), st * stars);
      float m = dot(dir, normalize(moon));
      c = mix(c, vec3(.98, .95, .8), smoothstep(.99935, .9995, m) * stars);
      c = mix(c, inkC, (smoothstep(.99925, .99935, m) - smoothstep(.99935, .99945, m)) * stars * .8);
    }
  }
  bool skyPx = texture2D(tCol, uv).a < .5;
  float zc = lin(d0);
  if (!skyPx && dof > 0.) {             // background blur: things far behind what the camera looks at go soft
    float coc = dof * res * clamp((zc - focus) / (focus * 1.6), 0., 1.);
    if (coc > .6) {
      vec3 acc = c; float wsum = 1.;
      for (int i = 0; i < 16; i++) { float a = float(i) * 2.39996, rr = sqrt((float(i) + .5) / 16.) * coc;
        vec2 o = vec2(cos(a), sin(a)) * rr * px; vec4 sm = texture2D(tCol, uv + o);
        if (sm.a > .5) { acc += sm.rgb; wsum += 1.; } }
      c = acc / wsum;
    }
  }
  if (!skyPx && ao > 0.) {              // corner shading: darker where surfaces crowd in (under ledges, at the foot of walls)
    // pairs of samples either side: on a flat surface 1/depth changes evenly, so only a real hollow (a corner, the foot of
    // a wall, the gap under a ledge) makes both neighbours closer than the middle - flat ground stays clean
    float rpx = clamp(.55 * (1. + .25 * clean) * ppu / zc, 3., 80.) * res, occ = 0., w0c = 1. / zc;
    // a fixed pattern (no random turn per pixel - that left black speckles all over the corners), 12 pairs, soft
    for (int i = 0; i < 16; i++) { float a = float(i) * 2.39996, rr = rpx * mix(.6, .3, clean) * sqrt((float(i) + .5) / 16.);
      vec2 o = vec2(cos(a), sin(a)) * rr * px;
      float zA = lin(texture2D(tD, uv + o).x), zB = lin(texture2D(tD, uv - o).x);
      float hol = ((1. / zA + 1. / zB) * .5 - w0c) / w0c;
      occ += smoothstep(.01, .12, hol) * (1. - smoothstep(.5, 1.2, abs(zc - min(zA, zB)))); }
    c *= 1. - ao * .5 * occ / 16.;
  }
  if (glow > 0.) {                      // sun glow: a bright halo in the sky round the sun, and warm haze toward it
    c += sunCol * glow * (skyPx ? .55 * pow(sunA, 40.) + .9 * smoothstep(.9992, .9997, sunA) : .08 * pow(sunA, 8.));
    if (!skyPx) c = mix(c, skyBot, smoothstep(35., 170., zc) * .18 * glow);
  }
  vec2 q0 = uv + wob;
  float z0 = lin(texture2D(tD, q0).x), w0 = 1. / z0;
  float wgt = mix(.8, 1.9, noise(uv * vec2(11., 19.))) * clamp(4. / z0, .5, 1.) * res;
  vec3 n0 = texture2D(tN, q0).rgb;
  float e = 0.;
  for (int k = 0; k < 2; k++) {
    vec2 o = (k == 0 ? vec2(px.x, 0.) : vec2(0., px.y)) * wgt;
    vec3 na = texture2D(tN, q0 + o).rgb, nb = texture2D(tN, q0 - o).rgb;
    float wa = 1. / lin(texture2D(tD, q0 + o).x), wb = 1. / lin(texture2D(tD, q0 - o).x);
    e = max(e, smoothstep(.25, .45, max(length(na - n0), length(nb - n0))));
    // flat surfaces change 1/depth evenly across the screen, so only a real step (an edge in front of something) shows
    e = max(e, smoothstep(.04, .09, abs(wa + wb - 2. * w0) / w0));
  }
  e *= 1. - .55 * smoothstep(20., 60., z0);
  if (dof > 0.) e *= 1. - .75 * clamp((z0 - focus) / (focus * 1.6), 0., 1.);    // blurred background keeps only faint lines
  c = mix(c, inkC, e * (1. - clean));
  if (clean > .5 && outl > 0.) {
    // OUTLINE (POC r4). Width is in FINAL frame pixels (res = quality x supersampling), so a line is the same thickness
    // near or far. 8 samples on a ring: a silhouette pixel is one whose neighbour lies clearly BEHIND it (only the nearer
    // shape gets the line); a crease pixel is one where the surface turns sharply (thinner line). The line is a dark
    // version of the surface's own colour, like the references (navy on a blue bowl, brown on wood), never pure black.
    float sil = 0., cr = 0., zme = zc; vec3 n0 = texture2D(tN, uv).rgb * 2. - 1.;
    for (int k = 0; k < 8; k++) {
      float a = float(k) * .785398; vec2 dir = vec2(cos(a), sin(a));
      vec2 o = dir * px * res * outW; float zn = lin(texture2D(tD, uv + o).x);
      sil = max(sil, smoothstep(.015, .045, (zn - zme) / zme));
      if (texture2D(tCol, uv + o).a < .5) sil = 1.;
      vec3 nn = texture2D(tN, uv + dir * px * res * outW * .55).rgb * 2. - 1.;
      cr = max(cr, smoothstep(.55, .8, 1. - dot(normalize(nn), normalize(n0))));
    }
    sil *= 1. - .5 * smoothstep(8., 25., zme);
    vec3 oc = mix(vec3(.07, .045, .08), c * vec3(.36, .3, .38), .45);     // a deep plum-brown, tinted by the object's own colour
    c = mix(c, oc, clamp(max(sil, cr * .7), 0., 1.) * min(outl, 1.)); if (outl > 5.) c = vec3(sil, cr, 0.);
  }
  if (clean > .5 && !skyPx) {           // clean: a soft glow round everything bright (sun patches, bulbs, the window) - the polished render feel
    vec3 bl = vec3(0.); for (int i = 0; i < 20; i++) { float a = float(i) * 2.39996, rr = (5. + 22. * fract(float(i) * .618 + .1)) * res;
      vec3 s = texture2D(tCol, uv + vec2(cos(a), sin(a)) * rr * px).rgb; bl += max(s - .9, 0.); }
    c += bl / 20. * 1.1;
  }
  if (clean < .5) c *= .955 + .045 * noise(gl_FragCoord.xy * .6) + .02 * noise(gl_FragCoord.xy * .05);
  { float lu = dot(c, vec3(.2126, .7152, .0722)); c = mix(vec3(lu), c, gsat); c = (c - .5) * gcon + .5; }
  c *= 1. - vig * pow(clamp(length((uv - .5) * vec2(1., 1.25)) * 1.25, 0., 1.), 2.2);   // r5: darker surroundings, the focus stays bright   // the look's grade
  gl_FragColor = vec4(c, 1.);
}`;
const CARD_FRAG = `varying vec2 vUv; uniform sampler2D map; uniform vec3 tint;
void main(){ vec4 t = texture2D(map, vUv); if (t.a < .02) discard; gl_FragColor = vec4(t.rgb * tint, t.a); }`;
// a painted backdrop far behind the set (a Flow picture of mountains, a skyline, the sea): unlit, fading into the haze
const BACK_FRAG = `varying vec2 vUv; uniform sampler2D map; uniform vec3 fogC; uniform float haze;
void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(mix(t.rgb, fogC, haze), 1.); }`;
const UV_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SET_TIMES = {
  day: { sun: [-.55, .75, .45], sunC: [1, 1, 1], shdC: [.93, .95, 1.07], top: '#79b4e0', bot: '#e6efe2', fog: '#dfe9e0', stars: 0, card: [1, 1, 1] },
  sunset: { sun: [-.85, .3, .42], sunC: [1.1, .9, .7], shdC: [.7, .64, .88], top: '#5d6db0', bot: '#f5ad72', fog: '#e9ae86', stars: 0, card: [1.02, .88, .76], rim: 'rgba(255,170,110,.95)', rimSoft: 'rgba(255,150,90,.6)' },
  night: { sun: [-.4, .8, .3], sunC: [.4, .48, .74], shdC: [.24, .27, .47], top: '#0c1430', bot: '#2c3b68', fog: '#1d2749', stars: 1, card: [.5, .56, .78], rim: 'rgba(150,180,255,.6)', rimSoft: 'rgba(140,170,255,.45)' },
  // a vivid anime-style day: deep blue sky, warm saturated sunlight, lilac shadows
  // the canyon look's day (user's choice, from the railroad reference): strong warm sun, cool blue shade, deep blue sky
  canyon: { sun: [-.62, .55, .55], sunC: [1.18, 1.02, .82], shdC: [.6, .66, .92], top: '#1d5cc4', bot: '#b2cdee', fog: '#c6d6ee', stars: 0, card: [1.02, .99, .95] },
  // the clean look's sunny interior: a low warm sun through the windows, a light cool fill
  // the clean look outdoors: a warm afternoon sun, a cool sky fill in the shade
  sunny: { sun: [-.5, .62, .55], sunC: [.8, .74, .62], shdC: [.64, .69, .84], top: '#3f8ee8', bot: '#c6e2f8', fog: '#d4e6f6', stars: 0, card: [1, 1, 1] },
  interior: { sun: [-.8, .38, -.32], sunC: [1.35, 1.1, .78], shdC: [.97, .91, .85], top: '#5aa0e8', bot: '#cfe6f6', fog: '#dfeaf2', stars: 0, card: [1, 1, 1] },
  bright: { sun: [-.6, .62, .48], sunC: [1.1, 1.03, .9], shdC: [.8, .78, 1.04], top: '#2a72dc', bot: '#bcd8f4', fog: '#cfe0f4', stars: 0, card: [1, 1, 1] },
};

function set3d(o = {}) {
  const scene = new THREE.Scene();
  const S = { scene, cards: [], ticks: [], mats: new Map(), lights: [], rooms: [], holes: [] };
  let R = null;                                              // the renderer and its targets, made on the first frame
  const v4s = () => [0, 1, 2, 3].map(() => new THREE.Vector4(1e3, -1e3, 1e3, -1e3));
  const U = {
    sun: { value: new THREE.Vector3(...SET_TIMES.day.sun).normalize() }, time: { value: 0 },
    rooms: { value: v4s() }, roomH: { value: [0, 0, 0, 0] },
    lp: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -100, 0, 0)) }, lc: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Color(0, 0, 0)) }, lfo: { value: [0, 0, 0, 0, 0, 0] },
    sunC: { value: new THREE.Vector3(1, 1, 1) }, shdC: { value: new THREE.Vector3(.93, .95, 1.07) }, hatch: { value: o.look === 'ink' ? 1 : 0 }, soft: { value: o.look === 'ink' ? 0 : 1 },
    fogC: { value: new THREE.Color(SET_TIMES.day.fog) }, fogR: { value: new THREE.Vector2(...(o.fogRange || [20, 160])) }, vary: { value: 1 },
    shM: { value: new THREE.Matrix4() }, shD: { value: null }, shPx: { value: 1 / 4096 }, clean: { value: o.look === 'clean' ? 1 : 0 }, polish: { value: o.polish ?? (o.look === 'clean' ? 1 : 0) }, refl: { value: null }, reflM: { value: new THREE.Matrix4() },
  };
  S.U = U;
  // a material: col + { pat: name, sc: pattern size (board width, stone height...), col2, axis: 1 turns the pattern,
  // emi: 1 = glows (fire, a lit window: no shading), recv: 0 = takes no shadow, side: 'double' }
  S.mat = (col, m = {}) => {
    const key = col + JSON.stringify(m, (k, v) => (k === 'map' || k === 'arm') ? (v && v.uuid) : v); if (S.mats.has(key)) return S.mats.get(key);
    const mt = new THREE.ShaderMaterial({ vertexShader: INK_VERT, fragmentShader: INK_FRAG, extensions: { derivatives: true },
      side: m.side === 'double' ? THREE.DoubleSide : m.side === 'back' ? THREE.BackSide : THREE.FrontSide,
      uniforms: { ...U, col: { value: new THREE.Color(col) }, col2: { value: new THREE.Color(m.col2 || col) }, pat: { value: PAT[m.pat] || 0 },
        sc: { value: m.sc || 1 }, emi: { value: m.emi || 0 }, axis: { value: m.axis || 0 }, recv: { value: m.recv ?? 1 },
        specU: { value: m.spec ?? (S.look === 'clean' ? .35 : 0) }, mirror: { value: m.mirror || 0 },
        map: { value: m.map || null }, useMap: { value: m.map ? (m.world ? 2 : 1) : 0 }, mapSc: { value: new THREE.Vector2(...(m.mapSc || [1, 1])) },
        arm: { value: m.arm || null }, useArm: { value: m.arm ? 1 : 0 }, bakeMode: { value: m.bake || 0 }, bakeK: { value: m.bakeK ?? 1 }, alpha: { value: m.alpha ?? 1 }, toon: { value: m.toon ?? (S.fx.toon || 0) }, mipB: { value: m.mipB ?? 0 }, gain: { value: m.gain ?? 1 }, sunK: { value: m.sunK ?? (S.fx.sunK ?? .75) }, aoK: { value: m.aoK ?? (S.fx.aoK ?? .85) }, hiCap: { value: m.hiCap ?? 0 } },
      vertexColors: !!m.bake, transparent: (m.alpha ?? 1) < 1, depthWrite: (m.alpha ?? 1) >= 1 });
    mt.userData.spec = [col, m]; S.mats.set(key, mt); return mt;
  };
  // the same material with its pattern turned the other way (roofs and boards on a building turned a quarter)
  S.turned = mt => { const [col, m] = mt.userData.spec; return S.mat(col, { ...m, axis: 1 - (m.axis || 0) }); };
  const put = (geo, mat, pos, rot, parent = scene) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (rot) m.rotation.set(...rot); parent.add(m); return m;
  };
  // parts (positions are the bottom centre unless said otherwise; parent = a group to build inside)
  S.mesh = put;
  S.box = (w, h, d, [x, y, z], mat, rot, parent) => put(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mat, [x, y, z], rot, parent);
  S.boxAt = (x0, x1, y0, y1, z0, z1, mat, parent) => S.box(x1 - x0, y1 - y0, z1 - z0, [(x0 + x1) / 2, y0, (z0 + z1) / 2], mat, null, parent);
  S.cyl = (rt, rb, h, [x, y, z], mat, rot, seg = 20, parent, open = false) => put(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open).translate(0, h / 2, 0), mat, [x, y, z], rot, parent);
  S.ball = (r, [x, y, z], mat, s = [1, 1, 1], parent) => { const m = put(new THREE.SphereGeometry(r, 24, 16), mat, [x, y, z], null, parent); m.scale.set(...s); return m; };
  S.cone = (r, h, [x, y, z], mat, seg = 16, parent) => put(new THREE.ConeGeometry(r, h, seg).translate(0, h / 2, 0), mat, [x, y, z], null, parent);
  // a turned shape (bell, pot, vase, bowl): profile [[radius, height], ...] from the bottom up
  S.lathe = (prof, [x, y, z], mat, seg = 32, parent) => put(new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg), mat, [x, y, z], null, parent);
  // an upright triangle (a gable end) in a parent's frame: base from a to b (along x) at height y0, peak y1, thickness d along z
  S.tri = (a, b, y0, y1, d, mat, [x, z] = [0, 0], rotY = 0, parent) => {
    const sh = new THREE.Shape([new THREE.Vector2(a, y0), new THREE.Vector2(b, y0), new THREE.Vector2((a + b) / 2, y1)]);
    return put(new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2), mat, [x, 0, z], [0, rotY, 0], parent);
  };
  // POC: S.gltf(url, [x, y, z], { rot, s, spec }) -> promise of the model's group (all its parts use the set material)
  window.PRELOAD = window.PRELOAD || [];
  S.gltf = (url, pos, o = {}) => { const pr = new Promise((res, rej) => new GLTFLoader().load(url, gl => {
      const gr = gl.scene; gr.position.set(...pos); gr.rotation.y = o.rot || 0; gr.scale.setScalar(o.s || 1);
      gr.traverse(m => { if (!m.isMesh) return; const src = m.material, tex = src.map || null;
        if (tex) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = ''; tex.needsUpdate = true; }
        const c = src.color ? '#' + src.color.getHexString() : '#ffffff';
        m.material = S.mat(tex ? '#ffffff' : c, { map: tex, spec: o.spec ?? 0, side: 'double' }); });
      scene.add(gr); res(gr); }, null, rej)); PRELOAD.push(pr); return pr; };
  S.group = (pos = [0, 0, 0], rotY = 0, parent = scene) => { const gr = new THREE.Group(); gr.position.set(...pos); gr.rotation.y = rotY; parent.add(gr); return gr; };
  S.tick = fn => S.ticks.push(fn);
  // the inside of a building (up to 4): dim and warm, lit by its own fire and candles whatever the time of day
  S.room = (x0, x1, z0, z1, h) => {
    const i = S.rooms.length; if (i > 3) throw new Error('set3d: at most 4 rooms');
    U.rooms.value[i].set(x0 - .02, x1 + .02, z0 - .02, z1 + .02); U.roomH.value[i] = h; S.rooms.push([x0, x1, z0, z1, h]);
  };
  const inRoomJS = (x, z) => S.rooms.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
  // a light from something in the scene (up to 4): { pos, k } - k may be a function of t (flicker)
  // r9: fall = how fast the light dies with distance (0 = default; ~2.4 for a candle-sized flame, ~0.9 for a chandelier)
  S.light = (pos, col = '#ff9a40', k = 1, fall = 0) => {
    if (S.lights.length > 5) throw new Error('set3d: at most 6 lights (POC r7)');
    const L = { pos, col: new THREE.Color(col), k, fall }; S.lights.push(L); return L;
  };
  // time of day: the sun (or moon), how lit and shaded sides are tinted, sky, haze, stars, how the cards are tinted
  S.T = SET_TIMES.day;
  S.time = name => {
    if (S.look === 'vivid' && name === 'day') name = 'bright';           // the vivid look's day is the bright anime day
    if (S.look === 'canyon' && name === 'day') name = 'canyon';          // the canyon look's day: warm sun, blue shade
    const T = SET_TIMES[name]; S.T = T;
    U.sun.value.set(...T.sun).normalize(); U.sunC.value.set(...T.sunC); U.shdC.value.set(...T.shdC); U.fogC.value.set(T.fog);
    if (R) { const pu = R.post.uniforms; pu.skyTop.value.set(T.top); pu.skyBot.value.set(T.bot); pu.stars.value = T.stars; }
  };
  // the look: 'vivid' (the default, user's choice: saturated anime colours, glossy metal, lilac shade, painted surfaces,
  // soft clouds) or 'ink' (the first look: muted, hatched shade, black pattern lines)
  S.look = o.look || 'canyon';
  // finishing touches (v0.9): surface variety, corner shading, background blur (dof = px at 1080 for what is far behind the
  // point the camera looks at; 0 = off, e.g. wide establishing shots), sun glow and haze, and the look's grade
  S.fx = Object.assign({ vary: 1, ao: 1, dof: 7, glow: 1 }, S.look === 'clean' ? { vary: 0, ao: 1.5, dof: 0, glow: 0, sat: 1.12, con: 1.08 } : S.look === 'canyon' ? { sat: 1.1, con: 1.1 } : S.look === 'vivid' ? { sat: 1.08, con: 1.05 } : { vary: 0, ao: 0, dof: 0, glow: 0 }, o.fx || {});
  U.vary.value = S.fx.vary;
  if (o.time) S.time(o.time); else if (S.look === 'vivid') S.time('bright'); else if (S.look === 'canyon') S.time('canyon');
  // the area the sun's shadows cover (centre [x, z] and size): bigger = blurrier shadows
  S.shadowArea = (c = [0, 0], size = 30) => { S.shC = c; S.shS = size; };
  S.shadowArea(o.shadowCenter, o.shadowSize);
  S.house = () => {};                                        // (old cottage-only shadow; real shadows now)
  // the ground: a flat sheet with holes cut where pits are (S.hole), built on the first frame
  S.ground = (mat, size = 240) => { S.groundSpec = { mat, size }; };
  S.hole = (x, z, r) => S.holes.push({ x, z, r });
  // raised floors (pavements, platforms): S.floors.push({ x0, x1, z0, z1, y }); people standing or walking there are
  // lifted onto them (their feet were sinking into the pavement), props can use S.floorY(x, z)
  S.floors = [];
  S.floorY = (x, z) => S.floors.reduce((y, f) => x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1 ? Math.max(y, f.y) : y, 0);
  const buildGround = () => {
    if (!S.groundSpec || S.groundBuilt) return; S.groundBuilt = true;
    const h = S.groundSpec.size / 2, sh = new THREE.Shape([new THREE.Vector2(-h, -h), new THREE.Vector2(h, -h), new THREE.Vector2(h, h), new THREE.Vector2(-h, h)]);
    for (const o2 of S.holes) { const p = new THREE.Path(); p.absarc(o2.x, -o2.z, o2.r, 0, Math.PI * 2, true); sh.holes.push(p); }
    const geo = new THREE.ShapeGeometry(sh, 48).rotateX(-Math.PI / 2);
    put(geo, S.groundSpec.mat, [0, 0, 0]);
  };
  // ---- cards: 2D drawings standing in the set (our characters, Flow cut-outs), redrawn every frame ----
  // draw(ctx-is-g, cw, ch, ppu) draws with its feet at (cw/2, ch - FOOT); w, h = the card's size in person heights
  const FOOT = 40;
  S.card2d = (draw, at, opt = {}) => {
    const w = opt.w || 1, h = opt.h || 1.25, ppu = Math.min(1024, 2048 / Math.max(w, h)), cw = Math.round(w * ppu), ch = Math.round(h * ppu);
    const cv2 = document.createElement('canvas'); cv2.width = cw; cv2.height = ch;
    const tex = new THREE.CanvasTexture(cv2); tex.minFilter = THREE.LinearMipmapLinearFilter;
    const mat = new THREE.ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: CARD_FRAG, transparent: true, depthWrite: false,
      uniforms: { map: { value: tex }, tint: { value: new THREE.Vector3(1, 1, 1) } } });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), mat); mesh.layers.set(1); scene.add(mesh);
    const blob = new THREE.Mesh(new THREE.CircleGeometry(.26 * (opt.shadowW || 1), 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x1a140e, transparent: true, opacity: .3, depthWrite: false }));
    blob.scale.set(1.2, 1, .8); blob.layers.set(2); scene.add(blob);
    const k = { draw, at, opt, cv: cv2, tex, mesh, blob, cw, ch, ppu, drawn: false }; S.cards.push(k); return k;
  };
  // a character: face = the way they face in the set (radians, 0 = towards +z; may be a function of t); when the camera
  // is behind them the card draws their back (placedBack) with a quick squash at the side like a cartoon turn;
  // seat = height of what they sit on (a sitDown pose); y = floor height (a stage, an upper floor)
  // walk: a WALK.route - the card then follows it: position, height, facing, and which way they face on screen
  // (turnX), so a walker crossing the screen faces the way they go and one walking away shows their back
  S.person = (c, P, at, opt = {}) => {
    const wk = opt.walk;
    if (wk) opt = { at: t => wk.at(t), y: t => wk.y(t), face: t => wk.face(t), ...opt };
    let f = 1;                                                 // which way a walker faces on screen (+1 right)
    return S.card2d((cw, ch, ppu, side, cam) => {
      const st = valAt(opt.seat, TNOW), kk = ppu * (c.size || 1) * (opt.size || 1) / CHAR_H, hipUp = st != null ? st * ppu : legOf(c) * kk;
      let PP = P;
      let X = cw / 2;
      if (wk) {                                                // walkers: no squash; face the way they travel
        const v = wk.vel(TNOW), e = cam.matrixWorld.elements, sx = v[0] * e[0] + v[1] * e[2];
        if (Math.abs(sx) > .08) f = Math.sign(sx);
        // the walk across the screen feeds the jelly spring (heads and bodies lag, sway past a stop): the route's recent
        // path seen along the camera's right, in the character's own facing (front or back view)
        const A0 = wk.at(TNOW), sg = f * (opt.flip ? -1 : 1);
        X = s => { const a = wk.at(s); return cw / 2 + sg * ((a[0] - A0[0]) * e[0] + (a[1] - A0[1]) * e[2]) * ppu; };
        // turned towards where they go in proportion to how much they cross the screen (none walking at or away from us)
        const kT = Math.min(1, Math.abs(sx) / (Math.hypot(v[0], v[1]) || 1));
        PP = t => { const p = valAt(P, t); return { ...p, turnX: (p.turnX ?? 1) * (side < 0 ? -f : f), turn: (p.turn || 0) * kT }; };
      } else {
        // people standing still: the front (looking the way their pose looks) until the camera is clearly behind them
        // (side < -.35, more than ~110 degrees round); a quick squash only while crossing over
        const sq = Math.min(1, Math.max(.12, Math.abs(side + .35) * 9));
        if (sq < 1) PP = t => { const p = valAt(P, t); return { ...p, turnX: (p.turnX ?? 1) * sq }; };
        side += .35;
      }
      // POC r3: opt.clip() -> [x, y, rx, ry, rot] in card pixels draws only that ellipse of the character (the hand that
      // holds a prop, drawn again on a card in front of the prop so the fingers close over it)
      const cl = opt.clip && opt.clip(); if (opt.clip && !cl) return;
      if (cl) { g.save(); g.beginPath(); g.ellipse(cl[0], cl[1], cl[2], cl[3] || cl[2], cl[4] || 0, 0, 7); g.clip(); }
      (side < 0 ? placedBack : placed)(c, PP, X, ch - FOOT - hipUp, kk, opt.flip);
      if (opt.after) opt.after(g, kk);
      if (cl) g.restore();
    }, opt.at || at, { w: 1, h: 1.25, ...opt, person: true });
  };
  // a Flow cut-out (sprite) standing in the set, h person heights tall, w wide enough for it; static ones drawn once
  // opt.y = the top of what it stands on (a table: desk.userData.top); opt.show = when it is on screen: a word that
  // brings it into the story ('cup'), [from, to] in words or seconds, so a prop never appears before it is mentioned
  S.sprite = (name, at, h, opt = {}) => { const k = S.card2d((cw, ch, ppu) => drawSprite(name, cw / 2, ch - FOOT, { ...opt, h: h * ppu }), at,
    { w: opt.w || h * 1.2, h: h * 1.12 + .08, static: !opt.frame, ...opt }); k.spriteName = name; return k; };
  // PROP CHECK (printed by render.mjs): painted props floating in the air, or the same prop twice on screen
  const PROP_SEEN = new Set(), propLog = (t, text, why) => { const key = text + why; if (PROP_SEEN.has(key)) return; PROP_SEEN.add(key);
    (window.PROP_LOG = window.PROP_LOG || []).push({ t: +t.toFixed(2), text, why }); };
  const showT = v => typeof v === 'string' ? (typeof atWord === 'function' ? atWord(v) : 0) : v;
  const shownAt = (k, t) => { const s = k.opt.show; if (s == null) return true;
    const [a, b] = Array.isArray(s) ? s : [s, Infinity]; return t >= showT(a) && t < showT(b ?? Infinity); };
  const ray = new THREE.Raycaster(); ray.layers.set(0);
  // a painted backdrop: a Flow picture hung far behind the set on a wide curved sheet (mountains, a skyline, the sea)
  // (built on the first frame, once the pictures in SCENE.plates have loaded)
  S.backdrops = [];
  S.backdrop = (plate, o2 = {}) => S.backdrops.push([plate, o2]);
  const buildBackdrop = (plate, { dist = 70, width = 2.2, height = 26, y = -2, haze = .25, at = 0 } = {}) => {
    const img = PLATES[plate]; if (!img) throw new Error(`set3d backdrop: no picture '${plate}' in SCENE.plates`);
    const tex = new THREE.Texture(img); tex.needsUpdate = true;
    const geo = new THREE.CylinderGeometry(dist, dist, height, 48, 1, true, Math.PI - width / 2 + at, width).translate(0, height / 2, 0);
    const mat = new THREE.ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: BACK_FRAG, side: THREE.BackSide, depthWrite: true,
      uniforms: { map: { value: tex }, fogC: U.fogC, haze: { value: haze } } });
    return put(geo, mat, [0, y, 0]);
  };
  const init = () => {
    if (R) return R;
    buildGround(); for (const [p, o2] of S.backdrops) buildBackdrop(p, o2);
    // SS: the set is drawn this many times bigger and shrunk into the frame - straight clean edges on thin parts (window
    // frames, blinds, rails) instead of jagged steps; the clean look uses 2
    const SS = S.ss = o.ss ?? (S.look === 'clean' ? 2 : 1);
    const c = document.createElement('canvas'); c.width = cv.width * SS; c.height = cv.height * SS;
    const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, preserveDrawingBuffer: true });
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.setPixelRatio(1); r.setSize(c.width, c.height, false); r.autoClear = false;
    const rtCol = new THREE.WebGLRenderTarget(c.width, c.height, { samples: 4 });
    const rtN = new THREE.WebGLRenderTarget(c.width, c.height);
    rtN.depthTexture = new THREE.DepthTexture(c.width, c.height); rtN.depthTexture.type = THREE.UnsignedIntType;
    const rtR = new THREE.WebGLRenderTarget(c.width >> 1, c.height >> 1); U.refl.value = rtR.texture;   // the floor's mirror image
    S.mirrors = []; scene.traverse(m => { if (m.isMesh && m.material.uniforms && m.material.uniforms.mirror && m.material.uniforms.mirror.value > 0) S.mirrors.push(m); });
    const rtS = new THREE.WebGLRenderTarget(4096, 4096);
    rtS.depthTexture = new THREE.DepthTexture(4096, 4096); rtS.depthTexture.type = THREE.UnsignedIntType;
    U.shD.value = rtS.depthTexture;
    const cam = new THREE.PerspectiveCamera(50, W / H, .04, 400);
    const post = new THREE.ShaderMaterial({ vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: POST_FRAG, depthTest: false, depthWrite: false,
      uniforms: { tCol: { value: rtCol.texture }, tN: { value: rtN.texture }, tD: { value: rtN.depthTexture }, px: { value: new THREE.Vector2(1 / c.width, 1 / c.height) },
        near: { value: cam.near }, far: { value: cam.far }, res: { value: RES * SS }, projInv: { value: new THREE.Matrix4() }, camW: { value: new THREE.Matrix4() },
        sunDir: U.sun, sunCol: U.sunC, ao: { value: S.fx.ao }, dof: { value: S.fx.dof }, focus: { value: 5 }, ppu: { value: 1000 }, glow: { value: S.fx.glow }, gsat: { value: S.fx.sat ?? 1 }, gcon: { value: S.fx.con ?? 1 }, clean: { value: S.look === 'clean' ? 1 : 0 }, outl: { value: S.fx.outline ?? 0 }, outW: { value: S.fx.outlineW ?? 2.2 }, vig: { value: S.fx.vignette ?? 0 },
        skyTop: { value: new THREE.Color(S.T.top) }, skyBot: { value: new THREE.Color(S.T.bot) }, inkC: { value: new THREE.Color('#211a1e') },
        stars: { value: S.T.stars }, moon: { value: new THREE.Vector3(.35, .42, -1) } } });
    const postScene = new THREE.Scene(); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
    R = { r, c, rtCol, rtN, rtS, rtR, reflCam: new THREE.PerspectiveCamera(50, W / H, .04, 400), cam, post, postScene, postCam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), sunCam: new THREE.OrthographicCamera(-1, 1, 1, -1, .5, 300),
      // (double-sided: the inside of open shapes - pit walls, a well's ring - must count for outlines, sky and depth too)
      norm: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }), depth: new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }), depthD: new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }) };
    return R;
  };
  // draw the set from camera pos looking at `at` (fov = vertical degrees) into the frame
  S.render = (pos, at, fov = 50, roll) => {
    const { r, rtCol, rtN, rtS, cam, post, postScene, postCam, sunCam, norm, depth, depthD } = init();
    roll = roll ?? pos.roll ?? 0;                   // degrees, + = the frame tilts clockwise (CAM.roll, CAM.shake)
    cam.position.set(...pos); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(...at); if (roll) cam.rotateZ(-roll * Math.PI / 180); cam.updateMatrixWorld();
    U.time.value = TNOW;
    for (const fn of S.ticks) fn(TNOW);
    S.lights.forEach((L, i) => { const p = valAt(L.pos, TNOW); U.lp.value[i].set(p[0], p[1], p[2], valAt(L.k, TNOW)); U.lc.value[i].copy(L.col); U.lfo.value[i] = L.fall || 0; });
    // the characters are lit from the side the sun is on as this camera sees it (soft 3D shading, ink weight), with a
    // rim in the light's colour (orange at sunset, blue at night); the 2D settings are put back after the cards
    const e = cam.matrixWorld.elements, sv = U.sun.value, sx = sv.x * e[0] + sv.y * e[1] + sv.z * e[2];
    const keep = [LIGHT, RIM, RIM_SOFT];
    setLight(Math.atan2(-.8, Math.max(-1, Math.min(1, sx * 1.6))));
    if (S.T.rim) { RIM = S.T.rim; RIM_SOFT = S.T.rimSoft; }
    const onScreen = {};
    for (const k of S.cards) {                      // 2D drawings, drawn fresh onto their cards
      const vis = shownAt(k, TNOW); k.mesh.visible = vis; k.blob.visible = vis; if (!vis) continue;
      const [px, pz] = valAt(k.at, TNOW), y0 = valAt(k.opt.y || 0, TNOW) + (k.opt.person ? S.floorY(px, pz) : 0);
      if (k.spriteName && !k.opt.air) {             // a prop must stand on something (opt.air: true for a thrown / flying one)
        const sec = Math.floor(TNOW); if (k.chk !== sec) { k.chk = sec;
          scene.updateMatrixWorld(); let gap = y0;        // a small patch under it (one ray falls through bench slats)
          for (const [dx, dz] of [[0, 0], [.04, 0], [-.04, 0], [0, .04], [0, -.04]]) {
            ray.set(new THREE.Vector3(px + dx, y0 + .02, pz + dz), new THREE.Vector3(0, -1, 0)); ray.far = 3;
            const hit = ray.intersectObjects(scene.children, true).find(h => h.object.visible && h.object.layers.mask & 1);
            gap = Math.min(gap, hit ? hit.distance - .02 : y0); }
          if (gap > .04) propLog(TNOW, k.spriteName, `floats ${gap.toFixed(2)} above what is under it - set y to the surface top, or air: true if it is flying`); }
        const v = new THREE.Vector3(px, y0 + .1, pz).project(cam);
        if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1) { onScreen[k.spriteName] = (onScreen[k.spriteName] || 0) + 1;
          if (onScreen[k.spriteName] === 2) propLog(TNOW, k.spriteName, 'is on screen twice - hide the copy (show) unless there really are two'); }
      }
      const fa = valAt(k.opt.face ?? 0, TNOW), vx = cam.position.x - px, vz = cam.position.z - pz, vl = Math.hypot(vx, vz) || 1;
      let side = (Math.sin(fa) * vx + Math.cos(fa) * vz) / vl;
      if (k.opt.walk) { k.back = k.back ? side < .2 : side < -.2; side = k.back ? -1 : 1; }   // walkers flip front/back with a margin
      if (!(k.opt.static && k.drawn)) {
        const x = k.cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, k.cw, k.ch);
        // POC r2: people are lit from where the light really is - the sun and any lamp near them, weighted by strength
        // and distance (the side of the face and body that gets the highlight), and soft when out of the camera's focus
        if (k.opt.person && S.cardLight) { const [qx, qz] = valAt(k.at, TNOW), er = cam.matrixWorld.elements;
          let wsum = .5, sxs = (sv.x * er[0] + sv.y * er[1] + sv.z * er[2]) * .5;
          for (const L of S.lights) { const lp = valAt(L.pos, TNOW), dx = lp[0] - qx, dy = lp[1] - .6, dz = lp[2] - qz, dd = Math.hypot(dx, dy, dz) || 1,
            w = valAt(L.k, TNOW) * Math.exp(-dd * 1.2) * 1.6; wsum += w; sxs += w * (dx * er[0] + dy * er[1] + dz * er[2]) / dd; }
          setLight(Math.atan2(-.8, Math.max(-1, Math.min(1, sxs / wsum * 1.6))));
          const fd = Math.hypot(at[0] - pos[0], at[1] - pos[1], at[2] - pos[2]), cd = Math.hypot(qx - pos[0], .6 - pos[1], qz - pos[2]);
          x.filter = S.fx.dof > 0 ? `blur(${Math.min(5, S.fx.dof * 1.2 * Math.abs(cd - fd) / fd).toFixed(2)}px)` : 'none'; }
        const prev = g; g = x; k.draw(k.cw, k.ch, k.ppu, side, cam); g = prev; x.filter = 'none';
        k.tex.needsUpdate = true; k.drawn = true;
      }
      // tint: the time of day outdoors, the warm room indoors, plus the pools of light from lanterns and fires
      const tn = new THREE.Vector3(...(k.opt.tint || (inRoomJS(px, pz) ? [.96, .88, .8] : S.T.card)));
      for (const L of S.lights) { const p = valAt(L.pos, TNOW), d = Math.hypot(p[0] - px, p[1] - .6 - y0, p[2] - pz), a = valAt(L.k, TNOW) * Math.exp(-d * 1.25) * .8; tn.x += L.col.r * a; tn.y += L.col.g * a; tn.z += L.col.b * a; }
      if (y0 < -.02) tn.multiplyScalar(L2(1, .45, clamp01(-y0 / 1.3)));          // down in a hole
      k.mesh.material.uniforms.tint.value.set(Math.min(tn.x, 1.15), Math.min(tn.y, 1.1), Math.min(tn.z, 1.05));
      k.mesh.position.set(px, y0 - FOOT / k.ppu, pz);
      // POC r11: opt.yaw fixes the card's facing (a flat cut-out that does not turn to the camera), so what it holds stays
      // in one place in the world for every camera
      k.mesh.rotation.y = k.opt.yaw != null ? valAt(k.opt.yaw, TNOW) : Math.atan2(cam.position.x - px, cam.position.z - pz);
      // people are flat cards, so a carpet, a floor edge or a seat front just in front of the card cut their feet and
      // hips off (user, 2026-11-09: feet vanished walking on a runner, people sat "through" pews). Pull every card a
      // little toward the camera, scaled about the camera so it covers exactly the same pixels - it only wins the
      // depth test against things within `depthBias` of it (default 6 cm standing, 15 cm seated; walls, tables and
      // the row in front are further and still hide them)
      const bias = valAt(k.opt.depthBias ?? (k.opt.person ? (valAt(k.opt.seat, TNOW) != null ? .15 : .06) : .03), TNOW);
      if (bias > 0) { const cp = cam.position, d = k.mesh.position.distanceTo(cp), s = Math.max(.2, (d - bias) / d);
        k.mesh.position.sub(cp).multiplyScalar(s).add(cp); k.mesh.scale.setScalar(s); }
      k.blob.position.set(px, y0 + .028, pz); k.blob.visible = !valAt(k.opt.noShadow, TNOW);
    }
    setLight(keep[0]); RIM = keep[1]; RIM_SOFT = keep[2];
    if (S.afterCards) S.afterCards(TNOW, cam);
    r.setClearColor(0x000000, 1);
    cam.layers.set(0);
    // the sun's shadow map: the set's depth seen from the sun
    const sd = U.sun.value, [scx, scz] = S.shC, hs = S.shS / 2;
    sunCam.left = -hs; sunCam.right = hs; sunCam.top = hs; sunCam.bottom = -hs; sunCam.updateProjectionMatrix();
    sunCam.position.set(scx + sd.x * 120, sd.y * 120, scz + sd.z * 120); sunCam.lookAt(scx, 0, scz); sunCam.updateMatrixWorld();
    U.shM.value.multiplyMatrices(sunCam.projectionMatrix, sunCam.matrixWorldInverse);
    scene.overrideMaterial = depthD; r.setRenderTarget(rtS); r.clear(); r.render(scene, sunCam);
    if (S.cardShadows) { scene.overrideMaterial = null; const ac = r.autoClear; r.autoClear = false; sunCam.layers.set(1);
      for (const k of S.cards) { if (!k.mesh.visible || !k.opt.person || k.opt.clip) continue;
        k.smat = k.smat || new THREE.ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: 'varying vec2 vUv; uniform sampler2D map; void main(){ if (texture2D(map, vUv).a < .5) discard; gl_FragColor = vec4(0.); }', uniforms: { map: { value: k.tex } }, side: THREE.DoubleSide, colorWrite: false });
        k.keep = [k.mesh.material, k.mesh.rotation.y, k.mesh.position.clone(), k.mesh.scale.x];
        const [px, pz] = valAt(k.at, TNOW); k.mesh.material = k.smat; k.mesh.rotation.y = Math.atan2(sd.x, sd.z);
        k.mesh.position.set(px, k.keep[2].y, pz); k.mesh.scale.setScalar(1); }
      r.render(scene, sunCam);
      for (const k of S.cards) if (k.keep) { k.mesh.material = k.keep[0]; k.mesh.rotation.y = k.keep[1]; k.mesh.position.copy(k.keep[2]); k.mesh.scale.setScalar(k.keep[3]); k.keep = null; }
      sunCam.layers.set(0); r.autoClear = ac; }
    if (S.mirrors.length) {               // the mirror pass: the camera reflected below the floor, the floor itself hidden
      const rc = R.reflCam, my = S.mirrorY || .012; rc.fov = fov; rc.aspect = cam.aspect; rc.updateProjectionMatrix();
      rc.position.set(pos[0], 2 * my - pos[1], pos[2]); rc.up.set(0, -1, 0); rc.lookAt(at[0], 2 * my - at[1], at[2]); rc.updateMatrixWorld();
      U.reflM.value.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);
      S.mirrors.forEach(m => m.visible = false); scene.overrideMaterial = null; rc.layers.set(0);
      // people (cards, layer 1) are NOT mirrored: a blurred floor reflection put ghost people far in front of where they
      // stand (user's courtroom pews, 2026-11-09); the room, furniture and lamps still reflect
      if (S.mirrorCards) rc.layers.enable(1);
      r.setClearColor(0x000000, 0); r.setRenderTarget(R.rtR); r.clear(); r.render(scene, rc); S.mirrors.forEach(m => m.visible = true); }
    r.setClearColor(0x000000, 0); scene.overrideMaterial = null; cam.layers.enable(3); r.setRenderTarget(rtCol); r.clear(); r.render(scene, cam); cam.layers.set(0); r.setClearColor(0x000000, 1);
    scene.overrideMaterial = norm; r.setRenderTarget(rtN); r.clear(); r.render(scene, cam);
    r.setRenderTarget(null); r.clear();
    post.uniforms.projInv.value.copy(cam.projectionMatrixInverse); post.uniforms.camW.value.copy(cam.matrixWorld);
    post.uniforms.focus.value = Math.hypot(at[0] - pos[0], at[1] - pos[1], at[2] - pos[2]);
    post.uniforms.ppu.value = r.domElement.height / 2 / Math.tan(fov * Math.PI / 360) / (Math.max(1, RES) * S.ss);
    scene.overrideMaterial = null; r.render(postScene, postCam);
    scene.overrideMaterial = depth; r.render(scene, cam); scene.overrideMaterial = null;   // the set's depth, so cards hide behind walls
    cam.layers.set(2); r.render(scene, cam);
    cam.layers.set(1); r.render(scene, cam);
    cam.layers.set(0);
    MAIN.save(); MAIN.setTransform(1, 0, 0, 1, 0, 0); MAIN.imageSmoothingEnabled = true; MAIN.imageSmoothingQuality = 'high';
    MAIN.drawImage(r.domElement, 0, 0, MAIN.canvas.width, MAIN.canvas.height); MAIN.restore();
  };
  // where a point of the set lands on screen in the last frame drawn ([x, y] in frame units) - for glints, shock rings
  // and other 2D effects drawn over the set in a shot's `post`
  S.toScreen = p => { const v = new THREE.Vector3(...p).project(R.cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z < 1]; };
  // one smooth camera move along a curve through key positions: keys [{ pos, at, fov? }], travelled from t0 to t1 at
  // an even speed with a gentle start and stop (acc / dec = the share of the time spent speeding up / slowing down)
  S.path = (keys, t0, t1, acc = .2, dec = .3) => {
    const P = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.pos)), false, 'centripetal');
    const A = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.at)), false, 'centripetal');
    const v = 1 / (1 - acc / 2 - dec / 2), n = keys.length - 1;
    const ease = x => x < acc ? v * x * x / (2 * acc) : x < 1 - dec ? v * (acc / 2 + x - acc) : 1 - v * (1 - x) * (1 - x) / (2 * dec);
    return t => {
      const u = ease(clamp01((t - t0) / (t1 - t0))), p = P.getPointAt(u), a = A.getPointAt(u);
      const s = u * n, i = Math.min(n - 1, Math.floor(s)), f = L2(keys[i].fov || 50, keys[i + 1].fov || 50, s - i);
      return { pos: [p.x, p.y, p.z], at: [a.x, a.y, a.z], fov: f };
    };
  };
  return S;
}
