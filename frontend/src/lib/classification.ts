/**
 * SENTINEL — Keyword-based report classification (Milestone 1 baseline)
 *
 * This is a transparent, deterministic classifier. It maps a report
 * description to one of the five waterlogging categories (or "uncertain")
 * using phrase/keyword scoring.
 *
 * Design principles:
 *  - No hidden logic: the keyword lists and weights are visible here.
 *  - If no category scores clearly ahead, or the top score is very low,
 *    the result is "uncertain" — we do NOT force a category.
 *  - Reports unrelated to waterlogging are flagged via low total score.
 *  - The real ML classifier (Milestone 3) will implement the same interface.
 *
 * Unit tests: src/lib/__tests__/classification.test.ts
 */
import type { ReportCategory } from '../types';

export interface ClassificationResult {
  category: ReportCategory;
  confidence: number;   // 0–1
  uncertain: boolean;
  possibly_unrelated: boolean;
  scores: Record<ReportCategory, number>;
}

type CategoryKeywords = {
  category: ReportCategory;
  phrases: string[];
};

// ── Keyword lists ─────────────────────────────────────────────────────────────
// Each phrase match adds 1 to the category's score.
// Multi-word phrases are checked before single words (longer match wins).

const KEYWORD_SETS: CategoryKeywords[] = [
  {
    category: 'water_accumulation_on_roads',
    phrases: [
      'road flooded', 'road is flooded', 'street flooded', 'street is flooded',
      'highway flooded', 'underpass flooded', 'underpass', 'road waterlogged',
      'water on road', 'water on the road', 'puddle on road', 'road impassable',
      'vehicles stuck', 'cars stuck', 'traffic jam water', 'water on street',
      'water accumulation road', 'waterlogged road',
    ],
  },
  {
    category: 'suspected_drainage_blockage',
    phrases: [
      'blocked drain', 'clogged drain', 'drain blocked', 'drain clogged',
      'drain cover', 'grate blocked', 'grate clogged', 'manhole',
      'drainage blocked', 'drainage failure', 'drain not working',
      'drain overflow', 'overflow drain', 'sewage', 'sewer',
      'storm drain', 'drain full', 'leaves blocking', 'debris in drain',
      'drainage issue', 'drainage problem',
    ],
  },
  {
    category: 'persistent_standing_water',
    phrases: [
      'standing water', 'stagnant water', 'water not draining',
      'water remains', 'water still there', 'water has not moved',
      'water has not gone', 'water since', 'pooling water',
      'water pool', 'large puddle', 'ankle deep', 'knee deep',
      'persistent water', 'water for days', 'water for hours',
      'water accumulation', 'waterlogged area',
    ],
  },
  {
    category: 'water_entering_building',
    phrases: [
      'water entering', 'water inside', 'water in my house',
      'water in building', 'water in shop', 'water in office',
      'flooded basement', 'basement flooded', 'water entering building',
      'flooding inside', 'ground floor', 'water level rising',
      'seeping in', 'leaking in', 'water coming inside',
      'floor submerged', 'entrance submerged',
    ],
  },
  {
    category: 'other_waterlogging',
    phrases: [
      'waterlogging', 'flooding', 'flooded', 'water problem',
      'water issue', 'water complaint', 'rainwater',
    ],
  },
];

// Confidence threshold below which a category is "uncertain"
const UNCERTAIN_THRESHOLD = 0.35;
// Threshold for "possibly unrelated to waterlogging"
const UNRELATED_THRESHOLD = 0.10;

export function classifyReport(description: string): ClassificationResult {
  const lower = description.toLowerCase();

  const scores: Record<ReportCategory, number> = {
    water_accumulation_on_roads: 0,
    suspected_drainage_blockage: 0,
    persistent_standing_water: 0,
    water_entering_building: 0,
    other_waterlogging: 0,
    uncertain: 0,
  };

  for (const { category, phrases } of KEYWORD_SETS) {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) {
        scores[category] += 1;
      }
    }
  }

  const entries = Object.entries(scores) as [ReportCategory, number][];
  const totalHits = entries.reduce((s, [, v]) => s + v, 0);

  // Sort by score descending
  entries.sort((a, b) => b[1] - a[1]);
  const [topCategory, topScore] = entries[0];
  const [, secondScore] = entries[1] ?? ['', 0];

  // Normalise confidence: top share of total hits, penalised if second is close
  let confidence = totalHits === 0 ? 0 : topScore / totalHits;
  const gap = topScore - secondScore;
  if (gap <= 1 && totalHits > 0) confidence *= 0.7; // penalise close races

  const possibly_unrelated = confidence < UNRELATED_THRESHOLD || totalHits === 0;
  const uncertain =
    possibly_unrelated ||
    confidence < UNCERTAIN_THRESHOLD ||
    topScore === 0;

  return {
    category: uncertain ? 'uncertain' : topCategory,
    confidence: Math.round(confidence * 100) / 100,
    uncertain,
    possibly_unrelated,
    scores,
  };
}

/** Human-readable label for a category. */
export function categoryLabel(category: ReportCategory): string {
  const labels: Record<ReportCategory, string> = {
    water_accumulation_on_roads: 'Water accumulation on roads',
    suspected_drainage_blockage: 'Suspected drainage blockage',
    persistent_standing_water: 'Persistent standing water',
    water_entering_building: 'Water entering a building',
    other_waterlogging: 'Other / waterlogging-related',
    uncertain: 'Uncertain / unclassified',
  };
  return labels[category] ?? category;
}
