/**
 * SENTINEL — Form validation helpers
 *
 * All validation is deterministic and tested.
 * Returns a string error message on failure, or null on success.
 */

export const VALIDATION = {
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_SEVERITY: 1,
  MAX_SEVERITY: 5,
  MAX_LAT: 90,
  MIN_LAT: -90,
  MAX_LNG: 180,
  MIN_LNG: -180,
};

export function validateDescription(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return 'Please describe what you observed.';
  if (trimmed.length < VALIDATION.MIN_DESCRIPTION_LENGTH) {
    return `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH} characters. Please add more detail.`;
  }
  if (trimmed.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    return `Description must not exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters.`;
  }
  return null;
}

export function validateSeverity(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null; // optional
  const n = Number(value);
  if (!Number.isInteger(n) || n < VALIDATION.MIN_SEVERITY || n > VALIDATION.MAX_SEVERITY) {
    return `Severity must be a whole number between ${VALIDATION.MIN_SEVERITY} and ${VALIDATION.MAX_SEVERITY}.`;
  }
  return null;
}

export function validateObservedAt(value: string | null | undefined): string | null {
  if (!value) return null; // optional
  // datetime-local inputs produce strings without timezone (e.g. "2026-10-21T14:00").
  // new Date() treats those as LOCAL time, which is correct for observation times.
  // We also handle full ISO strings (with Z or offset) from the API.
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Please enter a valid date and time.';
  // Allow 5 minutes tolerance for clock skew and typing delays
  if (date.getTime() > Date.now() + 5 * 60_000) {
    return 'Observation time cannot be in the future.';
  }
  return null;
}

export function validateLatitude(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null; // optional
  const n = Number(value);
  if (isNaN(n) || n < VALIDATION.MIN_LAT || n > VALIDATION.MAX_LAT) {
    return 'Latitude must be between -90 and 90.';
  }
  return null;
}

export function validateLongitude(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null; // optional
  const n = Number(value);
  if (isNaN(n) || n < VALIDATION.MIN_LNG || n > VALIDATION.MAX_LNG) {
    return 'Longitude must be between -180 and 180.';
  }
  return null;
}

export function validateCoordinatePair(
  lat: string | null | undefined,
  lng: string | null | undefined,
): string | null {
  const hasLat = lat !== null && lat !== undefined && lat !== '';
  const hasLng = lng !== null && lng !== undefined && lng !== '';
  if (hasLat !== hasLng) {
    return 'Please provide both latitude and longitude, or leave both empty.';
  }
  return null;
}

/** Run all report-form validations. Returns a field→error map. Empty = valid. */
export function validateReportForm(fields: {
  description: string;
  severity?: string;
  observed_at?: string;
  latitude?: string;
  longitude?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const descError = validateDescription(fields.description);
  if (descError) errors.description = descError;

  const severityError = validateSeverity(fields.severity);
  if (severityError) errors.severity = severityError;

  const observedAtError = validateObservedAt(fields.observed_at);
  if (observedAtError) errors.observed_at = observedAtError;

  const latError = validateLatitude(fields.latitude);
  if (latError) errors.latitude = latError;

  const lngError = validateLongitude(fields.longitude);
  if (lngError) errors.longitude = lngError;

  const pairError = validateCoordinatePair(fields.latitude, fields.longitude);
  if (pairError) errors.coordinates = pairError;

  return errors;
}
