"""
Page 3: Batch News Analysis
High-throughput batch CSV processing, model inference with live progress tracking,
statistical breakdown, and exportable financial intelligence reports.
"""

import os
import io
import time
import streamlit as st
import pandas as pd

# Configure Page
st.set_page_config(
    page_title="Batch Analysis | EdgeFinder",
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
    create_sentiment_donut,
    create_sentiment_histogram,
    create_sentiment_gauge
)
from services.finbert_service import get_finbert_service
from data.sample_market_data import CURATED_HEADLINES

render_sidebar()

st.markdown("""
<div class="terminal-header">
    <div class="terminal-brand">
        <span style="color: #fbbf24; font-size: 1.4rem;">📁</span>
        <div>
            <div class="terminal-title">BATCH NEWS ANALYSIS WORKSTATION</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                HIGH-THROUGHPUT CSV INGESTION, PARALLEL TENSOR CLASSIFICATION & EXPORT
            </div>
        </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
        <span class="terminal-badge">BATCH ENGINE</span>
    </div>
</div>
""", unsafe_allow_html=True)

# Helper for Sample CSV
SAMPLE_BATCH_CSV = """headline,company,date
"Reliance Industries reports strong quarterly profits, supported by growth in its retail business.",Reliance Industries,2026-10-20
"HDFC Bank gross NPA drops to multi-year low of 1.24% with sustained loan disbursements.",HDFC Bank,2026-10-21
"Infosys trims upper end of annual revenue growth guidance amid discretionary spending cuts.",Infosys,2026-10-20
"TCS signs landmark $1.2B artificial intelligence transformation deal with European lender.",TCS,2026-10-19
"ICICI Bank net profit rises 18% year-on-year driven by digital credit volume.",ICICI Bank,2026-10-21
"Larsen & Toubro bags ₹15,000 crore hydrocarbon order in the Middle East.",Larsen & Toubro,2026-10-22
"State Bank of India posts record quarterly net profit of ₹17,000 crore.",State Bank of India,2026-10-19
"Tata Motors electric vehicle deliveries jump 45% capturing 68% market share.",Tata Motors,2026-10-21
"Bharti Airtel monthly ARPU rises to ₹211 backed by 5G user additions.",Bharti Airtel,2026-10-20
"ITC secures NCLT approval for demerger of its luxury hotels division.",ITC Limited,2026-10-18
"Ruukki Group calculates that it has lost EUR 4mn in the failed project.",Ruukki Group,2026-10-15
"Operating profit rose to EUR 5mn from EUR 2.8mn in the fourth quarter.",Basware Corp,2026-10-12
"Sales in the three months slid to EUR 86.4m from EUR 91.2m last year.",Global Industrial,2026-10-10
"Marathon estimates the value of its remaining stake in Protalix at $27 million.",Marathon Oil,2026-10-08
"The company expects subdued EBITDA margins due to elevated raw material and freight costs.",Bharat Forge,2026-10-05
"""

# Upload Section & Sample Helpers
st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.82rem; color: #38bdf8; font-weight: 700; margin-bottom: 6px;'>INGESTION PIPELINE</div>", unsafe_allow_html=True)

up_col1, up_col2 = st.columns([2.5, 1.5])

with up_col1:
    uploaded_file = st.file_uploader(
        "Upload Financial News CSV (Accepts columns: 'headline', 'text', 'sentence', 'news', 'title')",
        type=["csv"],
        help="Upload a CSV file with financial text. Maximum tested batch size: 2,000 articles."
    )

with up_col2:
    st.markdown("""
    <div style="background: #0f1724; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; margin-top: 24px;">
        <div style="font-family: 'JetBrains Mono'; font-size: 0.72rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;">
            TESTING HELPERS
        </div>
    """, unsafe_allow_html=True)
    
    st.download_button(
        "⬇ Download Template CSV",
        data=SAMPLE_BATCH_CSV,
        file_name="edgefinder_sample_batch.csv",
        mime="text/csv",
        use_container_width=True
    )
    
    load_demo_batch = st.button("⚡ Load 15 Curated Test Headlines", use_container_width=True)
    st.markdown("</div>", unsafe_allow_html=True)

