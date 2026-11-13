/**
 * SENTINEL — Incident Observation Audit & Inspection
 * Verifiable evidence sheet preserving unaltered citizen telemetry
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApiClient } from '../api';
import type { Report } from '../types';
import {
  Card,
  StatusBadge,
  CategoryBadge,
  SyntheticBanner,
  LoadingSpinner,
  ErrorAlert,
  PageHeader,
  SafetyNotice,
} from '../components/ui';
import { formatDateTime, severityLabel } from '../lib/formatters';
import {
  ChevronRight,
  MapPin,
  Clock,
  Compass,
  Fingerprint,
  FileText,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  Camera,
} from 'lucide-react';

function FieldRow({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: typeof MapPin }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center">
      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
        <span>{label}</span>
      </dt>
      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
        {value ?? <span className="italic text-slate-400 dark:text-slate-500 font-normal">Not provided</span>}
      </dd>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApiClient()
      .getReport(id)
      .then(setReport)
      .catch((err) =>
        setError(
          'Could not retrieve observation record. It may not exist. ' +
            ((err as Error)?.message ?? ''),
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Auditing record provenance…" />;
  if (error) return <ErrorAlert message={error} />;
  if (!report) return <ErrorAlert message="Report record could not be found." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8 animate-page-enter">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 animate-fade-in stagger-1" aria-label="Breadcrumb">
        <Link to="/reports" viewTransition className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Incident Directory</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
        <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{report.id}</span>
      </nav>

      <div className="animate-card-rise stagger-1">
        <PageHeader
          title="Observation Inspection"
          subtitle={`Audit record for report ID ${report.id}. Immutable original text with system provenance.`}
          badge={report.is_synthetic ? 'Synthetic Telemetry' : 'Local Sensor'}
        />
      </div>

      {report.is_synthetic && (
        <div className="animate-fade-in stagger-2">
          <SyntheticBanner message="This report is part of the synthetic baseline dataset. Provenance and timestamps are generated for algorithmic testing." />
        </div>
      )}
      {!report.is_synthetic && (
        <div
          role="note"
          className="flex items-start gap-2.5 p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800/60 rounded-xl text-xs sm:text-sm text-blue-900 dark:text-blue-200 shadow-2xs animate-fade-in stagger-2"
        >
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <span>
            <strong>Local Storage Observation:</strong> Record committed within this browser session. Categorized via deterministic keyword baseline.
          </span>
        </div>
      )}

      {/* Status & Categorization Pill Strip */}
      <div className="flex flex-wrap items-center gap-2.5 animate-card-rise stagger-2">
        <StatusBadge status={report.status} size="md" />
        <CategoryBadge category={report.category} />
        {report.category_confidence != null && (
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Confidence: {Math.round(report.category_confidence * 100)}%
          </span>
        )}
        {report.category_uncertain && (
          <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/80 dark:border-amber-800/60 italic">
            Classifier Uncertain — Insufficient Signal
          </span>
        )}
      </div>

      {/* Original Report Text Card */}
      <Card hoverEffect={true} className="overflow-hidden animate-card-rise stagger-3">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
              Unaltered Reporter Description
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Cryptographically Preserved</span>
        </div>
        
        <div className="p-5 sm:p-6">
          <blockquote className="p-4 rounded-xl border-l-4 border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed italic">
            "{report.original_description}"
          </blockquote>
        </div>
      </Card>

      {/* Record Provenance Details Grid */}
      <Card hoverEffect={true} className="overflow-hidden animate-card-rise stagger-4">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
            Record Provenance & Metadata
          </h2>
        </div>
        
        <dl className="p-5 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800">
          <FieldRow
            label="Report ID"
            value={<code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">{report.id}</code>}
          />
          <FieldRow
            label="Submission Time"
            icon={Clock}
            value={formatDateTime(report.submitted_at)}
          />
          <FieldRow
            label="Observation Time"
            icon={Clock}
            value={report.observed_at ? formatDateTime(report.observed_at) : null}
          />
          <FieldRow
            label="Reported Severity"
            value={severityLabel(report.reported_severity)}
          />
          <FieldRow
            label="Civic Location"
            icon={MapPin}
            value={report.address}
          />
          <FieldRow
            label="GPS Coordinates"
            icon={Compass}
            value={
              report.latitude != null && report.longitude != null ? (
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </span>
              ) : null
            }
          />
          <FieldRow
            label="Anonymous Token"
            icon={Fingerprint}
            value={
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {report.reporter_token} (used for independence scoring)
              </span>
            }
          />
          <FieldRow
            label="Photo Attachment"
            icon={Camera}
            value={report.photo_reference ? `File: ${report.photo_reference}` : null}
          />
          <FieldRow
            label="Last Synchronized"
            value={formatDateTime(report.updated_at)}
          />
        </dl>

        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <SafetyNotice />
        </div>
      </Card>

      {/* Downstream Analysis Roadmap Card */}
      <Card hoverEffect={true} className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 animate-card-rise stagger-5">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
            Downstream Intelligence Pipeline
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          In Milestone 3 (Report Analysis) and Milestone 4 (Geospatial Clustering), this observation will be continuously correlated with other reports within a 300-meter radius and 72-hour temporal window using semantic sentence embeddings and Haversine distance decay.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span>Correlation Engine: Inactive until Backend initialization (Milestone 2)</span>
        </div>
      </Card>

    </div>
  );
}
