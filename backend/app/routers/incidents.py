"""
SENTINEL — Potential Incident Endpoints
Handles listing, detail views, and geospatial clustering for incident hypotheses.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Incident
from app.geospatial.haversine import calculate_bounding_radius, haversine_distance
from app.geospatial.clustering import cluster_reports
from app.schemas import (
    ClusteringResponse,
    IncidentDetailResponse,
    IncidentResponse,
    LinkedReportDetail,
    PaginatedIncidentsResponse,
)

router = APIRouter(prefix="/incidents", tags=["Potential Incidents"])


@router.post("/cluster", response_model=ClusteringResponse)
def trigger_clustering(
    radius_meters: float = Query(300.0, ge=50.0, le=2000.0),
    min_match_score: float = Query(0.60, ge=0.1, le=1.0),
    time_window_hours: float = Query(72.0, ge=1.0, le=720.0),
    db: Session = Depends(get_db),
) -> ClusteringResponse:
    """Executes spatio-temporal clustering to group reports into incident hypotheses."""
    res = cluster_reports(
        db,
        radius_meters=radius_meters,
        min_match_score=min_match_score,
        time_window_hours=time_window_hours,
    )
    return ClusteringResponse(
        status="success",
        clusters_count=res["clusters_count"],
        clusters_created=res["clusters_created"],
        clusters_updated=res["clusters_updated"],
        reports_linked=res["reports_linked"],
        incident_ids=res["incident_ids"],
    )


@router.get("", response_model=PaginatedIncidentsResponse)
def list_incidents(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by verification_status"),
    db: Session = Depends(get_db),
) -> PaginatedIncidentsResponse:
    """Retrieves paginated list of potential incidents."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.verification_status == status)

    total = query.count()
    incidents = (
        query.order_by(Incident.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    items = []
    for inc in incidents:
        rep_ids = [link.report_id for link in inc.report_links]
        coords = [
            (link.report.latitude, link.report.longitude)
            for link in inc.report_links
            if link.report and link.report.latitude is not None and link.report.longitude is not None
        ]
        radius = (
            calculate_bounding_radius(inc.centroid_latitude, inc.centroid_longitude, coords)
            if (inc.centroid_latitude and coords)
            else 100.0
        )
        items.append(
            IncidentResponse(
                id=inc.id,
                title=inc.title,
                centroid_latitude=inc.centroid_latitude,
                centroid_longitude=inc.centroid_longitude,
                first_observed_at=inc.first_observed_at,
                last_observed_at=inc.last_observed_at,
                verification_status=inc.verification_status,
                created_at=inc.created_at,
                last_analysed_at=inc.last_analysed_at,
                analysis_version=inc.analysis_version,
                priority_score=inc.priority_score,
                report_ids=rep_ids,
                radius_meters=round(radius, 1),
            )
        )

    return PaginatedIncidentsResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentDetailResponse:
    """Retrieves single incident with enriched linked report details."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' was not found.",
        )

    rep_ids = []
    linked_details = []
    coords = []

    for link in inc.report_links:
        rep_ids.append(link.report_id)
        rep = link.report
        dist = None
        if rep and rep.latitude is not None and rep.longitude is not None:
            coords.append((rep.latitude, rep.longitude))
            if inc.centroid_latitude is not None and inc.centroid_longitude is not None:
                dist = haversine_distance(
                    inc.centroid_latitude, inc.centroid_longitude, rep.latitude, rep.longitude
                )

        linked_details.append(
            LinkedReportDetail(
                report_id=link.report_id,
                match_score=link.match_score,
                match_reasons=link.match_reasons,
                is_independent=link.is_independent,
                added_by=link.added_by,
                distance_from_centroid_meters=round(dist, 1) if dist is not None else None,
                category=rep.category if rep else None,
                original_description=rep.original_description if rep else None,
                address=rep.address if rep else None,
                latitude=rep.latitude if rep else None,
                longitude=rep.longitude if rep else None,
                submitted_at=rep.submitted_at if rep else None,
            )
        )

    radius = (
        calculate_bounding_radius(inc.centroid_latitude, inc.centroid_longitude, coords)
        if (inc.centroid_latitude and coords)
        else 100.0
    )

    return IncidentDetailResponse(
        id=inc.id,
        title=inc.title,
        centroid_latitude=inc.centroid_latitude,
        centroid_longitude=inc.centroid_longitude,
        first_observed_at=inc.first_observed_at,
        last_observed_at=inc.last_observed_at,
        verification_status=inc.verification_status,
        created_at=inc.created_at,
        last_analysed_at=inc.last_analysed_at,
        analysis_version=inc.analysis_version,
        priority_score=inc.priority_score,
        report_ids=rep_ids,
        radius_meters=round(radius, 1),
        linked_reports=linked_details,
    )
