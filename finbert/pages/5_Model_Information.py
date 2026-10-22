"""
Page 5: Model Information & Financial NLP Guide
Deep-dive into FinBERT architecture, transfer learning on financial corpora,
mathematical formulation of sentiment scores, and institutional risk warnings.
"""

import os
import streamlit as st

# Configure Page
st.set_page_config(
    page_title="Model Information | EdgeFinder",
    page_icon="⚡",
    layout="wide"
)

# Apply CSS
css_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "styles.css")
if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

from components.sidebar import render_sidebar

render_sidebar()

st.markdown("""
<div class="terminal-header">
    <div class="terminal-brand">
        <span style="color: #38bdf8; font-size: 1.4rem;">📘</span>
        <div>
            <div class="terminal-title">FINBERT MODEL SPECIFICATIONS & NLP ARCHITECTURE</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                THEORETICAL FOUNDATIONS, FORMULATION & INSTITUTIONAL CONSIDERATIONS
            </div>
        </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
        <span class="terminal-badge">TECHNICAL REFERENCE</span>
    </div>
</div>
""", unsafe_allow_html=True)

# Overview Section
col_left, col_right = st.columns([1.6, 1.4])

with col_left:
    st.markdown("""
    ### 1. What is FinBERT?
    **FinBERT** is a domain-specific natural language processing model based on the **BERT** (Bidirectional Encoder Representations from Transformers) architecture, fine-tuned specifically for financial sentiment classification by **Prosus AI** (Dogu Araci, 2019).
    
    While standard BERT was trained on general web corpora (Wikipedia and BookCorpus), FinBERT undergoes specialized pre-training and domain-adaptation on extensive financial texts:
    
    - **Corporate Communication:** 10-K, 10-Q SEC annual and quarterly filings.
    - **Financial News:** Reuters, Bloomberg, and Dow Jones news wires.
    - **Annotated Benchmarks:** Fine-tuned on the gold-standard **Financial PhraseBank** (Malo et al., 2014) and **TRC2-financial** datasets.
    
    ```text
    [Raw Text: Financial News / Earnings Transcript]
                      │
                      ▼
    [WordPiece Tokenizer: max_length=512]
                      │
                      ▼
    [12-Layer Transformer Encoder: 768 Hidden Dim, 12 Attention Heads]
                      │
                      ▼
    [Classification Head: Dense Layer + Dropout]
                      │
                      ▼
    [Softmax Activation: P(Positive), P(Negative), P(Neutral)]
    ```
    """)

