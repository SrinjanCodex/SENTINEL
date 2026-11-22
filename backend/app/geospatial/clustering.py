"""
SENTINEL — Spatio-Temporal Clustering & Incident Formation Engine
Clusters geo-referenced citizen reports into incident hypotheses using
connected-component graph clustering based on multi-factor pair matching.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.models import Incident, IncidentReport, Report
from app.geospatial.haversine import (
    calculate_bounding_radius,
    calculate_centroid,
    haversine_distance,
)
from app.geospatial.matching import compute_pair_match


def cluster_reports(
    db: Session,
    radius_meters: float = 300.0,
    min_match_score: float = 0.60,
    time_window_hours: float = 72.0,
) -> Dict[str, Any]:
    """
    Executes connected-component clustering on all active geo-referenced reports.
    Updates or creates Incident and IncidentReport records.
    """
    now = datetime.now(timezone.utc)
    # 1. Fetch eligible reports (must have valid coordinates and not dismissed)
    reports = (
        db.query(Report)
        .filter(Report.latitude.isnot(None), Report.longitude.isnot(None))
        .filter(Report.status != "dismissed")
        .order_by(Report.submitted_at.desc())
        .all()
    )

    if not reports:
        return {
            "clusters_count": 0,
            "clusters_created": 0,
            "clusters_updated": 0,
            "reports_linked": 0,
            "incident_ids": [],
        }

    n = len(reports)
    # Adjacency list for connected components
    adj: Dict[int, List[int]] = {i: [] for i in range(n)}
    pair_metrics: Dict[tuple, tuple] = {}

    for i in range(n):
        for j in range(i + 1, n):
            rep_a = reports[i]
            rep_b = reports[j]
            dist = haversine_distance(
                rep_a.latitude, rep_a.longitude, rep_b.latitude, rep_b.longitude
            )
            if dist <= radius_meters:
                score, reasons, is_ind = compute_pair_match(
                    rep_a, rep_b, radius_meters=radius_meters, time_window_hours=time_window_hours
                )
                if score >= min_match_score:
                    adj[i].append(j)
                    adj[j].append(i)
                    pair_metrics[(i, j)] = (score, reasons, is_ind)
                    pair_metrics[(j, i)] = (score, reasons, is_ind)

    # 2. Extract connected components
    visited = [False] * n
    components: List[List[int]] = []

    for i in range(n):
        if not visited[i]:
            comp = []
            queue = [i]
            visited[i] = True
            while queue:
                curr = queue.pop(0)
                comp.append(curr)
                for neighbor in adj[curr]:
                    if not visited[neighbor]:
                        visited[neighbor] = True
                        queue.append(neighbor)
            components.append(comp)

    # 3. Form or update incidents
    clusters_created = 0
    clusters_updated = 0
    reports_linked_count = 0
    resulting_incidents = []

    for comp in components:
        comp_reports = [reports[idx] for idx in comp]
        coords = [(r.latitude, r.longitude) for r in comp_reports]
        c_lat, c_lon = calculate_centroid(coords)
        bounding_radius = calculate_bounding_radius(c_lat, c_lon, coords)

        # Observations time boundaries
        times = [r.observed_at or r.submitted_at for r in comp_reports]
        first_obs = min(times) if times else now
        last_obs = max(times) if times else now

        # Derive dominant category and address for title
        categories = [r.category for r in comp_reports]
        dominant_cat = max(set(categories), key=categories.count)
        address_hint = comp_reports[0].address or f"Ward Area ({c_lat:.4f}, {c_lon:.4f})"
        title = f"{dominant_cat.replace('_', ' ').title()} near {address_hint}"

        # Heuristic baseline priority: reports count & maximum reported severity
        base_priority = min(100.0, len(comp_reports) * 20.0 + 25.0)

        # Find existing incident containing any of these reports
        rep_ids = {r.id for r in comp_reports}
        existing_inc = (
            db.query(Incident)
            .join(IncidentReport, Incident.id == IncidentReport.incident_id)
            .filter(IncidentReport.report_id.in_(rep_ids))
            .first()
        )

        if existing_inc:
            incident = existing_inc
            incident.title = title
            incident.centroid_latitude = c_lat
            incident.centroid_longitude = c_lon
            incident.first_observed_at = first_obs
            incident.last_observed_at = last_obs
            incident.last_analysed_at = now
            incident.priority_score = max(incident.priority_score or 0.0, base_priority)
            clusters_updated += 1
        else:
            incident = Incident(
                title=title,
                centroid_latitude=c_lat,
                centroid_longitude=c_lon,
                first_observed_at=first_obs,
                last_observed_at=last_obs,
                verification_status="suspected",
                last_analysed_at=now,
                analysis_version="1.1.0",
                priority_score=base_priority,
            )
            db.add(incident)
            db.flush()
            clusters_created += 1

        # Link member reports
        for r_idx in comp:
            r = reports[r_idx]
            # Determine match score relative to cluster centroid or peers
            peer_scores = [
                pair_metrics[(r_idx, other_idx)][0]
                for other_idx in comp
                if (r_idx, other_idx) in pair_metrics
            ]
            avg_score = sum(peer_scores) / len(peer_scores) if peer_scores else 1.0

            link = (
                db.query(IncidentReport)
                .filter_by(incident_id=incident.id, report_id=r.id)
                .first()
            )
            if not link:
                link = IncidentReport(
                    incident_id=incident.id,
                    report_id=r.id,
                    match_score=round(avg_score, 4),
                    match_reasons={
                        "distance_from_centroid": round(
                            haversine_distance(c_lat, c_lon, r.latitude, r.longitude), 1
                        ),
                        "cluster_size": len(comp_reports),
                    },
                    is_independent=True,
                    added_by="system",
                )
                db.add(link)
                reports_linked_count += 1

            if r.status == "unverified":
                r.status = "linked"

        resulting_incidents.append(incident.id)

    db.commit()

    return {
        "clusters_count": len(components),
        "clusters_created": clusters_created,
        "clusters_updated": clusters_updated,
        "reports_linked": reports_linked_count,
        "incident_ids": resulting_incidents,
    }