# Determine DataFrame to Process
df_to_process = None

if uploaded_file is not None:
    try:
        # Try UTF-8 first, fallback to latin-1
        try:
            df_to_process = pd.read_csv(uploaded_file)
        except UnicodeDecodeError:
            uploaded_file.seek(0)
            df_to_process = pd.read_csv(uploaded_file, encoding="latin-1")
    except Exception as e:
        st.error(f"Failed to read CSV file: {str(e)}")
elif load_demo_batch:
    df_to_process = pd.read_csv(io.StringIO(SAMPLE_BATCH_CSV))
    st.session_state["loaded_batch_source"] = "Demo Indian Market Batch"

if df_to_process is not None:
    # Validate column presence
    valid_cols = ["headline", "text", "sentence", "news", "title", "content"]
    text_col = None
    for col in valid_cols:
        matches = [c for c in df_to_process.columns if c.strip().lower() == col]
        if matches:
            text_col = matches[0]
            break

    if text_col is None:
        st.error(f"Could not identify a text column. The CSV must contain one of: {valid_cols}. Found columns: {list(df_to_process.columns)}")
    elif df_to_process.empty:
        st.error("Uploaded CSV is empty. Please provide a file with valid rows.")
    else:
        # Data Sanitization
        raw_count = len(df_to_process)
        # Drop rows where text_col is NaN or empty
        clean_df = df_to_process.dropna(subset=[text_col]).copy()
        clean_df = clean_df[clean_df[text_col].astype(str).str.strip() != ""]
        clean_count = len(clean_df)
        
        dropped = raw_count - clean_count
        if dropped > 0:
            st.warning(f"Sanitized dataset: Dropped {dropped} empty rows. {clean_count} valid rows remaining.")

        st.markdown(f"""
        <div style="font-family: 'JetBrains Mono'; font-size: 0.8rem; color: #94a3b8; margin: 10px 0;">
            Detected Text Column: <strong style="color: #38bdf8;">'{text_col}'</strong> | Articles to Process: <strong style="color: #ffffff;">{clean_count}</strong>
        </div>
        """, unsafe_allow_html=True)

        # Trigger Button
        if st.button(f"Execute FinBERT Batch Inference on {clean_count} Articles", type="primary"):
            finbert_service = get_finbert_service()
            
            progress_bar = st.progress(0, text="Initializing tensor batch loader...")
            status_placeholder = st.empty()
            
            texts = clean_df[text_col].astype(str).tolist()
            
            def on_progress(done, total):
                pct = int((done / total) * 100)
                progress_bar.progress(pct, text=f"Processing headlines with FinBERT: {done}/{total} ({pct}%)")

            start_t = time.perf_counter()
            # Batch size = 16 for optimal CPU throughput
            results = finbert_service.predict_batch(texts, batch_size=16, progress_callback=on_progress)
            elapsed = time.perf_counter() - start_t
            
            progress_bar.progress(100, text=f"Inference completed in {elapsed:.2f}s ({len(texts)/elapsed:.1f} articles/sec)")
            
            # Store in session state
            results_df = pd.DataFrame(results)
            
            # Merge with original clean_df
            clean_df = clean_df.reset_index(drop=True)
            for k in ["sentiment", "confidence", "sentiment_score", "positive_prob", "negative_prob", "neutral_prob"]:
                clean_df[k] = results_df[k]
                
            st.session_state["batch_results_df"] = clean_df
            st.session_state["batch_elapsed"] = elapsed

