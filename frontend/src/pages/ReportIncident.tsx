/**
 * SENTINEL — Report an Incident page
 *
 * Full client-side validation before submission.
 * Submission goes through the API interface (MockApiClient in Milestone 1).
 * The application sets the submission timestamp — the user cannot edit it.
 * SENTINEL never invents coordinates for unknown locations.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiClient } from '../api';
import {
  Card,
  FieldError,
  PageHeader,
  SafetyNotice,
} from '../components/ui';
import { validateReportForm } from '../lib/validation';

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
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear individual field error on change
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
      // Move focus to first error
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
        'Failed to submit report. Please try again. ' +
          ((err as Error)?.message ?? ''),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 ' +
    'focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400';

  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Report an Incident"
        subtitle="Help identify waterlogging issues in your area. All fields marked with * are required."
      />

      {/* Storage notice */}
      <div
        role="note"
        className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-2"
      >
        ⚠️ <strong>Browser-only storage:</strong> In this version, reports are stored in
        <strong> this browser only</strong> (not sent to a server). They are clearly labelled
        "stored in this browser" in the Reports list.
      </div>

      {/* Success message */}
      {success && (
        <div
          role="alert"
          className="flex flex-col gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
        >
          <p className="font-semibold">✅ Report submitted successfully</p>
          <p>
            Your report has been saved.{' '}
            <button
              onClick={() => navigate(`/reports/${success}`)}
              className="underline hover:text-green-900"
            >
              View your report →
            </button>
          </p>
          <p className="text-xs text-green-600">Report ID: {success}</p>
        </div>
      )}

      {submitError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          ⚠️ {submitError}
        </div>
      )}

      <Card>
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Incident report form"
          className="p-6 space-y-5"
        >
          {/* Description */}
          <div>
            <label htmlFor="field-description" className={labelClass}>
              Description *
            </label>
            <textarea
              id="field-description"
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what you observed in as much detail as possible. Include the location, what the water looked like, and any other relevant details."
              className={`${inputClass} ${errors.description ? 'border-red-400 focus:ring-red-400' : ''}`}
              aria-required="true"
              aria-describedby={errors.description ? 'field-description-error' : undefined}
              aria-invalid={!!errors.description}
              disabled={submitting}
              maxLength={2000}
            />
            <div className="mt-1 flex justify-between items-start gap-2">
              <div id="field-description-error">
                <FieldError message={errors.description} />
              </div>
              <span
                className={`text-xs shrink-0 ${form.description.length < 20 ? 'text-slate-400' : 'text-slate-500'}`}
                aria-live="polite"
              >
                {form.description.length}/2000
              </span>
            </div>
          </div>

          {/* Severity */}
          <div>
            <label htmlFor="field-severity" className={labelClass}>
              Severity (optional)
            </label>
            <select
              id="field-severity"
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className={inputClass}
              aria-describedby={errors.severity ? 'field-severity-error' : 'severity-hint'}
              aria-invalid={!!errors.severity}
              disabled={submitting}
            >
              <option value="">— Select severity —</option>
              <option value="1">1 – Minor (small puddle, no obstruction)</option>
              <option value="2">2 – Low (noticeable water, manageable)</option>
              <option value="3">3 – Moderate (significant water, some disruption)</option>
              <option value="4">4 – High (serious disruption, potential danger)</option>
              <option value="5">5 – Severe (immediate danger, major infrastructure impact)</option>
            </select>
            <p id="severity-hint" className="mt-1 text-xs text-slate-400">
              Your estimate — not a technical measurement.
            </p>
            <div id="field-severity-error"><FieldError message={errors.severity} /></div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="field-address" className={labelClass}>
              Location / Address (optional)
            </label>
            <input
              id="field-address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Near the school gate on Gulberg Road"
              className={inputClass}
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-slate-400">
              Free text. Coordinates below are more precise, but both are optional.
            </p>
          </div>

          {/* Coordinates */}
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 mb-1">
              Coordinates (optional)
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-latitude" className="sr-only">Latitude</label>
                <input
                  id="field-latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="Latitude (e.g. 31.5204)"
                  className={`${inputClass} ${errors.latitude || errors.coordinates ? 'border-red-400' : ''}`}
                  aria-label="Latitude"
                  aria-invalid={!!(errors.latitude || errors.coordinates)}
                  disabled={submitting}
                />
                <FieldError message={errors.latitude} />
              </div>
              <div>
                <label htmlFor="field-longitude" className="sr-only">Longitude</label>
                <input
                  id="field-longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="Longitude (e.g. 74.3587)"
                  className={`${inputClass} ${errors.longitude || errors.coordinates ? 'border-red-400' : ''}`}
                  aria-label="Longitude"
                  aria-invalid={!!(errors.longitude || errors.coordinates)}
                  disabled={submitting}
                />
                <FieldError message={errors.longitude} />
              </div>
            </div>
            {errors.coordinates && <FieldError message={errors.coordinates} />}
            <p className="mt-1 text-xs text-slate-400">
              Tip: find coordinates in Google Maps by right-clicking a location. SENTINEL
              will never invent coordinates if you leave these blank.
            </p>
          </fieldset>

          {/* Observation time */}
          <div>
            <label htmlFor="field-observed_at" className={labelClass}>
              When did you observe this? (optional)
            </label>
            <input
              id="field-observed_at"
              name="observed_at"
              type="datetime-local"
              value={form.observed_at}
              onChange={handleChange}
              max={new Date().toISOString().slice(0, 16)}
              className={`${inputClass} ${errors.observed_at ? 'border-red-400' : ''}`}
              aria-describedby={errors.observed_at ? 'field-observed_at-error' : 'observed-hint'}
              aria-invalid={!!errors.observed_at}
              disabled={submitting}
            />
            <p id="observed-hint" className="mt-1 text-xs text-slate-400">
              Cannot be in the future. Leave blank if you are unsure.
            </p>
            <div id="field-observed_at-error"><FieldError message={errors.observed_at} /></div>
          </div>

          {/* Photo notice */}
          <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
            📷 <strong>Photo upload</strong> will be available in a later version when
            the backend is connected. Photos stored by SENTINEL would have EXIF metadata
            (which can contain GPS data) automatically removed.
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold px-6 py-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              aria-disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                'Submit Report'
              )}
            </button>

            <SafetyNotice />
          </div>
        </form>
      </Card>
    </div>
  );
}
