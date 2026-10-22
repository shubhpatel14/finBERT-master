"""
SQLAlchemy Persistent Data Models for EdgeFinder Terminal
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime
from backend.db.database import Base

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), unique=True, index=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    exchange = Column(String(20), default="NSE")
    sector = Column(String(100), default="General")
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

class NewsArticleRecord(Base):
    __tablename__ = "news_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    headline = Column(Text, nullable=False)
    company = Column(String(100), index=True)
    symbol = Column(String(50), index=True)
    source = Column(String(100), default="Financial Wire")
    category = Column(String(100), default="General")
    published_date = Column(String(50))
    sentiment = Column(String(20)) # positive, negative, neutral
    confidence = Column(Float)
    sentiment_score = Column(Float) # positive - negative
    positive_prob = Column(Float)
    negative_prob = Column(Float)
    neutral_prob = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class ForecastResultRecord(Base):
    __tablename__ = "forecast_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), index=True, nullable=False)
    horizon_days = Column(Integer, nullable=False) # 1, 5, 20
    current_price = Column(Float, nullable=False)
    point_forecast = Column(Float, nullable=False)
    lower_95 = Column(Float, nullable=False)
    upper_95 = Column(Float, nullable=False)
    mae = Column(Float)
    rmse = Column(Float)
    directional_accuracy = Column(Float) # percentage
    naive_baseline_mae = Column(Float)
    model_name = Column(String(100), default="WalkForward ARIMA-GARCH Volatility Ensemble")
    created_at = Column(DateTime, default=datetime.utcnow)
