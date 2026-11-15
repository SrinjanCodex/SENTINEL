"""
SENTINEL — Confidence Score Calculator
Produces a composite 0–1 confidence score for a report analysis result.

The score weighs three independent signals:
  1. Classifier probability   (40%) — how certain was the severity classifier?
  2. Text completeness        (30%) — does the report contain location, depth,
                                      and time information?
  3. Corroboration            (30%) — are there similar existing reports
                                      (duplicates) that confirm this observation?

A human-readable reason string is also produced to explain the score.
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger("sentinel.analysis.confidence")


# ── Weights (must sum to 1.0) ─────────────────────────────────────────────────
_W_CLASSIFIER   = 0.40
_W_COMPLETENESS = 0.30
_W_CORROBORATION = 0.30


def _completeness_score(
    location_hints: list[str],
    water_depth: Optional[str],
    time_hints: list[str],
) -> float:
    """
    Returns a 0–1 score based on how complete the extracted entities are.
    Each signal type contributes 1/3:
      - Has at least one location hint?
      - Has a water depth mention?
      - Has at least one time hint?
    """
    has_location = 1.0 if location_hints else 0.0
    has_depth    = 1.0 if water_depth    else 0.0
    has_time     = 1.0 if time_hints     else 0.0
    return (has_location + has_depth + has_time) / 3.0


def _corroboration_score(duplicate_count: int) -> float:
    """
    Returns a 0–1 score from the number of corroborating (similar) reports.
    Saturates at 3 duplicates (3+ duplicates → full 1.0 corroboration).
    """
    return min(duplicate_count / 3.0, 1.0)


def _build_reason(
    classifier_prob: float,
    location_hints: list[str],
    water_depth: Optional[str],
    time_hints: list[str],
    duplicate_count: int,
    score: float,
) -> str:
    """
    Builds a human-readable explanation for the confidence score.
    """
    parts: list[str] = []

    # Classifier signal
    if classifier_prob >= 0.80:
        parts.append(f"Classifier highly confident ({classifier_prob:.0%})")
    elif classifier_prob >= 0.50:
        parts.append(f"Classifier moderately confident ({classifier_prob:.0%})")
    elif classifier_prob > 0.0:
        parts.append(f"Classifier uncertain ({classifier_prob:.0%})")
    else:
        parts.append("Severity classifier unavailable")

    # Completeness signals
    if location_hints:
        parts.append(f"location identified ({location_hints[0]!r})")
    else:
        parts.append("no location hint found")

    if water_depth:
        parts.append(f"depth reported ({water_depth})")
    else:
        parts.append("no depth reported")

    if time_hints:
        parts.append(f"time context present ({time_hints[0]!r})")

    # Corroboration
    if duplicate_count == 0:
        parts.append("no corroborating reports")
    elif duplicate_count == 1:
        parts.append("1 corroborating report")
    else:
        parts.append(f"{duplicate_count} corroborating reports")

    return "; ".join(parts) + f" → score {score:.2f}"


def compute_confidence(
    classifier_prob: float,
    text: str,
    location_hints: list[str],
    water_depth: Optional[str],
    time_hints: list[str],
    duplicates: list[dict],
) -> dict:
    """
    Computes a composite confidence score for one analysed report.

    Args:
        classifier_prob:  The probability (0–1) returned by the severity classifier.
        text:             The raw report description (used for future signals).
        location_hints:   List of extracted location strings.
        water_depth:      Extracted depth string, or None.
        time_hints:       List of extracted time strings.
        duplicates:       List of duplicate-report dicts from find_duplicates().

    Returns:
        {
          "score": 0.72,      # float 0–1 (rounded to 4 dp)
          "reason": "..."     # human-readable explanation
        }
    """
    # Clamp classifier_prob to [0, 1] defensively
    cp = max(0.0, min(1.0, float(classifier_prob)))

    completeness  = _completeness_score(location_hints, water_depth, time_hints)
    corroboration = _corroboration_score(len(duplicates))

    raw_score = (
        _W_CLASSIFIER    * cp             +
        _W_COMPLETENESS  * completeness   +
        _W_CORROBORATION * corroboration
    )

    score = round(max(0.0, min(1.0, raw_score)), 4)
    reason = _build_reason(cp, location_hints, water_depth, time_hints, len(duplicates), score)

    return {"score": score, "reason": reason}
