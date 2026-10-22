"""
FinBERT Sentiment Service for EdgeFinder Backend
Reuses the local ProsusAI/finbert model weights and tokenizer with GPU/CPU auto-detection.
"""

import time
import torch
from typing import Dict, List, Any, Optional
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from backend.config import settings

class FinBERTSentimentService:
    _instance = None

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_name = settings.FINBERT_MODEL_NAME
        self.tokenizer = None
        self.model = None
        self._loaded = False

    def load_model(self):
        """Lazy loader for FinBERT model and tokenizer."""
        if not self._loaded:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            self.id2label = {k: v.lower() for k, v in self.model.config.id2label.items()}
            self._loaded = True

    def predict_single(self, text: str) -> Dict[str, Any]:
        """Analyzes a single news headline or disclosure."""
        if not text or not text.strip():
            return {
                "text": text or "",
                "sentiment": "neutral",
                "confidence": 0.0,
                "sentiment_score": 0.0,
                "scores": {"positive": 0.0, "negative": 0.0, "neutral": 1.0},
                "latency_ms": 0.0
            }

        self.load_model()
        t0 = time.perf_counter()

        inputs = self.tokenizer(
            text.strip(),
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=False
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)[0]

        scores = {
            self.id2label[i]: round(float(probs[i].item()), 4)
            for i in range(len(self.id2label))
        }

        sentiment = max(scores, key=scores.get)
        confidence = scores[sentiment]
        pos = scores.get("positive", 0.0)
        neg = scores.get("negative", 0.0)
        sentiment_score = round(pos - neg, 4)

        elapsed = round((time.perf_counter() - t0) * 1000, 2)

        return {
            "text": text.strip(),
            "sentiment": sentiment,
            "confidence": confidence,
            "sentiment_score": sentiment_score,
            "scores": scores,
            "positive_prob": pos,
            "negative_prob": neg,
            "neutral_prob": scores.get("neutral", 0.0),
            "latency_ms": elapsed,
            "device": str(self.device)
        }

    def predict_batch(self, texts: List[str], batch_size: int = 16) -> List[Dict[str, Any]]:
        """Processes a list of headlines in batched tensors."""
        if not texts:
            return []

        self.load_model()
        results = []
        total = len(texts)

        for i in range(0, total, batch_size):
            chunk = texts[i:i + batch_size]
            clean_chunk = [t.strip() if isinstance(t, str) and t.strip() else "N/A" for t in chunk]

            inputs = self.tokenizer(
                clean_chunk,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.softmax(outputs.logits, dim=1)

            for j, orig_text in enumerate(chunk):
                item_probs = probs[j]
                scores = {
                    self.id2label[k]: round(float(item_probs[k].item()), 4)
                    for k in range(len(self.id2label))
                }
                sentiment = max(scores, key=scores.get)
                confidence = scores[sentiment]
                pos = scores.get("positive", 0.0)
                neg = scores.get("negative", 0.0)
                sentiment_score = round(pos - neg, 4)

                results.append({
                    "text": orig_text,
                    "sentiment": sentiment,
                    "confidence": confidence,
                    "sentiment_score": sentiment_score,
                    "scores": scores,
                    "positive_prob": pos,
                    "negative_prob": neg,
                    "neutral_prob": scores.get("neutral", 0.0)
                })

        return results

finbert_service = FinBERTSentimentService()
