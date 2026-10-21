import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealApiClient } from '../realClient';

describe('RealApiClient', () => {
  const client = new RealApiClient('http://localhost:8000');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('successfully creates a report and parses response', async () => {
    const mockReport = {
      id: 'test-123',
      original_description: 'Water accumulation on Park Street.',
      category: 'uncertain',
      category_confidence: null,
      category_uncertain: true,
      reported_severity: 3,
      address: 'Park Street',
      latitude: 22.5,
      longitude: 88.3,
      observed_at: '2026-10-21T09:00:00Z',
      submitted_at: '2026-10-21T09:05:00Z',
      status: 'unverified',
      photo_reference: null,
      reporter_token: 'tok-abc',
      is_synthetic: false,
      updated_at: '2026-10-21T09:05:00Z',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    }));

    const result = await client.createReport({
      original_description: 'Water accumulation on Park Street.',
      reported_severity: 3,
      address: 'Park Street',
      latitude: 22.5,
      longitude: 88.3,
    });

    expect(result.id).toBe('test-123');
    expect(result.original_description).toBe('Water accumulation on Park Street.');
  });

  it('extracts validation errors into readable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: 'Request validation failed',
        errors: [{ field: 'original_description', message: 'String should have at least 10 characters' }],
      }),
    }));

    await expect(
      client.createReport({ original_description: 'short' }),
    ).rejects.toThrow('original_description: String should have at least 10 characters');
  });

  it('builds query parameters correctly for listReports', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], total: 0, page: 1, per_page: 10 }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await client.listReports({ search: 'school', category: 'persistent_standing_water', page: 2 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reports?search=school&category=persistent_standing_water&page=2'),
      expect.anything(),
    );
  });

  it('handles backend network connection failures gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

    await expect(client.getDashboardStats()).rejects.toThrow(
      'Unable to connect to SENTINEL backend',
    );
  });
});
