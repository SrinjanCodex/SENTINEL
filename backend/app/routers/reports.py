"""
SENTINEL — Report Intake & Retrieval Endpoints
Handles creation, filtering, pagination, and photo attachment for community reports.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Report
from app.schemas import (
    ReportCreate,
    ReportUpdate,
    ReportResponse,
    PaginatedReportsResponse,
)
from app.uploads import process_and_save_photo

router = APIRouter(prefix="/reports", tags=["Community Reports"])


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
