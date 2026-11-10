# 2D characters with 3D props: what works and what is compromised

Characters stay the existing Ink Shorts 2D rig, drawn on a flat textured plane ("card") inside the 3D scene.
Everything below is implemented in `court/scene.js` (judge + gavel, final method) and `scene3/scene.js` (saloon
jug, earlier method), plus engine options in `engine/set3d.js`.

## Card facing
- **Camera-facing (engine default)**: the card turns to face the camera every frame. Looks right from any angle,
  but anything derived from the card's geometry (a hand position) moves in the world when the camera moves.
- **Fixed-facing (`yaw` option, round 11)**: the card keeps one world orientation. World positions are stable for all
  cameras; from a steep angle the character is visibly a flat, foreshortened cut-out. The judge uses `yaw: 0`.
- Card shadows: the shadow pass always turns person cards to face the sun (also fixed-yaw ones), so the shadow is
  the character's front silhouette; not verified for steep sun angles.

## Hand → world (two methods)
1. **Rig-derived (saloon jug, rounds 3-9)**: an arm `{ h: [rigX, rigY], prop: fn }`; `fn` captures the hand's card
   pixel via `g.getTransform()`; `afterCards` maps it to world with `card.mesh.localToWorld`. The mapping from rig
   units to world is **linear for a given card/camera**; keyframes were found by measuring 3 probe points
   (`window.HTEST`) and solving. Accurate only for the camera it was solved with (camera-facing card).
2. **World-defined (judge, round 12, current)**: the hand path `HW` is written directly in world coordinates on the
   desk; the gavel is placed at it, so **grip and strike contact are exact by construction** (measured: grip at the
   resting gavel's grip point; head bottom 0.826 = block top 0.826, head x −0.38 = block x, both strikes).
   The judge's own drawn left arm is collapsed to his shoulder (`arms[0] = { h: [412, 1186] }`); its shoulder
   pixel is captured and converted to world; a 3D tube (2 segments, length 0.205 each, elbow bent out/down by a
   simple 2-bone solve, radius 0.011, colour `#2a2134`) runs from shoulder to hand and ends in a sphere = the cast's
   plain stick end. No drawn hand (the round 10-12 fist/cuff drawing is off unless `?fist=1`).

## Prop attachment, pickup, put-down
- The gavel's group origin is its grip; handle along +x, head 0.14 to −x. State per time from `ACT(u)`:
  `held`, `th` (swing angle about z), `lie` (0 upright → 1 lying on its side). Not held → fixed `REST` position.
- Pickup and put-down are positional (no physics): at the switch time the hand is at `REST`, so there is no pop.
- Saloon jug: same idea with the rig-derived hand; jug offset sideways from the hand; drawn fist overlay card.

## Seating and layering (round 12)
- Judge card at z −2.08 (0.12 in front of the backrest), hips at the cushion top (`seat: .345` + dais 0.25 =
  0.595 measured cushion top). Chair arms and the bench occlude him naturally from all three test cameras.
- The 3D arm crosses the 0.36 gap from his torso plane to the desk; this is why the arm is not drawn on the card.

## Known limitations (do not hide)
- A flat character cannot represent depth: any limb reaching toward/away from the camera needs a 3D stand-in
  (built only for the judge's left arm). The other arm is still drawn on the card.
- Fixed-facing cards look flat from steep side angles; camera-facing cards break world-accurate attachment. The judge
  uses fixed facing; walkers/standing characters in the plugin use camera facing.
- The 3D arm is a constant-radius tube: no sleeve shape, no cuff, no hand pose. Looks like a stick arm (intended).
- No collision: the arm tube or a prop can intersect furniture if keyframes are wrong. Contact is checked by
  measurement scripts, not enforced.
- The hand path `HW` is hand-authored per action; there is no general reach/IK targeting API.
- Saloon jug still uses method 1 + the rejected fist drawing; it would break from a side camera.
- Card DOF is a 2D canvas blur, not true depth blur.
- `opt.clip` / `opt.after` cards (jug fist) are drawn as extra full-character cards clipped to a region: costly and hacky.
