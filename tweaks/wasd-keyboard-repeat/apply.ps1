$ErrorActionPreference = 'Stop'

$backupDir = Join-Path $env:LOCALAPPDATA 'BabaTweak\backups'
$backupFile = Join-Path $backupDir 'wasd-keyboard-repeat.json'
$keyboardPath = 'HKCU:\Control Panel\Keyboard'
$keyboardKey = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Control Panel\Keyboard', $false)

if (-not ('BabaFilterKeys' -as [type])) { Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class BabaFilterKeys {
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

$filterKeys = [BabaFilterKeys+FILTERKEYS]::new()
$filterKeys.cbSize = [Runtime.InteropServices.Marshal]::SizeOf([type][BabaFilterKeys+FILTERKEYS])
if (-not [BabaFilterKeys]::SystemParametersInfo(0x0032, $filterKeys.cbSize, [ref]$filterKeys, 0)) {
    throw 'Could not read the current Windows Filter Keys settings.'
}

if (-not (Test-Path $backupFile)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $savedKeyboard = @{}
    foreach ($name in @('KeyboardDelay', 'KeyboardSpeed')) {
        $exists = $keyboardKey -and ($keyboardKey.GetValueNames() -contains $name)
        if ($exists) {
            $savedKeyboard[$name] = @{
                exists = $true
                value = $keyboardKey.GetValue($name, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
                kind = $keyboardKey.GetValueKind($name).ToString()
            }
        } else {
            $savedKeyboard[$name] = @{ exists = $false }
        }
    }
    $backup = @{
        keyboard = $savedKeyboard
        filterKeys = @{
            cbSize = $filterKeys.cbSize
            dwFlags = $filterKeys.dwFlags
            iWaitMSec = $filterKeys.iWaitMSec
            iDelayMSec = $filterKeys.iDelayMSec
            iRepeatMSec = $filterKeys.iRepeatMSec
            iBounceMSec = $filterKeys.iBounceMSec
        }
    }
    $backup | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $backupFile -Encoding UTF8
}
if ($keyboardKey) { $keyboardKey.Close() }

$keyboardKey = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Control Panel\Keyboard')
$keyboardKey.SetValue('KeyboardDelay', '0', [Microsoft.Win32.RegistryValueKind]::String)
$keyboardKey.SetValue('KeyboardSpeed', '31', [Microsoft.Win32.RegistryValueKind]::String)
$keyboardKey.Close()

# FKF_FILTERKEYSON is bit 0. Preserve all other accessibility preferences.
if (($filterKeys.dwFlags -band 1) -ne 0) {
    $filterKeys.dwFlags = $filterKeys.dwFlags -band (-bnot 1)
    if (-not [BabaFilterKeys]::SystemParametersInfo(0x0033, 0, [ref]$filterKeys, 0x0003)) {
        throw 'Could not turn off Windows Filter Keys.'
    }
}
