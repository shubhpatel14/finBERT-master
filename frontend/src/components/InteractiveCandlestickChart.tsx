"use client";

import React, { useState, useMemo } from "react";
import { Candle } from "@/lib/api";

interface ChartProps {
  candles: Candle[];
  symbol: string;
  selectedPeriod: string;
  onPeriodChange: (p: string) => void;
}

export function InteractiveCandlestickChart({ candles, symbol, selectedPeriod, onPeriodChange }: ChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);

  const periods = ["1mo", "3mo", "6mo", "1y", "2y"];

  // Slice or downsample candles if too dense
  const displayCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    // Max 140 candles for optimal crisp rendering
    if (candles.length > 140) {
      return candles.slice(candles.length - 140);
    }
    return candles;
  }, [candles]);

  const activeCandle = hoverIdx !== null && displayCandles[hoverIdx] ? displayCandles[hoverIdx] : displayCandles[displayCandles.length - 1];

  // SVG Dimension Calculations
  const chartWidth = 900;
  const mainHeight = 320;
  const volHeight = 70;
  const rsiHeight = showRSI ? 85 : 0;
  const macdHeight = showMACD ? 85 : 0;
  const totalHeight = mainHeight + volHeight + rsiHeight + macdHeight + 30;

  const count = displayCandles.length;

  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (count === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 1 };
    let minP = Infinity;
    let maxP = -Infinity;
    let maxV = 0;

    displayCandles.forEach((c) => {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
      if (c.volume > maxV) maxV = c.volume;
      if (c.bb_lower && c.bb_lower < minP) minP = c.bb_lower;
      if (c.bb_upper && c.bb_upper > maxP) maxP = c.bb_upper;
    });

    const padding = (maxP - minP) * 0.05;
    return {
      minPrice: minP - padding,
      maxPrice: maxP + padding,
      maxVolume: maxV || 1
    };
  }, [displayCandles, count]);

  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => {
    return mainHeight - ((price - minPrice) / priceRange) * (mainHeight - 20) - 10;
  };

  const candleWidth = Math.max(2, Math.min(10, (chartWidth - 80) / count - 2));

  return (
    <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-3xl p-4 font-mono-num text-xs shadow-organic-soft">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DED8CF]/70 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-fraunces text-base font-bold text-[#2C2C24] tracking-wider">{symbol}</span>
          {activeCandle && (
            <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
              <span className="text-[#78786C]">O: <strong className="text-[#2C2C24]">₹{activeCandle.open?.toFixed(2)}</strong></span>
              <span className="text-[#78786C]">H: <strong className="text-[#2C2C24]">₹{activeCandle.high?.toFixed(2)}</strong></span>
              <span className="text-[#78786C]">L: <strong className="text-[#2C2C24]">₹{activeCandle.low?.toFixed(2)}</strong></span>
              <span className="text-[#78786C]">C: <strong className={activeCandle.close >= activeCandle.open ? "text-[#5D7052]" : "text-[#A85448]"}>₹{activeCandle.close?.toFixed(2)}</strong></span>
              <span className="text-[#78786C]">Vol: <strong className="text-[#2C2C24]">{(activeCandle.volume / 1000).toFixed(0)}k</strong></span>
              <span className="text-[#78786C] bg-[#F7F4EE] px-2 py-0.5 rounded-full border border-[#DED8CF]/50">[{activeCandle.date}]</span>
            </div>
          )}
        </div>

        {/* Timeframe & Overlays */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#F7F4EE] rounded-full border border-[#DED8CF] p-0.5">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold transition-all ${
                  selectedPeriod === p ? "bg-[#5D7052] text-[#F3F4F1] shadow-sm" : "text-[#78786C] hover:text-[#2C2C24]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#DED8CF] text-[10px]">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                showSMA20 ? "border-[#C18C5D] text-[#C18C5D] bg-[rgba(193,140,93,0.12)] font-bold" : "border-[#DED8CF] text-[#78786C] bg-[#F7F4EE]"
              }`}
            >
              SMA 20
            </button>
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                showSMA50 ? "border-[#557A82] text-[#557A82] bg-[rgba(85,122,130,0.12)] font-bold" : "border-[#DED8CF] text-[#78786C] bg-[#F7F4EE]"
              }`}
            >
              SMA 50
            </button>
            <button
              onClick={() => setShowBB(!showBB)}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                showBB ? "border-[#8A6D88] text-[#8A6D88] bg-[rgba(138,109,136,0.12)] font-bold" : "border-[#DED8CF] text-[#78786C] bg-[#F7F4EE]"
              }`}
            >
              BB (20,2)
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                showRSI ? "border-[#5D7052] text-[#5D7052] bg-[rgba(93,112,82,0.12)] font-bold" : "border-[#DED8CF] text-[#78786C] bg-[#F7F4EE]"
              }`}
            >
              RSI (14)
            </button>
          </div>
        </div>
      </div>

      {/* SVG Candlestick Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Main Chart Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const priceVal = minPrice + priceRange * (1 - pct);
            const y = 10 + (mainHeight - 20) * pct;
            return (
              <g key={i}>
                <line x1="10" y1={y} x2={chartWidth - 65} y2={y} stroke="#EFE9DF" strokeDasharray="3 3" />
                <text x={chartWidth - 60} y={y + 3} fill="#78786C" fontSize="9" fontFamily="JetBrains Mono">
                  ₹{priceVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Shaded Area */}
          {showBB && (
            <path
              d={displayCandles
                .map((c, i) => {
                  const x = 30 + i * ((chartWidth - 100) / Math.max(1, count - 1));
                  const y = c.bb_upper ? getY(c.bb_upper) : getY(c.close);
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .concat(
                  displayCandles
                    .slice()
                    .reverse()
                    .map((c, i) => {
                      const origIdx = count - 1 - i;
                      const x = 30 + origIdx * ((chartWidth - 100) / Math.max(1, count - 1));
                      const y = c.bb_lower ? getY(c.bb_lower) : getY(c.close);
                      return `L ${x} ${y}`;
                    })
                )
                .join(" ") + " Z"}
              fill="rgba(193, 140, 93, 0.08)"
            />
          )}

          {/* Candlesticks Rendering */}
          {displayCandles.map((c, i) => {
            const x = 30 + i * ((chartWidth - 100) / Math.max(1, count - 1));
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const isBullish = c.close >= c.open;
            const color = isBullish ? "#5D7052" : "#A85448";
            const topBody = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIdx(i)}
                className="cursor-crosshair"
              >
                {/* Wick */}
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={topBody}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isBullish ? "#5D7052" : "#A85448"}
                  stroke={color}
                  strokeWidth="0.5"
                  rx="1"
                />

                {/* Volume Bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={mainHeight + volHeight - (c.volume / maxVolume) * (volHeight - 10)}
                  width={candleWidth}
                  height={(c.volume / maxVolume) * (volHeight - 10)}
                  fill={isBullish ? "rgba(93, 112, 82, 0.35)" : "rgba(168, 84, 72, 0.35)"}
                  rx="1"
                />
              </g>
            );
          })}

          {/* SMA 20 Overlay Line */}
          {showSMA20 && (
            <path
              d={displayCandles
                .filter((c) => c.sma_20 !== undefined && c.sma_20 !== null)
                .map((c, i) => {
                  const x = 30 + i * ((chartWidth - 100) / Math.max(1, count - 1));
                  const y = getY(c.sma_20!);
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#C18C5D"
              strokeWidth="1.8"
            />
          )}

          {/* SMA 50 Overlay Line */}
          {showSMA50 && (
            <path
              d={displayCandles
                .filter((c) => c.sma_50 !== undefined && c.sma_50 !== null)
                .map((c, i) => {
                  const x = 30 + i * ((chartWidth - 100) / Math.max(1, count - 1));
                  const y = getY(c.sma_50!);
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#557A82"
              strokeWidth="1.8"
            />
          )}

          {/* RSI Panel */}
          {showRSI && (
            <g transform={`translate(0, ${mainHeight + volHeight})`}>
              <line x1="10" y1="0" x2={chartWidth - 10} y2="0" stroke="#DED8CF" />
              <text x="15" y="14" fill="#78786C" fontSize="9" fontWeight="bold">RSI (14)</text>
              {/* Overbought 70 line */}
              <line x1="30" y1="20" x2={chartWidth - 65} y2="20" stroke="#A85448" strokeDasharray="2 2" strokeOpacity="0.5" />
              <text x={chartWidth - 60} y="23" fill="#A85448" fontSize="8" fontWeight="bold">70</text>
              {/* Oversold 30 line */}
              <line x1="30" y1="65" x2={chartWidth - 65} y2="65" stroke="#5D7052" strokeDasharray="2 2" strokeOpacity="0.5" />
              <text x={chartWidth - 60} y="68" fill="#5D7052" fontSize="8" fontWeight="bold">30</text>
              {/* RSI Curve */}
              <path
                d={displayCandles
                  .map((c, i) => {
                    const x = 30 + i * ((chartWidth - 100) / Math.max(1, count - 1));
                    const rsiVal = c.rsi || 50;
                    const y = 85 - (rsiVal / 100) * 75;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#5D7052"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Crosshair Cursor */}
          {hoverIdx !== null && (
            <line
              x1={30 + hoverIdx * ((chartWidth - 100) / Math.max(1, count - 1))}
              y1="0"
              x2={30 + hoverIdx * ((chartWidth - 100) / Math.max(1, count - 1))}
              y2={totalHeight}
              stroke="#C18C5D"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
