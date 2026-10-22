"""
Terminal UI Metric Cards, Sentiment Badges, and Telemetry Visualizers.
"""

from typing import Dict, Any, Optional

def get_sentiment_badge_html(sentiment: str) -> str:
    """Returns HTML for color-coded sentiment pill."""
    sent = str(sentiment).lower()
    if sent == "positive":
        return '<span class="badge-positive">● POSITIVE</span>'
    elif sent == "negative":
        return '<span class="badge-negative">● NEGATIVE</span>'
    else:
        return '<span class="badge-neutral">● NEUTRAL</span>'

def render_metric_card_html(
    label: str,
    value: Any,
    subtext: str = "",
    accent: str = "cyan"
) -> str:
    """
    Renders a high-density Bloomberg-style terminal metric card.
    Accents: cyan, green, red, neutral, amber.
    """
    return f"""
    <div class="terminal-card card-accent-{accent}">
        <div class="card-label">{label}</div>
        <div class="card-value">{value}</div>
        {f'<div class="card-subtext">{subtext}</div>' if subtext else ''}
    </div>
    """

def render_probability_bars_html(scores: Dict[str, float]) -> str:
    """
    Renders horizontal probability meter bars with institutional styling.
    """
    pos = scores.get("positive", 0.0)
    neg = scores.get("negative", 0.0)
    neu = scores.get("neutral", 0.0)
    
    pos_pct = round(pos * 100, 1)
    neg_pct = round(neg * 100, 1)
    neu_pct = round(neu * 100, 1)

    return f"""
    <div class="prob-container">
        <div class="prob-header">
            <span style="color: var(--terminal-green);">POSITIVE (BULLISH)</span>
            <span style="color: var(--terminal-green); font-weight: 700;">{pos_pct}% ({pos:.4f})</span>
        </div>
        <div class="prob-bar-bg">
            <div class="prob-bar-fill-positive" style="width: {pos_pct}%;"></div>
        </div>
    </div>
    
    <div class="prob-container">
        <div class="prob-header">
            <span style="color: var(--terminal-red);">NEGATIVE (BEARISH)</span>
            <span style="color: var(--terminal-red); font-weight: 700;">{neg_pct}% ({neg:.4f})</span>
        </div>
        <div class="prob-bar-bg">
            <div class="prob-bar-fill-negative" style="width: {neg_pct}%;"></div>
        </div>
    </div>
    
    <div class="prob-container">
        <div class="prob-header">
            <span style="color: var(--terminal-neutral);">NEUTRAL (BALANCED)</span>
            <span style="color: var(--terminal-neutral); font-weight: 700;">{neu_pct}% ({neu:.4f})</span>
        </div>
        <div class="prob-bar-bg">
            <div class="prob-bar-fill-neutral" style="width: {neu_pct}%;"></div>
        </div>
    </div>
    """

def render_telemetry_box_html(telemetry: Dict[str, Any]) -> str:
    """Renders execution telemetry table."""
    rows = "".join([
        f'<div class="telemetry-row"><span>{k}</span><span style="color: #ffffff; font-weight: 600;">{v}</span></div>'
        for k, v in telemetry.items()
    ])
    return f"""
    <div class="telemetry-box">
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 8px; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
            INFERENCE TELEMETRY
        </div>
        {rows}
    </div>
    """

def render_headline_card_html(
    headline: str,
    company: str,
    date: str,
    sentiment: str,
    confidence: float,
    sentiment_score: float
) -> str:
    """Renders a single analyzed headline item."""
    badge = get_sentiment_badge_html(sentiment)
    score_color = (
        "var(--terminal-green)" if sentiment_score > 0.05
        else "var(--terminal-red)" if sentiment_score < -0.05
        else "var(--terminal-neutral)"
    )
    sign = "+" if sentiment_score > 0 else ""
    
    return f"""
    <div class="headline-item">
        <div class="headline-text">{headline}</div>
        <div class="headline-meta">
            <span style="color: #38bdf8; font-weight: 600;">{company}</span>
            <span>•</span>
            <span>{date}</span>
            <span>•</span>
            {badge}
            <span>•</span>
            <span>CONF: <strong>{confidence * 100:.1f}%</strong></span>
            <span>•</span>
            <span>NET SCORE: <strong style="color: {score_color};">{sign}{sentiment_score:.3f}</strong></span>
        </div>
    </div>
    """
