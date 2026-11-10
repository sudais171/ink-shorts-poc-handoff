P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
cp engine/set3d.js engine/set3d.r8.js; cp engine/set3d.round7.js engine/set3d.js
cd scene3
$R --query "set=hero4&cam=q2" --stills "2.6" --frames-dir out/B7_q2 >/dev/null 2>&1
for m in day lamp; do $R --query "set=hero4&cam=h&lm=$m" --stills "2.6" --frames-dir out/B7_h_$m >/dev/null 2>&1; done
cd ..; cp engine/set3d.r8.js engine/set3d.js; cd scene3
for m in day lamp mix; do
  for c in q2 h b; do $R --query "set=hero5&cam=$c&lm=$m" --stills "2.6" --frames-dir out/R8_${c}_$m >/dev/null 2>&1; done
done
for c in s g c a; do $R --query "set=hero5&cam=$c" --stills "2.6" --frames-dir out/R8_$c >/dev/null 2>&1; done
t0=$(date +%s); $R --query "set=hero5&cam=through" --from 0 --to 6 --out out/round8_through.mp4 > out/round8.log 2>&1; echo "video $(( $(date +%s) - t0 )) s"
