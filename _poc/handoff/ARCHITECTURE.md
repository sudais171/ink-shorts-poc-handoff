# Architecture (as implemented, verified in code)

```
 Blender 4.2 (headless, Python)                three.js r159 in headless Chrome/Edge             render.mjs (main plugin)
 ─────────────────────────────                 ─────────────────────────────────────              ────────────────────────
 props: heroes*.py, jug5.py, court_props.py    index.html loads engine/*.js + scene.js            opens index.html?res=…
   → downloads/{hero,court}/*.glb  ─────────┐   scene.js: set3d({...}) → V (the set)               calls window.renderFrame(t)
 rooms: build_room3.py / build_court.py     │   loads room .glb, maps materials by NAME           per frame → PNG data URL
   room shell + places the prop .glbs  ◄────┘   adds lights, cards (2D characters), props          → ffmpeg (libx264, 30 fps)
   bakes AO into vertex colour 'bake'           V.render(camPos, camAt, fov) per frame            → .mp4  (or PNG stills)
   → scene3/room_<set>_ao.glb, court/room_court.glb, tops_<set>.json
```

## 1. Blender's role
- **Props** (`heroes.py`, `heroes3.py`, `heroes4.py`, `jug5.py`, `court_props.py`): each prop is assembled from
  primitives (cubes, lathed profiles via bmesh, swept quads, bezier-curve tubes, boolean cut-outs) with a **Bevel**
  modifier (angle-limited, 3 segments) and **Weighted Normal** modifier. Every part gets one of a few **named
  materials** (`P_wood`, `P_wood2`, `P_iron`, `P_brass`, `P_wax`, `P_flame`, `P_glass`, `P_paint`, `P_paint2`,
  `P_leather`, `P_glaze`, `P_band`, `P_canvas`, `P_paper`, `P_tag`, `P_green`). Base colours set in Blender are
  placeholders only: the renderer replaces them. Export: `bpy.ops.export_scene.gltf(export_format='GLB', export_apply=True)`.
- **Rooms** (`build_room3.py` for the saloon, `build_court.py` for the courtroom): build floor/walls/ceiling as
  subdivided grids (so vertex colours can hold AO), wainscot/mouldings/doors/windows/beams as bevelled boxes, then
  import the prop `.glb` files listed in a layout JSON, scale each to a target height (or `s` = native scale),
  rotate, and drop it onto the floor or onto another prop's top (`"TABLE"`, `"BENCH"`, `"CEIL"`). Prop top/bottom
  heights are written to `tops_<set>.json` for the renderer.
- **AO bake**: all modifiers applied, a `FLOAT_COLOR` point attribute named `bake` added to every mesh, Cycles CPU
  `bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')` with `world.light_settings.distance = .35`, 32 samples.
  Only contact/corner darkening is baked: **no sunlight or lamp light is baked** (see light budget below).
  (`build_room3.py` can still do a full DIFFUSE bake with `BAKE != 'ao'`; rounds 2-4 used it. Superseded.)
- One `.glb` per room (`export_vertex_color='ACTIVE'`), 3.9 MB (saloon) / 4.9 MB (courtroom).

## 2. Units and coordinates
- 1 unit = one character's height (soles to head top). Blender Z-up; three.js Y-up. The room scripts write
  geometry through `B = lambda x, y, z: (x, -z, y)` so layout numbers are three.js coordinates.
- Prop fronts face Blender −Y = three.js +Z (toward the default camera).

## 3. Loading into three.js
- `engine/GLTFLoader.classic.js` / `BufferGeometryUtils.classic.js`: three r159 example modules converted to
  classic scripts (the engine is not an ES-module app). Loaded by each `index.html` before `set3d.js`.
- Scene scripts load the room with `new GLTFLoader().load(...)` inside a promise pushed to `window.PRELOAD`;
  `player.js` (one-line change) awaits `PRELOAD` before the first frame.
- On load, every mesh's material is replaced: `cmat` (court) / `r3mat` (saloon) look up the material name with
  `.001` suffixes stripped in a table (`CSURF` / `R3SURF`) of `[colour, options]` and call `V.mat(colour, options)`.
  Meshes with a `COLOR_0` attribute get `bake: 3` (AO mode). Unknown names fall back to the glTF colour.

## 4. The renderer (`engine/set3d.js`, `look: 'clean'`)
Pipeline per frame, `S.render(pos, at, fov)`:
1. **Shadow map**: sun orthographic camera, 4096², set geometry; then (if `V.cardShadows`) every person card,
   alpha-tested and turned to face the sun, is rendered into the same map so characters cast their own shape.
2. **Colour pass** at 2× supersampling (`S.ss = 2`), 4× MSAA target, and a **normal pass** (MeshNormalMaterial).
3. **Post pass** (`POST_FRAG`): ambient-occlusion-style corner darkening, depth of field, glow round bright pixels,
   **outlines**, saturation/contrast grade, **vignette**.
