# setup.ps1 — Windows setup script for Social Media Downloader API
# Run with: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "=== Social Media Downloader API Setup ===" -ForegroundColor Cyan

# 1. Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org (v18+)" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# 2. Install npm dependencies
Write-Host "Installing npm packages..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }

# 3. Install yt-dlp (the core engine)
Write-Host "Installing yt-dlp..." -ForegroundColor Yellow
$ytdlpInstalled = $false

# Try pip first
if (Get-Command pip -ErrorAction SilentlyContinue) {
    pip install yt-dlp --upgrade --quiet
    if ($LASTEXITCODE -eq 0) { $ytdlpInstalled = $true; Write-Host "yt-dlp installed via pip" -ForegroundColor Green }
}
if (!$ytdlpInstalled -and (Get-Command pip3 -ErrorAction SilentlyContinue)) {
    pip3 install yt-dlp --upgrade --quiet
    if ($LASTEXITCODE -eq 0) { $ytdlpInstalled = $true; Write-Host "yt-dlp installed via pip3" -ForegroundColor Green }
}
if (!$ytdlpInstalled) {
    # Download binary directly
    $ytdlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    $ytdlpPath = "$env:LOCALAPPDATA\yt-dlp\yt-dlp.exe"
    New-Item -ItemType Directory -Force -Path "$env:LOCALAPPDATA\yt-dlp" | Out-Null
    Write-Host "Downloading yt-dlp binary to $ytdlpPath..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $ytdlpUrl -OutFile $ytdlpPath
    # Add to PATH for this session
    $env:PATH += ";$env:LOCALAPPDATA\yt-dlp"
    # Add to .env
    Add-Content -Path ".env" -Value "YTDLP_PATH=$ytdlpPath"
    Write-Host "yt-dlp downloaded. Path added to .env" -ForegroundColor Green
}

# 4. Create .env if missing
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env created from .env.example" -ForegroundColor Green
}

# 5. Verify yt-dlp works
Write-Host "Verifying yt-dlp..." -ForegroundColor Yellow
$version = yt-dlp --version 2>$null
if ($version) { Write-Host "yt-dlp version: $version" -ForegroundColor Green }
else { Write-Host "WARNING: yt-dlp not in PATH. Check YTDLP_PATH in your .env file." -ForegroundColor Yellow }

Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Cyan
Write-Host "Start the server:  npm start" -ForegroundColor White
Write-Host "Development mode:  npm run dev" -ForegroundColor White
Write-Host "Health check:      http://localhost:3000/health" -ForegroundColor White
Write-Host "Test download:     http://localhost:3000/api/fetch?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" -ForegroundColor White
