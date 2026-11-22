"""
SENTINEL — Deterministic Missing-Signal Detector
Evaluates 8 audit rules against incident evidence to identify intelligence gaps.
"""
from typing import Any, Dict, List, Optional


def check_ms_loc(incident: Any) -> Optional[Dict[str, str]]:
    """MS-LOC (High): Missing GPS coordinates or coarse address."""
    if incident.centroid_latitude is None or incident.centroid_longitude is None:
        return {
            "rule_id": "MS-LOC",
            "severity": "high",
            "explanation": "Cluster lacks confirmed centroid GPS coordinates. Field teams cannot route navigation.",
            "recommended_action": "Request geocoded coordinate confirmation from local municipal ward office.",
        }
    reports = [link.report for link in incident.report_links if link.report]
    if any(r.latitude is None or r.longitude is None for r in reports):
        return {
            "rule_id": "MS-LOC",
            "severity": "high",
            "explanation": "One or more member reports have unconfirmed street locations.",
            "recommended_action": "Dispatch ward surveyor or cross-reference street address mentions.",
        }
    return None


def check_ms_time(incident: Any) -> Optional[Dict[str, str]]:
    """MS-TIME (Medium): Observation time missing from any report."""
    reports = [link.report for link in incident.report_links if link.report]
    if any(r.observed_at is None for r in reports):
        return {
            "rule_id": "MS-TIME",
            "severity": "medium",
            "explanation": "One or more observations omit an explicit event timestamp.",
            "recommended_action": "Prompt citizen observer for estimated water onset timing.",
        }
    return None


def check_ms_conflict(incident: Any) -> Optional[Dict[str, str]]:
    """MS-CONFLICT (High): Contradictory categories or severity in the same cluster."""
    reports = [link.report for link in incident.report_links if link.report]
    severities = [r.reported_severity for r in reports if r.reported_severity is not None]
    if severities and (max(severities) - min(severities)) >= 3:
        return {
            "rule_id": "MS-CONFLICT",
            "severity": "high",
            "explanation": f"Large severity discrepancy ({min(severities)}/5 vs {max(severities)}/5) across citizen observations.",
            "recommended_action": "Conduct immediate phone or visual verification to clarify actual flood level.",
        }
    return None


def check_ms_indep(incident: Any) -> Optional[Dict[str, str]]:
    """MS-INDEP (High): Fewer than 2 independent corroborating reports."""
    indep_count = sum(1 for link in incident.report_links if link.is_independent)
    if indep_count < 2:
        return {
            "rule_id": "MS-INDEP",
            "severity": "high",
            "explanation": f"Only {indep_count} independent observation recorded. Incident hypothesis requires corroboration.",
            "recommended_action": "Monitor incoming telemetry for independent neighborhood confirmations.",
        }
    return None


def check_ms_verify(incident: Any) -> Optional[Dict[str, str]]:
    """MS-VERIFY (High): No human inspection verification recorded."""
    if incident.verification_status == "suspected":
        return {
            "rule_id": "MS-VERIFY",
            "severity": "high",
            "explanation": "No on-site human inspection verification has been logged for this anomaly.",
            "recommended_action": "Assign ward engineer or quick response team to log field inspection.",
        }
    return None


def check_ms_hist(incident: Any) -> Optional[Dict[str, str]]:
    """MS-HIST (Medium): No historical baseline recorded for this area."""
    reports = [link.report for link in incident.report_links if link.report]
    text = " ".join([(r.address or "") for r in reports]).lower()
    from app.prioritisation.scoring import HISTORICAL_HOTSPOTS
    if not any(h in text for h in HISTORICAL_HOTSPOTS):
        return {
            "rule_id": "MS-HIST",
            "severity": "medium",
            "explanation": "Location is outside documented historical monsoon waterlogging hotspots.",
            "recommended_action": "Consult municipal stormwater drainage maps for pipe capacity assessment.",
        }
    return None


def check_ms_wx(incident: Any) -> Optional[Dict[str, str]]:
    """MS-WX (Medium): Weather data unavailable or stale."""
    has_wx = any(
        e.type == "weather_observation" and e.supports
        for e in incident.evidence_items
    )
    if not has_wx:
        return {
            "rule_id": "MS-WX",
            "severity": "medium",
            "explanation": "Live IMD Doppler radar or automated rain gauge telemetry is unlinked for this catchment.",
            "recommended_action": "Query regional meteorological precipitation stations for 3-hour rainfall totals.",
        }
    return None


def check_ms_photo(incident: Any) -> Optional[Dict[str, str]]:
    """MS-PHOTO (Low): No photographic evidence attached."""
    reports = [link.report for link in incident.report_links if link.report]
    has_photo = any(bool(r.photo_reference) for r in reports)
    if not has_photo:
        return {
            "rule_id": "MS-PHOTO",
            "severity": "low",
            "explanation": "No photographic imagery uploaded with citizen reports.",
            "recommended_action": "Encourage citizen reporters to submit timestamped water depth photo.",
        }
    return None


RULES = [
    check_ms_loc,
    check_ms_time,
    check_ms_conflict,
    check_ms_indep,
    check_ms_verify,
    check_ms_hist,
    check_ms_wx,
    check_ms_photo,
]


def detect_missing_signals(incident: Any) -> List[Dict[str, str]]:
    """Runs all 8 deterministic rules against an Incident and returns flagged gaps."""
    flags = []
    for rule_fn in RULES:
        res = rule_fn(incident)
        if res:
            flags.append(res)
    return flags
