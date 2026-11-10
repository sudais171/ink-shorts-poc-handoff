# Producing an environment: the repeatable workflow

## Reusable vs location-specific
| Reusable (do not rewrite per location) | Location-specific (write per location) |
|---|---|
| `engine/` (shader, outlines, light budget, metal, cards, 6 lights, `yaw`/`clip`/`after`) | `<loc>_props.py`: the props for that location |
| Prop helpers inside the prop scripts (`box`, `bx`, `lathe`, `dome`, `profile`, `panel_front`, `finish`) - **copied between scripts, not a shared module yet** | Room script body: walls, windows, doors, ceiling, dais... (`build_court.py` is the cleanest template) |
| Room-script tail: `place()`, modifier apply, AO bake, export (identical in `build_room3.py` and `build_court.py`) | `<loc>_layout.json`: prop list |
| `render.mjs`, `turntable/`, `lightbox/` inspection pages | Textures in `assets2/` (palette, wall, floor, fabric) |
| Material-mapping pattern (`CSURF` table + `cmat`) | `scene.js`: material table values, lights, cameras, characters, action |
| `ASSET_STANDARD.md` | |

## Steps (the courtroom took ~2 hours this way)
1. **Brief**: location, architecture, palette (3-5 colours with roles: wall, wood, accent, metal, cool shade),
   key props (2-4 hero pieces), light sources that exist in the room, camera list, any interaction.
2. **Props** (`<loc>_props.py`, copy `court_props.py`): one `reset()` block per prop, built in person units,
   named `P_*` materials. Run:
   `tools/blender-4.2.23-windows-x64/blender.exe -b --factory-startup -P <loc>_props.py` → `downloads/<loc>/*.glb`
   (8 courtroom props: 8 s).
3. **Turntable check** of every new prop (front/side/back/three-quarter, same light):
   ```
   cd turntable
   node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --query "prop=../<loc>/<name>.glb&h=<height>&pal=court&d=<cam distance>" --stills "0.5,1.5,2.5,3.5" --quality 720 --frames-dir out/<name>
   ```
   `turntable/scene.js` holds a material table (`TM`); add any new `P_*` names there. Fix the prop before going on.
4. **Room** (`build_<loc>.py`, copy `build_court.py`): edit the shell/architecture section; keep `place()` and the
   bake/export tail; set the output path. Layout file: list of `{role, file, at:[x, y|"ROLE"|"CEIL", z], rot, s|h}`.
   Run: `blender.exe -b --factory-startup -P build_<loc>.py -- 32` → `<loc>/room_<loc>.glb` + `tops_<loc>.json`
   (courtroom: 120-142 s, of which AO bake 91-142 s).
5. **Textures** (`assets2/`): painted textures were generated with short PIL snippets run inline during the POC
   (**the snippets were not saved as files**, see QA.md risks). Pattern used: flat base colour, sparse low-contrast
   motif, `GaussianBlur(~1)`, 4% blended noise; wood = `grain2.png` (4 calm lines) tinted by material colour.
6. **Scene** (`<loc>/index.html` = copy of `court/index.html`; `scene.js` = copy of `court/scene.js`): edit the
   `CSURF` table (one entry per `S_*`/`P_*` name), `V.room(...)` bounds, `V.floors` (raised floors), lights
   (≤ 6, each with a visible source mesh), cameras (`CC`, `PATH`), characters and actions.
7. **Stills**, then **video**:
   ```
   cd <loc>
   node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --query "cam=<preset>&lm=mix" --stills "0.3" --quality 1080 --frames-dir out/<name>
   node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --query "cam=move" --from 0 --to <dur> --quality 1080 --out out/<loc>.mp4
   ```
8. QA (QA.md): turntables, three light modes, contact measurement for interactions, regression of the other rooms.

## Exact commands for the two existing rooms
Run from `D:\New Test Animation\_poc` (Git Bash; `B=tools/blender-4.2.23-windows-x64/blender.exe`):

| Purpose | Command | Output |
|---|---|---|
| Saloon props v1 (barrel, lantern; also old table/chair) | `$B -b --factory-startup -P heroes.py` | `downloads/hero/{barrel,table,lantern,chair}.glb` |
| Saloon table3/chair3/sideboard | `$B -b --factory-startup -P heroes3.py` | `table3, chair3, cabinet3.glb` |
| Crate, candlestick, frame, chandelier, sconce | `$B -b --factory-startup -P heroes4.py` | `crate4, candlestick4, frame4, chandelier4, sconce4.glb` |
| Designed jug | `$B -b --factory-startup -P jug5.py` | `jug5.glb` |
| Saloon room (final) | `$B -b --factory-startup -P build_room3.py -- 32 hero5 ao` | `scene3/room_hero5_ao.glb`, `tops_hero5.json` |
| Courtroom props | `$B -b --factory-startup -P court_props.py` | `downloads/court/*.glb` |
| Courtroom room | `$B -b --factory-startup -P build_court.py -- 32` | `court/room_court.glb`, `tops_court.json` |

Note: `heroes.py` also rebuilds `table.glb`/`chair.glb` (round-4 versions, unused) and `heroes2.py` builds
`table2`/`chair2` (round-5, unused). They are kept for history.

## Scene query parameters
**Saloon** (`scene3/index.html`): `set=kk|ph|st|hero|hero2|hero3|hero4|hero5` (final = `hero5`),
`cam=a|b|c|d|e|f|g|h|k|p|s|q|q2|orbit|through|move`, `lm=day|lamp|mix`, `light=old`, `outl=<n>`, `nochar=1`.
Video used: `set=hero5&cam=through`, 6 s.
**Courtroom** (`court/index.html`): `cam=w|b|ws|p|e|g|c|sd|move`, `lm=day|lamp|mix`, `ti=<s>` (gavel action
start; default 8.6 for `move`, else 0), `nochar=1`, `coat=gloss`, `fist=1` (old drawn fist), `bounce=0`,
`vig=<n>`, `bk=<n>`. Video: `cam=move`, 13 s.
**Turntable**: `prop=<file relative to downloads/hero>`, `h`, `pal=court`, `d`. **Lightbox**: `zone=sun|lamp|shade`.
