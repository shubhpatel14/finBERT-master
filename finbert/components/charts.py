"""
Plotly Chart Generators with Institutional Dark Financial Terminal Styling.
"""

from typing import Dict, Any, Optional
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px

# Terminal Color Palette
COLOR_POSITIVE = "#05d554"
COLOR_NEGATIVE = "#f43f5e"
COLOR_NEUTRAL = "#94a3b8"
BG_DARK = "#0d131d"
BG_PLOT = "#111827"
BORDER_DARK = "#1e293b"
TEXT_COLOR = "#f8fafc"
TEXT_MUTED = "#64748b"

def apply_terminal_layout(fig: go.Figure, height: int = 320) -> go.Figure:
    """Applies terminal layout aesthetics to a Plotly figure."""
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(17, 24, 39, 0.6)",
        font=dict(family="JetBrains Mono, monospace, sans-serif", color=TEXT_COLOR, size=11),
        margin=dict(l=20, r=20, t=35, b=20),
        height=height,
        hoverlabel=dict(
            bgcolor="#1e293b",
            font_size=12,
            font_family="JetBrains Mono, monospace",
            font_color="#ffffff",
            bordercolor="#38bdf8"
        ),
        xaxis=dict(
            gridcolor="#1e293b",
            zerolinecolor="#334155",
            showline=True,
            linecolor="#1e293b"
        ),
        yaxis=dict(
            gridcolor="#1e293b",
            zerolinecolor="#334155",
            showline=True,
            linecolor="#1e293b"
        )
    )
    return fig

def create_sentiment_gauge(score: float, title: str = "NET SENTIMENT INDEX") -> go.Figure:
    """
    Creates a high-precision financial dial gauge ranging from -1.0 to +1.0.
    """
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=score,
        domain={'x': [0, 1], 'y': [0, 1]},
        number={
            'valueformat': '+.3f' if score > 0 else '.3f',
            'font': {'size': 32, 'family': 'JetBrains Mono', 'color': '#ffffff'}
        },
        title={'text': title, 'font': {'size': 12, 'family': 'JetBrains Mono', 'color': '#94a3b8'}},
        gauge={
            'axis': {
                'range': [-1, 1],
                'tickwidth': 1,
                'tickcolor': "#334155",
                'tickvals': [-1, -0.5, 0, 0.5, 1],
                'ticktext': ['-1.0 Bearish', '-0.5', '0.0 Neutral', '+0.5', '+1.0 Bullish'],
                'tickfont': {'size': 9, 'color': '#64748b'}
            },
            'bar': {'color': "#38bdf8", 'thickness': 0.28},
            'bgcolor': "#111827",
            'borderwidth': 1,
            'bordercolor': "#1e293b",
            'steps': [
                {'range': [-1.0, -0.2], 'color': 'rgba(244, 63, 94, 0.18)'},
                {'range': [-0.2, 0.2], 'color': 'rgba(148, 163, 184, 0.12)'},
                {'range': [0.2, 1.0], 'color': 'rgba(5, 213, 84, 0.18)'}
            ],
            'threshold': {
                'line': {'color': "#ffffff", 'width': 3},
                'thickness': 0.75,
                'value': score
            }
        }
    ))
    return apply_terminal_layout(fig, height=240)

def create_sentiment_donut(counts: Dict[str, int]) -> go.Figure:
    """
    Creates a sleek donut breakdown chart for sentiment distribution.
    """
    labels = ["Positive", "Negative", "Neutral"]
    values = [counts.get("positive", 0), counts.get("negative", 0), counts.get("neutral", 0)]
    colors = [COLOR_POSITIVE, COLOR_NEGATIVE, COLOR_NEUTRAL]

    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=0.62,
        marker=dict(colors=colors, line=dict(color="#0f1521", width=2)),
        textinfo="percent+value",
        textfont=dict(family="JetBrains Mono", size=11, color="#ffffff"),
        hovertemplate="<b>%{label}</b><br>Count: %{value}<br>Ratio: %{percent}<extra></extra>"
    )])

    fig.update_layout(
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5,
            font=dict(size=10, color=TEXT_MUTED)
        ),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=10, r=10, t=20, b=30),
        height=280
    )
    return fig

