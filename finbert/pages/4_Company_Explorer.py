"""
Page 4: Indian Company News Explorer
Company-level financial intelligence, peer sentiment comparison,
custom company headline analysis, and production API integration architecture.
"""

import os
import streamlit as st
import pandas as pd
from datetime import datetime

# Configure Page
st.set_page_config(
    page_title="Company Explorer | EdgeFinder",
    page_icon="⚡",
    layout="wide"
)

# Apply CSS
css_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "styles.css")
if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

from components.sidebar import render_sidebar
from components.metric_cards import (
    render_metric_card_html,
    render_headline_card_html,
    get_sentiment_badge_html
)
from components.charts import (
    create_sentiment_gauge,
    create_sentiment_donut,
    create_company_comparison_bar
)
from services.finbert_service import get_finbert_service
from data.sample_market_data import SAMPLE_INDIAN_COMPANIES, get_curated_news_df

render_sidebar()

st.markdown("""
<div class="terminal-header">
    <div class="terminal-brand">
        <span style="color: #c084fc; font-size: 1.4rem;">🏢</span>
        <div>
            <div class="terminal-title">INDIAN COMPANY SENTIMENT EXPLORER</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                ENTERPRISE-SPECIFIC NLP DOSSIER, PEER LEADERBOARD & HEADLINE AGGREGATOR
            </div>
        </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
        <span class="terminal-badge">EQUITY RESEARCH</span>
    </div>
</div>
""", unsafe_allow_html=True)

finbert_service = get_finbert_service()

# Ensure session state has market news
if "market_news_df" not in st.session_state:
    with st.spinner("Initializing company news repository..."):
        base_df = get_curated_news_df()
        preds = finbert_service.predict_batch(base_df["headline"].tolist())
        p_df = pd.DataFrame(preds)
        st.session_state["market_news_df"] = pd.concat([
            base_df.reset_index(drop=True),
            p_df[["sentiment", "confidence", "sentiment_score", "positive_prob", "negative_prob", "neutral_prob"]]
        ], axis=1)

full_df: pd.DataFrame = st.session_state["market_news_df"]

# Company Selector
companies_list = list(SAMPLE_INDIAN_COMPANIES.keys())
sel_col1, sel_col2 = st.columns([1.5, 2.5])

with sel_col1:
    selected_company = st.selectbox("Select Target Indian Enterprise:", companies_list, index=0)

comp_meta = SAMPLE_INDIAN_COMPANIES.get(selected_company, {})
comp_df = full_df[full_df["company"] == selected_company].copy()

