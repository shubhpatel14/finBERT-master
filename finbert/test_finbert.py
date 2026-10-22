import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "ProsusAI/finbert"

print("Loading FinBERT model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

model.eval()

def analyze_sentiment(text: str) -> dict:
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512
    )

    with torch.no_grad():
        outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=1)[0]

    scores = {
        label: round(probabilities[index].item(), 4)
        for index, label in model.config.id2label.items()
    }

    sentiment = max(scores, key=scores.get)

    return {
        "text": text,
        "sentiment": sentiment,
        "confidence": scores[sentiment],
        "scores": scores,
    }

news = (
    "Reliance Industries reports strong quarterly profits, "
    "supported by growth in its retail business."
)

result = analyze_sentiment(news)

print("\nFinBERT Prediction")
print("------------------")
print("News:", result["text"])
print("Sentiment:", result["sentiment"])
print("Confidence:", result["confidence"])
print("All scores:", result["scores"])