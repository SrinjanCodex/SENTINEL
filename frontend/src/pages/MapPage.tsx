/**
 * SENTINEL — Spatial Telemetry GIS Command
 * Verified geographic mapping with explicit segregation of unconfirmed coordinates
 */
import { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SentinelTileLayer } from '../components/SentinelTileLayer';
import { MapErrorBoundary } from '../components/ErrorBoundary';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, STREET_LEVEL_ZOOM } from '../lib/mapConfig';
import { Link } from 'react-router-dom';
import { getApiClient, fetchAllReports } from '../api';
import type { Report, ReportCategory } from '../types';
import {
  Card,
  LoadingSpinner,
  ErrorAlert,
  StatusBadge,
  CategoryBadge,
  SyntheticBanner,
  PageHeader,
  EmptyState,
} from '../components/ui';
import { relativeTime } from '../lib/formatters';
import {
  MapPin,
  Filter,
  ArrowRight,
  AlertTriangle,
  Layers,
  Clock,
} from 'lucide-react';

const CATEGORY_COLOURS: Record<ReportCategory, string> = {
  water_accumulation_on_roads:  '#2563eb',
  suspected_drainage_blockage:  '#0d9488',
  persistent_standing_water:    '#0891b2',
  water_entering_building:      '#dc2626',
  other_waterlogging:           '#7c3aed',
  uncertain:                    '#94a3b8',
};

function MapViewController({
  mode,
  clusterCenter,
}: {
  mode: 'india' | 'cluster';
  clusterCenter: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    if (mode === 'india') {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { animate: true });
    } else {
      map.setView(clusterCenter, STREET_LEVEL_ZOOM, { animate: true });
    }
  }, [mode, clusterCenter, map]);
  return null;
}