with col_right:
    st.markdown("""
    ### 2. Why General NLP Fails on Financial Text
    Generic sentiment tools (such as VADER, TextBlob, or vanilla BERT) frequently misclassify financial statements because financial language contains inverted polarity and domain-specific terminology:
    """)
    
    st.markdown("""
    <div style="background: #0f1724; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; font-size: 0.78rem;">
        <table style="width: 100%; border-collapse: collapse; color: #f1f5f9; font-family: 'JetBrains Mono', monospace;">
            <thead>
                <tr style="border-bottom: 1px solid #334155; color: #38bdf8;">
                    <th style="text-align: left; padding: 6px;">Financial Sentence</th>
                    <th style="text-align: center; padding: 6px;">Generic NLP</th>
                    <th style="text-align: center; padding: 6px;">FinBERT</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 6px;">"Company liabilities declined 25%"</td>
                    <td style="text-align: center; color: #f43f5e;">Negative (word: declined)</td>
                    <td style="text-align: center; color: #05d554;">Positive (debt reduced)</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 6px;">"Shares fell after dividend ex-date"</td>
                    <td style="text-align: center; color: #f43f5e;">Negative (word: fell)</td>
                    <td style="text-align: center; color: #94a3b8;">Neutral (expected math)</td>
                </tr>
                <tr>
                    <td style="padding: 6px;">"Gross NPA dropped to 1.2%"</td>
                    <td style="text-align: center; color: #f43f5e;">Negative (word: dropped)</td>
                    <td style="text-align: center; color: #05d554;">Positive (cleaner balance)</td>
                </tr>
            </tbody>
        </table>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# Mathematical Formulation
st.markdown("""
### 3. Probabilities and the Sentiment-Score Formula

FinBERT outputs a logit vector $\mathbf{z} = [z_{\text{positive}}, z_{\text{negative}}, z_{\text{neutral}}]$. Applying the softmax function yields class probabilities:

$$P(\text{class}_i) = \\frac{e^{z_i}}{\\sum_{j=1}^{3} e^{z_j}}, \\quad \\text{where } \\sum_{i=1}^{3} P(\text{class}_i) = 1.0$$

#### Net Sentiment Score Formulation:
While the discrete sentiment label is simply $\\arg\\max_i P(\\text{class}_i)$, institutional quantitative research requires a continuous scalar metric to represent directional intensity:

$$\\text{Sentiment Score} = P(\\text{Positive}) - P(\\text{Negative})$$

- **Range:** Exactly $[-1.0, +1.0]$.
- **$+1.0$:** Complete bullish unanimity ($P(\\text{pos})=1.0, P(\\text{neg})=0.0$).
- **$0.0$:** Perfectly neutral or evenly balanced tension ($P(\\text{pos})=P(\\text{neg})$ or $P(\\text{neutral})=1.0$).
- **$-1.0$:** Complete bearish unanimity ($P(\\text{neg})=1.0, P(\\text{pos})=0.0$).
""")

st.markdown("---")

# Limitations and Market Distinction
w1, w2 = st.columns(2)

with w1:
    st.markdown("""
    ### 4. Technical Limitations of Financial NLP
    
    1. **Context Window Constraint:** Standard BERT has a sequence length limitation of **512 tokens**. Long disclosures must be chunked or summarized.
    2. **Corporate Euphemisms & Spin:** Companies frequently disguise deteriorating conditions with convoluted corporate jargon (e.g., *"optimizing organizational synergies"* instead of layoffs).
    3. **Conditionality & Forward Statements:** Sentences containing *"if"*, *"contingent upon"*, or *"subject to regulatory clearance"* introduce execution risk not fully captured by raw sentiment.
    4. **Sarcasm & Market Irony:** While rare in regulatory filings, commentary on social media and chat forums requires nuanced intent recognition.
    """)

with w2:
    st.markdown("""
    ### 5. News Sentiment vs. Stock Price Movement
    
    > **Crucial Market Principle:** News sentiment is **NOT** a direct guarantee of stock price trajectory.
    
    - **Priced-in Expectations:** If the market anticipated a 20% earnings surge and the company posts a 12% rise, the news text is objectively **positive**, but the stock may plunge because it missed elevated consensus estimates.
    - **Macro Liquidity & Rates:** Broad market sentiment, RBI repo rate changes, and US Federal Reserve policy can overshadow individual company announcements.
    - **Valuation Multiples:** A fundamentally excellent company trading at 80x P/E may decline even on stellar news due to multiple compression.
    - **Trading Execution & Liquidity:** Microstructure dynamics, institutional block trades, and options gamma positioning determine real-time price discovery.
    """)

st.markdown("""
<div style="background: rgba(244, 63, 94, 0.08); border-left: 3px solid #f43f5e; border-radius: 4px; padding: 12px 16px; margin-top: 14px; font-size: 0.78rem; color: #f1f5f9; line-height: 1.5;">
    <strong style="color: #f43f5e;">INSTITUTIONAL RISK WARNING:</strong>
    EdgeFinder and FinBERT provide algorithmic text analysis for decision support and quantitative research.
    Output metrics should be incorporated into broader quantitative models alongside fundamental metrics, valuation multiples, earnings consensus revisions, and technical risk management.
</div>
""", unsafe_allow_html=True)
