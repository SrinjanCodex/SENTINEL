/**
 * SENTINEL — Incident Reports list page
 *
 * Searchable, filterable list of all reports.
 * Reports without coordinates are shown normally — never plotted at fake locations.
 * Demonstration data is clearly labelled.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiClient } from '../api';
import type { Report, ReportFilters, ReportStatus, ReportCategory } from '../types';
import {
  Card,
  StatusBadge,
  CategoryBadge,
  SyntheticBanner,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  PageHeader,
} from '../components/ui';
import { formatDateTime, relativeTime, severityLabel } from '../lib/formatters';

const STATUSES: { value: ReportStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'linked', label: 'Linked to Incident' },
  { value: 'dismissed', label: 'Dismissed' },
];

const CATEGORIES: { value: ReportCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'water_accumulation_on_roads', label: 'Water on roads' },
  { value: 'suspected_drainage_blockage', label: 'Drainage blockage' },
  { value: 'persistent_standing_water', label: 'Standing water' },
  { value: 'water_entering_building', label: 'Water in building' },
  { value: 'other_waterlogging', label: 'Other waterlogging' },
  { value: 'uncertain', label: 'Uncertain' },
];

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state derived from URL params
  const search = searchParams.get('search') ?? '';
  const category = (searchParams.get('category') ?? '') as ReportCategory | '';
  const status = (searchParams.get('status') ?? '') as ReportStatus | '';
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page'); // reset page on filter change
      return next;
    });
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ReportFilters = {
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 20,
      };
      const result = await getApiClient().listReports(filters);
      setReports(result.items);
      setTotal(result.total);
    } catch (err) {
      setError('Could not load reports. ' + ((err as Error)?.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [search, category, status, dateFrom, dateTo, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const hasDemo = reports.some((r) => r.is_synthetic);

  const inputClass =
    'rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 ' +
    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incident Reports"
        subtitle={`${total} report${total !== 1 ? 's' : ''} found`}
        action={
          <Link
            to="/report"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Submit Report
          </Link>
        }
      />

      {hasDemo && <SyntheticBanner />}

      {/* Filters */}
      <Card className="p-4">
        <fieldset>
          <legend className="sr-only">Filter reports</legend>
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="search-input" className="block text-xs font-medium text-slate-500 mb-1">
                Search
              </label>
              <input
                id="search-input"
                type="search"
                placeholder="Search descriptions or locations…"
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                className={`w-full ${inputClass}`}
              />
            </div>
            {/* Category */}
            <div>
              <label htmlFor="category-filter" className="block text-xs font-medium text-slate-500 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {/* Status */}
            <div>
              <label htmlFor="status-filter" className="block text-xs font-medium text-slate-500 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => updateParam('status', e.target.value)}
                className={inputClass}
              >
                {STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {/* Date from */}
            <div>
              <label htmlFor="date-from" className="block text-xs font-medium text-slate-500 mb-1">
                From date
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => updateParam('date_from', e.target.value)}
                className={inputClass}
              />
            </div>
            {/* Date to */}
            <div>
              <label htmlFor="date-to" className="block text-xs font-medium text-slate-500 mb-1">
                To date
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => updateParam('date_to', e.target.value)}
                className={inputClass}
              />
            </div>
            {/* Clear */}
            {(search || category || status || dateFrom || dateTo) && (
              <button
                onClick={() => setSearchParams({})}
                className="text-sm text-slate-500 hover:text-slate-700 underline pb-1.5"
              >
                Clear filters
              </button>
            )}
          </div>
        </fieldset>
      </Card>

      {/* Results */}
      {loading ? (
        <LoadingSpinner label="Loading reports…" />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No reports found"
          description="Try adjusting your filters, or submit the first report."
          action={
            <Link
              to="/report"
              className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition-colors"
            >
              Submit a Report
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} as="article">
              <Link
                to={`/reports/${r.id}`}
                className="block p-5 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={r.status} />
                      <CategoryBadge category={r.category} />
                      {r.category_uncertain && (
                        <span className="text-xs text-slate-400 italic">
                          (classifier uncertain)
                        </span>
                      )}
                      {r.is_synthetic && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          DEMO
                        </span>
                      )}
                      {!r.is_synthetic && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-medium">
                          Browser-stored
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-700 line-clamp-3">
                      {r.original_description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>Submitted {relativeTime(r.submitted_at)}</span>
                      {r.address && <span>📍 {r.address}</span>}
                      {r.latitude != null && r.longitude != null ? (
                        <span>🌐 {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
                      ) : (
                        <span className="italic">No coordinates</span>
                      )}
                      {r.observed_at ? (
                        <span>Observed: {formatDateTime(r.observed_at)}</span>
                      ) : (
                        <span className="italic">Observation time: not provided</span>
                      )}
                      {r.reported_severity != null && (
                        <span>Severity: {severityLabel(r.reported_severity)}</span>
                      )}
                    </div>
                  </div>

                  <span className="text-teal-600 text-sm font-medium shrink-0">
                    View →
                  </span>
                </div>
              </Link>
            </Card>
          ))}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-slate-500">
                Page {page} · {total} total
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <button
                    onClick={() => updateParam('page', String(page - 1))}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    ← Previous
                  </button>
                )}
                {page * 20 < total && (
                  <button
                    onClick={() => updateParam('page', String(page + 1))}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
