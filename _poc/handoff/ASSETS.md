# Assets and materials

## Design standard (full text: `_poc/ASSET_STANDARD.md`, derived from the round-4 barrel)
Nameable silhouette with one gently exaggerated feature; built from real separate parts with 2-4% gaps; structural
parts 1.3-1.6× real thickness; every edge bevelled (~1.5-2.5% of object height, 3 segments); at most three materials
(two close tones of the main material alternating between parts + one contrasting material); detail only from
construction (no texture noise); drop any detail unreadable at 1080×1920 from the usual camera distance.

## How props are built
See `court_props.py` (cleanest). Helpers (copied per script): `box/bx` (bevelled cube), `lathe` (spun profile via
bmesh), `dome`, `profile` (Y-Z outline extruded along X), `panel_front` (stiles, rails, raised field, gilt bead),
`sweep`/`bowed` (square section along a path, `heroes3.py`), bezier tubes (handles, chandelier arms), boolean
cut-outs (chair diamonds). `finish()` adds Bevel (angle 35°, 3 segments) + Weighted Normal and smooth shading.

## Materials (assigned in the renderer by name; Blender colours are placeholders)
| Kind | Saloon values (`scene3/scene.js` `R3SURF`, `R8` branch) | Courtroom (`court/scene.js` `CSURF`) | Treatment |
|---|---|---|---|
| Wood | `P_wood #d18a52`, `P_wood2 #b06a3a` + `grain2.png` world-space | `#a0603a`, `#7a4226` + grain | spec .05 (matte), light budget |
| Room wood | `S_panel/S_trim/S_beam/S_door` | same names | matte (spec .05). Saloon trim's default gloss was the round-9 "yellow ceiling line" bug |
| Metal | `S_brass #a87c34 spec .4`, `P_brass`, `P_iron #3a3f5a spec .45` | `S_gold #b8893a .4`, `P_brass .5` | metal response (less diffuse, tinted highlight) |
| Fabric | curtains/rug/velvet: painted textures | `S_curtain` velvet, `P_leather #8a2632 spec .2` | matte |
| Painted | `P_paint #3d7f8f`, `P_paint2` (sideboard), walls `wall4.png` | `S_wall court_wall.png`, `S_banner`, `S_seal` | matte |
| Glass | `S_glass alpha .18`, `P_glass alpha .42 #ffd590` | same | transparent, highlight |
| Flame | `P_flame emi 1` | same | unlit + glow |
| Glaze | `P_glaze #f2e2c0 spec .2`, `P_band` | - | soft highlight |
Outlines: post pass for everything (ARCHITECTURE.md §4). Bevels: geometry. AO: baked vertex colour.

## Assets used by the FINAL scenes
**All generated in this project** (Blender scripts above / PIL): no third-party models remain in either final scene.
- Saloon `hero5`: `downloads/hero/{table3, chair3, barrel, crate4, cabinet3, lantern, candlestick4, frame4,
  chandelier4, sconce4, jug5}.glb`.
- Courtroom: `downloads/court/{judge_bench, judge_chair, witness_stand, pew, evidence, desk_lamp, block, gavel}.glb`
  + reused `hero/{table3, chandelier4, sconce4}.glb`.
- Textures `assets2/`: generated. Three are **derived from Poly Haven CC0 photos** (median filter, posterise, recolour):
  `floor*.png` (wood_floor), `plaster.png` (painted_plaster_wall), `curtain*.png`/`court_velvet.png`
  (fabric_pattern_07). `outdoor.png` (painted landscape) and the painting canvas use it; all others are drawn in PIL.

## Third-party assets downloaded (experiments; not used in final scenes)
| Source | Items | Licence | Where |
|---|---|---|---|
| KayKit (Kay Lousberg), GitHub `KayKit-Game-Assets/KayKit-Furniture-Bits-1.0`, `-Restaurant-Bits-1.0`, `-Dungeon-Remastered-1.0` | furniture, crate, barrel, candles | CC0 1.0 (README/LICENSE and itch.io page) | `downloads/kk/` + zips |
| Poly Haven `polyhaven.com` (API `api.polyhaven.com/files/<id>`) | models: round_wooden_table_01, Rockingchair_01, wine_barrel_01, wooden_crate_01, wooden_lantern_01, painted_wooden_cabinet, jug_01, fancy_picture_frame_01, wooden_candlestick, lantern_chandelier_01; textures: wood_floor, painted_plaster_wall, dark_wooden_planks, fabric_pattern_07 | Poly Haven publishes all assets as CC0 (checked on the `wood_floor` page; the API's per-asset licence field was empty for the models) | `downloads/ph/`, `downloads/*.jpg` |
| Blender-remeshed Poly Haven (round 3, abandoned) | 8 models | derived from CC0 | `downloads/st/` |
| three.js r159 + GLTFLoader/BufferGeometryUtils (jsDelivr) | engine | MIT | `engine/` |
| Blender 4.2.23 LTS | tool | GPL (tool only) | `tools/` |

## Limitations / inconsistencies
- Prop helper functions are duplicated across 5 scripts (no shared module).
- Saloon table/chair/cabinet use `P_paint` names etc. handled per scene table; a material name missing from a
  scene's table silently falls back to the Blender placeholder colour.
- The saloon jug interaction still uses the round-3 drawn **fist overlay** that the user rejected for the judge
  (round 12, "plain stick end"); not updated.
- Generated textures have no saved generator scripts (inline PIL during the session).
- Poly Haven-derived textures inherit photographic structure (blurred/posterised), the only non-drawn surfaces left.
