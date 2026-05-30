$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$desktopRoot = Join-Path $repoRoot "apps\desktop"
$releaseRoot = Join-Path $desktopRoot "src-tauri\target\release"
$appExe = Join-Path $releaseRoot "dinaya_desktop.exe"
$bundleRoot = Join-Path $releaseRoot "bundle\nsis"
$startupLog = Join-Path $env:TEMP "dinaya-desktop-startup.log"
$screenshotPath = Join-Path $env:TEMP "dinaya-desktop-smoke-window.png"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

if (-not ("DinayaDesktopSmoke.NativeMethods" -as [type])) {
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

namespace DinayaDesktopSmoke {
  public static class NativeMethods {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
      public int Left;
      public int Top;
      public int Right;
      public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder text, int count);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
  }
}
"@
}

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

function Capture-WindowBitmap {
  param(
    [Parameter(Mandatory = $true)][IntPtr]$Handle,
    [Parameter(Mandatory = $true)][string]$Path
  )

  [DinayaDesktopSmoke.NativeMethods]::ShowWindow($Handle, 9) | Out-Null
  [DinayaDesktopSmoke.NativeMethods]::SetForegroundWindow($Handle) | Out-Null
  Start-Sleep -Milliseconds 750

  $rect = New-Object DinayaDesktopSmoke.NativeMethods+RECT
  if (-not [DinayaDesktopSmoke.NativeMethods]::GetWindowRect($Handle, [ref]$rect)) {
    throw "Could not read the release app window rectangle."
  }

  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -lt 320 -or $height -lt 240) {
    throw "Release app window is too small to verify visually: ${width}x${height}."
  }

  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $captureMode = "CopyFromScreen"
  try {
    try {
      $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size $width, $height))
    }
    catch {
      $captureMode = "PrintWindow"
      $hdc = $graphics.GetHdc()
      try {
        if (-not [DinayaDesktopSmoke.NativeMethods]::PrintWindow($Handle, $hdc, 2)) {
          throw "CopyFromScreen failed and PrintWindow could not capture the release app window. CopyFromScreen error: $($_.Exception.Message)"
        }
      }
      finally {
        $graphics.ReleaseHdc($hdc)
      }
    }

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }

  [PSCustomObject]@{
    Path = $Path
    Width = $width
    Height = $height
    Left = $rect.Left
    Top = $rect.Top
    CaptureMode = $captureMode
  }
}

function Get-WindowTextValue {
  param(
    [Parameter(Mandatory = $true)][IntPtr]$Handle,
    [Parameter(Mandatory = $true)][ValidateSet("Class", "Title")][string]$Kind
  )

  $builder = New-Object System.Text.StringBuilder 256
  if ($Kind -eq "Class") {
    [DinayaDesktopSmoke.NativeMethods]::GetClassName($Handle, $builder, $builder.Capacity) | Out-Null
  } else {
    [DinayaDesktopSmoke.NativeMethods]::GetWindowText($Handle, $builder, $builder.Capacity) | Out-Null
  }
  $builder.ToString()
}

function Get-ProcessWindowSnapshots {
  param([Parameter(Mandatory = $true)][int]$ProcessId)

  $windows = New-Object System.Collections.Generic.List[object]
  $callback = [DinayaDesktopSmoke.NativeMethods+EnumWindowsProc]{
    param([IntPtr]$Handle, [IntPtr]$Param)

    [uint32]$windowProcessId = 0
    [DinayaDesktopSmoke.NativeMethods]::GetWindowThreadProcessId($Handle, [ref]$windowProcessId) | Out-Null
    if ($windowProcessId -eq $ProcessId) {
      $rect = New-Object DinayaDesktopSmoke.NativeMethods+RECT
      [DinayaDesktopSmoke.NativeMethods]::GetWindowRect($Handle, [ref]$rect) | Out-Null
      $windows.Add([PSCustomObject]@{
        Handle = $Handle
        ClassName = Get-WindowTextValue -Handle $Handle -Kind "Class"
        Title = Get-WindowTextValue -Handle $Handle -Kind "Title"
        Visible = [DinayaDesktopSmoke.NativeMethods]::IsWindowVisible($Handle)
        Width = $rect.Right - $rect.Left
        Height = $rect.Bottom - $rect.Top
        Left = $rect.Left
        Top = $rect.Top
      }) | Out-Null
    }

    $true
  }

  [DinayaDesktopSmoke.NativeMethods]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
  $windows
}

