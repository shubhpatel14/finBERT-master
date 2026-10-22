"""
Page 1: Market Intelligence Dashboard
Aggregated sentiment analytics across Indian financial news with dynamic filtering,
trend analysis, and sentiment distribution.
"""

import os
import streamlit as st
import pandas as pd
from datetime import datetime

# Page Configuration
st.set_page_config(
    page_title="Market Intelligence | EdgeFinder",
    page_icon="⚡",
    layout="wide"
)

# Apply CSS
css_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "styles.css")
if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Imports
from components.sidebar import render_sidebar
from components.metric_cards import (
    render_metric_card_html,
    render_headline_card_html,
    get_sentiment_badge_html
)
from components.charts import (
    create_sentiment_gauge,
    create_sentiment_donut,
    create_trend_line_chart,
    create_sentiment_histogram
)
from services.finbert_service import get_finbert_service
from data.sample_market_data import get_curated_news_df, SAMPLE_INDIAN_COMPANIES

render_sidebar()

st.markdown("""
<div class="terminal-header">
    <div class="terminal-brand">
        <span style="color: #38bdf8; font-size: 1.4rem;">📊</span>
        <div>
            <div class="terminal-title">MARKET INTELLIGENCE DASHBOARD</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                INDIAN EQUITIES FINANCIAL NLP AGGREGATE SENTIMENT MONITOR
            </div>
        </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
        <span class="terminal-badge" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3);">
            DEMO DATASET (SIMULATED HISTORICAL FEED)
        </span>
    </div>
</div>
""", unsafe_allow_html=True)

# Initialize Session State for Market Data
finbert_service = get_finbert_service()

if "market_news_df" not in st.session_state:
    with st.spinner("Analyzing Indian market news corpus with FinBERT..."):
        base_df = get_curated_news_df()
        preds = finbert_service.predict_batch(base_df["headline"].tolist())
        p_df = pd.DataFrame(preds)
        merged = pd.concat([
            base_df.reset_index(drop=True),
            p_df[["sentiment", "confidence", "sentiment_score", "positive_prob", "negative_prob", "neutral_prob"]]
        ], axis=1)
        st.session_state["market_news_df"] = merged

full_df: pd.DataFrame = st.session_state["market_news_df"]

# Filter Bar
st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.8rem; color: #38bdf8; font-weight: 700; margin-bottom: 6px;'>TERMINAL FILTERS</div>", unsafe_allow_html=True)

fcol1, fcol2, fcol3, fcol4 = st.columns([1.5, 1.2, 1.2, 1.5])

with fcol1:
    company_options = ["All Companies"] + sorted(list(full_df["company"].unique()))
    selected_company = st.selectbox("Company", company_options, index=0)

with fcol2:
    sector_options = ["All Sectors"] + sorted(list(full_df["sector"].unique()))
    selected_sector = st.selectbox("Sector", sector_options, index=0)

with fcol3:
    sentiment_options = ["All Sentiments", "Positive", "Negative", "Neutral"]
    selected_sentiment = st.selectbox("Sentiment", sentiment_options, index=0)

with fcol4:
    date_options = ["All Dates"] + sorted(list(full_df["date"].unique()), reverse=True)
    selected_date = st.selectbox("Date", date_options, index=0)

# Apply Filters
filtered_df = full_df.copy()
if selected_company != "All Companies":
    filtered_df = filtered_df[filtered_df["company"] == selected_company]
if selected_sector != "All Sectors":
    filtered_df = filtered_df[filtered_df["sector"] == selected_sector]
if selected_sentiment != "All Sentiments":
    filtered_df = filtered_df[filtered_df["sentiment"] == selected_sentiment.lower()]
if selected_date != "All Dates":
    filtered_df = filtered_df[filtered_df["date"] == selected_date]

# Metric Calculations
total_count = len(filtered_df)
pos_count = (filtered_df["sentiment"] == "positive").sum()
neg_count = (filtered_df["sentiment"] == "negative").sum()
neu_count = (filtered_df["sentiment"] == "neutral").sum()
avg_score = round(filtered_df["sentiment_score"].mean(), 4) if total_count > 0 else 0.0
avg_conf = round(filtered_df["confidence"].mean() * 100, 1) if total_count > 0 else 0.0

# Render Metric Grid
m1, m2, m3, m4, m5 = st.columns(5)
with m1:
    st.markdown(render_metric_card_html("ARTICLES FILTERED", f"{total_count}", f"of {len(full_df)} total corpus", "cyan"), unsafe_allow_html=True)
with m2:
    pos_pct = f"{(pos_count/total_count*100):.1f}%" if total_count else "0%"
    st.markdown(render_metric_card_html("BULLISH ARTICLES", f"{pos_count}", pos_pct, "green"), unsafe_allow_html=True)
with m3:
    neg_pct = f"{(neg_count/total_count*100):.1f}%" if total_count else "0%"
    st.markdown(render_metric_card_html("BEARISH ARTICLES", f"{neg_count}", neg_pct, "red"), unsafe_allow_html=True)
with m4:
    neu_pct = f"{(neu_count/total_count*100):.1f}%" if total_count else "0%"
    st.markdown(render_metric_card_html("NEUTRAL ARTICLES", f"{neu_count}", neu_pct, "neutral"), unsafe_allow_html=True)
with m5:
    accent = "green" if avg_score > 0.05 else "red" if avg_score < -0.05 else "neutral"
    sign = "+" if avg_score > 0 else ""
    st.markdown(render_metric_card_html("AVG NET SENTIMENT", f"{sign}{avg_score:.3f}", f"Avg Conf: {avg_conf}%", accent), unsafe_allow_html=True)

