"""
SENTINEL — Pydantic Schemas
Defines request validation and response serialization schemas for all API endpoints.
"""
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ReportCreate(BaseModel):
    """Payload submitted to create a new waterlogging report."""
    original_description: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Detailed observation of the waterlogging incident.",
    )
    reported_severity: Optional[int] = Field(
        None,
        ge=1,
        le=5,
        description="Severity index from 1 (minor puddle) to 5 (life-threatening/inaccessible).",
    )
    address: Optional[str] = Field(
        None,
        max_length=255,
        description="Street address, landmark, or neighbourhood name.",
    )
    latitude: Optional[float] = Field(
        None,
        ge=-90.0,
        le=90.0,
        description="WGS84 latitude coordinate in decimal degrees.",
    )
    longitude: Optional[float] = Field(
        None,
        ge=-180.0,
        le=180.0,
        description="WGS84 longitude coordinate in decimal degrees.",
    )
    observed_at: Optional[datetime] = Field(
        None,
        description="Timestamp when the waterlogging was observed.",
    )

    @field_validator("original_description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 10:
            raise ValueError("Description must contain at least 10 non-whitespace characters.")
        return clean


class ReportUpdate(BaseModel):
    """Permitted fields for updating an existing report. original_description cannot be changed."""
    category: Optional[str] = None
    category_confidence: Optional[float] = None
    category_uncertain: Optional[bool] = None
    reported_severity: Optional[int] = Field(None, ge=1, le=5)
    address: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    observed_at: Optional[datetime] = None
    status: Optional[str] = None
    photo_reference: Optional[str] = None


class ReportAnalysisResponse(BaseModel):
    """Complete ReportAnalysis serialization schema."""
    id: str
    report_id: str
    severity: Optional[str] = None
    severity_confidence: Optional[float] = None
    all_scores: Optional[Dict[str, float]] = None
    confidence_score: Optional[float] = None
    confidence_reason: Optional[str] = None
    extracted_locations: List[str] = []
    extracted_depth: Optional[str] = None
    extracted_times: List[str] = []
    possible_duplicates: List[Dict[str, Any]] = []
    embedding_provider: Optional[str] = None
    analysed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportResponse(BaseModel):
    """Complete Report object returned by the API."""
    id: str
    original_description: str
    category: str
    category_confidence: Optional[float] = None
    category_uncertain: bool = True
    reported_severity: Optional[int] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    observed_at: Optional[datetime] = None
    submitted_at: datetime
    status: str
    photo_reference: Optional[str] = None
    reporter_token: str
    is_synthetic: bool = False
    updated_at: datetime
    analysis: Optional[ReportAnalysisResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedReportsResponse(BaseModel):
    """Paginated list of reports."""
    items: List[ReportResponse]
    total: int
    page: int
    per_page: int


class DashboardStatsResponse(BaseModel):
    """Aggregate statistics for the overview dashboard."""
    total_reports: int
    potential_incidents: int
    awaiting_verification: int
    high_priority_incidents: int
    reports_last_7_days: int
    is_demonstration: bool


class IncidentResponse(BaseModel):
    """Incident model representation."""
    id: str
    title: str
    centroid_latitude: Optional[float] = None
    centroid_longitude: Optional[float] = None
    first_observed_at: Optional[datetime] = None
    last_observed_at: Optional[datetime] = None
    verification_status: str
    created_at: datetime
    last_analysed_at: Optional[datetime] = None
    analysis_version: str
    priority_score: Optional[float] = None
    report_ids: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedIncidentsResponse(BaseModel):
    items: List[IncidentResponse]
    total: int
    page: int
    per_page: int


class HealthResponse(BaseModel):
    """Service health telemetry."""
    status: str
    version: str
    database: str
    environment: str
    timestamp: datetime
