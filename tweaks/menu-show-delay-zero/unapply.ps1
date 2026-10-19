$ErrorActionPreference = 'Stop'
$backupFile = Join-Path $env:LOCALAPPDATA 'BabaTweak\backups\zero-delay-profile.json'
if (-not (Test-Path -LiteralPath $backupFile)) {
    Write-Output 'No saved profile was found; nothing can be restored safely.'
    return
}

$saved = @(Get-Content -LiteralPath $backupFile -Raw | ConvertFrom-Json)
foreach ($entry in $saved) {
    $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey([string]$entry.path)
    if ($entry.exists) {
        $kind = [Microsoft.Win32.RegistryValueKind]::$($entry.kind)
        $value = $entry.value
        if ($kind -eq [Microsoft.Win32.RegistryValueKind]::DWord) { $value = [int]$entry.value }
        if ($kind -eq [Microsoft.Win32.RegistryValueKind]::QWord) { $value = [long]$entry.value }
        $key.SetValue([string]$entry.name, $value, $kind)
    } else {
        $key.DeleteValue([string]$entry.name, $false)
    }
    $key.Close()
}
Remove-Item -LiteralPath $backupFile -Force
Write-Output 'Your original Windows gaming and capture settings were restored.'
