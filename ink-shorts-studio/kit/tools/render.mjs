// Ink Shorts renderer. Drives an installed Chrome/Edge over the DevTools protocol (Node's built-in WebSocket and
// fetch, no packages) and pipes PNG frames into ffmpeg.
//
//   node render.mjs --page index.html --storyboard                      one labelled frame per shot -> frames/storyboard.png
//   node render.mjs --page index.html --stills 0.5,2.1 [--sheet]        single frames (+ contact sheet) for checking
//   node render.mjs --page index.html --from 0 --to 15 --quality 540 --audio audio/voice.mp3 --out out/preview.mp4
//   node render.mjs --page index.html --dur 21 --quality 1080 --audio audio/voice.mp3 --out out/final.mp4
//
// --quality 540|720|1080|1440 (short side in pixels; scenes are designed at 1080). With --audio the soundtrack is
// mixed by mix.py (--audio none = no voice, effects/music only): voice + sound effects (SCENE.sfx + automatic whooshes) + music ducked under the voice, levelled to
// -14 LUFS. Music is off by default; --music <file> mixes a track, --music-source generate|library turns it on
// (--mood picks the mood). --no-sfx / --no-music turn parts off.
// --query "a=1&b=2" adds page parameters (e.g. for grid.html).
// --mux <silent.mp4> --audio <voice> --dur <s> --out <final.mp4>: only mix the soundtrack onto a finished video (cloud renders).
import { spawn, spawnSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, renameSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, resolve } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const toolsDir = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const page = resolve(arg('page', 'index.html')), here = dirname(page);
const fps = +arg('fps', 30), quality = +arg('quality', flag('storyboard') ? 540 : 1080), res = quality / 1080;
const from = +arg('from', 0), out = resolve(here, arg('out', 'out/video.mp4'));
const stills = arg('stills') ? arg('stills').split(',').map(Number) : null;
const framesDir = resolve(here, arg('frames-dir', 'frames'));
const ffmpeg = process.env.FFMPEG || 'ffmpeg', python = process.env.PYTHON || 'python';
const browsers = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const exe = browsers.find(p => existsSync(p));
if (!exe) { console.error('No Chrome/Edge found; set CHROME_PATH'); process.exit(1); }

// the Chrome profile lives in the system temp folder (inkshorts-render); INKSHORTS_TMP overrides. Windows can hold a
// closed Chrome's files for a while, so first sweep profiles that earlier renders could not remove - only ones no
// Chrome is using (a folder with open files inside cannot be renamed)
const longTmp = () => { try { return realpathSync.native(tmpdir()); } catch { return tmpdir(); } };   // no 8.3 short names
const tmpRoot = resolve(process.env.INKSHORTS_TMP || longTmp(), 'inkshorts-render');
if (process.platform === 'win32' && existsSync(tmpRoot)) for (const f of readdirSync(tmpRoot)) {
  const p = resolve(tmpRoot, f), q = p + '-old';
  try { if (!f.endsWith('-old')) renameSync(p, q); rmSync(f.endsWith('-old') ? p : q, { recursive: true, force: true }); } catch {}
}
const port = 9300 + Math.floor(Math.random() * 500), profile = resolve(tmpRoot, 'chrome-' + port);
// Windows: draw on the graphics chip (measured ~19x faster than software drawing, ~1.2 s a 1080p frame instead of ~14 s);
// INKSHORTS_NO_GPU=1 forces software drawing. Elsewhere (cloud machines have no graphics chip) software as before.
const gpu = process.platform === 'win32' && !process.env.INKSHORTS_NO_GPU ? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] : ['--disable-gpu'];
const chrome = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, '--allow-file-access-from-files', ...gpu, '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1080,1920', `--user-data-dir=${profile}`, ...(process.env.CHROME_FLAGS || '').split(' ').filter(Boolean), 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });   // CHROME_FLAGS: extra flags (cloud renders: software WebGL)
let chromeErr = ''; chrome.stderr.on('data', d => { chromeErr = (chromeErr + d).slice(-3000); });
// close Chrome with all its helper processes (on Windows killing the main one leaves the helpers running), then
// remove its profile, retrying while the last files are let go. Runs on every exit, errors and Ctrl+C included.
let cleaned = false;
const cleanup = () => {
  if (cleaned) return; cleaned = true;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
  else try { chrome.kill('SIGKILL'); } catch {}
  for (const t0 = Date.now(); existsSync(profile) && Date.now() - t0 < 10000;) {
    try { rmSync(profile, { recursive: true, force: true }); } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200); }
  }
  try { if (!readdirSync(tmpRoot).length) rmSync(tmpRoot, { recursive: true, force: true }); } catch {}   // the next render sweeps what is left
};
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(130));