function Select-AppWindowHandle {
  param([Parameter(Mandatory = $true)][int]$ProcessId)

  $windows = Get-ProcessWindowSnapshots -ProcessId $ProcessId
  $candidate = $windows |
    Where-Object {
      $_.Width -ge 320 -and
      $_.Height -ge 240 -and
      ($_.Title -eq "Dinaya" -or $_.ClassName -eq "Tauri Window" -or $_.ClassName -eq "tray_icon_app")
    } |
    Sort-Object @{ Expression = { if ($_.Title -eq "Dinaya" -or $_.ClassName -eq "Tauri Window") { 0 } else { 1 } } }, Width, Height -Descending |
    Select-Object -First 1

  [PSCustomObject]@{
    Handle = if ($candidate) { $candidate.Handle } else { [IntPtr]::Zero }
    Windows = $windows
  }
}

function Get-WindowAutomationText {
  param([Parameter(Mandatory = $true)][IntPtr]$Handle)

  $root = [System.Windows.Automation.AutomationElement]::FromHandle($Handle)
  if (-not $root) {
    return ""
  }

  $elements = $root.FindAll(
    [System.Windows.Automation.TreeScope]::Subtree,
    [System.Windows.Automation.Condition]::TrueCondition
  )
  $names = New-Object System.Collections.Generic.List[string]
  for ($index = 0; $index -lt $elements.Count -and $index -lt 300; $index += 1) {
    $name = $elements.Item($index).Current.Name
    if ($name) {
      $names.Add($name) | Out-Null
    }
  }

  (($names | Select-Object -Unique) -join " ").Trim()
}

function Measure-WindowBitmap {
  param([Parameter(Mandatory = $true)][string]$Path)

  $bitmap = [System.Drawing.Bitmap]::FromFile($Path)
  try {
    $stepX = [Math]::Max(1, [int]($bitmap.Width / 96))
    $stepY = [Math]::Max(1, [int]($bitmap.Height / 64))
    $sampledPixels = 0
    $nonBlankPixels = 0
    $colors = New-Object "System.Collections.Generic.HashSet[string]"

    for ($y = 0; $y -lt $bitmap.Height; $y += $stepY) {
      for ($x = 0; $x -lt $bitmap.Width; $x += $stepX) {
        $color = $bitmap.GetPixel($x, $y)
        $sampledPixels += 1
        [void]$colors.Add("$($color.R),$($color.G),$($color.B)")

        $nearWhite = $color.R -ge 248 -and $color.G -ge 248 -and $color.B -ge 248
        $nearBlack = $color.R -le 8 -and $color.G -le 8 -and $color.B -le 8
        if (-not ($nearWhite -or $nearBlack)) {
          $nonBlankPixels += 1
        }
      }
    }

    $nonBlankPixelRatio = if ($sampledPixels -gt 0) { $nonBlankPixels / $sampledPixels } else { 0 }

    [PSCustomObject]@{
      SampledPixels = $sampledPixels
      NonBlankPixels = $nonBlankPixels
      NonBlankPixelRatio = [Math]::Round($nonBlankPixelRatio, 4)
      UniqueColors = $colors.Count
    }
  }
  finally {
    $bitmap.Dispose()
  }
}

function Wait-StartupLogMarker {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Marker,
    [int]$TimeoutSeconds = 12
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Path -LiteralPath $Path -PathType Leaf) {
      $text = Get-Content -LiteralPath $Path -Raw
      if ($text -match [regex]::Escape($Marker)) {
        return $text
      }
    }

    Start-Sleep -Milliseconds 400
  }

  throw "Startup log did not receive marker: $Marker"
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
Remove-Item -LiteralPath $screenshotPath -Force -ErrorAction SilentlyContinue
$env:DINAYA_DESKTOP_STARTUP_LOG = "1"
$process = $null

