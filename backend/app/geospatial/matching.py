"""
SENTINEL — Spatio-Temporal & Multi-Factor Report Matching
Evaluates compatibility between two citizen reports across semantic,
geographic, temporal, and categorical dimensions.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
from app.analysis.duplicates import compute_cosine_similarity
from app.geospatial.haversine import haversine_distance, spatial_decay

# Category groups that share high real-world correlation
RELATED_CATEGORIES = [
    {"roadway_flooding", "persistent_standing_water", "other_waterlogging"},
    {"manhole_drain_overflow", "drainage_backup"},
]


def time_decay(
    t1: Optional[datetime],
    t2: Optional[datetime],
    max_hours: float = 72.0,
) -> float:
    """Computes temporal compatibility in [0.0, 1.0] across a time window."""
    if t1 is None or t2 is None:
        return 0.5  # Neutral fallback when time is unspecified

    # Normalize tz-aware vs tz-naive
    if t1.tzinfo is None:
        t1 = t1.replace(tzinfo=timezone.utc)
    if t2.tzinfo is None:
        t2 = t2.replace(tzinfo=timezone.utc)

    diff_seconds = abs((t1 - t2).total_seconds())
    diff_hours = diff_seconds / 3600.0

    if diff_hours >= max_hours:
        return 0.0
    return max(0.0, min(1.0, 1.0 - (diff_hours / max_hours)))


def category_compatibility(c1: Optional[str], c2: Optional[str]) -> float:
    """Computes categorical correlation score between two report classifications."""
    if not c1 or not c2:
        return 0.3
    if c1 == c2:
        return 1.0
    if c1 == "uncertain" or c2 == "uncertain":
        return 0.4
    for group in RELATED_CATEGORIES:
        if c1 in group and c2 in group:
            return 0.6
    return 0.2


def compute_pair_match(
    rep_a: Any,
    rep_b: Any,
    radius_meters: float = 300.0,
    time_window_hours: float = 72.0,
) -> Tuple[float, Dict[str, Any], bool]:
    """
    Computes weighted multi-factor match score between two reports.
    Formula: 0.40 * semantic + 0.30 * geographic + 0.15 * time + 0.15 * category.
    Returns: (match_score, match_reasons, is_independent)
    """
    # 1. Semantic similarity
    sem_score = compute_cosine_similarity(
        rep_a.original_description, rep_b.original_description
    )

    # 2. Geographic compatibility
    has_coords = (
        rep_a.latitude is not None
        and rep_a.longitude is not None
        and rep_b.latitude is not None
        and rep_b.longitude is not None
    )
    if has_coords:
        dist_m = haversine_distance(
            rep_a.latitude, rep_a.longitude, rep_b.latitude, rep_b.longitude
        )
        geo_score = spatial_decay(dist_m, radius_meters=radius_meters)
    else:
        dist_m = None
        geo_score = 0.0

    # 3. Temporal compatibility
    time_a = rep_a.observed_at or rep_a.submitted_at
    time_b = rep_b.observed_at or rep_b.submitted_at
    time_score = time_decay(time_a, time_b, max_hours=time_window_hours)

    # 4. Category compatibility
    cat_score = category_compatibility(rep_a.category, rep_b.category)

    # Weighted synthesis (0.40 sem + 0.30 geo + 0.15 time + 0.15 cat)
    total_score = (
        0.40 * sem_score
        + 0.30 * geo_score
        + 0.15 * time_score
        + 0.15 * cat_score
    )
    total_score = round(min(1.0, max(0.0, total_score)), 4)

    # Independence determination: near-duplicate if semantic >= 0.85, dist <= 50m, diff <= 1h
    time_diff_hours = (
        abs((time_a - time_b).total_seconds()) / 3600.0
        if time_a and time_b
        else 999.0
    )
    is_near_dup = (
        sem_score >= 0.85
        and dist_m is not None
        and dist_m <= 50.0
        and time_diff_hours <= 1.0
    )
    is_independent = not is_near_dup

    reasons = {
        "semantic_similarity": round(sem_score, 4),
        "distance_meters": round(dist_m, 1) if dist_m is not None else None,
        "geographic_compatibility": round(geo_score, 4),
        "time_compatibility": round(time_score, 4),
        "category_compatibility": round(cat_score, 4),
        "total_match_score": total_score,
        "is_independent": is_independent,
    }

    return total_score, reasons, is_independent
