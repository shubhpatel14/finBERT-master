# Start EdgeFinder Terminal (Backend + Frontend)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " EDGEFINDER // INDIAN EQUITY RESEARCH & INTELLIGENCE TERMINAL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "1. Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start_backend.ps1"

Start-Sleep -Seconds 3

Write-Host "2. Launching Next.js Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start_frontend.ps1"

Start-Sleep -Seconds 3

Write-Host "Opening Terminal in Default Browser: http://localhost:3000" -ForegroundColor Cyan
Start-Process "http://localhost:3000"
