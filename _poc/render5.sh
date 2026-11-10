P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/lightbox"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for z in sun lamp shade; do $R --query "zone=$z" --stills "0.2" --frames-dir out/W_$z >/dev/null 2>&1; done
cd "$P/scene3"
for c in a b d k e f g h p; do $R --query "set=hero2&cam=$c" --stills "2.6" --frames-dir out/R5_$c >/dev/null 2>&1; done
$R --query "set=hero2&cam=c" --stills "0.5,1.05,2.6,3.45,4.9" --frames-dir out/R5_jug >/dev/null 2>&1
t0=$(date +%s); $R --query "set=hero2&cam=move" --from 0 --to 6 --out out/round5.mp4 > out/round5.log 2>&1; echo "video $(( $(date +%s) - t0 )) s"