with sel_col2:
    st.markdown(f"""
    <div style="background: #0f1724; border: 1px solid #1e293b; border-radius: 6px; padding: 10px 14px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <span style="font-family: 'JetBrains Mono'; color: #38bdf8; font-weight: 700; font-size: 0.95rem;">{selected_company}</span>
            <span style="font-family: 'JetBrains Mono'; color: #64748b; font-size: 0.8rem; margin-left: 8px;">({comp_meta.get('ticker', 'N/A')})</span>
        </div>
        <div style="font-family: 'JetBrains Mono'; font-size: 0.74rem; color: #94a3b8;">
            Sector: <strong style="color: #ffffff;">{comp_meta.get('sector', 'N/A')}</strong> | Cap: <strong style="color: #fbbf24;">{comp_meta.get('market_cap_tier', 'N/A')}</strong>
        </div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='height: 14px;'></div>", unsafe_allow_html=True)

# Metrics for Selected Company
comp_count = len(comp_df)
pos_c = (comp_df["sentiment"] == "positive").sum() if comp_count else 0
neg_c = (comp_df["sentiment"] == "negative").sum() if comp_count else 0
neu_c = (comp_df["sentiment"] == "neutral").sum() if comp_count else 0
comp_avg_score = round(comp_df["sentiment_score"].mean(), 4) if comp_count else 0.0
comp_conf = round(comp_df["confidence"].mean() * 100, 1) if comp_count else 0.0

m1, m2, m3, m4, m5 = st.columns(5)
with m1:
    st.markdown(render_metric_card_html("ARTICLES TRACKED", f"{comp_count}", f"in {selected_company}", "cyan"), unsafe_allow_html=True)
with m2:
    st.markdown(render_metric_card_html("BULLISH SIGNALS", f"{pos_c}", f"{(pos_c/comp_count*100):.1f}%" if comp_count else "0%", "green"), unsafe_allow_html=True)
with m3:
    st.markdown(render_metric_card_html("BEARISH SIGNALS", f"{neg_c}", f"{(neg_c/comp_count*100):.1f}%" if comp_count else "0%", "red"), unsafe_allow_html=True)
with m4:
    st.markdown(render_metric_card_html("NEUTRAL SIGNALS", f"{neu_c}", f"{(neu_c/comp_count*100):.1f}%" if comp_count else "0%", "neutral"), unsafe_allow_html=True)
with m5:
    accent = "green" if comp_avg_score > 0.05 else "red" if comp_avg_score < -0.05 else "neutral"
    sign = "+" if comp_avg_score > 0 else ""
    st.markdown(render_metric_card_html("COMPANY SENTIMENT", f"{sign}{comp_avg_score:.3f}", f"Avg Conf: {comp_conf}%", accent), unsafe_allow_html=True)

st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)

# Company Visualizations
vcol1, vcol2 = st.columns([1, 1.4])
with vcol1:
    st.markdown(f"<div style='font-family: JetBrains Mono; font-size: 0.82rem; color: #38bdf8; font-weight: 700; margin-bottom: 6px;'>{selected_company.upper()} SENTIMENT BALANCE</div>", unsafe_allow_html=True)
    gauge = create_sentiment_gauge(comp_avg_score, title=f"{comp_meta.get('ticker', 'COMPANY')} SCORE")
    st.plotly_chart(gauge, use_container_width=True, config={"displayModeBar": False})
    
    donut = create_sentiment_donut({"positive": pos_c, "negative": neg_c, "neutral": neu_c})
    st.plotly_chart(donut, use_container_width=True, config={"displayModeBar": False})

with vcol2:
    st.markdown(f"<div style='font-family: JetBrains Mono; font-size: 0.82rem; color: #38bdf8; font-weight: 700; margin-bottom: 6px;'>ANALYZED HEADLINES FOR {selected_company.upper()}</div>", unsafe_allow_html=True)
    if not comp_df.empty:
        for _, row in comp_df.iterrows():
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
        st.info("No headlines tracked yet for this company.")

    # Form to add news to this company
    with st.expander(f"➕ Evaluate and Link Custom News for {selected_company}"):
        with st.form("add_comp_headline"):
            custom_text = st.text_input("Financial Headline / Regulatory Disclosure:", placeholder=f"Enter breaking news regarding {selected_company}...")
            c_date = st.date_input("Date", value=datetime.today())
            sub = st.form_submit_button("Analyze with FinBERT & Link to Company", type="primary")
            if sub and custom_text.strip():
                pred = finbert_service.predict_single(custom_text)
                new_entry = {
                    "company": selected_company,
                    "date": str(c_date),
                    "headline": custom_text.strip(),
                    "category": "User Input",
                    "source": "Terminal Analyst",
                    "ticker": comp_meta.get("ticker", "N/A"),
                    "sector": comp_meta.get("sector", "N/A"),
                    "sentiment": pred["sentiment"],
                    "confidence": pred["confidence"],
                    "sentiment_score": pred["sentiment_score"],
                    "positive_prob": pred["scores"]["positive"],
                    "negative_prob": pred["scores"]["negative"],
                    "neutral_prob": pred["scores"]["neutral"]
                }
                st.session_state["market_news_df"] = pd.concat([
                    pd.DataFrame([new_entry]),
                    st.session_state["market_news_df"]
                ], ignore_index=True)
                st.success(f"Classified as **{pred['sentiment'].upper()}** (Score: {pred['sentiment_score']:+.3f}) and appended to {selected_company}!")
                st.rerun()

# Cross-Company Peer Comparison Leaderboard
st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)
st.markdown("""
<div style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;">
    CROSS-ENTERPRISE PEER SENTIMENT BENCHMARKING
</div>
""", unsafe_allow_html=True)

# Compute company leaderboard
company_stats = []
for c_name in companies_list:
    c_sub = full_df[full_df["company"] == c_name]
    if not c_sub.empty:
        c_score = c_sub["sentiment_score"].mean()
        company_stats.append({
            "company": c_name,
            "ticker": SAMPLE_INDIAN_COMPANIES[c_name]["ticker"],
            "sector": SAMPLE_INDIAN_COMPANIES[c_name]["sector"],
            "avg_score": round(c_score, 4),
            "article_count": len(c_sub),
            "bullish_count": (c_sub["sentiment"] == "positive").sum(),
            "bearish_count": (c_sub["sentiment"] == "negative").sum()
        })

comp_summary_df = pd.DataFrame(company_stats)

pcol1, pcol2 = st.columns([1.5, 1.2])
with pcol1:
    bar_chart = create_company_comparison_bar(comp_summary_df)
    st.plotly_chart(bar_chart, use_container_width=True, config={"displayModeBar": False})

with pcol2:
    st.markdown("""
    <div style="background: #0f1724; border: 1px solid #1e293b; border-radius: 6px; padding: 14px; font-size: 0.76rem; color: #94a3b8; line-height: 1.6;">
        <div style="font-family: 'JetBrains Mono'; font-weight: 700; color: #38bdf8; margin-bottom: 8px;">
            PRODUCTION LIVE NEWS INTEGRATION ARCHITECTURE
        </div>
        <p>In institutional production, EdgeFinder is designed to connect to automated live feeds without modifying the FinBERT inference service:</p>
        <ul style="padding-left: 18px; margin: 6px 0;">
            <li><strong>NSE / BSE Corporate Announcements API:</strong> Ingests SEBI LODR Regulation 30 regulatory filings in real time.</li>
            <li><strong>Financial News Wire RSS:</strong> Polls Economic Times, Mint, Business Standard, and Reuters India.</li>
            <li><strong>Scheduled Microservice:</strong> Periodically pulls, de-duplicates, and invokes <code>FinBERTService.predict_batch()</code>.</li>
            <li><strong>Storage & Alerts:</strong> Stores results in PostgreSQL / TimescaleDB and emits Telegram / Slack alerts on extreme sentiment swings.</li>
        </ul>
        <div style="color: #64748b; font-style: italic; margin-top: 6px;">
            Current view demonstrates the complete analytical dashboard using curated real-world historical disclosures.
        </div>
    </div>
    """, unsafe_allow_html=True)
