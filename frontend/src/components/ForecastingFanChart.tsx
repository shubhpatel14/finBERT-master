"use client";

import React from "react";
import { ForecastingResult } from "@/lib/api";
import { ShieldAlert, Activity, BrainCircuit, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ForecastingProps {
  data: ForecastingResult;
}

export function ForecastingFanChart({ data }: ForecastingProps) {
  const { current_price, horizons, evaluation_metrics, backtest_trajectory, forecast_drivers, detailed_reason, assumptions } = data;

  const points = backtest_trajectory || [];
  const svgWidth = 850;
  const svgHeight = 280;

  let minP = current_price;
  let maxP = current_price;

  points.forEach((p) => {
    if (p.actual < minP) minP = p.actual;
    if (p.actual > maxP) maxP = p.actual;
    if (p.model_forecast < minP) minP = p.model_forecast;
    if (p.model_forecast > maxP) maxP = p.model_forecast;
  });

  horizons.forEach((h) => {
    if (h.lower_95 < minP) minP = h.lower_95;
    if (h.upper_95 > maxP) maxP = h.upper_95;
  });

  const pad = (maxP - minP) * 0.08 || 10;
  const range = maxP - minP + pad * 2;
  const bottom = minP - pad;

  const getY = (val: number) => {
    return svgHeight - ((val - bottom) / range) * (svgHeight - 40) - 20;
  };

  return (
    <div className="space-y-5 font-nunito text-xs">
      {/* Forecast Horizons Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {horizons.map((h, idx) => {
          const isPos = h.expected_return_pct >= 0;
          return (
            <div
              key={idx}
              className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-4 relative overflow-hidden shadow-organic-soft hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C18C5D]"></div>
              <div className="flex items-center justify-between text-[#78786C] mb-2 pl-1">
                <span className="font-fraunces font-bold text-xs uppercase tracking-wider text-[#2C2C24]">{h.horizon}</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0EBE5] text-[#5D7052] border border-[#DED8CF]/60">
                  T+{h.days}d Horizon
                </span>
              </div>
              <div className="text-2xl font-bold font-fraunces text-[#2C2C24] my-1 pl-1">
                ₹{h.point_forecast.toFixed(2)}
              </div>
              <div className="pl-1 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono-num ${
                  isPos ? "bg-[#5D7052]/10 text-[#5D7052] border border-[#5D7052]/20" : "bg-[#A85448]/10 text-[#A85448] border border-[#A85448]/20"
                }`}>
                  {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{isPos ? "+" : ""}{h.expected_return_pct}% Expected</span>
                </span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E8E2D8] text-[10px] text-[#78786C] flex justify-between font-mono-num pl-1">
                <span>95% CI Low: <strong className="text-[#2C2C24]">₹{h.lower_95.toFixed(2)}</strong></span>
                <span>95% CI High: <strong className="text-[#2C2C24]">₹{h.upper_95.toFixed(2)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quantitative Rationale & Driver Decomposition */}
      <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 space-y-4 shadow-organic-soft">
        <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
          <div className="w-8 h-8 rounded-full bg-[#5D7052]/10 flex items-center justify-center text-[#5D7052]">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-fraunces text-[#2C2C24]">
              Quantitative Rationale & Driver Decomposition
            </h4>
            <p className="text-[11px] text-[#78786C]">Explainable AI synthesis of technicals, macro, and FinBERT signals</p>
          </div>
        </div>

        {/* Detailed Narrative Reason */}
        {detailed_reason && (
          <div className="p-4 bg-[#F7F4EE] border-l-4 border-[#C18C5D] rounded-xl text-xs text-[#2C2C24] leading-relaxed shadow-sm">
            <strong className="text-[#C18C5D] font-fraunces font-bold">Model Thesis Synthesis: </strong>{detailed_reason}
          </div>
        )}

        {/* 4 Quantitative Drivers */}
        {forecast_drivers && forecast_drivers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {forecast_drivers.map((drv, i) => (
              <div key={i} className="bg-[#FDFCF8] border border-[#DED8CF] p-3.5 rounded-xl space-y-1.5 hover:border-[#C18C5D]/50 transition-all">
                <div className="flex items-center justify-between text-[10px] text-[#78786C]">
                  <span className="font-bold uppercase tracking-wider">{drv.driver}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    drv.direction === "Bullish"
                      ? "bg-[#5D7052]/10 text-[#5D7052]"
                      : drv.direction === "Bearish"
                      ? "bg-[#A85448]/10 text-[#A85448]"
                      : "bg-[#E6DCCD] text-[#4A4A40]"
                  }`}>
                    {drv.impact}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#2C2C24]">{drv.direction} Bias</div>
                <p className="text-[11px] text-[#5A5A4E] leading-relaxed">{drv.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Out-of-Sample Backtesting Performance Diagnostics */}
      <div className="bg-[#FEFEFA] border border-[#DED8CF] rounded-2xl p-5 shadow-organic-soft">
        <div className="flex flex-wrap items-center justify-between border-b border-[#E8E2D8] pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#5D7052]/10 flex items-center justify-center text-[#5D7052]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold font-fraunces text-sm text-[#2C2C24]">
                Out-of-Sample Walk-Forward Backtesting Evaluation
              </h4>
              <p className="text-[11px] text-[#78786C]">Historical cross-validation against zero-alpha random walk</p>
            </div>
          </div>
          <span className="text-[11px] text-[#78786C] bg-[#F7F4EE] px-3 py-1 rounded-full border border-[#E8E2D8]">
            Test Set: <strong className="text-[#2C2C24] font-mono-num">{evaluation_metrics.test_sample_size}</strong> days | Train Set: <strong className="text-[#2C2C24] font-mono-num">{evaluation_metrics.train_sample_size}</strong> days
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
            <div className="text-[10px] text-[#78786C] uppercase font-bold tracking-wider">Model MAE</div>
            <div className="text-base font-bold font-mono-num text-[#2C2C24] mt-0.5">₹{evaluation_metrics.mae_model}</div>
            <div className="text-[10px] text-[#5D7052] font-semibold">Mean Absolute Error</div>
          </div>
          <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
            <div className="text-[10px] text-[#78786C] uppercase font-bold tracking-wider">Naive Benchmark MAE</div>
            <div className="text-base font-bold font-mono-num text-[#2C2C24] mt-0.5">₹{evaluation_metrics.mae_naive_baseline}</div>
            <div className="text-[10px] text-[#78786C]">Persistence Drift</div>
          </div>
          <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
            <div className="text-[10px] text-[#78786C] uppercase font-bold tracking-wider">Directional Accuracy</div>
            <div className="text-base font-bold font-mono-num text-[#5D7052] mt-0.5">{evaluation_metrics.directional_accuracy_pct}%</div>
            <div className="text-[10px] text-[#78786C]">Sign Agreement Rate</div>
          </div>
          <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E8E2D8]">
            <div className="text-[10px] text-[#78786C] uppercase font-bold tracking-wider">Alpha vs Naive</div>
            <div className="text-base font-bold font-mono-num text-[#C18C5D] mt-0.5">
              {evaluation_metrics.mae_improvement_over_naive_pct > 0 ? "+" : ""}{evaluation_metrics.mae_improvement_over_naive_pct}%
            </div>
            <div className="text-[10px] text-[#78786C]">Error Reduction</div>
          </div>
        </div>

        {/* Backtest SVG Line Chart */}
        <div className="overflow-x-auto bg-[#FDFCF8] p-3 rounded-xl border border-[#E8E2D8]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
            {[0, 0.33, 0.66, 1].map((pct, i) => {
              const y = 20 + (svgHeight - 40) * pct;
              const pVal = bottom + range * (1 - pct);
              return (
                <g key={i}>
                  <line x1="10" y1={y} x2={svgWidth - 65} y2={y} stroke="#E8E2D8" strokeDasharray="3 3" />
                  <text x={svgWidth - 60} y={y + 3} fill="#78786C" fontSize="9" fontFamily="JetBrains Mono">
                    ₹{pVal.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Actual Out-of-Sample Trajectory */}
            <path
              d={points
                .map((p, i) => {
                  const x = 30 + i * ((svgWidth - 100) / Math.max(1, points.length - 1));
                  const y = getY(p.actual);
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#2C2C24"
              strokeWidth="2.5"
            />

            {/* Model Forecast Line */}
            <path
              d={points
                .map((p, i) => {
                  const x = 30 + i * ((svgWidth - 100) / Math.max(1, points.length - 1));
                  const y = getY(p.model_forecast);
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#5D7052"
              strokeWidth="2"
              strokeDasharray="5 3"
            />

            {/* Naive Baseline Line */}
            <path
              d={points
                .map((p, i) => {
                  const x = 30 + i * ((svgWidth - 100) / Math.max(1, points.length - 1));
                  const y = getY(p.naive_baseline);
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#C18C5D"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] mt-3 text-[#78786C]">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-[#2C2C24] rounded-full inline-block"></span> Actual Out-of-Sample Price</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-[#5D7052] rounded-full inline-block"></span> Model Walk-Forward Forecast</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-[#C18C5D] rounded-full inline-block"></span> Naive Persistence Baseline</span>
        </div>
      </div>

      {/* Assumptions & Risk Disclosure Alert */}
      <div className="bg-[#FEFEFA] border-l-4 border-[#C18C5D] border border-[#DED8CF] p-4 rounded-2xl text-[11px] text-[#5A5A4E] space-y-2 shadow-organic-soft">
        <div className="flex items-center gap-2 font-bold font-fraunces text-[#C18C5D] text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-[#C18C5D]" /> Quantitative Modeling Assumptions & Risk Warning
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-[#5A5A4E] pl-1 leading-relaxed">
          {assumptions.map((asm, i) => (
            <li key={i}>{asm}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
