/**
 * SENTINEL — Mock API Client
 *
 * Fulfils the ApiClient interface using:
 *   1. DEMO_REPORTS and DEMO_INCIDENTS from demoData.ts (clearly labelled synthetic)
 *   2. Reports submitted in this browser session, stored in localStorage
 *
 * ⚠️  This client stores data in THIS BROWSER ONLY.
 * When Milestone 2 is ready, getApiClient() will return RealApiClient instead,
 * and this file will only be used during offline development.
 */
import type {
  ApiClient,
  Report,
  ReportAnalysis,
  Incident,
  CreateReportPayload,
  DashboardStats,
  PaginatedResponse,
  ReportFilters,
} from '../types';
import { DEMO_REPORTS, DEMO_INCIDENTS } from '../data/demoData';
import { classifyReport } from '../lib/classification';

const LS_KEY = 'sentinel_mock_reports';

function generateId(): string {
  return 'user-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
}

function generateToken(): string {
  return 'tok-anon-' + Math.random().toString(36).slice(2, 8);
}

function loadUserReports(): Report[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Report[]) : [];
  } catch {
    return [];
  }
}

function saveUserReports(reports: Report[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(reports));
}

function getAllReports(): Report[] {
  return [...DEMO_REPORTS, ...loadUserReports()];
}

function applyFilters(reports: Report[], filters: ReportFilters): Report[] {
  let result = [...reports];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.original_description.toLowerCase().includes(q) ||
        (r.address?.toLowerCase().includes(q) ?? false),
    );
  }

  if (filters.category) {
    result = result.filter((r) => r.category === filters.category);
  }

  if (filters.status) {
    result = result.filter((r) => r.status === filters.status);
  }

  if (filters.date_from) {
    const from = new Date(filters.date_from).getTime();
    result = result.filter(
      (r) => new Date(r.submitted_at).getTime() >= from,
    );
  }

  if (filters.date_to) {
    const to = new Date(filters.date_to).getTime();
    result = result.filter(
      (r) => new Date(r.submitted_at).getTime() <= to,
    );
  }

  // Newest first
  result.sort(
    (a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );

  return result;
}

export class MockApiClient implements ApiClient {
  /** Simulate a brief network delay so loading states are visible. */
  private delay(ms = 200): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }

  async createReport(payload: CreateReportPayload): Promise<Report> {
    await this.delay(400);

    const classification = classifyReport(payload.original_description);
    const now = new Date().toISOString();

    const report: Report = {
      id: generateId(),
      original_description: payload.original_description,
      category: classification.category,
      category_confidence: classification.confidence,
      category_uncertain: classification.uncertain,
      reported_severity: payload.reported_severity ?? null,
      address: payload.address ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      observed_at: payload.observed_at ?? null,
      submitted_at: now,
      status: 'unverified',
      photo_reference: null,
      reporter_token: generateToken(),
      is_synthetic: false,
      updated_at: now,
    };

    const existing = loadUserReports();
    saveUserReports([...existing, report]);
    return report;
  }

  async getReport(id: string): Promise<Report> {
    await this.delay();
    const report = getAllReports().find((r) => r.id === id);
    if (!report) throw new Error(`Report not found: ${id}`);
    return report;
  }

  async listReports(
    filters: ReportFilters = {},
  ): Promise<PaginatedResponse<Report>> {
    await this.delay();
    const all = getAllReports();
    const filtered = applyFilters(all, filters);

    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return {
      items,
      total: filtered.length,
      page,
      per_page: perPage,
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    await this.delay(300);
    const all = getAllReports();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return {
      total_reports: all.length,
      potential_incidents: DEMO_INCIDENTS.length,
      awaiting_verification: DEMO_INCIDENTS.filter(
        (i) => i.verification_status === 'suspected' || i.verification_status === 'under_verification',
      ).length,
      high_priority_incidents: DEMO_INCIDENTS.filter(
        (i) => (i.priority_score ?? 0) >= 70,
      ).length,
      reports_last_7_days: all.filter(
        (r) => new Date(r.submitted_at).getTime() >= sevenDaysAgo,
      ).length,
      is_demonstration: true,
    };
  }

  async listIncidents(): Promise<PaginatedResponse<Incident>> {
    await this.delay();
    return {
      items: DEMO_INCIDENTS,
      total: DEMO_INCIDENTS.length,
      page: 1,
      per_page: 20,
    };
  }

  async getIncident(id: string): Promise<Incident> {
    await this.delay();
    const incident = DEMO_INCIDENTS.find((i) => i.id === id);
    if (!incident) throw new Error(`Incident not found: ${id}`);
    return incident;
  }

  async getReportAnalysis(id: string): Promise<ReportAnalysis | null> {
    await this.delay();
    const report = (await this.listReports({ per_page: 100 })).items.find((r) => r.id === id);
    if (!report) return null;
    return this.createMockAnalysis(report);
  }

  async analyzeReport(id: string): Promise<ReportAnalysis> {
    await this.delay();
    const report = (await this.listReports({ per_page: 100 })).items.find((r) => r.id === id);
    if (!report) throw new Error(`Report not found: ${id}`);
    return this.createMockAnalysis(report);
  }

  private createMockAnalysis(report: Report): ReportAnalysis {
    const sev = report.reported_severity
      ? report.reported_severity >= 5
        ? 'critical'
        : report.reported_severity >= 4
          ? 'high'
          : report.reported_severity >= 3
            ? 'moderate'
            : 'low'
      : 'moderate';
    return {
      id: `analysis-${report.id}`,
      report_id: report.id,
      severity: sev,
      severity_confidence: 0.85,
      confidence_score: 0.78,
      confidence_reason: `Mock heuristic classification (${sev}); location context extracted`,
      extracted_locations: report.address ? [report.address] : ['Central Avenue'],
      extracted_depth: '25 cm',
      extracted_times: ['since morning'],
      possible_duplicates: [],
      embedding_provider: 'mock-tfidf',
      analysed_at: new Date().toISOString(),
    };
  }
}
