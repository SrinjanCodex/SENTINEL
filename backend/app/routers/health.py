"""
SENTINEL — Health & Dashboard Telemetry Endpoints
Provides system health status and real database aggregation metrics.
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config import ENVIRONMENT
from app.database import get_db
from app.models import Report, Incident
from app.schemas import HealthResponse, DashboardStatsResponse

router = APIRouter(tags=["System & Telemetry"])


@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)) -> HealthResponse:
    """Verifies backend application status and database connectivity."""
    db_status = "connected"
    try:
        # Simple test query
        db.execute(func.now())
    except Exception:
        db_status = "disconnected"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version="1.0.0",
        database=db_status,
        environment=ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)) -> DashboardStatsResponse:
    """
    Computes live dashboard statistics directly from the database.
    """
    total_reports = db.query(func.count(Report.id)).scalar() or 0
    potential_incidents = db.query(func.count(Incident.id)).scalar() or 0
    awaiting_verification = (
        db.query(func.count(Incident.id))
        .filter(Incident.verification_status.in_(["suspected", "under_verification"]))
        .scalar()
        or 0
    )
    high_priority = (
        db.query(func.count(Incident.id))
        .filter(Incident.priority_score >= 70.0)
        .scalar()
        or 0
    )

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    reports_last_7_days = (
        db.query(func.count(Report.id))
        .filter(Report.submitted_at >= seven_days_ago)
        .scalar()
        or 0
    )

    # If all existing reports are marked synthetic or no reports exist yet, flag as demonstration
    real_reports_count = (
        db.query(func.count(Report.id))
        .filter(Report.is_synthetic == False)  # noqa: E712
        .scalar()
        or 0
    )
    is_demonstration = real_reports_count == 0

    return DashboardStatsResponse(
        total_reports=total_reports,
        potential_incidents=potential_incidents,
        awaiting_verification=awaiting_verification,
        high_priority_incidents=high_priority,
        reports_last_7_days=reports_last_7_days,
        is_demonstration=is_demonstration,
    )


@router.get("/system/info")
def get_system_info():
    """Returns runtime parameters, thresholds, and milestone capability status."""
    return {
        "service": "SENTINEL — Urban Waterlogging Intelligence Platform",
        "milestone": 2,
        "capabilities": {
            "frontend_foundation": "operational",
            "relational_database": "operational",
            "report_ingestion": "operational",
            "secure_uploads": "operational",
            "ai_matching_engine": "planned_milestone_3",
            "spatial_clustering": "planned_milestone_4",
            "priority_scoring": "planned_milestone_5",
        },
        "thresholds": {
            "max_upload_size_mb": 5,
            "high_priority_cutoff": 70.0,
            "suspected_cluster_radius_meters": 300,
        },
    }
