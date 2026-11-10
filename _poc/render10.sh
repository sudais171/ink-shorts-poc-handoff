P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/court"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for c in w b ws p e c; do $R --query "cam=$c" --stills "0.3" --frames-dir out/C_$c >/dev/null 2>&1; done
for m in day lamp; do for c in w b; do $R --query "cam=$c&lm=$m" --stills "0.3" --frames-dir out/C_${c}_$m >/dev/null 2>&1; done; done
cd "$P/turntable"
node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 720 --query "prop=../court/judge_bench.glb&h=.554&pal=court&d=3.4" --stills "0.5,1.5,2.5,3.5" --frames-dir out/c_judge_bench >/dev/null 2>&1
