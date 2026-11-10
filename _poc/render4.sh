P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/scene3"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for c in a b d e f g h; do $R --query "set=hero&cam=$c" --stills "2.6" --frames-dir out/R4_hero_$c >/dev/null 2>&1; done
for c in a e f g; do $R --query "set=ph&cam=$c" --stills "2.6" --frames-dir out/R4_ph_$c >/dev/null 2>&1; done
$R --query "set=ph&cam=a&outl=0.0001" --stills "2.6" --frames-dir out/R4_nooutline >/dev/null 2>&1
$R --query "set=hero&cam=b&light=old" --stills "0.5" --frames-dir out/R4_lightold >/dev/null 2>&1
$R --query "set=hero&cam=b" --stills "0.5" --frames-dir out/R4_lightnew >/dev/null 2>&1
$R --query "set=hero&cam=c" --stills "0.5,1.05,2.6,3.45,4.9" --frames-dir out/R4_jug >/dev/null 2>&1
t0=$(date +%s); $R --query "set=hero&cam=move" --from 0 --to 6 --out out/round4.mp4 > out/round4.log 2>&1; echo "video $(( $(date +%s) - t0 )) s"
ls out | grep R4_ | tr '\n' ' '
