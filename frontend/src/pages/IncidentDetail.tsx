/**
 * SENTINEL — Incident Cluster Audit & Triage
 * Comprehensive cluster telemetry with corroboration details and Missing-Signal inspection stubs
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, Circle, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getApiClient } from '../api';
import type { Incident } from '../types';
import {
  Card,
  PageHeader,
  StatusBadge,
  CategoryBadge,
  PriorityMeter,
  SyntheticBanner,
  LoadingSpinner,
  ErrorAlert,
  SafetyNotice,
} from '../components/ui';
import { SentinelTileLayer } from '../components/SentinelTileLayer';
import { MapErrorBoundary } from '../components/ErrorBoundary';
import { formatDateTime, formatCoords } from '../lib/formatters';
import {
  ChevronRight,
  ArrowLeft,
  Flame,
  MapPin,
  Clock,
  Layers,
  AlertTriangle,
  Sliders,
  Sparkles,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifStatus, setVerifStatus] = useState<any>('verified');
  const [verifOfficer, setVerifOfficer] = useState('Ward Inspection Officer');
  const [verifNote, setVerifNote] = useState('');
  const [verifSuccess, setVerifSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    getApiClient()
      .getIncident(id)
      .then((data) => {
        if (isMounted) setIncident(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError('Could not retrieve incident telemetry. ' + ((err as Error)?.message ?? ''));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !verifNote.trim()) return;
    setVerifying(true);
    setVerifSuccess(null);
    try {
      const updated = await getApiClient().recordVerification(incident.id, {
        new_status: verifStatus,
        changed_by: verifOfficer.trim() || 'Ward Inspection Officer',
        note: verifNote.trim(),
      });
      setIncident(updated);
      setVerifSuccess(`Incident status updated to '${verifStatus}'.`);
      setVerifNote('');
    } catch (err) {
      setError('Failed to record inspection: ' + ((err as Error)?.message ?? ''));
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <LoadingSpinner label="Compiling incident evidence graph…" />;
  if (error) return <ErrorAlert message={error} />;
  if (!incident) return <ErrorAlert message="Incident cluster could not be found." />;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-8 animate-page-enter">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 animate-fade-in stagger-1" aria-label="Breadcrumb">
        <Link to="/" viewTransition className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
        <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{incident.title}</span>
      </nav>

      <div className="animate-card-rise stagger-1">
        <PageHeader
          title="Incident Correlation Audit"
          subtitle={`System-detected anomaly cluster ID ${incident.id}. Grouped by temporal and spatial proximity.`}
          badge="Correlated Anomaly"
        />
      </div>

      <div className="animate-fade-in stagger-2">
        <SyntheticBanner message="This incident was algorithmically synthesized from baseline demonstration data to illustrate multi-report correlation." />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Primary Header, Linked Observations, Milestone 5 Stubs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Primary Header Card — Wide Slab */}
          <Card hoverEffect={true} tilt={false} className="p-6 sm:p-7 animate-card-rise stagger-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Correlated Incident
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                  {incident.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <StatusBadge status={incident.verification_status} size="md" />
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                    Engine: {incident.analysis_version}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-start sm:items-end justify-between gap-3 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold block">Evidence Scope</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{incident.report_ids.length} Linked Observations</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold block">Heuristic Radius</span>
                  <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold">300m · 72h Window</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Corroborating Reports List — Wide Slab Table */}
          <Card tilt={false} className="overflow-hidden animate-card-rise stagger-3">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                  Linked Citizen Observations ({incident.report_ids.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {incident.radius_meters ? `r = ${incident.radius_meters}m buffer` : '300m radius heuristic'}
              </span>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {incident.linked_reports && incident.linked_reports.length > 0 ? (
                incident.linked_reports.map((lr) => (
                  <li key={lr.report_id} className="p-5 sm:p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {lr.report_id.slice(0, 8)}…
                        </span>
                        {lr.category && <CategoryBadge category={lr.category} />}
                        {lr.match_score != null && (
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                            {Math.round(lr.match_score * 100)}% Match
                          </span>
                        )}
                        {lr.distance_from_centroid_meters != null && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {lr.distance_from_centroid_meters}m from centroid
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {lr.is_independent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Independent</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            <Copy className="w-3.5 h-3.5" />
                            <span>Near-Duplicate</span>
                          </span>
                        )}
                        <Link
                          to={`/reports/${lr.report_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline ml-2 shrink-0"
                        >
                          <span>Inspect Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                    {lr.original_description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                        "{lr.original_description}"
                      </p>
                    )}
                  </li>
                ))
              ) : (
                incident.report_ids.map((rid) => (
                  <li key={rid} className="px-6 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                      <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{rid}</span>
                      <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-slate-500">Citizen Observation Record</span>
                    </div>
                    <Link
                      to={`/reports/${rid}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline shrink-0"
                    >
                      <span>Audit Report Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </Card>

          {/* Prioritisation & Missing-Signal Audit Engine (Milestone 5) */}
          <div className="space-y-6 animate-card-rise stagger-4">
            {/* Multi-Factor Score Breakdown */}
            <Card tilt={false} className="overflow-hidden border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                    Multi-Factor Prioritisation Breakdown
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                  Total Index: {incident.priority_score ?? 0}/100
                </span>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Composite prioritization indicator synthesized across six weighted civic dimensions. Missing factors are automatically re-normalized across available evidence.
                </p>

                {incident.priority_assessment?.factors && incident.priority_assessment.factors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incident.priority_assessment.factors.map((f) => (
                      <div
                        key={f.name}
                        className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            {f.name.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              w: {Math.round(f.weight * 100)}%
                            </span>
                            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                              +{f.contribution} pts
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for Normalized Value */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.round(f.normalised_value * 100)}%` }}
                          />
                        </div>

                        {f.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {f.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 italic">
                    Prioritisation factors being calibrated by system engine…
                  </div>
                )}
              </div>
            </Card>

            {/* Missing-Signal Audit Flags */}
            <Card tilt={false} className="overflow-hidden border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                    Missing-Signal Audit Flags
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {incident.missing_signals?.length ?? 0} Flagged Gaps
                </span>
              </div>

              <div className="p-6">
                {incident.missing_signals && incident.missing_signals.length > 0 ? (
                  <div className="space-y-3">
                    {incident.missing_signals.map((sig, idx) => {
                      const isHigh = sig.severity === 'high';
                      const isMed = sig.severity === 'medium';
                      return (
                        <div
                          key={`${sig.rule_id}-${idx}`}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                            isHigh
                              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                              : isMed
                              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                              : 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                  isHigh
                                    ? 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                                    : isMed
                                    ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                                    : 'bg-teal-200/80 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                                }`}
                              >
                                {sig.rule_id}
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                                {sig.severity} Severity Gap
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-200">
                              {sig.explanation}
                            </p>
                          </div>
                          <div className="sm:max-w-xs text-xs text-slate-600 dark:text-slate-400 sm:border-l sm:border-slate-200/80 dark:sm:border-slate-700/80 sm:pl-3">
                            <span className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300">Action:</span>
                            {sig.recommended_action}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>All 8 Missing-Signal validation rules passed. Intelligence profile is complete.</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Auditable Evidence Narrative & Verification Trail */}
            <Card tilt={false} className="overflow-hidden border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                    Auditable Evidence Narrative
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Three-Tier Provenance
                </span>
              </div>

              <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300">
                <div className="space-y-1.5 border-l-2 border-teal-500 pl-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                    Tier 1: Citizen Observations
                  </span>
                  <p className="leading-relaxed">
                    Synthesized from {incident.report_ids.length} geo-referenced citizen observation{incident.report_ids.length !== 1 ? 's' : ''}. First reported at {formatDateTime(incident.first_observed_at)}, latest update at {formatDateTime(incident.last_observed_at)}.
                  </p>
                </div>

                <div className="space-y-1.5 border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                    Tier 2: Model Interpretations
                  </span>
                  <p className="leading-relaxed">
                    Spatio-temporal clustering engine (v{incident.analysis_version}) identified spatial adjacency with a {incident.radius_meters || 300}m heuristic buffer. Priority index calibrated at {incident.priority_score ?? 0}/100.
                  </p>
                </div>

                <div className="space-y-1.5 border-l-2 border-amber-500 pl-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                    Tier 3: Verified Field Inspections
                  </span>
                  <p className="leading-relaxed mb-3">
                    Current verification status: <StatusBadge status={incident.verification_status} size="sm" />.
                  </p>

                  {incident.verification_records && incident.verification_records.length > 0 ? (
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">Inspection Log History:</span>
                      {incident.verification_records.map((rec) => (
                        <div key={rec.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <strong>{rec.changed_by}</strong>
                            <span>{formatDateTime(rec.timestamp)}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 italic">"{rec.note}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No field inspection has been logged yet.</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Priority Meter, Centroid Coordinates, Safety Notice */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Priority Score Box */}
          <Card tilt={true} maxTilt={2.0} className="p-5 sm:p-6 animate-card-rise stagger-3">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Prioritisation Index
              </p>
              <PriorityMeter score={incident.priority_score} />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                Corroborating signals & severity heuristics. Not physical flood probability.
              </p>
            </div>
          </Card>

          {/* Spatial Coordinates Box */}
          <Card tilt={true} maxTilt={2.0} className="p-5 sm:p-6 animate-card-rise stagger-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Centroid Coordinate</span>
                </p>
                <p className="font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                  {formatCoords(incident.centroid_latitude, incident.centroid_longitude)}
                </p>
              </div>
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Initial: {formatDateTime(incident.first_observed_at)}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Latest: {formatDateTime(incident.last_observed_at)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Mini Cluster GIS Map Preview */}
          {incident.centroid_latitude != null && incident.centroid_longitude != null && (
            <Card tilt={false} className="overflow-hidden border-slate-200 dark:border-slate-800 animate-card-rise stagger-5">
              <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Geospatial Cluster Bounds</span>
                </span>
                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
                  r = {incident.radius_meters || 300}m
                </span>
              </div>
              <div style={{ height: '220px' }} className="w-full relative bg-slate-100 dark:bg-slate-900">
                <MapErrorBoundary height="220px">
                  <MapContainer
                    center={[incident.centroid_latitude, incident.centroid_longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <SentinelTileLayer />
                    <Circle
                      center={[incident.centroid_latitude, incident.centroid_longitude]}
                      radius={incident.radius_meters || 300}
                      pathOptions={{ color: '#0d9488', fillColor: '#0d9488', fillOpacity: 0.15, weight: 1.5 }}
                    />
                    <CircleMarker
                      center={[incident.centroid_latitude, incident.centroid_longitude]}
                      radius={7}
                      pathOptions={{ color: '#0f172a', fillColor: '#0d9488', fillOpacity: 1, weight: 2 }}
                    >
                      <Popup>
                        <div className="p-1 text-xs">
                          <strong>Cluster Centroid</strong>
                          <p>{incident.title}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                    {incident.linked_reports?.map((lr) => (
                      lr.latitude != null && lr.longitude != null && (
                        <CircleMarker
                          key={lr.report_id}
                          center={[lr.latitude, lr.longitude]}
                          radius={5}
                          pathOptions={{ color: '#2563eb', fillColor: '#38bdf8', fillOpacity: 0.9, weight: 1 }}
                        >
                          <Popup>
                            <div className="p-1 text-xs">
                              <strong>Citizen Report</strong>
                              {lr.distance_from_centroid_meters != null && (
                                <p>{lr.distance_from_centroid_meters}m from centroid</p>
                              )}
                            </div>
                          </Popup>
                        </CircleMarker>
                      )
                    ))}
                  </MapContainer>
                </MapErrorBoundary>
              </div>
            </Card>
          )}

          {/* Human Inspection Verification Action Box */}
          <Card tilt={false} className="p-5 sm:p-6 border-slate-200 dark:border-slate-800 animate-card-rise stagger-5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Log Field Inspection</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Record on-site human verification to transition incident state from suspected to verified.
            </p>

            {verifSuccess && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
                {verifSuccess}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transition Status
                </label>
                <select
                  value={verifStatus}
                  onChange={(e) => setVerifStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300/80 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
                >
                  <option value="verified">Verified (Confirmed Waterlogging)</option>
                  <option value="under_verification">Under Verification (Crew En Route)</option>
                  <option value="resolved">Resolved (Cleared / Receded)</option>
                  <option value="dismissed">Dismissed (False Positive / Dry)</option>
                  <option value="suspected">Suspected (Unconfirmed)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inspector / Officer Name
                </label>
                <input
                  type="text"
                  value={verifOfficer}
                  onChange={(e) => setVerifOfficer(e.target.value)}
                  placeholder="Officer name or Ward QRT tag"
                  className="w-full rounded-lg border border-slate-300/80 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Field Inspection Notes *
                </label>
                <textarea
                  required
                  rows={2}
                  value={verifNote}
                  onChange={(e) => setVerifNote(e.target.value)}
                  placeholder="e.g. Confirmed 30cm standing water; pump unit deployed."
                  className="w-full rounded-lg border border-slate-300/80 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || !verifNote.trim()}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 transition-all shadow-xs btn-press"
              >
                {verifying ? 'Recording…' : 'Record Verification Audit'}
              </button>
            </form>
          </Card>

          <SafetyNotice />
        </div>
      </div>
    </div>
  );
}
