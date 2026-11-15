"""
SENTINEL — Duplicate Report Detector
Finds semantically similar reports that may describe the same waterlogging
incident, using cosine similarity of text embeddings.

Design:
  - Calls get_embedding() from the embeddings module (sentence-transformers
    or TF-IDF, whichever is active).
  - Uses sklearn's cosine_similarity for fast numpy computation.
  - Configurable threshold via DUPLICATE_THRESHOLD env variable (default 0.75).
  - Reports with similarity ≥ threshold are returned as "possible duplicates".
"""

from __future__ import annotations

import logging
import os

import numpy as np  # type: ignore

from app.analysis.embeddings import get_embedding

logger = logging.getLogger("sentinel.analysis.duplicates")

# ── Default similarity threshold ──────────────────────────────────────────────
# 0.75 is a reasonable starting point: high enough to avoid false positives,
# low enough to catch paraphrased reports of the same incident.
# Override with environment variable DUPLICATE_THRESHOLD (float 0.0–1.0).
_DEFAULT_THRESHOLD = 0.75

def _get_threshold() -> float:
    """Reads DUPLICATE_THRESHOLD from env, with safe fallback."""
    try:
        val = float(os.environ.get("DUPLICATE_THRESHOLD", _DEFAULT_THRESHOLD))
        return max(0.0, min(1.0, val))   # clamp to [0, 1]
    except (ValueError, TypeError):
        return _DEFAULT_THRESHOLD


def find_duplicates(
    new_text: str,
    existing_reports: list[dict],
    threshold: float | None = None,
) -> list[dict]:
    """
    Compares a new report's text against a list of existing reports and returns
    those whose semantic similarity exceeds the threshold.

    Args:
        new_text:         The description of the incoming report.
        existing_reports: List of dicts, each with at least "id" and "text" keys.
                          "text" should be the original_description of the report.
        threshold:        Minimum cosine similarity to flag as a duplicate.
                          Defaults to DUPLICATE_THRESHOLD env var (0.75).

    Returns:
        List of dicts for each similar report:
          [{"id": "uuid", "text": "...", "similarity": 0.82}, …]
        Sorted by similarity descending. Empty list if none found.
    """
    if not new_text or not new_text.strip():
        return []

    if not existing_reports:
        return []

    cutoff = threshold if threshold is not None else _get_threshold()

    try:
        from sklearn.metrics.pairwise import cosine_similarity  # type: ignore

        new_vec = get_embedding(new_text.strip()).reshape(1, -1)

        results: list[dict] = []
        for report in existing_reports:
            rid   = report.get("id", "")
            rtext = report.get("text", "")
            if not rtext or not rid:
                continue

            existing_vec = get_embedding(rtext.strip()).reshape(1, -1)

            # cosine_similarity returns a 2-D array [[score]]
            score = float(cosine_similarity(new_vec, existing_vec)[0][0])

            if score >= cutoff:
                results.append({
                    "id":         rid,
                    "text":       rtext[:200],  # truncate for safety
                    "similarity": round(score, 4),
                })

        # Highest similarity first
        results.sort(key=lambda r: r["similarity"], reverse=True)
        return results

    except Exception as exc:
        logger.warning("Duplicate detection failed: %s", exc)
        return []