const FILTER_CATEGORIES: { value: ReportCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'water_accumulation_on_roads', label: 'Water on roads' },
  { value: 'suspected_drainage_blockage', label: 'Drainage blockage' },
  { value: 'persistent_standing_water',   label: 'Standing water' },
  { value: 'water_entering_building',     label: 'Water in building' },
  { value: 'other_waterlogging',          label: 'Other waterlogging' },
  { value: 'uncertain',                   label: 'Uncertain' },
];

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<{ message: string; details?: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | ''>('');
  const [viewMode, setViewMode] = useState<'india' | 'cluster'>('india');

  const loadReports = useCallback(() => {
    setLoading(true);
    setErrorState(null);
    fetchAllReports(getApiClient())
      .then((items) => setReports(items))
      .catch((err) => {
        setErrorState({
          message: 'The map data could not be loaded. Try again.',
          details: (err as Error)?.message || String(err),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filtered =
    categoryFilter
      ? reports.filter((r) => r.category === categoryFilter)
      : reports;

  const mappable = filtered.filter(
    (r) => r.latitude != null && r.longitude != null,
  );
  const unmappable = filtered.filter(
    (r) => r.latitude == null || r.longitude == null,
  );

  const hasDemo = reports.some((r) => r.is_synthetic);

  const inputClass =
    'rounded-lg border border-slate-300/80 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 ' +
    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all';

  return (
    <div className="space-y-5 pb-8 animate-page-enter">
      <div className="animate-card-rise stagger-1">
        <PageHeader
          title="GIS Spatial Telemetry"
          subtitle={`${mappable.length} geo-referenced observation${mappable.length !== 1 ? 's' : ''} mapped · ${unmappable.length} unconfirmed locations isolated`}
        />
      </div>

      {hasDemo && (
        <div className="animate-fade-in stagger-2">
          <SyntheticBanner />
        </div>
      )}

      {/* Map Control Toolbar — Wide Slab */}
      <Card tilt={false} className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 animate-card-rise stagger-2">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <label htmlFor="map-category-filter" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Layer Filter:
          </label>
          <select
            id="map-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ReportCategory | '')}
            className={inputClass}
          >
            {FILTER_CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('india')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all btn-press ${
                viewMode === 'india'
                  ? 'bg-slate-800 dark:bg-slate-700 text-teal-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white'
              }`}
            >
              🇮🇳 India Overview
            </button>
            {mappable.length > 0 && (
              <button
                onClick={() => setViewMode('cluster')}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all btn-press ${
                  viewMode === 'cluster'
                    ? 'bg-slate-800 dark:bg-slate-700 text-teal-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white'
                }`}
              >
                📍 Street View Reports ({mappable.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <strong className="text-slate-800 dark:text-slate-200">{mappable.length}</strong> Plotted Points
            </span>
            {unmappable.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/60 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <strong>{unmappable.length}</strong> Unmapped Gap
              </span>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner label="Compiling geospatial coordinate points…" />
      ) : errorState ? (
        <ErrorAlert
          title="Map Telemetry Notice"
          message={errorState.message}
          technicalDetails={errorState.details}
          onRetry={loadReports}
        />
      ) : (
        <>
          {/* GIS Map Frame */}
          <Card tilt={false} className="overflow-hidden border-slate-300 dark:border-slate-800 shadow-sm animate-card-rise stagger-3">
            <div
              style={{ height: '520px' }}
              className="w-full relative bg-slate-100 dark:bg-slate-950"
              role="application"
              aria-label="Interactive map of incident reports"
            >
              <MapErrorBoundary height="520px">
                {mappable.length > 0 ? (
                  <MapContainer
                    center={DEFAULT_MAP_CENTER}
                    zoom={DEFAULT_MAP_ZOOM}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <SentinelTileLayer />
                    <MapViewController
                      mode={viewMode}
                      clusterCenter={[mappable[0].latitude!, mappable[0].longitude!]}
                    />
                    {mappable.map((r) => (
                      <CircleMarker
                        key={r.id}
                        center={[r.latitude!, r.longitude!]}
                        radius={8}
                        pathOptions={{
                          color: CATEGORY_COLOURS[r.category] ?? '#94a3b8',
                          fillColor: CATEGORY_COLOURS[r.category] ?? '#94a3b8',
                          fillOpacity: 0.75,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div className="p-1 max-w-[220px]">
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              <StatusBadge status={r.status} size="sm" />
                              <CategoryBadge category={r.category} />
                            </div>
                            <p className="text-xs text-slate-800 font-normal leading-relaxed mb-2">
                              "{r.original_description.slice(0, 110)}{r.original_description.length > 110 ? '…' : ''}"
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                              <span>{relativeTime(r.submitted_at)}</span>
                              <a
                                href={`/reports/${r.id}`}
                                className="font-semibold text-teal-600 hover:text-teal-700 underline"
                              >
                                Inspect Details →
                              </a>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">
                    <EmptyState
                      icon={MapPin}
                      title="No geo-referenced observations found"
                      description="Filtered category contains no reports with valid GPS coordinates."
                    />
                  </div>
                )}
              </MapErrorBoundary>
            </div>
          </Card>

          {/* Color-Coded Category Legend — Wide Slab Grid */}
          <Card tilt={false} className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Spatial Categorization Legend</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {FILTER_CATEGORIES.filter((c) => c.value).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: CATEGORY_COLOURS[value as ReportCategory],
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Explicit Unmapped Reports Segregation Callout — Wide Slab Row Items */}
          {unmappable.length > 0 && (
            <Card tilt={false} className="overflow-hidden border-amber-200/80 dark:border-amber-800/60 animate-card-rise stagger-4">
              <div className="px-6 py-4 border-b border-amber-100 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h2 className="font-bold text-amber-950 dark:text-amber-200 text-xs sm:text-sm uppercase tracking-wider">
                      Location-Unconfirmed Reports ({unmappable.length})
                    </h2>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Rule Compliance: Missing-Signal Detector (MS-LOC) flags these gaps. SENTINEL never invents artificial coordinates.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60 shrink-0">
                  MS-LOC Triggered
                </span>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {unmappable.map((r, idx) => (
                  <li key={r.id} className={`animate-fade-in stagger-${Math.min(idx + 1, 5)}`}>
                    <Link
                      to={`/reports/${r.id}`}
                      viewTransition
                      className="block p-5 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed group-hover:text-slate-950 dark:group-hover:text-white font-normal">
                            "{r.original_description}"
                          </p>
                          {r.address && (
                            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="truncate">{r.address}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <CategoryBadge category={r.category} />
                            <StatusBadge status={r.status} size="sm" />
                          </div>

                          <div className="text-right text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{relativeTime(r.submitted_at)}</span>
                          </div>

                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 pl-2">
                            <span>Inspect Gap</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