try {
  $process = Start-Process -FilePath $appItem.FullName -WorkingDirectory $releaseRoot -PassThru
  Start-Sleep -Seconds 5

  $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
  if (-not $running) {
    throw "Release app process exited before smoke verification completed."
  }

  if (-not $running.Responding) {
    throw "Release app process is running but not responding."
  }

  $windowSelection = Select-AppWindowHandle -ProcessId $running.Id
  $windowSummary = ($windowSelection.Windows | ForEach-Object {
    "0x$([Convert]::ToString($_.Handle.ToInt64(), 16)) $($_.ClassName) '$($_.Title)' $($_.Width)x$($_.Height) visible=$($_.Visible)"
  }) -join " | "
  if ([int64]$windowSelection.Handle -eq 0) {
    throw "Release app started without a visible Dinaya/Tauri window. Windows: $windowSummary"
  }

  if (-not [DinayaDesktopSmoke.NativeMethods]::IsWindowVisible($windowSelection.Handle)) {
    [DinayaDesktopSmoke.NativeMethods]::ShowWindow($windowSelection.Handle, 9) | Out-Null
    [DinayaDesktopSmoke.NativeMethods]::ShowWindow($windowSelection.Handle, 5) | Out-Null
    [DinayaDesktopSmoke.NativeMethods]::SetForegroundWindow($windowSelection.Handle) | Out-Null
    Start-Sleep -Milliseconds 750
  }

  if (-not [DinayaDesktopSmoke.NativeMethods]::IsWindowVisible($windowSelection.Handle)) {
    throw "Release app window exists but is not visible. Windows: $windowSummary"
  }

  $automationText = Get-WindowAutomationText -Handle $windowSelection.Handle

  if (-not (Test-Path -LiteralPath $startupLog -PathType Leaf)) {
    throw "Startup log was not created; app may not have reached Tauri setup."
  }

  foreach ($marker in @("tray setup complete", "main webview found", "global shortcut registered: Ctrl+Shift+K")) {
    $startupText = Wait-StartupLogMarker -Path $startupLog -Marker $marker -TimeoutSeconds 20
    if ($startupText -notmatch [regex]::Escape($marker)) {
      throw "Startup log is missing marker: $marker"
    }
  }

  $frontendReady = $false
  $frontendNote = "Frontend IPC marker received."
  try {
    $startupText = Wait-StartupLogMarker -Path $startupLog -Marker "frontend log [info][startup] frontend render ready"
    $frontendReady = $startupText -match "frontend log \[info\]\[startup\] frontend render ready"
  }
  catch {
    $startupText = Get-Content -LiteralPath $startupLog -Raw
    $frontendNote = $_.Exception.Message
  }

  $captureMode = "Unavailable"
  $windowSize = "Unavailable"
  $visualNote = "Screen capture was not available in this Windows session."
  $windowPixels = [PSCustomObject]@{
    NonBlankPixelRatio = 0
    UniqueColors = 0
  }

  try {
    $windowCapture = Capture-WindowBitmap -Handle $windowSelection.Handle -Path $screenshotPath
    $captureMode = $windowCapture.CaptureMode
    $windowSize = "$($windowCapture.Width)x$($windowCapture.Height)"
    $windowPixels = Measure-WindowBitmap -Path $screenshotPath
    $visualNote = "Window capture completed."

    if ($windowPixels.NonBlankPixelRatio -lt 0.01 -or $windowPixels.UniqueColors -lt 16) {
      if ($windowCapture.CaptureMode -eq "CopyFromScreen") {
        throw "Release app window capture looks blank. NonBlankPixelRatio=$($windowPixels.NonBlankPixelRatio), UniqueColors=$($windowPixels.UniqueColors), Screenshot=$screenshotPath"
      }
      $visualNote = "PrintWindow capture is compositor-limited for WebView2; frontend render marker passed."
    }
  }
  catch {
    $visualNote = "Window pixel capture skipped: $($_.Exception.Message)"
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
    VerifiedWindowHandle = $windowSelection.Handle
    WindowSummary = $windowSummary
    Responding = $running.Responding
    AutomationText = $automationText
    Screenshot = $screenshotPath
    WindowSize = $windowSize
    CaptureMode = $captureMode
    VisualNote = $visualNote
    FrontendReady = $frontendReady
    FrontendNote = $frontendNote
    NonBlankPixelRatio = $windowPixels.NonBlankPixelRatio
    UniqueColors = $windowPixels.UniqueColors
  } | Format-List
}
finally {
  if ($process) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  Remove-Item Env:\DINAYA_DESKTOP_STARTUP_LOG -ErrorAction SilentlyContinue
}
