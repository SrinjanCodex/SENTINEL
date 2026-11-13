/**
 * SENTINEL — Overview Dashboard (Bento Layout)
 * Civic waterlogging intelligence command center featuring an asymmetric Bento grid,
 * interactive GIS preview hero tile, active anomaly correlator, and drifting background tiles.
 */
import { useEffect, useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Report[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = reportScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scrollReports = (direction: 'left' | 'right') => {
    const el = reportScrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

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

      {/* Bento Metric Strip: Wide Horizontal Slab KPI Tiles */}
      <section aria-label="Incident Prioritisation Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Reports */}
          <div className="animate-card-rise stagger-1 h-full">
            <Card className="p-4 sm:p-5 h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Total Reports
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight tabular-numbers">
                      {totalReportsCount}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold border border-slate-200/60 dark:border-slate-700/60">
                      Stored
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Community submissions
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Card 2: Potential Clusters */}
          <div className="animate-card-rise stagger-2 h-full">
            <Card className="p-4 sm:p-5 h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Potential Clusters
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-numbers">
                      {clustersCount}
                    </span>
                    <span className="font-mono text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold border border-blue-200/50 dark:border-blue-800/50">
                      Correlated
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Correlated anomalies
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Card 3: Awaiting Inspection */}
          <div className="animate-card-rise stagger-3 h-full">
            <Card className="p-4 sm:p-5 h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Awaiting Inspection
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight tabular-numbers">
                      {awaitingCount}
                    </span>
                    <span className="font-mono text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold border border-amber-200/50 dark:border-amber-800/50">
                      Action Req.
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Field verification
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Card 4: High Priority */}
          <div className="animate-card-rise stagger-4 h-full">
            <Card className="p-4 sm:p-5 h-full relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    High Priority
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight tabular-numbers">
                      {highPriorityCount}
                    </span>
                    <span className="font-mono text-[10px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-semibold border border-red-200/50 dark:border-red-800/50">
                      Indicator
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Index score ≥ 70
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

        </div>
        <p className="mt-2 text-[11px] text-slate-400 italic flex items-center gap-1.5">
          <span>⚠️</span> Priority index (0–100) measures corroborated signal strength and urgency, not physical flood probability.
        </p>
      </section>

      {/* Main Bento Feature Tiles: 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Hero Tile: Interactive GIS Spatial Overview (8 Columns) - Note: Large Map does not tilt */}
        <section className="lg:col-span-8 animate-card-rise stagger-3" aria-label="Spatial GIS Preview">
          <Card tilt={false} className="overflow-hidden h-full flex flex-col shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-2">
                    GIS Spatial Overview
                    <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 px-1.5 py-0.2 rounded">
                      {mappableIncidents.length} Centroids
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cluster centroids plotted on India spatial layer · Radius indicates priority magnitude
                  </p>
                </div>
              </div>

              <Link
                to="/map"
                viewTransition
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all btn-press"
              >
                <span>Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div style={{ height: '420px' }} className="w-full relative bg-slate-100 dark:bg-slate-950 flex-1">
              <MapErrorBoundary height="420px">
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
            <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
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
              <span className="text-slate-400 dark:text-slate-500">Vector tiles with Latin English nomenclature</span>
            </div>
          </Card>
        </section>

        {/* Bento Side Tile: Active Anomalies Correlator (4 Columns) */}
        <section className="lg:col-span-4 animate-card-rise stagger-4" aria-label="Potential Incident Clusters">
          <Card className="h-full flex flex-col shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">Active Anomalies</h2>
              </div>
              <span className="text-[10px] font-mono uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 px-1.5 py-0.5 rounded font-semibold">
                Cluster Feed
              </span>
            </div>

            <ul className="divide-y divide-slate-100/90 dark:divide-slate-800 flex-1 overflow-y-auto" role="list">
              {incidents.slice(0, 4).map((inc, idx) => (
                <li
                  key={inc.id}
                  role="listitem"
                  className={`p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
                      {inc.title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                      {inc.report_ids.length} rpts
                    </span>
                  </div>

                  <PriorityMeter score={inc.priority_score} />

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <StatusBadge status={inc.verification_status} size="sm" />
                    <Link
                      to={`/incidents/${inc.id}`}
                      viewTransition
                      className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Audit Cluster</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 rounded-b-xl">
              <SafetyNotice />
            </div>
          </Card>
        </section>

      </div>

      {/* Lower Bento Grid: Recent Reports & Sensor Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Recent Reports Stream (8 Columns) — Wide Horizontal Slab Card with Horizontal Scroll Carousel */}
        <section className="lg:col-span-8 animate-card-rise stagger-5" aria-label="Recent reports stream">
          <Card className="h-full flex flex-col shadow-sm relative overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-2">
                    Recent Report Stream
                    <span className="text-[10px] font-mono bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 px-1.5 py-0.2 rounded">
                      {recent.length} Logged
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chronological citizen observations · Horizontal carousel with keyboard and scroll-snap support
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {recent.length > 0 && (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => scrollReports('left')}
                      disabled={!canScrollLeft}
                      aria-label="Scroll recent reports left"
                      className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollReports('right')}
                      disabled={!canScrollRight}
                      aria-label="Scroll recent reports right"
                      className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <Link
                  to="/reports"
                  viewTransition
                  className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                >
                  <span>Full Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Horizontal Scroll Slab Container with Edge Fade Cues */}
            <div className="relative flex-1 p-4 overflow-hidden">
              {/* Left edge fade cue */}
              {canScrollLeft && (
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"
                />
              )}

              {/* Right edge fade cue */}
              {canScrollRight && recent.length > 2 && (
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"
                />
              )}

              {recent.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 h-full flex flex-col justify-center items-center">
                  <p>No community reports logged in this session yet.</p>
                  <Link to="/report" viewTransition className="mt-2 text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                    Submit the initial observation →
                  </Link>
                </div>
              ) : (
                <div
                  ref={reportScrollRef}
                  onScroll={checkScroll}
                  tabIndex={0}
                  role="region"
                  aria-label="Recent reports horizontal stream"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      scrollReports('left');
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      scrollReports('right');
                    }
                  }}
                  onWheel={(e) => {
                    const el = reportScrollRef.current;
                    if (el && Math.abs(e.deltaX) < Math.abs(e.deltaY) && Math.abs(e.deltaY) > 5) {
                      el.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {recent.map((r, idx) => (
                    <Link
                      key={r.id}
                      to={`/reports/${r.id}`}
                      viewTransition
                      className={`min-w-[280px] sm:min-w-[320px] max-w-[360px] snap-start shrink-0 flex flex-col justify-between p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-teal-500/60 dark:hover:border-teal-500/60 hover:shadow-sm transition-all group animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <CategoryBadge category={r.category} />
                          <StatusBadge status={r.status} size="sm" />
                          {r.is_synthetic ? (
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200/60 dark:border-amber-800/60 font-medium">
                              DEMO
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-200/60 dark:border-blue-800/60 font-medium">
                              LOCAL
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors font-normal">
                          "{r.original_description}"
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2 truncate max-w-[220px]">
                          {r.address ? (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{r.address}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{relativeTime(r.submitted_at)}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5 font-semibold text-2xs">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Community Sensor Intake Bento Tile (4 Columns) — Right-Hand Side */}
        <section className="lg:col-span-4 animate-card-rise stagger-6" aria-label="Community Sensor Information">
          <Card className="p-5 h-full flex flex-col justify-between bg-gradient-to-br from-teal-500/10 via-slate-50 to-white dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 border-teal-200/70 dark:border-teal-800/70 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                    Citizen Sensor Network
                  </span>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    Heuristic Signal Pipeline
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Observed standing road water or blocked drainage? Submissions feed directly into spatial-temporal clustering models to identify systemic municipal failures.
              </p>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
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

            <div className="pt-4 border-t border-teal-100/80 dark:border-teal-900/60">
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
