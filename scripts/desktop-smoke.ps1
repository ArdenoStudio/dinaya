$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$desktopRoot = Join-Path $repoRoot "apps\desktop"
$releaseRoot = Join-Path $desktopRoot "src-tauri\target\release"
$appExe = Join-Path $releaseRoot "dinaya_desktop.exe"
$bundleRoot = Join-Path $releaseRoot "bundle\nsis"
$startupLog = Join-Path $env:TEMP "dinaya-desktop-startup.log"

function Assert-File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Label,
    [int64]$MinimumBytes = 1
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Label was not found at $Path"
  }

  $item = Get-Item -LiteralPath $Path
  if ($item.Length -lt $MinimumBytes) {
    throw "$Label is unexpectedly small: $($item.Length) bytes at $Path"
  }

  $item
}

function Get-Sha256Hex {
  param([Parameter(Mandatory = $true)][string]$Path)

  $stream = [System.IO.File]::OpenRead($Path)
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    ($sha256.ComputeHash($stream) | ForEach-Object { $_.ToString("x2") }) -join ""
  }
  finally {
    $stream.Dispose()
    $sha256.Dispose()
  }
}

$appItem = Assert-File -Path $appExe -Label "Release app executable" -MinimumBytes 1000000

if (-not (Test-Path -LiteralPath $bundleRoot -PathType Container)) {
  throw "NSIS bundle folder was not found at $bundleRoot"
}

$installer = Get-ChildItem -LiteralPath $bundleRoot -Filter "*.exe" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $installer) {
  throw "No NSIS setup executable was found in $bundleRoot"
}

if ($installer.Length -lt 1000000) {
  throw "NSIS setup executable is unexpectedly small: $($installer.Length) bytes at $($installer.FullName)"
}

Remove-Item -LiteralPath $startupLog -Force -ErrorAction SilentlyContinue
$env:DINAYA_DESKTOP_STARTUP_LOG = "1"
$process = $null

try {
  $process = Start-Process -FilePath $appItem.FullName -PassThru -WindowStyle Hidden
  Start-Sleep -Seconds 5

  $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
  if (-not $running) {
    throw "Release app process exited before smoke verification completed."
  }

  if (-not $running.Responding) {
    throw "Release app process is running but not responding."
  }

  if ([int64]$running.MainWindowHandle -eq 0) {
    throw "Release app started without a main window handle."
  }

  if (-not (Test-Path -LiteralPath $startupLog -PathType Leaf)) {
    throw "Startup log was not created; app may not have reached Tauri setup."
  }

  $startupText = Get-Content -LiteralPath $startupLog -Raw
  foreach ($marker in @("tray setup complete", "main webview found", "global shortcut registered: Ctrl+Shift+K")) {
    if ($startupText -notmatch [regex]::Escape($marker)) {
      throw "Startup log is missing marker: $marker"
    }
  }

  $installerHash = Get-Sha256Hex -Path $installer.FullName
  [PSCustomObject]@{
    AppExe = $appItem.FullName
    AppBytes = $appItem.Length
    Installer = $installer.FullName
    InstallerBytes = $installer.Length
    InstallerSha256 = $installerHash
    ProcessId = $running.Id
    MainWindowHandle = $running.MainWindowHandle
    Responding = $running.Responding
  } | Format-List
}
finally {
  if ($process) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  Remove-Item Env:\DINAYA_DESKTOP_STARTUP_LOG -ErrorAction SilentlyContinue
}
