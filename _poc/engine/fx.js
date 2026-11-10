// Ink Shorts engine - effects. All deterministic in t (seeded by hash), world space unless noted.

// burst of particles from (x,y) starting at t0. kinds: weighted list like [['coin',26],['shard',14],['bill',6]].
// floorY (optional) makes heavy pieces bounce once between x range [fx0, fx1].
function burst(t, t0, x, y, kinds, o = {}) {
  if (t < t0) return;
  const list = []; kinds.forEach(([k, n]) => { for (let i = 0; i < n; i++) list.push(k); });
  const dt = 1 / 120, seedBase = o.seed || 1;
  list.forEach((kind, i) => {
    const hi = i + seedBase * 97;
    const a = -Math.PI / 2 + (hash(hi) - 0.5) * (o.spread || 2.6), sp = (o.speed || 1) * (700 + hash(hi + 50) * 900);
    let px = x + (hash(hi + 9) - .5) * (o.width || 120), py = y, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp - 200;
    const light = kind === 'bill' || kind === 'paper' || kind === 'confetti';
    const grav = light ? 500 : 2600, drag = light ? 2.2 : 0.2;
    let tt = t0, bounced = false;
    while (tt + dt <= t) {
      vx *= 1 - drag * dt; vy = vy * (1 - drag * dt) + grav * dt; px += vx * dt; py += vy * dt; tt += dt;
      if (!bounced && !light && o.floorY && vy > 0 && py > o.floorY && px > (o.fx0 ?? -1e9) && px < (o.fx1 ?? 1e9)) { py = o.floorY; vy *= -0.35; vx *= 0.6; bounced = true; }
    }
    const spin = (t - t0) * (8 + hash(hi + 3) * 14);
    // generated cut-outs win over the code-drawn fallbacks: 'coin' -> SPR.coin, 'bill' -> SPR.bill, any SPR name works
    if (typeof SPR !== 'undefined' && SPR[kind]) {
      const nf = SPR[kind].frames.length, flat = kind === 'bill' || kind === 'paper';
      const fh = SPR[kind].frames[0].h;
      drawSprite(kind, px, py, { anchor: 'center', h: (o.spriteH || (kind === 'coin' ? 48 : kind === 'confetti' ? Math.min(34, fh * 1.6) : 70)) * (o.size || 1), frame: nf > 1 ? i + Math.floor(spin * 2) : 0,
        rot: flat || nf > 1 ? Math.sin(spin) * 0.8 : spin * 0.3, sx: nf > 1 ? 1 : Math.max(0.15, Math.abs(Math.cos(spin))) });
    }
    else if (kind === 'coin') coin(px, py, spin, o.size || 1);
    else if (kind === 'bill') dollarBill(px, py, Math.sin(spin) * 0.8, Math.cos(spin * .7), o.size || 1);
    else if (kind === 'confetti' || kind === 'paper') {
      g.save(); g.translate(px, py); g.rotate(spin); g.scale(1, Math.cos(spin * 1.3));
      g.fillStyle = kind === 'paper' ? '#f4efe2' : ['#e94f4f', '#f2c94c', '#4fb3e9', '#7cd67a'][i % 4]; g.fillRect(-14, -9, 28, 18); g.restore();
    } else {    // shard of whatever broke: o.shardCols
      g.save(); g.translate(px, py); g.rotate(spin);
      const s = 30 + hash(hi + 77) * 40, cols = o.shardCols || ['#ff9cb2', '#f27a96'];
      fillInk([[-s, -s * .6], [s * .8, -s * .3], [s * .5, s * .7], [-s * .7, s * .5]], cols[i % cols.length], 3, 6);
      g.restore();
    }
  });
}
function dustPuff(x, y, age, seedI = 0, col = '214,166,108') {
  if (age < 0 || age > 1.2) return;
  const a = (1 - age / 1.2) * 0.55;
  if (typeof SPR !== 'undefined' && SPR.dust) {   // generated dust-cloud cut-out
    drawSprite('dust', x - age * 40, y, { anchor: 'center', h: 60 + age * 120, alpha: a * 1.6, frame: seedI, rot: (hash(seedI) - .5) * .6 });
    return;
  }
  for (let i = 0; i < 3; i++) {
    const r = 20 + age * 70 + hash(seedI * 7 + i) * 20;
    g.fillStyle = `rgba(${col},${a})`; g.beginPath(); g.arc(x - age * 40 + i * 22, y - age * 30 - i * 8, r, 0, 7); g.fill();
  }
}
// flash with rotating rays (screen or world space), f = 0..1 strength
function glint(sx, sy, f, t, scale = 1) {
  if (f <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const r = 300 * f * scale, gr = g.createRadialGradient(sx, sy, 0, sx, sy, r);
  gr.addColorStop(0, 'rgba(255,255,240,.95)'); gr.addColorStop(.3, 'rgba(255,250,210,.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill();
  g.translate(sx, sy); g.rotate(t * 0.6);
  for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 4); g.fillStyle = 'rgba(255,255,235,.85)'; const L = 420 * f * scale * (i % 2 ? .55 : 1); path([[0, -10 * f], [L, 0], [0, 10 * f], [-L, 0]]); g.fill(); }
  g.restore();
}
// comic impact star (screen or world), f = 0..1
function impact(x, y, f, s = 1) {
  if (f <= 0) return;
  const pts = []; for (let i = 0; i < 20; i++) { const r = (i % 2 ? 60 : 150) * s * f; const a = i / 20 * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  g.save(); g.globalAlpha = Math.min(1, f * 1.5); fillInk(pts, '#fff3b0', 3, 6); g.restore();
}
function speedLines(x, y, len, n = 3, spacing = 40, col = 'rgba(255,255,255,.6)') {
  g.strokeStyle = col; g.lineWidth = 5;
  for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(x - i * 30, y + i * spacing); g.lineTo(x - len - i * 30, y + i * spacing); g.stroke(); }
}
// flock of simple flapping birds crossing from (x0,y0) with velocity (vx,vy)
function birds(t, t0, x0, y0, vx = 260, vy = -140, n = 5, col = '#3a3240') {
  for (let i = 0; i < n; i++) {
    const tt = t - t0 + i * 0.25, x = x0 + tt * (vx + i * 30), y = y0 + tt * vy - i * 40 + 20 * Math.sin(i);
    const flap = Math.sin(tt * 14 + i) * 18, s = 1 + i * 0.15;
    brush(spline([[x - 30 * s, y - flap], [x - 12 * s, y - 6], [x, y + 4], [x + 12 * s, y - 6], [x + 30 * s, y - flap]]), taper(7 * s, .3, .3, .4), col);
  }
}
function sweatDrops(x, y, t, s = 1) {
  for (let i = 0; i < 2; i++) { const k = ((t * 1.5 + i * .5) % 1); g.save(); g.globalAlpha = 1 - k; fillInk(ellPts(x + i * 30 * s, y + k * 60 * s, 9 * s, 14 * s, 16), '#bfe6ff', 2, 3); g.restore(); }
}
// rain of falling items (e.g. money from the sky): kind 'bill' | 'confetti' | 'paper'
function rain(t, t0, kind, n = 30, x0 = 0, x1 = W, top = -100, speed = 500) {
  for (let i = 0; i < n; i++) {
    const tt = t - t0 - hash(i) * 1.5; if (tt < 0) continue;
    const x = L2(x0, x1, hash(i + 3)) + Math.sin(tt * 3 + i) * 40, y = top + tt * speed * (0.7 + hash(i + 6) * .6);
    // library pieces at their natural sizes: confetti is tiny on the sheet, so keep it small (scaling it up blurs it)
    if (typeof SPR !== 'undefined' && SPR[kind]) { const f = SPR[kind].frames[i % SPR[kind].frames.length]; drawSprite(kind, x, y, { anchor: 'center', h: kind === 'confetti' ? Math.min(34, f.h * 1.6) : kind === 'paper' ? 60 : 70, frame: i, rot: Math.sin(tt * 4 + i) * .8, sx: Math.max(.2, Math.abs(Math.cos(tt * 5 + i))) }); }
    else if (kind === 'bill') dollarBill(x, y, Math.sin(tt * 4 + i) * .8, Math.cos(tt * 5 + i));
    else { g.save(); g.translate(x, y); g.rotate(tt * 6 + i); g.fillStyle = kind === 'paper' ? '#f4efe2' : ['#e94f4f', '#f2c94c', '#4fb3e9', '#7cd67a'][i % 4]; g.fillRect(-14, -9, 28, 18); g.restore(); }
  }
}
