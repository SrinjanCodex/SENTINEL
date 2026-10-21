/**
 * SENTINEL — Overview Dashboard
 * Civic waterlogging intelligence command center with refined telemetry cards & interactive GIS preview
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SentinelTileLayer } from '../components/SentinelTileLayer';

import { getApiClient } from '../api';
import type { DashboardStats, Report, Incident } from '../types';
import {
  StatCard,
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
      <div className="space-y-6 animate-pulse py-2" aria-busy="true" aria-label="Loading intelligence feed">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-200/80 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200/80 rounded-xl" />
          <div className="h-72 bg-slate-200/80 rounded-xl" />
        </div>
        <div className="h-80 bg-slate-200/80 rounded-xl" />
      </div>
    );
  }

  const mappableIncidents = incidents.filter(
    (i) => i.centroid_latitude != null && i.centroid_longitude != null,
  );

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Overview Dashboard
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time urban drainage telemetry, community observations, and algorithmic incident correlation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs hover:shadow-teal-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 btn-press"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Observation</span>
          </Link>
        </div>
      </div>

      {/* Demonstration Banner */}
      {stats?.is_demonstration && (
        <SyntheticBanner message="Dashboard computes indicators from demonstration baseline records plus any reports submitted within this browser session." />
      )}

      {/* Primary KPI Metrics */}
      <section aria-label="Incident Prioritisation Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Reports"
            value={stats?.total_reports ?? 0}
            sub="Community submissions"
            icon={FileText}
            accent="default"
            badge="Stored"
          />
          <StatCard
            label="Potential Clusters"
            value={stats?.potential_incidents ?? 0}
            sub="Correlated anomalies"
            icon={Layers}
            accent="blue"
            badge="Correlated"
          />
          <StatCard
            label="Awaiting Inspection"
            value={stats?.awaiting_verification ?? 0}
            sub="Pending field confirmation"
            icon={Clock}
            accent="amber"
            badge="Action Req."
          />
          <StatCard
            label="High Priority"
            value={stats?.high_priority_incidents ?? 0}
            sub="Index score ≥ 70"
            icon={ShieldAlert}
            accent="red"
            badge="Indicator"
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400 italic flex items-center gap-1">
          <span>⚠️</span> Priority index (0–100) measures corroborated signal strength and urgency, not physical flood probability.
        </p>
      </section>

      {/* Content Grid: Recent Reports & Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Reports Stream */}
        <section className="lg:col-span-2" aria-label="Recent reports stream">
          <Card className="h-full flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <h2 className="font-semibold text-slate-900 text-sm tracking-tight">Recent Report Stream</h2>
              </div>
              <Link
                to="/reports"
                className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex-1 flex flex-col justify-center items-center">
                <p>No community reports logged in this session yet.</p>
                <Link to="/report" className="mt-2 text-teal-600 font-semibold hover:underline">
                  Submit the initial observation →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100/90 flex-1" role="list">
                {recent.map((r, idx) => (
                  <li key={r.id} role="listitem" className={`animate-fade-in stagger-${Math.min(idx + 1, 5)}`}>
                    <Link
                      to={`/reports/${r.id}`}
                      className="block px-5 py-3.5 hover:bg-slate-50/80 transition-all duration-150 group"
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
                              <span className="flex items-center gap-1 truncate max-w-[220px]">
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

        {/* Priority Hotspots / Incident Clusters */}
        <section aria-label="Potential Incident Clusters">
          <Card className="h-full flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-slate-900 text-sm tracking-tight">Active Anomalies</h2>
              </div>
              <span className="text-[10px] font-mono uppercase bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded">
                Correlation
              </span>
            </div>

            <ul className="divide-y divide-slate-100/90 flex-1" role="list">
              {incidents.slice(0, 4).map((inc, idx) => (
                <li key={inc.id} role="listitem" className={`p-4 hover:bg-slate-50/60 transition-colors animate-fade-in stagger-${Math.min(idx + 1, 5)}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1 leading-snug">
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
                      className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
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

      {/* GIS Spatial Telemetry Section */}
      <section aria-label="Spatial GIS Preview">
        <Card className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-blue-600" />
              <div>
                <h2 className="font-semibold text-slate-900 text-sm tracking-tight">GIS Spatial Overview</h2>
                <p className="text-[11px] text-slate-500">
                  Cluster centroids plotted on OpenStreetMap layer · Radius indicates priority magnitude
                </p>
              </div>
            </div>
            <Link
              to="/map"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-md shadow-2xs hover:shadow-xs transition-all"
            >
              <span>Full Interactive Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div style={{ height: '340px' }} className="w-full relative bg-slate-100">
            {mappableIncidents.length > 0 ? (
              <MapContainer
                center={[
                  mappableIncidents[0].centroid_latitude!,
                  mappableIncidents[0].centroid_longitude!,
                ]}
                zoom={13}
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
          </div>
        </Card>
      </section>

      {/* Community Observation Intake Card */}
      <Card className="p-5 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border-teal-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">Community Sensor</span>
            </div>
            <p className="font-bold text-slate-900 text-base">
              Identified active street waterlogging or storm drain overflow?
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              Submissions feed directly into the matching and missing-signal heuristic engine to identify systemic municipal failures.
            </p>
          </div>
          <Link
            to="/report"
            className="shrink-0 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 btn-press"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File New Observation</span>
          </Link>
        </div>
      </Card>

    </div>
  );
}
