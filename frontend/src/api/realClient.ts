/**
 * SENTINEL — Real API Client
 *
 * Implements ApiClient against the FastAPI backend running on VITE_API_BASE_URL.
 * Handles HTTP network communication, serialization, query formatting, and
 * structured error extraction.
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

export class RealApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let res: Response;

    try {
      res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
    } catch (networkError) {
      throw new Error(
        `Unable to connect to SENTINEL backend at ${this.baseUrl}. Please verify the server is running.`,
      );
    }

    if (!res.ok) {
      let errorMessage = `Server responded with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors
            .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
            .join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      } catch {
        // Fall back to status text
        if (res.statusText) errorMessage = res.statusText;
      }
      throw new Error(errorMessage);
    }

    return res.json() as Promise<T>;
  }

  async createReport(payload: CreateReportPayload): Promise<Report> {
    return this.request<Report>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getReport(id: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${encodeURIComponent(id)}`);
  }

  async listReports(filters?: ReportFilters): Promise<PaginatedResponse<Report>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.date_from) params.set('date_from', filters.date_from);
    if (filters?.date_to) params.set('date_to', filters.date_to);
    if (filters?.page) params.set('page', String(Math.max(1, filters.page)));
    if (filters?.per_page) {
      // Backend validates ge=1, le=100. Clamp client-side to prevent 422 errors.
      const safePerPage = Math.min(Math.max(1, filters.per_page), 100);
      params.set('per_page', String(safePerPage));
    }

    const queryString = params.toString();
    const endpoint = `/api/reports${queryString ? `?${queryString}` : ''}`;
    return this.request<PaginatedResponse<Report>>(endpoint);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/stats');
  }

  async listIncidents(): Promise<PaginatedResponse<Incident>> {
    return this.request<PaginatedResponse<Incident>>('/api/incidents');
  }

  async getIncident(id: string): Promise<Incident> {
    return this.request<Incident>(`/api/incidents/${encodeURIComponent(id)}`);
  }

  async getReportAnalysis(id: string): Promise<ReportAnalysis | null> {
    try {
      return await this.request<ReportAnalysis>(`/api/reports/${encodeURIComponent(id)}/analysis`);
    } catch {
      return null;
    }
  }

  async analyzeReport(id: string): Promise<ReportAnalysis> {
    return this.request<ReportAnalysis>(`/api/reports/${encodeURIComponent(id)}/analyze`, {
      method: 'POST',
    });
  }

  async clusterIncidents(): Promise<{
    status: string;
    clusters_count: number;
    clusters_created: number;
    clusters_updated: number;
    reports_linked: number;
    incident_ids: string[];
  }> {
    return this.request('/api/incidents/cluster', {
      method: 'POST',
    });
  }
}
