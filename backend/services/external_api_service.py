"""
External API Integration Service
Handles live news streaming via NewsAPI.org, Alpha Vantage, and FMP integration
with automatic FinBERT sequence classification on incoming news wires.
"""

import urllib.request
import urllib.parse
import json
import time
from typing import List, Dict, Any, Optional
from backend.config import settings
from backend.services.finbert_service import finbert_service

class ExternalApiService:
    def __init__(self):
        self.news_api_key = settings.NEWS_API_KEY
        self.alpha_vantage_key = settings.ALPHA_VANTAGE_API_KEY
        self.fmp_key = settings.FMP_API_KEY
        self.kite_key = settings.KITE_API_KEY
        self._cache = {}

    def fetch_live_news_with_finbert(
        self,
        query: str = "India stock market OR Nifty OR Sensex",
        company: Optional[str] = None,
        sector: Optional[str] = None,
        page_size: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Fetches live articles from NewsAPI.org and runs FinBERT sentiment analysis
        on each live headline in real time.
        """
        if company and company != "All":
            search_q = f'"{company}" AND (India OR stock OR share OR market)'
        elif sector and sector != "All":
            # Extract main keyword from sector
            kw = sector.split("&")[0].split()[0]
            search_q = f'India {kw} stock OR {kw} sector Nifty'
        else:
            search_q = query

        cache_key = f"newsapi_{search_q}_{page_size}"
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if time.time() - ts < 300: # 5 min cache
                return data

        encoded_q = urllib.parse.quote(search_q)
        url = f"https://newsapi.org/v2/everything?q={encoded_q}&pageSize={page_size}&sortBy=publishedAt&language=en&apiKey={self.news_api_key}"

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "EdgeFinder/2.0"})
            with urllib.request.urlopen(req, timeout=8) as response:
                payload = json.loads(response.read().decode("utf-8"))

            articles = payload.get("articles", [])
            if not articles:
                return []

            headlines = [a.get("title") or "" for a in articles if a.get("title")]
            # Run local FinBERT inference
            predictions = finbert_service.predict_batch(headlines)

            enriched = []
            for art, pred in zip(articles, predictions):
                if not art.get("title") or "[Removed]" in art.get("title"):
                    continue

                pub_date = art.get("publishedAt", "")[:10] if art.get("publishedAt") else time.strftime("%Y-%m-%d")
                source_name = art.get("source", {}).get("name", "Financial Wire")

                enriched.append({
                    "headline": art.get("title", ""),
                    "description": art.get("description", ""),
                    "source": source_name,
                    "url": art.get("url", ""),
                    "date": pub_date,
                    "company": company if company and company != "All" else "Indian Equities",
                    "sector": sector if sector and sector != "All" else "Indian Financial Market",
                    "sentiment": pred["sentiment"],
                    "confidence": pred["confidence"],
                    "sentiment_score": pred["sentiment_score"],
                    "positive_prob": pred["positive_prob"],
                    "negative_prob": pred["negative_prob"],
                    "neutral_prob": pred["neutral_prob"]
                })

            self._cache[cache_key] = (time.time(), enriched)
            return enriched
        except Exception as e:
            print("NewsAPI live fetch warning (falling back to curated corpus):", e)
            return []

    def get_api_provider_status(self) -> Dict[str, Any]:
        """Returns health telemetry of connected external API providers."""
        return {
            "news_api": {
                "provider": "NewsAPI.org",
                "connected": bool(self.news_api_key),
                "key_preview": f"{self.news_api_key[:6]}...{self.news_api_key[-4:]}" if self.news_api_key else "None",
                "features": ["Live Indian Corporate News Ingestion", "Breaking Headline Polling", "Real-time FinBERT Sequence Scoring"]
            },
            "alpha_vantage": {
                "provider": "Alpha Vantage",
                "connected": bool(self.alpha_vantage_key),
                "key_preview": f"{self.alpha_vantage_key[:4]}...{self.alpha_vantage_key[-3:]}" if self.alpha_vantage_key else "None",
                "features": ["Fundamental Overview", "Technical Indicator Feeds"]
            },
            "fmp": {
                "provider": "Financial Modeling Prep",
                "connected": bool(self.fmp_key),
                "key_preview": f"{self.fmp_key[:6]}...{self.fmp_key[-4:]}" if self.fmp_key else "None",
                "features": ["Global XBRL Statements", "Valuation Metrics"]
            },
            "zerodha_kite": {
                "provider": "Zerodha Kite Connect",
                "connected": bool(self.kite_key),
                "key_preview": f"{self.kite_key[:5]}...{self.kite_key[-3:]}" if self.kite_key else "None",
                "features": ["Live NSE Order Gateway", "Institutional Tick Streaming Readiness"]
            }
        }

external_api_service = ExternalApiService()
