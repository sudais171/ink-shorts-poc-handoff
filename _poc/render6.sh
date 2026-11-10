P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/turntable"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 720"
for p in "chair3.glb .6" "cabinet3.glb .5" "table3.glb .44"; do set -- $p; $R --query "prop=$1&h=$2" --stills "0.5,1.5,2.5,3.5" --frames-dir "out/${1%.glb}" >/dev/null 2>&1; done
cd "$P/lightbox"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for z in sun lamp shade; do $R --query "zone=$z" --stills "0.2" --frames-dir out/X_$z >/dev/null 2>&1; done
cd "$P/scene3"
for c in b k a d f; do $R --query "set=hero3&cam=$c" --stills "2.6" --frames-dir out/R6_$c >/dev/null 2>&1; done
t0=$(date +%s); $R --query "set=hero3&cam=orbit&nochar=1" --from 0 --to 6 --out out/round6_orbit.mp4 > out/round6.log 2>&1; echo "video $(( $(date +%s) - t0 )) s"
