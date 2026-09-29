<#
  stop-all.ps1 - Arrete proprement tous les services Karim Market.
  Usage : powershell -ExecutionPolicy Bypass -File .\scripts\stop-all.ps1
#>

$ErrorActionPreference = 'SilentlyContinue'

Write-Host 'Arret de Karim Market...' -ForegroundColor Cyan

# 1. Fermer le backend et le frontend qui ecoutent sur nos ports
foreach ($port in @(8080, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen
    if ($conns) {
        foreach ($c in $conns) {
            $proc = Get-Process -Id $c.OwningProcess
            Write-Host "  Arret du processus $($proc.ProcessName) (PID $($c.OwningProcess), port $port)" -ForegroundColor Yellow
            Stop-Process -Id $c.OwningProcess -Force
        }
    }
}

# 2. Arret des processus node/java orphelins lances par le projet
Get-CimInstance Win32_Process -Filter "Name='java.exe' OR Name='node.exe'" | ForEach-Object {
    if ($_.CommandLine -match 'karim-market-1\.0\.0\.jar|karim-market.+(vite|npm)') {
        Write-Host "  Arret de $($_.Name) (PID $($_.ProcessId))" -ForegroundColor Yellow
        Stop-Process -Id $_.ProcessId -Force
    }
}

Write-Host '  MongoDB laisse actif (donnees conservees).' -ForegroundColor DarkGray
Write-Host 'Arret termine.' -ForegroundColor Green
Write-Host 'Pour arreter Mongo aussi : Stop-Service MongoDB'
