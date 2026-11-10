# Integration readiness and a migration plan (nothing integrated yet)

## Readiness
| Part | State | Notes |
|---|---|---|
| Blender prop scripts + asset standard | **Ready after refactor** | Extract the duplicated helpers into one `kit/blender/propkit.py`; one file per prop family. |
| Room builder tail (place, apply, AO bake, export) | **Ready after refactor** | Identical in two scripts → `kit/blender/roomkit.py` with `build(shell_fn, layout, out)`. |
| Room shells | Location content | Keep as per-location scripts using roomkit. |
| `S.gltf` / GLTF classic loaders / `PRELOAD` | **Ready** | Small, isolated. |
| Material-by-name mapping (`CSURF` pattern) | **Ready after refactor** | Move to `set3d.loadRoom(url, materialTable)` in the engine; tables per location as data. |
| Toon path in `INK_FRAG` (world textures, light budget, metal, 6 lights, falloff) | **Needs cleanup** | Behind `fx.toon`; remove superseded bakeMode 1/2 and r4 curves; keep the old look untouched for existing videos. |
| New outline pass | **Needs cleanup** | Behind `fx.outline`; remove the debug branch. Changes the look of every `clean` scene if enabled by default → keep opt-in. |
| Vignette, `aoK`, `sunK` | Ready (opt-in) | |
| Card options `yaw`, `clip`, `after`, `cardLight`, `cardShadows` | `yaw`, `cardShadows`, `cardLight` ready; `clip`/`after` experimental | `clip/after` were for the drawn fist, now unused by the judge. |
| `character.js` `cloth: 'matte'` | **Ready** | Per-character, default unchanged. |
| 3D limb (`armTube`) + world-defined hand path | **Experimental** | Works for one seated character; needs a general API (which limb, IK, radius from rig, stick end). |
| Saloon jug interaction | Experimental / outdated | Rework to the round-12 method before reuse. |
| Light modes (`day/lamp/mix`) | Location content | Pattern only. |
| Textures `assets2/` | Content, **no generators saved** | Recreate generator scripts before relying on them. |

## Strategy
1. **Branch, don't overwrite**: develop as plugin **v1.2.0-beta** in a copy; keep v1.1.0 zips as the rollback.
   The two plugin copies (Claude and Codex) both need the same changes.
2. **Isolated modules** (new files, existing files only gain opt-in hooks):
   - `kit/engine/set3d_toon.js`: the toon shader path, outline, light budget, `loadRoom()`. `set3d.js` keeps its
     current behaviour unless `look: 'toon'` is requested.
   - `kit/engine/limbs.js`: `attachProp`, `armTube`, world hand paths.
   - `kit/blender/propkit.py`, `roomkit.py`, `locations/<name>/{props.py, room.py, layout.json, materials.json}`.
   - `kit/tools/build_location.mjs`: runs Blender (path from config), then turntables and a QA report.
3. **Interfaces**: location = `{ layout.json, materials.json, textures/, props.py, room.py }` → `room.glb + tops.json`;
   scene code calls `V.loadRoom('room.glb', materials)` and `V.attach(card, prop, path)`.
4. **Regression tests before merging**:
   - Pixel-diff reference frames of the plugin examples (`kit/examples/village3d`, `postoffice`) and at least one
     finished story, rendered with v1.1.0 vs the branch with the toon look off → must be identical (as done for the
     saloon in round 12).
   - Saloon and courtroom reference frames with the toon look on.
   - Existing `check.py` and PROP CHECK on a full video.
   - Performance gate (QA.md §8).
5. **Dependencies**: Blender becomes an optional build-time dependency (only to build new locations); rendering
   needs none beyond today's (Node, Chrome/Edge, ffmpeg). Ask the user before installing anything.
6. **Rollout**: one location (courtroom) used in one real Short; then the skill instructions; then more locations.
7. **Rollback**: v1.1.0 zip + the opt-in flags (toon look off = old behaviour).

## Out of scope / open decisions
- Whether all existing kit sets (village, post office...) should be rebuilt in the new style.
- Whether characters other than seated ones need 3D limbs.
- More than 6 lights.
