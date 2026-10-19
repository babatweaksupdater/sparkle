$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms

# Explicit allowlist of optional apps only. Never target Windows services,
# security tools, browsers, running games, or core shell/system processes.
# Discord, Steam (including its web helpers), and Spotify are intentionally excluded.
$targetNames = @(
    # Third-party launchers and apps
    'EpicGamesLauncher', 'EpicWebHelper',
    'RiotClientServices', 'RiotClientUx', 'RiotClientUxRender',
    'Battle.net',
    'EADesktop',
    'UbisoftConnect', 'upc',
    'RockstarGamesLauncher', 'SocialClubHelper',
    # Optional Windows apps
    'Widgets',
    'PhoneExperienceHost', 'YourPhone',
    'GameBar', 'GameBarFTServer',
    'XboxApp', 'XboxPcApp',
    'ms-teams', 'Teams',
    'Clipchamp'
)

$running = @(Get-Process -Name $targetNames -ErrorAction SilentlyContinue | Sort-Object Id -Unique)
if ($running.Count -eq 0) {
    Write-Output 'No targeted background apps are currently running.'
    exit 0
}

$appNames = ($running | Select-Object -ExpandProperty ProcessName -Unique) -join ', '
$message = "This will close these apps: $appNames`r`n`r`nUnsaved work may be lost. Windows services and core processes, browsers, running games, Discord, Steam, and Spotify are excluded.`r`n`r`nContinue?"
$choice = [System.Windows.Forms.MessageBox]::Show(
    $message,
    'Baba Tweak — Close Background Apps',
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Warning,
    [System.Windows.Forms.MessageBoxDefaultButton]::Button2
)
if ($choice -ne [System.Windows.Forms.DialogResult]::Yes) {
    Write-Output 'Cancelled by user.'
    exit 0
}

$closed = 0
$failed = 0
foreach ($process in $running) {
    try {
        if ($process.HasExited) { continue }
        $sentCloseRequest = $process.CloseMainWindow()
        if (-not $sentCloseRequest -or -not $process.WaitForExit(5000)) {
            # Force is limited to the explicit optional-app allowlist above,
            # after confirmation and a graceful close attempt.
            $process.Kill()
            [void]$process.WaitForExit(2000)
        }
        if ($process.HasExited) { $closed++ } else { $failed++ }
    } catch {
        $failed++
    }
}

Write-Output "Closed: $closed; could not close: $failed."