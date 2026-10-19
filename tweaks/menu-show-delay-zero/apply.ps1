$ErrorActionPreference = 'Stop'
$backupDir = Join-Path $env:LOCALAPPDATA 'BabaTweak\backups'
$backupFile = Join-Path $backupDir 'zero-delay-profile.json'
$values = @(
    @{ Path = 'Software\Microsoft\GameBar'; Name = 'AllowAutoGameMode'; Value = 1 },
    @{ Path = 'Software\Microsoft\GameBar'; Name = 'AutoGameModeEnabled'; Value = 1 },
    @{ Path = 'Software\Microsoft\Windows\CurrentVersion\GameDVR'; Name = 'AppCaptureEnabled'; Value = 0 }
)

if (-not (Test-Path -LiteralPath $backupFile)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $saved = foreach ($entry in $values) {
        $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($entry.Path, $false)
        $exists = $key -and ($key.GetValueNames() -contains $entry.Name)
        if ($exists) {
            [pscustomobject]@{
                path = $entry.Path
                name = $entry.Name
                exists = $true
                value = $key.GetValue($entry.Name, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
                kind = $key.GetValueKind($entry.Name).ToString()
            }
        } else {
            [pscustomobject]@{ path = $entry.Path; name = $entry.Name; exists = $false }
        }
        if ($key) { $key.Close() }
    }
    $saved | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $backupFile -Encoding UTF8
}

foreach ($entry in $values) {
    $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($entry.Path)
    $key.SetValue($entry.Name, [int]$entry.Value, [Microsoft.Win32.RegistryValueKind]::DWord)
    $key.Close()
}
Write-Output 'Gaming profile applied. Restart FiveM to compare the result.'
