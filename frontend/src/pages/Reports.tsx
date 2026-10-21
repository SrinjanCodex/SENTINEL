/**
 * SENTINEL — Incident Reports Directory
 * Civic intelligence directory with live search, multi-factor filtering, and telemetry metadata
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
import { formatDateTime, relativeTime, severityLabel } from '../lib/formatters';
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
    } catch (err) {
      setError('Could not load reports database. ' + ((err as Error)?.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [search, category, status, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const hasDemo = reports.some((r) => r.is_synthetic);
  const hasActiveFilters = Boolean(search || category || status || dateFrom || dateTo);

  const inputClass =
    'rounded-lg border border-slate-300/80 px-3 py-1.5 text-xs text-slate-800 bg-white ' +
    'placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all';

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      <PageHeader
        title="Incident Directory"
        subtitle={`System record contains ${total} community report${total !== 1 ? 's' : ''}. Preserved unaltered with provenance timestamps.`}
        action={
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Report</span>
          </Link>
        }
      />

      {hasDemo && <SyntheticBanner />}

      {/* Advanced Filter Command Bar */}
      <Card className="p-4 bg-slate-50/50">
        <fieldset>
          <legend className="sr-only">Filter incident reports</legend>
          <div className="flex flex-wrap gap-3 items-end">
            
            {/* Search Input */}
            <div className="flex-1 min-w-[220px]">
              <label htmlFor="search-input" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Keyword Query
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  id="search-input"
                  type="search"
                  placeholder="Query street, location, drain description…"
                  value={search}
                  onChange={(e) => updateParam('search', e.target.value)}
                  className={`w-full pl-8 ${inputClass}`}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
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

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
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

            {/* Date From */}
            <div>
              <label htmlFor="date-from" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
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
              <label htmlFor="date-to" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
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
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all btn-press"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Filters</span>
              </button>
            )}

          </div>
        </fieldset>
      </Card>

      {/* Directory Content Stream */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-5 animate-pulse">
              <div className="flex gap-3 mb-2">
                <div className="h-5 bg-slate-200 rounded w-28" />
                <div className="h-5 bg-slate-200 rounded w-20" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-5/6 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/3" />
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
        <div className="space-y-3">
          {reports.map((r, idx) => (
            <Card
              key={r.id}
              as="article"
              hoverEffect={true}
              className={`animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
            >
              <Link
                to={`/reports/${r.id}`}
                className="block p-4 sm:p-5 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    
                    {/* Badge Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <CategoryBadge category={r.category} />
                      <StatusBadge status={r.status} size="sm" />
                      
                      {r.reported_severity != null && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {severityLabel(r.reported_severity)}
                        </span>
                      )}

                      {r.category_uncertain && (
                        <span className="text-[10px] text-amber-700 bg-amber-50/70 border border-amber-200/50 px-1.5 py-0.5 rounded italic">
                          Heuristic Uncertain
                        </span>
                      )}

                      {r.is_synthetic ? (
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                          DEMO
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                          BROWSER STORAGE
                        </span>
                      )}
                    </div>

                    {/* Report Text */}
                    <p className="text-xs sm:text-sm text-slate-800 line-clamp-2 leading-relaxed group-hover:text-slate-950 font-normal">
                      "{r.original_description}"
                    </p>

                    {/* Telemetry Metadata Pills */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted {relativeTime(r.submitted_at)}</span>
                      </span>

                      {r.address ? (
                        <span className="flex items-center gap-1 truncate max-w-[260px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{r.address}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Location unstated</span>
                      )}

                      {r.latitude != null && r.longitude != null ? (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                          <Compass className="w-3 h-3 text-slate-400" />
                          <span>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Unmapped Coordinates</span>
                      )}

                      {r.observed_at && (
                        <span className="text-slate-500">
                          Observed: {formatDateTime(r.observed_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all self-end sm:self-center">
                    <span>Inspect Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            </Card>
          ))}

          {/* Pagination Controls */}
          {total > 20 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
              <span className="text-xs text-slate-500">
                Displaying page {page} · {total} matching observations
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <button
                    onClick={() => updateParam('page', String(page - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-2xs btn-press"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                )}
                {page * 20 < total && (
                  <button
                    onClick={() => updateParam('page', String(page + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-2xs btn-press"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
