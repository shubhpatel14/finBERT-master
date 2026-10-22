"""
Page 2: FinBERT Interactive Sentiment Analyzer
Deep-dive single-text financial NLP analysis with real-time probability meters,
confidence diagnostics, and model inference telemetry.
"""

import os
import streamlit as st

# Configure Page
st.set_page_config(
    page_title="Sentiment Analyzer | EdgeFinder",
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
    render_probability_bars_html,
    render_telemetry_box_html,
    get_sentiment_badge_html
)
from components.charts import create_sentiment_gauge
from services.finbert_service import get_finbert_service

render_sidebar()

st.markdown("""
<div class="terminal-header">
    <div class="terminal-brand">
        <span style="color: #05d554; font-size: 1.4rem;">🔬</span>
        <div>
            <div class="terminal-title">FINBERT SENTIMENT ANALYZER</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                HIGH-RESOLUTION FINANCIAL NLP INFERENCE & CLASS PROBABILITY RESOLVER
            </div>
        </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
        <span class="terminal-badge">LIVE NEURAL INFERENCE</span>
    </div>
</div>
""", unsafe_allow_html=True)

# Quick Presets for User Testing
st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.78rem; color: #94a3b8; margin-bottom: 6px;'>TEST SCENARIOS (CLICK PRESET TO LOAD REAL INDIAN MARKET DISCLOSURE):</div>", unsafe_allow_html=True)

PRESETS = {
    "Reliance Earnings Beat": "Reliance Industries reports strong quarterly profits, supported by growth in its retail business and expansion of Jio 5G services.",
    "Infosys Guidance Cut": "Infosys trims upper end of annual revenue growth guidance citing client project deferrals in retail and manufacturing verticals.",
    "HDFC Bank Asset Quality": "HDFC Bank reports robust quarterly loan book expansion with gross non-performing assets dropping to a multi-year low of 1.24%.",
    "L&T Mega Order Win": "Larsen & Toubro secures major ultra-mega hydrocarbon EPC order worth over ₹15,000 crore in the Middle East.",
    "RBI Regulatory Fine": "Reserve Bank of India imposes monetary penalty on commercial lender for non-compliance with statutory directions on loan classification."
}

cols = st.columns(len(PRESETS))
for idx, (label, text_val) in enumerate(PRESETS.items()):
    with cols[idx]:
        if st.button(label, key=f"preset_{idx}", use_container_width=True):
            st.session_state["analyzer_input_text"] = text_val

# Default text if nothing set
default_text = st.session_state.get(
    "analyzer_input_text",
    "Reliance Industries reports strong quarterly profits, supported by growth in its retail business."
)

# Text Input Area
input_text = st.text_area(
    "Enter Financial News Headline, Paragraph, or Filing Disclosure:",
    value=default_text,
    height=120,
    placeholder="Type or paste Indian financial news, quarterly commentary, or regulatory filings here..."
)

col_btn, col_info = st.columns([1, 4])
with col_btn:
    analyze_clicked = st.button("Analyze Sentiment", type="primary", use_container_width=True)

