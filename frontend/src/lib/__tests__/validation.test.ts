/**
 * Unit tests for form validation helpers.
 */
import { describe, it, expect } from 'vitest';
import {
  validateDescription,
  validateSeverity,
  validateObservedAt,
  validateLatitude,
  validateLongitude,
  validateCoordinatePair,
  validateReportForm,
} from '../validation';

describe('validateDescription', () => {
  it('accepts a valid description', () => {
    expect(validateDescription('Standing water blocking the road near the school gate.')).toBeNull();
  });

  it('rejects an empty description', () => {
    expect(validateDescription('')).toBeTruthy();
    expect(validateDescription('   ')).toBeTruthy();
  });

  it('rejects a description that is too short', () => {
    expect(validateDescription('Too short')).toBeTruthy();
  });

  it('rejects a description that is too long', () => {
    expect(validateDescription('a'.repeat(2001))).toBeTruthy();
  });

  it('accepts a description exactly at minimum length', () => {
    expect(validateDescription('a'.repeat(20))).toBeNull();
  });
});

describe('validateSeverity', () => {
  it('accepts null (optional field)', () => {
    expect(validateSeverity(null)).toBeNull();
    expect(validateSeverity('')).toBeNull();
    expect(validateSeverity(undefined)).toBeNull();
  });

  it('accepts valid severity values 1–5', () => {
    [1, 2, 3, 4, 5].forEach((v) => expect(validateSeverity(v)).toBeNull());
  });

  it('rejects severity outside range', () => {
    expect(validateSeverity(0)).toBeTruthy();
    expect(validateSeverity(6)).toBeTruthy();
    expect(validateSeverity(-1)).toBeTruthy();
  });

  it('rejects non-integer severity', () => {
    expect(validateSeverity(2.5)).toBeTruthy();
  });
});

describe('validateObservedAt', () => {
  it('accepts null (optional)', () => {
    expect(validateObservedAt(null)).toBeNull();
    expect(validateObservedAt('')).toBeNull();
  });

  it('accepts a past date', () => {
    expect(validateObservedAt('2026-01-01T10:00:00')).toBeNull();
  });

  it('rejects a future date', () => {
    // Use a full ISO 8601 string with UTC timezone so Node.js parses it consistently
    const future = new Date(Date.now() + 3_600_000).toISOString();
    expect(validateObservedAt(future)).toBeTruthy();
  });

  it('rejects an invalid date string', () => {
    expect(validateObservedAt('not-a-date')).toBeTruthy();
  });
});

describe('validateLatitude', () => {
  it('accepts valid latitudes', () => {
    expect(validateLatitude(0)).toBeNull();
    expect(validateLatitude(31.5)).toBeNull();
    expect(validateLatitude(-90)).toBeNull();
    expect(validateLatitude(90)).toBeNull();
  });

  it('rejects out-of-range latitudes', () => {
    expect(validateLatitude(91)).toBeTruthy();
    expect(validateLatitude(-91)).toBeTruthy();
  });

  it('accepts null (optional)', () => {
    expect(validateLatitude(null)).toBeNull();
    expect(validateLatitude('')).toBeNull();
  });
});

describe('validateLongitude', () => {
  it('accepts valid longitudes', () => {
    expect(validateLongitude(0)).toBeNull();
    expect(validateLongitude(74.3)).toBeNull();
    expect(validateLongitude(-180)).toBeNull();
    expect(validateLongitude(180)).toBeNull();
  });

  it('rejects out-of-range longitudes', () => {
    expect(validateLongitude(181)).toBeTruthy();
    expect(validateLongitude(-181)).toBeTruthy();
  });
});

describe('validateCoordinatePair', () => {
  it('accepts both null', () => {
    expect(validateCoordinatePair(null, null)).toBeNull();
    expect(validateCoordinatePair('', '')).toBeNull();
  });

  it('accepts both provided', () => {
    expect(validateCoordinatePair('31.5', '74.3')).toBeNull();
  });

  it('rejects one without the other', () => {
    expect(validateCoordinatePair('31.5', null)).toBeTruthy();
    expect(validateCoordinatePair(null, '74.3')).toBeTruthy();
    expect(validateCoordinatePair('31.5', '')).toBeTruthy();
  });
});

describe('validateReportForm — integration', () => {
  it('returns empty errors for a valid form', () => {
    const errors = validateReportForm({
      description: 'Standing water blocking the road near the school entrance for the past hour.',
      severity: '3',
      observed_at: '2026-01-01T10:00:00',
      latitude: '31.5204',
      longitude: '74.3587',
    });
    expect(errors).toEqual({});
  });

  it('returns description error for short description', () => {
    const errors = validateReportForm({ description: 'Too short' });
    expect(errors.description).toBeTruthy();
  });

  it('returns observed_at error for future date', () => {
    // Use full ISO string to ensure consistent parsing in Node.js test environment
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const errors = validateReportForm({
      description: 'Valid description that is long enough to pass validation.',
      observed_at: future,
    });
    expect(errors.observed_at).toBeTruthy();
  });
});