let targets;
for (let i = 0; i < 300; i++) {                     // up to a minute: cloud machines can be slow to start Chrome
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.find(t => t.type === 'page')) break; } catch {}
  await new Promise(r => setTimeout(r, 200));
}
if (!targets || !targets.find(t => t.type === 'page')) { console.error('Chrome did not start (no DevTools page after 60 s). Chrome said:\n' + chromeErr); cleanup(); process.exit(1); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async expr => {
  const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (m.result.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || JSON.stringify(m.result.exceptionDetails));
  return m.result.result.value;
};
await send('Runtime.enable');
const query = [`res=${res}`, arg('query')].filter(Boolean).join('&');
await send('Page.navigate', { url: pathToFileURL(page).href + '?' + query });
let ok = false;
for (let i = 0; i < 100 && !ok; i++) { ok = await evalJs('!!window.ready').catch(() => false); if (!ok) await new Promise(r => setTimeout(r, 100)); }
try { await evalJs('window.ready'); } catch (e) { console.error('Page failed:', e.message, '\n', logs.join('\n')); cleanup(); process.exit(1); }
if (logs.length) { console.error('Page errors:\n' + logs.join('\n')); cleanup(); process.exit(1); }

const frameUrl = t => evalJs(`renderFrame(${t})`);
// words that could not sit properly on their surface (fitText / spriteText) - fix these before showing anything
async function reportFit() {
  const list = await evalJs('typeof FIT_LOG !== "undefined" ? FIT_LOG : []').catch(() => []);
  if (list.length) console.log('TEXT CHECK - fix before showing:\n' + list.map(e => `  t=${e.t}s "${e.text}": ${e.why}`).join('\n'));
  const props = await evalJs('window.PROP_LOG || []').catch(() => []);
  if (props.length) console.log('PROP CHECK - fix before showing:\n' + props.map(e => `  t=${e.t}s ${e.text}: ${e.why}`).join('\n'));
}
const png = async t => Buffer.from((await frameUrl(t)).split(',')[1], 'base64');
const sceneDur = await evalJs('typeof SCENE !== "undefined" ? SCENE.dur : 0').catch(() => 0);
const to = +arg('to', arg('dur', sceneDur || 20));

function mixAudio(audioOut, t0, t1) {
  const ev = resolve(here, 'frames', 'sound-events.json');
  return evalJs('JSON.stringify(window.soundEvents ? window.soundEvents() : {events: []})').then(j => {
    mkdirSync(dirname(ev), { recursive: true }); writeFileSync(ev, j);
    const root = resolve(here, '..');
    const a = [resolve(toolsDir, 'mix.py'), '--voice', arg('audio') === 'none' ? 'none' : resolve(arg('audio')), '--events', ev, '--from', String(t0), '--to', String(t1), '--out', audioOut,
      '--sounds', resolve(root, '_sounds'), '--sounds', resolve(toolsDir, '..', 'sounds'), '--music-dir', resolve(root, '_music')];
    if (flag('no-sfx')) a.push('--no-sfx');
    if (flag('no-music')) a.push('--no-music');
    if (arg('music')) a.push('--music', resolve(arg('music')));
    if (arg('mood')) a.push('--mood', arg('mood'));
    if (arg('music-source')) a.push('--music-source', arg('music-source'));
    const r = spawnSync(python, ['-I', ...a], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('mix.py failed');
  });
}

try {
  if (arg('eval')) {                       // print the value of an expression evaluated in the page (debugging), or
    const v = await evalJs(arg('eval'));   // with --eval-png save a returned PNG data URL (sheet.html exports)
    if (arg('eval-png')) { const p = resolve(here, arg('eval-png')); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, Buffer.from(v.split(',')[1], 'base64')); console.log('saved', p); }
    else console.log(JSON.stringify(v));
  } else if (arg('mux')) {                 // cloud renders: mix the soundtrack for 0..to and put it on a finished silent video
    const mixed = out.replace(/\.mp4$/, '.mix.m4a'); mkdirSync(dirname(out), { recursive: true });
    await mixAudio(mixed, 0, to);
    spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', resolve(arg('mux')), '-i', mixed, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', out], { stdio: 'inherit' });
    rmSync(mixed, { force: true }); console.log('wrote', out, '(sound mixed)');
  } else if (flag('storyboard')) {
    const info = await evalJs('storyboardInfo()'), pngs = [];
    for (const s of info) pngs.push(await frameUrl(s.key));
    const title = arg('title', 'Storyboard');
    const board = await evalJs(`composeBoard(${JSON.stringify(pngs)}, ${JSON.stringify(info)}, ${JSON.stringify(title)})`);
    mkdirSync(framesDir, { recursive: true });
    const p = resolve(framesDir, 'storyboard.png'); writeFileSync(p, Buffer.from(board.split(',')[1], 'base64'));
    console.log('storyboard', p, `(${info.length} shots)`);
    await reportFit();
  } else if (stills) {
    mkdirSync(framesDir, { recursive: true });
    const names = [];
    for (const t of stills) { const n = resolve(framesDir, `t${t.toFixed(2)}.png`); writeFileSync(n, await png(t)); names.push(n); }
    if (flag('sheet')) {
      const portrait = !(await evalJs('W > H')), tw = portrait ? 270 : 480, th = portrait ? 480 : 270;
      const cols = Math.min(names.length, portrait ? 5 : 3), rows = Math.ceil(names.length / cols);
      const ins = names.flatMap(n => ['-i', n]), parts = names.map((_, i) => `[${i}]scale=${tw}:${th}[s${i}]`);
      for (let i = names.length; i < rows * cols; i++) parts.push(`color=black:s=${tw}x${th}:d=1[s${i}]`);
      const rowsF = []; for (let r = 0; r < rows; r++) rowsF.push(Array.from({ length: cols }, (_, c) => `[s${r * cols + c}]`).join('') + `hstack=${cols}[r${r}]`);
      const fc = parts.concat(rowsF).join(';') + ';' + (rows > 1 ? Array.from({ length: rows }, (_, r) => `[r${r}]`).join('') + `vstack=${rows}` : '[r0]null');
      spawnSync(ffmpeg, ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fc, '-frames:v', '1', resolve(framesDir, 'sheet.png')], { stdio: 'inherit' });
      console.log('sheet', resolve(framesDir, 'sheet.png'));
    }
    console.log('wrote', names.length, 'stills to', framesDir);
    await reportFit();
  } else {
    mkdirSync(dirname(out), { recursive: true });
    const silent = arg('audio') ? out.replace(/\.mp4$/, '.silent.mp4') : out;
    const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(fps * (to - from)), t0 = Date.now();
    for (let f = 0; f < n; f++) {
      const buf = await png(from + f / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 60 === 0) process.stdout.write(`frame ${f}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    if (arg('audio')) {
      const mixed = out.replace(/\.mp4$/, '.mix.m4a');
      await mixAudio(mixed, from, to);
      spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', silent, '-i', mixed, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', out], { stdio: 'inherit' });
      rmSync(silent, { force: true }); rmSync(mixed, { force: true });
    }
    console.log('wrote', out, n, 'frames', `${Math.round(1080 * res)}p`);
    await reportFit();
  }
} finally { ws.close(); cleanup(); }