# Run Inference
if analyze_clicked or "last_analyzer_result" in st.session_state:
    text_to_eval = input_text if analyze_clicked else st.session_state.get("last_analyzer_text", input_text)
    
    if not text_to_eval.strip():
        st.error("Please enter financial text before analyzing.")
    else:
        finbert_service = get_finbert_service()
        
        if analyze_clicked:
            with st.spinner("Executing FinBERT sequence classification..."):
                result = finbert_service.predict_single(text_to_eval)
                st.session_state["last_analyzer_result"] = result
                st.session_state["last_analyzer_text"] = text_to_eval
        else:
            result = st.session_state["last_analyzer_result"]

        st.markdown("<div style='height: 18px;'></div>", unsafe_allow_html=True)
        
        sentiment = result["sentiment"]
        confidence = result["confidence"]
        sentiment_score = result["sentiment_score"]
        scores = result["scores"]
        
        # Primary Metric Row
        mcol1, mcol2, mcol3, mcol4 = st.columns(4)
        
        accent = "green" if sentiment == "positive" else "red" if sentiment == "negative" else "neutral"
        with mcol1:
            st.markdown(render_metric_card_html("CLASSIFIED SENTIMENT", sentiment.upper(), f"Dominant Class", accent), unsafe_allow_html=True)
        with mcol2:
            st.markdown(render_metric_card_html("CONFIDENCE SCORE", f"{confidence*100:.2f}%", "Argmax Softmax Prob", "cyan"), unsafe_allow_html=True)
        with mcol3:
            sign = "+" if sentiment_score > 0 else ""
            st.markdown(render_metric_card_html("NET SENTIMENT SCORE", f"{sign}{sentiment_score:.4f}", "Positive - Negative", accent), unsafe_allow_html=True)
        with mcol4:
            st.markdown(render_metric_card_html("INFERENCE LATENCY", f"{result['latency_ms']} ms", f"Tokens: {result['tokens']} ({result['device']})", "amber"), unsafe_allow_html=True)

        st.markdown("<div style='height: 14px;'></div>", unsafe_allow_html=True)
        
        # Two-Column Detailed Breakdown
        detail_left, detail_right = st.columns([1.1, 1.4])
        
        with detail_left:
            st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.82rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;'>NET SENTIMENT GAUGE</div>", unsafe_allow_html=True)
            gauge = create_sentiment_gauge(sentiment_score, title="NET DIRECTION (-1 TO +1)")
            st.plotly_chart(gauge, use_container_width=True, config={"displayModeBar": False})
            
            # Telemetry Table
            telemetry_data = {
                "Model Identifier": "ProsusAI/finbert",
                "Tokenizer Base": "BERT-base-uncased",
                "Input Tokens": result["tokens"],
                "Inference Latency": f"{result['latency_ms']} ms",
                "Execution Device": result["device"],
                "Evaluation Mode": "PyTorch Eval (no_grad)",
                "Softmax Formula": "dim=1, FP32 Logits"
            }
            st.markdown(render_telemetry_box_html(telemetry_data), unsafe_allow_html=True)

        with detail_right:
            st.markdown("<div style='font-family: JetBrains Mono; font-size: 0.82rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;'>SOFTMAX PROBABILITY DISTRIBUTION</div>", unsafe_allow_html=True)
            
            # Probability Meter Bars
            st.markdown(render_probability_bars_html(scores), unsafe_allow_html=True)
            
            # Original Headline Display Box
            st.markdown(f"""
            <div style="background: #0f1724; border: 1px solid #1e293b; border-radius: 6px; padding: 14px; margin-top: 14px;">
                <div style="font-family: 'JetBrains Mono'; font-size: 0.72rem; color: #38bdf8; font-weight: 700; margin-bottom: 6px;">
                    ORIGINAL INPUT TEXT
                </div>
                <div style="font-size: 0.92rem; color: #f1f5f9; line-height: 1.5; font-style: italic;">
                    "{result['text']}"
                </div>
            </div>
            """, unsafe_allow_html=True)

            # Linguistic Explanation
            explanation = ""
            if sentiment == "positive":
                explanation = "FinBERT detected expansionary language, profit growth, or balance sheet strengthening indicative of positive commercial momentum."
            elif sentiment == "negative":
                explanation = "FinBERT identified contractionary metrics, margin pressure, regulatory penalties, or guidance downward revisions."
            else:
                explanation = "FinBERT categorized this disclosure as factual, balanced, or non-directional corporate information."
                
            st.markdown(f"""
            <div style="background: rgba(56, 189, 248, 0.05); border-left: 3px solid #38bdf8; border-radius: 4px; padding: 10px 14px; margin-top: 12px; font-size: 0.78rem; color: #94a3b8; line-height: 1.4;">
                <strong style="color: #38bdf8;">NLP Context Insight:</strong> {explanation}
            </div>
            """, unsafe_allow_html=True)
