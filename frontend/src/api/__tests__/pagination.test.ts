import { describe, it, expect, vi } from 'vitest';
import { fetchAllReports, API_MAX_PAGE_SIZE } from '../pagination';
import type { ApiClient, PaginatedResponse, Report } from '../../types';

describe('fetchAllReports Pagination Helper', () => {
  const createMockReport = (id: string): Report => ({
    id,
    original_description: `Test report ${id}`,
    category: 'suspected_drainage_blockage',
    category_confidence: 0.9,
    category_uncertain: false,
    reported_severity: 2,
    address: 'Park Street',
    latitude: 22.5,
    longitude: 88.3,
    observed_at: '2026-10-21T09:00:00Z',
    submitted_at: '2026-10-21T09:05:00Z',
    status: 'unverified',
    photo_reference: null,
    reporter_token: `token-${id}`,
    is_synthetic: false,
    updated_at: '2026-10-21T09:05:00Z',
  });

  it('fetches a single page when total items <= API_MAX_PAGE_SIZE', async () => {
    const mockReports = [createMockReport('rep-1'), createMockReport('rep-2')];
    const mockListReports = vi.fn().mockResolvedValue({
      items: mockReports,
      total: 2,
      page: 1,
      per_page: API_MAX_PAGE_SIZE,
    } as PaginatedResponse<Report>);

    const mockClient = {
      listReports: mockListReports,
    } as unknown as ApiClient;

    const results = await fetchAllReports(mockClient);

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('rep-1');
    expect(mockListReports).toHaveBeenCalledTimes(1);
    expect(mockListReports).toHaveBeenCalledWith({
      page: 1,
      per_page: API_MAX_PAGE_SIZE,
    });
  });

  it('pages sequentially when total reports span multiple pages without exceeding API_MAX_PAGE_SIZE', async () => {
    const page1Items = Array.from({ length: 100 }, (_, i) => createMockReport(`p1-${i}`));
    const page2Items = Array.from({ length: 25 }, (_, i) => createMockReport(`p2-${i}`));

    const mockListReports = vi.fn()
      .mockResolvedValueOnce({
        items: page1Items,
        total: 125,
        page: 1,
        per_page: 100,
      } as PaginatedResponse<Report>)
      .mockResolvedValueOnce({
        items: page2Items,
        total: 125,
        page: 2,
        per_page: 100,
      } as PaginatedResponse<Report>);

    const mockClient = {
      listReports: mockListReports,
    } as unknown as ApiClient;

    const results = await fetchAllReports(mockClient);

    expect(results).toHaveLength(125);
    expect(mockListReports).toHaveBeenCalledTimes(2);
    expect(mockListReports).toHaveBeenNthCalledWith(1, { page: 1, per_page: 100 });
    expect(mockListReports).toHaveBeenNthCalledWith(2, { page: 2, per_page: 100 });
  });

  it('clamps excessive pageSize options to API_MAX_PAGE_SIZE (100)', async () => {
    const mockListReports = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      per_page: 100,
    } as PaginatedResponse<Report>);

    const mockClient = {
      listReports: mockListReports,
    } as unknown as ApiClient;

    // Passing an illegal per_page of 250 must be clamped to 100
    await fetchAllReports(mockClient, { pageSize: 250 });

    expect(mockListReports).toHaveBeenCalledWith(
      expect.objectContaining({ per_page: 100 })
    );
  });

  it('stops at safety cap maxPages even if total indicates more pages', async () => {
    const pageItems = Array.from({ length: 100 }, (_, i) => createMockReport(`cap-${i}`));

    const mockListReports = vi.fn().mockResolvedValue({
      items: pageItems,
      total: 1000,
      page: 1,
      per_page: 100,
    } as PaginatedResponse<Report>);

    const mockClient = {
      listReports: mockListReports,
    } as unknown as ApiClient;

    const results = await fetchAllReports(mockClient, { maxPages: 2 });

    expect(mockListReports).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(100); // 100 because items have duplicate IDs in this mock
  });
});
