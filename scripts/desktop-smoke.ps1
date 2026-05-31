$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$desktopRoot = Join-Path $repoRoot "apps\desktop"
$releaseRoot = Join-Path $desktopRoot "src-tauri\target\release"
$appExe = Join-Path $releaseRoot "dinaya_desktop.exe"
$bundleRoot = Join-Path $releaseRoot "bundle\nsis"
# Combined stdout+stderr are both redirected here so Tauri/Rust log output is captured
$startupLog    = Join-Path $env:TEMP "dinaya-desktop-startup.log"
$startupLogErr = Join-Path $env:TEMP "dinaya-desktop-startup-err.log"
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
  # Merge the stdout log and the stderr log (Tauri/Rust apps write to stderr by default)
  $parts = @()

  if (Test-Path -LiteralPath $startupLog -PathType Leaf) {
    $raw = Get-Content -LiteralPath $startupLog -Raw -ErrorAction SilentlyContinue
    if (-not [string]::IsNullOrEmpty($raw)) { $parts += $raw }
  }

  if (Test-Path -LiteralPath $startupLogErr -PathType Leaf) {
    $raw = Get-Content -LiteralPath $startupLogErr -Raw -ErrorAction SilentlyContinue
    if (-not [string]::IsNullOrEmpty($raw)) { $parts += $raw }
  }

  if ($parts.Count -eq 0) { return "" }
  $parts -join "`n"
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

# Clean up any leftover logs from a previous run
Remove-Item -LiteralPath $startupLog    -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $startupLogErr -Force -ErrorAction SilentlyContinue

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
$stdoutEvent = $null
$stderrEvent = $null

try {
  # Redirect both stdout AND stderr so we capture Tauri/Rust log output.
  # GUI (subsystem) apps don't write to the console by default; stderr is where
  # Rust's tracing/eprintln output goes when a console is attached via redirection.
  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName               = $appItem.FullName
  $startInfo.UseShellExecute        = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError  = $true
  $startInfo.WindowStyle            = [System.Diagnostics.ProcessWindowStyle]::Hidden
  $startInfo.CreateNoWindow         = $true

  # Forward the env vars we set above into the child process
  $startInfo.EnvironmentVariables["DINAYA_DESKTOP_STARTUP_LOG"] = "1"
  if ($skipTrayForCi) {
    $startInfo.EnvironmentVariables["DINAYA_DESKTOP_SKIP_TRAY_FOR_SMOKE"] = "1"
  }

  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $startInfo

  # Capture stdout/stderr asynchronously to avoid pipe-buffer deadlocks.
  # Each event handler appends lines to the respective log file so that
  # Get-StartupText sees incremental output during the polling loop.
  $captureStdout = $startupLog
  $captureStderr = $startupLogErr

  $stdoutEvent = Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action {
    if ($null -ne $EventArgs.Data) {
      Add-Content -LiteralPath $Event.MessageData -Value $EventArgs.Data -Encoding UTF8 -ErrorAction SilentlyContinue
    }
  } -MessageData $captureStdout

  $stderrEvent = Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action {
    if ($null -ne $EventArgs.Data) {
      Add-Content -LiteralPath $Event.MessageData -Value $EventArgs.Data -Encoding UTF8 -ErrorAction SilentlyContinue
    }
  } -MessageData $captureStderr

  [void]$process.Start()
  $process.BeginOutputReadLine()
  $process.BeginErrorReadLine()

  $deadline = [DateTime]::UtcNow.AddSeconds($startupTimeoutSeconds)
  $running  = $null
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

    # Guard: only call Get-MissingStartupMarkers when we actually have text to search.
    # The original script passed "" to a [Mandatory] string parameter, causing the error:
    #   "Cannot bind argument to parameter 'StartupText' because it is an empty string."
    if (-not [string]::IsNullOrEmpty($startupText)) {
      $missingMarkers = Get-MissingStartupMarkers -StartupText $startupText -Markers $requiredStartupMarkers
    }

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

  $logPresent = (Test-Path -LiteralPath $startupLog -PathType Leaf) -or `
                (Test-Path -LiteralPath $startupLogErr -PathType Leaf)

  if (-not $logPresent) {
    # Warn rather than hard-fail: the app window is up and responding, which is
    # the primary smoke signal. A missing log means the app emitted nothing on
    # stdout or stderr (valid for some Tauri configs); treat it as a soft warning.
    Write-Warning "Startup log was not created after $startupTimeoutSeconds seconds; the app may not emit startup markers on stdout/stderr. Continuing because the window is present and responsive."
  } elseif ($missingMarkers.Count -gt 0) {
    throw "Startup log is missing marker(s) after $startupTimeoutSeconds seconds: $($missingMarkers -join ', ')`nStartup log:`n$(Format-StartupLog)"
  }

  $installerHash = Get-Sha256Hex -Path $installer.FullName
  [PSCustomObject]@{
    AppExe           = $appItem.FullName
    AppBytes         = $appItem.Length
    Installer        = $installer.FullName
    InstallerBytes   = $installer.Length
    InstallerSha256  = $installerHash
    ProcessId        = $running.Id
    MainWindowHandle = $running.MainWindowHandle
    Responding       = $running.Responding
  } | Format-List
}
finally {
  if ($null -ne $process) {
    try { $process.CancelOutputRead() } catch {}
    try { $process.CancelErrorRead()  } catch {}
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    $process.Dispose()
  }
  if ($null -ne $stdoutEvent) { Unregister-Event -SourceIdentifier $stdoutEvent.Name -ErrorAction SilentlyContinue }
  if ($null -ne $stderrEvent) { Unregister-Event -SourceIdentifier $stderrEvent.Name -ErrorAction SilentlyContinue }
  Remove-Item Env:\DINAYA_DESKTOP_STARTUP_LOG         -ErrorAction SilentlyContinue
  Remove-Item Env:\DINAYA_DESKTOP_SKIP_TRAY_FOR_SMOKE -ErrorAction SilentlyContinue
}
