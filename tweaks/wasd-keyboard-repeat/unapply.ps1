$ErrorActionPreference = 'Stop'
$backupFile = Join-Path $env:LOCALAPPDATA 'BabaTweak\backups\wasd-keyboard-repeat.json'

if (-not (Test-Path -LiteralPath $backupFile)) {
    Write-Output 'No saved WASD Tweak backup was found; nothing can be restored safely.'
    return
}

$backup = Get-Content -LiteralPath $backupFile -Raw | ConvertFrom-Json
$registryKey = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Control Panel\Keyboard')
foreach ($name in @('KeyboardDelay', 'KeyboardSpeed')) {
    $saved = $backup.keyboard.$name
    if ($saved.exists) {
        $kind = [Microsoft.Win32.RegistryValueKind]::$($saved.kind)
        $registryKey.SetValue($name, $saved.value, $kind)
    } else {
        $registryKey.DeleteValue($name, $false)
    }
}
$registryKey.Close()

if (-not ('BabaFilterKeysRestore' -as [type])) { Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class BabaFilterKeysRestore {
    [StructLayout(LayoutKind.Sequential)]
    public struct FILTERKEYS {
        public uint cbSize;
        public uint dwFlags;
        public uint iWaitMSec;
        public uint iDelayMSec;
        public uint iRepeatMSec;
        public uint iBounceMSec;
    }
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SystemParametersInfo(uint action, uint param, ref FILTERKEYS data, uint flags);
}
'@
}

$savedFilter = [BabaFilterKeysRestore+FILTERKEYS]::new()
$savedFilter.cbSize = [uint32]$backup.filterKeys.cbSize
$savedFilter.dwFlags = [uint32]$backup.filterKeys.dwFlags
$savedFilter.iWaitMSec = [uint32]$backup.filterKeys.iWaitMSec
$savedFilter.iDelayMSec = [uint32]$backup.filterKeys.iDelayMSec
$savedFilter.iRepeatMSec = [uint32]$backup.filterKeys.iRepeatMSec
$savedFilter.iBounceMSec = [uint32]$backup.filterKeys.iBounceMSec
if (-not [BabaFilterKeysRestore]::SystemParametersInfo(0x0033, 0, [ref]$savedFilter, 0x0003)) {
    throw 'Could not restore the original Windows Filter Keys settings.'
}

Remove-Item -LiteralPath $backupFile -Force
Write-Output 'Original keyboard repeat and Filter Keys settings restored.'
