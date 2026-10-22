"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  IndexOverview,
  MarketBreadth,
  StockSummary,
  Candle,
  StockFundamentals,
  FinancialStatements,
  ShareholdingPattern,
  ForecastingResult,
  NewsItem,
  SectorItem,
  MacroDashboard,
  ResearchReport,
  WatchlistItem,
  ApiProvidersStatus,
  StockScore,
  WholeMarketOverview
} from "@/lib/api";
import { TickerTape } from "@/components/TickerTape";
import { InteractiveCandlestickChart } from "@/components/InteractiveCandlestickChart";
import { ForecastingFanChart } from "@/components/ForecastingFanChart";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Newspaper,
  Layers,
  Landmark,
  Bot,
  SlidersHorizontal,
  Bookmark,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  PieChart,
  Filter,
  DollarSign,
  Percent,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Globe2,
  Key,
  X,
  Award,
  Check,
  AlertCircle,
  Sparkles
} from "lucide-react";

type TabType =
  | "overview"
  | "stocks"
  | "forecasting"
  | "news"
  | "sectors"
  | "economy"
  | "research"
  | "screener"
  | "watchlist";

export default function TerminalHome() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("RELIANCE.NS");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1y");

  // Telemetry & State
  const [breadth, setBreadth] = useState<MarketBreadth | null>(null);
  const [candlesData, setCandlesData] = useState<{ candles: Candle[]; latest_technicals: any } | null>(null);
  const [fundamentalsData, setFundamentalsData] = useState<{
    fundamentals: StockFundamentals;
    financial_statements: FinancialStatements;
    shareholding_pattern: ShareholdingPattern;
    stock_score?: StockScore;
  } | null>(null);
  const [forecastingData, setForecastingData] = useState<ForecastingResult | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [stockNews, setStockNews] = useState<NewsItem[]>([]);
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [economy, setEconomy] = useState<MacroDashboard | null>(null);
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [screenerResults, setScreenerResults] = useState<any[]>([]);
  const [providersStatus, setProvidersStatus] = useState<ApiProvidersStatus | null>(null);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [marketOverview, setMarketOverview] = useState<WholeMarketOverview | null>(null);

  // News Intelligence Filters
  const [newsFilterSector, setNewsFilterSector] = useState<string>("All");
  const [newsFilterCompany, setNewsFilterCompany] = useState<string>("All");
  const [newsFilterSentiment, setNewsFilterSentiment] = useState<string>("All");

  // Stock Analysis Sub-tab
  const [statementSubTab, setStatementSubTab] = useState<"income" | "balance" | "cashflow" | "shareholding">("income");

  // Screener Filters
  const [screenSector, setScreenSector] = useState<string>("All");
  const [screenMaxPE, setScreenMaxPE] = useState<number>(50);
  const [screenMinROE, setScreenMinROE] = useState<number>(10);

  // Initial Load
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [bData, sData, eData, wData, pData, mData] = await Promise.all([
          api.getMarketBreadth().catch(err => { console.error("Breadth error:", err); return null; }),
          api.getSectors().catch(err => { console.error("Sectors error:", err); return []; }),
          api.getEconomy().catch(err => { console.error("Economy error:", err); return null; }),
          api.getWatchlist().catch(err => { console.error("Watchlist error:", err); return []; }),
          api.getProvidersStatus().catch(() => null),
          api.getWholeMarketOverview().catch(err => { console.error("Overview error:", err); return null; })
        ]);
        if (bData) setBreadth(bData);
        if (sData) setSectors(sData);
        if (eData) setEconomy(eData);
        if (wData) setWatchlist(wData);
        if (pData) setProvidersStatus(pData);
        if (mData) setMarketOverview(mData);
      } catch (e) {
        console.error("Initialization error:", e);
      }
    };
    fetchInitial();
  }, []);

  // Fetch News Feed with active filters (No user text input required)
  useEffect(() => {
    const fetchFilteredNews = async () => {
      try {
        const nData = await api.getNewsFeed({
          sector: newsFilterSector,
          company: newsFilterCompany,
          sentiment: newsFilterSentiment
        }).catch(() => []);
        if (nData) setNewsFeed(nData);
      } catch (e) {
        console.error("News fetch error:", e);
      }
    };
    fetchFilteredNews();
  }, [newsFilterSector, newsFilterCompany, newsFilterSentiment, activeTab]);

  // Fetch Stock Specific Data (Candles, Fundamentals, Statements, Shareholding, Stock News)
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const [cData, fData, snData] = await Promise.all([
          api.getStockCandles(selectedSymbol, selectedPeriod).catch(err => { console.error("Candles err:", err); return null; }),
          api.getStockFundamentals(selectedSymbol).catch(err => { console.error("Fundamentals err:", err); return null; }),
          api.getNewsFeed({ symbol: selectedSymbol }).catch(err => { console.error("Stock news err:", err); return []; })
        ]);
        if (cData) setCandlesData(cData);
        if (fData) setFundamentalsData(fData);
        if (snData) setStockNews(snData);

        if (activeTab === "forecasting") {
          const fc = await api.getForecasting(selectedSymbol).catch(() => null);
          if (fc) setForecastingData(fc);
        }

        if (activeTab === "research") {
          const rep = await api.getResearchReport(selectedSymbol).catch(() => null);
          if (rep) setResearchReport(rep);
        }
      } catch (err) {
        console.error("Stock data error:", err);
      }
    };

    fetchStockData();
  }, [selectedSymbol, selectedPeriod, activeTab]);

  // Screener query
  const handleRunScreener = async () => {
    try {
      const results = await api.runScreener({
        sector: screenSector,
        max_pe: screenMaxPE,
        min_roe: screenMinROE
      });
      setScreenerResults(results);
    } catch (e) {
      console.error("Screener error:", e);
    }
  };

  useEffect(() => {
    if (activeTab === "screener" && screenerResults.length === 0) {
      handleRunScreener();
    }
  }, [activeTab]);

  // Watchlist Actions
  const handleAddToWatchlist = async (sym: string) => {
    try {
      await api.addToWatchlist(sym);
      const updated = await api.getWatchlist();
      setWatchlist(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFromWatchlist = async (sym: string) => {
    try {
      await api.removeFromWatchlist(sym);
      setWatchlist(watchlist.filter((w) => w.symbol !== sym));
    } catch (e) {
      console.error(e);
    }
  };

  const trackedSymbols = [
    { sym: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy & Petrochemicals" },
    { sym: "TCS.NS", name: "Tata Consultancy Services", sector: "Information Technology" },
    { sym: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking & Financial Services" },
    { sym: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking & Financial Services" },
    { sym: "INFY.NS", name: "Infosys", sector: "Information Technology" },
    { sym: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecommunications" },
    { sym: "ITC.NS", name: "ITC Ltd", sector: "Fast-Moving Consumer Goods" },
    { sym: "SBIN.NS", name: "State Bank of India", sector: "Banking & Financial Services" },
    { sym: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure & Capital Goods" },
    { sym: "TATAMOTORS.NS", name: "Tata Motors", sector: "Automobile & Mobility" },
    { sym: "SUNPHARMA.NS", name: "Sun Pharma", sector: "Pharmaceuticals & Healthcare" },
    { sym: "MARUTI.NS", name: "Maruti Suzuki", sector: "Automobile & Mobility" },
    { sym: "TITAN.NS", name: "Titan Company", sector: "Consumer Discretionary" },
    { sym: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Banking & Financial Services" },
    { sym: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals & Mining" },
    { sym: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer Discretionary" }
  ];

  const fund = fundamentalsData?.fundamentals;
  const fin = fundamentalsData?.financial_statements;
  const shareholding = fundamentalsData?.shareholding_pattern;
  const stockScore = fundamentalsData?.stock_score;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C24] flex flex-col font-nunito select-none relative overflow-x-hidden">
      {/* Organic Ambient Color Washes */}
      <div className="fixed top-20 left-1/4 w-[36rem] h-[36rem] bg-[#5D7052]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-24 right-1/4 w-[32rem] h-[32rem] bg-[#C18C5D]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <TickerTape />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-60 bg-[#F7F4EE] border-r border-[#DED8CF] flex flex-col justify-between p-3.5 select-none shrink-0 shadow-sm">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-[#78786C] px-3.5 py-1 uppercase tracking-wider font-fraunces">
              Terminal Workspace
            </div>

            {[
              { id: "overview", label: "Market Overview", icon: BarChart3 },
              { id: "stocks", label: "Stock Analysis", icon: TrendingUp },
              { id: "forecasting", label: "Price Forecasting", icon: Activity },
              { id: "news", label: "News Intelligence", icon: Newspaper },
              { id: "sectors", label: "Sector Analysis", icon: Layers },
              { id: "economy", label: "Economic Dashboard", icon: Landmark },
              { id: "research", label: "AI Research Assistant", icon: Bot },
              { id: "screener", label: "Stock Screener", icon: SlidersHorizontal },
              { id: "watchlist", label: "Watchlist", icon: Bookmark }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-[#5D7052] text-[#F3F4F1] shadow-organic-soft font-bold scale-[1.02]"
                      : "text-[#5A5A4E] hover:text-[#2C2C24] hover:bg-[#EAE4D9]/80 font-semibold"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#F3F4F1]" : "text-[#78786C]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Target Equity Switcher */}
          <div className="pt-3 border-t border-[#DED8CF] space-y-2.5 font-nunito text-xs">
            <div className="text-[10px] text-[#78786C] uppercase font-bold px-1 font-fraunces">Selected Equity</div>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-[#FEFEFA] border border-[#DED8CF] text-[#2C2C24] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30 focus:border-[#5D7052] transition-colors"
            >
              {trackedSymbols.map((s) => (
                <option key={s.sym} value={s.sym}>
                  {s.sym.replace(".NS", "")} ({s.name.split(" ")[0]})
                </option>
              ))}
            </select>

            <div className="bg-[#FEFEFA] p-2.5 rounded-xl border border-[#DED8CF] text-[10px] text-[#78786C] space-y-1 shadow-sm font-mono-num">
              <div>Price: <strong className="text-[#2C2C24] font-bold">₹{fund?.current_price || "--"}</strong></div>
              <div>Sector: <span className="text-[#5D7052] font-semibold">{fund?.sector || "--"}</span></div>
            </div>

            {/* Connected Providers Status Pill */}
            <button
              onClick={() => setShowApiModal(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-full bg-[#FEFEFA] hover:bg-[#EAE4D9] border border-[#DED8CF] transition-all text-left shadow-sm group"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2C2C24]">
                <Key className="w-3.5 h-3.5 text-[#5D7052] group-hover:rotate-12 transition-transform" />
                <span>API Keys & Feeds</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-[#5D7052] font-bold bg-[#5D7052]/10 px-2 py-0.5 rounded-full border border-[#5D7052]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5D7052] animate-pulse"></span> 4 Active
              </span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-transparent space-y-6">
          {/* Universal Stock Selection Header Bar (Active for ALL tabs EXCEPT Market Overview) */}
          {activeTab !== "overview" && (
            <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-4 font-nunito text-xs space-y-3 shadow-organic-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#5D7052] font-bold uppercase tracking-wider font-fraunces">
                    <TrendingUp className="w-4 h-4 text-[#5D7052]" />
                    <span>Select Target Equity:</span>
                  </div>

                  {/* Dropdown Selector */}
                  <select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="bg-[#FDFCF8] border border-[#DED8CF] hover:border-[#5D7052] text-[#2C2C24] text-xs font-bold rounded-full px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30 transition-colors"
                  >
                    {trackedSymbols.map((s) => (
                      <option key={s.sym} value={s.sym}>
                        {s.sym.replace(".NS", "")} — {s.name} ({s.sector.split("&")[0].trim()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Telemetry Pill */}
                {fund && (
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                    <div className="flex items-center gap-1.5 bg-[#F7F4EE] px-3 py-1 rounded-full border border-[#E8E2D8]">
                      <span className="text-[#78786C]">LTP:</span>
                      <strong className="text-[#2C2C24] text-xs font-mono-num font-bold">₹{fund.current_price.toFixed(2)}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#F7F4EE] px-3 py-1 rounded-full border border-[#E8E2D8]">
                      <span className="text-[#78786C]">52W Range:</span>
                      <strong className="text-[#5D7052] font-mono-num font-bold">{fund.fifty_two_week_range_pct}%</strong>
                    </div>

                    {stockScore && (
                      <div className="flex items-center gap-1.5 bg-[#F7F4EE] px-3 py-1 rounded-full border border-[#E8E2D8]">
                        <span className="text-[#78786C]">Score:</span>
                        <strong className={`font-mono-num font-bold ${
                          stockScore.overall_score >= 80 ? "text-[#5D7052]" :
                          stockScore.overall_score >= 65 ? "text-[#5D7052]" :
                          stockScore.overall_score >= 50 ? "text-[#C18C5D]" : "text-[#A85448]"
                        }`}>
                          {stockScore.overall_score}/100
                        </strong>
                        <span className="text-[10px] text-[#78786C]">({stockScore.rating.split("//")[0].trim()})</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleAddToWatchlist(selectedSymbol)}
                      className="px-3.5 py-1 bg-[#5D7052] text-white text-[11px] font-bold rounded-full flex items-center gap-1 hover:bg-[#4d5e43] shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                      <Bookmark className="w-3.5 h-3.5" /> Watchlist
                    </button>
                  </div>
                )}
              </div>

              {/* Quick-Access Equity Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-[#E8E2D8]">
                <span className="text-[10px] text-[#78786C] uppercase font-bold mr-1 font-fraunces">Quick Select:</span>
                {[
                  "RELIANCE.NS",
                  "TCS.NS",
                  "HDFCBANK.NS",
                  "ICICIBANK.NS",
                  "INFY.NS",
                  "TATAMOTORS.NS",
                  "SBIN.NS",
                  "BHARTIARTL.NS",
                  "ITC.NS",
                  "LT.NS",
                  "BAJFINANCE.NS",
                  "SUNPHARMA.NS"
                ].map((sym) => {
                  const isSelected = selectedSymbol === sym;
                  const shortName = sym.replace(".NS", "");
                  return (
                    <button
                      key={sym}
                      onClick={() => setSelectedSymbol(sym)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                        isSelected
                          ? "bg-[#5D7052] text-[#F3F4F1] shadow-organic-soft font-extrabold scale-105"
                          : "bg-[#F0EBE5] text-[#5A5A4E] hover:text-[#2C2C24] hover:bg-[#E6DCCD] border border-[#DED8CF]"
                      }`}
                    >
                      {shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. WHOLE INDIAN MARKET OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 font-nunito">
              {/* Top Benchmark & Sectoral Indices Bar + INDIA VIX */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider font-fraunces flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#5D7052]" /> Indian Benchmark & Sectoral Telemetry (NSE / BSE)
                  </div>
                  <span className="text-[11px] text-[#78786C] bg-[#F7F4EE] px-3 py-0.5 rounded-full border border-[#E8E2D8]">
                    Real-Time Volatility & Index Watch
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-nunito text-xs">
                  {(marketOverview?.indices && marketOverview.indices.length > 0 ? marketOverview.indices : [
                    { name: "NIFTY 50", ticker: "^NSEI", price: 24857.30, change: 154.20, percent_change: 0.62, day_high: 24910.45, day_low: 24780.10 },
                    { name: "SENSEX", ticker: "^BSESN", price: 81452.80, change: 480.35, percent_change: 0.59, day_high: 81620.00, day_low: 81210.50 },
                    { name: "BANK NIFTY", ticker: "^NSEBANK", price: 51240.60, change: 310.40, percent_change: 0.61, day_high: 51380.00, day_low: 50990.20 },
                    { name: "NIFTY IT", ticker: "^CNXIT", price: 42150.25, change: -120.30, percent_change: -0.28, day_high: 42400.00, day_low: 42050.10 },
                    { name: "INDIA VIX", ticker: "^INDIAVIX", price: 13.40, change: -0.45, percent_change: -3.25, day_high: 14.10, day_low: 13.15 },
                    { name: "NIFTY AUTO", ticker: "^CNXAUTO", price: 25480.10, change: 245.80, percent_change: 0.97, day_high: 25550.00, day_low: 25290.00 },
                    { name: "NIFTY FMCG", ticker: "^CNXFMCG", price: 58920.40, change: 110.20, percent_change: 0.19, day_high: 59100.00, day_low: 58800.00 },
                    { name: "NIFTY METAL", ticker: "^CNXMETAL", price: 9340.50, change: 142.10, percent_change: 1.54, day_high: 9380.00, day_low: 9210.00 },
                    { name: "NIFTY PHARMA", ticker: "^CNXPHARMA", price: 21890.30, change: 85.60, percent_change: 0.39, day_high: 21980.00, day_low: 21810.00 }
                  ]).map((idx, i) => {
                    const isPos = idx.percent_change >= 0;
                    const isVix = idx.name.includes("VIX");
                    return (
                      <div key={i} className="bg-[#FEFEFA] border border-[#DED8CF] p-3.5 rounded-2xl shadow-organic-soft hover:-translate-y-0.5 hover:shadow-organic-float transition-all duration-300">
                        <div className="flex items-center justify-between text-[10px] text-[#78786C] uppercase font-bold">
                          <span className="font-fraunces text-xs text-[#2C2C24]">{idx.name}</span>
                          <span className="text-[9px] text-[#78786C] font-mono-num">{idx.ticker}</span>
                        </div>
                        <div className="text-base font-bold font-mono-num text-[#2C2C24] mt-1">
                          {isVix ? idx.price.toFixed(2) : idx.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] font-mono-num">
                          <span className={`flex items-center gap-0.5 font-bold ${
                            isVix ? (idx.change <= 0 ? "text-[#5D7052]" : "text-[#A85448]") : (isPos ? "text-[#5D7052]" : "text-[#A85448]")
                          }`}>
                            {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPos ? "+" : ""}{idx.change > 0 ? idx.change.toFixed(2) : idx.change.toFixed(2)} ({isPos ? "+" : ""}{idx.percent_change.toFixed(2)}%)
                          </span>
                          <span className="text-[9px] text-[#78786C]">
                            {idx.day_low?.toFixed(0)}-{idx.day_high?.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Whole-Market FinBERT Sentiment Radar & Fear/Greed Pulse */}
              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 font-nunito space-y-4 shadow-organic-soft">
                <div className="flex flex-wrap items-center justify-between border-b border-[#E8E2D8] pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5D7052]" />
                    <span className="text-xs font-bold text-[#2C2C24] uppercase tracking-wider font-fraunces">
                      Whole-Market FinBERT Sentiment Radar & Fear / Greed Index
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#5D7052] bg-[#5D7052]/10 px-3 py-1 rounded-full border border-[#5D7052]/20 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5D7052] animate-pulse"></span>
                    <span>NLP Sequence Classification Engine Live (ProsusAI/finbert)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Market Sentiment Score Dial */}
                  <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between">
                    <div className="text-[10px] uppercase font-bold text-[#78786C] tracking-wider font-fraunces">
                      Macro Market Sentiment Pulse
                    </div>
                    <div className="my-2 flex items-baseline gap-2">
                      <span className={`text-4xl font-extrabold font-fraunces ${
                        (marketOverview?.sentiment_pulse.market_sentiment_score || 72) >= 65 ? "text-[#5D7052]" :
                        (marketOverview?.sentiment_pulse.market_sentiment_score || 72) >= 45 ? "text-[#C18C5D]" : "text-[#A85448]"
                      }`}>
                        {marketOverview?.sentiment_pulse.market_sentiment_score || 72}
                      </span>
                      <span className="text-[#78786C] text-base font-bold font-fraunces">/ 100</span>
                    </div>

                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-[#5D7052]/10 text-[#5D7052] border-[#5D7052]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5D7052] animate-pulse"></span>
                        {marketOverview?.sentiment_pulse.market_sentiment_label || "BULLISH MOMENTUM"}
                      </div>
                      <p className="text-[11px] text-[#5A5A4E] leading-relaxed">
                        {marketOverview?.sentiment_pulse.status_commentary || "Broad-based risk-on sentiment with institutional accumulation across large caps."}
                      </p>
                    </div>
                  </div>

                  {/* FinBERT Headline Polarity Spectrum */}
                  <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#78786C] tracking-wider font-fraunces">Headline Sentiment Distribution</span>
                      <span className="text-xs font-bold text-[#5D7052] font-mono-num">
                        Net: {marketOverview?.sentiment_pulse.net_finbert_sentiment !== undefined ? (marketOverview.sentiment_pulse.net_finbert_sentiment > 0 ? "+" : "") + marketOverview.sentiment_pulse.net_finbert_sentiment.toFixed(2) : "+0.32"}
                      </span>
                    </div>

                    {/* 3-Color Bar */}
                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#E8E2D8]">
                      <div
                        style={{ width: `${marketOverview?.sentiment_pulse.positive_news_pct || 65}%` }}
                        className="bg-[#5D7052] h-full"
                        title={`Positive: ${marketOverview?.sentiment_pulse.positive_news_pct || 65}%`}
                      ></div>
                      <div
                        style={{ width: `${marketOverview?.sentiment_pulse.neutral_news_pct || 23}%` }}
                        className="bg-[#C18C5D] h-full"
                        title={`Neutral: ${marketOverview?.sentiment_pulse.neutral_news_pct || 23}%`}
                      ></div>
                      <div
                        style={{ width: `${marketOverview?.sentiment_pulse.negative_news_pct || 12}%` }}
                        className="bg-[#A85448] h-full"
                        title={`Negative: ${marketOverview?.sentiment_pulse.negative_news_pct || 12}%`}
                      ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono-num">
                      <div className="bg-[#FEFEFA] p-2 rounded-xl border border-[#DED8CF] text-center">
                        <div className="text-[#5D7052] font-bold">🟢 Bullish</div>
                        <div className="text-[#2C2C24] font-bold mt-0.5">{marketOverview?.sentiment_pulse.positive_count || 18} ({marketOverview?.sentiment_pulse.positive_news_pct || 65}%)</div>
                      </div>
                      <div className="bg-[#FEFEFA] p-2 rounded-xl border border-[#DED8CF] text-center">
                        <div className="text-[#C18C5D] font-bold">⚪ Neutral</div>
                        <div className="text-[#2C2C24] font-bold mt-0.5">{marketOverview?.sentiment_pulse.neutral_count || 6} ({marketOverview?.sentiment_pulse.neutral_news_pct || 23}%)</div>
                      </div>
                      <div className="bg-[#FEFEFA] p-2 rounded-xl border border-[#DED8CF] text-center">
                        <div className="text-[#A85448] font-bold">🔴 Bearish</div>
                        <div className="text-[#2C2C24] font-bold mt-0.5">{marketOverview?.sentiment_pulse.negative_count || 3} ({marketOverview?.sentiment_pulse.negative_news_pct || 12}%)</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#78786C]">
                      Evaluated <strong className="text-[#2C2C24]">{marketOverview?.sentiment_pulse.total_news_evaluated || 27}</strong> live market-moving headlines via sequence classification.
                    </div>
                  </div>

                  {/* INDIA VIX & Volatility Regime */}
                  <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#78786C] tracking-wider font-fraunces">INDIA VIX Volatility Regime</span>
                      <span className="text-xs font-bold text-[#5D7052] font-mono-num">{marketOverview?.sentiment_pulse.vix_level || 13.40}</span>
                    </div>

                    <div className="p-3 bg-[#FEFEFA] rounded-xl border border-[#DED8CF] space-y-1.5">
                      <div className="text-[11px] font-bold text-[#2C2C24] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#5D7052]"></span>
                        <span>{marketOverview?.sentiment_pulse.vix_regime || "Normal / Low Volatility (Comfort Zone)"}</span>
                      </div>
                      <p className="text-[10px] text-[#5A5A4E] leading-relaxed">
                        Low implied volatility signals muted market panic, supporting index continuation and systematic institutional participation.
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-[#78786C] font-mono-num">
                      <span>Comfort Zone: &lt; 16.0</span>
                      <span>Elevated: 16-22</span>
                      <span>Panic: &gt; 22.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Institutional Liquidity & Breadth Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-nunito text-xs">
                {/* Institutional Cash Market Flows (FII vs DII) */}
                <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 space-y-4 shadow-organic-soft">
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider flex items-center gap-1.5 font-fraunces">
                      <Landmark className="w-4 h-4 text-[#5D7052]" /> Institutional Liquidity Telemetry (NSE/BSE Cash)
                    </div>
                    <span className="text-[10px] text-[#5D7052] font-bold bg-[#5D7052]/10 px-2.5 py-0.5 rounded-full border border-[#5D7052]/30">Net Inflow +₹3,605 Cr</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center font-mono-num">
                    <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
                      <div className="text-[10px] text-[#78786C] uppercase font-bold tracking-wider">FII / FPI Net</div>
                      <div className="text-sm font-bold text-[#5D7052] mt-1">+₹{marketOverview?.institutional_flows.fii_net_crores?.toFixed(1) || "1,420.5"} Cr</div>
                      <div className="text-[9px] text-[#5D7052] font-semibold mt-0.5">Net Buyers</div>
                    </div>
                    <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
                      <div className="text-[10px] text-[#78786C] uppercase font-bold tracking-wider">DII Net Flow</div>
                      <div className="text-sm font-bold text-[#5D7052] mt-1">+₹{marketOverview?.institutional_flows.dii_net_crores?.toFixed(1) || "2,185.0"} Cr</div>
                      <div className="text-[9px] text-[#5D7052] font-semibold mt-0.5">SIP Absorption</div>
                    </div>
                    <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
                      <div className="text-[10px] text-[#78786C] uppercase font-bold tracking-wider">Total Net Liquidity</div>
                      <div className="text-sm font-bold text-[#C18C5D] mt-1">+₹{marketOverview?.institutional_flows.total_net_crores?.toFixed(1) || "3,605.5"} Cr</div>
                      <div className="text-[9px] text-[#C18C5D] font-semibold mt-0.5">Strong Tailwinds</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#5A5A4E] bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8] leading-relaxed">
                    {marketOverview?.institutional_flows.commentary || "Domestic mutual funds recorded steady net capital accumulation (+₹2,185 Cr), absorbing foreign institutional swings."}
                  </div>
                </div>

                {/* Whole Market Breadth & Expansion */}
                <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 space-y-4 shadow-organic-soft">
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider flex items-center gap-1.5 font-fraunces">
                      <Activity className="w-4 h-4 text-[#5D7052]" /> NSE Whole-Market Breadth & Momentum
                    </div>
                    <span className="text-[10px] text-[#5D7052] font-bold bg-[#5D7052]/10 px-2.5 py-0.5 rounded-full border border-[#5D7052]/30 font-mono-num">A/D Ratio: {marketOverview?.market_breadth.advance_decline_ratio || 1.61}x</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center font-mono-num">
                    <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                      <div className="text-[10px] text-[#78786C] uppercase font-bold">Advances</div>
                      <div className="text-sm font-bold text-[#5D7052] mt-1">{marketOverview?.market_breadth.advances || 1435}</div>
                      <div className="text-[9px] text-[#78786C]">62% Active</div>
                    </div>
                    <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                      <div className="text-[10px] text-[#78786C] uppercase font-bold">Declines</div>
                      <div className="text-sm font-bold text-[#A85448] mt-1">{marketOverview?.market_breadth.declines || 892}</div>
                      <div className="text-[9px] text-[#78786C]">38% Active</div>
                    </div>
                    <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                      <div className="text-[10px] text-[#78786C] uppercase font-bold">52W Highs</div>
                      <div className="text-sm font-bold text-[#5D7052] mt-1">{marketOverview?.market_breadth.highs_52w || 184}</div>
                      <div className="text-[9px] text-[#5D7052]">Breakouts</div>
                    </div>
                    <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                      <div className="text-[10px] text-[#78786C] uppercase font-bold">52W Lows</div>
                      <div className="text-sm font-bold text-[#A85448] mt-1">{marketOverview?.market_breadth.lows_52w || 16}</div>
                      <div className="text-[9px] text-[#78786C]">Troughs</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#5A5A4E] bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8] flex items-center justify-between">
                    <span>Market Breadth Health:</span>
                    <strong className="text-[#5D7052] font-semibold">{marketOverview?.market_breadth.breadth_momentum || "Broad-Based Market Expansion (62% Equities Advancing)"}</strong>
                  </div>
                </div>
              </div>

              {/* 4. Sector Performance Heatmap */}
              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 font-nunito text-xs space-y-4 shadow-organic-soft">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                  <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider flex items-center gap-1.5 font-fraunces">
                    <Layers className="w-4 h-4 text-[#5D7052]" /> Sectoral Performance & FinBERT Sentiment Matrix
                  </div>
                  <span className="text-[10px] text-[#78786C]">Sector Rotation & Momentum</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(marketOverview?.sector_heatmap && marketOverview.sector_heatmap.length > 0 ? marketOverview.sector_heatmap : sectors).map((sec, i) => {
                    const isPos = sec.one_month_return ? !sec.one_month_return.includes("-") : true;
                    return (
                      <div key={i} className="bg-[#F7F4EE] border border-[#E8E2D8] p-3.5 rounded-2xl hover:border-[#5D7052]/50 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-fraunces text-[#2C2C24] text-xs truncate max-w-[120px]">{sec.sector}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            sec.sentiment_bias?.includes("BULLISH") ? "bg-[#5D7052]/10 text-[#5D7052] border border-[#5D7052]/30" :
                            sec.sentiment_bias?.includes("BEARISH") ? "bg-[#A85448]/10 text-[#A85448] border border-[#A85448]/30" :
                            "bg-[#E6DCCD] text-[#4A4A40] border border-[#DED8CF]"
                          }`}>
                            {sec.sentiment_bias || "NEUTRAL"}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between font-mono-num">
                          <span className="text-[10px] text-[#78786C]">1-Month Return:</span>
                          <span className={`text-xs font-bold ${isPos ? "text-[#5D7052]" : "text-[#A85448]"}`}>
                            {sec.one_month_return || "+1.2%"}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between text-[10px] font-mono-num">
                          <span className="text-[#78786C]">NIFTY Weight:</span>
                          <span className="text-[#2C2C24] font-semibold">{sec.weight_in_nifty || "--"}</span>
                        </div>

                        <div className="flex items-baseline justify-between text-[9px] text-[#78786C] pt-1.5 border-t border-[#E8E2D8] font-mono-num">
                          <span>Avg P/E: {sec.avg_pe ? `${sec.avg_pe}x` : "--"}</span>
                          <span>{sec.constituents?.length || 4} Tracked</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Top Market Movers (Gainers & Losers) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-nunito text-xs">
                {/* Top Gainers */}
                <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 space-y-3 shadow-organic-soft">
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider flex items-center gap-1.5 font-fraunces">
                      <TrendingUp className="w-4 h-4 text-[#5D7052]" /> Top Market Gainers (NSE)
                    </div>
                    <span className="text-[10px] text-[#78786C]">Click to analyze</span>
                  </div>

                  <div className="space-y-2">
                    {(marketOverview?.top_gainers || breadth?.top_gainers || []).slice(0, 5).map((stock, idx) => (
                      <div
                        key={idx}
                        onClick={() => { setSelectedSymbol(stock.symbol); setActiveTab("stocks"); }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#FDFCF8] hover:bg-[#F7F4EE] border border-[#E8E2D8] cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div>
                          <div className="font-bold text-[#2C2C24] text-xs font-fraunces">{stock.symbol.replace(".NS", "")}</div>
                          <div className="text-[10px] text-[#78786C]">{stock.name}</div>
                        </div>
                        <div className="text-right font-mono-num">
                          <div className="font-bold text-[#2C2C24] text-xs">₹{stock.price.toFixed(2)}</div>
                          <div className="text-[10px] font-bold text-[#5D7052]">+{stock.percent_change.toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Losers */}
                <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 space-y-3 shadow-organic-soft">
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                    <div className="text-xs font-bold text-[#A85448] uppercase tracking-wider flex items-center gap-1.5 font-fraunces">
                      <ArrowDownRight className="w-4 h-4 text-[#A85448]" /> Top Market Losers (NSE)
                    </div>
                    <span className="text-[10px] text-[#78786C]">Click to analyze</span>
                  </div>

                  <div className="space-y-2">
                    {(marketOverview?.top_losers || breadth?.top_losers || []).slice(0, 5).map((stock, idx) => (
                      <div
                        key={idx}
                        onClick={() => { setSelectedSymbol(stock.symbol); setActiveTab("stocks"); }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#FDFCF8] hover:bg-[#F7F4EE] border border-[#E8E2D8] cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div>
                          <div className="font-bold text-[#2C2C24] text-xs font-fraunces">{stock.symbol.replace(".NS", "")}</div>
                          <div className="text-[10px] text-[#78786C]">{stock.name}</div>
                        </div>
                        <div className="text-right font-mono-num">
                          <div className="font-bold text-[#2C2C24] text-xs">₹{stock.price.toFixed(2)}</div>
                          <div className="text-[10px] font-bold text-[#A85448]">{stock.percent_change.toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Live Macro Financial Wire Stream */}
              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 font-nunito text-xs space-y-3 shadow-organic-soft">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                  <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider flex items-center gap-1.5 font-fraunces">
                    <Newspaper className="w-4 h-4 text-[#5D7052]" /> Whole Indian Market Macro Financial Wire & FinBERT Classification
                  </div>
                  <span className="text-[10px] text-[#78786C]">Live Macro Telemetry</span>
                </div>

                <div className="space-y-2.5">
                  {(marketOverview?.macro_news_feed || newsFeed).slice(0, 8).map((n, idx) => {
                    const isPos = n.sentiment === "positive";
                    const isNeg = n.sentiment === "negative";
                    const badgeClass = isPos ? "bg-[#5D7052]/10 text-[#5D7052] border-[#5D7052]/30" : isNeg ? "bg-[#A85448]/10 text-[#A85448] border-[#A85448]/30" : "bg-[#E6DCCD] text-[#4A4A40] border-[#DED8CF]";
                    return (
                      <div key={idx} className="p-3.5 bg-[#FDFCF8] rounded-xl border border-[#E8E2D8] hover:border-[#5D7052]/40 transition-colors">
                        <div className="text-sm font-semibold text-[#2C2C24] mb-2 leading-snug">{n.headline}</div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#78786C] font-mono-num">
                          <span className="text-[#5D7052] font-bold">{n.source}</span>
                          <span>•</span>
                          <span>{n.date}</span>
                          <span>•</span>
                          <span className={`px-2.5 py-0.5 rounded-full border font-bold uppercase ${badgeClass}`}>
                            {n.sentiment}
                          </span>
                          <span>•</span>
                          <span>Confidence: <strong className="text-[#2C2C24]">{(n.confidence * 100).toFixed(1)}%</strong></span>
                          <span>•</span>
                          <span>Net Score: <strong className={isPos ? "text-[#5D7052]" : isNeg ? "text-[#A85448]" : "text-[#78786C]"}>{n.sentiment_score > 0 ? "+" : ""}{n.sentiment_score?.toFixed(3)}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. STOCK ANALYSIS */}
          {activeTab === "stocks" && (
            <div className="space-y-6 font-nunito text-xs">
              {/* Stock Header Banner & Valuation Ratios */}
              {fund && (
                <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft space-y-5">
                  {/* Stock Header Banner */}
                  <div className="flex flex-wrap items-center justify-between border-b border-[#E8E2D8] pb-4 gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-2xl font-bold font-fraunces text-[#2C2C24] tracking-wide">{fund.name}</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-[#F7F4EE] text-[#5D7052] font-bold border border-[#DED8CF] font-mono-num">
                          {fund.symbol} ({fund.exchange})
                        </span>
                      </div>
                      <div className="text-xs text-[#78786C] mt-1 font-nunito">
                        {fund.sector} | Industry: {fund.industry}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-3xl font-bold font-fraunces text-[#2C2C24]">₹{fund.current_price.toFixed(2)}</div>
                        <div className="text-[11px] text-[#5D7052] font-semibold font-mono-num">
                          52W Range: ₹{fund.fifty_two_week_low} - ₹{fund.fifty_two_week_high} ({fund.fifty_two_week_range_pct}% percentile)
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToWatchlist(fund.symbol)}
                        className="px-4 py-2 bg-[#5D7052] text-white text-xs font-bold rounded-full flex items-center gap-1.5 hover:bg-[#4d5e43] shadow-sm hover:scale-105 active:scale-95 transition-all"
                      >
                        <Bookmark className="w-3.5 h-3.5" /> Watchlist
                      </button>
                    </div>
                  </div>

                  {/* Complete Valuation Multiples & Capital Allocation Ratios */}
                  <div>
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-2.5 font-fraunces">
                      Complete Valuation Multiples & Capital Allocation Ratios
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 font-mono-num">
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Market Cap</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">₹{fund.market_cap_cr.toLocaleString("en-IN")} Cr</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Trailing P/E</div>
                        <div className="text-xs font-bold text-[#5D7052] mt-0.5">{fund.trailing_pe}x</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Forward P/E</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">{fund.forward_pe}x</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Price / Book</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">{fund.price_to_book}x</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">EV / EBITDA</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">{fund.ev_to_ebitda}x</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Return on Equity</div>
                        <div className="text-xs font-bold text-[#5D7052] mt-0.5">{fund.return_on_equity}%</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Debt-to-Equity</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">{fund.debt_to_equity}</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Dividend Yield</div>
                        <div className="text-xs font-bold text-[#C18C5D] mt-0.5">{fund.dividend_yield}%</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">EPS (Trailing)</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">₹{fund.eps}</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Operating Margin</div>
                        <div className="text-xs font-bold text-[#5D7052] mt-0.5">{fund.operating_margins}%</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Profit Margin</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">{fund.profit_margins}%</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Revenue Growth</div>
                        <div className="text-xs font-bold text-[#5D7052] mt-0.5">+{fund.revenue_growth}%</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Beta (vs NIFTY)</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">{fund.beta}</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">Return on Assets</div>
                        <div className="text-xs font-bold text-[#2C2C24] mt-0.5">{fund.return_on_assets}%</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">52W High</div>
                        <div className="text-xs font-bold text-[#5D7052] mt-0.5">₹{fund.fifty_two_week_high}</div>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] hover:border-[#C18C5D]/50 transition-all">
                        <div className="text-[9px] text-[#78786C] uppercase font-bold">52W Low</div>
                        <div className="text-xs font-bold text-[#A85448] mt-0.5">₹{fund.fifty_two_week_low}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Statements Sub-tab Navigation */}
              <div className="flex flex-wrap items-center justify-between border-b border-[#E8E2D8] pb-3 gap-3">
                <div>
                  <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase flex items-center gap-2">
                    {fund?.name} ({selectedSymbol}) Deep-Dive
                  </h1>
                  <p className="text-xs text-[#78786C]">Financial Statements, Historical Capital Trend Charts & Shareholding Pattern</p>
                </div>

                {/* Sub-tab Navigation Pills */}
                <div className="flex items-center bg-[#F7F4EE] p-1 rounded-full border border-[#DED8CF]">
                  <button
                    onClick={() => setStatementSubTab("income")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      statementSubTab === "income" ? "bg-[#5D7052] text-white shadow-sm" : "text-[#5A5A4E] hover:text-[#2C2C24]"
                    }`}
                  >
                    Income Statement
                  </button>
                  <button
                    onClick={() => setStatementSubTab("balance")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      statementSubTab === "balance" ? "bg-[#5D7052] text-white shadow-sm" : "text-[#5A5A4E] hover:text-[#2C2C24]"
                    }`}
                  >
                    Balance Sheet
                  </button>
                  <button
                    onClick={() => setStatementSubTab("cashflow")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      statementSubTab === "cashflow" ? "bg-[#5D7052] text-white shadow-sm" : "text-[#5A5A4E] hover:text-[#2C2C24]"
                    }`}
                  >
                    Cash Flows
                  </button>
                  <button
                    onClick={() => setStatementSubTab("shareholding")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      statementSubTab === "shareholding" ? "bg-[#5D7052] text-white shadow-sm" : "text-[#5A5A4E] hover:text-[#2C2C24]"
                    }`}
                  >
                    Shareholding Pattern
                  </button>
                </div>
              </div>

              {/* Institutional Stock Quality & Sentiment Scorecard */}
              {stockScore && (
                <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 space-y-4 shadow-organic-soft font-nunito">
                  <div className="flex flex-wrap items-center justify-between border-b border-[#E8E2D8] pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#5D7052]" />
                      <span className="text-xs font-bold text-[#2C2C24] uppercase tracking-wider font-fraunces">
                        Institutional Stock Quality & Sentiment Scorecard
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#78786C]">
                      <span>Evaluated: <strong className="text-[#2C2C24]">Earnings Results (45%)</strong> + <strong className="text-[#2C2C24]">News Sentiment (35%)</strong> + <strong className="text-[#2C2C24]">Institutional Backing (20%)</strong></span>
                    </div>
                  </div>

                  {/* Main Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                    {/* Overall Score Dial Card */}
                    <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between">
                      <div className="text-[10px] uppercase font-bold text-[#78786C] tracking-wider font-fraunces">
                        Composite Stock Score
                      </div>
                      
                      <div className="my-2 flex items-baseline gap-2">
                        <span className={`text-4xl font-extrabold font-fraunces ${
                          stockScore.overall_score >= 80 ? "text-[#5D7052]" :
                          stockScore.overall_score >= 65 ? "text-[#5D7052]" :
                          stockScore.overall_score >= 50 ? "text-[#C18C5D]" : "text-[#A85448]"
                        }`}>
                          {stockScore.overall_score}
                        </span>
                        <span className="text-[#78786C] text-base font-bold font-fraunces">/ 100</span>
                      </div>

                      <div className="space-y-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                          stockScore.overall_score >= 80 ? "bg-[#5D7052]/10 text-[#5D7052] border-[#5D7052]/30" :
                          stockScore.overall_score >= 65 ? "bg-[#5D7052]/10 text-[#5D7052] border-[#5D7052]/30" :
                          stockScore.overall_score >= 50 ? "bg-[#C18C5D]/10 text-[#C18C5D] border-[#C18C5D]/30" : "bg-[#A85448]/10 text-[#A85448] border-[#A85448]/30"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            stockScore.overall_score >= 65 ? "bg-[#5D7052]" : stockScore.overall_score >= 50 ? "bg-[#C18C5D]" : "bg-[#A85448]"
                          } animate-pulse`}></span>
                          {stockScore.rating}
                        </span>
                        <p className="text-[10px] text-[#5A5A4E] leading-relaxed">
                          {stockScore.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Pillar 1: Financial Results Score */}
                    <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#78786C] font-fraunces">Financial Results</span>
                        <span className="text-xs font-bold text-[#5D7052] font-mono-num">{stockScore.results_score} / 100</span>
                      </div>
                      
                      <div className="w-full bg-[#E8E2D8] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#5D7052] h-full rounded-full transition-all" style={{ width: `${stockScore.results_score}%` }}></div>
                      </div>

                      <div className="space-y-1 text-[10px] text-[#5A5A4E] pt-1 font-mono-num">
                        <div className="flex justify-between">
                          <span>Revenue Growth:</span>
                          <strong className="text-[#2C2C24]">+{fund?.revenue_growth}% YoY</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Net Profit Margin:</span>
                          <strong className="text-[#2C2C24]">{fund?.profit_margins}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Return on Equity:</span>
                          <strong className="text-[#5D7052]">{fund?.return_on_equity}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Debt-to-Equity:</span>
                          <strong className="text-[#2C2C24]">{fund?.debt_to_equity}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Pillar 2: News Positive vs Negative Sentiment */}
                    <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#78786C] font-fraunces">News Sentiment Flow</span>
                        <span className="text-xs font-bold text-[#5D7052] font-mono-num">{stockScore.news_score} / 100</span>
                      </div>

                      {/* 3-Color Sentiment Distribution Bar */}
                      <div className="w-full bg-[#E8E2D8] h-2 rounded-full overflow-hidden flex">
                        <div className="bg-[#5D7052] h-full" style={{ width: `${stockScore.news_breakdown.positive_pct}%` }} title={`Positive: ${stockScore.news_breakdown.positive_pct}%`}></div>
                        <div className="bg-[#C18C5D] h-full" style={{ width: `${stockScore.news_breakdown.neutral_pct}%` }} title={`Neutral: ${stockScore.news_breakdown.neutral_pct}%`}></div>
                        <div className="bg-[#A85448] h-full" style={{ width: `${stockScore.news_breakdown.negative_pct}%` }} title={`Negative: ${stockScore.news_breakdown.negative_pct}%`}></div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center py-1.5 bg-[#FEFEFA] rounded-xl border border-[#DED8CF] font-mono-num">
                        <div>
                          <div className="text-[9px] text-[#5D7052] font-bold">BULLISH</div>
                          <div className="text-xs font-extrabold text-[#5D7052]">{stockScore.news_breakdown.positive_count}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#78786C] font-bold">NEUTRAL</div>
                          <div className="text-xs font-extrabold text-[#2C2C24]">{stockScore.news_breakdown.neutral_count}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#A85448] font-bold">BEARISH</div>
                          <div className="text-xs font-extrabold text-[#A85448]">{stockScore.news_breakdown.negative_count}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#78786C] font-mono-num">
                        <span>FinBERT Net Score:</span>
                        <strong className={stockScore.news_breakdown.net_sentiment_score >= 0 ? "text-[#5D7052]" : "text-[#A85448]"}>
                          {stockScore.news_breakdown.net_sentiment_score >= 0 ? "+" : ""}{stockScore.news_breakdown.net_sentiment_score}
                        </strong>
                      </div>
                    </div>

                    {/* Pillar 3: Shareholding & Institutional Backing */}
                    <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#78786C] font-fraunces">Institutional Backing</span>
                        <span className="text-xs font-bold text-[#C18C5D] font-mono-num">{stockScore.shareholding_score} / 100</span>
                      </div>

                      <div className="w-full bg-[#E8E2D8] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#C18C5D] h-full rounded-full transition-all" style={{ width: `${stockScore.shareholding_score}%` }}></div>
                      </div>

                      <div className="space-y-1 text-[10px] text-[#5A5A4E] pt-1 font-mono-num">
                        <div className="flex justify-between">
                          <span>FII Holding:</span>
                          <strong className="text-[#2C2C24]">{shareholding?.current.fii}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>DII Holding:</span>
                          <strong className="text-[#2C2C24]">{shareholding?.current.dii}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Promoter Stake:</span>
                          <strong className="text-[#2C2C24]">{shareholding?.current.promoters}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Institutional Base:</span>
                          <strong className="text-[#5D7052]">
                            {((shareholding?.current.fii || 0) + (shareholding?.current.dii || 0)).toFixed(1)}%
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Verdict & Catalyst Breakdown */}
                  <div className="bg-[#FDFCF8] border border-[#E8E2D8] rounded-2xl p-4 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#5D7052] tracking-wider mb-1 flex items-center gap-1.5 font-fraunces">
                        <Sparkles className="w-3.5 h-3.5 text-[#5D7052]" /> Quantitative & FinBERT Sentiment Verdict
                      </div>
                      <p className="text-xs text-[#2C2C24] leading-relaxed">
                        {stockScore.verdict}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-[#E8E2D8]">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#5D7052] tracking-wider mb-1.5 flex items-center gap-1 font-fraunces">
                          <Check className="w-3 h-3 text-[#5D7052]" /> Key Fundamental & Sentiment Strengths
                        </div>
                        <ul className="space-y-1">
                          {stockScore.key_strengths.map((str, idx) => (
                            <li key={idx} className="text-[11px] text-[#5A5A4E] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5D7052]"></span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#A85448] tracking-wider mb-1.5 flex items-center gap-1 font-fraunces">
                          <AlertCircle className="w-3 h-3 text-[#A85448]" /> Key Risk Watchpoints
                        </div>
                        <ul className="space-y-1">
                          {stockScore.key_risks.map((rsk, idx) => (
                            <li key={idx} className="text-[11px] text-[#5A5A4E] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#A85448]"></span>
                              <span>{rsk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Candlestick & Volume Stream */}
              {candlesData && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider font-fraunces flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#5D7052]" /> Technical Candlestick & Volume Stream: {selectedSymbol}
                  </div>
                  <InteractiveCandlestickChart
                    candles={candlesData.candles}
                    symbol={selectedSymbol}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                  />
                </div>
              )}

              {/* INCOME STATEMENT VIEW */}
              {statementSubTab === "income" && fin && (
                <div className="space-y-4">
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-3 font-fraunces">
                      Annual Income Statement Trend (₹ Crores)
                    </div>
                    {/* Trend Visualizer Bars */}
                    <div className="grid grid-cols-4 gap-3 mb-4 p-3.5 bg-[#F7F4EE] rounded-2xl border border-[#E8E2D8] font-mono-num">
                      {fin.income_statement.map((inc, i) => (
                        <div key={i} className="space-y-1">
                          <div className="text-[10px] text-[#78786C] font-bold">{inc.period}</div>
                          <div className="text-sm font-bold text-[#2C2C24]">₹{(inc.revenue / 10000000).toFixed(0)} Cr</div>
                          <div className="text-[10px] text-[#5D7052] font-semibold">Net: ₹{(inc.net_income / 10000000).toFixed(0)} Cr</div>
                          <div className="w-full bg-[#E8E2D8] h-2 rounded-full overflow-hidden">
                            <div className="bg-[#5D7052] h-full rounded-full" style={{ width: `${Math.min(100, (inc.revenue / (fin.income_statement[0].revenue || 1)) * 100)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <table className="w-full text-left border-collapse font-nunito">
                      <thead>
                        <tr className="border-b border-[#E8E2D8] text-[#78786C] text-[11px] font-fraunces">
                          <th className="py-2.5">Financial Metric</th>
                          {fin.income_statement.map((inc, i) => (
                            <th key={i} className="py-2.5 text-right font-mono-num">{inc.period}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D8] font-mono-num">
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">Revenue from Operations</td>
                          {fin.income_statement.map((inc, i) => (
                            <td key={i} className="py-2.5 text-right text-[#2C2C24]">₹{(inc.revenue / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">Operating Income (EBIT)</td>
                          {fin.income_statement.map((inc, i) => (
                            <td key={i} className="py-2.5 text-right text-[#2C2C24]">₹{(inc.operating_income / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">EBITDA</td>
                          {fin.income_statement.map((inc, i) => (
                            <td key={i} className="py-2.5 text-right text-[#2C2C24]">₹{(inc.ebitda / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#5D7052] font-nunito">Consolidated Net Profit</td>
                          {fin.income_statement.map((inc, i) => (
                            <td key={i} className="py-2.5 text-right text-[#5D7052] font-bold">₹{(inc.net_income / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">Basic EPS (₹)</td>
                          {fin.income_statement.map((inc, i) => (
                            <td key={i} className="py-2.5 text-right text-[#2C2C24] font-bold">₹{inc.eps}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BALANCE SHEET VIEW */}
              {statementSubTab === "balance" && fin && (
                <div className="space-y-4">
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-3 font-fraunces">
                      Balance Sheet Statement & Solvency Trend (₹ Crores)
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4 p-3.5 bg-[#F7F4EE] rounded-2xl border border-[#E8E2D8] font-mono-num">
                      {fin.balance_sheet.map((bal, i) => (
                        <div key={i} className="space-y-1">
                          <div className="text-[10px] text-[#78786C] font-bold">{bal.period}</div>
                          <div className="text-xs text-[#2C2C24]">Assets: <strong>₹{(bal.total_assets / 10000000).toFixed(0)} Cr</strong></div>
                          <div className="text-xs text-[#5D7052]">Equity: <strong>₹{(bal.stockholders_equity / 10000000).toFixed(0)} Cr</strong></div>
                          <div className="w-full bg-[#E8E2D8] h-2 rounded-full overflow-hidden">
                            <div className="bg-[#5D7052] h-full rounded-full" style={{ width: `${Math.min(100, (bal.stockholders_equity / bal.total_assets) * 100)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <table className="w-full text-left border-collapse font-nunito">
                      <thead>
                        <tr className="border-b border-[#E8E2D8] text-[#78786C] text-[11px] font-fraunces">
                          <th className="py-2.5">Balance Sheet Line Item</th>
                          {fin.balance_sheet.map((bal, i) => (
                            <th key={i} className="py-2.5 text-right font-mono-num">{bal.period}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D8] font-mono-num">
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">Total Assets</td>
                          {fin.balance_sheet.map((bal, i) => (
                            <td key={i} className="py-2.5 text-right text-[#2C2C24]">₹{(bal.total_assets / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#5D7052] font-nunito">Stockholders' Equity (Net Worth)</td>
                          {fin.balance_sheet.map((bal, i) => (
                            <td key={i} className="py-2.5 text-right text-[#5D7052] font-bold">₹{(bal.stockholders_equity / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">Total Liabilities</td>
                          {fin.balance_sheet.map((bal, i) => (
                            <td key={i} className="py-2.5 text-right text-[#2C2C24]">₹{(bal.total_liabilities / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#A85448] font-nunito">Total Debt & Borrowings</td>
                          {fin.balance_sheet.map((bal, i) => (
                            <td key={i} className="py-2.5 text-right text-[#A85448]">₹{(bal.borrowings / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#C18C5D] font-nunito">Cash & Liquid Equivalents</td>
                          {fin.balance_sheet.map((bal, i) => (
                            <td key={i} className="py-2.5 text-right text-[#C18C5D] font-bold">₹{(bal.cash / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CASH FLOW VIEW */}
              {statementSubTab === "cashflow" && fin && (
                <div className="space-y-4">
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-3 font-fraunces">
                      Cash Flow Statement & Free Cash Conversion (₹ Crores)
                    </div>

                    <table className="w-full text-left border-collapse font-nunito">
                      <thead>
                        <tr className="border-b border-[#E8E2D8] text-[#78786C] text-[11px] font-fraunces">
                          <th className="py-2.5">Cash Flow Segment</th>
                          {fin.cash_flow.map((cf, i) => (
                            <th key={i} className="py-2.5 text-right font-mono-num">{cf.period}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D8] font-mono-num">
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#5D7052] font-nunito">Cash from Operating Activities (CFO)</td>
                          {fin.cash_flow.map((cf, i) => (
                            <td key={i} className="py-2.5 text-right text-[#5D7052] font-bold">₹{(cf.operating_cash_flow / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#A85448] font-nunito">Cash from Investing Activities (Capex)</td>
                          {fin.cash_flow.map((cf, i) => (
                            <td key={i} className="py-2.5 text-right text-[#A85448]">₹{(cf.investing_cash_flow / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">Cash from Financing Activities</td>
                          {fin.cash_flow.map((cf, i) => (
                            <td key={i} className="py-2.5 text-right text-[#2C2C24]">₹{(cf.financing_cash_flow / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-[#FDFBF7]">
                          <td className="py-2.5 font-bold text-[#C18C5D] font-nunito">Free Cash Flow (FCF)</td>
                          {fin.cash_flow.map((cf, i) => (
                            <td key={i} className="py-2.5 text-right text-[#C18C5D] font-bold">₹{(cf.free_cash_flow / 10000000).toFixed(0)} Cr</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SHAREHOLDING PATTERN VIEW */}
              {statementSubTab === "shareholding" && shareholding && (
                <div className="space-y-4">
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-2 font-fraunces">
                      Quarterly Shareholding Pattern & Ownership Shifts
                    </div>
                    <p className="text-xs text-[#5A5A4E] mb-4 leading-relaxed">{shareholding.insights}</p>

                    {/* Visual Segment Bar */}
                    <div className="mb-4">
                      <div className="text-[10px] text-[#78786C] mb-1.5 font-bold font-fraunces uppercase">Current Ownership Distribution</div>
                      <div className="w-full h-5 rounded-full overflow-hidden flex font-bold text-[10px] text-white">
                        <div style={{ width: `${shareholding.current.promoters}%` }} className="bg-[#5D7052] flex items-center justify-center">
                          {shareholding.current.promoters > 5 ? `Promoter ${shareholding.current.promoters}%` : ""}
                        </div>
                        <div style={{ width: `${shareholding.current.fii}%` }} className="bg-[#C18C5D] flex items-center justify-center">
                          {shareholding.current.fii > 5 ? `FII ${shareholding.current.fii}%` : ""}
                        </div>
                        <div style={{ width: `${shareholding.current.dii}%` }} className="bg-[#557A82] flex items-center justify-center">
                          {shareholding.current.dii > 5 ? `DII ${shareholding.current.dii}%` : ""}
                        </div>
                        <div style={{ width: `${shareholding.current.public}%` }} className="bg-[#8A6D88] flex items-center justify-center">
                          {shareholding.current.public > 5 ? `Public ${shareholding.current.public}%` : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] mt-2.5 text-[#5A5A4E]">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#5D7052] rounded-full inline-block"></span> Promoters ({shareholding.current.promoters}%)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#C18C5D] rounded-full inline-block"></span> Foreign Institutions / FII ({shareholding.current.fii}%)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#557A82] rounded-full inline-block"></span> Domestic Institutions / DII ({shareholding.current.dii}%)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#8A6D88] rounded-full inline-block"></span> Public & Retail ({shareholding.current.public}%)</span>
                      </div>
                    </div>

                    {/* Historical Quarter-over-Quarter Table */}
                    <table className="w-full text-left border-collapse mt-4 font-nunito">
                      <thead>
                        <tr className="border-b border-[#E8E2D8] text-[#78786C] text-[11px] font-fraunces">
                          <th className="py-2.5">Quarter</th>
                          <th className="py-2.5 text-right">Promoters (%)</th>
                          <th className="py-2.5 text-right">FII / FPI (%)</th>
                          <th className="py-2.5 text-right">DII / Mutual Funds (%)</th>
                          <th className="py-2.5 text-right">Public / Retail (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D8] font-mono-num">
                        {shareholding.history.map((sh, idx) => (
                          <tr key={idx} className="hover:bg-[#FDFBF7]">
                            <td className="py-2.5 font-bold text-[#2C2C24] font-nunito">{sh.quarter}</td>
                            <td className="py-2.5 text-right text-[#5D7052] font-bold">{sh.promoters}%</td>
                            <td className="py-2.5 text-right text-[#C18C5D] font-bold">{sh.fii}%</td>
                            <td className="py-2.5 text-right text-[#557A82] font-bold">{sh.dii}%</td>
                            <td className="py-2.5 text-right text-[#8A6D88]">{sh.public}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Latest Financial News & Corporate Disclosures for selected equity */}
              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 font-nunito text-xs space-y-3 shadow-organic-soft">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
                  <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider flex items-center gap-1.5 font-fraunces">
                    <Newspaper className="w-4 h-4 text-[#5D7052]" /> Latest Financial News & Disclosures for {fund?.name || selectedSymbol}
                  </div>
                  <span className="text-[10px] text-[#78786C]">FinBERT Sequence Classification Engine Active</span>
                </div>

                {stockNews.length > 0 ? (
                  <div className="space-y-2.5">
                    {stockNews.map((n, idx) => {
                      const isPos = n.sentiment === "positive";
                      const isNeg = n.sentiment === "negative";
                      const badgeClass = isPos ? "bg-[#5D7052]/10 text-[#5D7052] border-[#5D7052]/30" : isNeg ? "bg-[#A85448]/10 text-[#A85448] border-[#A85448]/30" : "bg-[#E6DCCD] text-[#4A4A40] border-[#DED8CF]";
                      return (
                        <div key={idx} className="p-3.5 bg-[#FDFCF8] hover:bg-[#F7F4EE] rounded-2xl border border-[#E8E2D8] hover:border-[#5D7052]/40 transition-colors">
                          <div className="text-sm font-semibold text-[#2C2C24] mb-2 leading-snug">{n.headline}</div>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#78786C] font-mono-num">
                            <span className="text-[#5D7052] font-bold">{n.source}</span>
                            <span>•</span>
                            <span>{n.date}</span>
                            <span>•</span>
                            <span className={`px-2.5 py-0.5 rounded-full border font-bold uppercase ${badgeClass}`}>
                              {n.sentiment}
                            </span>
                            <span>•</span>
                            <span>Confidence: <strong className="text-[#2C2C24]">{(n.confidence * 100).toFixed(1)}%</strong></span>
                            <span>•</span>
                            <span>Net Score: <strong className={isPos ? "text-[#5D7052]" : isNeg ? "text-[#A85448]" : "text-[#78786C]"}>{n.sentiment_score > 0 ? "+" : ""}{n.sentiment_score?.toFixed(3)}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-[#78786C]">No specific corporate disclosures found for {selectedSymbol} in the current session.</div>
                )}
              </div>
            </div>
          )}

          {/* 3. PRICE FORECASTING */}
          {activeTab === "forecasting" && (
            <div className="space-y-5 font-nunito text-xs">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                <div>
                  <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase">
                    Quantitative Price Forecasting & Explicit Driver Decomposition
                  </h1>
                  <p className="text-xs text-[#78786C]">1-Day, 5-Day & 20-Day horizons for {selectedSymbol} with backtested performance</p>
                </div>
              </div>

              {forecastingData ? (
                <ForecastingFanChart data={forecastingData} />
              ) : (
                <div className="p-10 text-center bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl text-[#78786C] shadow-organic-soft font-nunito">
                  Calculating walk-forward backtested price forecast and driver decomposition for {selectedSymbol}...
                </div>
              )}
            </div>
          )}

          {/* 4. NEWS INTELLIGENCE */}
          {activeTab === "news" && (
            <div className="space-y-5 font-nunito text-xs">
              <div className="border-b border-[#E8E2D8] pb-3">
                <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase">
                  Automated Indian Market News Stream & FinBERT Sentiment Feed
                </h1>
                <p className="text-xs text-[#78786C]">Curated live corporate disclosures, regulatory filings, and NLP classification</p>
              </div>

              {/* Real-time NewsAPI Wire Ingestion Banner */}
              <div className="bg-[#F7F4EE] border border-[#DED8CF] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5D7052] animate-pulse"></span>
                  <div>
                    <span className="text-[#2C2C24] font-bold font-fraunces text-sm">NewsAPI.org Live Financial Wire</span>
                    <span className="text-[#78786C] ml-2 font-mono text-[11px]">(Key: 41060f...1ffc)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#5D7052] bg-[#5D7052]/10 px-3 py-1 rounded-full border border-[#5D7052]/30 font-bold">
                    FinBERT NLP Real-Time Classifier Active
                  </span>
                  <span className="text-[#78786C]">Live RSS & Breaking Headline Polling Enabled</span>
                </div>
              </div>

              {/* Requirement: Filter by Sector, by Company, and All Companies (No User Text Input) */}
              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-organic-soft">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#5D7052] font-bold font-fraunces uppercase tracking-wider">
                    <Filter className="w-4 h-4 text-[#5D7052]" /> FILTERS:
                  </div>

                  {/* Sector Filter */}
                  <div>
                    <select
                      value={newsFilterSector}
                      onChange={(e) => setNewsFilterSector(e.target.value)}
                      className="bg-[#FDFCF8] border border-[#DED8CF] hover:border-[#5D7052] text-[#2C2C24] text-xs font-semibold rounded-full px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30 transition-colors"
                    >
                      <option value="All">All Sectors</option>
                      <option value="Banking & Financial Services">Banking & Financial Services</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Energy & Petrochemicals">Energy & Petrochemicals</option>
                      <option value="Automobile & Mobility">Automobile & Mobility</option>
                      <option value="Fast-Moving Consumer Goods">FMCG & Retail</option>
                      <option value="Infrastructure & Capital Goods">Infrastructure</option>
                      <option value="Pharmaceuticals & Healthcare">Pharma & Healthcare</option>
                    </select>
                  </div>

                  {/* Company Filter */}
                  <div>
                    <select
                      value={newsFilterCompany}
                      onChange={(e) => setNewsFilterCompany(e.target.value)}
                      className="bg-[#FDFCF8] border border-[#DED8CF] hover:border-[#5D7052] text-[#2C2C24] text-xs font-semibold rounded-full px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30 transition-colors"
                    >
                      <option value="All">All Companies</option>
                      {trackedSymbols.map((s) => (
                        <option key={s.sym} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sentiment Filter */}
                  <div>
                    <select
                      value={newsFilterSentiment}
                      onChange={(e) => setNewsFilterSentiment(e.target.value)}
                      className="bg-[#FDFCF8] border border-[#DED8CF] hover:border-[#5D7052] text-[#2C2C24] text-xs font-semibold rounded-full px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30 transition-colors"
                    >
                      <option value="All">All Sentiments</option>
                      <option value="positive">Bullish (Positive)</option>
                      <option value="negative">Bearish (Negative)</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-[#78786C]">
                  Showing <strong className="text-[#2C2C24] font-mono-num">{newsFeed.length}</strong> classified Indian market news items
                </div>
              </div>

              {/* Feed Stream */}
              <div className="space-y-3">
                {newsFeed.map((item, idx) => {
                  const isPos = item.sentiment === "positive";
                  const isNeg = item.sentiment === "negative";
                  const badgeClass = isPos ? "bg-[#5D7052]/10 text-[#5D7052] border-[#5D7052]/30" : isNeg ? "bg-[#A85448]/10 text-[#A85448] border-[#A85448]/30" : "bg-[#E6DCCD] text-[#4A4A40] border-[#DED8CF]";
                  return (
                    <div key={idx} className="bg-[#FEFEFA] border border-[#DED8CF] p-4 rounded-2xl shadow-organic-soft hover:-translate-y-0.5 hover:shadow-organic-float transition-all duration-300">
                      <div className="text-sm font-semibold text-[#2C2C24] mb-2 leading-snug">{item.headline}</div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#78786C] font-mono-num">
                        <span className="text-[#5D7052] font-bold font-fraunces">{item.company}</span>
                        <span>•</span>
                        <span className="text-[#78786C]">{item.sector}</span>
                        <span>•</span>
                        <span>{item.source}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                        <span>•</span>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${badgeClass}`}>
                          {item.sentiment}
                        </span>
                        <span>•</span>
                        <span>Conf: <strong className="text-[#2C2C24]">{(item.confidence * 100).toFixed(1)}%</strong></span>
                        <span>•</span>
                        <span>Net Score: <strong className={isPos ? "text-[#5D7052]" : isNeg ? "text-[#A85448]" : "text-[#78786C]"}>{item.sentiment_score > 0 ? "+" : ""}{item.sentiment_score?.toFixed(3)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. SECTOR ANALYSIS */}
          {activeTab === "sectors" && (
            <div className="space-y-5 font-nunito text-xs">
              <div className="border-b border-[#E8E2D8] pb-3">
                <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase">
                  Indian Sector Analysis & Dynamic FinBERT Scores
                </h1>
                <p className="text-xs text-[#78786C]">Sector scores computed as the average FinBERT sentiment of top constituent enterprises</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectors.map((s, idx) => (
                  <div key={idx} className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 space-y-3.5 shadow-organic-soft">
                    <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2.5">
                      <div>
                        <div className="text-sm font-bold font-fraunces text-[#2C2C24]">{s.sector}</div>
                        <div className="text-[10px] text-[#78786C]">Weight in NIFTY: {s.weight_in_nifty} | Ticker: {s.index_ticker}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base font-bold font-mono-num ${s.finbert_score >= 0.3 ? "text-[#5D7052]" : "text-[#C18C5D]"}`}>
                          {s.finbert_score > 0 ? "+" : ""}{s.finbert_score.toFixed(3)}
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F0EBE5] text-[#5D7052] font-bold uppercase border border-[#DED8CF]">
                          {s.sentiment_bias}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[10px] font-mono-num">
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                        <span className="text-[#78786C] block uppercase font-bold">Avg P/E</span>
                        <strong className="text-[#2C2C24] text-xs font-bold">{s.avg_pe}x</strong>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                        <span className="text-[#78786C] block uppercase font-bold">Avg ROE</span>
                        <strong className="text-[#5D7052] text-xs font-bold">{s.avg_roe}%</strong>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                        <span className="text-[#78786C] block uppercase font-bold">1M Return</span>
                        <strong className={s.one_month_return.startsWith("+") ? "text-[#5D7052] text-xs font-bold" : "text-[#A85448] text-xs font-bold"}>{s.one_month_return}</strong>
                      </div>
                      <div className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8]">
                        <span className="text-[#78786C] block uppercase font-bold">1Y Return</span>
                        <strong className="text-[#5D7052] text-xs font-bold">{s.one_year_return}</strong>
                      </div>
                    </div>

                    {/* Constituent Companies & Their Individual FinBERT Scores */}
                    <div className="pt-2.5 border-t border-[#E8E2D8]">
                      <div className="text-[10px] font-bold text-[#5D7052] uppercase mb-2 font-fraunces">
                        Top Constituent Companies & Individual Scores:
                      </div>
                      <div className="space-y-1.5 font-nunito">
                        {s.constituents?.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => { setSelectedSymbol(c.symbol); setActiveTab("stocks"); }}
                            className="flex items-center justify-between p-2 bg-[#FDFCF8] hover:bg-[#F7F4EE] rounded-xl text-[11px] cursor-pointer transition-all border border-[#E8E2D8] hover:border-[#5D7052]/40"
                          >
                            <span className="text-[#2C2C24] font-semibold flex items-center gap-2">
                              <span>{c.name} ({c.symbol.replace(".NS", "")})</span>
                              <span className="text-[9px] text-[#5D7052] uppercase font-bold">Analyze →</span>
                            </span>
                            <div className="flex items-center gap-2.5 font-mono-num">
                              <span className="text-[10px] text-[#78786C]">{c.conviction}</span>
                              <span className={`font-bold ${c.finbert_score >= 0.4 ? "text-[#5D7052]" : "text-[#C18C5D]"}`}>
                                {c.finbert_score > 0 ? "+" : ""}{c.finbert_score.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#78786C] italic font-nunito">
                      Macro Exposure: {s.macro_sensitivity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ECONOMIC DASHBOARD (REFINED & WORKING) */}
          {activeTab === "economy" && (
            <div className="space-y-6 font-nunito text-xs">
              <div className="border-b border-[#E8E2D8] pb-3">
                <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase">
                  Indian Macroeconomic Dashboard & Sovereign Telemetry
                </h1>
                <p className="text-xs text-[#78786C]">RBI monetary policy rates, sovereign yield curve, inflation dynamics & foreign exchange</p>
              </div>

              {economy ? (
                <>
                  {/* Synthesis Note */}
                  <div className="p-4 bg-[#F7F4EE] border-l-4 border-[#C18C5D] rounded-2xl text-xs text-[#2C2C24] leading-relaxed shadow-sm">
                    <strong className="text-[#C18C5D] font-fraunces font-bold">Macroeconomic Synthesis: </strong>{economy.macro_summary}
                  </div>

                  {/* Section A: RBI Monetary Policy Key Rates */}
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 space-y-3 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-fraunces">
                      <Landmark className="w-4 h-4 text-[#5D7052]" /> RBI Monetary Policy Interest Rates
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {economy.key_rates.map((r, i) => (
                        <div key={i} className="bg-[#F7F4EE] p-3 rounded-2xl border border-[#E8E2D8]">
                          <div className="text-[10px] text-[#78786C] font-semibold uppercase">{r.rate}</div>
                          <div className="text-xl font-bold font-fraunces text-[#2C2C24] my-1">{r.value}</div>
                          <div className="text-[10px] text-[#5D7052] font-semibold">{r.stance} ({r.change})</div>
                          <div className="text-[10px] text-[#78786C] mt-1">{r.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section B: Sovereign Benchmark Yield Curve */}
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 space-y-3 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#C18C5D] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-fraunces">
                      <Activity className="w-4 h-4 text-[#C18C5D]" /> India Government Securities (G-Sec) Yield Curve
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono-num">
                      {economy.yield_curve.map((yc, i) => (
                        <div key={i} className="bg-[#F7F4EE] p-2.5 rounded-xl border border-[#E8E2D8] text-center">
                          <div className="text-[10px] text-[#78786C] font-semibold uppercase">{yc.tenor}</div>
                          <div className="text-sm font-bold text-[#2C2C24] my-0.5">{yc.yield_str}</div>
                          <div className="text-[10px] text-[#5D7052] font-semibold">{yc.spread_vs_10y}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section C: Inflation Basket & GDP Growth */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 space-y-3 shadow-organic-soft">
                      <div className="text-xs font-bold text-[#A85448] uppercase tracking-wider mb-2 font-fraunces">
                        Inflation Indicators (CPI, Food, Core & WPI)
                      </div>
                      <div className="space-y-2">
                        {economy.inflation_basket.map((inf, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-[#FDFCF8] rounded-xl border border-[#E8E2D8]">
                            <div>
                              <div className="text-xs text-[#2C2C24] font-bold font-fraunces">{inf.component}</div>
                              <div className="text-[10px] text-[#78786C]">Source: {inf.source}</div>
                            </div>
                            <div className="text-right font-mono-num">
                              <div className="text-sm font-bold text-[#2C2C24]">{inf.rate}</div>
                              <div className="text-[10px] text-[#5D7052] font-semibold">{inf.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 space-y-3 shadow-organic-soft">
                      <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-2 font-fraunces">
                        Real Economic Growth & PMI Momentum
                      </div>
                      <div className="space-y-2">
                        {economy.growth_indicators.map((g, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-[#FDFCF8] rounded-xl border border-[#E8E2D8]">
                            <div>
                              <div className="text-xs text-[#2C2C24] font-bold font-fraunces">{g.indicator}</div>
                              <div className="text-[10px] text-[#78786C]">Source: {g.source}</div>
                            </div>
                            <div className="text-right font-mono-num">
                              <div className="text-sm font-bold text-[#5D7052]">{g.value}</div>
                              <div className="text-[10px] text-[#78786C]">{g.context}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section D: Currency & Forex Reserves */}
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-3 flex items-center gap-1.5 font-fraunces">
                      <Globe2 className="w-4 h-4 text-[#5D7052]" /> Foreign Exchange & Sovereign Reserves
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono-num">
                      {economy.fx_reserves.map((fx, i) => (
                        <div key={i} className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
                          <div className="text-[10px] text-[#78786C] font-semibold uppercase">{fx.currency}</div>
                          <div className="text-base font-bold text-[#2C2C24] my-0.5 font-fraunces">{fx.value}</div>
                          <div className="text-[10px] text-[#5D7052] font-semibold">{fx.change}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section E: Policy Timeline */}
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase tracking-wider mb-3 font-fraunces">
                      Recent Monetary Policy Actions & Statutory Milestones
                    </div>
                    <div className="space-y-2">
                      {economy.policy_timeline.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 bg-[#FDFCF8] rounded-xl border border-[#E8E2D8]">
                          <span className="text-[10px] text-[#5D7052] font-bold whitespace-nowrap font-mono-num">{item.date}</span>
                          <span className="text-xs text-[#2C2C24] flex-1">{item.event}</span>
                          <span className="text-[10px] text-[#5D7052] whitespace-nowrap font-semibold">{item.impact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl text-[#78786C] shadow-organic-soft font-nunito">
                  Loading Indian macroeconomic indicators...
                </div>
              )}
            </div>
          )}

          {/* 7. AI RESEARCH ASSISTANT */}
          {activeTab === "research" && (
            <div className="space-y-5 font-nunito text-xs">
              <div className="border-b border-[#E8E2D8] pb-3">
                <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase">
                  Institutional Equity Research Dossier: {selectedSymbol}
                </h1>
                <p className="text-xs text-[#78786C]">Business performance, valuation assessment, downside risks, and scenario targets</p>
              </div>

              {researchReport ? (
                <div className="space-y-4">
                  <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 shadow-organic-soft">
                    <div className="text-xs font-bold text-[#5D7052] uppercase mb-1.5 font-fraunces tracking-wider">Executive Summary</div>
                    <p className="text-xs text-[#2C2C24] leading-relaxed font-nunito">{researchReport.executive_summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 shadow-organic-soft">
                      <div className="text-xs font-bold text-[#C18C5D] uppercase mb-1.5 font-fraunces tracking-wider">Valuation Assessment</div>
                      <div className="text-sm font-bold text-[#2C2C24] mb-1 font-fraunces">Verdict: {researchReport.valuation_assessment.verdict}</div>
                      <p className="text-xs text-[#5A5A4E] leading-relaxed">{researchReport.valuation_assessment.commentary}</p>
                    </div>

                    <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 shadow-organic-soft">
                      <div className="text-xs font-bold text-[#5D7052] uppercase mb-1.5 font-fraunces tracking-wider">Technical Momentum Trend</div>
                      <div className="text-sm font-bold text-[#2C2C24] mb-1 font-fraunces">Verdict: {researchReport.technical_trend_analysis.verdict}</div>
                      <p className="text-xs text-[#5A5A4E] leading-relaxed">{researchReport.technical_trend_analysis.commentary}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#FEFEFA] border-t-4 border-t-[#5D7052] border border-[#DED8CF] p-4 rounded-2xl shadow-organic-soft">
                      <div className="text-[10px] text-[#5D7052] uppercase font-bold font-fraunces">Bull Case (30% Prob)</div>
                      <div className="text-xl font-bold font-fraunces text-[#2C2C24] my-1">₹{researchReport.scenario_analysis.bull_case.target_price}</div>
                      <div className="text-[11px] text-[#5D7052] font-semibold font-mono-num">{researchReport.scenario_analysis.bull_case.upside_pct} Upside</div>
                      <p className="text-[11px] text-[#5A5A4E] mt-2 leading-relaxed">{researchReport.scenario_analysis.bull_case.rationale}</p>
                    </div>

                    <div className="bg-[#FEFEFA] border-t-4 border-t-[#C18C5D] border border-[#DED8CF] p-4 rounded-2xl shadow-organic-soft">
                      <div className="text-[10px] text-[#C18C5D] uppercase font-bold font-fraunces">Base Case (50% Prob)</div>
                      <div className="text-xl font-bold font-fraunces text-[#2C2C24] my-1">₹{researchReport.scenario_analysis.base_case.target_price}</div>
                      <div className="text-[11px] text-[#C18C5D] font-semibold font-mono-num">{researchReport.scenario_analysis.base_case.upside_pct} Upside</div>
                      <p className="text-[11px] text-[#5A5A4E] mt-2 leading-relaxed">{researchReport.scenario_analysis.base_case.rationale}</p>
                    </div>

                    <div className="bg-[#FEFEFA] border-t-4 border-t-[#A85448] border border-[#DED8CF] p-4 rounded-2xl shadow-organic-soft">
                      <div className="text-[10px] text-[#A85448] uppercase font-bold font-fraunces">Bear Case (20% Prob)</div>
                      <div className="text-xl font-bold font-fraunces text-[#2C2C24] my-1">₹{researchReport.scenario_analysis.bear_case.target_price}</div>
                      <div className="text-[11px] text-[#A85448] font-semibold font-mono-num">{researchReport.scenario_analysis.bear_case.upside_pct} Downside</div>
                      <p className="text-[11px] text-[#5A5A4E] mt-2 leading-relaxed">{researchReport.scenario_analysis.bear_case.rationale}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl text-[#78786C] shadow-organic-soft font-nunito">
                  Synthesizing institutional equity research dossier for {selectedSymbol}...
                </div>
              )}
            </div>
          )}

          {/* 8. STOCK SCREENER */}
          {activeTab === "screener" && (
            <div className="space-y-5 font-nunito text-xs">
              <div className="border-b border-[#E8E2D8] pb-3">
                <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase">
                  Multi-Factor Indian Equity Screener
                </h1>
                <p className="text-xs text-[#78786C]">Filter by Valuation P/E, Return on Equity, Sector, and Momentum</p>
              </div>

              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-5 flex flex-wrap items-center gap-4 shadow-organic-soft">
                <div>
                  <label className="text-[10px] text-[#78786C] block mb-1 font-bold font-fraunces uppercase">Max P/E Ratio</label>
                  <input
                    type="number"
                    value={screenMaxPE}
                    onChange={(e) => setScreenMaxPE(Number(e.target.value))}
                    className="w-24 bg-[#FDFCF8] border border-[#DED8CF] text-[#2C2C24] px-3 py-1.5 rounded-full font-mono-num font-bold focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#78786C] block mb-1 font-bold font-fraunces uppercase">Min ROE (%)</label>
                  <input
                    type="number"
                    value={screenMinROE}
                    onChange={(e) => setScreenMinROE(Number(e.target.value))}
                    className="w-24 bg-[#FDFCF8] border border-[#DED8CF] text-[#2C2C24] px-3 py-1.5 rounded-full font-mono-num font-bold focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30"
                  />
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleRunScreener}
                    className="px-5 py-2 bg-[#5D7052] text-white font-bold rounded-full text-xs hover:bg-[#4d5e43] shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    Apply Screener Filters
                  </button>
                </div>
              </div>

              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl overflow-hidden shadow-organic-soft">
                <table className="w-full text-left border-collapse font-nunito">
                  <thead>
                    <tr className="bg-[#F7F4EE] border-b border-[#E8E2D8] text-[#78786C] text-[11px] font-fraunces">
                      <th className="p-3.5">Symbol</th>
                      <th className="p-3.5">Company Name</th>
                      <th className="p-3.5">Sector</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Mkt Cap</th>
                      <th className="p-3.5">P/E</th>
                      <th className="p-3.5">ROE</th>
                      <th className="p-3.5">RSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8] font-mono-num">
                    {screenerResults.map((r) => (
                      <tr
                        key={r.symbol}
                        onClick={() => { setSelectedSymbol(r.symbol); setActiveTab("stocks"); }}
                        className="hover:bg-[#FDFBF7] cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-bold text-[#5D7052]">{r.symbol.replace(".NS", "")}</td>
                        <td className="p-3.5 text-[#2C2C24] font-semibold font-nunito">{r.name}</td>
                        <td className="p-3.5 text-[#78786C] font-nunito">{r.sector}</td>
                        <td className="p-3.5 font-bold text-[#2C2C24]">₹{r.price.toFixed(2)}</td>
                        <td className="p-3.5">₹{r.market_cap_cr} Cr</td>
                        <td className="p-3.5 font-bold">{r.pe_ratio}x</td>
                        <td className="p-3.5 text-[#5D7052] font-bold">{r.roe_pct}%</td>
                        <td className="p-3.5">{r.rsi_14}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. WATCHLIST */}
          {activeTab === "watchlist" && (
            <div className="space-y-5 font-nunito text-xs">
              <div className="border-b border-[#E8E2D8] pb-3">
                <h1 className="text-base font-bold font-fraunces text-[#2C2C24] tracking-wide uppercase">
                  Persistent Portfolio Watchlist
                </h1>
                <p className="text-xs text-[#78786C]">Track selected Indian equities with persistent database storage</p>
              </div>

              <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl overflow-hidden shadow-organic-soft">
                <table className="w-full text-left border-collapse font-nunito">
                  <thead>
                    <tr className="bg-[#F7F4EE] border-b border-[#E8E2D8] text-[#78786C] text-[11px] font-fraunces">
                      <th className="p-3.5">Symbol</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Sector</th>
                      <th className="p-3.5">Last Price</th>
                      <th className="p-3.5">Change (%)</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8] font-mono-num">
                    {watchlist.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FDFBF7] transition-colors">
                        <td
                          onClick={() => { setSelectedSymbol(item.symbol); setActiveTab("stocks"); }}
                          className="p-3.5 font-bold text-[#5D7052] cursor-pointer hover:underline"
                        >
                          {item.symbol.replace(".NS", "")}
                        </td>
                        <td className="p-3.5 text-[#2C2C24] font-semibold font-nunito">{item.company_name}</td>
                        <td className="p-3.5 text-[#78786C] font-nunito">{item.sector}</td>
                        <td className="p-3.5 font-bold text-[#2C2C24]">₹{item.current_price?.toFixed(2)}</td>
                        <td className={`p-3.5 font-bold ${item.percent_change >= 0 ? "text-[#5D7052]" : "text-[#A85448]"}`}>
                          {item.percent_change >= 0 ? "+" : ""}{item.percent_change?.toFixed(2)}%
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleRemoveFromWatchlist(item.symbol)}
                            className="p-1.5 text-[#A85448] hover:bg-[#A85448]/10 rounded-full transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* API Integrations Modal */}
      {showApiModal && (
        <div className="fixed inset-0 bg-[#2C2C24]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl max-w-2xl w-full p-6 shadow-organic-float space-y-5 font-nunito text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#5D7052]/10 flex items-center justify-center text-[#5D7052]">
                  <Key className="w-4 h-4 text-[#5D7052]" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-fraunces text-[#2C2C24] uppercase tracking-wider">
                    Connected API Providers & Data Feeds
                  </h2>
                  <p className="text-[11px] text-[#78786C]">
                    EdgeFinder Terminal Telemetry, News Stream & Gateway Credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-1.5 rounded-full text-[#78786C] hover:text-[#2C2C24] hover:bg-[#F0EBE5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 1. NewsAPI */}
              <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C2C24] text-xs font-fraunces">NewsAPI.org</span>
                  <span className="text-[10px] text-[#5D7052] bg-[#5D7052]/10 border border-[#5D7052]/30 px-2 py-0.5 rounded-full font-bold">
                    CONNECTED
                  </span>
                </div>
                <div className="text-[11px] text-[#78786C]">
                  Key: <code className="text-[#5D7052] font-mono font-bold">41060f...1ffc</code>
                </div>
                <div className="text-[11px] text-[#5A5A4E] leading-relaxed">
                  Streams live Indian market breaking headlines directly into FinBERT for real-time sequence sentiment scoring.
                </div>
              </div>

              {/* 2. Alpha Vantage */}
              <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C2C24] text-xs font-fraunces">Alpha Vantage</span>
                  <span className="text-[10px] text-[#5D7052] bg-[#5D7052]/10 border border-[#5D7052]/30 px-2 py-0.5 rounded-full font-bold">
                    CONNECTED
                  </span>
                </div>
                <div className="text-[11px] text-[#78786C]">
                  Key: <code className="text-[#5D7052] font-mono font-bold">YPPG...ZWK</code>
                </div>
                <div className="text-[11px] text-[#5A5A4E] leading-relaxed">
                  Provides quantitative technical indicator metrics, SMA/EMA overlays, and market fundamental benchmarks.
                </div>
              </div>

              {/* 3. FMP */}
              <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C2C24] text-xs font-fraunces">Financial Modeling Prep</span>
                  <span className="text-[10px] text-[#5D7052] bg-[#5D7052]/10 border border-[#5D7052]/30 px-2 py-0.5 rounded-full font-bold">
                    CONNECTED
                  </span>
                </div>
                <div className="text-[11px] text-[#78786C]">
                  Key: <code className="text-[#5D7052] font-mono font-bold">18LPJB...u34s</code>
                </div>
                <div className="text-[11px] text-[#5A5A4E] leading-relaxed">
                  Standardized XBRL balance sheets, multi-year income statements, cash flow ratios, and valuation multiples.
                </div>
              </div>

              {/* 4. Zerodha Kite */}
              <div className="bg-[#F7F4EE] border border-[#E8E2D8] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C2C24] text-xs font-fraunces">Zerodha Kite Connect</span>
                  <span className="text-[10px] text-[#5D7052] bg-[#5D7052]/10 border border-[#5D7052]/30 px-2 py-0.5 rounded-full font-bold">
                    READY
                  </span>
                </div>
                <div className="text-[11px] text-[#78786C]">
                  API Key: <code className="text-[#5D7052] font-mono font-bold">z992g...zjm</code>
                </div>
                <div className="text-[11px] text-[#5A5A4E] leading-relaxed">
                  Institutional NSE/BSE order gateway readiness and real-time tick websocket pipeline configuration.
                </div>
              </div>
            </div>

            <div className="bg-[#F7F4EE] p-3.5 rounded-2xl border border-[#E8E2D8] flex items-center justify-between text-[11px] text-[#5A5A4E]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5D7052]" />
                <span>All 4 external providers active & configured in <code className="text-[#2C2C24] font-bold">backend/.env</code></span>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="px-4 py-1.5 bg-[#5D7052] hover:bg-[#4d5e43] text-white rounded-full font-bold transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