# Display Batch Results
if "batch_results_df" in st.session_state:
    bdf: pd.DataFrame = st.session_state["batch_results_df"]
    elapsed_t = st.session_state.get("batch_elapsed", 0.0)
    
    st.markdown("<div style='height: 18px;'></div>", unsafe_allow_html=True)
    st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;'>BATCH ANALYSIS RESULTS SUMMARY</div>", unsafe_allow_html=True)
    
    total_b = len(bdf)
    pos_b = (bdf["sentiment"] == "positive").sum()
    neg_b = (bdf["sentiment"] == "negative").sum()
    neu_b = (bdf["sentiment"] == "neutral").sum()
    mean_score = round(bdf["sentiment_score"].mean(), 4)
    speed = round(total_b / elapsed_t, 1) if elapsed_t > 0 else 0.0

    # Summary Metrics
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        st.markdown(render_metric_card_html("ARTICLES PROCESSED", f"{total_b}", f"Speed: {speed} art/s", "cyan"), unsafe_allow_html=True)
    with c2:
        st.markdown(render_metric_card_html("BULLISH COUNT", f"{pos_b}", f"{(pos_b/total_b*100):.1f}%", "green"), unsafe_allow_html=True)
    with c3:
        st.markdown(render_metric_card_html("BEARISH COUNT", f"{neg_b}", f"{(neg_b/total_b*100):.1f}%", "red"), unsafe_allow_html=True)
    with c4:
        st.markdown(render_metric_card_html("NEUTRAL COUNT", f"{neu_b}", f"{(neu_b/total_b*100):.1f}%", "neutral"), unsafe_allow_html=True)
    with c5:
        accent = "green" if mean_score > 0.05 else "red" if mean_score < -0.05 else "neutral"
        sign = "+" if mean_score > 0 else ""
        st.markdown(render_metric_card_html("BATCH MEAN SCORE", f"{sign}{mean_score:.3f}", "Range: [-1.0, +1.0]", accent), unsafe_allow_html=True)

    st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)

    # Charts Row
    ch1, ch2, ch3 = st.columns([1, 1, 1.2])
    with ch1:
        st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.8rem; color: #38bdf8; font-weight: 700; margin-bottom: 4px;'>SENTIMENT SHARE</div>", unsafe_allow_html=True)
        donut = create_sentiment_donut({"positive": pos_b, "negative": neg_b, "neutral": neu_b})
        st.plotly_chart(donut, use_container_width=True, config={"displayModeBar": False})
    with ch2:
        st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.8rem; color: #38bdf8; font-weight: 700; margin-bottom: 4px;'>NET SCORE GAUGE</div>", unsafe_allow_html=True)
        gauge = create_sentiment_gauge(mean_score, title="BATCH SENTIMENT")
        st.plotly_chart(gauge, use_container_width=True, config={"displayModeBar": False})
    with ch3:
        st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.8rem; color: #38bdf8; font-weight: 700; margin-bottom: 4px;'>SCORE DISTRIBUTION HISTOGRAM</div>", unsafe_allow_html=True)
        hist = create_sentiment_histogram(bdf["sentiment_score"].tolist())
        st.plotly_chart(hist, use_container_width=True, config={"displayModeBar": False})

    # Filterable Data Table
    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)
    st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;'>FILTERABLE DATASET</div>", unsafe_allow_html=True)
    
    tcol1, tcol2 = st.columns([1.5, 3])
    with tcol1:
        filter_sent = st.multiselect("Filter by Sentiment", ["positive", "negative", "neutral"], default=["positive", "negative", "neutral"])
    with tcol2:
        search_query = st.text_input("Search Headlines Content", placeholder="Type keyword to filter results (e.g. profit, order, dividend, RBI)...")

    view_df = bdf.copy()
    if filter_sent:
        view_df = view_df[view_df["sentiment"].isin(filter_sent)]
    if search_query.strip():
        # Search across all string columns
        mask = view_df.astype(str).apply(lambda row: row.str.contains(search_query.strip(), case=False).any(), axis=1)
        view_df = view_df[mask]

    st.dataframe(view_df, use_container_width=True, hide_index=True, height=280)

    # Export Button
    csv_buffer = io.StringIO()
    bdf.to_csv(csv_buffer, index=False)
    csv_bytes = csv_buffer.getvalue().encode("utf-8")
    
    st.download_button(
        label="⬇ Download Enriched Results as CSV",
        data=csv_bytes,
        file_name=f"edgefinder_sentiment_analysis_{int(time.time())}.csv",
        mime="text/csv",
        type="primary"
    )
