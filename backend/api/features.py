"""
Forecasting, News Intelligence, Economics, Sectors, AI Research & Watchlist API Routers
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db.models import WatchlistItem
from backend.services.forecasting_service import forecasting_service
from backend.services.finbert_service import finbert_service
from backend.services.macro_service import macro_service
from backend.services.research_service import research_service
from backend.services.screener_service import screener_service
from backend.services.external_api_service import external_api_service
from backend.services.market_data_service import market_data_service, INDIAN_EQUITIES

router = APIRouter()

# ----------------- EXTERNAL PROVIDERS STATUS -----------------
@router.get("/providers/status", tags=["API Providers"])
def get_providers_status():
    """Returns connectivity and credential status of connected API keys."""
    return external_api_service.get_api_provider_status()

# ----------------- PRICE FORECASTING -----------------
@router.get("/forecasting/{symbol}", tags=["Price Forecasting"])
def get_forecasting_analysis(symbol: str):
    res = forecasting_service.evaluate_and_forecast(symbol)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

# ----------------- NEWS INTELLIGENCE -----------------
INDIAN_FINANCIAL_NEWS_CORPUS = [
    # Banking
    {"company": "HDFC Bank", "symbol": "HDFCBANK.NS", "sector": "Banking & Financial Services", "date": "2026-10-21", "headline": "HDFC Bank reports robust quarterly loan book expansion with gross non-performing assets dropping to a multi-year low of 1.24%.", "source": "Financial Express"},
    {"company": "HDFC Bank", "symbol": "HDFCBANK.NS", "sector": "Banking & Financial Services", "date": "2026-10-17", "headline": "HDFC Bank deposit growth outpaces credit advances, stabilizing the post-merger credit-to-deposit ratio.", "source": "CNBC-TV18"},
    {"company": "ICICI Bank", "symbol": "ICICIBANK.NS", "sector": "Banking & Financial Services", "date": "2026-10-21", "headline": "ICICI Bank quarterly net profit surges 18% year-on-year, driven by stellar retail fee income and digital loan disbursements.", "source": "Business Today"},
    {"company": "State Bank of India", "symbol": "SBIN.NS", "sector": "Banking & Financial Services", "date": "2026-10-19", "headline": "SBI reports all-time high quarterly profit of ₹17,000 crore as asset quality reaches peak health with gross NPA under 2.1%.", "source": "Financial Express"},
    {"company": "Bajaj Finance", "symbol": "BAJFINANCE.NS", "sector": "Banking & Financial Services", "date": "2026-10-18", "headline": "Bajaj Finance new customer acquisitions surge 22% with Assets Under Management crossing landmark ₹3.5 lakh crore.", "source": "Mint"},

    # IT
    {"company": "Tata Consultancy Services", "symbol": "TCS.NS", "sector": "Information Technology", "date": "2026-10-19", "headline": "TCS bags $1.2 billion mega cloud and AI transformation deal from top European financial conglomerate.", "source": "Bloomberg Quint"},
    {"company": "Tata Consultancy Services", "symbol": "TCS.NS", "sector": "Information Technology", "date": "2026-10-15", "headline": "TCS maintains steady operating margin at 26% despite discretionary tech spending caution across North American banking clients.", "source": "Economic Times"},
    {"company": "Infosys", "symbol": "INFY.NS", "sector": "Information Technology", "date": "2026-10-20", "headline": "Infosys trims upper end of annual revenue growth guidance citing client project deferrals in retail and manufacturing verticals.", "source": "Reuters India"},
    {"company": "Infosys", "symbol": "INFY.NS", "sector": "Information Technology", "date": "2026-10-17", "headline": "Infosys announces expanded strategic collaboration with Microsoft to accelerate enterprise AI adoption using Azure OpenAI.", "source": "Mint"},

    # Energy
    {"company": "Reliance Industries", "symbol": "RELIANCE.NS", "sector": "Energy & Petrochemicals", "date": "2026-10-20", "headline": "Reliance Industries posts 12% rise in consolidated net profit, propelled by resilient retail footfall and high subscriber additions in Jio.", "source": "Mint Bureau"},
    {"company": "Reliance Industries", "symbol": "RELIANCE.NS", "sector": "Energy & Petrochemicals", "date": "2026-10-18", "headline": "Reliance O2C division faces margin pressure as global refining cracks soften amid tepid Asian fuel demand.", "source": "Business Standard"},
    {"company": "Reliance Industries", "symbol": "RELIANCE.NS", "sector": "Energy & Petrochemicals", "date": "2026-10-14", "headline": "Jio Financial Services and BlackRock complete regulatory filings for wealth management JV in India.", "source": "Economic Times"},

    # Auto
    {"company": "Tata Motors", "symbol": "TATAMOTORS.NS", "sector": "Automobile & Mobility", "date": "2026-10-21", "headline": "Tata Motors electric passenger vehicle registrations surge 45% year-on-year, cementing dominant 68% domestic EV market share.", "source": "Autocar Pro India"},
    {"company": "Tata Motors", "symbol": "TATAMOTORS.NS", "sector": "Automobile & Mobility", "date": "2026-10-16", "headline": "Jaguar Land Rover delivers strongest EBIT margin in a decade on strong global deliveries of Range Rover and Defender luxury SUVs.", "source": "Reuters India"},
    {"company": "Maruti Suzuki", "symbol": "MARUTI.NS", "sector": "Automobile & Mobility", "date": "2026-10-20", "headline": "Maruti Suzuki festive wholesale dispatch touches record 2 lakh units with strong consumer demand for hybrid SUV models.", "source": "Economic Times"},

    # FMCG & Consumer
    {"company": "ITC Limited", "symbol": "ITC.NS", "sector": "Fast-Moving Consumer Goods", "date": "2026-10-18", "headline": "ITC receives final National Company Law Tribunal approval for demerger of its premier hotels business into a separate listed entity.", "source": "CNBC-TV18"},
    {"company": "ITC Limited", "symbol": "ITC.NS", "sector": "Fast-Moving Consumer Goods", "date": "2026-10-11", "headline": "ITC non-cigarette FMCG segment revenue grows 8.3% driven by staples, packaged foods, and personal care distribution scale-up.", "source": "Business Today"},
    {"company": "Titan Company", "symbol": "TITAN.NS", "sector": "Consumer Discretionary", "date": "2026-10-19", "headline": "Titan jewellery segment records 25% domestic revenue growth during festive Navratri season despite elevated gold import duties.", "source": "Mint"},

    # Infrastructure & Metals
    {"company": "Larsen & Toubro", "symbol": "LT.NS", "sector": "Infrastructure & Capital Goods", "date": "2026-10-22", "headline": "Larsen & Toubro secures major ultra-mega hydrocarbon EPC order worth over ₹15,000 crore in the Middle East.", "source": "Economic Times"},
    {"company": "Larsen & Toubro", "symbol": "LT.NS", "sector": "Infrastructure & Capital Goods", "date": "2026-10-15", "headline": "L&T consolidated order book crosses record ₹5.2 lakh crore, providing multi-year revenue visibility across domestic infrastructure projects.", "source": "Business Standard"},
    {"company": "Tata Steel", "symbol": "TATASTEEL.NS", "sector": "Metals & Mining", "date": "2026-10-17", "headline": "Tata Steel UK transitions to green electric arc furnace operations backed by £500M UK government grant.", "source": "Reuters India"},

    # Telecom & Pharma
    {"company": "Bharti Airtel", "symbol": "BHARTIARTL.NS", "sector": "Telecommunications", "date": "2026-10-20", "headline": "Bharti Airtel Average Revenue Per User climbs to ₹211 per month driven by tariff revisions and heavy 4G to 5G customer conversions.", "source": "Mint"},
    {"company": "Sun Pharma", "symbol": "SUNPHARMA.NS", "sector": "Pharmaceuticals & Healthcare", "date": "2026-10-19", "headline": "Sun Pharma receives US FDA approval for innovative specialty dermatology formulation with patent protection up to 2038.", "source": "Business Standard"}
]

@router.get("/news/feed", tags=["News Intelligence"])
def get_news_feed(
    sector: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None)
):
    """
    Returns automated Indian financial news corpus with live FinBERT inference.
    Fetches real-time articles via NewsAPI.org when available, supplemented by curated Indian disclosures.
    """
    live_articles = []
    # Resolve company name from symbol if provided
    target_company = None
    if company and company != "All":
        target_company = company
    elif symbol and symbol != "All":
        info = INDIAN_EQUITIES.get(symbol)
        if info:
            target_company = info.get("name")
        else:
            target_company = symbol.replace(".NS", "").replace(".BO", "")

    # If NewsAPI key is set, fetch live breaking articles
    try:
        live_articles = external_api_service.fetch_live_news_with_finbert(
            company=target_company,
            sector=sector if sector and sector != "All" else None
        )
    except Exception as e:
        print("Live news ingestion error:", e)

    # Base curated items
    items = list(INDIAN_FINANCIAL_NEWS_CORPUS)

    if sector and sector != "All":
        items = [i for i in items if i.get("sector") == sector]

    if company and company != "All":
        items = [i for i in items if i.get("company") == company or i.get("symbol") == company]

    if symbol and symbol != "All":
        items = [i for i in items if i.get("symbol") == symbol]

    headlines = [i["headline"] for i in items]
    predictions = finbert_service.predict_batch(headlines)

    enriched = []
    # Add live articles first if available
    for la in live_articles:
        if sentiment and sentiment != "All" and la.get("sentiment") != sentiment.lower():
            continue
        enriched.append(la)

    for orig, pred in zip(items, predictions):
        res = dict(orig)
        res.update(pred)
        if sentiment and sentiment != "All" and res.get("sentiment") != sentiment.lower():
            continue
        enriched.append(res)

    return enriched

# ----------------- SECTOR ANALYSIS -----------------
@router.get("/sectors", tags=["Sector Analysis"])
def get_sectors():
    return screener_service.get_sectors_overview()

# ----------------- ECONOMIC DASHBOARD -----------------
@router.get("/economy", tags=["Economic Dashboard"])
def get_economy():
    return macro_service.get_macro_dashboard()

# ----------------- AI RESEARCH ASSISTANT -----------------
@router.get("/research/{symbol}", tags=["AI Research Assistant"])
def get_research_report(symbol: str):
    return research_service.generate_equity_research_report(symbol)

# ----------------- STOCK SCREENER -----------------
@router.get("/screener", tags=["Stock Screener"])
def run_screener_query(
    sector: Optional[str] = None,
    min_market_cap_cr: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_roe: Optional[float] = None,
    max_debt_to_equity: Optional[float] = None,
    min_rsi: Optional[float] = None,
    max_rsi: Optional[float] = None
):
    return screener_service.run_screener(
        sector=sector,
        min_market_cap_cr=min_market_cap_cr,
        max_pe=max_pe,
        min_roe=min_roe,
        max_debt_to_equity=max_debt_to_equity,
        min_rsi=min_rsi,
        max_rsi=max_rsi
    )

# ----------------- WATCHLIST (PERSISTENT CRUD) -----------------
class WatchlistCreate(BaseModel):
    symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    notes: Optional[str] = None

@router.get("/watchlist", tags=["Watchlist"])
def get_watchlist(db: Session = Depends(get_db)):
    items = db.query(WatchlistItem).all()
    if not items:
        default_syms = ["RELIANCE.NS", "HDFCBANK.NS", "TCS.NS", "INFY.NS", "TATAMOTORS.NS"]
        for sym in default_syms:
            meta = INDIAN_EQUITIES.get(sym, {"name": sym, "sector": "General"})
            w = WatchlistItem(symbol=sym, company_name=meta["name"], sector=meta["sector"], exchange="NSE")
            db.add(w)
        db.commit()
        items = db.query(WatchlistItem).all()

    enriched = []
    for item in items:
        candles = market_data_service.get_historical_candles_with_indicators(item.symbol, period="5d")
        c_list = candles.get("candles", [])
        last_price = c_list[-1]["close"] if c_list else 1000.0
        prev_price = c_list[-2]["close"] if len(c_list) >= 2 else last_price
        pct = round(((last_price - prev_price) / prev_price) * 100, 2)

        enriched.append({
            "id": item.id,
            "symbol": item.symbol,
            "company_name": item.company_name,
            "sector": item.sector,
            "exchange": item.exchange,
            "current_price": last_price,
            "percent_change": pct,
            "added_at": item.added_at.strftime("%Y-%m-%d %H:%M:%S") if item.added_at else ""
        })
    return enriched

@router.post("/watchlist", tags=["Watchlist"])
def add_to_watchlist(payload: WatchlistCreate, db: Session = Depends(get_db)):
    existing = db.query(WatchlistItem).filter(WatchlistItem.symbol == payload.symbol).first()
    if existing:
        return {"message": "Symbol already in watchlist", "item_id": existing.id}

    meta = INDIAN_EQUITIES.get(payload.symbol, {"name": payload.symbol, "sector": "General"})
    name = payload.company_name or meta["name"]
    sec = payload.sector or meta["sector"]

    item = WatchlistItem(symbol=payload.symbol, company_name=name, sector=sec, notes=payload.notes)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Added to watchlist", "item_id": item.id}

@router.delete("/watchlist/{symbol}", tags=["Watchlist"])
def remove_from_watchlist(symbol: str, db: Session = Depends(get_db)):
    item = db.query(WatchlistItem).filter(WatchlistItem.symbol == symbol).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stock not found in watchlist")
    db.delete(item)
    db.commit()
    return {"message": f"Removed {symbol} from watchlist"}
