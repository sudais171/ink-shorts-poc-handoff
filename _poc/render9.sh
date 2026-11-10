P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/turntable"
node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 720 --query "prop=jug5.glb&h=.15" --stills "0.5,1.5,2.5,3.5" --frames-dir out/jug5 >/dev/null 2>&1
cd "$P/scene3"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
$R --query "set=hero5&cam=c" --stills "0.5,1.05,2.6,3.45,4.9" --frames-dir out/J_new >/dev/null 2>&1
for m in day lamp mix; do for c in b q2; do $R --query "set=hero5&cam=$c&lm=$m" --stills "2.6" --frames-dir out/R9_${c}_$m >/dev/null 2>&1; done; done
for c in s g a k; do $R --query "set=hero5&cam=$c" --stills "2.6" --frames-dir out/R9_$c >/dev/null 2>&1; done
t0=$(date +%s); $R --query "set=hero5&cam=through" --from 0 --to 6 --out out/round9_through.mp4 > out/round9.log 2>&1; echo "video $(( $(date +%s) - t0 )) s"