4. Then the **cards** (2D characters, flat drawings) are drawn on top with the scene depth so walls hide them.

Material shader (`INK_FRAG`), POC additions in the toon path (`fx.toon = 1`):
- **Picture textures**: `map` in UV space (`useMap 1`) or **world-space triplanar** (`world: 1` → `useMap 2`,
  picks xz/zy/xy by the dominant normal axis), `mapSc` repeat, `mipB` mip bias (flattens detail), sRGB→linear by
  `pow(…, 2.2)`. Optional `arm` map (glTF metal/rough) and `gain` (lifts dark textures).
- **Light budget** (`bakeMode 3`): `light = shadeColour × mix(1, AO, aoK) + sunColour × sunLit × sunK`. With
  `sunK = .42` and shade ≈ 0.6, a sunlit surface comes out ≈ 1× its own colour: orange wood stays orange.
- **Metal response**: materials with `spec ≥ ~.5` get `metK` = 0.58 of diffuse light and a crisp highlight tinted
  by their own colour. Wood/cloth (`spec ≈ .05`) get no highlight. `hiCap` (unused in final scenes) caps brightness.
- **Point lights**: up to **6** (`lp[6]`, raised from 4), each with an optional falloff `fall` (`lfo`), a toon
  roll-off so pools do not burn to white.
- Older modes kept for history: `bakeMode 1/2` (rounds 2-4 diffuse bakes), the original glossy clean look.

**Outlines** (post pass, `outl`, `outW`): 8 samples on a ring of radius `outW` final-frame pixels (×`res`);
a pixel is a silhouette if a neighbour is ≥1.5-4.5% further away (only the nearer surface draws the line) or is
sky; creases from normal differences draw at 70%. Line colour = mix(deep plum `#120b14`, 0.36× the surface colour).
`outl > 5` is a debug mode painting detection as red/green.

## 5. Characters (unchanged engine, two POC options)
- Characters are the existing Ink Shorts 2D rig (`character.js` / `people.js` / `poses.js`), drawn every frame
  onto a canvas texture on a plane ("card", `S.person` → `S.card2d`). Cards normally **turn to face the camera**.
- POC options on `S.person` (`set3d.js`): `yaw` (fixed facing), `clip` (draw only an ellipse of the character),
  `after(g, k)` (draw extra 2D on top), `depthBias` (v1.1.0). `V.cardLight = true`: the card's shading side is
  computed from the sun and nearby lamps; out-of-focus cards get a canvas blur (approximate DOF).
- `character.js`: `c.cloth = 'matte'` replaces the gloss streak on the torso with soft cloth shading (per character).

## 6. 2D characters and 3D props
Implemented in the scene scripts, not the engine:
- **Hand → world**: an arm entry `{ h: [x, y], prop: fn }` makes the rig call `fn(h)` while drawing; `fn` reads
  the canvas transform (`g.getTransform()`) to get the hand's card-pixel position; after cards are placed,
  `V.afterCards(t, cam)` converts card pixels to world with `card.mesh.localToWorld((u - .5) * w, v * h, 0)`.
- **Saloon jug** (round 3-9 method): the jug follows that world point (offset 0.055 sideways, −0.085 down); a second
  card of the same character clipped to the hand draws a dark "fist" over the handle.
- **Courtroom gavel** (round 12 method, current): the hand path is defined directly in **world positions**
  (`HW` in `court/scene.js`); the gavel is placed at it; the judge's body card is fixed-facing and seated in the
  chair; the gavel arm is a **3D tube** (`TubeGeometry`, radius 0.011) from the card's shoulder point to the hand,
  ending in a small sphere (plain stick end). The rig's own left arm is collapsed to the shoulder.
  Details and limits: `INTERACTIONS.md`.

## 7. Animation, cameras, timing
- `SCENE = { dur, shots: [{ t, back: () => V.render(...) }] }`; `player.js` sets `TNOW` and calls the shot.
- Cameras are functions of time in each scene script: fixed presets (`CC` / `R3CAMS` tables) or keyframed paths
  (`PATH` with `ss2` easing between presets). Character motion: rig poses as functions of `t` (`POSE.sitDown`,
  `EXPR`, arm targets); the gavel action is a piecewise function `ACT(u)` of time since `TI`.
- Light modes: `?lm=day|lamp|mix` switch sun/shade colours and lamp strengths at load.

## 8. Rendering to video
`render.mjs` (main plugin, unmodified): launches headless Chrome/Edge with GPU, opens the page with `res = quality/1080`,
waits for `window.ready`, calls `renderFrame(t)` for `t = from + f/30`, pipes PNGs to ffmpeg
(`libx264 -crf 17 -preset medium yuv420p`), 30 fps. 1080 quality = 1080×1920 (CONFIG aspect 9:16). `--stills`
writes PNGs instead. No audio was used in the POC.
