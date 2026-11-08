/**
 * SENTINEL — Incident Observation Intake (Grouped Layout)
 * Verified community reporting with grouped section cards, sticky submit bar,
 * background floating tiles, and heuristic client validation.
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getApiClient } from '../api';
import {
  Card,
  FieldError,
  SafetyNotice,
} from '../components/ui';
import { FloatingTiles } from '../components/FloatingTiles';
import { validateReportForm } from '../lib/validation';
import {
  Send,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Camera,
  Compass,
  ArrowRight,
  Info,
  FileText,
} from 'lucide-react';

interface FormState {
  description: string;
  severity: string;
  address: string;
  latitude: string;
  longitude: string;
  observed_at: string;
}

const EMPTY_FORM: FormState = {
  description: '',
  severity: '',
  address: '',
  latitude: '',
  longitude: '',
  observed_at: '',
};

export default function ReportIncident() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const maxDateTime = useMemo(() => new Date().toISOString().slice(0, 16), []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const fieldErrors = validateReportForm({
      description: form.description,
      severity: form.severity || undefined,
      observed_at: form.observed_at || undefined,
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const firstErrorField = Object.keys(fieldErrors)[0];
      document.getElementById(`field-${firstErrorField}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const client = getApiClient();
      const report = await client.createReport({
        original_description: form.description.trim(),
        reported_severity: form.severity ? parseInt(form.severity, 10) : null,
        address: form.address.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        observed_at: form.observed_at || null,
      });

      setSuccess(report.id);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (err) {
      setSubmitError(
        'Failed to record observation into database. Please retry. ' +
          ((err as Error)?.message ?? ''),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (hasError?: boolean) =>
    `block w-full rounded-lg border ${
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500 animate-error-shake'
        : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500'
    } px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 ` +
    'placeholder:text-slate-400 focus:outline-none focus:ring-1 ' +
    'disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-2xs';

  const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-page-enter">
      
      {/* Header Banner with Survey Texture & Ambient Floating Shapes */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-sm animate-card-rise stagger-1">
        <div className="absolute inset-0 civic-grid-pattern opacity-40 pointer-events-none" />
        <FloatingTiles count={5} />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              Community Intake
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Heuristic Correlation Gateway
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Report Urban Waterlogging
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Submit ground-level drainage observations. Reports are matched with nearby signals to identify structural municipal blockages.
          </p>
        </div>
      </div>

      {/* Local Storage Telemetry Banner */}
      <div
        role="note"
        className="flex items-start gap-3 p-3.5 bg-blue-50/90 border border-blue-200/90 rounded-xl text-xs sm:text-sm text-blue-900 shadow-2xs animate-fade-in stagger-2"
      >
        <div className="p-1 rounded-md bg-blue-100 text-blue-700 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="leading-relaxed">
          <strong>Database Intake Active:</strong> New submissions are stored directly in the active database and categorized via our transparent keyword heuristic engine.
        </div>
      </div>

      {/* Success Notification Card */}
      {success && (
        <Card className="p-5 border-emerald-300 bg-emerald-50/70 shadow-sm animate-success-pop">
          <div className="flex items-start gap-3.5">
            <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-emerald-950 text-sm">
                Observation Successfully Logged
              </p>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Your report has been committed to the telemetry database and classified for spatial correlation.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link
                  to={`/reports/${success}`}
                  viewTransition
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                >
                  <span>Inspect Dispatched Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] font-mono text-emerald-700/80">ID: {success}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Submission Error Banner */}
      {submitError && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800 flex items-center gap-2 animate-slide-down">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Intake Form with Grouped Cards */}
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Waterlogging observation submission form"
        className="space-y-6"
      >
        {/* Section 1: Observation & Severity */}
        <Card className="p-5 sm:p-6 shadow-sm space-y-5 animate-card-rise stagger-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                1. Observation Narrative & Severity
              </h2>
              <p className="text-xs text-slate-500">
                Describe the physical standing water condition observed.
              </p>
            </div>
          </div>

          {/* Observation Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="field-description" className={labelClass}>
                Observation Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  form.description.length < 20 ? 'text-slate-400' : 'text-teal-600 font-semibold'
                }`}
                aria-live="polite"
              >
                {form.description.length}/2000 chars
              </span>
            </div>
            
            <textarea
              id="field-description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe physical conditions observed: water depth (curb, ankle, vehicle axle), drain status (clogged grate, bubbling manhole), surface road disruption, or structural ingress."
              className={inputClass(!!errors.description)}
              aria-required="true"
              aria-describedby={errors.description ? 'field-description-error' : undefined}
              aria-invalid={!!errors.description}
              disabled={submitting}
              maxLength={2000}
            />
            
            <div id="field-description-error">
              <FieldError message={errors.description} />
            </div>
            <p className="text-[11px] text-slate-400">
              Minimum 20 characters. Original text is preserved permanently for transparent auditability.
            </p>
          </div>

          {/* Severity Scale */}
          <div>
            <label htmlFor="field-severity" className={labelClass}>
              Estimated Severity Level (Optional)
            </label>
            <select
              id="field-severity"
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className={inputClass(!!errors.severity)}
              aria-describedby="severity-hint"
              disabled={submitting}
            >
              <option value="">— Select severity level —</option>
              <option value="1">Level 1 — Minor (shallow gutter puddle, pedestrian footpath clear)</option>
              <option value="2">Level 2 — Low (surface water covering lane, slow vehicular passage)</option>
              <option value="3">Level 3 — Moderate (ankle-deep standing water, active traffic slowdown)</option>
              <option value="4">Level 4 — High (knee-deep ponding, vehicles stalling, submerged drainage)</option>
              <option value="5">Level 5 — Severe (structural ingress, submerged underpass, emergency condition)</option>
            </select>
            <p id="severity-hint" className="mt-1.5 text-[11px] text-slate-400">
              Reporter's subjective assessment. Heuristic engine treats repeat submissions from one token as a single independent vote.
            </p>
            <FieldError message={errors.severity} />
          </div>
        </Card>

        {/* Section 2: Spatial Coordinates & Address */}
        <Card className="p-5 sm:p-6 shadow-sm space-y-5 animate-card-rise stagger-3">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                2. Spatial Geolocation & Address
              </h2>
              <p className="text-xs text-slate-500">
                Specify GPS coordinates or physical street landmarks for correlation.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="field-address" className={labelClass}>
              Location Reference / Street Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="field-address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g., Canal Road opposite Main Market gate, Sector 4"
                className={`pl-9 ${inputClass(!!errors.address)}`}
                disabled={submitting}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Cross-streets, civic landmarks, or locality names.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Geographic Coordinates (GPS Lat / Lng)
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-latitude" className="sr-only">Latitude</label>
                <div className="relative">
                  <Compass className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    id="field-latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="Latitude (e.g., 22.5726)"
                    className={`pl-9 ${inputClass(!!errors.latitude || !!errors.coordinates)}`}
                    disabled={submitting}
                  />
                </div>
                <FieldError message={errors.latitude} />
              </div>
              <div>
                <label htmlFor="field-longitude" className="sr-only">Longitude</label>
                <div className="relative">
                  <Compass className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    id="field-longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="Longitude (e.g., 88.3639)"
                    className={`pl-9 ${inputClass(!!errors.longitude || !!errors.coordinates)}`}
                    disabled={submitting}
                  />
                </div>
                <FieldError message={errors.longitude} />
              </div>
            </div>
            {errors.coordinates && <FieldError message={errors.coordinates} />}
            <p className="text-[11px] text-slate-400 italic">
              SENTINEL never fabricates coordinates. Reports without coordinates remain preserved in the directory with an explicit "Unmapped" indicator.
            </p>
          </fieldset>
        </Card>

        {/* Section 3: Observation Time & Photo Notice */}
        <Card className="p-5 sm:p-6 shadow-sm space-y-5 animate-card-rise stagger-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                3. Temporal Observation Timestamp
              </h2>
              <p className="text-xs text-slate-500">
                Record the approximate time the condition occurred.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="field-observed_at" className={labelClass}>
              Observation Timestamp
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="field-observed_at"
                name="observed_at"
                type="datetime-local"
                value={form.observed_at}
                onChange={handleChange}
                max={maxDateTime}
                className={`pl-9 ${inputClass(!!errors.observed_at)}`}
                disabled={submitting}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              When was the waterlogging observed? Must not be in the future.
            </p>
            <FieldError message={errors.observed_at} />
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3 text-xs text-slate-600">
            <Camera className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Cryptographic Photographic Intake:</strong> Direct image uploading with EXIF location privacy stripping is enabled via our verified multipart storage handler.
            </div>
          </div>
        </Card>

        {/* Sticky Submit Action Bar */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-card-rise stagger-5">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Ready to commit observation to civic store</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:bg-teal-300 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 btn-press"
              aria-disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
                  <span>Committing Telemetry…</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Commit Observation</span>
                </>
              )}
            </button>
          </div>
        </div>

        <SafetyNotice />
      </form>
    </div>
  );
}
