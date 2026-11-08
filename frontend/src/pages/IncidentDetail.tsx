/**
 * SENTINEL — Incident Cluster Audit & Triage
 * Comprehensive cluster telemetry with corroboration details and Missing-Signal inspection stubs
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApiClient } from '../api';
import type { Incident } from '../types';
import {
  Card,
  PageHeader,
  StatusBadge,
  PriorityMeter,
  SyntheticBanner,
  LoadingSpinner,
  ErrorAlert,
  SafetyNotice,
} from '../components/ui';
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
} from 'lucide-react';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApiClient()
      .getIncident(id)
      .then(setIncident)
      .catch((err) =>
        setError('Could not retrieve incident telemetry. ' + ((err as Error)?.message ?? '')),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Compiling incident evidence graph…" />;
  if (error) return <ErrorAlert message={error} />;
  if (!incident) return <ErrorAlert message="Incident cluster could not be found." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8 animate-page-enter">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 animate-fade-in stagger-1" aria-label="Breadcrumb">
        <Link to="/" viewTransition className="hover:text-teal-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-mono text-slate-700 truncate max-w-[240px]">{incident.title}</span>
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

      {/* Primary Header Card */}
      <Card hoverEffect={true} className="p-5 sm:p-6 animate-card-rise stagger-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Correlated Incident
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {incident.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StatusBadge status={incident.verification_status} size="md" />
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Engine: {incident.analysis_version}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Priority Score Box */}
        <Card tilt3d={true} maxTilt={3} className="p-4 sm:p-5 animate-card-rise stagger-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Prioritisation Index
          </p>
          <PriorityMeter score={incident.priority_score} />
          <p className="mt-3 text-[11px] text-slate-400 italic">
            Prioritisation index reflects corroborating signals and severity heuristics, not physical flood probability.
          </p>
        </Card>

        {/* Spatial Coordinates Box */}
        <Card tilt3d={true} maxTilt={3} className="p-4 sm:p-5 animate-card-rise stagger-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Centroid Coordinate</span>
          </p>
          <p className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block mb-2">
            {formatCoords(incident.centroid_latitude, incident.centroid_longitude)}
          </p>
          <div className="space-y-1 text-xs text-slate-500">
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Initial Observation: {formatDateTime(incident.first_observed_at)}</span>
            </p>
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Latest Observation: {formatDateTime(incident.last_observed_at)}</span>
            </p>
          </div>
        </Card>

      </div>

      {/* Corroborating Reports List */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
              Linked Citizen Observations ({incident.report_ids.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Linked via 300m radius heuristic</span>
        </div>

        <ul className="divide-y divide-slate-100">
          {incident.report_ids.map((rid) => (
            <li key={rid} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="font-mono text-xs font-semibold text-slate-800">{rid}</span>
              </div>
              <Link
                to={`/reports/${rid}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 underline"
              >
                <span>Audit Report Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* Advanced Features Pipeline Stubs (Milestone 5) */}
      <div className="space-y-4">
        
        {/* Score Breakdown Stub */}
        <Card className="p-5 border-dashed border-slate-300 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-2 text-slate-700">
            <Sliders className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Multi-Factor Score Breakdown (Planned · Milestone 5)
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upon activation of the Prioritisation Engine in Milestone 5, this panel will display the exact raw factor value, normalized value, weight coefficient, and contribution percentage for each of the six input factors.
          </p>
        </Card>

        {/* Missing-Signal Detector Stub */}
        <Card className="p-5 border-dashed border-slate-300 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-2 text-slate-700">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Missing-Signal Audit Flags (Planned · Milestone 5)
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Missing-Signal rules (MS-LOC, MS-VERIFY, MS-CONFLICT, MS-INDEP, MS-HIST, MS-WX) will run deterministically against stored evidence and flag actionable field instructions here.
          </p>
        </Card>

        {/* Explainable Alert Stub */}
        <Card className="p-5 border-dashed border-slate-300 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-2 text-slate-700">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Auditable Evidence Narrative (Planned · Milestone 5)
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deterministic code will generate a human-readable explanation explicitly segregating Observations, Model Interpretations, and Verified Field Inspections.
          </p>
        </Card>

      </div>

      <SafetyNotice />
    </div>
  );
}
