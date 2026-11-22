"""
SENTINEL — Report Intake & Retrieval Endpoints
Handles creation, filtering, pagination, photo attachment, and automated report analysis.
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Report, ReportAnalysis
from app.schemas import (
    ReportCreate,
    ReportUpdate,
    ReportResponse,
    PaginatedReportsResponse,
    ReportAnalysisResponse,
)
from app.uploads import process_and_save_photo
from app.analysis import (
    classify,
    extract_all,
    find_duplicates,
    compute_confidence,
    get_provider_name,
)

logger = logging.getLogger("sentinel.reports")

router = APIRouter(prefix="/reports", tags=["Community Reports"])


def run_analysis_for_report(report: Report, db: Session) -> ReportAnalysis:
    """
    Executes the Milestone 3 automated analysis pipeline on a Report:
      1. Severity classification (scikit-learn pipeline)
      2. Entity extraction (rule-based: locations, water depth, time hints)
      3. Semantic duplicate detection against recent existing reports
      4. Composite confidence score calculation
      5. Upserts the ReportAnalysis row in SQLite
    """
    text = report.original_description or ""

    # 1. Severity classifier
    clf_result = classify(text)
    severity_label = clf_result.get("label")
    severity_prob = clf_result.get("probability", 0.0)
    all_scores = clf_result.get("all_scores", {})

    # 2. Entity extraction
    extracted = extract_all(text)
    locations = extracted.get("location_hints", [])
    water_depth = extracted.get("water_depth")
    time_hints = extracted.get("time_hints", [])

    # 3. Duplicate detection against other reports (excluding current report)
    existing_reports_query = (
        db.query(Report.id, Report.original_description)
        .filter(Report.id != report.id)
        .order_by(desc(Report.submitted_at))
        .limit(100)
        .all()
    )
    existing_reports = [
        {"id": r.id, "text": r.original_description}
        for r in existing_reports_query
    ]
    duplicates = find_duplicates(text, existing_reports)

    # 4. Composite confidence score
    conf_result = compute_confidence(
        classifier_prob=severity_prob,
        text=text,
        location_hints=locations,
        water_depth=water_depth,
        time_hints=time_hints,
        duplicates=duplicates,
    )

    provider = get_provider_name()

    # 5. Upsert into database
    analysis_record = db.query(ReportAnalysis).filter(ReportAnalysis.report_id == report.id).first()
    if not analysis_record:
        analysis_record = ReportAnalysis(
            report_id=report.id,
            severity=severity_label,
            severity_confidence=severity_prob,
            all_scores=all_scores,
            confidence_score=conf_result.get("score"),
            confidence_reason=conf_result.get("reason"),
            extracted_locations=locations,
            extracted_depth=water_depth,
            extracted_times=time_hints,
            possible_duplicates=duplicates,
            embedding_provider=provider,
            analysed_at=datetime.now(timezone.utc),
        )
        db.add(analysis_record)
    else:
        analysis_record.severity = severity_label
        analysis_record.severity_confidence = severity_prob
        analysis_record.all_scores = all_scores
        analysis_record.confidence_score = conf_result.get("score")
        analysis_record.confidence_reason = conf_result.get("reason")
        analysis_record.extracted_locations = locations
        analysis_record.extracted_depth = water_depth
        analysis_record.extracted_times = time_hints
        analysis_record.possible_duplicates = duplicates
        analysis_record.embedding_provider = provider
        analysis_record.analysed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(analysis_record)
    return analysis_record


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)) -> ReportResponse:
    """
    Ingests a newly submitted community report.
    Assigns an anonymous reporter token and initializes default unverified status.
    """
    new_report = Report(
        original_description=payload.original_description,
        category="uncertain",
        category_confidence=None,
        category_uncertain=True,
        reported_severity=payload.reported_severity,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        observed_at=payload.observed_at,
        submitted_at=datetime.now(timezone.utc),
        status="unverified",
        photo_reference=None,
        is_synthetic=False,
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Automatic background analysis trigger (safe — never blocks or fails report intake)
    try:
        run_analysis_for_report(new_report, db)
        db.refresh(new_report)
    except Exception as exc:
        logger.warning("Auto-analysis failed for new report %s: %s", new_report.id, exc)

    return new_report


@router.get("", response_model=PaginatedReportsResponse)
def list_reports(
    search: Optional[str] = Query(None, description="Free-text search across description and address"),
    category: Optional[str] = Query(None, description="Filter by report category"),
    status: Optional[str] = Query(None, description="Filter by report status"),
    date_from: Optional[datetime] = Query(None, description="Earliest observation or submission time"),
    date_to: Optional[datetime] = Query(None, description="Latest observation or submission time"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedReportsResponse:
    """
    Retrieves reports with filtering, searching, and server-side pagination.
    """
    query = db.query(Report)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Report.original_description.ilike(search_pattern),
                Report.address.ilike(search_pattern),
            )
        )

    if category:
        query = query.filter(Report.category == category)

    if status:
        query = query.filter(Report.status == status)

    if date_from:
        query = query.filter(Report.submitted_at >= date_from)

    if date_to:
        query = query.filter(Report.submitted_at <= date_to)

    total = query.count()
    items = (
        query.order_by(desc(Report.submitted_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return PaginatedReportsResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/export/geojson")
def export_reports_geojson(db: Session = Depends(get_db)):
    """Exports geo-referenced community reports as GeoJSON FeatureCollection."""
    reports = db.query(Report).filter(Report.latitude.isnot(None), Report.longitude.isnot(None)).all()
    features = []
    for r in reports:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [r.longitude, r.latitude],
            },
            "properties": {
                "id": r.id,
                "category": r.category,
                "reported_severity": r.reported_severity,
                "address": r.address,
                "status": r.status,
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
                "is_synthetic": r.is_synthetic,
            },
        })
    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/export/csv")
def export_reports_csv(db: Session = Depends(get_db)):
    """Exports all community reports as standard CSV."""
    import csv
    import io
    from fastapi.responses import Response

    reports = db.query(Report).order_by(Report.submitted_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id",
        "submitted_at",
        "category",
        "reported_severity",
        "latitude",
        "longitude",
        "address",
        "status",
        "is_synthetic",
        "description",
    ])
    for r in reports:
        writer.writerow([
            r.id,
            r.submitted_at.isoformat() if r.submitted_at else "",
            r.category or "",
            r.reported_severity if r.reported_severity is not None else "",
            r.latitude if r.latitude is not None else "",
            r.longitude if r.longitude is not None else "",
            r.address or "",
            r.status or "",
            r.is_synthetic,
            (r.original_description or "").replace("\n", " "),
        ])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="sentinel_reports.csv"'},
    )


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)) -> ReportResponse:
    """Retrieves an individual report by its unique ID."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' was not found.",
        )
    return report


