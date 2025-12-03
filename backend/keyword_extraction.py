from typing import List, Dict, Any
from rake_nltk import Rake
import yake
import re

# Initialize the keyword extractors
rake_extractor = Rake()
yake_extractor = yake.KeywordExtractor(
    lan="en", 
    n=3,  # ngram size
    dedupLim=0.9,  # deduplication threshold
    dedupFunc='seqm',  # deduplication function
    windowsSize=1,  # window size
    top=20,  # number of keywords to extract
    features=None
)

def clean_text(text: str) -> str:
    """Clean the text by removing special characters and extra whitespace."""
    text = re.sub(r'[^\w\s]', ' ', text)  # Replace special chars with space
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with single space
    return text.strip().lower()

def extract_keywords_rake(text: str, top_n: int = 10) -> List[str]:
    """Extract keywords using RAKE algorithm."""
    if not text or not text.strip():
        return []
    
    cleaned_text = clean_text(text)
    rake_extractor.extract_keywords_from_text(cleaned_text)
    keywords = rake_extractor.get_ranked_phrases()
    return keywords[:top_n]

def extract_keywords_yake(text: str, top_n: int = 10) -> List[str]:
    """Extract keywords using YAKE algorithm."""
    if not text or not text.strip():
        return []
    
    cleaned_text = clean_text(text)
    keywords = yake_extractor.extract_keywords(cleaned_text)
    # YAKE returns (keyword, score) tuples where lower score is better
    return [kw for kw, _ in sorted(keywords, key=lambda x: x[1])[:top_n]]

def extract_keywords_by_rating(comments: List[Dict[str, Any]], top_n: int = 10) -> Dict[str, List[str]]:
    """
    Extract keywords from comments grouped by rating.
    
    Args:
        comments: List of comment dictionaries with 'text' and 'rating' fields
        top_n: Number of top keywords to extract per rating group
        
    Returns:
        Dictionary mapping rating to list of keywords
    """
    # Group comments by rating
    comments_by_rating = {}
    for comment in comments:
        rating = comment.get('rating', 0)
        text = comment.get('text', '')
        if not text:
            continue
            
        if rating not in comments_by_rating:
            comments_by_rating[rating] = []
        comments_by_rating[rating].append(text)
    
    # Extract keywords for each rating group
    keywords_by_rating = {}
    for rating, texts in comments_by_rating.items():
        combined_text = " ".join(texts)
        # Use both RAKE and YAKE for better results
        rake_keywords = extract_keywords_rake(combined_text, top_n=top_n)
        yake_keywords = extract_keywords_yake(combined_text, top_n=top_n)
        
        # Combine and deduplicate keywords
        all_keywords = list(set(rake_keywords + yake_keywords))
        keywords_by_rating[rating] = all_keywords[:top_n]
    
    return keywords_by_rating

def generate_summary_from_keywords(keywords_by_rating: Dict[str, List[str]]) -> str:
    """
    Generate a summary text from extracted keywords grouped by rating.
    
    Args:
        keywords_by_rating: Dictionary mapping rating to list of keywords
        
    Returns:
        A summary text describing the main points from each rating group
    """
    summary_parts = []
    
    # Handle high ratings (4-5)
    high_keywords = []
    for rating in [5, 4]:
        if rating in keywords_by_rating:
            high_keywords.extend(keywords_by_rating[rating])
    
    if high_keywords:
        high_summary = "Users appreciate " + ", ".join(high_keywords[:5]) + "."
        summary_parts.append(high_summary)
    
    # Handle medium ratings (3)
    if 3 in keywords_by_rating:
        med_keywords = keywords_by_rating[3]
        if med_keywords:
            med_summary = "Users have mixed feelings about " + ", ".join(med_keywords[:3]) + "."
            summary_parts.append(med_summary)
    
    # Handle low ratings (1-2)
    low_keywords = []
    for rating in [1, 2]:
        if rating in keywords_by_rating:
            low_keywords.extend(keywords_by_rating[rating])
    
    if low_keywords:
        low_summary = "Users are frustrated with " + ", ".join(low_keywords[:5]) + "."
        summary_parts.append(low_summary)
    
    # Combine all parts
    if not summary_parts:
        return "No significant feedback patterns were identified."
    
    return " ".join(summary_parts)