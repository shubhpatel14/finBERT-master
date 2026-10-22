"""
EdgeFinder Backend Configuration
Handles environment settings, CORS rules, database connection, and external API keys.
"""

import os
from pydantic import BaseModel
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

class Settings(BaseModel):
    PROJECT_NAME: str = "EdgeFinder Indian Market Intelligence & Equity Research Terminal"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./edgefinder.db")
    
    # CORS Origins for Next.js frontend
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*"
    ]
    
    # FinBERT Model identifier
    FINBERT_MODEL_NAME: str = "ProsusAI/finbert"

    # External Provider API Keys
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    ALPHA_VANTAGE_API_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY", "")
    FMP_API_KEY: str = os.getenv("FMP_API_KEY", "")
    KITE_API_KEY: str = os.getenv("KITE_API_KEY", "")

settings = Settings()
