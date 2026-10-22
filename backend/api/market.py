"""
Market Overview & Stock Analysis API Endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.services.market_data_service import market_data_service, INDIAN_EQUITIES

router = APIRouter(tags=["Market & Equities"])

@router.get("/market/indices")
def get_indices():
    """Returns real-time and historical index benchmarks for NIFTY 50, SENSEX, BANK, IT."""
    return market_data_service.get_indices_overview()

@router.get("/market/breadth")
def get_breadth():
    """Returns market advance/decline breadth and top movers."""
    return market_data_service.get_market_breadth_and_movers()

@router.get("/market/overview")
def get_market_overview():
    """Returns whole Indian market overview: indices, FinBERT market sentiment, breadth, FII/DII flows, and movers."""
    return market_data_service.get_whole_market_overview()

@router.get("/market/tracked-symbols")
def get_tracked_symbols():
    """Returns list of all available Indian equities in the terminal universe."""
    return [
        {"symbol": sym, "name": meta["name"], "sector": meta["sector"], "tier": meta["market_cap_tier"]}
        for sym, meta in INDIAN_EQUITIES.items()
    ]

@router.get("/stocks/{symbol}/candles")
def get_stock_candles(
    symbol: str,
    period: str = Query("1y", pattern="^(1mo|3mo|6mo|1y|2y|5y)$"),
    interval: str = Query("1d", pattern="^(1d|1wk|1mo)$")
):
    """Returns OHLCV candlestick data enriched with technical indicators."""
    res = market_data_service.get_historical_candles_with_indicators(symbol, period=period, interval=interval)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.get("/stocks/{symbol}/fundamentals")
def get_stock_fundamentals(symbol: str):
    """Returns fundamental metrics, valuation ratios, financial statements, and composite stock score."""
    return market_data_service.get_stock_fundamentals_and_financials(symbol)

@router.get("/stocks/{symbol}/score")
def get_stock_score(symbol: str):
    """Returns composite score analyzing financial results, news sentiment (positive vs negative), and institutional shareholding."""
    from backend.services.stock_score_service import stock_score_service
    return stock_score_service.calculate_score_for_symbol(symbol)

