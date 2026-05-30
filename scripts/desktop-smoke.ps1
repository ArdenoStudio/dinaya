$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$desktopRoot = Join-Path $repoRoot "apps\desktop"
$releaseRoot = Join-Path $desktopRoot "src-tauri\target\release"
$appExe = Join-Path $releaseRoot "dinaya_desktop.exe"
$bundleRoot = Join-Path $releaseRoot "bundle\nsis"
$startupLog = Join-Path $env:TEMP "dinaya-desktop-startup.log"
$startupTimeoutSeconds = 30

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

function Get-StartupText {
  if (-not (Test-Path -LiteralPath $startupLog -PathType Leaf)) {
    return ""
  }

  Get-Content -LiteralPath $startupLog -Raw
}

function Format-StartupLog {
  $startupText = Get-StartupText
  if ([string]::IsNullOrWhiteSpace($startupText)) {
    return "<startup log is empty or missing>"
  }

  $startupText.TrimEnd()
}

function Get-MissingStartupMarkers {
  param(
    [Parameter(Mandatory = $true)][string]$StartupText,
    [Parameter(Mandatory = $true)][string[]]$Markers
  )

  @($Markers | Where-Object { $StartupText -notmatch [regex]::Escape($_) })
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
$skipTrayForCi = $env:GITHUB_ACTIONS -eq "true"
if ($skipTrayForCi) {
  $env:DINAYA_DESKTOP_SKIP_TRAY_FOR_SMOKE = "1"
}

$requiredStartupMarkers = @(
  if ($skipTrayForCi) { "tray setup skipped for smoke" } else { "tray setup complete" }
  "main webview found"
  "global shortcut registered: Ctrl+Shift+K"
)

$process = $null

try {
  $process = Start-Process -FilePath $appItem.FullName -PassThru -WindowStyle Hidden
  $deadline = [DateTime]::UtcNow.AddSeconds($startupTimeoutSeconds)
  $running = $null
  $missingMarkers = $requiredStartupMarkers

  do {
    $process.Refresh()
    if ($process.HasExited) {
      throw "Release app process exited before smoke verification completed.`nStartup log:`n$(Format-StartupLog)"
    }

    $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if (-not $running) {
      throw "Release app process was not found before smoke verification completed.`nStartup log:`n$(Format-StartupLog)"
    }

    $startupText = Get-StartupText
    $missingMarkers = Get-MissingStartupMarkers -StartupText $startupText -Markers $requiredStartupMarkers

    if ($running.Responding -and [int64]$running.MainWindowHandle -ne 0 -and $missingMarkers.Count -eq 0) {
      break
    }

    Start-Sleep -Milliseconds 500
  } while ([DateTime]::UtcNow -lt $deadline)

  if (-not $running) {
    throw "Release app process was not found before smoke verification completed.`nStartup log:`n$(Format-StartupLog)"
  }

  if (-not $running.Responding) {
    throw "Release app process is running but not responding.`nStartup log:`n$(Format-StartupLog)"
  }

  if ([int64]$running.MainWindowHandle -eq 0) {
    throw "Release app started without a main window handle.`nStartup log:`n$(Format-StartupLog)"
  }

  if (-not (Test-Path -LiteralPath $startupLog -PathType Leaf)) {
    throw "Startup log was not created after $startupTimeoutSeconds seconds; app may not have reached Tauri setup."
  }

  if ($missingMarkers.Count -gt 0) {
    throw "Startup log is missing marker(s) after $startupTimeoutSeconds seconds: $($missingMarkers -join ', ')`nStartup log:`n$(Format-StartupLog)"
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
  Remove-Item Env:\DINAYA_DESKTOP_SKIP_TRAY_FOR_SMOKE -ErrorAction SilentlyContinue
}
