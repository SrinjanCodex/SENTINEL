"""
SENTINEL — Potential Incident Endpoints
Handles listing, detail views, geospatial clustering, multi-factor prioritization,
missing-signal gap detection, and human verification workflows.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Incident, MissingSignal, PriorityAssessment, VerificationRecord
from app.geospatial.haversine import calculate_bounding_radius, haversine_distance
from app.geospatial.clustering import cluster_reports
from app.prioritisation.scoring import calculate_priority_score
from app.prioritisation.missing_signals import detect_missing_signals
from app.schemas import (
    ClusteringResponse,
    IncidentDetailResponse,
    IncidentResponse,
    LinkedReportDetail,
    MissingSignalResponse,
    PaginatedIncidentsResponse,
    PriorityAssessmentResponse,
    ScoringFactorSchema,
    VerificationRecordResponse,
    VerificationRequest,
)

router = APIRouter(prefix="/incidents", tags=["Potential Incidents"])


def _assess_and_sync_incident(inc: Incident, db: Session) -> None:
    """Evaluates multi-factor priority score and missing signals, persisting to DB."""
    now = datetime.now(timezone.utc)
    score, factors = calculate_priority_score(inc)
    inc.priority_score = score
    inc.last_analysed_at = now

    # Upsert PriorityAssessment
    assessment = db.query(PriorityAssessment).filter_by(incident_id=inc.id).first()
    if not assessment:
        assessment = PriorityAssessment(
            incident_id=inc.id,
            score=score,
            factors=factors,
            formula_version="1.1.0",
            computed_at=now,
        )
        db.add(assessment)
    else:
        assessment.score = score
        assessment.factors = factors
        assessment.computed_at = now

    # Refresh Missing Signals
    db.query(MissingSignal).filter_by(incident_id=inc.id).delete()
    flags = detect_missing_signals(inc)
    for flag in flags:
        ms = MissingSignal(
            incident_id=inc.id,
            rule_id=flag["rule_id"],
            severity=flag["severity"],
            explanation=flag["explanation"],
            recommended_action=flag["recommended_action"],
            computed_at=now,
        )
        db.add(ms)

    db.commit()


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
    # Sync assessments for all formed/updated incidents
    for inc_id in res.get("incident_ids", []):
        inc = db.query(Incident).filter(Incident.id == inc_id).first()
        if inc:
            _assess_and_sync_incident(inc, db)

    return ClusteringResponse(
        status="success",
        clusters_count=res.get("clusters_count", 0),
        clusters_created=res.get("clusters_created", 0),
        clusters_updated=res.get("clusters_updated", 0),
        reports_linked=res.get("reports_linked", 0),
        incident_ids=res.get("incident_ids", []),
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


@router.get("/export/geojson")
def export_incidents_geojson(db: Session = Depends(get_db)):
    """Exports all clustered incident hypotheses as GeoJSON FeatureCollection."""
    incidents = (
        db.query(Incident)
        .filter(Incident.centroid_latitude.isnot(None), Incident.centroid_longitude.isnot(None))
        .all()
    )
    features = []
    for inc in incidents:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [inc.centroid_longitude, inc.centroid_latitude],
            },
            "properties": {
                "id": inc.id,
                "title": inc.title,
                "verification_status": inc.verification_status,
                "priority_score": inc.priority_score,
                "report_count": len(inc.report_links),
                "created_at": inc.created_at.isoformat() if inc.created_at else None,
            },
        })
    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentDetailResponse:
    """Retrieves single incident with enriched linked report details, priority factors, and audit gaps."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' was not found.",
        )

    # Sync assessment to ensure fresh factors & signals
    _assess_and_sync_incident(inc, db)

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

    priority_resp = None
    if inc.priority_assessment:
        factor_items = [
            ScoringFactorSchema(
                name=f.get("name", ""),
                raw_value=f.get("raw_value", 0.0),
                normalised_value=f.get("normalised_value", 0.0),
                weight=f.get("weight", 0.0),
                contribution=f.get("contribution", 0.0),
                description=f.get("description"),
            )
            for f in (inc.priority_assessment.factors or [])
        ]
        priority_resp = PriorityAssessmentResponse(
            id=inc.priority_assessment.id,
            incident_id=inc.id,
            score=inc.priority_assessment.score,
            factors=factor_items,
            formula_version=inc.priority_assessment.formula_version,
            computed_at=inc.priority_assessment.computed_at,
        )

    signal_items = [
        MissingSignalResponse(
            id=s.id,
            incident_id=s.incident_id,
            rule_id=s.rule_id,
            severity=s.severity,
            explanation=s.explanation,
            recommended_action=s.recommended_action,
            computed_at=s.computed_at,
        )
        for s in inc.missing_signals
    ]

    record_items = [
        VerificationRecordResponse(
            id=v.id,
            incident_id=v.incident_id,
            previous_status=v.previous_status,
            new_status=v.new_status,
            changed_by=v.changed_by,
            timestamp=v.timestamp,
            note=v.note,
        )
        for v in inc.verification_records
    ]

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
        priority_assessment=priority_resp,
        missing_signals=signal_items,
        verification_records=record_items,
    )


@router.get("/{incident_id}/priority", response_model=PriorityAssessmentResponse)
def get_incident_priority(incident_id: str, db: Session = Depends(get_db)) -> PriorityAssessmentResponse:
    """Retrieves multi-factor score breakdown for an incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    _assess_and_sync_incident(inc, db)
    pa = inc.priority_assessment
    factor_items = [
        ScoringFactorSchema(
            name=f.get("name", ""),
            raw_value=f.get("raw_value", 0.0),
            normalised_value=f.get("normalised_value", 0.0),
            weight=f.get("weight", 0.0),
            contribution=f.get("contribution", 0.0),
            description=f.get("description"),
        )
        for f in (pa.factors or [])
    ]
    return PriorityAssessmentResponse(
        id=pa.id,
        incident_id=inc.id,
        score=pa.score,
        factors=factor_items,
        formula_version=pa.formula_version,
        computed_at=pa.computed_at,
    )


@router.get("/{incident_id}/missing-signals", response_model=List[MissingSignalResponse])
def get_incident_missing_signals(incident_id: str, db: Session = Depends(get_db)) -> List[MissingSignalResponse]:
    """Retrieves deterministic missing signal flags for an incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    _assess_and_sync_incident(inc, db)
    return [
        MissingSignalResponse(
            id=s.id,
            incident_id=s.incident_id,
            rule_id=s.rule_id,
            severity=s.severity,
            explanation=s.explanation,
            recommended_action=s.recommended_action,
            computed_at=s.computed_at,
        )
        for s in inc.missing_signals
    ]


@router.patch("/{incident_id}/verification", response_model=IncidentDetailResponse)
def record_verification(
    incident_id: str,
    payload: VerificationRequest,
    db: Session = Depends(get_db),
) -> IncidentDetailResponse:
    """Records human inspection verification, transitions status, and adds audit entry."""
    valid_statuses = {"suspected", "under_verification", "verified", "dismissed", "resolved"}
    if payload.new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification status '{payload.new_status}'. Must be one of {valid_statuses}.",
        )

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    prev_status = inc.verification_status
    inc.verification_status = payload.new_status

    record = VerificationRecord(
        incident_id=inc.id,
        previous_status=prev_status,
        new_status=payload.new_status,
        changed_by=payload.changed_by,
        note=payload.note,
    )
    db.add(record)
    db.commit()

    return get_incident(incident_id, db)
