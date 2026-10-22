# EdgeFinder 1-Click Launch Script
Write-Host "Activating EdgeFinder virtual environment (.venv)..." -ForegroundColor Cyan
& "$PSScriptRoot\.venv\Scripts\Activate.ps1"

Write-Host "Starting EdgeFinder Financial Terminal on Streamlit..." -ForegroundColor Green
& "$PSScriptRoot\.venv\Scripts\streamlit.exe" run "$PSScriptRoot\app.py"