@router.patch("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
) -> ReportResponse:
    """
    Updates permissible mutable fields of an existing report.
    original_description is immutable and cannot be updated.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' was not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if hasattr(report, field):
            setattr(report, field, value)

    report.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return report


@router.post("/upload-photo", status_code=status.HTTP_201_CREATED)
async def upload_photo(file: UploadFile = File(...)):
    """
    Uploads, validates, sanitizes, and strips EXIF metadata from a report photo.
    Returns the secure relative URL and filename.
    """
    filename, relative_url = await process_and_save_photo(file)
    return {
        "filename": filename,
        "url": relative_url,
        "message": "Photo uploaded and EXIF sanitized successfully.",
    }


@router.post("/{report_id}/analyze", response_model=ReportAnalysisResponse)
def trigger_report_analysis(report_id: str, db: Session = Depends(get_db)) -> ReportAnalysisResponse:
    """
    Triggers or re-runs automated NLP/heuristic analysis for a report by ID.
    Returns the severity, confidence score, extracted entities, and potential duplicates.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' was not found.",
        )
    return run_analysis_for_report(report, db)


@router.get("/{report_id}/analysis", response_model=ReportAnalysisResponse)
def get_report_analysis(report_id: str, db: Session = Depends(get_db)) -> ReportAnalysisResponse:
    """
    Retrieves the existing analysis record for a report.
    Returns 404 if the report does not exist or has not yet been analysed.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' was not found.",
        )
    analysis = db.query(ReportAnalysis).filter(ReportAnalysis.report_id == report_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analysis found for report '{report_id}'. Run POST /api/reports/{report_id}/analyze to trigger analysis.",
        )
    return analysis
