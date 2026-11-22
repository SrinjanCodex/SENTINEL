"""
SENTINEL — Multi-Factor Incident Prioritisation Engine
Computes calibrated 0–100 prioritisation scores across six weighted civic factors
with graceful handling and re-normalization for missing factors.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

BASE_WEIGHTS = {
    "severity": 0.25,
    "independent_reports": 0.20,
    "evidence_strength": 0.15,
    "historical_recurrence": 0.15,
    "environmental_context": 0.15,
    "recency": 0.10,
}

HISTORICAL_HOTSPOTS = [
    "park street",
    "college street",
    "central avenue",
    "strand road",
    "bbd bagh",
    "mg road",
    "thanthania",
    "camac street",
]

SEVERITY_MAP = {
    "critical": 1.0,
    "high": 0.75,
    "moderate": 0.5,
    "low": 0.25,
    "uncertain": 0.25,
}

CATEGORY_RISK_MAP = {
    "water_entering_building": 1.0,
    "water_accumulation_on_roads": 0.85,
    "roadway_flooding": 0.85,
    "suspected_drainage_blockage": 0.70,
    "persistent_standing_water": 0.60,
    "other_waterlogging": 0.40,
    "uncertain": 0.25,
}


def calculate_priority_score(incident: Any) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Computes 0–100 priority score for an Incident object and returns:
    (score, list_of_factor_breakdown_dicts).
    """
    reports = [link.report for link in incident.report_links if link.report]

    factors_data: Dict[str, Optional[Tuple[float, float, str]]] = {}

    # 1. Severity factor
    max_sev_norm = 0.3
    raw_sev = 1.0
    for r in reports:
        if r.reported_severity is not None:
            norm = (max(1, min(5, r.reported_severity)) - 1) / 4.0
            if norm > max_sev_norm:
                max_sev_norm = norm
                raw_sev = float(r.reported_severity)
        elif r.analysis and r.analysis.severity:
            norm = SEVERITY_MAP.get(r.analysis.severity.lower(), 0.3)
            if norm > max_sev_norm:
                max_sev_norm = norm
                raw_sev = norm * 4.0 + 1.0
    factors_data["severity"] = (raw_sev, max_sev_norm, f"Peak severity level {raw_sev:.1f}/5")

    # 2. Independent reports factor
    indep_count = sum(1 for link in incident.report_links if link.is_independent)
    indep_norm = min(1.0, indep_count / 3.0)
    factors_data["independent_reports"] = (
        float(indep_count),
        indep_norm,
        f"{indep_count} independent citizen observation{'s' if indep_count != 1 else ''}",
    )

    # 3. Evidence strength factor
    has_photo = any(bool(r.photo_reference) for r in reports)
    analyses = [r.analysis for r in reports if r.analysis and r.analysis.confidence_score is not None]
    avg_conf = sum(a.confidence_score for a in analyses) / len(analyses) if analyses else 0.5
    evidence_norm = (0.5 if has_photo else 0.0) + (0.5 * avg_conf)
    factors_data["evidence_strength"] = (
        evidence_norm * 100.0,
        evidence_norm,
        f"Photo: {'Yes' if has_photo else 'No'}; NLP confidence: {avg_conf:.0%}",
    )

    # 4. Historical recurrence factor
    text_corpus = " ".join(
        [(r.address or "") + " " + (r.original_description or "") for r in reports]
    ).lower()
    is_known_hotspot = any(h in text_corpus for h in HISTORICAL_HOTSPOTS)
    hist_norm = 0.85 if is_known_hotspot else 0.35
    factors_data["historical_recurrence"] = (
        hist_norm * 10.0,
        hist_norm,
        "Known historical monsoon waterlogging zone" if is_known_hotspot else "Standard urban catchment area",
    )

    # 5. Environmental context factor
    categories = [r.category for r in reports if r.category]
    max_cat_risk = max((CATEGORY_RISK_MAP.get(c, 0.4) for c in categories), default=0.4)
    factors_data["environmental_context"] = (
        max_cat_risk * 10.0,
        max_cat_risk,
        f"Environmental vulnerability risk ({max_cat_risk:.2f})",
    )

    # 6. Recency factor
    now = datetime.now(timezone.utc)
    obs_time = incident.last_observed_at or incident.created_at or now
    if obs_time.tzinfo is None:
        obs_time = obs_time.replace(tzinfo=timezone.utc)
    age_hours = max(0.0, (now - obs_time).total_seconds() / 3600.0)
    if age_hours <= 1.0:
        rec_norm = 1.0
    elif age_hours <= 6.0:
        rec_norm = 0.8
    elif age_hours <= 24.0:
        rec_norm = 0.6
    elif age_hours <= 72.0:
        rec_norm = 0.3
    else:
        rec_norm = 0.1
    factors_data["recency"] = (age_hours, rec_norm, f"Observed {age_hours:.1f} hours ago")

    # Re-normalize weights across present factors
    active_factors = {k: v for k, v in factors_data.items() if v is not None}
    total_active_weight = sum(BASE_WEIGHTS[k] for k in active_factors) or 1.0

    breakdown = []
    total_score = 0.0

    for name, (raw_val, norm_val, desc) in active_factors.items():
        base_w = BASE_WEIGHTS[name]
        adjusted_w = base_w / total_active_weight
        contribution = round(adjusted_w * norm_val * 100.0, 1)
        total_score += contribution
        breakdown.append({
            "name": name,
            "raw_value": round(raw_val, 2),
            "normalised_value": round(norm_val, 4),
            "weight": round(adjusted_w, 4),
            "contribution": contribution,
            "description": desc,
        })

    final_score = round(min(100.0, max(0.0, total_score)), 1)
    return final_score, breakdown
