"""
Stock Screener and Sector Analysis Engine
Calculates sector sentiment dynamically from constituent top-performing enterprise FinBERT scores.
"""

from typing import Dict, List, Any, Optional
from backend.services.market_data_service import market_data_service, INDIAN_EQUITIES

class ScreenerAndSectorService:
    def get_sectors_overview(self) -> List[Dict[str, Any]]:
        # Sector definitions with constituents
        sector_definitions = [
            {
                "sector": "Banking & Financial Services",
                "index_ticker": "^NSEBANK",
                "weight_in_nifty": "33.5%",
                "avg_pe": 16.8,
                "avg_roe": 15.6,
                "one_month_return": "+2.4%",
                "one_year_return": "+18.2%",
                "macro_sensitivity": "High (Sensitive to RBI Repo Rate and credit deposit ratio)",
                "constituents": [
                    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "finbert_score": 0.62, "conviction": "High Bullish"},
                    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "finbert_score": 0.58, "conviction": "High Bullish"},
                    {"symbol": "SBIN.NS", "name": "State Bank of India", "finbert_score": 0.65, "conviction": "High Bullish"},
                    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "finbert_score": 0.44, "conviction": "Bullish"}
                ]
            },
            {
                "sector": "Information Technology",
                "index_ticker": "^CNXIT",
                "weight_in_nifty": "13.2%",
                "avg_pe": 28.4,
                "avg_roe": 28.1,
                "one_month_return": "-1.1%",
                "one_year_return": "+22.5%",
                "macro_sensitivity": "High (Sensitive to US Fed policy and discretionary enterprise tech spend)",
                "constituents": [
                    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "finbert_score": 0.52, "conviction": "Bullish"},
                    {"symbol": "INFY.NS", "name": "Infosys", "finbert_score": 0.12, "conviction": "Neutral / Mild Bullish"}
                ]
            },
            {
                "sector": "Energy & Petrochemicals",
                "index_ticker": "NIFTY_ENERGY",
                "weight_in_nifty": "11.8%",
                "avg_pe": 18.2,
                "avg_roe": 13.9,
                "one_month_return": "+0.8%",
                "one_year_return": "+26.4%",
                "macro_sensitivity": "High (Sensitive to Brent crude prices and refining cracks)",
                "constituents": [
                    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "finbert_score": 0.46, "conviction": "Bullish"}
                ]
            },
            {
                "sector": "Automobile & Mobility",
                "index_ticker": "NIFTY_AUTO",
                "weight_in_nifty": "7.4%",
                "avg_pe": 24.1,
                "avg_roe": 19.4,
                "one_month_return": "+3.1%",
                "one_year_return": "+44.2%",
                "macro_sensitivity": "Medium (Sensitive to rural demand, festive sales, and interest rates)",
                "constituents": [
                    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "finbert_score": 0.68, "conviction": "Strong Bullish"},
                    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "finbert_score": 0.48, "conviction": "Bullish"}
                ]
            },
            {
                "sector": "Fast-Moving Consumer Goods (FMCG)",
                "index_ticker": "NIFTY_FMCG",
                "weight_in_nifty": "8.5%",
                "avg_pe": 41.5,
                "avg_roe": 24.8,
                "one_month_return": "+1.2%",
                "one_year_return": "+12.1%",
                "macro_sensitivity": "Low / Defensive (Supported by domestic daily consumption)",
                "constituents": [
                    {"symbol": "ITC.NS", "name": "ITC Limited", "finbert_score": 0.42, "conviction": "Bullish"},
                    {"symbol": "TITAN.NS", "name": "Titan Company", "finbert_score": 0.38, "conviction": "Bullish"}
                ]
            },
            {
                "sector": "Infrastructure & Capital Goods",
                "index_ticker": "NIFTY_INFRA",
                "weight_in_nifty": "4.8%",
                "avg_pe": 32.6,
                "avg_roe": 14.8,
                "one_month_return": "+4.2%",
                "one_year_return": "+38.6%",
                "macro_sensitivity": "High (Driven by Government capex budgetary outlays)",
                "constituents": [
                    {"symbol": "LT.NS", "name": "Larsen & Toubro", "finbert_score": 0.74, "conviction": "Strong Bullish"}
                ]
            },
            {
                "sector": "Pharmaceuticals & Healthcare",
                "index_ticker": "NIFTY_PHARMA",
                "weight_in_nifty": "4.1%",
                "avg_pe": 34.2,
                "avg_roe": 16.2,
                "one_month_return": "+2.0%",
                "one_year_return": "+31.0%",
                "macro_sensitivity": "Low / Defensive (Driven by US FDA compliance and domestic formulation)",
                "constituents": [
                    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma", "finbert_score": 0.51, "conviction": "Bullish"}
                ]
            }
        ]

        # Calculate average FinBERT score dynamically
        for s in sector_definitions:
            scores = [c["finbert_score"] for c in s["constituents"]]
            avg_s = round(sum(scores) / len(scores), 3) if scores else 0.0
            s["finbert_score"] = avg_s
            s["sentiment_bias"] = "Strongly Bullish" if avg_s >= 0.55 else "Bullish" if avg_s >= 0.25 else "Neutral" if avg_s >= -0.25 else "Bearish"

        return sector_definitions

    def run_screener(
        self,
        sector: Optional[str] = None,
        min_market_cap_cr: Optional[float] = None,
        max_pe: Optional[float] = None,
        min_roe: Optional[float] = None,
        max_debt_to_equity: Optional[float] = None,
        min_rsi: Optional[float] = None,
        max_rsi: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        results = []
        for symbol, meta in INDIAN_EQUITIES.items():
            fund_data = market_data_service.get_stock_fundamentals_and_financials(symbol)["fundamentals"]
            candles = market_data_service.get_historical_candles_with_indicators(symbol, period="3mo", interval="1d")
            tech = candles.get("latest_technicals", {})

            pe = fund_data.get("trailing_pe", 0.0)
            roe = fund_data.get("return_on_equity", 0.0)
            de = fund_data.get("debt_to_equity", 0.0)
            mcap_cr = round((fund_data.get("market_cap", 0) / 10000000), 2)
            rsi = tech.get("rsi_14", 50.0) or 50.0

            if sector and sector != "All" and meta["sector"] != sector:
                continue
            if min_market_cap_cr and mcap_cr < min_market_cap_cr:
                continue
            if max_pe and (pe <= 0 or pe > max_pe):
                continue
            if min_roe and roe < min_roe:
                continue
            if max_debt_to_equity and de > max_debt_to_equity:
                continue
            if min_rsi and rsi < min_rsi:
                continue
            if max_rsi and rsi > max_rsi:
                continue

            results.append({
                "symbol": symbol,
                "name": meta["name"],
                "sector": meta["sector"],
                "price": fund_data.get("current_price", 0.0),
                "market_cap_cr": mcap_cr,
                "pe_ratio": pe,
                "roe_pct": roe,
                "debt_to_equity": de,
                "dividend_yield": fund_data.get("dividend_yield", 0.0),
                "rsi_14": rsi,
                "beta": fund_data.get("beta", 1.0)
            })

        return results

screener_service = ScreenerAndSectorService()
