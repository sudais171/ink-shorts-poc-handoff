P="$(cd "$(dirname "$0")" && pwd)"   # the _poc folder
cd "$P/court"
R="node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080"
for c in g sd c; do $R --query "cam=$c&ti=0" --stills "0.3,0.9,1.2,1.5,1.8,2.2,3.15,3.6,4.2" --frames-dir out/r12_$c >/dev/null 2>&1; done
for m in day lamp mix; do for c in w b p; do $R --query "cam=$c&lm=$m" --stills "0.3" --frames-dir out/R12_${c}_$m >/dev/null 2>&1; done; done
$R --query "cam=w&vig=.3&bk=1" --stills "0.3" --frames-dir out/R12_w_before >/dev/null 2>&1
$R --query "cam=p&vig=.3&bk=1" --stills "0.3" --frames-dir out/R12_p_before >/dev/null 2>&1
$R --query "cam=g&ti=0" --stills "2.6" --frames-dir out/R12_coat >/dev/null 2>&1
cd "$P/scene3"
node ../../ink-shorts-studio/kit/tools/render.mjs --page index.html --quality 1080 --query "set=hero5&cam=b&lm=mix" --stills "2.6" --frames-dir out/R12_saloon_check >/dev/null 2>&1
python -I -c "
from PIL import Image, ImageChops, ImageStat
a = Image.open('out/R9_b_mix/t2.60.png').convert('RGB'); b = Image.open('out/R12_saloon_check/t2.60.png').convert('RGB')
d = ImageChops.difference(a, b); print('saloon diff mean', [round(x, 3) for x in ImageStat.Stat(d).mean], 'max', max(x[1] for x in d.getextrema()))"
