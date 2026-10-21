/**
 * SENTINEL — Report Detail page
 *
 * Shows a single report. All fields show "Not provided" when absent —
 * never blank, never fabricated.
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

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-slate-100 last:border-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-slate-900">
        {value ?? <span className="italic text-slate-400">Not provided</span>}
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
          'Could not load this report. It may not exist. ' +
            ((err as Error)?.message ?? ''),
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading report…" />;
  if (error) return <ErrorAlert message={error} />;
  if (!report) return <ErrorAlert message="Report not found." />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/reports" className="hover:text-teal-600">Reports</Link>
        <span aria-hidden="true">›</span>
        <span className="truncate max-w-[200px]">Report {report.id}</span>
      </div>

      <PageHeader title="Report Detail" />

      {report.is_synthetic && (
        <SyntheticBanner message="⚠️ DEMONSTRATION DATA — This is a synthetic report created to illustrate SENTINEL's features." />
      )}
      {!report.is_synthetic && (
        <div
          role="note"
          className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-4 py-2"
        >
          ℹ️ This report is stored in <strong>this browser only</strong>. It has not been sent to any server.
        </div>
      )}

      {/* Status + Category */}
      <div className="flex flex-wrap gap-3">
        <StatusBadge status={report.status} />
        <CategoryBadge category={report.category} />
        {report.category_uncertain && (
          <span className="text-xs text-slate-500 italic self-center">
            (classifier uncertain — description did not clearly match a category)
          </span>
        )}
      </div>

      {/* Report content */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-800">Original Report</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Preserved exactly as submitted. Never modified.
          </p>
        </div>
        <blockquote className="px-5 py-4 text-sm text-slate-800 leading-relaxed border-l-4 border-teal-400 bg-teal-50/30 mx-5 my-4 rounded-r-md">
          "{report.original_description}"
        </blockquote>
      </Card>

      {/* Details */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-800">Report Details</h2>
        </div>
        <dl className="px-5">
          <Field label="Report ID" value={<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{report.id}</code>} />
          <Field label="Submitted at" value={formatDateTime(report.submitted_at)} />
          <Field label="Observed at" value={report.observed_at ? formatDateTime(report.observed_at) : null} />
          <Field label="Status" value={<StatusBadge status={report.status} />} />
          <Field label="Category" value={<CategoryBadge category={report.category} />} />
          <Field
            label="Classifier confidence"
            value={
              report.category_confidence != null
                ? `${Math.round(report.category_confidence * 100)}%`
                : null
            }
          />
          <Field label="Severity" value={severityLabel(report.reported_severity)} />
          <Field label="Location / address" value={report.address} />
          <Field
            label="Coordinates"
            value={
              report.latitude != null && report.longitude != null
                ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
                : null
            }
          />
          <Field
            label="Photo"
            value={report.photo_reference ? `File: ${report.photo_reference}` : null}
          />
          <Field
            label="Data origin"
            value={
              report.is_synthetic
                ? <span className="text-amber-700 font-medium">Demonstration data (synthetic)</span>
                : <span className="text-blue-700 font-medium">Submitted in this browser</span>
            }
          />
          <Field label="Last updated" value={formatDateTime(report.updated_at)} />
        </dl>
        <div className="px-5 pb-4">
          <SafetyNotice />
        </div>
      </Card>

      {/* What happens next (Milestone 2+) */}
      <Card className="p-5 bg-slate-50">
        <h2 className="font-semibold text-navy-800 mb-2">What happens next?</h2>
        <p className="text-sm text-slate-600">
          In later versions, SENTINEL will automatically compare this report against
          other nearby reports, assign a category using a trained classifier, and flag
          it if it appears to be part of a potential incident cluster. That analysis
          requires the backend to be running (Milestone 2+).
        </p>
        <p className="mt-2 text-xs text-slate-400 italic">
          This feature is a planned placeholder. No analysis has been run on this report yet.
        </p>
      </Card>
    </div>
  );
}
