$dir = "$PSScriptRoot\scene"; $rm = "$PSScriptRoot\..\ink-shorts-studio\kit\tools\render.mjs"; $res = @()
function Bench($q, $name, $to) {
  $t0 = Get-Date
  $p = Start-Process node -ArgumentList "`"$rm`" --page index.html --query `"$q`" --from 0 --to $to --quality 1080 --out out/bench-$name.mp4" -WorkingDirectory $dir -PassThru -NoNewWindow -RedirectStandardOutput "$dir\out\bench-$name.log" -RedirectStandardError "$dir\out\bench-$name.err"
  $peak = 0; $first = $null
  while (-not $p.HasExited) { $ids = (Get-CimInstance Win32_Process -Filter "Name='chrome.exe' or Name='msedge.exe'" | ? { $_.CommandLine -match 'remote-debugging' }).ProcessId
    if ($ids) { $m = (Get-Process -Id $ids -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum; if ($m -gt $peak) { $peak = $m } }
    if (-not $first -and (Test-Path "$dir\out\bench-$name.log") -and ((Get-Content "$dir\out\bench-$name.log" -Raw) -match 'frame 0/')) { $first = ((Get-Date) - $t0).TotalSeconds }
    Start-Sleep -Milliseconds 400 }
  $tt = ((Get-Date) - $t0).TotalSeconds; $n = [int](30 * $to)
  "{0,-10} load+first frame {1,5:N1}s | total {2,6:N1}s | {3:N2} s/frame after load | peak RAM {4:N0} MB" -f $name, $first, $tt, (($tt - $first) / $n), ($peak / 1MB)
}
Bench "x=1" "full" 6
Bench "noshadow=1" "noshadow" 2
Bench "notex=1" "notex" 2
Bench "nochar=1" "nochar" 2
Bench "still=1" "still" 2
