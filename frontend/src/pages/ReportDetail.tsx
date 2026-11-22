/**
 * SENTINEL — Incident Observation Audit & Inspection
 * Verifiable evidence sheet preserving unaltered citizen telemetry
 * and presenting automated Milestone 3 NLP report analysis.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApiClient } from '../api';
import type { Report, ReportAnalysis } from '../types';
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
  Sparkles,
  RefreshCw,
  Waves,
  Calendar,
  CopyCheck,
  ExternalLink,
  ShieldAlert,
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

function getSeverityBadgeConfig(severity: string | null | undefined) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return {
        label: 'Critical Severity',
        className: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
        dot: 'bg-rose-500',
      };
    case 'high':
      return {
        label: 'High Severity',
        className: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
        dot: 'bg-orange-500',
      };
    case 'moderate':
      return {
        label: 'Moderate Severity',
        className: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        dot: 'bg-amber-500',
      };
    case 'low':
      return {
        label: 'Low Severity',
        className: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
        dot: 'bg-teal-500',
      };
    default:
      return {
        label: 'Uncertain Severity',
        className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const client = getApiClient();
    
    client
      .getReport(id)
      .then((rep) => {
        setReport(rep);
        if (rep.analysis) {
          setAnalysis(rep.analysis);
        } else {
          // Attempt to retrieve analysis if available
          client
            .getReportAnalysis(id)
            .then((res) => {
              if (res) setAnalysis(res);
            })
            .catch(() => {
              // Analysis may not have been run yet
            });
        }
      })
      .catch((err) =>
        setError(
          'Could not retrieve observation record. It may not exist. ' +
            ((err as Error)?.message ?? ''),
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleTriggerAnalysis = async () => {
    if (!report) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await getApiClient().analyzeReport(report.id);
      setAnalysis(res);
    } catch (err) {
      setAnalysisError((err as Error)?.message ?? 'Failed to execute report analysis pipeline.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LoadingSpinner label="Auditing record provenance…" />;
  if (error) return <ErrorAlert message={error} />;
  if (!report) return <ErrorAlert message="Report record could not be found." />;

  const severityBadge = getSeverityBadgeConfig(analysis?.severity);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-8 animate-page-enter">
      
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

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Unaltered Description, Automated Analysis (M3), Provenance */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Original Report Text Card — Wide Slab */}
          <Card tilt={false} className="overflow-hidden animate-card-rise stagger-3">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                  Unaltered Reporter Description
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Cryptographically Preserved</span>
            </div>
            
            <div className="p-6 sm:p-7">
              <blockquote className="p-5 sm:p-6 rounded-xl border-l-4 border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed italic">
                "{report.original_description}"
              </blockquote>
            </div>
          </Card>

          {/* 2. Automated Report Analysis (Milestone 3) — Wide Slab */}
          <Card tilt={false} className="overflow-hidden animate-card-rise stagger-4 border-teal-500/30 dark:border-teal-500/20">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                    Automated Report Analysis
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Milestone 3 NLP classification, rule extraction & duplicate detection
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {analysis?.embedding_provider && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                    {analysis.embedding_provider === 'sentence-transformers' ? 'all-MiniLM-L6-v2' : 'TF-IDF Vectorizer'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleTriggerAnalysis}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                  <span>{analyzing ? 'Analyzing…' : analysis ? 'Re-run Analysis' : 'Run Analysis'}</span>
                </button>
              </div>
            </div>

            {analysisError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{analysisError}</span>
              </div>
            )}

            <div className="p-6 sm:p-7 space-y-6">
              {analysis ? (
                <>
                  {/* Row 1: Severity Classification & Composite Confidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Severity Card */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          ML Predicted Severity
                        </span>
                        {analysis.severity_confidence != null && (
                          <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                            {Math.round(analysis.severity_confidence * 100)}% prob
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${severityBadge.className}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${severityBadge.dot}`} />
                          {severityBadge.label}
                        </span>
                      </div>

                      {analysis.all_scores && (
                        <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 grid grid-cols-4 gap-1 font-mono">
                          {Object.entries(analysis.all_scores).map(([k, v]) => (
                            <div key={k} className="text-center p-1 bg-slate-100 dark:bg-slate-700/50 rounded">
                              <span className="block capitalize text-[10px] text-slate-400">{k}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {Math.round(Number(v) * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Composite Confidence Card */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Composite Confidence
                        </span>
                        <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                          {analysis.confidence_score != null ? `${Math.round(analysis.confidence_score * 100)}%` : 'N/A'}
                        </span>
                      </div>

                      {/* Progress Meter */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${analysis.confidence_score != null ? Math.round(analysis.confidence_score * 100) : 0}%`,
                          }}
                        />
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {analysis.confidence_reason || 'Score derived from classifier probability, entity completeness, and corroborating reports.'}
                      </p>
                    </div>

                  </div>

                  {/* Row 2: Extracted Entity Highlights */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Rule-Extracted Telemetry Entities
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      {/* Locations */}
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span>Location Hints</span>
                        </div>
                        {analysis.extracted_locations && analysis.extracted_locations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.extracted_locations.map((loc, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-[11px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 rounded-md"
                              >
                                {loc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">None detected</span>
                        )}
                      </div>

                      {/* Water Depth */}
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Waves className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Water Depth Mention</span>
                        </div>
                        {analysis.extracted_depth ? (
                          <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 rounded-md">
                            {analysis.extracted_depth}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">None mentioned</span>
                        )}
                      </div>

                      {/* Time Context */}
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Time Hints</span>
                        </div>
                        {analysis.extracted_times && analysis.extracted_times.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.extracted_times.map((t, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-md"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">None mentioned</span>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Row 3: Semantic Duplicates & Corroboration */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CopyCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Possible Duplicate Reports (Semantic Cosine Matching)
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {analysis.possible_duplicates?.length ?? 0} matches
                      </span>
                    </div>

                    {analysis.possible_duplicates && analysis.possible_duplicates.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.possible_duplicates.map((dup) => (
                          <div
                            key={dup.id}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold">
                                  {dup.id}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                                  {Math.round(dup.similarity * 100)}% similarity
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                "{dup.text}"
                              </p>
                            </div>

                            <Link
                              to={`/reports/${dup.id}`}
                              viewTransition
                              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              title="Inspect matching report"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>No semantically duplicate reports detected — treated as an independent observation signal.</span>
                        <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400">Unique Signal</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <span>Last analysed: {formatDateTime(analysis.analysed_at)}</span>
                    <span>Provider: {analysis.embedding_provider ?? 'system-default'}</span>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <Cpu className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Automated report analysis has not yet been executed for this observation.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
                    Click below to trigger the scikit-learn severity classifier, entity extraction, and semantic duplicate detection pipeline.
                  </p>
                  <button
                    type="button"
                    onClick={handleTriggerAnalysis}
                    disabled={analyzing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Analysis Now</span>
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* 3. Record Provenance Details Grid — Wide 2-Column Slab */}
          <Card tilt={false} className="overflow-hidden animate-card-rise stagger-5">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                  Record Provenance & Telemetry Metadata
                </h2>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Audit Grade</span>
            </div>
            
            <div className="p-6 sm:p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
                {/* Column 1: Identification & Temporal */}
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
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
                </dl>

                {/* Column 2: Spatial & Verification */}
                <dl className="divide-y divide-slate-100 dark:divide-slate-800 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
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
                        {report.reporter_token}
                      </span>
                    }
                  />
                  <FieldRow
                    label="Photo Attachment"
                    icon={Camera}
                    value={report.photo_reference ? `File: ${report.photo_reference}` : null}
                  />
                </dl>
              </div>
            </div>

            <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
              <SafetyNotice />
            </div>
          </Card>
        </div>

        {/* Right Column: Status & Downstream Intelligence Panel */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Status & Categorization Card */}
          <Card tilt={false} className="p-6 space-y-5 animate-card-rise stagger-2">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Classification Status
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={report.status} size="md" />
                <CategoryBadge category={report.category} />
              </div>
            </div>

            {/* If Milestone 3 severity exists, display it alongside keyword classification */}
            {analysis?.severity && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">ML Severity (M3)</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${severityBadge.className}`}>
                    {severityBadge.label}
                  </span>
                </div>
                {analysis.confidence_score != null && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>Confidence Score</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{Math.round(analysis.confidence_score * 100)}%</span>
                  </div>
                )}
              </div>
            )}

            {report.category_confidence != null && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Baseline Confidence</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                    {Math.round(report.category_confidence * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round(report.category_confidence * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {report.category_uncertain && !analysis && (
              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60 italic leading-relaxed">
                Classifier Uncertain — Insufficient Signal for definitive categorization.
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Reporter Integrity</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Verified Token</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400 dark:text-slate-500">Hash</span>
                <span className="truncate max-w-[160px]">{report.reporter_token}</span>
              </div>
            </div>
          </Card>

          {/* Downstream Analysis Roadmap Card */}
          <Card tilt={false} className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 animate-card-rise stagger-5 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Downstream Intelligence
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-teal-600 dark:text-teal-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>Milestone 3 Analysis Active</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              Natural language severity classification, entity extraction, and duplicate detection are fully operational. In Milestone 4, this observation will be grouped into spatial clusters using DBSCAN and Haversine decay.
            </p>
          </Card>
        </div>
      </div>

    </div>
  );
}
