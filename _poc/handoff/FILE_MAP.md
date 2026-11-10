# File map (paths relative to `D:\New Test Animation\_poc`)

Legend. **Reuse**: R = reusable system, L = location-specific, H = history/experiment. **State**: C = complete, X = experimental.

## Engine (`engine/`), loaded by every scene page
| File | Does | Depends on / used by | Reuse | State |
|---|---|---|---|---|
| `set3d.js` | 3D set: materials (`S.mat`), toon shader, light budget, metal response, 6 point lights + falloff, shadow map incl. card shadows, post pass (AO, DOF, glow, **outlines**, grade, vignette), cards (`S.person/S.card2d`, `yaw/clip/after/depthBias`), `S.gltf`, `afterCards` hook | three.min.js, GLTFLoader.classic.js; used by all scenes | R | X (contains superseded paths) |
| `character.js` | 2D character rig drawing; POC change: `cloth: 'matte'` | used by cards | R | C |
| `player.js` | frame loop / `renderFrame`; POC change: awaits `window.PRELOAD` | render.mjs | R | C |
| `GLTFLoader.classic.js`, `BufferGeometryUtils.classic.js` | three r159 examples converted to classic scripts | set3d `S.gltf`, scene scripts | R | C |
| other `*.js` | identical to plugin v1.1.0 (`poses, people, ages, kit3d, kitclean, …, three.min.js`) | | R | C |
| `*.roundN.js`, `set3d.r8.js` | backups per round | none | H | - |

## Blender scripts (root)
| File | Does | Output | Reuse | State |
|---|---|---|---|---|
| `court_props.py` | judge bench, judge chair, witness stand, pew, gavel, sound block, evidence set, banker's lamp; cleanest helper set | `downloads/court/*.glb` | R (helpers) + L | C |
| `build_court.py` | courtroom shell, places `court_layout.json`, AO bake, export | `court/room_court.glb`, `tops_court.json` | R (tail) + L | C |
| `heroes.py` | barrel (benchmark), lantern (+ round-4 table/chair) | `downloads/hero/` | L | C |
| `heroes3.py` | table3, chair3, sideboard (cabinet3) | | L | C |
| `heroes4.py` | crate4, candlestick4, frame4, chandelier4, sconce4 | | L | C |
| `jug5.py` | designed jug matched to the old jug's extents | `jug5.glb` | L | C |
| `build_room3.py` | saloon room for any asset set in `layout.json` (`-- <samples> <set> [ao]`) | `scene3/room_<set>[_ao].glb`, `tops_<set>.json` | R (tail) + L | C (accumulated flags) |
| `heroes2.py` | round-5 table2/chair2 | | H | - |
| `stylize.py` | round-3 remesh of scanned models (rejected) | `downloads/st/` | H | - |
| `build_room.py`, `bake_test.py` | rounds 1-2 | | H | - |

## Data
| File | Does |
|---|---|
| `layout.json` | saloon room constants (`room`, `window`, `door`, `sun`) + `sets.{kk,ph,st,hero,hero2,hero3,hero4,hero5}` prop lists + `jug` per set |
| `court_layout.json` | courtroom prop list |
| `tops_<set>.json`, `tops_court.json` | written by room builds; read by scene scripts (surface heights for props, lights, gavel) |
| `ASSET_STANDARD.md` | the barrel-derived design standard |

## Scenes
| File | Does | Reuse | State |
|---|---|---|---|
| `court/scene.js` | courtroom: material table, light modes, 6 lights, judge (fixed-yaw seated card, matte coat), gavel action `ACT`, world hand path `HW`, 3D arm, cameras + 13 s path | L (template for new rooms) | C |
| `court/index.html`, `config.js` | page: loads engine + scene | R | C |
| `court/room_court.glb` | baked courtroom | L | C (generated) |
| `scene3/scene.js` | saloon for all asset sets (rounds 3-9 flags `R5..R8`), jug interaction (old method), light modes, cameras | L | C, cluttered with per-round flags |
| `scene3/room_hero5_ao.glb` | final baked saloon (other `room_*.glb` = earlier rounds) | L | C |
| `turntable/scene.js` | one prop, 4 angles, material tables (saloon + `pal=court`) | R (QA) | C |
| `lightbox/scene.js` | props in sun / lamp / shade | R (QA) | C |
| `scene/`, `scene2/` | rounds 1-2 | H | - |

## Tooling
| File | Does |
|---|---|
| `../ink-shorts-studio/kit/tools/render.mjs` | **main plugin** renderer (unmodified, v1.1.0); copy in ZIP `deps/render.mjs` |
| `vid10.ps1` | renders the courtroom video and logs load time, s/frame, peak browser RAM |
| `bench.ps1` | round-1 benchmark (5 configurations) |
| `render3.sh` … `render12.sh` | batch renders per round (stills for sheets) |
| `sheets3.py` … `sheets12.py` | comparison contact sheets (PIL) |

## Entry points
- Render: `node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --query "<params>" (--stills <t> --frames-dir <dir> | --from a --to b --out <mp4>) --quality 1080` from `court/` or `scene3/`.
- Build: `tools/blender-4.2.23-windows-x64/blender.exe -b --factory-startup -P <script>.py [-- args]` from `_poc`.
- Measure: `node …/render.mjs --page index.html --query "…" --eval "<js expression>"` (prints JSON), `--eval-png <file>`.
