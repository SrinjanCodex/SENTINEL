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
import GradientText from '../components/GradientText';
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
import { relativeTime, formatCoords, formatDateTime } from '../lib/formatters';
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
      client.listReports({ per_page: 8 }),
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
        <FloatingTiles count={4} />

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
              <GradientText
                colors={['#ffffff', '#2dd4bf', '#38bdf8', '#ffffff']}
                animationSpeed={8}
                showBorder={false}
                className="inline-block"
              >
                Civic Intelligence Overview
              </GradientText>
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

      {/* Bento Metric Strip: Row 1 — 4 Wide Short KPI Slab Tiles */}
      <section aria-label="Incident Prioritisation Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Card 1: Total Reports */}
          <div className="animate-card-rise stagger-1 h-full">
            <Card
              tilt={true}
              maxTilt={1.5}
              className="p-5 sm:p-6 min-h-[120px] max-h-[140px] flex items-center justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Total Reports
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight tabular-numbers">
                      {totalReportsCount}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-semibold border border-slate-200/60 dark:border-slate-700/60 inline-block">
                  Stored
                </span>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Community submissions
                </p>
              </div>
            </Card>
          </div>

          {/* Card 2: Potential Clusters */}
          <div className="animate-card-rise stagger-2 h-full">
            <Card
              tilt={true}
              maxTilt={1.5}
              className="p-5 sm:p-6 min-h-[120px] max-h-[140px] flex items-center justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Potential Clusters
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-numbers">
                      {clustersCount}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-semibold border border-blue-200/50 dark:border-blue-800/50 inline-block">
                  Correlated
                </span>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Correlated anomalies
                </p>
              </div>
            </Card>
          </div>

          {/* Card 3: Awaiting Inspection */}
          <div className="animate-card-rise stagger-3 h-full">
            <Card
              tilt={true}
              maxTilt={1.5}
              className="p-5 sm:p-6 min-h-[120px] max-h-[140px] flex items-center justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Awaiting Inspection
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight tabular-numbers">
                      {awaitingCount}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-semibold border border-amber-200/50 dark:border-amber-800/50 inline-block">
                  Action Req.
                </span>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Field verification
                </p>
              </div>
            </Card>
          </div>

          {/* Card 4: High Priority */}
          <div className="animate-card-rise stagger-4 h-full">
            <Card
              tilt={true}
              maxTilt={1.5}
              className="p-5 sm:p-6 min-h-[120px] max-h-[140px] flex items-center justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    High Priority
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-red-600 dark:text-red-400 tracking-tight tabular-numbers">
                      {highPriorityCount}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-semibold border border-red-200/50 dark:border-red-800/50 inline-block">
                  Indicator
                </span>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Index score ≥ 70
                </p>
              </div>
            </Card>
          </div>

        </div>
        <p className="mt-2 text-[11px] text-slate-400 italic flex items-center gap-1.5">
          <span>⚠️</span> Priority index (0–100) measures corroborated signal strength and urgency, not physical flood probability.
        </p>
      </section>

      {/* Row 2: Two-Column Grid — LEFT: Recent Report Stream Slab (2/3) | RIGHT: Heuristic Signal Pipeline (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Recent Reports Stream (8 Columns) — ONE Big Horizontal Slab Card with Full-Width Horizontal Rows */}
        <section className="lg:col-span-8 animate-card-rise stagger-3" aria-label="Recent reports stream">
          <Card tilt={false} className="h-full min-h-[420px] flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div>
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight flex items-center gap-2">
                      Recent Report Stream
                      <span className="text-[10px] font-mono bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 px-2 py-0.5 rounded font-semibold">
                        {recent.length} Logged
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chronological citizen ground observations arranged in horizontal telemetry rows
                    </p>
                  </div>
                </div>

                <Link
                  to="/reports"
                  viewTransition
                  className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                >
                  <span>View All Reports</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Full-Width Horizontal Report Rows */}
              {recent.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col justify-center items-center">
                  <p>No community reports logged in this session yet.</p>
                  <Link to="/report" viewTransition className="mt-2 text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                    Submit the initial observation →
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800" role="list">
                  {recent.slice(0, 4).map((r, idx) => (
                    <li
                      key={r.id}
                      role="listitem"
                      className={`p-4 sm:px-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Title and Description on the Left */}
                        <div className="flex-1 min-w-0 pr-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {r.id}
                            </span>
                            {r.is_synthetic ? (
                              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded font-semibold border border-amber-200/60 dark:border-amber-800/60">
                                DEMO
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded font-semibold border border-blue-200/60 dark:border-blue-800/60">
                                LOCAL
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-normal">
                            "{r.original_description}"
                          </p>
                        </div>

                        {/* Category, Status Badge, Location, and Time as Columns on the Right */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                          <CategoryBadge category={r.category} />
                          <StatusBadge status={r.status} size="sm" />

                          {r.address ? (
                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{r.address}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Unmapped</span>
                          )}

                          <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{relativeTime(r.submitted_at)}</span>
                          </span>

                          <Link
                            to={`/reports/${r.id}`}
                            viewTransition
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 pl-2 group"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>

                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing latest verified citizen reports</span>
              <Link to="/reports" viewTransition className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                Explore full directory ({recent.length}) →
              </Link>
            </div>
          </Card>
        </section>

        {/* Community Sensor Intake Bento Tile (4 Columns) — Right-Hand Side */}
        <section className="lg:col-span-4 animate-card-rise stagger-4" aria-label="Community Sensor Information">
          <Card tilt={false} className="p-6 h-full min-h-[420px] flex flex-col justify-between bg-gradient-to-br from-teal-500/10 via-slate-50 to-white dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 border-teal-200/70 dark:border-teal-800/70 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                    Citizen Sensor Network
                  </span>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                    Heuristic Signal Pipeline
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Observed standing road water or blocked drainage? Submissions feed directly into spatial-temporal clustering models to identify systemic municipal failures.
              </p>

              <div className="space-y-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>Sub-kilometer spatial clustering</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>Multimodal validation & confidence score</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>Transparent audit trails</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-teal-100/80 dark:border-teal-900/60">
              <Link
                to="/report"
                viewTransition
                className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-xs hover:shadow-md transition-all btn-press"
              >
                <PlusCircle className="w-4 h-4" />
                <span>File New Observation</span>
              </Link>
            </div>
          </Card>
        </section>

      </div>

      {/* Row 3: Active Anomalies / Hotspots as Large Feature Cards (2 or 3 per row) */}
      <section aria-label="Active Anomalies & Cluster Hotspots" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-card-rise stagger-4">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Active Anomalies & Cluster Hotspots
            </h2>
          </div>
          <span className="text-xs font-mono uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
            Cluster Feed ({incidents.length} Detected)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.slice(0, 3).map((inc, idx) => (
            <Card
              key={inc.id}
              tilt={true}
              maxTilt={2.0}
              className={`p-6 min-h-[220px] flex flex-col justify-between shadow-sm border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all animate-card-rise stagger-${Math.min(idx + 3, 6)}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {inc.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700 shrink-0">
                    {inc.report_ids.length} Reports
                  </span>
                </div>

                <PriorityMeter score={inc.priority_score} />

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p className="flex items-center gap-1.5 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Centroid: {formatCoords(inc.centroid_latitude, inc.centroid_longitude)}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>First observed: {formatDateTime(inc.first_observed_at)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <StatusBadge status={inc.verification_status} size="sm" />
                <Link
                  to={`/incidents/${inc.id}`}
                  viewTransition
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline"
                >
                  <span>Audit Cluster Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Row 4: Wide Map Preview — GIS Spatial Overview (Full Width, >=400px tall) */}
      <section className="animate-card-rise stagger-5" aria-label="Spatial GIS Preview">
        <Card tilt={false} className="overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight flex items-center gap-2">
                  GIS Spatial Overview
                  <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 rounded font-semibold">
                    {mappableIncidents.length} Centroids
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cluster centroids plotted on India spatial layer · Radius indicates priority magnitude
                </p>
              </div>
            </div>

            <Link
              to="/map"
              viewTransition
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2 rounded-lg shadow-2xs hover:shadow-xs transition-all btn-press"
            >
              <span>Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div style={{ height: '440px', minHeight: '440px' }} className="w-full relative bg-slate-100 dark:bg-slate-950">
            <MapErrorBoundary height="440px">
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
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Urgent (≥75)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate (50–74)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Routine (&lt;50)
              </span>
            </div>
            <span className="text-slate-400 dark:text-slate-500">Vector tiles with Latin English nomenclature</span>
          </div>
        </Card>
      </section>

      <div className="pt-2">
        <SafetyNotice />
      </div>

    </div>
  );
}
