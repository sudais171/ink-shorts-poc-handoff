P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/scene3"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for c in a b k d g h s q e; do $R --query "set=hero4&cam=$c" --stills "2.6" --frames-dir out/R7_$c >/dev/null 2>&1; done
for c in q s g e; do $R --query "set=hero3&cam=$c" --stills "2.6" --frames-dir out/R6_$c >/dev/null 2>&1; done
for m in day lamp mix; do $R --query "set=hero4&cam=b&lm=$m" --stills "2.6" --frames-dir out/R7L_$m >/dev/null 2>&1; done
t0=$(date +%s); $R --query "set=hero4&cam=through" --from 0 --to 6 --out out/round7_through.mp4 > out/round7.log 2>&1; echo "video $(( $(date +%s) - t0 )) s"
