"use client";

import React, { useEffect, useState } from "react";
import { IndexOverview, api } from "@/lib/api";
import { TrendingUp, TrendingDown, Activity, Cpu } from "lucide-react";

export function TickerTape() {
  const [indices, setIndices] = useState<IndexOverview[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const data = await api.getIndices();
        setIndices(data);
      } catch (e) {
        console.error("Indices error:", e);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST");
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#F7F4EE] border-b border-[#DED8CF] px-4 py-2.5 flex items-center justify-between text-xs font-mono-num select-none">
      <div className="flex items-center gap-5 overflow-x-auto py-0.5 scrollbar-none">
        <div className="flex items-center gap-2 pr-3 border-r border-[#DED8CF]">
          <span className="bg-[#5D7052]/10 border border-[#5D7052]/30 px-2.5 py-0.5 rounded-full text-[#5D7052] font-bold tracking-wider flex items-center gap-1.5 text-[11px]">
            <span className="pulse-beacon-natural"></span>
            <span className="font-fraunces text-xs text-[#2C2C24]">EdgeFinder</span>
            <span className="text-[#5D7052] font-semibold text-[10px]">// TERMINAL</span>
          </span>
        </div>

        {indices.length > 0 ? (
          indices.map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div key={idx.name} className="flex items-center gap-2 whitespace-nowrap bg-[#FEFEFA] border border-[#DED8CF]/60 px-2.5 py-1 rounded-full shadow-[0_1px_4px_rgba(74,74,64,0.04)]">
                <span className="text-[#78786C] font-semibold text-[10px]">{idx.name}</span>
                <span className="text-[#2C2C24] font-bold text-xs">{idx.price.toLocaleString("en-IN")}</span>
                <span className={`flex items-center text-[10px] font-extrabold ${isPos ? "text-[#5D7052]" : "text-[#A85448]"}`}>
                  {isPos ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                  {isPos ? "+" : ""}{idx.change.toFixed(2)} ({isPos ? "+" : ""}{idx.percent_change.toFixed(2)}%)
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-[#78786C]">Connecting to market telemetry stream...</div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-3 text-[#5A5A4E] border-l border-[#DED8CF] pl-4">
        <div className="flex items-center gap-1.5 text-[11px] bg-[#5D7052]/10 border border-[#5D7052]/30 px-2 py-0.5 rounded-full">
          <Cpu className="w-3 h-3 text-[#5D7052]" />
          <span className="text-[#5D7052] font-bold">FinBERT Online</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] bg-[#C18C5D]/10 border border-[#C18C5D]/30 px-2 py-0.5 rounded-full">
          <Activity className="w-3 h-3 text-[#C18C5D]" />
          <span className="text-[#C18C5D] font-bold">4 Feeds</span>
        </div>
        <span className="text-[#2C2C24] font-bold text-[11px] bg-[#E6DCCD]/40 px-2 py-0.5 rounded-full border border-[#DED8CF]/60">{currentTime}</span>
      </div>
    </div>
  );
}
