/**
 * SENTINEL — Overview Dashboard
 *
 * Shows aggregate statistics computed from stored reports and incidents.
 * Numbers come from the API (real data or demo data via MockApiClient).
 * Demonstration data is clearly labelled.
 *
 * ⚠️  Priority scores shown here are incident-prioritisation indicators.
 *     They are NOT probabilities of flooding or disaster.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { getApiClient } from '../api';
import type { DashboardStats, Report, Incident } from '../types';
import {
  StatCard,
  Card,
  SyntheticBanner,
  LoadingSpinner,
  ErrorAlert,
  PriorityMeter,
  SafetyNotice,
  StatusBadge,
} from '../components/ui';
import { relativeTime } from '../lib/formatters';

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
        setError('Could not load dashboard data. ' + (err?.message ?? '')),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error) return <ErrorAlert message={error} />;

  const mappableIncidents = incidents.filter(
    (i) => i.centroid_latitude != null && i.centroid_longitude != null,
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Overview Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Community waterlogging intelligence — aggregated from submitted reports.
        </p>
      </div>

      {stats?.is_demonstration && (
        <SyntheticBanner message="Dashboard includes DEMONSTRATION DATA — synthetic records used to illustrate SENTINEL's features. Your submitted reports are included in the counts." />
      )}

      {/* Stat cards */}
      <section aria-label="Summary statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Reports"
            value={stats?.total_reports ?? 0}
            sub="All submitted reports"
          />
          <StatCard
            label="Potential Incidents"
            value={stats?.potential_incidents ?? 0}
            sub="System-detected clusters"
            accent="blue"
          />
          <StatCard
            label="Awaiting Verification"
            value={stats?.awaiting_verification ?? 0}
            sub="Require human inspection"
            accent="amber"
          />
          <StatCard
            label="High Priority"
            value={stats?.high_priority_incidents ?? 0}
            sub="Score ≥ 70 (indicator only)"
            accent="red"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400 italic">
          ⚠️ Priority scores are incident-prioritisation indicators, not probabilities of flooding or disaster.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent reports */}
        <section className="lg:col-span-2" aria-label="Recent reports">
          <Card>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-navy-800">Recent Reports</h2>
              <Link
                to="/reports"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No reports yet. Be the first to{' '}
                <Link to="/report" className="text-teal-600 hover:underline">
                  submit a report
                </Link>
                .
              </div>
            ) : (
              <ul className="divide-y divide-slate-50" role="list">
                {recent.map((r) => (
                  <li key={r.id} role="listitem">
                    <Link
                      to={`/reports/${r.id}`}
                      className="block px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {r.original_description}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {relativeTime(r.submitted_at)}
                            </span>
                            {r.address && (
                              <span className="text-xs text-slate-400 truncate max-w-[180px]">
                                📍 {r.address}
                              </span>
                            )}
                            {r.is_synthetic && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                Demo
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Potential hotspots */}
        <section aria-label="Potential hotspots">
          <Card className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-navy-800">Potential Hotspots</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                System-detected clusters · prioritisation indicators only
              </p>
            </div>
            <ul className="divide-y divide-slate-50 flex-1" role="list">
              {incidents.slice(0, 4).map((inc) => (
                <li key={inc.id} role="listitem" className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">
                    {inc.title}
                  </p>
                  <div className="mt-1.5">
                    <PriorityMeter score={inc.priority_score} />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={inc.verification_status} />
                    <span className="text-xs text-slate-400">
                      {inc.report_ids.length} report{inc.report_ids.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <SafetyNotice />
          </Card>
        </section>
      </div>

      {/* Map preview */}
      <section aria-label="Incident location map">
        <Card>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-navy-800">Map Preview</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Potential incident locations · click a marker for details
              </p>
            </div>
            <Link
              to="/map"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Full map →
            </Link>
          </div>
          <div style={{ height: '320px' }} className="rounded-b-xl overflow-hidden">
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
                <TileLayer
                  url={
                    import.meta.env.VITE_MAP_TILE_URL ||
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  }
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {mappableIncidents.map((inc) => {
                  const score = inc.priority_score ?? 0;
                  const colour =
                    score >= 75 ? '#dc2626' : score >= 50 ? '#f59e0b' : '#0d9488';
                  return (
                    <CircleMarker
                      key={inc.id}
                      center={[inc.centroid_latitude!, inc.centroid_longitude!]}
                      radius={10 + score / 10}
                      pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.6 }}
                    >
                      <Popup>
                        <strong>{inc.title}</strong>
                        <br />
                        Priority indicator: {score}/100
                        <br />
                        <StatusBadge status={inc.verification_status} />
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                No incidents with known locations yet.
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Quick report CTA */}
      <Card className="p-5 bg-teal-50 border-teal-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-teal-900">
              Observed a waterlogging issue?
            </p>
            <p className="text-sm text-teal-700 mt-0.5">
              Your report helps identify and prioritise drainage problems.
            </p>
          </div>
          <Link
            to="/report"
            className="shrink-0 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            Submit a Report
          </Link>
        </div>
      </Card>
    </div>
  );
}
