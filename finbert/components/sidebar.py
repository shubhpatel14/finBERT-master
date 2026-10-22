"""
Sidebar Component for EdgeFinder Terminal Navigation and Telemetry.
"""

import streamlit as st
import datetime
import torch

def render_sidebar():
    """Renders the institutional dark sidebar."""
    with st.sidebar:
        # Terminal Branding
        st.markdown("""
        <div style="padding: 10px 0 16px 0; border-bottom: 1px solid #1e293b; margin-bottom: 18px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #38bdf8; font-size: 1.4rem;">◈</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 1.15rem; color: #ffffff; letter-spacing: 0.05em;">
                    EDGEFINDER
                </span>
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #64748b; margin-top: 4px; letter-spacing: 0.06em;">
                INDIAN MARKET FINANCIAL NLP TERMINAL
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Hardware & Model Engine Status
        cuda_status = "CUDA GPU" if torch.cuda.is_available() else "Intel/AMD CPU"
        st.markdown(f"""
        <div class="telemetry-box" style="margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="color: #38bdf8; font-weight: 700; font-size: 0.72rem;">ENGINE TELEMETRY</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="pulse-dot"></span>
                    <span style="color: #05d554; font-size: 0.68rem; font-weight: 700;">ACTIVE</span>
                </div>
            </div>
            <div class="telemetry-row">
                <span>Model Architecture</span>
                <span style="color: #ffffff;">ProsusAI/FinBERT</span>
            </div>
            <div class="telemetry-row">
                <span>Compute Device</span>
                <span style="color: #ffffff;">{cuda_status}</span>
            </div>
            <div class="telemetry-row">
                <span>Precision</span>
                <span style="color: #ffffff;">FP32 PyTorch</span>
            </div>
            <div class="telemetry-row">
                <span>Weights Cache</span>
                <span style="color: #05d554;">Loaded (Local)</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Indicative Market Benchmark (Clear Demo Notice)
        st.markdown("""
        <div style="background: #0f1724; border: 1px solid #1e293b; border-radius: 6px; padding: 10px 12px; margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #fbbf24; font-weight: 700;">
                    MARKET BENCHMARKS (DEMO)
                </span>
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: #64748b;">SIMULATED</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; padding: 3px 0;">
                <span style="color: #94a3b8;">NIFTY 50</span>
                <span style="color: #05d554; font-weight: 700;">24,850.30 <small>(+0.42%)</small></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; padding: 3px 0;">
                <span style="color: #94a3b8;">SENSEX</span>
                <span style="color: #05d554; font-weight: 700;">81,420.75 <small>(+0.38%)</small></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; padding: 3px 0;">
                <span style="color: #94a3b8;">BANK NIFTY</span>
                <span style="color: #05d554; font-weight: 700;">52,140.90 <small>(+0.61%)</small></span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("""
        <div style="border-top: 1px solid #1e293b; padding-top: 14px; font-size: 0.7rem; color: #475569; font-family: 'Inter', sans-serif; line-height: 1.4;">
            <strong style="color: #64748b;">DISCLAIMER:</strong>
            EdgeFinder is an institutional financial sentiment analytics workstation.
            Model predictions reflect financial linguistic sentiment in corporate disclosures
            and do not constitute buy/sell trading advice or price forecasts.
        </div>
        """, unsafe_allow_html=True)
