$dir = "$PSScriptRoot\court"; $rm = "$PSScriptRoot\..\ink-shorts-studio\kit\tools\render.mjs"
$t0 = Get-Date
$p = Start-Process node -ArgumentList "`"$rm`" --page index.html --query `"cam=move`" --from 0 --to 13 --quality 1080 --out out/round12_court.mp4" -WorkingDirectory $dir -PassThru -NoNewWindow -RedirectStandardOutput "$dir\out\round12.log" -RedirectStandardError "$dir\out\round12.err"
$peak = 0; $first = $null
while (-not $p.HasExited) { $ids = (Get-CimInstance Win32_Process -Filter "Name='chrome.exe' or Name='msedge.exe'" | ? { $_.CommandLine -match 'remote-debugging' }).ProcessId
  if ($ids) { $m = (Get-Process -Id $ids -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum; if ($m -gt $peak) { $peak = $m } }
  if (-not $first -and ((Get-Content "$dir\out\round12.log" -Raw -ErrorAction SilentlyContinue) -match 'frame 0/')) { $first = ((Get-Date) - $t0).TotalSeconds }
  Start-Sleep -Milliseconds 500 }
$tt = ((Get-Date) - $t0).TotalSeconds
"load+first {0:N1}s | total {1:N0}s | {2:N2} s/frame | peak RAM {3:N0} MB" -f $first, $tt, (($tt - $first) / 390), ($peak / 1MB)