def create_trend_line_chart(df: pd.DataFrame) -> go.Figure:
    """
    Creates a time-series line chart of sentiment score fluctuations.
    Expects df with columns ['date', 'sentiment_score', 'company', 'sentiment'].
    """
    if df.empty or "date" not in df.columns or "sentiment_score" not in df.columns:
        fig = go.Figure()
        return apply_terminal_layout(fig, height=280)

    # Sort by date
    plot_df = df.sort_values(by="date").copy()
    
    # Calculate rolling 3-day average if enough data points
    fig = go.Figure()

    # Zero reference line
    fig.add_hline(y=0, line_dash="dash", line_color="#334155", annotation_text="Neutral (0.0)", annotation_position="bottom right", annotation_font_size=9, annotation_font_color="#64748b")

    # Scatter points colored by sentiment
    color_map = {"positive": COLOR_POSITIVE, "negative": COLOR_NEGATIVE, "neutral": COLOR_NEUTRAL}
    for s_name, color in color_map.items():
        sub = plot_df[plot_df["sentiment"] == s_name]
        if not sub.empty:
            fig.add_trace(go.Scatter(
                x=sub["date"],
                y=sub["sentiment_score"],
                mode="markers",
                name=s_name.capitalize(),
                marker=dict(size=8, color=color, symbol="circle", line=dict(color="#ffffff", width=0.5)),
                text=sub.get("headline", ""),
                customdata=sub.get("company", ""),
                hovertemplate="<b>%{customdata}</b><br>Date: %{x}<br>Score: %{y:+.3f}<br>%{text}<extra></extra>"
            ))

    # Average score line
    daily_avg = plot_df.groupby("date")["sentiment_score"].mean().reset_index()
    fig.add_trace(go.Scatter(
        x=daily_avg["date"],
        y=daily_avg["sentiment_score"],
        mode="lines",
        name="Daily Mean Score",
        line=dict(color="#38bdf8", width=2),
        hoverinfo="skip"
    ))

    fig.update_layout(
        yaxis_title="Sentiment Score (-1 to +1)",
        xaxis_title="Date",
        yaxis_range=[-1.05, 1.05],
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(size=10, color=TEXT_MUTED)
        )
    )
    return apply_terminal_layout(fig, height=300)

def create_company_comparison_bar(company_df: pd.DataFrame) -> go.Figure:
    """
    Creates a horizontal bar chart comparing net sentiment across companies.
    Expects columns: ['company', 'avg_score', 'article_count']
    """
    if company_df.empty:
        fig = go.Figure()
        return apply_terminal_layout(fig, height=320)

    # Sort descending
    sorted_df = company_df.sort_values(by="avg_score", ascending=True)

    colors = [
        COLOR_POSITIVE if s > 0.05
        else COLOR_NEGATIVE if s < -0.05
        else COLOR_NEUTRAL
        for s in sorted_df["avg_score"]
    ]

    fig = go.Figure(go.Bar(
        x=sorted_df["avg_score"],
        y=sorted_df["company"],
        orientation="h",
        marker=dict(color=colors, line=dict(color="#1e293b", width=1)),
        text=[f"{s:+.3f}" for s in sorted_df["avg_score"]],
        textposition="outside",
        textfont=dict(family="JetBrains Mono", size=10, color="#ffffff"),
        customdata=sorted_df.get("article_count", [1]*len(sorted_df)),
        hovertemplate="<b>%{y}</b><br>Avg Score: %{x:+.3f}<br>Articles: %{customdata}<extra></extra>"
    ))

    fig.add_vline(x=0, line_dash="solid", line_color="#334155")
    fig.update_layout(
        xaxis_title="Average Sentiment Score (-1 to +1)",
        xaxis_range=[-1.1, 1.1],
        margin=dict(l=140, r=40, t=20, b=40)
    )
    return apply_terminal_layout(fig, height=340)

def create_sentiment_histogram(scores: list) -> go.Figure:
    """Creates a histogram distribution of net sentiment scores."""
    if not scores:
        fig = go.Figure()
        return apply_terminal_layout(fig, height=260)

    fig = go.Figure(data=[go.Histogram(
        x=scores,
        xbins=dict(start=-1.0, end=1.0, size=0.1),
        marker=dict(color="#38bdf8", line=dict(color="#090d16", width=1)),
        hovertemplate="Score Range: %{x}<br>Count: %{y}<extra></extra>"
    )])

    fig.add_vline(x=0, line_dash="dash", line_color="#f43f5e", annotation_text="Neutral Line", annotation_font_size=9)
    fig.update_layout(
        xaxis_title="Net Sentiment Score (-1.0 to +1.0)",
        yaxis_title="Frequency",
        xaxis_range=[-1.05, 1.05]
    )
    return apply_terminal_layout(fig, height=260)
