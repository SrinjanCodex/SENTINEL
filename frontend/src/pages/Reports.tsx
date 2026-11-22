/**
 * SENTINEL — Incident Reports Directory (Master-Detail Layout)
 * Civic intelligence directory with responsive split-pane reading flow:
 * filterable report feed on left, sticky incident detail inspector on right on desktop,
 * and full-page direct routing on mobile.
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
  ErrorAlert,
  EmptyState,
  PageHeader,
} from '../components/ui';
import { relativeTime, severityLabel } from '../lib/formatters';
import {
  Search,
  MapPin,
  Clock,
  ArrowRight,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileQuestion,
  Compass,
  Download,
} from 'lucide-react';

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter state derived from URL params
  const search = searchParams.get('search') ?? '';
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
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

  const clearAllFilters = () => {
    setSearchParams({});
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
      if (result.items.length > 0) {
        setSelectedId((prev) => prev || result.items[0].id);
      }
    } catch (err) {
      setError('Could not load reports database. ' + ((err as Error)?.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [search, category, status, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Keep selected report updated with the active list
  const selectedReport = reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;

  const hasDemo = reports.some((r) => r.is_synthetic);
  const hasActiveFilters = Boolean(search || category || status || dateFrom || dateTo);

  const inputClass =
    'rounded-lg border border-slate-300/80 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 ' +
    'placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all';

  return (
    <div className="space-y-5 pb-6 animate-page-enter">
      
      {/* Header */}
      <div className="animate-card-rise stagger-1">
        <PageHeader
          title="Incident Directory"
          subtitle={`System records contain ${total} community report${total !== 1 ? 's' : ''}. Preserved unaltered with provenance timestamps.`}
          action={
            <div className="flex items-center gap-2">
              <a
                href={`${apiBase}/api/reports/export/csv`}
                download="sentinel_reports.csv"
                className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-3 py-2 rounded-lg text-xs shadow-2xs transition-all btn-press"
                title="Export all community reports as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Export CSV</span>
              </a>
              <Link
                to="/report"
                viewTransition
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs shadow-xs transition-all btn-press"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Report</span>
              </Link>
            </div>
          }
        />
      </div>

      {hasDemo && (
        <div className="animate-fade-in stagger-2">
          <SyntheticBanner />
        </div>
      )}

      {/* Filter Command Bar */}
      <Card tilt={false} className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 shadow-xs animate-card-rise stagger-2">
        <fieldset>
          <legend className="sr-only">Filter incident reports</legend>
          <div className="flex flex-wrap gap-4 items-end">
            
            {/* Search Input */}
            <div className="flex-1 min-w-[240px]">
              <label htmlFor="search-input" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Keyword Query
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="search-input"
                  type="search"
                  placeholder="Query street, location, drain description…"
                  value={search}
                  onChange={(e) => updateParam('search', e.target.value)}
                  className={`w-full pl-9 ${inputClass}`}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="min-w-[160px]">
              <label htmlFor="category-filter" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className={`w-full ${inputClass}`}
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[140px]">
              <label htmlFor="status-filter" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => updateParam('status', e.target.value)}
                className={`w-full ${inputClass}`}
              >
                {STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="date-from" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => updateParam('date_from', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date-to" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => updateParam('date_to', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Clear Filters Action */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg shadow-2xs hover:shadow-xs transition-all btn-press"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Filters</span>
              </button>
            )}

          </div>
        </fieldset>
      </Card>

      {/* Directory Content Area */}
      {loading ? (
        <div className="space-y-4 w-full" aria-busy="true">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} tilt={false} className="p-5 sm:p-6 min-h-[110px] animate-pulse skeleton-shimmer">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-2.5">
                  <div className="flex gap-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No incident records match active filters"
          description="Try modifying search keywords or clearing date range constraints to widen the query."
          action={
            hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-teal-500 transition-colors btn-press"
              >
                <span>Clear Active Filters</span>
              </button>
            ) : (
              <Link
                to="/report"
                className="inline-flex items-center gap-1.5 bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-teal-500 transition-colors btn-press"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Initial Observation</span>
              </Link>
            )
          }
        />
      ) : (
        /* Full-Width Horizontal Slabs (100 to 140px tall) */
        <div className="space-y-4 w-full">
            {reports.map((r, idx) => {
              const isSelected = selectedReport?.id === r.id;
              return (
                <Card
                  key={r.id}
                  as="article"
                  hoverEffect={true}
                  tilt={true}
                  maxTilt={2}
                  className={`animate-fade-in stagger-${Math.min(idx + 1, 5)} transition-all duration-150 ${
                    isSelected ? 'ring-2 ring-teal-500/80 border-teal-500/80 bg-teal-50/10 dark:bg-teal-950/20' : ''
                  }`}
                >
                  {/* Desktop click updates detail panel; double-click or direct link navigates */}
                  <div
                    tabIndex={0}
                    role="button"
                    aria-label={`Select report ${r.id}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(r.id);
                      }
                    }}
                    onClick={() => setSelectedId(r.id)}
                    className="p-5 sm:p-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl block"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left Column: ID, Narrative & Origin */}
                      <div className="flex-1 min-w-0 pr-0 sm:pr-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {r.id}
                          </span>
                          {r.is_synthetic ? (
                            <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/60 font-semibold">
                              DEMO
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800/60 font-semibold">
                              LOCAL
                            </span>
                          )}
                          {r.reported_severity != null && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {severityLabel(r.reported_severity)}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-normal">
                          "{r.original_description}"
                        </p>
                      </div>

                      {/* Right Column: Structured Telemetry Badges, Location & Time in Columns */}
                      <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col gap-1.5 min-w-[125px]">
                          <CategoryBadge category={r.category} />
                          <StatusBadge status={r.status} size="sm" />
                        </div>

                        <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 min-w-[130px] max-w-[190px]">
                          <span className="flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{relativeTime(r.submitted_at)}</span>
                          </span>
                          {r.address ? (
                            <span className="flex items-center gap-1.5 truncate" title={r.address}>
                              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="truncate">{r.address}</span>
                            </span>
                          ) : r.latitude != null && r.longitude != null ? (
                            <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                              <Compass className="w-3.5 h-3.5 shrink-0" />
                              <span>{r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">Location unstated</span>
                          )}
                        </div>

                        {/* Direct Action Link */}
                        <div className="shrink-0 pl-1">
                          <Link
                            to={`/reports/${r.id}`}
                            viewTransition
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                            title="Open dedicated report page"
                            aria-label={`Open dedicated page for report ${r.id}`}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>

                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Pagination Controls */}
            {total > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * 20 + 1}</span>–
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(page * 20, total)}</span> of{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> reports
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2">Page {page}</span>
                  <button
                    disabled={page * 20 >= total}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      }

    </div>
  );
}
