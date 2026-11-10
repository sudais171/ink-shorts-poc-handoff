# Quality assurance: what exists, what it misses

## There is no automated test suite in `_poc`
Verification was done by targeted scripts and visual comparison sheets. What each actually checked:

| Check | How | Verifies | Cannot detect |
|---|---|---|---|
| Prop turntables | `turntable/` page, 4 angles, `--stills 0.5,1.5,2.5,3.5` | silhouette/construction from all sides, wrong-facing parts (caught: sideboard doors on the back) | scale in the room, lighting context |
| Light box | `lightbox/` `zone=sun\|lamp\|shade` | material colour stability under 3 lights (caught: orange→yellow washout) | room interreflection, composition |
| Contact measurement | `render.mjs --eval "renderFrame(t); JSON.stringify(...)"` printing gavel grip, head-bottom y and x vs block | grip and strike contact numerically (±1 mm) | visual overlap with the drawn character |
| Hand mapping probe | `window.HTEST=[x,y]` + eval | linear rig→world mapping | non-linearity beyond the probe range |
| Debug renders | `outl=9` (edge detection as colour), `--eval-png` with room hidden, material colour forced (`dbg`) | which object a visual artefact belongs to (caught: the "gold" line was the wood moulding) | - |
| Pixel regression | PIL `ImageChops.difference` of a saloon frame vs a stored frame | saloon unchanged after shared-engine edits (round 12: max diff 0) | only the one frame/camera compared |
| Brightness metrics | PIL `ImageStat` means of regions (pew vs bench vs judge) | relative readability of areas | aesthetics |
| Comparison sheets | `sheets*.py` (PIL contact sheets, same cameras before/after + reference frames) | human judgement | anything nobody looks at |
| Main plugin tools (not run on POC videos) | `kit/tools/check.py` (black/flash/freeze/loudness/format), PROP CHECK in render.mjs | technical faults | visual quality |

## Proposed visual QA process (practical)
1. **Asset gate**: every new prop gets a turntable sheet (4 angles) + light-box sheet; reject if any angle shows
   missing parts, floating parts, or colour drift between sun/lamp/shade.
2. **Scale/contact gate**: script prints, per prop, bottom-y vs the surface it should stand on (from `tops_*.json`)
   and flags gaps > 5 mm or interpenetration; for interactions, print grip/contact distances at key times.
3. **Light gate**: render the same 3 cameras in `day/lamp/mix`; script measures mean luminance of named regions
   (focus vs surroundings) and flags clipped (>250) or crushed (<8) pixel ratios per material mask.
4. **Composition/framing gate**: per shot, project the subject's bounding box to screen; flag subjects cut by frame
   edges or < 15% of frame height; flag foreground occluders over the subject.
5. **Interaction gate**: render each action from the cinematic camera **and** a 40-60° side camera; a reviewer checks
   grip, contact and seating; scripted numbers must match within tolerance.
6. **Continuity gate**: hash/pixel-diff static regions between consecutive shots in the same set; flag props that
   move or vanish without an action.
7. **Regression gate**: stored reference frames for every finished room; pixel diff after any shared-engine change.
8. **Performance gate**: every video logs load time, s/frame and peak renderer RAM (`vid10.ps1` pattern); flag
   > 1.5 s/frame or > 1.5 GB on the T470.
9. **Human review**: one contact sheet against the reference videos; the user judges.

## Known unresolved issues
- Texture generator snippets for `assets2/*.png` were not saved; textures can be used but not regenerated exactly.
- Saloon jug: old interaction method + drawn fist (inconsistent with the judge).
- `set3d.js` contains several superseded code paths (bakeMode 1/2, r4 exposure curves, `hiCap`, debug `outl > 5`).
- Light limit raised to 6 only in the POC engine; more lights need a different approach (forward+ or baked).
- Scene scripts are large single files with location-specific code mixed with patterns that should be modules.
- The 13-second courtroom video after the "stick end" change (round 12b) was **not re-rendered**; stills only.
- Character card shadow for the fixed-yaw judge not specifically inspected.
