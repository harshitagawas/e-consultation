from typing import List
from transformers import pipeline


_summarizer = pipeline(
    task="summarization",
    model="facebook/bart-large-cnn",
    tokenizer="facebook/bart-large-cnn",
    framework="pt",
)


def chunk_text(text: str, max_chars: int = 3000) -> List[str]:
    if len(text) <= max_chars:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        # try to break at last period for cleaner chunks
        sub = text[start:end]
        dot = sub.rfind(".")
        if dot != -1 and (start + dot + 1) - start > 200:  # keep chunks reasonable
            end = start + dot + 1
        chunks.append(text[start:end])
        start = end
    return chunks


def summarize_comments(comments: List[str], max_summary_tokens: int = 180) -> str:
    if not comments:
        return ""
    joined = "\n".join([c.strip() for c in comments if c and c.strip()])
    if not joined:
        return ""

    chunks = chunk_text(joined)
    partials: List[str] = []
    for ch in chunks:
        out = _summarizer(
            ch,
            max_length=max_summary_tokens,
            min_length=max(60, max_summary_tokens // 3),
            do_sample=False,
        )
        if out and isinstance(out, list) and "summary_text" in out[0]:
            partials.append(out[0]["summary_text"])

    # If multiple partials, do a final summary pass
    if len(partials) > 1:
        merged = " \n".join(partials)
        final = _summarizer(
            merged,
            max_length=max_summary_tokens,
            min_length=max(60, max_summary_tokens // 3),
            do_sample=False,
        )
        if final and isinstance(final, list) and "summary_text" in final[0]:
            return final[0]["summary_text"]
        return merged

    return partials[0] if partials else ""


