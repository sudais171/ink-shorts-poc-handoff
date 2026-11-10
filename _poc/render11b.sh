P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/court"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for c in g sd; do $R --query "cam=$c&ti=0" --stills "0.3,0.9,1.2,1.5,1.8,2.2,3.15,3.6,4.2" --frames-dir out/r11_$c >/dev/null 2>&1; done
$R --query "cam=w&bounce=0" --stills "0.3" --frames-dir out/R11_w_nobounce >/dev/null 2>&1
$R --query "cam=p&bounce=0" --stills "0.3" --frames-dir out/R11_p_nobounce >/dev/null 2>&1
for m in day lamp mix; do for c in w b p; do $R --query "cam=$c&lm=$m" --stills "0.3" --frames-dir out/R11_${c}_$m >/dev/null 2>&1; done; done
for c in ws e c; do $R --query "cam=$c" --stills "0.3" --frames-dir out/R11_$c >/dev/null 2>&1; done
$R --query "cam=g&ti=0&coat=matte" --stills "2.6" --frames-dir out/coat_matte >/dev/null 2>&1
