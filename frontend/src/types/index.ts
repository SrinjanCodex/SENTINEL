/**
 * SENTINEL — Shared TypeScript types
 *
 * These types mirror the data model described in ARCHITECTURE.md.
 * They are used by both the mock API client and (later) the real API client,
 * ensuring the frontend never needs to change when the backend is connected.
 */

// ── Report ──────────────────────────────────────────────────────────────────

export type ReportCategory =
  | 'water_accumulation_on_roads'
  | 'suspected_drainage_blockage'
  | 'persistent_standing_water'
  | 'water_entering_building'
  | 'other_waterlogging'
  | 'uncertain';

export type ReportStatus = 'unverified' | 'linked' | 'dismissed';

/** A single waterlogging report submitted by a community member. */
export interface Report {
  id: string;
  /** Original description — NEVER modified after submission. */
  original_description: string;
  category: ReportCategory;
  /** 0–1 confidence in the assigned category. Null when uncertain. */
  category_confidence: number | null;
  /** True when the classifier is not confident enough to choose a category. */
  category_uncertain: boolean;
  /** User-chosen severity 1–5, or null if not provided. */
  reported_severity: number | null;
  /** Free-text location address, or null. */
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  /** When the reporter observed the incident (ISO 8601), or null. */
  observed_at: string | null;
  /** Set by the application when the report is submitted. */
  submitted_at: string;
  status: ReportStatus;
  /** Reference to a photo filename, or null. Not used in Milestone 1. */
  photo_reference: string | null;
  /** Random anonymous identifier — NOT personal information. */
  reporter_token: string;
  /** True when this report is part of the demonstration dataset. */
  is_synthetic: boolean;
  updated_at: string;
  /** Automated analysis results (Milestone 3). */
  analysis?: ReportAnalysis | null;
}

export interface DuplicateReportMatch {
  id: string;
  text: string;
  similarity: number;
}

export interface ReportAnalysis {
  id: string;
  report_id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical' | 'uncertain' | null;
  severity_confidence: number | null;
  all_scores?: Record<string, number> | null;
  confidence_score: number | null;
  confidence_reason: string | null;
  extracted_locations: string[];
  extracted_depth: string | null;
  extracted_times: string[];
  possible_duplicates: DuplicateReportMatch[];
  embedding_provider: string | null;
  analysed_at: string;
}

/** Data submitted by a user to create a new report. */
export interface CreateReportPayload {
  original_description: string;
  reported_severity?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  observed_at?: string | null;
}

// ── Incident ─────────────────────────────────────────────────────────────────

export type IncidentStatus =
  | 'suspected'
  | 'under_verification'
  | 'verified'
  | 'dismissed'
  | 'resolved';

export interface LinkedReportDetail {
  report_id: string;
  match_score?: number | null;
  match_reasons?: Record<string, unknown> | null;
  is_independent: boolean;
  added_by: string;
  distance_from_centroid_meters?: number | null;
  category?: ReportCategory | null;
  original_description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  submitted_at?: string | null;
}

/**
 * A potential incident — a system-generated hypothesis that several reports
 * may describe the same real-world waterlogging event.
 *
 * "suspected" means the system flagged it. "verified" requires a recorded
 * human inspection. See ARCHITECTURE.md for the full state machine.
 */
export interface Incident {
  id: string;
  title: string;
  centroid_latitude: number | null;
  centroid_longitude: number | null;
  first_observed_at: string | null;
  last_observed_at: string | null;
  verification_status: IncidentStatus;
  created_at: string;
  last_analysed_at: string | null;
  analysis_version: string;
  /** IDs of reports linked to this incident. */
  report_ids: string[];
  /** Priority score 0–100. This is a prioritisation INDICATOR, not a flood probability. */
  priority_score: number | null;
  radius_meters?: number | null;
  linked_reports?: LinkedReportDetail[];
}

// ── Evidence ─────────────────────────────────────────────────────────────────

export type EvidenceType =
  | 'report_text'
  | 'photo'
  | 'historical_record'
  | 'weather_observation'
  | 'human_inspection';

export type EvidenceKind = 'observation' | 'model_interpretation' | 'verified';

export interface Evidence {
  id: string;
  incident_id: string;
  type: EvidenceType;
  description: string;
  /** Where this evidence came from. */
  provenance_source: string;
  provenance_url: string | null;
  observed_at: string | null;
  retrieved_at: string;
  kind: EvidenceKind;
  supports: boolean; // true = supports the incident; false = contradicts
  is_synthetic: boolean;
}

// ── Missing Signals ───────────────────────────────────────────────────────────

export type MissingSignalRule =
  | 'MS-LOC'
  | 'MS-TIME'
  | 'MS-CONFLICT'
  | 'MS-INDEP'
  | 'MS-VERIFY'
  | 'MS-HIST'
  | 'MS-WX'
  | 'MS-PHOTO';

export type MissingSignalSeverity = 'high' | 'medium' | 'low';

export interface MissingSignal {
  incident_id: string;
  rule_id: MissingSignalRule;
  severity: MissingSignalSeverity;
  explanation: string;
  recommended_action: string;
  computed_at: string;
}

// ── Priority Assessment ───────────────────────────────────────────────────────

export interface ScoringFactor {
  name: string;
  raw_value: number;
  normalised_value: number;
  weight: number;
  contribution: number;
}

export interface PriorityAssessment {
  incident_id: string;
  /** 0–100 prioritisation indicator. NOT a flood probability. */
  score: number;
  factors: ScoringFactor[];
  formula_version: string;
  computed_at: string;
}

// ── Verification Record ───────────────────────────────────────────────────────

export interface VerificationRecord {
  incident_id: string;
  previous_status: IncidentStatus;
  new_status: IncidentStatus;
  changed_by: string; // 'system' | 'human:<name>' in later milestones
  timestamp: string;
  note: string;
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface DashboardStats {
  total_reports: number;
  potential_incidents: number;
  awaiting_verification: number;
  high_priority_incidents: number;
  reports_last_7_days: number;
  /** True when stats come from demonstration data. */
  is_demonstration: boolean;
}

export interface ReportFilters {
  search?: string;
  category?: ReportCategory | '';
  status?: ReportStatus | '';
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

// ── API client interface ──────────────────────────────────────────────────────

/**
 * The API interface all pages program against.
 * In Milestone 1 this is fulfilled by MockApiClient (localStorage).
 * In Milestone 2 it will be fulfilled by RealApiClient (FastAPI backend).
 * Pages never import either client directly — they call getApiClient().
 */
export interface ApiClient {
  // Reports
  createReport(payload: CreateReportPayload): Promise<Report>;
  getReport(id: string): Promise<Report>;
  listReports(filters?: ReportFilters): Promise<PaginatedResponse<Report>>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;

  // Incidents (stubs in Milestone 1 — return empty list)
  listIncidents(): Promise<PaginatedResponse<Incident>>;
  getIncident(id: string): Promise<Incident>;
  clusterIncidents(): Promise<{
    status: string;
    clusters_count: number;
    clusters_created: number;
    clusters_updated: number;
    reports_linked: number;
    incident_ids: string[];
  }>;

  // Automated Analysis (Milestone 3)
  getReportAnalysis(id: string): Promise<ReportAnalysis | null>;
  analyzeReport(id: string): Promise<ReportAnalysis>;
}
