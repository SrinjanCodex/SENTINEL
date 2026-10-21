/**
 * Reusable UI components for SENTINEL.
 * All in one file for Milestone 1 — will be split as the app grows.
 */
import type { ReactNode } from 'react';
import type { ReportStatus, IncidentStatus, ReportCategory } from '../types';
import { categoryLabel } from '../lib/classification';

// ── StatusBadge ───────────────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, string> = {
  // Report statuses
  unverified: 'bg-amber-100 text-amber-800 border-amber-300',
  linked:     'bg-blue-100 text-blue-800 border-blue-300',
  dismissed:  'bg-slate-100 text-slate-600 border-slate-300',
  // Incident statuses
  suspected:          'bg-amber-100 text-amber-800 border-amber-300',
  under_verification: 'bg-blue-100 text-blue-800 border-blue-300',
  verified:           'bg-green-100 text-green-800 border-green-300',
  resolved:           'bg-slate-100 text-slate-600 border-slate-300',
};

const STATUS_LABELS: Record<string, string> = {
  unverified:         'Unverified',
  linked:             'Linked to Incident',
  dismissed:          'Dismissed',
  suspected:          'Suspected',
  under_verification: 'Under Verification',
  verified:           'Verified',
  resolved:           'Resolved',
};

interface StatusBadgeProps {
  status: ReportStatus | IncidentStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colour = STATUS_COLOURS[status] ?? 'bg-slate-100 text-slate-600 border-slate-300';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colour}`}
      role="status"
    >
      {label}
    </span>
  );
}

// ── CategoryBadge ─────────────────────────────────────────────────────────────

const CATEGORY_COLOURS: Record<ReportCategory, string> = {
  water_accumulation_on_roads:  'bg-blue-100 text-blue-800',
  suspected_drainage_blockage:  'bg-teal-100 text-teal-800',
  persistent_standing_water:    'bg-cyan-100 text-cyan-800',
  water_entering_building:      'bg-red-100 text-red-800',
  other_waterlogging:           'bg-indigo-100 text-indigo-800',
  uncertain:                    'bg-slate-100 text-slate-600',
};

export function CategoryBadge({ category }: { category: ReportCategory }) {
  const colour = CATEGORY_COLOURS[category] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colour}`}>
      {categoryLabel(category)}
    </span>
  );
}

// ── SyntheticBanner ───────────────────────────────────────────────────────────

export function SyntheticBanner({ message }: { message?: string }) {
  return (
    <div
      role="note"
      aria-label="Demonstration data notice"
      className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800"
    >
      <span aria-hidden="true">⚠️</span>
      <span>
        {message ??
          'This view includes DEMONSTRATION DATA — synthetic records created to illustrate SENTINEL\'s features. They do not represent real incidents.'}
      </span>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'article' | 'section' | 'aside';
}

export function Card({ className = '', children, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
    >
      {children}
    </Tag>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'default' | 'blue' | 'teal' | 'amber' | 'red';
}

const ACCENT_COLOURS: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'text-navy-800',
  blue:    'text-blue-600',
  teal:    'text-teal-600',
  amber:   'text-amber-600',
  red:     'text-red-600',
};

export function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  const colour = ACCENT_COLOURS[accent];
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${colour}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

// ── PriorityMeter ─────────────────────────────────────────────────────────────

export function PriorityMeter({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-sm text-slate-400 italic">Not scored</span>;
  }
  const colour =
    score >= 75 ? 'bg-red-500' : score >= 50 ? 'bg-amber-500' : 'bg-teal-500';
  return (
    <div className="flex items-center gap-2" aria-label={`Priority score: ${score} out of 100`}>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 min-w-[2.5rem] text-right">
        {score}
      </span>
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────

export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12 gap-3" role="status" aria-label={label}>
      <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

// ── ErrorAlert ────────────────────────────────────────────────────────────────

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
    >
      <span aria-hidden="true" className="text-base">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '📋', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>
      <p className="font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── FieldError ────────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-600" id="field-error">
      {message}
    </p>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── SafetyNotice ──────────────────────────────────────────────────────────────

export function SafetyNotice() {
  return (
    <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3 mt-3">
      SENTINEL is a decision-support tool. It does not replace official emergency
      instructions or human inspection. In an emergency, contact local emergency services.
    </p>
  );
}
