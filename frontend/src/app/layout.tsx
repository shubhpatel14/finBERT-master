import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdgeFinder // Indian Equity Research & Market Intelligence Terminal",
  description: "Institutional financial workstation featuring NIFTY/SENSEX telemetry, interactive candlestick technical indicators, evaluated price forecasting, and ProsusAI/FinBERT news intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#FDFCF8] text-[#2C2C24] font-nunito antialiased selection:bg-[#5D7052]/20 selection:text-[#2C2C24]">
        {children}
      </body>
    </html>
  );
}
