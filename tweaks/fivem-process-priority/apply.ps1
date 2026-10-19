$ErrorActionPreference = 'Stop'
$processes = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^FiveM(_b\d+)?_GTAProcess$' })
if ($processes.Count -eq 0) {
    throw 'No FiveM game process is running. Start FiveM and join the game, then apply this tweak.'
}

foreach ($process in $processes) {
    $process.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::AboveNormal
}
Write-Output "Set Above Normal priority for $($processes.Count) FiveM game process(es)."
