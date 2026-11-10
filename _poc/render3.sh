P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/scene3"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for s in kk ph st; do
  $R --query "set=$s&cam=a" --stills "2.6" --frames-dir out/F_$s_a >/dev/null 2>&1; mv out/F_$s_a out/F_${s}_a 2>/dev/null
  for c in e f g; do $R --query "set=$s&cam=$c" --stills "0.5" --frames-dir out/F_${s}_$c >/dev/null 2>&1; done
done
$R --query "set=st&cam=a" --stills "2.6" --frames-dir out/F_st_a >/dev/null 2>&1
for c in h b d; do $R --query "set=st&cam=$c" --stills "0.5" --frames-dir out/F_st_$c >/dev/null 2>&1; done
$R --query "set=st&cam=c" --stills "0.5,1.05,2.6,3.45,4.9" --frames-dir out/F_st_jug >/dev/null 2>&1
for s in kk ph; do $R --query "set=$s&cam=a" --stills "2.6" --frames-dir out/F_${s}_a >/dev/null 2>&1; done
ls out | grep "^F_"
