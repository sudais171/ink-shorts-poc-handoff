# Ink Shorts `_poc` production system: handoff

This package documents the experimental **3D environment pipeline** built in `D:\New Test Animation\_poc` between
2026-11-09 and 2026-11-10 (proof-of-concept rounds 1-12). It is **not integrated** into the main plugin
(`D:\New Test Animation\ink-shorts-studio`, v1.1.0), which was never modified by this work.

Two finished environments exist:
- **Saloon / parlour** (`scene3/`, asset set `hero5`): rounds 1-9.
- **Courtroom** (`court/`): rounds 10-12, with a judge who picks up a gavel, strikes twice and puts it down.

## What the system is, in one paragraph
Blender 4.2 (run headless from Python scripts) builds every prop and the room architecture out of bevelled
primitives, assigns named placeholder materials (`S_*` for room surfaces, `P_*` for props), bakes ambient
occlusion into vertex colours and exports one `.glb` per room. A modified copy of the Ink Shorts three.js engine
(`_poc/engine/set3d.js`) loads that `.glb`, replaces every material by name with its own toon shader (picture
textures in world space, a light budget, metal response, coloured outlines in a post pass), adds up to six point
lights, and draws the existing 2D Ink Shorts characters as flat "cards" in the 3D scene. Frames are captured by the
**main plugin's unmodified** `kit/tools/render.mjs` (headless Chrome/Edge + ffmpeg).

## Folder layout (inside `_poc`)
| Path | What |
|---|---|
| `engine/` | Modified engine copy (set3d.js, character.js, player.js + two converted three.js loaders). Backups `*.roundN.js` are history, not used. |
| `*.py` (root) | Blender scripts: props (`heroes*.py`, `jug5.py`, `court_props.py`), rooms (`build_room3.py`, `build_court.py`), experiments. |
| `layout.json`, `court_layout.json` | Prop placement lists for the two rooms. `tops_*.json` are written by the room builds (surface heights). |
| `scene3/` | Saloon scene page (`index.html`, `scene.js`) + baked room `.glb` files. |
| `court/` | Courtroom scene page + `room_court.glb`. |
| `turntable/`, `lightbox/` | Inspection pages: one prop from 4 angles; props in sun / lamp / shade. |
| `assets2/` | Generated painted textures (floors, walls, fabric, rug, outdoor view, wood grain). |
| `downloads/hero/`, `downloads/court/` | Generated prop `.glb` files (output of the Blender prop scripts). |
| `downloads/kk`, `downloads/ph`, `downloads/st` | Third-party (KayKit, Poly Haven) and abandoned-experiment assets. **Not used by the final scenes.** |
| `tools/blender-4.2.23-windows-x64/` | Portable Blender (951 MB, not in the ZIP). |
| `scene/`, `scene2/` | Rounds 1-2 test pages (historical). |
| `compare/`, `*/out/` | Render outputs and comparison sheets (not in the ZIP). |

## Setup (Windows, as used)
1. **Node.js** v24.20.0 (any recent Node with ES modules works for `render.mjs`).
2. **Chrome or Edge** installed in the default location (or set `CHROME_PATH`).
3. **ffmpeg** on PATH (used: 9.0.2 full build from WinGet), or set `FFMPEG`.
4. **Blender 4.2 LTS** portable: `https://download.blender.org/release/Blender4.2/blender-4.2.23-windows-x64.zip`,
   unzip to `_poc/tools/` (scripts call `tools/blender-4.2.23-windows-x64/blender.exe`). Only needed to rebuild props or rooms.
5. **Python 3.12 + Pillow 13** only for the comparison-sheet scripts and texture generation.
6. The renderer is the main plugin's `ink-shorts-studio/kit/tools/render.mjs`. Scenes call it as
   `../../ink-shorts-studio/kit/tools/render.mjs`; in the GitHub repo an unmodified copy sits at exactly that path
   (in the ZIP it is under `deps/`).

## Quick start (no Blender needed; the baked `.glb` files are included)
```
cd "D:/New Test Animation/_poc/court"
node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --query "cam=g&ti=0" --stills "1.8" --quality 1080 --frames-dir out/check
node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --query "cam=move" --from 0 --to 13 --quality 1080 --out out/court.mp4
cd ../scene3
node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --query "set=hero5&cam=b&lm=mix" --stills "2.6" --quality 1080 --frames-dir out/check
```
All commands, query parameters and rebuild steps: `PIPELINE.md`. Files: `FILE_MAP.md`.

## Documents
- `ARCHITECTURE.md`: how it actually works.
- `PIPELINE.md`: building a new environment, step by step, with exact commands.
- `ASSETS.md`: asset standard, materials, sources and licences.
- `INTERACTIONS.md`: 2D characters with 3D props, honestly.
- `QA.md`: what is checked, what is not, a proposed visual QA process.
- `PERFORMANCE.md`: measured numbers.
- `INTEGRATION.md`: readiness and a migration plan.
- `FILE_MAP.md`: every important file.
