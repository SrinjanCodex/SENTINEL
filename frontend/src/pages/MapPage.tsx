/**
 * SENTINEL — Incident Map page
 *
 * Interactive map of reports and potential incidents.
 * Reports WITHOUT coordinates are listed below the map — never plotted at
 * invented or arbitrary coordinates.
 *
 * Leaflet CSS is imported here (and in Dashboard.tsx).
 * The default Leaflet marker icon is fixed for Vite bundlers using CircleMarker
 * instead of the default Marker (avoids the broken-icon problem entirely for now).
 */
import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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

// Colour per category for map markers
const CATEGORY_COLOURS: Record<ReportCategory, string> = {
  water_accumulation_on_roads:  '#2563eb',
  suspected_drainage_blockage:  '#0d9488',
  persistent_standing_water:    '#0891b2',
  water_entering_building:      '#dc2626',
  other_waterlogging:           '#7c3aed',
  uncertain:                    '#94a3b8',
};

// Fit map to markers when they load
function MapFitter({ reports }: { reports: Report[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = reports
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => [r.latitude!, r.longitude!] as [number, number]);
    if (pts.length > 0) {
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    }
  }, [reports, map]);
  return null;
}

const FILTER_CATEGORIES: { value: ReportCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
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

  useEffect(() => {
    getApiClient()
      .listReports({ per_page: 200 })
      .then((r) => setReports(r.items))
      .catch((err) => setError('Could not load reports. ' + ((err as Error)?.message ?? '')))
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
    'rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 ' +
    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incident Map"
        subtitle={`${mappable.length} report${mappable.length !== 1 ? 's' : ''} with known location · ${unmappable.length} without coordinates`}
      />

      {hasDemo && <SyntheticBanner />}

      {/* Category filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="map-category-filter" className="text-sm font-medium text-slate-600">
          Filter by category:
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

      {loading ? (
        <LoadingSpinner label="Loading map data…" />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : (
        <>
          {/* Map */}
          <Card>
            <div
              style={{ height: '500px' }}
              className="rounded-xl overflow-hidden"
              role="application"
              aria-label="Interactive map of incident reports"
            >
              {mappable.length > 0 ? (
                <MapContainer
                  center={[mappable[0].latitude!, mappable[0].longitude!]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url={
                      import.meta.env.VITE_MAP_TILE_URL ||
                      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    }
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapFitter reports={filtered} />
                  {mappable.map((r) => (
                    <CircleMarker
                      key={r.id}
                      center={[r.latitude!, r.longitude!]}
                      radius={8}
                      pathOptions={{
                        color: CATEGORY_COLOURS[r.category] ?? '#94a3b8',
                        fillColor: CATEGORY_COLOURS[r.category] ?? '#94a3b8',
                        fillOpacity: 0.7,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div style={{ maxWidth: '220px' }}>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <StatusBadge status={r.status} />
                            <CategoryBadge category={r.category} />
                          </div>
                          <p
                            style={{
                              fontSize: '0.78rem',
                              color: '#334155',
                              lineHeight: 1.5,
                              margin: '0 0 6px',
                            }}
                          >
                            {r.original_description.slice(0, 120)}
                            {r.original_description.length > 120 ? '…' : ''}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>
                            {relativeTime(r.submitted_at)} ·{' '}
                            {r.is_synthetic ? '⚠️ Demo' : 'Browser-stored'}
                          </p>
                          <a
                            href={`/reports/${r.id}`}
                            style={{
                              fontSize: '0.75rem',
                              color: '#0d9488',
                              textDecoration: 'none',
                              marginTop: '4px',
                              display: 'inline-block',
                            }}
                          >
                            View report →
                          </a>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400 bg-slate-50">
                  <EmptyState
                    icon="🗺️"
                    title="No reports with known locations"
                    description="Submit reports with coordinates to see them on the map."
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Legend */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Map Legend</h3>
            <div className="flex flex-wrap gap-3">
              {FILTER_CATEGORIES.filter((c) => c.value).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: CATEGORY_COLOURS[value as ReportCategory],
                    }}
                    aria-hidden="true"
                  />
                  {label}
                </div>
              ))}
            </div>
          </Card>

          {/* Reports without coordinates */}
          {unmappable.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-navy-800">
                  Reports Without Confirmed Location ({unmappable.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  These reports are not plotted on the map. SENTINEL never invents
                  coordinates for unknown locations.
                </p>
              </div>
              <ul className="divide-y divide-slate-50">
                {unmappable.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/reports/${r.id}`}
                      className="block px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {r.original_description}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <StatusBadge status={r.status} />
                            <CategoryBadge category={r.category} />
                            {r.address && <span>📍 {r.address}</span>}
                            <span>{relativeTime(r.submitted_at)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 italic shrink-0">
                          No coordinates
                        </span>
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
