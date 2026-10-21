"""
SENTINEL — Potential Incident Endpoints
Handles listing and detail views for grouped incident clusters.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Incident
from app.schemas import (
    IncidentResponse,
    PaginatedIncidentsResponse,
)

router = APIRouter(prefix="/incidents", tags=["Potential Incidents"])


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
            )
        )

    return PaginatedIncidentsResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentResponse:
    """Retrieves single incident with linked report identifiers."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' was not found.",
        )

    rep_ids = [link.report_id for link in inc.report_links]
    return IncidentResponse(
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
    )
