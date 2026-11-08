/**
 * SENTINEL — Overview Dashboard (Bento Layout)
 * Civic waterlogging intelligence command center featuring an asymmetric Bento grid,
 * interactive GIS preview hero tile, active anomaly correlator, and drifting background tiles.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SentinelTileLayer } from '../components/SentinelTileLayer';
import { MapErrorBoundary } from '../components/ErrorBoundary';
import { FloatingTiles } from '../components/FloatingTiles';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../lib/mapConfig';
import { useCountUp } from '../lib/useCountUp';

import { getApiClient } from '../api';
import type { DashboardStats, Report, Incident } from '../types';
import {
  Card,
  SyntheticBanner,
  ErrorAlert,
  PriorityMeter,
  SafetyNotice,
  StatusBadge,
  CategoryBadge,
} from '../components/ui';
import { relativeTime } from '../lib/formatters';
import {
  FileText,
  Layers,
  Clock,
  ShieldAlert,
  MapPin,
  ArrowRight,
  Map,
  PlusCircle,
  Activity,
  Flame,
  Radio,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Report[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getApiClient();
    Promise.all([
      client.getDashboardStats(),
      client.listReports({ per_page: 5 }),
      client.listIncidents(),
    ])
      .then(([s, r, i]) => {
        setStats(s);
        setRecent(r.items);
        setIncidents(i.items);
      })
      .catch((err) =>
        setError('Could not retrieve dashboard intelligence. ' + (err?.message ?? '')),
      )
      .finally(() => setLoading(false));
  }, []);

  const totalReportsCount = useCountUp(stats?.total_reports ?? 0, 750);
  const clustersCount = useCountUp(stats?.potential_incidents ?? 0, 750);
  const awaitingCount = useCountUp(stats?.awaiting_verification ?? 0, 750);
  const highPriorityCount = useCountUp(stats?.high_priority_incidents ?? 0, 750);

  if (error) {
    return (
      <div className="py-6">
        <ErrorAlert message={error} />
      </div>
    );
  }

  // Skeleton loading view
  if (loading) {
    return (
      <div className="space-y-6 py-2" aria-busy="true" aria-label="Loading intelligence feed">
        <div className="h-28 bg-slate-200/80 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-slate-200/70 rounded-xl skeleton-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-slate-200/70 rounded-xl skeleton-shimmer" />
          <div className="lg:col-span-4 h-96 bg-slate-200/70 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const mappableIncidents = incidents.filter(
    (i) => i.centroid_latitude != null && i.centroid_longitude != null,
  );

  return (
    <div className="space-y-6 pb-6 animate-page-enter">
      
      {/* Bento Header Tile with Ambient Floating Shapes & Grid Texture */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-sm animate-card-rise stagger-1">
        <div className="absolute inset-0 civic-grid-pattern opacity-40 pointer-events-none" />
        <FloatingTiles count={6} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Live Civic Telemetry
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Region: National (India Focus)
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Civic Intelligence Overview
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Algorithmic incident clustering, cross-source waterlogging correlation, and automated municipal triage.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <Link
              to="/report"
              viewTransition
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-teal-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 btn-press"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Observation</span>
            </Link>
            <Link
              to="/map"
              viewTransition
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 btn-press"
            >
              <Map className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Spatial Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Demonstration Banner */}
      {stats?.is_demonstration && (
        <div className="animate-fade-in stagger-2">
          <SyntheticBanner message="Dashboard computes indicators from demonstration baseline records plus any reports submitted within this browser session." />
        </div>
      )}

      {/* Bento Metric Strip: Asymmetric KPI Layout */}
      <section aria-label="Incident Prioritisation Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Reports */}
          <Card tilt3d={true} maxTilt={4} className="p-4 sm:p-5 relative overflow-hidden group hover:border-slate-300 animate-card-rise stagger-1">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-600 tracking-tight">Total Reports</span>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-numbers">
              {totalReportsCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Community submissions</span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                Stored
              </span>
            </div>
          </Card>

          {/* Card 2: Potential Clusters */}
          <Card tilt3d={true} maxTilt={4} className="p-4 sm:p-5 relative overflow-hidden group hover:border-slate-300 animate-card-rise stagger-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-600 tracking-tight">Potential Clusters</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight tabular-numbers">
              {clustersCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Correlated anomalies</span>
              <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium border border-blue-200/50">
                Correlated
              </span>
            </div>
          </Card>

          {/* Card 3: Awaiting Inspection */}
          <Card tilt3d={true} maxTilt={4} className="p-4 sm:p-5 relative overflow-hidden group hover:border-slate-300 animate-card-rise stagger-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-600 tracking-tight">Awaiting Inspection</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight tabular-numbers">
              {awaitingCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Field verification</span>
              <span className="font-mono text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-medium border border-amber-200/50">
                Action Req.
              </span>
            </div>
          </Card>

          {/* Card 4: High Priority */}
          <Card tilt3d={true} maxTilt={4} className="p-4 sm:p-5 relative overflow-hidden group hover:border-slate-300 animate-card-rise stagger-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-600 tracking-tight">High Priority</span>
              <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight tabular-numbers">
              {highPriorityCount}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Index score ≥ 70</span>
              <span className="font-mono text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-medium border border-red-200/50">
                Indicator
              </span>
            </div>
          </Card>

        </div>
        <p className="mt-2 text-[11px] text-slate-400 italic flex items-center gap-1.5">
          <span>⚠️</span> Priority index (0–100) measures corroborated signal strength and urgency, not physical flood probability.
        </p>
      </section>

      {/* Main Bento Feature Tiles: 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Hero Tile: Interactive GIS Spatial Overview (8 Columns) - Note: Large Map does not tilt */}
        <section className="lg:col-span-8 animate-card-rise stagger-3" aria-label="Spatial GIS Preview">
          <Card className="overflow-hidden h-full flex flex-col shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    GIS Spatial Overview
                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200/60 px-1.5 py-0.2 rounded">
                      {mappableIncidents.length} Centroids
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Cluster centroids plotted on India spatial layer · Radius indicates priority magnitude
                  </p>
                </div>
              </div>

              <Link
                to="/map"
                viewTransition
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all btn-press"
              >
                <span>Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div style={{ height: '360px' }} className="w-full relative bg-slate-100 flex-1">
              <MapErrorBoundary height="360px">
                {mappableIncidents.length > 0 ? (
                  <MapContainer
                    center={DEFAULT_MAP_CENTER}
                    zoom={DEFAULT_MAP_ZOOM}
                    style={{ height: '100%', width: '100%' }}
                    aria-label="Map of potential incident locations"
                  >
                    <SentinelTileLayer />
                    {mappableIncidents.map((inc) => {
                      const score = inc.priority_score ?? 0;
                      const colour =
                        score >= 75 ? '#dc2626' : score >= 50 ? '#f59e0b' : '#0d9488';
                      return (
                        <CircleMarker
                          key={inc.id}
                          center={[inc.centroid_latitude!, inc.centroid_longitude!]}
                          radius={10 + score / 10}
                          pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.65, weight: 2 }}
                        >
                          <Popup>
                            <div className="p-1 max-w-[200px]">
                              <p className="font-bold text-xs text-slate-900 mb-1">{inc.title}</p>
                              <div className="mb-2">
                                <PriorityMeter score={score} />
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <StatusBadge status={inc.verification_status} size="sm" />
                                <Link to={`/incidents/${inc.id}`} className="text-teal-600 font-semibold underline">
                                  View
                                </Link>
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">
                    No incidents with validated geographic coordinates available.
                  </div>
                )}
              </MapErrorBoundary>
            </div>

            {/* Map Legend Footer */}
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Urgent (≥75)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (50–74)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600" /> Routine (&lt;50)
                </span>
              </div>
              <span className="text-slate-400">Vector tiles with Latin English nomenclature</span>
            </div>
          </Card>
        </section>

        {/* Bento Side Tile: Active Anomalies Correlator (4 Columns) */}
        <section className="lg:col-span-4 animate-card-rise stagger-4" aria-label="Potential Incident Clusters">
          <Card className="h-full flex flex-col shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Active Anomalies</h2>
              </div>
              <span className="text-[10px] font-mono uppercase bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                Cluster Feed
              </span>
            </div>

            <ul className="divide-y divide-slate-100/90 flex-1 overflow-y-auto" role="list">
              {incidents.slice(0, 4).map((inc, idx) => (
                <li
                  key={inc.id}
                  role="listitem"
                  className={`p-4 hover:bg-slate-50/80 transition-colors animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                      {inc.title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {inc.report_ids.length} rpts
                    </span>
                  </div>

                  <PriorityMeter score={inc.priority_score} />

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <StatusBadge status={inc.verification_status} size="sm" />
                    <Link
                      to={`/incidents/${inc.id}`}
                      viewTransition
                      className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                    >
                      Audit <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="p-4 border-t border-slate-100 bg-slate-50/40 rounded-b-xl">
              <SafetyNotice />
            </div>
          </Card>
        </section>

      </div>

      {/* Lower Bento Grid: Recent Reports & Sensor Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Reports Stream (8 Columns) */}
        <section className="lg:col-span-8 animate-card-rise stagger-5" aria-label="Recent reports stream">
          <Card className="h-full flex flex-col shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Recent Report Stream</h2>
              </div>
              <Link
                to="/reports"
                viewTransition
                className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex-1 flex flex-col justify-center items-center">
                <p>No community reports logged in this session yet.</p>
                <Link to="/report" viewTransition className="mt-2 text-teal-600 font-semibold hover:underline">
                  Submit the initial observation →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100/90 flex-1" role="list">
                {recent.map((r, idx) => (
                  <li key={r.id} role="listitem" className={`animate-fade-in stagger-${Math.min(idx + 1, 5)}`}>
                    <Link
                      to={`/reports/${r.id}`}
                      viewTransition
                      className="block px-5 py-3.5 hover:bg-slate-50/90 transition-all duration-150 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <CategoryBadge category={r.category} />
                            <StatusBadge status={r.status} size="sm" />
                            {r.is_synthetic ? (
                              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 font-medium">
                                DEMO
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60 font-medium">
                                LOCAL
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-slate-700 line-clamp-2 leading-relaxed group-hover:text-slate-900 transition-colors">
                            {r.original_description}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {relativeTime(r.submitted_at)}
                            </span>
                            {r.address && (
                              <span className="flex items-center gap-1 truncate max-w-[240px]">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{r.address}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0 self-center">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Community Sensor Intake Bento Tile (4 Columns) - Feature tile with 3D feel */}
        <section className="lg:col-span-4 animate-card-rise stagger-6" aria-label="Community Sensor Information">
          <Card tilt3d={true} maxTilt={3} className="p-5 h-full flex flex-col justify-between bg-gradient-to-br from-teal-500/10 via-slate-50 to-white border-teal-200/70 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                    Citizen Sensor Network
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Heuristic Signal Pipeline
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Observed standing road water or blocked drainage? Submissions feed directly into spatial-temporal clustering models to identify systemic municipal failures.
              </p>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>Sub-kilometer spatial clustering</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>Multimodal validation & confidence score</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>Transparent audit trails</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-teal-100/80">
              <Link
                to="/report"
                viewTransition
                className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all btn-press"
              >
                <PlusCircle className="w-4 h-4" />
                <span>File New Observation</span>
              </Link>
            </div>
          </Card>
        </section>

      </div>

    </div>
  );
}
