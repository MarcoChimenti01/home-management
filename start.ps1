# Avvia l'app: un solo server Expo serve sia il web (browser) sia il mobile (QR per Expo Go).
#
#   .\start.ps1            -> web nel browser + QR per il telefono (stessa rete Wi-Fi)
#   .\start.ps1 -Tunnel    -> come sopra, ma il telefono si collega via internet (serve login Expo)
#   .\start.ps1 -Clear     -> svuota la cache di Metro
param(
  [switch]$Tunnel,
  [switch]$Clear
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$app = Join-Path $root 'apps\mobile'

# Node 22 tramite fnm (se installato); altrimenti si usa il Node già nel PATH
$fnm = (Get-Command fnm -ErrorAction SilentlyContinue).Source
if (-not $fnm) {
  $fnm = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter fnm.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
}
if ($fnm) {
  & $fnm env --shell powershell | Out-String | Invoke-Expression
  & $fnm use 22 2>&1 | Out-Null
}

$major = [int]((node -v) -replace '^v(\d+).*', '$1')
if ($major -lt 22) {
  Write-Host "Serve Node 22 o superiore (trovato $(node -v)). Installa fnm: winget install Schniz.fnm" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $app '.env'))) {
  Write-Host "Manca apps\mobile\.env: copia .env.example e inserisci URL e chiave Supabase." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  Write-Host 'Installo le dipendenze...' -ForegroundColor Yellow
  Push-Location $root; pnpm install; Pop-Location
}

$expoArgs = @('exec', 'expo', 'start', '--web')
if ($Tunnel) { $expoArgs += '--tunnel' }
if ($Clear) { $expoArgs += '--clear' }

Push-Location $app
try {
  Write-Host "Avvio con Node $(node -v)... (web: http://localhost:8081, telefono: scansiona il QR con Expo Go)" -ForegroundColor Green
  pnpm @expoArgs
} finally {
  Pop-Location
}
