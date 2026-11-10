# Performance (measured on the target laptop unless marked "estimate")

## Hardware and software (measured)
- Lenovo ThinkPad (model 20JNS0DG00): **Intel Core i5-6300U** (2 cores / 4 threads, 2.4 GHz), **Intel HD Graphics 520**
  (Windows reports 1 GB shared), **16 GB RAM** (≈5.8 GB free during tests), SSD. Windows 11 Enterprise.
  Note: the brief says "HD 620"; the machine reports HD 520.
- Node v24.20.0 · Chrome/Edge headless (render.mjs auto-detects) · ffmpeg 9.0.2 · Python 3.12 + Pillow 13.0.0 ·
  Blender 4.2.23 LTS (portable) · three.js r159.

## Rendering (render.mjs, 1080×1920, 30 fps, H.264 CRF 17)
| Scene | Frames | Load + first frame | Time / frame | Peak renderer RAM | Source |
|---|---|---|---|---|---|
| Plugin engine baseline (simple test room, 3 people) | 60 | - | ~1.4 s | 2,202 MB | round 1 measure |
| POC round 1 (KayKit room) | 180 | 11.7 s | 0.98 s | 730 MB | `bench.ps1` |
| Saloon round 6 orbit | 180 | - | ~1.1 s (220 s total incl. load) | not measured | log |
| Saloon round 9 fly-through (final room, 6 lights) | 180 | - | ~1.2 s (214 s total incl. load) | not measured | log |
| Courtroom round 10 | 390 | 26.2 s | 0.99 s | 764 MB | `vid10.ps1` |
| Courtroom round 11 | 390 | 30.2 s | 1.11-1.15 s | 767-779 MB | `vid10.ps1` |
| Courtroom round 12 (final) | 390 | 28.8 s | 1.13 s | 780 MB | `vid10.ps1` |
Peak RAM = working set of the headless browser processes started by render.mjs (sampled every 0.5 s).

## Blender (CPU, Cycles AO 32 samples unless noted)
| Job | Meshes | Vertices (after modifiers) | Build | Bake | Total |
|---|---|---|---|---|---|
| Bake test, 1024² lightmap, 128 samples DIFFUSE | - | ~2,100 faces | 0.4 s | 114.5 s | 116 s |
| Saloon round 2 (Poly Haven, full DIFFUSE 48 samples) | 133 | 184,537 | 4.4 s | 378.8 s | 391 s |
| Saloon hero3 (AO) | 248 | 174,188 | - | - | 231 s |
| Saloon hero4/hero5 final (AO) | 339 / 344 | 60,571 / 61,027 | ~4 s | - | 72-73 s |
| Courtroom (AO) | 549 | 75,924 | 6.1-6.2 s build + 2.6-2.9 s placement + 12-14 s modifier apply | 90.9-141.9 s | 120-160 s |
| Courtroom props (8 props) | - | - | - | - | 8 s |
| Saloon remesh experiment (8 props) | - | - | - | - | 75 s |

## Files
- `scene3/room_hero5_ao.glb` 3.9 MB, `court/room_court.glb` 4.9 MB, all prop `.glb` together 2.8 MB, textures 8.9 MB.

## Estimates (not measured)
- A full 60 s Short at 1080p in a room of this complexity: ~1,800 frames × 1.1-1.2 s ≈ 35-40 min plus load.
- GitHub Actions (no GPU) would be several times slower; not tested with these scenes.
- Scenes with more lights or > ~1 M vertices: not tested.
