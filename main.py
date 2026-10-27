
from flask import Flask, request, jsonify
from flask_cors import CORS
from finbert.finbert import predict
from transformers import AutoModelForSequenceClassification
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.environ.get("MODEL_PATH", "ProsusAI/finbert")

# Load FinBERT once when the service starts
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_PATH,
    num_labels=3
)

@app.route("/", methods=["GET", "POST"])
def score():
    if request.method == "GET":
        return jsonify({
            "status": "ok",
            "service": "FinBERT sentiment API"
        }), 200

    data = request.get_json(silent=True) or {}
    text = data.get("text")

    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Please provide a non-empty text field"}), 400

    try:
        result = predict(text, model)
        return app.response_class(
            response=result.to_json(orient="records"),
            status=200,
            mimetype="application/json"
        )
    except Exception:
        app.logger.exception("FinBERT prediction failed")
        return jsonify({"error": "Prediction failed"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True
    )
