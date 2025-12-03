from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union, Dict, Any

from transformers import pipeline
from summarize import summarize_comments
from keyword_extraction import extract_keywords_by_rating, generate_summary_from_keywords
from wordcloud import WordCloud, STOPWORDS
import io
import base64


class SentimentItem(BaseModel):
    text: str
    rating: int = None


class SentimentBatch(BaseModel):
    texts: List[str]
    ratings: List[int] = None


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


def _get_rating_sentiment(rating: int) -> str:
    """Convert star rating to sentiment according to rules:
    1-2 stars → Negative
    3 stars → Neutral
    4-5 stars → Positive
    """
    if rating is None:
        return None
    
    if rating <= 2:
        return "negative"
    elif rating == 3:
        return "neutral"
    else:  # 4-5
        return "positive"


def _combine_sentiments(text_sentiment: str, rating_sentiment: str) -> str:
    """Combine text and rating sentiments according to rules:
    1. If they match → use that sentiment
    2. If they mismatch → always choose the text sentiment
    3. If rating is None → use text sentiment
    """
    # Rule 3: If rating is None, use text sentiment
    if rating_sentiment is None:
        return text_sentiment
    
    # Rule 1: If they match, use that sentiment
    if text_sentiment == rating_sentiment:
        return text_sentiment
    
    # Rule 2: If they mismatch, always choose the text sentiment
    return text_sentiment


@app.post("/sentiment")
def analyze_sentiment(payload: Union[SentimentItem, SentimentBatch]):
    # Support both single item {text} and batch {texts}
    if isinstance(payload, SentimentBatch):
        inputs = payload.texts
        ratings = payload.ratings if payload.ratings else [None] * len(inputs)
    else:
        inputs = [payload.text]
        ratings = [payload.rating]

    # Run model (transformers pipeline supports batching)
    results = _nlp(inputs)

    normalized = []
    for i, r in enumerate(results):
        # Get text-based sentiment
        text_sentiment = _normalize_label(r.get("label", ""), r.get("score", 0.0))
        
        # Get rating-based sentiment (if available)
        rating = ratings[i] if i < len(ratings) else None
        rating_sentiment = _get_rating_sentiment(rating)
        
        # Combine sentiments according to rules
        final_sentiment = _combine_sentiments(text_sentiment, rating_sentiment)
        
        normalized.append({
            "label": final_sentiment,
            "score": float(r.get("score", 0.0)),
            "text_sentiment": text_sentiment,
            "rating_sentiment": rating_sentiment
        })

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


class CommentItem(BaseModel):
    text: str
    rating: int


class KeywordSummaryRequest(BaseModel):
    comments: List[CommentItem]
    top_n: int | None = 10


@app.post("/keyword-summary")
def keyword_summary(req: KeywordSummaryRequest):
    """Extract keywords from comments grouped by rating and generate a summary."""
    if not req.comments:
        return {"keywords_by_rating": {}, "wordcloud_summary": "", "regular_summary": ""}
        
    comments_data = [{"text": c.text, "rating": c.rating} for c in req.comments]
    keywords_by_rating = extract_keywords_by_rating(comments_data, top_n=req.top_n or 10)
    wordcloud_summary = generate_summary_from_keywords(keywords_by_rating)
    
    # Generate regular summary using the summarize_comments function
    regular_summary = summarize_comments([c.text for c in req.comments])
    
    # Flatten keywords for frontend highlighting
    all_keywords = []
    for keywords in keywords_by_rating.values():
        all_keywords.extend(keywords)
    
    return {
        "keywords_by_rating": keywords_by_rating,
        "all_keywords": list(set(all_keywords)),  # Deduplicated list
        "wordcloud_summary": wordcloud_summary,
        "regular_summary": regular_summary
    }


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


