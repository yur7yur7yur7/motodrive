# Transcode source MP4s into web-friendly H.264 + VP9.
# Output goes to ./photo/web/. Sources stay untouched.

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$ErrorActionPreference = 'Stop'
$project = (Get-Location).Path
$srcDir  = Join-Path $project 'photo'
$outDir  = Join-Path $srcDir 'web'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$jobs = @(
  @{ name = 'promo';           src = (Join-Path $srcDir 'promo.mp4');           short = 480 },
  @{ name = 'install-active';  src = (Join-Path $srcDir 'install-active.mp4');  short = 720 },
  @{ name = 'install-passive'; src = (Join-Path $srcDir 'install-passive.mp4'); short = 720 }
)

foreach ($j in $jobs) {
  $basename = $j.name
  $src = $j.src
  $short = $j.short
  $mp4  = Join-Path $outDir ("{0}-{1}.mp4"  -f $basename, $short)
  $webm = Join-Path $outDir ("{0}-{1}.webm" -f $basename, $short)

  if ((Test-Path $mp4) -and (Test-Path $webm)) {
    Write-Host "SKIP $basename (already encoded)"
    continue
  }

  # ffprobe csv line is "stream,WIDTH,HEIGHT". Drop the header.
  $raw = (& ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv $src) -join "`n"
  $nums = ($raw -split "[,`n]" | Where-Object { $_ -match '^\d+$' })
  $w0 = [int]$nums[0]; $h0 = [int]$nums[1]
  if ($w0 -le $h0) {
    $newW = $short
    $newH = [int]([math]::Round($h0 * $short / $w0 / 2) * 2)
  } else {
    $newH = $short
    $newW = [int]([math]::Round($w0 * $short / $h0 / 2) * 2)
  }
  $vf = "scale={0}:{1}" -f $newW, $newH
  Write-Host ("==> {0}  {1}x{2} -> {3}x{4}" -f $basename, $w0, $h0, $newW, $newH)

  if (-not (Test-Path $mp4)) {
    Write-Host "  encoding mp4 ..."
    & ffmpeg -y -hide_banner -loglevel error -i $src `
      -vf $vf `
      -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p `
      -c:a aac -b:a 96k -ac 2 `
      -movflags +faststart `
      $mp4
    if ($LASTEXITCODE -ne 0) { throw "mp4 encode failed for $basename" }
  }

  if (-not (Test-Path $webm)) {
    Write-Host "  encoding webm (vp9) ..."
    & ffmpeg -y -hide_banner -loglevel error -i $src `
      -vf $vf `
      -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -tile-columns 2 -threads 8 `
      -c:a libopus -b:a 96k -ac 2 `
      $webm
    if ($LASTEXITCODE -ne 0) { throw "webm encode failed for $basename" }
  }
}

Write-Host "DONE"
& Get-ChildItem $outDir | Format-Table Name, Length
