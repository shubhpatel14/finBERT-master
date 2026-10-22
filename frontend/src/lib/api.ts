/**
 * EdgeFinder Frontend API Client & Type Definitions
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface IndexOverview {
  name: string;
  ticker: string;
  price: number;
  change: number;
  percent_change: number;
  day_high: number;
  day_low: number;
  timestamp: string;
}

export interface StockSummary {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  percent_change: number;
  volume: number;
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
  advance_decline_ratio: number;
  top_gainers: StockSummary[];
  top_losers: StockSummary[];
  all_stocks: StockSummary[];
}

export interface MarketSentimentPulse {
  market_sentiment_score: number;
  market_sentiment_label: string;
  status_commentary: string;
  net_finbert_sentiment: number;
  positive_news_pct: number;
  neutral_news_pct: number;
  negative_news_pct: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  total_news_evaluated: number;
  vix_level: number;
  vix_regime: string;
}

export interface InstitutionalFlows {
  fii_net_crores: number;
  dii_net_crores: number;
  total_net_crores: number;
  fii_action: string;
  dii_action: string;
  commentary: string;
}

export interface WholeMarketOverview {
  indices: IndexOverview[];
  sentiment_pulse: MarketSentimentPulse;
  market_breadth: {
    advances: number;
    declines: number;
    unchanged: number;
    advance_decline_ratio: number;
    highs_52w: number;
    lows_52w: number;
    breadth_momentum: string;
  };
  institutional_flows: InstitutionalFlows;
  top_gainers: StockSummary[];
  top_losers: StockSummary[];
  sector_heatmap: SectorItem[];
  macro_news_feed: NewsItem[];
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  ema_20?: number;
  bb_upper?: number;
  bb_lower?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
}

export interface StockFundamentals {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  current_price: number;
  market_cap: number;
  market_cap_cr: number;
  trailing_pe: number;
  forward_pe: number;
  price_to_book: number;
  ev_to_ebitda: number;
  dividend_yield: number;
  return_on_equity: number;
  return_on_assets: number;
  debt_to_equity: number;
  profit_margins: number;
  operating_margins: number;
  revenue_growth: number;
  beta: number;
  eps: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  fifty_two_week_range_pct: number;
  currency: string;
  exchange: string;
}

export interface FinancialStatements {
  income_statement: Array<{
    period: string;
    revenue: number;
    operating_income: number;
    net_income: number;
    ebitda: number;
    eps: number;
  }>;
  balance_sheet: Array<{
    period: string;
    total_assets: number;
    total_liabilities: number;
    stockholders_equity: number;
    cash: number;
    borrowings: number;
  }>;
  cash_flow: Array<{
    period: string;
    operating_cash_flow: number;
    investing_cash_flow: number;
    financing_cash_flow: number;
    free_cash_flow: number;
  }>;
}

export interface ShareholdingPattern {
  current: {
    promoters: number;
    fii: number;
    dii: number;
    public: number;
  };
  history: Array<{
    quarter: string;
    promoters: number;
    fii: number;
    dii: number;
    public: number;
  }>;
  insights: string;
}

export interface StockScore {
  symbol: string;
  company_name: string;
  overall_score: number;
  rating: string;
  color_grade: string;
  recommendation: string;
  results_score: number;
  news_score: number;
  shareholding_score: number;
  news_breakdown: {
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    total_count: number;
    positive_pct: number;
    negative_pct: number;
    neutral_pct: number;
    net_sentiment_score: number;
  };
  results_breakdown: {
    revenue_growth_pts: number;
    profit_margin_pts: number;
    roe_pts: number;
    solvency_pts: number;
  };
  verdict: string;
  key_strengths: string[];
  key_risks: string[];
}

export interface ForecastDriver {
  driver: string;
  impact: string;
  direction: string;
  explanation: string;
}

export interface ForecastHorizon {
  horizon: string;
  days: number;
  point_forecast: number;
  expected_return_pct: number;
  lower_95: number;
  upper_95: number;
}

export interface ForecastingResult {
  symbol: string;
  current_price: number;
  evaluation_metrics: {
    mae_model: number;
    mae_naive_baseline: number;
    rmse_model: number;
    rmse_naive_baseline: number;
    directional_accuracy_pct: number;
    mae_improvement_over_naive_pct: number;
    test_sample_size: number;
    train_sample_size: number;
  };
  horizons: ForecastHorizon[];
  backtest_trajectory: Array<{
    date: string;
    actual: number;
    model_forecast: number;
    naive_baseline: number;
  }>;
  forecast_drivers: ForecastDriver[];
  detailed_reason: string;
  assumptions: string[];
}

export interface NewsItem {
  company: string;
  symbol?: string;
  sector?: string;
  date: string;
  headline: string;
  source: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  sentiment_score: number;
  positive_prob: number;
  negative_prob: number;
  neutral_prob: number;
}

export interface SectorItem {
  sector: string;
  index_ticker: string;
  weight_in_nifty: string;
  avg_pe: number;
  avg_roe: number;
  one_month_return: string;
  one_year_return: string;
  sentiment_bias: string;
  finbert_score: number;
  macro_sensitivity: string;
  constituents: Array<{
    symbol: string;
    name: string;
    finbert_score: number;
    conviction: string;
  }>;
}

export interface MacroDashboard {
  key_rates: Array<{ rate: string; value: string; change: string; stance: string; source: string; desc: string }>;
  yield_curve: Array<{ tenor: string; yield: number; yield_str: string; spread_vs_10y: string }>;
  inflation_basket: Array<{ component: string; rate: string; target: string; status: string; source: string }>;
  growth_indicators: Array<{ indicator: string; value: string; context: string; source: string }>;
  fx_reserves: Array<{ currency: string; value: string; change: string; source: string }>;
  policy_timeline: Array<{ date: string; event: string; impact: string }>;
  macro_summary: string;
}

export interface ResearchReport {
  symbol: string;
  company_name: string;
  sector: string;
  current_price: number;
  executive_summary: string;
  business_model_and_moat: string;
  valuation_assessment: {
    verdict: string;
    trailing_pe: number;
    price_to_book: number;
    dividend_yield: number;
    ev_to_ebitda: number;
    commentary: string;
  };
  technical_trend_analysis: {
    verdict: string;
    rsi_14: number;
    sma_50: number;
    sma_200?: number;
    macd?: number;
    commentary: string;
  };
  news_catalysts: string[];
  downside_risks: string[];
  scenario_analysis: {
    bull_case: { target_price: number; upside_pct: string; probability: string; rationale: string };
    base_case: { target_price: number; upside_pct: string; probability: string; rationale: string };
    bear_case: { target_price: number; upside_pct: string; probability: string; rationale: string };
  };
}

export interface WatchlistItem {
  id: number;
  symbol: string;
  company_name: string;
  sector: string;
  exchange: string;
  current_price: number;
  percent_change: number;
  added_at: string;
}

export interface ProviderStatus {
  provider: string;
  connected: boolean;
  key_preview: string;
  features: string[];
}

export interface ApiProvidersStatus {
  news_api: ProviderStatus;
  alpha_vantage: ProviderStatus;
  fmp: ProviderStatus;
  zerodha_kite: ProviderStatus;
}

// API Fetchers
export const api = {
  getIndices: async (): Promise<IndexOverview[]> => {
    const res = await fetch(`${API_BASE}/market/indices`);
    if (!res.ok) throw new Error("Failed to fetch indices");
    return res.json();
  },

  getMarketBreadth: async (): Promise<MarketBreadth> => {
    const res = await fetch(`${API_BASE}/market/breadth`);
    if (!res.ok) throw new Error("Failed to fetch market breadth");
    return res.json();
  },

  getWholeMarketOverview: async (): Promise<WholeMarketOverview> => {
    const res = await fetch(`${API_BASE}/market/overview`);
    if (!res.ok) throw new Error("Failed to fetch whole market overview");
    return res.json();
  },

  getTrackedSymbols: async (): Promise<Array<{ symbol: string; name: string; sector: string; tier: string }>> => {
    const res = await fetch(`${API_BASE}/market/tracked-symbols`);
    if (!res.ok) throw new Error("Failed to fetch tracked symbols");
    return res.json();
  },

  getStockCandles: async (symbol: string, period = "1y", interval = "1d"): Promise<{ symbol: string; candles: Candle[]; latest_technicals: any }> => {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/candles?period=${period}&interval=${interval}`);
    if (!res.ok) throw new Error(`Failed to fetch candles for ${symbol}`);
    return res.json();
  },

  getStockFundamentals: async (symbol: string): Promise<{
    fundamentals: StockFundamentals;
    financial_statements: FinancialStatements;
    shareholding_pattern: ShareholdingPattern;
    stock_score?: StockScore;
  }> => {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/fundamentals`);
    if (!res.ok) throw new Error(`Failed to fetch fundamentals for ${symbol}`);
    return res.json();
  },

  getStockScore: async (symbol: string): Promise<StockScore> => {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/score`);
    if (!res.ok) throw new Error(`Failed to fetch stock score for ${symbol}`);
    return res.json();
  },

  getForecasting: async (symbol: string): Promise<ForecastingResult> => {
    const res = await fetch(`${API_BASE}/forecasting/${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`Failed to fetch forecasting for ${symbol}`);
    return res.json();
  },

  getNewsFeed: async (params?: { sector?: string; company?: string; symbol?: string; sentiment?: string }): Promise<NewsItem[]> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== "All") query.append(k, v);
      });
    }
    const url = query.toString() ? `${API_BASE}/news/feed?${query.toString()}` : `${API_BASE}/news/feed`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch news feed");
    return res.json();
  },

  getSectors: async (): Promise<SectorItem[]> => {
    const res = await fetch(`${API_BASE}/sectors`);
    if (!res.ok) throw new Error("Failed to fetch sectors");
    return res.json();
  },

  getEconomy: async (): Promise<MacroDashboard> => {
    const res = await fetch(`${API_BASE}/economy`);
    if (!res.ok) throw new Error("Failed to fetch economic data");
    return res.json();
  },

  getResearchReport: async (symbol: string): Promise<ResearchReport> => {
    const res = await fetch(`${API_BASE}/research/${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`Failed to fetch research report for ${symbol}`);
    return res.json();
  },

  runScreener: async (params: Record<string, any>): Promise<any[]> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "All") {
        query.append(k, String(v));
      }
    });
    const res = await fetch(`${API_BASE}/screener?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to run screener query");
    return res.json();
  },

  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const res = await fetch(`${API_BASE}/watchlist`);
    if (!res.ok) throw new Error("Failed to fetch watchlist");
    return res.json();
  },

  addToWatchlist: async (symbol: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol })
    });
    if (!res.ok) throw new Error("Failed to add to watchlist");
    return res.json();
  },

  removeFromWatchlist: async (symbol: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to remove from watchlist");
    return res.json();
  },

  getProvidersStatus: async (): Promise<ApiProvidersStatus> => {
    const res = await fetch(`${API_BASE}/providers/status`);
    if (!res.ok) throw new Error("Failed to fetch API provider telemetry");
    return res.json();
  }
};
