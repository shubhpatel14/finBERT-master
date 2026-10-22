"""
FinBERT Inference Service Module
Handles lazy-loading, caching, tokenization, single-headline prediction,
and optimized batch prediction using ProsusAI/finbert.
"""

import time
import torch
from typing import Dict, List, Any, Optional, Tuple
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "ProsusAI/finbert"

class FinBERTService:
    def __init__(self, device: Optional[str] = None):
        """
        Initializes the FinBERT service with model and tokenizer.
        """
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
            
        self.model_name = MODEL_NAME
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
        self.model.to(self.device)
        self.model.eval()
        
        # Label mapping verification
        self.id2label = self.model.config.id2label
        # Standardize labels to lowercase
        self.id2label = {k: v.lower() for k, v in self.id2label.items()}

    def predict_single(self, text: str) -> Dict[str, Any]:
        """
        Runs sentiment analysis on a single text headline or paragraph.
        
        Returns:
            dict containing:
                - text: original text
                - sentiment: 'positive', 'negative', or 'neutral'
                - confidence: probability of top class
                - sentiment_score: positive - negative (-1.0 to +1.0)
                - scores: dict of probabilities {positive, negative, neutral}
                - latency_ms: elapsed time in ms
                - tokens: number of tokens processed
        """
        if not text or not text.strip():
            return {
                "text": text or "",
                "sentiment": "neutral",
                "confidence": 0.0,
                "sentiment_score": 0.0,
                "scores": {"positive": 0.0, "negative": 0.0, "neutral": 1.0},
                "latency_ms": 0.0,
                "tokens": 0,
                "error": "Empty text provided"
            }

        start_time = time.perf_counter()
        
        inputs = self.tokenizer(
            text.strip(),
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=False
        )
        token_count = inputs["input_ids"].shape[1]
        
        # Move inputs to target device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            probabilities = torch.softmax(outputs.logits, dim=1)[0]

        scores = {
            self.id2label[idx]: round(float(probabilities[idx].item()), 4)
            for idx in range(len(self.id2label))
        }

        # Determine winning sentiment
        sentiment = max(scores, key=scores.get)
        confidence = scores[sentiment]

        # Calculate Net Sentiment Score: Positive - Negative (ranges from -1.0 to +1.0)
        pos = scores.get("positive", 0.0)
        neg = scores.get("negative", 0.0)
        sentiment_score = round(pos - neg, 4)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "text": text.strip(),
            "sentiment": sentiment,
            "confidence": confidence,
            "sentiment_score": sentiment_score,
            "scores": scores,
            "latency_ms": elapsed_ms,
            "tokens": token_count,
            "device": str(self.device)
        }

    def predict_batch(
        self,
        texts: List[str],
        batch_size: int = 16,
        progress_callback = None
    ) -> List[Dict[str, Any]]:
        """
        Processes a batch of headlines with batched tokenization and GPU/CPU inference.
        
        Args:
            texts: list of string headlines
            batch_size: number of samples per forward pass
            progress_callback: optional callable(current_count, total_count)
            
        Returns:
            list of result dictionaries
        """
        results: List[Dict[str, Any]] = []
        total = len(texts)
        if total == 0:
            return results

        start_total = time.perf_counter()
        
        for i in range(0, total, batch_size):
            batch_texts = texts[i:i + batch_size]
            # Clean and sanitize
            clean_batch = [t.strip() if isinstance(t, str) and t.strip() else "N/A" for t in batch_texts]
            
            t0 = time.perf_counter()
            inputs = self.tokenizer(
                clean_batch,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.softmax(outputs.logits, dim=1)

            batch_latency = (time.perf_counter() - t0) * 1000

            for j, orig_text in enumerate(batch_texts):
                item_probs = probs[j]
                scores = {
                    self.id2label[idx]: round(float(item_probs[idx].item()), 4)
                    for idx in range(len(self.id2label))
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
                    "neutral_prob": scores.get("neutral", 0.0),
                    "batch_index": i + j
                })

            if progress_callback:
                progress_callback(min(i + batch_size, total), total)

        return results


# Streamlit Caching Hook
import streamlit as st

@st.cache_resource(show_spinner="Initializing ProsusAI/FinBERT Neural Engine...")
def get_finbert_service() -> FinBERTService:
    """
    Cached singleton service provider for Streamlit runtime.
    Guarantees the model is loaded only once across page navigations.
    """
    return FinBERTService()
