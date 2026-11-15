"""
SENTINEL — Analysis Module
Provides automated report analysis: severity classification, embedding generation,
entity extraction, duplicate detection, and confidence scoring.
"""
from app.analysis.embeddings import get_embedding, get_provider_name
from app.analysis.classifier import classify
from app.analysis.extractor import extract_all
from app.analysis.duplicates import find_duplicates
from app.analysis.confidence import compute_confidence

__all__ = [
    "get_embedding",
    "get_provider_name",
    "classify",
    "extract_all",
    "find_duplicates",
    "compute_confidence",
]
