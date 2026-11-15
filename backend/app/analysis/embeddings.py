"""
SENTINEL — Text Embedding Provider
Generates dense vector representations of report text for semantic comparison.

Strategy:
  1. Try to load sentence-transformers (all-MiniLM-L6-v2) — rich semantic embeddings.
  2. If not installed or download fails, fall back to scikit-learn TF-IDF vectors.

Both providers expose the same interface: get_embedding(text) → numpy array.
Embeddings are cached in memory for the lifetime of the server process.
"""

from __future__ import annotations

import logging
import hashlib
import numpy as np

logger = logging.getLogger("sentinel.analysis.embeddings")

# ── Provider selection ────────────────────────────────────────────────────────
# We attempt to import sentence-transformers once at startup.
# If unavailable, _PROVIDER stays "tfidf".

_PROVIDER: str = "tfidf"
_ST_MODEL = None           # SentenceTransformer instance (lazy)
_TFIDF_VECTORIZER = None   # TfidfVectorizer instance (lazy, fitted on demand)
_TFIDF_CORPUS: list[str] = []  # growing corpus for the TF-IDF vectorizer

try:
    from sentence_transformers import SentenceTransformer  # type: ignore
    _PROVIDER = "sentence-transformers"
    logger.info("sentence-transformers available; will use all-MiniLM-L6-v2 for embeddings.")
except ImportError:
    logger.info(
        "sentence-transformers not installed — falling back to TF-IDF embeddings. "
        "Install with: pip install sentence-transformers"
    )

# ── In-memory embedding cache ─────────────────────────────────────────────────
# Key: SHA-256 of text content (so we don't store raw text in the key)
_CACHE: dict[str, np.ndarray] = {}


def _cache_key(text: str) -> str:
    """Returns a stable cache key for a given text string."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _load_st_model() -> object:
    """
    Lazily loads the SentenceTransformer model on first use.
    If the model download fails, we demote to TF-IDF.
    """
    global _ST_MODEL, _PROVIDER

    if _ST_MODEL is not None:
        return _ST_MODEL

    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
        logger.info("Loading all-MiniLM-L6-v2 — may download ~90 MB on first run …")
        _ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("all-MiniLM-L6-v2 loaded successfully.")
    except Exception as exc:
        logger.warning(
            "Could not load sentence-transformers model (%s). Falling back to TF-IDF.", exc
        )
        _PROVIDER = "tfidf"
        _ST_MODEL = None

    return _ST_MODEL


def _get_tfidf_embedding(text: str) -> np.ndarray:
    """
    Returns a normalized feature vector for the given text using HashingVectorizer.
    Produces a fixed-dimension vector (512 features) statelessly and reliably across
    all calls, avoiding dimension mismatches and requiring zero external downloads.
    """
    global _TFIDF_VECTORIZER
    if _TFIDF_VECTORIZER is None:
        from sklearn.feature_extraction.text import HashingVectorizer  # type: ignore
        _TFIDF_VECTORIZER = HashingVectorizer(
            n_features=512,
            norm="l2",
            alternate_sign=False,
            ngram_range=(1, 2),
        )
    vec = _TFIDF_VECTORIZER.transform([text])
    return vec.toarray()[0]


def get_embedding(text: str) -> np.ndarray:
    """
    Returns a dense numpy embedding vector for the given text.
    Uses sentence-transformers if available; otherwise TF-IDF.
    Results are cached to avoid redundant computation.

    Args:
        text: The free-text string to embed (e.g. a report description).

    Returns:
        A 1-D numpy float32 array.
    """
    if not text or not text.strip():
        # Return a zero vector for empty text
        return np.zeros(384, dtype=np.float32)

    key = _cache_key(text.strip())
    if key in _CACHE:
        return _CACHE[key]

    if _PROVIDER == "sentence-transformers":
        model = _load_st_model()
        if model is not None:
            # encode() returns a numpy array of shape (dim,)
            embedding = model.encode(text.strip(), convert_to_numpy=True)
            vec = embedding.astype(np.float32)
        else:
            # Model load failed; demoted to TF-IDF
            vec = _get_tfidf_embedding(text.strip()).astype(np.float32)
    else:
        vec = _get_tfidf_embedding(text.strip()).astype(np.float32)

    _CACHE[key] = vec
    return vec


def get_provider_name() -> str:
    """
    Returns the name of the currently active embedding provider.

    Returns:
        "sentence-transformers" or "tfidf"
    """
    return _PROVIDER
