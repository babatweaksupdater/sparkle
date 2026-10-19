$ErrorActionPreference = 'Continue'
$reportDir = Join-Path $env:LOCALAPPDATA 'BabaTweak\reports'
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportFile = Join-Path $reportDir "fivem-network-check-$stamp.txt"
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('Baba Tweak - FiveM Hitreg / Network Check')
$lines.Add("Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')")
$lines.Add('This is a local baseline report, not a measurement of a specific FiveM server.')
$lines.Add('')

$adapters = @(Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object Status -eq 'Up')
$lines.Add('ACTIVE PHYSICAL ADAPTERS')
if ($adapters.Count -eq 0) { $lines.Add('No active physical adapter was detected.') }
foreach ($adapter in $adapters) {
    $lines.Add("$($adapter.Name): $($adapter.InterfaceDescription) | link $($adapter.LinkSpeed)")
    try {
        $stats = Get-NetAdapterStatistics -Name $adapter.Name -ErrorAction Stop
        $lines.Add("  Received errors: $($stats.ReceivedPacketErrors); outbound errors: $($stats.OutboundPacketErrors); discarded: $($stats.ReceivedDiscardedPackets + $stats.OutboundDiscardedPackets)")
    } catch { $lines.Add('  Adapter error counters could not be read.') }
}
$lines.Add('')

$route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Sort-Object RouteMetric | Select-Object -First 1
$targets = @()
if ($route -and $route.NextHop -and $route.NextHop -ne '0.0.0.0') { $targets += [pscustomobject]@{ Label = 'Default gateway'; Address = $route.NextHop } }
$targets += [pscustomobject]@{ Label = 'Public baseline (1.1.1.1)'; Address = '1.1.1.1' }
$lines.Add('SHORT PING BASELINE (4 samples each; ICMP can be blocked)')
foreach ($target in $targets) {
    $samples = @(Test-Connection -ComputerName $target.Address -Count 4 -ErrorAction SilentlyContinue)
    $times = @($samples | ForEach-Object { [double]$_.ResponseTime })
    if ($times.Count -gt 0) {
        $average = [math]::Round(($times | Measure-Object -Average).Average, 1)
        $maximum = [math]::Round(($times | Measure-Object -Maximum).Maximum, 1)
        $loss = [math]::Round((4 - $times.Count) / 4 * 100)
        $lines.Add("$($target.Label): avg ${average}ms, max ${maximum}ms, sample loss ${loss}% ($($times.Count)/4 replies)")
    } else {
        $lines.Add("$($target.Label): no ping replies; this may mean ICMP is blocked, not that the game connection is down.")
    }
}
$lines.Add('')
$lines.Add('FIVEM SERVER CHECK')
$lines.Add('Join your usual server, press F8, and run: cl_drawperf true')
$lines.Add('Compare the displayed ping and PL (packet loss) while connected. Press F8 and run cl_drawperf false to hide it.')
$lines.Add('')
$lines.Add('This report is saved locally and is not sent anywhere.')
$lines | Set-Content -LiteralPath $reportFile -Encoding UTF8
Write-Output "Local network check saved to: $reportFile"
Write-Output 'Use FiveM F8 > cl_drawperf true to inspect the live server connection.'
