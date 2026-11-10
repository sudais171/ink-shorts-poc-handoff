P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/court"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
$R --query "cam=w&bounce=0" --stills "0.3" --frames-dir out/R11_w_nobounce >/dev/null 2>&1
for m in day lamp mix; do for c in w b p; do $R --query "cam=$c&lm=$m" --stills "0.3" --frames-dir out/R11_${c}_$m >/dev/null 2>&1; done; done
for c in ws e c; do $R --query "cam=$c" --stills "0.3" --frames-dir out/R11_$c >/dev/null 2>&1; done
