from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union

from transformers import pipeline
from summarize import summarize_comments
from wordcloud import WordCloud, STOPWORDS
import io
import base64


class SentimentItem(BaseModel):
    text: str


class SentimentBatch(BaseModel):
    texts: List[str]


app = FastAPI(title="Sentiment API", version="1.0.0")

# Allow local frontend; adjust origins as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load pipeline once at startup
_nlp = pipeline(
    task="sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment",
    tokenizer="cardiffnlp/twitter-roberta-base-sentiment",
    framework="pt",
)

# Star rating model removed per requirement; keep only sentiment


def _normalize_label(label: str, score: float = None) -> str:
    # Normalize labels to one of: positive, neutral, negative
    label = label.upper()
    mapping = {
        "LABEL_0": "negative",
        "LABEL_1": "neutral", 
        "LABEL_2": "positive",
        "NEGATIVE": "negative",
        "NEUTRAL": "neutral",
        "POSITIVE": "positive",
    }
    normalized = mapping.get(label, label.lower())
    
    # Override with neutral if score is around 0.5-0.6 (uncertain)
    if score is not None and 0.5 <= score <= 0.6:
        normalized = "neutral"
    
    return normalized


@app.post("/sentiment")
def analyze_sentiment(payload: Union[SentimentItem, SentimentBatch]):
    # Support both single item {text} and batch {texts}
    if isinstance(payload, SentimentBatch):
        inputs = payload.texts
    else:
        inputs = [payload.text]

    # Run model (transformers pipeline supports batching)
    results = _nlp(inputs)

    normalized = [
        {
            "label": _normalize_label(r.get("label", ""), r.get("score", 0.0)),
            "score": float(r.get("score", 0.0)),
        }
        for r in results
    ]

    # If single item, return object; if batch, return list
    if isinstance(payload, SentimentBatch):
        return {"results": normalized}
    else:
        return normalized[0]


# Removed /sentiment-both endpoint


@app.get("/health")
def health():
    return {"status": "ok"}


class SummarizeRequest(BaseModel):
    texts: List[str]
    max_summary_tokens: int | None = 180


@app.post("/summarize")
def summarize(req: SummarizeRequest):
    summary = summarize_comments(req.texts, max_summary_tokens=req.max_summary_tokens or 180)
    return {"summary": summary}


class WordcloudRequest(BaseModel):
    texts: List[str]
    width: int | None = 800
    height: int | None = 400
    background_color: str | None = "white"


@app.post("/wordcloud")
def wordcloud_image(req: WordcloudRequest):
    combined = " \n".join([t for t in req.texts if t and t.strip()])
    if not combined.strip():
        return {"image_base64": None}

    wc = WordCloud(
        width=req.width or 800,
        height=req.height or 400,
        background_color=req.background_color or "white",
        stopwords=STOPWORDS,
    ).generate(combined)

    buf = io.BytesIO()
    wc.to_image().save(buf, format="PNG")
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("ascii")
    return {"image_base64": b64}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)


