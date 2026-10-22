"""
EdgeFinder – Intelligent Indian Market Analysis & Decision Support System
Main Application Entry Point & Terminal Hub
"""

import os
import streamlit as st
import pandas as pd
from datetime import datetime

# Configure Streamlit page settings
st.set_page_config(
    page_title="EdgeFinder | Indian Market Terminal",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load custom CSS
css_path = os.path.join(os.path.dirname(__file__), "assets", "styles.css")
if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Import components and service
from components.sidebar import render_sidebar
from components.metric_cards import render_metric_card_html, render_headline_card_html
from components.charts import create_sentiment_gauge, create_sentiment_donut
from services.finbert_service import get_finbert_service
from data.sample_market_data import get_curated_news_df, SAMPLE_INDIAN_COMPANIES

# Render sidebar
render_sidebar()

# Terminal Header Banner
st.markdown("""
<div class="terminal-header">
    <div class="terminal-brand">
        <span style="color: #38bdf8; font-size: 1.6rem;">⚡</span>
        <div>
            <div class="terminal-title">EDGEFINDER <span style="color: #38bdf8;">//</span> FINANCIAL TERMINAL</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                INTELLIGENT INDIAN MARKET SENTIMENT & DECISION INTELLIGENCE SYSTEM
            </div>
        </div>
    </div>
    <div style="display: flex; gap: 12px; align-items: center;">
        <span class="terminal-badge">LIVE ENGINE: PROSUSAI/FINBERT</span>
        <div class="terminal-status-pill">
            <span class="pulse-dot"></span>
            <span>SYSTEM OPERATIONAL</span>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# Pre-cache FinBERT model
with st.spinner("Verifying FinBERT Neural Engine..."):
    finbert_service = get_finbert_service()

# Cache market data analysis
@st.cache_data
def load_analyzed_market_data():
    raw_df = get_curated_news_df()
    predictions = finbert_service.predict_batch(raw_df["headline"].tolist(), batch_size=16)
    pred_df = pd.DataFrame(predictions)
    # Merge
    merged_df = pd.concat([raw_df.reset_index(drop=True), pred_df[["sentiment", "confidence", "sentiment_score", "positive_prob", "negative_prob", "neutral_prob"]]], axis=1)
    return merged_df

df_market = load_analyzed_market_data()

# Calculate high-level metrics
total_articles = len(df_market)
pos_count = (df_market["sentiment"] == "positive").sum()
neg_count = (df_market["sentiment"] == "negative").sum()
neu_count = (df_market["sentiment"] == "neutral").sum()
net_market_score = round(df_market["sentiment_score"].mean(), 4)
bullish_ratio = round((pos_count / total_articles) * 100, 1) if total_articles > 0 else 0.0

# Render Institutional Metric Grid
col1, col2, col3, col4, col5 = st.columns(5)
with col1:
    st.markdown(render_metric_card_html("TOTAL ANALYZED", f"{total_articles}", "Curated Indian News", "cyan"), unsafe_allow_html=True)
with col2:
    st.markdown(render_metric_card_html("BULLISH HEADLINES", f"{pos_count}", f"{bullish_ratio}% of corpus", "green"), unsafe_allow_html=True)
with col3:
    st.markdown(render_metric_card_html("BEARISH HEADLINES", f"{neg_count}", f"{(neg_count/total_articles*100):.1f}% of corpus", "red"), unsafe_allow_html=True)
with col4:
    st.markdown(render_metric_card_html("NEUTRAL HEADLINES", f"{neu_count}", f"{(neu_count/total_articles*100):.1f}% of corpus", "neutral"), unsafe_allow_html=True)
with col5:
    accent = "green" if net_market_score > 0.05 else "red" if net_market_score < -0.05 else "neutral"
    sign = "+" if net_market_score > 0 else ""
    st.markdown(render_metric_card_html("NET MARKET INDEX", f"{sign}{net_market_score:.3f}", "Range: [-1.0, +1.0]", accent), unsafe_allow_html=True)

st.markdown("<div style='height: 18px;'></div>", unsafe_allow_html=True)

# Overview Columns
left_col, right_col = st.columns([1.1, 1.9])

with left_col:
    st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;'>SENTIMENT BALANCE</div>", unsafe_allow_html=True)
    gauge_fig = create_sentiment_gauge(net_market_score, title="INDIAN MARKET NET SENTIMENT")
    st.plotly_chart(gauge_fig, use_container_width=True, config={"displayModeBar": False})
    
    donut_fig = create_sentiment_donut({"positive": pos_count, "negative": neg_count, "neutral": neu_count})
    st.plotly_chart(donut_fig, use_container_width=True, config={"displayModeBar": False})

with right_col:
    st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;'>RECENT HIGH-CONVICTION SIGNALS</div>", unsafe_allow_html=True)
    
    # Sort by absolute sentiment score
    top_conviction = df_market.sort_values(by="confidence", ascending=False).head(4)
    for _, row in top_conviction.iterrows():
        st.markdown(
            render_headline_card_html(
                headline=row["headline"],
                company=row["company"],
                date=row["date"],
                sentiment=row["sentiment"],
                confidence=row["confidence"],
                sentiment_score=row["sentiment_score"]
            ),
            unsafe_allow_html=True
        )

# Navigation Directory Cards
st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)
st.markdown("""
<div style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 12px; letter-spacing: 0.05em;">
    TERMINAL NAVIGATION MODULES
</div>
""", unsafe_allow_html=True)

mcol1, mcol2, mcol3, mcol4 = st.columns(4)

with mcol1:
    st.markdown("""
    <div class="terminal-card" style="height: 140px;">
        <div style="color: #38bdf8; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 0.9rem;">
            1. MARKET INTELLIGENCE
        </div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 8px; line-height: 1.4;">
            Multi-dimensional Indian equity dashboard, sector breakdowns, historical trends, and dynamic headline filters.
        </div>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Open Market Dashboard →", key="btn_nav_dash", use_container_width=True):
        st.switch_page("pages/1_Market_Dashboard.py")

with mcol2:
    st.markdown("""
    <div class="terminal-card" style="height: 140px;">
        <div style="color: #05d554; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 0.9rem;">
            2. SENTIMENT ANALYZER
        </div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 8px; line-height: 1.4;">
            Interactive single-headline NLP engine with confidence breakdown, 3-class probability meters, and execution telemetry.
        </div>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Open Sentiment Analyzer →", key="btn_nav_single", use_container_width=True):
        st.switch_page("pages/2_Sentiment_Analyzer.py")

with mcol3:
    st.markdown("""
    <div class="terminal-card" style="height: 140px;">
        <div style="color: #fbbf24; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 0.9rem;">
            3. BATCH NEWS ANALYSIS
        </div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 8px; line-height: 1.4;">
            Upload CSV portfolios of corporate disclosures, run batched inference, inspect histograms, and export enriched CSVs.
        </div>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Open Batch Analysis →", key="btn_nav_batch", use_container_width=True):
        st.switch_page("pages/3_Batch_Analysis.py")

with mcol4:
    st.markdown("""
    <div class="terminal-card" style="height: 140px;">
        <div style="color: #c084fc; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 0.9rem;">
            4. COMPANY EXPLORER
        </div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 8px; line-height: 1.4;">
            Dedicated company intelligence dossiers for Reliance, HDFC Bank, TCS, Infosys, and peer comparison rankings.
        </div>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Open Company Explorer →", key="btn_nav_comp", use_container_width=True):
        st.switch_page("pages/4_Company_Explorer.py")
