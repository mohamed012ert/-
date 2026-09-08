# ============================================================
# Image optimizer - downscale heavy images and create missing
# fallback thumbnails. Originals are kept in imgs/original/.
# Run: powershell -ExecutionPolicy Bypass -File tools\optimize-images.ps1
# ============================================================
Add-Type -AssemblyName System.Drawing

$imgs = Join-Path $PSScriptRoot '..\imgs'
$orig = Join-Path $imgs 'original'
$pr2  = Join-Path $imgs 'pr2'
New-Item -ItemType Directory -Force -Path $orig | Out-Null
New-Item -ItemType Directory -Force -Path $pr2  | Out-Null

# Keep originals once
if (-not (Test-Path (Join-Path $orig '1.jpg')))  { Copy-Item (Join-Path $imgs '1.jpg')  (Join-Path $orig '1.jpg')  -Force }
if (-not (Test-Path (Join-Path $orig 'kh.png'))) { Copy-Item (Join-Path $imgs 'kh.png') (Join-Path $orig 'kh.png') -Force }

function Save-Jpeg($bitmap, $path, $quality) {
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)
  $bitmap.Save($path, $enc, $ep)
}

# Scale helper: dispose source BEFORE overwriting the original file
function Scale-Image($srcPath, $dstPath, $maxDim) {
  $src = [System.Drawing.Image]::FromFile($srcPath)
  $scale = [Math]::Min(1.0, $maxDim / [Math]::Max($src.Width, $src.Height))
  $w = [int]($src.Width * $scale); $h = [int]($src.Height * $scale)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($src, 0, 0, $w, $h)
  $g.Dispose(); $src.Dispose(); $bmp.Dispose() | Out-Null
  # read fresh from file so we can overwrite
  return $bmp
}

# Build-and-save 16:9 branded placeholder (used as lesson thumb fallback)
function New-Fallback($path, $jpeg) {
  $bmp = New-Object System.Drawing.Bitmap(640, 360)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0,0)),
    (New-Object System.Drawing.Point(640,360)),
    [System.Drawing.Color]::FromArgb(26,41,128),
    [System.Drawing.Color]::FromArgb(38,208,206))
  $g.FillRectangle($brush, 0, 0, 640, 360)
  $font = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.DrawString('Physics', $font, $textBrush, (New-Object System.Drawing.RectangleF(0,0,640,360)), $sf)
  $g.Dispose(); $brush.Dispose()
  if ($jpeg) { Save-Jpeg $bmp $path 80 } else { $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png) }
  $bmp.Dispose()
}

# 1) Teacher photo (727KB) -> max width 480, quality 80
$src = [System.Drawing.Image]::FromFile((Join-Path $imgs '1.jpg'))
$scale = [Math]::Min(1.0, 480.0 / [Math]::Max($src.Width, 1))
$w = [int]($src.Width * $scale); $h = [int]($src.Height * $scale)
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($src, 0, 0, $w, $h)
$g.Dispose()
$src.Dispose()          # release the handle BEFORE overwriting
Save-Jpeg $bmp (Join-Path $imgs '1.jpg') 80
$bmp.Dispose()

# 2) Logo (277KB) -> max 256px (displayed 42-118px only)
$src = [System.Drawing.Image]::FromFile((Join-Path $imgs 'kh.png'))
$scale = [Math]::Min(1.0, 256.0 / [Math]::Max($src.Width, $src.Height))
$w = [int]($src.Width * $scale); $h = [int]($src.Height * $scale)
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($src, 0, 0, $w, $h)
$g.Dispose()
$src.Dispose()          # release the handle BEFORE overwriting
$bmp.Save((Join-Path $imgs 'kh.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 3) 16:9 branded placeholders for lesson cards (were missing -> broken previews)
New-Fallback (Join-Path $pr2 '1.jpg') $true
New-Fallback (Join-Path $pr2 '2.png') $false

Write-Output 'Images optimized. Originals kept in imgs/original/.'