st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)

# Charts Layout
c1, c2 = st.columns([1, 1.8])

with c1:
    st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.82rem; color: #38bdf8; font-weight: 700; margin-bottom: 6px;'>SENTIMENT DISTRIBUTION</div>", unsafe_allow_html=True)
    if total_count > 0:
        donut_chart = create_sentiment_donut({"positive": pos_count, "negative": neg_count, "neutral": neu_count})
        st.plotly_chart(donut_chart, use_container_width=True, config={"displayModeBar": False})
    else:
        st.info("No articles match the current filter criteria.")

with c2:
    st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.82rem; color: #38bdf8; font-weight: 700; margin-bottom: 6px;'>SENTIMENT TRAJECTORY OVER TIME</div>", unsafe_allow_html=True)
    if total_count > 0:
        trend_chart = create_trend_line_chart(filtered_df)
        st.plotly_chart(trend_chart, use_container_width=True, config={"displayModeBar": False})
    else:
        st.info("No trend data available for selected filter.")

# Top Positive and Top Negative Breakdown
st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)
top_pos_col, top_neg_col = st.columns(2)

with top_pos_col:
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <span style="color: #05d554; font-size: 1rem;">▲</span>
        <span style="font-family: 'JetBrains Mono'; font-weight: 700; font-size: 0.85rem; color: #05d554;">
            TOP BULLISH HEADLINES (HIGHEST SENTIMENT SCORE)
        </span>
    </div>
    """, unsafe_allow_html=True)
    top_positives = filtered_df[filtered_df["sentiment"] == "positive"].sort_values(by="sentiment_score", ascending=False).head(3)
    if not top_positives.empty:
        for _, row in top_positives.iterrows():
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
    else:
        st.caption("No bullish articles found in current filter.")

with top_neg_col:
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <span style="color: #f43f5e; font-size: 1rem;">▼</span>
        <span style="font-family: 'JetBrains Mono'; font-weight: 700; font-size: 0.85rem; color: #f43f5e;">
            TOP BEARISH HEADLINES (LOWEST SENTIMENT SCORE)
        </span>
    </div>
    """, unsafe_allow_html=True)
    top_negatives = filtered_df[filtered_df["sentiment"] == "negative"].sort_values(by="sentiment_score", ascending=True).head(3)
    if not top_negatives.empty:
        for _, row in top_negatives.iterrows():
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
    else:
        st.caption("No bearish articles found in current filter.")

# Detailed Filtered Headlines Table
st.markdown("<div style='height: 18px;'></div>", unsafe_allow_html=True)
st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;'>ALL FILTERED HEADLINES ({len(filtered_df)})</div>", unsafe_allow_html=True)

if not filtered_df.empty:
    display_cols = ["date", "company", "sector", "headline", "sentiment", "confidence", "sentiment_score"]
    table_df = filtered_df[display_cols].copy()
    table_df.columns = ["Date", "Company", "Sector", "Headline", "Predicted Sentiment", "Confidence", "Net Score"]
    
    # Format
    table_df["Confidence"] = table_df["Confidence"].apply(lambda x: f"{x*100:.1f}%")
    table_df["Net Score"] = table_df["Net Score"].apply(lambda x: f"{x:+.3f}")
    
    st.dataframe(
        table_df,
        use_container_width=True,
        hide_index=True,
        height=300
    )
else:
    st.warning("No records match the selected filter criteria.")

# Interactive Add Headline Expander
with st.expander("➕ Append Fresh Indian Market Headline to Live Session"):
    with st.form("append_headline_form"):
        st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.78rem; color: #94a3b8;'>Add a real or breaking Indian corporate headline to immediately evaluate with FinBERT and update this dashboard:</div>", unsafe_allow_html=True)
        col_c, col_d, col_h = st.columns([1.5, 1, 3.5])
        with col_c:
            new_company = st.selectbox("Associated Company", list(SAMPLE_INDIAN_COMPANIES.keys()))
        with col_d:
            new_date = st.date_input("Date", value=datetime.today())
        with col_h:
            new_headline = st.text_input("News Headline", placeholder="e.g. Larsen & Toubro wins ₹4,200 crore power transmission project in Gujarat...")
        
        submitted = st.form_submit_button("Analyze & Append to Session", type="primary")
        if submitted:
            if not new_headline.strip():
                st.error("Please provide a valid headline.")
            else:
                pred = finbert_service.predict_single(new_headline)
                new_row = {
                    "company": new_company,
                    "date": str(new_date),
                    "headline": new_headline.strip(),
                    "category": "Manual Entry",
                    "source": "Terminal User Input",
                    "ticker": SAMPLE_INDIAN_COMPANIES.get(new_company, {}).get("ticker", "N/A"),
                    "sector": SAMPLE_INDIAN_COMPANIES.get(new_company, {}).get("sector", "N/A"),
                    "sentiment": pred["sentiment"],
                    "confidence": pred["confidence"],
                    "sentiment_score": pred["sentiment_score"],
                    "positive_prob": pred["scores"]["positive"],
                    "negative_prob": pred["scores"]["negative"],
                    "neutral_prob": pred["scores"]["neutral"]
                }
                st.session_state["market_news_df"] = pd.concat([
                    pd.DataFrame([new_row]),
                    st.session_state["market_news_df"]
                ], ignore_index=True)
                st.success(f"Classified as **{pred['sentiment'].upper()}** (Score: {pred['sentiment_score']:+.3f}) and appended!")
                st.rerun()
