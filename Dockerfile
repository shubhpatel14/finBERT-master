
FROM pytorch/pytorch:latest

RUN pip install --no-cache-dir \
    numpy pandas nltk Flask flask-cors \
    transformers==4.41.2

COPY main.py /src/main.py
COPY finbert /src/finbert

EXPOSE 8080

CMD ["python3", "/src/main.py"]
