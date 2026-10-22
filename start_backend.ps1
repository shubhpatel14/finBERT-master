# Start EdgeFinder FastAPI Backend Server
Write-Host "Activating EdgeFinder virtual environment..." -ForegroundColor Cyan
& "$PSScriptRoot\finbert\.venv\Scripts\Activate.ps1"

Write-Host "Starting EdgeFinder FastAPI Backend on http://localhost:8000 (Docs at /docs)..." -ForegroundColor Green
& "$PSScriptRoot\finbert\.venv\Scripts\python.exe" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
