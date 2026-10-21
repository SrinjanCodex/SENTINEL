/**
 * SENTINEL — Incident Investigation page (Milestone 1 stub)
 *
 * In Milestone 5, this will show the full incident detail with score breakdown,
 * missing signals, and explanation. Currently shows the demo incident data only.
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

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getApiClient()
      .getIncident(id)
      .then(setIncident)
      .catch((err) =>
        setError('Could not load incident. ' + ((err as Error)?.message ?? '')),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading incident…" />;
  if (error) return <ErrorAlert message={error} />;
  if (!incident) return <ErrorAlert message="Incident not found." />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-teal-600">Dashboard</Link>
        <span>›</span>
        <span className="truncate max-w-[240px]">{incident.title}</span>
      </div>

      <PageHeader title="Incident Investigation" />

      <SyntheticBanner message="⚠️ DEMONSTRATION DATA — This incident was automatically generated from synthetic reports to illustrate SENTINEL's features." />

      <div
        role="note"
        className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-2"
      >
        📋 <strong>Milestone 1 placeholder.</strong> Full score breakdown, missing-signal
        detection, and the explainable-alert narrative will appear in Milestone 5. The
        priority score shown is a demonstration value.
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-bold text-navy-800">{incident.title}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge status={incident.verification_status} />
          <span className="text-xs text-slate-400">
            Analysis version: {incident.analysis_version}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Priority Indicator</p>
          <PriorityMeter score={incident.priority_score} />
          <p className="mt-2 text-xs italic text-slate-400">
            This is a prioritisation indicator, not a flood probability.
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Location</p>
          <p className="text-sm text-slate-700">
            {formatCoords(incident.centroid_latitude, incident.centroid_longitude)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            First observed: {formatDateTime(incident.first_observed_at)}
          </p>
          <p className="text-xs text-slate-400">
            Last observed: {formatDateTime(incident.last_observed_at)}
          </p>
        </Card>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-800">
            Linked Reports ({incident.report_ids.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            These reports were grouped into this potential incident by the analysis system.
          </p>
        </div>
        <ul className="divide-y divide-slate-50">
          {incident.report_ids.map((rid) => (
            <li key={rid} className="px-5 py-3">
              <Link
                to={`/reports/${rid}`}
                className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-mono"
              >
                {rid}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* Placeholders for Milestone 5 */}
      <Card className="p-5 bg-slate-50 border-dashed border-2 border-slate-200">
        <h2 className="font-semibold text-slate-500 mb-2">
          📊 Score Breakdown — Available in Milestone 5
        </h2>
        <p className="text-sm text-slate-400 italic">
          A transparent breakdown of each scoring factor (raw value, normalised value,
          weight, and contribution) will appear here once the prioritisation engine
          is implemented.
        </p>
      </Card>

      <Card className="p-5 bg-slate-50 border-dashed border-2 border-slate-200">
        <h2 className="font-semibold text-slate-500 mb-2">
          🔍 Missing-Signal Detector — Available in Milestone 5
        </h2>
        <p className="text-sm text-slate-400 italic">
          Gaps in the evidence (location unknown, no human verification, weather data
          missing, etc.) will be flagged here with recommended actions.
        </p>
      </Card>

      <Card className="p-5 bg-slate-50 border-dashed border-2 border-slate-200">
        <h2 className="font-semibold text-slate-500 mb-2">
          💡 Explainable Alert — Available in Milestone 5
        </h2>
        <p className="text-sm text-slate-400 italic">
          A human-readable explanation separating observations, model interpretations,
          and verified evidence will appear here.
        </p>
      </Card>

      <SafetyNotice />
    </div>
  );
}
