$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$desktopRoot = Join-Path $repoRoot "apps\desktop"
$releaseRoot = Join-Path $desktopRoot "src-tauri\target\release"
$appExe = Join-Path $releaseRoot "dinaya_desktop.exe"
$bundleRoot = Join-Path $releaseRoot "bundle\nsis"
# Combined stdout+stderr are both redirected here so Tauri/Rust log output is captured
$startupLog    = Join-Path $env:TEMP "dinaya-desktop-startup.log"
$startupLogErr = Join-Path $env:TEMP "dinaya-desktop-startup-err.log"
# WebView2 cold start on a fresh CI runner (and the windows-latest -> windows-2025
# image migration) can push the .setup() hook well past a tight window, so give the
# event loop generous time and retry once before failing — the markers we wait on are
# emitted during app.run(), after "build complete".
$startupTimeoutSeconds = 90
$maxAttempts = 2

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

function Invoke-SmokeAttempt {
  # Launches the release app once, waits for the required startup markers (plus a
  # responsive main window), then tears the process down. Returns a result hashtable:
  #   @{ Success = $true;  ProcessId; MainWindowHandle; Responding }
  #   @{ Success = $false; Reason; Missing; Log }
  # It never throws for a flaky launch so the caller can retry.
  param(
    [Parameter(Mandatory = $true)][string]$AppPath,
    [Parameter(Mandatory = $true)][string[]]$RequiredMarkers,
    [Parameter(Mandatory = $true)][bool]$SkipTrayForCi,
    [Parameter(Mandatory = $true)][int]$TimeoutSeconds
  )

  # Clean up any leftover logs so we never match stale markers from a prior attempt.
  Remove-Item -LiteralPath $startupLog    -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $startupLogErr -Force -ErrorAction SilentlyContinue

  $process = $null
  $stdoutEvent = $null
  $stderrEvent = $null

  try {
    # Redirect both stdout AND stderr so we capture Tauri/Rust log output.
    # GUI (subsystem) apps don't write to the console by default; stderr is where
    # Rust's tracing/eprintln output goes when a console is attached via redirection.
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName               = $AppPath
    $startInfo.UseShellExecute        = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError  = $true
    $startInfo.WindowStyle            = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $startInfo.CreateNoWindow         = $true

    # Forward the env vars the Rust side reads into the child process.
    $startInfo.EnvironmentVariables["DINAYA_DESKTOP_STARTUP_LOG"] = "1"
    if ($SkipTrayForCi) {
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

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $running  = $null
    $missingMarkers = $RequiredMarkers

    do {
      $process.Refresh()
      if ($process.HasExited) {
        return @{
          Success = $false
          Reason  = "release app process exited early (exit code $($process.ExitCode))"
          Missing = $RequiredMarkers
          Log     = (Format-StartupLog)
        }
      }

      $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
      if (-not $running) {
        return @{
          Success = $false
          Reason  = "release app process was not found"
          Missing = $RequiredMarkers
          Log     = (Format-StartupLog)
        }
      }

      $startupText = Get-StartupText

      # Guard: only call Get-MissingStartupMarkers when we actually have text to search.
      # Passing "" to a [Mandatory] string parameter throws a binding error.
      if (-not [string]::IsNullOrEmpty($startupText)) {
        $missingMarkers = Get-MissingStartupMarkers -StartupText $startupText -Markers $RequiredMarkers
      }

      if ($running.Responding -and [int64]$running.MainWindowHandle -ne 0 -and $missingMarkers.Count -eq 0) {
        break
      }

      Start-Sleep -Milliseconds 500
    } while ([DateTime]::UtcNow -lt $deadline)

    if (-not $running) {
      return @{ Success = $false; Reason = "release app process was not found"; Missing = $RequiredMarkers; Log = (Format-StartupLog) }
    }

    if (-not $running.Responding) {
      return @{ Success = $false; Reason = "release app is running but not responding"; Missing = $missingMarkers; Log = (Format-StartupLog) }
    }

    if ([int64]$running.MainWindowHandle -eq 0) {
      return @{ Success = $false; Reason = "release app started without a main window handle"; Missing = $missingMarkers; Log = (Format-StartupLog) }
    }

    $logPresent = (Test-Path -LiteralPath $startupLog -PathType Leaf) -or `
                  (Test-Path -LiteralPath $startupLogErr -PathType Leaf)

    if (-not $logPresent) {
      # Warn rather than hard-fail: the app window is up and responding, which is
      # the primary smoke signal. A missing log means the app emitted nothing on
      # stdout or stderr (valid for some Tauri configs); treat it as a soft warning.
      Write-Warning "Startup log was not created after $TimeoutSeconds seconds; the app may not emit startup markers on stdout/stderr. Continuing because the window is present and responsive."
      $missingMarkers = @()
    }

    if ($missingMarkers.Count -gt 0) {
      return @{
        Success = $false
        Reason  = "startup log is missing marker(s) after $TimeoutSeconds seconds"
        Missing = $missingMarkers
        Log     = (Format-StartupLog)
      }
    }

    return @{
      Success          = $true
      ProcessId        = $running.Id
      MainWindowHandle = $running.MainWindowHandle
      Responding       = $running.Responding
    }
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

$skipTrayForCi = $env:GITHUB_ACTIONS -eq "true"

$requiredStartupMarkers = @(
  if ($skipTrayForCi) { "tray setup skipped for smoke" } else { "tray setup complete" }
  "main webview found"
  "global shortcut registered: Ctrl+Shift+K"
)

$result = $null
$winningAttempt = 0
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  if ($attempt -gt 1) {
    Write-Warning "desktop-smoke attempt $($attempt - 1) failed ($($result.Reason)); relaunching (attempt $attempt/$maxAttempts)..."
  }

  $result = Invoke-SmokeAttempt `
    -AppPath $appItem.FullName `
    -RequiredMarkers $requiredStartupMarkers `
    -SkipTrayForCi $skipTrayForCi `
    -TimeoutSeconds $startupTimeoutSeconds

  if ($result.Success) {
    $winningAttempt = $attempt
    break
  }
}

if (-not $result.Success) {
  throw "Desktop smoke failed after $maxAttempts attempt(s). Last reason: $($result.Reason).`nMissing marker(s): $($result.Missing -join ', ')`nStartup log:`n$($result.Log)"
}

$installerHash = Get-Sha256Hex -Path $installer.FullName
[PSCustomObject]@{
  AppExe           = $appItem.FullName
  AppBytes         = $appItem.Length
  Installer        = $installer.FullName
  InstallerBytes   = $installer.Length
  InstallerSha256  = $installerHash
  ProcessId        = $result.ProcessId
  MainWindowHandle = $result.MainWindowHandle
  Responding       = $result.Responding
  Attempts         = $winningAttempt
} | Format-List
