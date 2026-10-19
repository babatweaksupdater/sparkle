$ErrorActionPreference = 'Stop'
$running = Get-Process -Name 'FiveM','FiveM_GTAProcess','GTA5' -ErrorAction SilentlyContinue
if ($running) { throw 'Close FiveM and GTA V completely before clearing the client cache.' }

$cachePath = Join-Path $env:LOCALAPPDATA 'FiveM\FiveM.app\data\cache'
if (-not (Test-Path -LiteralPath $cachePath -PathType Container)) {
    throw "Default FiveM cache folder was not found: $cachePath"
}

$protected = @('game', 'game-storage')
$items = @(Get-ChildItem -LiteralPath $cachePath -Force)
$removed = 0
foreach ($item in $items) {
    if ($protected -contains $item.Name.ToLowerInvariant()) { continue }
    Remove-Item -LiteralPath $item.FullName -Recurse -Force
    $removed++
}

Write-Output "Cleared $removed temporary cache item(s). Game and game-storage were preserved."
