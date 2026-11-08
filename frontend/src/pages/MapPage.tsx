/**
 * SENTINEL — Spatial Telemetry GIS Command
 * Verified geographic mapping with explicit segregation of unconfirmed coordinates
 */
import { useEffect, useState } from 'react';
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
import { getApiClient } from '../api';
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
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | ''>('');
  const [viewMode, setViewMode] = useState<'india' | 'cluster'>('india');

  useEffect(() => {
    getApiClient()
      .listReports({ per_page: 200 })
      .then((r) => setReports(r.items))
      .catch((err) => setError('Could not load GIS telemetry. ' + ((err as Error)?.message ?? '')))
      .finally(() => setLoading(false));
  }, []);

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
    'rounded-lg border border-slate-300/80 px-3 py-1.5 text-xs text-slate-800 bg-white ' +
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

      {/* Map Control Toolbar */}
      <Card className="p-3.5 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 animate-card-rise stagger-2">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-slate-500" />
          <label htmlFor="map-category-filter" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
          <div className="inline-flex rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('india')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all btn-press ${
                viewMode === 'india'
                  ? 'bg-slate-800 text-teal-400 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇮🇳 India Overview
            </button>
            {mappable.length > 0 && (
              <button
                onClick={() => setViewMode('cluster')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all btn-press ${
                  viewMode === 'cluster'
                    ? 'bg-slate-800 text-teal-400 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📍 Street View Reports ({mappable.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <strong className="text-slate-800">{mappable.length}</strong> Plotted Points
            </span>
            {unmappable.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <strong>{unmappable.length}</strong> Unmapped Gap
              </span>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner label="Compiling geospatial coordinate points…" />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : (
        <>
          {/* GIS Map Frame */}
          <Card className="overflow-hidden border-slate-300 shadow-sm animate-card-rise stagger-3">
            <div
              style={{ height: '520px' }}
              className="w-full relative bg-slate-100"
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

          {/* Color-Coded Category Legend */}
          <Card className="p-4 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Spatial Categorization Legend</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {FILTER_CATEGORIES.filter((c) => c.value).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
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
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Explicit Unmapped Reports Segregation Callout */}
          {unmappable.length > 0 && (
            <Card className="overflow-hidden border-amber-200/80 animate-card-rise stagger-4">
              <div className="px-5 py-3.5 border-b border-amber-100 bg-amber-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <div>
                    <h2 className="font-bold text-amber-950 text-xs sm:text-sm uppercase tracking-wider">
                      Location-Unconfirmed Reports ({unmappable.length})
                    </h2>
                    <p className="text-[11px] text-amber-800">
                      Rule Compliance: Missing-Signal Detector (MS-LOC) flags these gaps. SENTINEL never invents artificial coordinates.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300/60">
                  MS-LOC Triggered
                </span>
              </div>

              <ul className="divide-y divide-slate-100">
                {unmappable.map((r, idx) => (
                  <li key={r.id} className={`animate-fade-in stagger-${Math.min(idx + 1, 5)}`}>
                    <Link
                      to={`/reports/${r.id}`}
                      viewTransition
                      className="block px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-slate-800 line-clamp-2 leading-relaxed group-hover:text-slate-950 font-normal">
                            "{r.original_description}"
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <StatusBadge status={r.status} size="sm" />
                            <CategoryBadge category={r.category} />
                            {r.address && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{r.address}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{relativeTime(r.submitted_at)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-700">
                          <span>Inspect Gap</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
