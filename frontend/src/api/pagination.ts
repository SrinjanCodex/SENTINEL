/**
 * SENTINEL — Pagination Utilities
 * Enforces strict client-side query bounds matching backend FastAPI limits.
 */
import type { ApiClient, Report, ReportFilters } from '../types';

/**
 * Maximum items allowed per page by backend (FastAPI Query le=100).
 * Never send a per_page query parameter higher than this constant.
 */
export const API_MAX_PAGE_SIZE = 100;

/**
 * Safety cap on sequential pagination requests to prevent runaway loops.
 * 10 pages * 100 items = 1,000 maximum reports in one exhaustive fetch.
 */
export const MAX_FETCH_PAGES_CAP = 10;

export interface FetchAllReportsOptions {
  filters?: Omit<ReportFilters, 'page' | 'per_page'>;
  maxPages?: number;
  pageSize?: number;
}

/**
 * Fetches all matching reports by paging sequentially through the API.
 * Never exceeds API_MAX_PAGE_SIZE (100) per request.
 * Enforces a safety cap on maximum pages to prevent runaway loops.
 * Deduplicates items by report id.
 */
export async function fetchAllReports(
  client: ApiClient,
  options: FetchAllReportsOptions = {}
): Promise<Report[]> {
  const { filters, maxPages = MAX_FETCH_PAGES_CAP, pageSize = API_MAX_PAGE_SIZE } = options;
  const safePageSize = Math.min(Math.max(1, pageSize), API_MAX_PAGE_SIZE);

  const reports: Report[] = [];
  const seenIds = new Set<string>();
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages && currentPage <= maxPages) {
    const res = await client.listReports({
      ...filters,
      page: currentPage,
      per_page: safePageSize,
    });

    for (const item of res.items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        reports.push(item);
      }
    }

    const count = typeof res.total === 'number' ? res.total : 0;
    const computedPages = Math.ceil(count / (res.per_page || safePageSize));
    totalPages = Math.max(1, computedPages);

    // Stop if the response has fewer items than requested (end of data)
    if (res.items.length < safePageSize) {
      break;
    }

    currentPage++;
  }

  return reports;
}
