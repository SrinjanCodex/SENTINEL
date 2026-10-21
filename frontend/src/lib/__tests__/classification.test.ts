/**
 * Unit tests for the keyword classification baseline.
 * Run with: npm run test (from the frontend directory)
 */
import { describe, it, expect } from 'vitest';
import { classifyReport } from '../classification';

describe('classifyReport — keyword baseline', () => {
  it('classifies road water accumulation correctly', () => {
    const r = classifyReport('The road is flooded near the underpass — vehicles are stuck.');
    expect(r.category).toBe('water_accumulation_on_roads');
    expect(r.uncertain).toBe(false);
    expect(r.possibly_unrelated).toBe(false);
  });

  it('classifies drainage blockage correctly', () => {
    const r = classifyReport('Blocked drain on the corner — water is not draining at all.');
    expect(r.category).toBe('suspected_drainage_blockage');
    expect(r.uncertain).toBe(false);
  });

  it('classifies standing water correctly', () => {
    const r = classifyReport('Large puddle of standing water has been here since yesterday morning.');
    expect(r.category).toBe('persistent_standing_water');
    expect(r.uncertain).toBe(false);
  });

  it('classifies water entering building correctly', () => {
    const r = classifyReport('Water is entering our ground floor — the floor is submerged.');
    expect(r.category).toBe('water_entering_building');
    expect(r.uncertain).toBe(false);
  });

  it('returns uncertain for an unrelated report', () => {
    const r = classifyReport('There is a broken street light on the corner of the road. It has been dark for weeks.');
    expect(r.uncertain).toBe(true);
    expect(r.possibly_unrelated).toBe(true);
  });

  it('returns uncertain when description is vague', () => {
    const r = classifyReport('Something seems wrong in the area near the park.');
    expect(r.uncertain).toBe(true);
  });

  it('does not force a category on empty text', () => {
    const r = classifyReport('');
    expect(r.uncertain).toBe(true);
    expect(r.confidence).toBe(0);
  });

  it('returns confidence 0–1', () => {
    const r = classifyReport('Blocked drain causing standing water on the road.');
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });

  it('classifies demo-001 correctly (standing water near school)', () => {
    const r = classifyReport(
      'Large puddle of standing water has formed outside the main school gate. Water is about ankle-deep and blocking the footpath.',
    );
    // Should be persistent_standing_water or closely related
    expect(['persistent_standing_water', 'water_accumulation_on_roads']).toContain(r.category);
    expect(r.uncertain).toBe(false);
  });
});
