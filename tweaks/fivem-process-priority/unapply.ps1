$ErrorActionPreference = 'Continue'
$processes = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^FiveM(_b\d+)?_GTAProcess$' })
foreach ($process in $processes) {
    try { $process.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::Normal } catch { }
}
Write-Output "Restored Normal priority for $($processes.Count) running FiveM game process(es)."
