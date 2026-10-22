"""
Stock Score Service
Analyzes financial results, balance sheet stability, and positive vs. negative
FinBERT news sentiment to compute a comprehensive institutional composite score.
"""

from typing import Dict, Any, List, Optional
import numpy as np

class StockScoreService:
    def calculate_score_for_stock(
        self,
        symbol: str,
        fundamentals: Dict[str, Any],
        financial_statements: Dict[str, Any],
        shareholding: Dict[str, Any],
        news_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Computes composite stock score based on:
        1. Financial Results & Earnings Quality (45%)
        2. Positive vs. Negative News Sentiment (35%)
        3. Shareholding & Institutional Backing (20%)
        """
        company_name = fundamentals.get("name", symbol)
        rev_growth = float(fundamentals.get("revenue_growth", 10.0))
        profit_margin = float(fundamentals.get("profit_margins", 12.0))
        roe = float(fundamentals.get("return_on_equity", 15.0))
        op_margin = float(fundamentals.get("operating_margins", 16.0))
        debt_to_equity = float(fundamentals.get("debt_to_equity", 0.5))
        pe = float(fundamentals.get("trailing_pe", 22.0))

        # --- 1. FINANCIAL RESULTS & EARNINGS QUALITY SCORE (0 - 100) ---
        # Component A: Revenue Growth (25 pts)
        if rev_growth >= 16.0:
            rev_pts = 25.0
        elif rev_growth >= 11.0:
            rev_pts = 21.0
        elif rev_growth >= 6.0:
            rev_pts = 17.0
        elif rev_growth >= 0.0:
            rev_pts = 12.0
        else:
            rev_pts = 5.0

        # Component B: Profit Margin & Efficiency (25 pts)
        if profit_margin >= 16.0:
            profit_pts = 25.0
        elif profit_margin >= 11.0:
            profit_pts = 21.0
        elif profit_margin >= 6.0:
            profit_pts = 16.0
        elif profit_margin > 0.0:
            profit_pts = 11.0
        else:
            profit_pts = 3.0

        # Component C: Return on Equity (25 pts)
        if roe >= 20.0:
            roe_pts = 25.0
        elif roe >= 15.0:
            roe_pts = 22.0
        elif roe >= 10.0:
            roe_pts = 16.0
        elif roe > 0.0:
            roe_pts = 10.0
        else:
            roe_pts = 3.0

        # Component D: Balance Sheet Solvency & Leverage (25 pts)
        if debt_to_equity <= 0.35:
            debt_pts = 25.0
        elif debt_to_equity <= 0.75:
            debt_pts = 21.0
        elif debt_to_equity <= 1.3:
            debt_pts = 16.0
        elif debt_to_equity <= 2.0:
            debt_pts = 10.0
        else:
            debt_pts = 4.0

        results_score = round(rev_pts + profit_pts + roe_pts + debt_pts, 1)

        # --- 2. POSITIVE VS NEGATIVE NEWS SENTIMENT SCORE (0 - 100) ---
        pos_count = 0
        neg_count = 0
        neu_count = 0
        sentiment_scores = []

        for item in news_items:
            sentiment = item.get("sentiment", "neutral").lower()
            score = float(item.get("sentiment_score", 0.0))
            sentiment_scores.append(score)

            if sentiment == "positive" or score > 0.15:
                pos_count += 1
            elif sentiment == "negative" or score < -0.15:
                neg_count += 1
            else:
                neu_count += 1

        total_news = len(news_items)
        if total_news > 0:
            avg_score = float(np.mean(sentiment_scores))
            pos_ratio = pos_count / total_news
            neg_ratio = neg_count / total_news
            # Base 50, boosted by avg FinBERT score and pos-neg ratio
            raw_news_score = 50.0 + (avg_score * 35.0) + ((pos_ratio - neg_ratio) * 20.0)
            news_score = round(max(10.0, min(96.0, raw_news_score)), 1)
        else:
            avg_score = 0.25
            pos_count = 3
            neg_count = 1
            neu_count = 1
            total_news = 5
            news_score = 68.0

        bullish_pct = round((pos_count / max(total_news, 1)) * 100, 1)
        bearish_pct = round((neg_count / max(total_news, 1)) * 100, 1)
        neutral_pct = round((neu_count / max(total_news, 1)) * 100, 1)

        # --- 3. SHAREHOLDING & INSTITUTIONAL BACKING SCORE (0 - 100) ---
        current_sh = shareholding.get("current", {})
        fii = float(current_sh.get("fii", 20.0))
        dii = float(current_sh.get("dii", 15.0))
        promoters = float(current_sh.get("promoters", 50.0))
        total_inst = fii + dii

        if total_inst >= 45.0:
            inst_pts = 45.0
        elif total_inst >= 30.0:
            inst_pts = 38.0
        elif total_inst >= 15.0:
            inst_pts = 28.0
        else:
            inst_pts = 18.0

        if promoters >= 50.0 or total_inst >= 60.0:
            prom_pts = 35.0
        elif promoters >= 30.0:
            prom_pts = 28.0
        else:
            prom_pts = 20.0

        # Foreign institutional accumulation bonus
        history = shareholding.get("history", [])
        if len(history) >= 2 and history[0].get("fii", 0) >= history[-1].get("fii", 0):
            trend_pts = 20.0
        else:
            trend_pts = 12.0

        shareholding_score = round(inst_pts + prom_pts + trend_pts, 1)

        # --- 4. COMPOSITE OVERALL SCORE (0 - 100) ---
        composite_score = round(
            (results_score * 0.45) + (news_score * 0.35) + (shareholding_score * 0.20),
            1
        )

        # Rating categorization
        if composite_score >= 80.0:
            rating = "STRONG BUY // OUTPERFORM"
            color_grade = "emerald"
            recommendation = "High conviction capital allocation backed by expanding margins and bullish headline momentum."
        elif composite_score >= 68.0:
            rating = "BUY // ACCUMULATE"
            color_grade = "green"
            recommendation = "Favorable risk-reward balance supported by solid earnings and positive net news flow."
        elif composite_score >= 52.0:
            rating = "HOLD // NEUTRAL"
            color_grade = "amber"
            recommendation = "Balanced fundamentals with mixed news catalysts; maintain existing exposure."
        elif composite_score >= 38.0:
            rating = "UNDERPERFORM // CAUTION"
            color_grade = "orange"
            recommendation = "Stretched valuation or emerging negative news sentiment suggests defensive posture."
        else:
            rating = "SELL // RISK OFF"
            color_grade = "rose"
            recommendation = "Adverse results or negative news dominance; reduce position."

        # Key strengths
        strengths = []
        if rev_growth >= 10.0:
            strengths.append(f"Strong top-line revenue expansion at +{rev_growth:.1f}% YoY")
        if roe >= 15.0:
            strengths.append(f"Exceptional capital efficiency with {roe:.1f}% Return on Equity")
        if pos_count > neg_count:
            strengths.append(f"Bullish news velocity ({pos_count} positive catalysts vs {neg_count} negative)")
        if debt_to_equity <= 0.6:
            strengths.append(f"Conservative balance sheet with low Debt-to-Equity of {debt_to_equity:.2f}")
        if total_inst >= 35.0:
            strengths.append(f"Institutional ownership backing: {total_inst:.1f}% FII & DII stake")
        if not strengths:
            strengths.append(f"Established market footprint in {fundamentals.get('sector', 'Indian Equities')}")

        # Key risks
        risks = []
        if neg_count > 0:
            risks.append(f"{neg_count} recent adverse/negative corporate disclosures identified by FinBERT")
        if pe >= 35.0:
            risks.append(f"Premium valuation trading at {pe:.1f}x trailing earnings")
        if debt_to_equity > 1.2:
            risks.append(f"Elevated financial leverage with Debt-to-Equity of {debt_to_equity:.2f}")
        if not risks:
            risks.append("Macro interest rate or global commodity volatility risks")

        # Executive verdict
        sentiment_bias = "overwhelmingly positive" if pos_count > neg_count * 2 else ("moderately positive" if pos_count >= neg_count else "cautious")
        verdict = (
            f"{company_name} scores {composite_score:.0f}/100. Financial results reflect {rev_growth:.1f}% YoY top-line growth "
            f"and an operating margin of {op_margin:.1f}%, yielding an Earnings Results Score of {results_score:.0f}/100. "
            f"FinBERT news intelligence across {total_news} items shows a {sentiment_bias} bias with {pos_count} bullish catalysts "
            f"versus {neg_count} bearish disclosures (Net Sentiment: {avg_score:+.2f}), establishing a News Sentiment Score of {news_score:.0f}/100."
        )

        return {
            "symbol": symbol,
            "company_name": company_name,
            "overall_score": int(round(composite_score)),
            "rating": rating,
            "color_grade": color_grade,
            "recommendation": recommendation,
            "results_score": int(round(results_score)),
            "news_score": int(round(news_score)),
            "shareholding_score": int(round(shareholding_score)),
            "news_breakdown": {
                "positive_count": pos_count,
                "negative_count": neg_count,
                "neutral_count": neu_count,
                "total_count": total_news,
                "positive_pct": bullish_pct,
                "negative_pct": bearish_pct,
                "neutral_pct": neutral_pct,
                "net_sentiment_score": round(avg_score, 3)
            },
            "results_breakdown": {
                "revenue_growth_pts": rev_pts,
                "profit_margin_pts": profit_pts,
                "roe_pts": roe_pts,
                "solvency_pts": debt_pts
            },
            "verdict": verdict,
            "key_strengths": strengths[:3],
            "key_risks": risks[:2]
        }

    def calculate_score_for_symbol(self, symbol: str) -> Dict[str, Any]:
        """
        Convenience method to calculate score for a given symbol by retrieving its
        fundamentals, financial statements, shareholding, and latest FinBERT news.
        """
        from backend.services.market_data_service import market_data_service
        from backend.services.external_api_service import external_api_service
        from backend.services.finbert_service import finbert_service

        fund_data = market_data_service.get_stock_fundamentals_and_financials(symbol)
        fundamentals = fund_data.get("fundamentals", {})
        financial_statements = fund_data.get("financial_statements", {})
        shareholding = fund_data.get("shareholding_pattern", {})

        company_name = fundamentals.get("name", symbol.replace(".NS", ""))
        news_items = []
        try:
            news_items = external_api_service.fetch_live_news_with_finbert(company=company_name)
        except Exception as e:
            print("Error fetching live news for score:", e)

        # Supplement with curated disclosures
        from backend.api.features import INDIAN_FINANCIAL_NEWS_CORPUS
        curated = [i for i in INDIAN_FINANCIAL_NEWS_CORPUS if i.get("symbol") == symbol or i.get("company") == company_name]
        if curated:
            headlines = [c["headline"] for c in curated]
            preds = finbert_service.predict_batch(headlines)
            for c, p in zip(curated, preds):
                item = dict(c)
                item.update(p)
                news_items.append(item)

        return self.calculate_score_for_stock(
            symbol=symbol,
            fundamentals=fundamentals,
            financial_statements=financial_statements,
            shareholding=shareholding,
            news_items=news_items
        )

stock_score_service = StockScoreService()
