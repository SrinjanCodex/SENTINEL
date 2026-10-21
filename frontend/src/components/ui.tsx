/**
 * SENTINEL — Production UI Component System
 * Refined civic-tech design with Lucide icons, fluid transitions & accessibility
 */
import type { ReactNode } from 'react';
import type { ReportStatus, IncidentStatus, ReportCategory } from '../types';
import { categoryLabel } from '../lib/classification';
import { useCountUp } from '../lib/useCountUp';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  FileQuestion,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

// ── StatusBadge ───────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  dotColor: string;
  badgeClass: string;
  pulse?: boolean;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // Report statuses
  unverified: {
    label: 'Unverified',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-50/80 text-amber-800 border-amber-200/80',
    pulse: true,
  },
  linked: {
    label: 'Linked to Incident',
    dotColor: 'bg-blue-500',
    badgeClass: 'bg-blue-50/80 text-blue-800 border-blue-200/80',
  },
  dismissed: {
    label: 'Dismissed',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  // Incident statuses
  suspected: {
    label: 'Suspected Incident',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-50/80 text-amber-800 border-amber-200/80',
    pulse: true,
  },
  under_verification: {
    label: 'Under Verification',
    dotColor: 'bg-blue-500',
    badgeClass: 'bg-blue-50/80 text-blue-800 border-blue-200/80',
    pulse: true,
  },
  verified: {
    label: 'Verified by Field Inspection',
    dotColor: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80',
  },
  resolved: {
    label: 'Resolved',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

interface StatusBadgeProps {
  status: ReportStatus | IncidentStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const conf = STATUS_CONFIGS[status] ?? {
    label: status,
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border tracking-tight transition-colors ${pad} ${conf.badgeClass}`}
      role="status"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dotColor} ${conf.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {conf.label}
    </span>
  );
}

// ── CategoryBadge ─────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<ReportCategory, { bg: string; text: string; border: string }> = {
  water_accumulation_on_roads:  { bg: 'bg-blue-50/70',   text: 'text-blue-700',   border: 'border-blue-200/60' },
  suspected_drainage_blockage:  { bg: 'bg-teal-50/70',   text: 'text-teal-700',   border: 'border-teal-200/60' },
  persistent_standing_water:    { bg: 'bg-cyan-50/70',   text: 'text-cyan-800',   border: 'border-cyan-200/60' },
  water_entering_building:      { bg: 'bg-rose-50/70',   text: 'text-rose-700',   border: 'border-rose-200/60' },
  other_waterlogging:           { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-200/60' },
  uncertain:                    { bg: 'bg-slate-100',    text: 'text-slate-600',  border: 'border-slate-200' },
};

export function CategoryBadge({ category }: { category: ReportCategory }) {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.uncertain;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
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
      className="flex items-start gap-3 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs sm:text-sm text-amber-900 shadow-sm animate-fade-in"
    >
      <div className="p-1 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
        <Info className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold text-amber-950 block sm:inline mr-1">
          Demonstration Telemetry Active:
        </span>
        {message ??
          'This view incorporates synthetic demonstration reports for UI evaluation. Locally submitted reports remain active in this browser and are clearly marked.'}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'article' | 'section' | 'aside';
  hoverEffect?: boolean;
}

export function Card({ className = '', children, as: Tag = 'div', hoverEffect = false }: CardProps) {
  const hoverClass = hoverEffect
    ? 'card-interactive hover:border-slate-300 hover:shadow-md'
    : 'transition-shadow duration-200';

  return (
    <Tag
      className={`bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${hoverClass} ${className}`}
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
  icon?: LucideIcon;
  badge?: string;
}

const ACCENT_STYLES: Record<
  NonNullable<StatCardProps['accent']>,
  { text: string; bgIcon: string; iconColor: string }
> = {
  default: { text: 'text-slate-900', bgIcon: 'bg-slate-100', iconColor: 'text-slate-600' },
  blue:    { text: 'text-blue-600',  bgIcon: 'bg-blue-50',  iconColor: 'text-blue-600' },
  teal:    { text: 'text-teal-600',  bgIcon: 'bg-teal-50',  iconColor: 'text-teal-600' },
  amber:   { text: 'text-amber-600', bgIcon: 'bg-amber-50', iconColor: 'text-amber-600' },
  red:     { text: 'text-red-600',   bgIcon: 'bg-red-50',   iconColor: 'text-red-600' },
};

export function StatCard({
  label,
  value,
  sub,
  accent = 'default',
  icon: Icon = TrendingUp,
  badge,
}: StatCardProps) {
  const style = ACCENT_STYLES[accent];
  const animatedValue = useCountUp(value, 750);

  return (
    <Card className="p-4 sm:p-5 relative overflow-hidden group hover:border-slate-300 card-interactive">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <p className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-numbers ${style.text}`}>
            {animatedValue}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${style.bgIcon} ${style.iconColor} transition-transform group-hover:scale-105 duration-200`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs">
        {sub && <span className="text-slate-500 font-normal">{sub}</span>}
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
            {badge}
          </span>
        )}
      </div>
    </Card>
  );
}

// ── PriorityMeter ─────────────────────────────────────────────────────────────

export function PriorityMeter({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-xs text-slate-400 italic font-medium">Unassessed</span>;
  }

  let barColor = 'bg-teal-500';
  let badgeColor = 'text-teal-700 bg-teal-50 border-teal-200';
  let tierLabel = 'Low Priority';

  if (score >= 75) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
    tierLabel = 'Elevated Priority';
  } else if (score >= 50) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-800 bg-amber-50 border-amber-200';
    tierLabel = 'Medium Priority';
  }

  return (
    <div className="space-y-1.5" aria-label={`Priority indicator: ${score} out of 100`}>
      <div className="flex items-center justify-between text-xs">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
          {tierLabel}
        </span>
        <span className="font-mono font-bold text-slate-800 text-xs tabular-numbers">
          {score}<span className="text-slate-400 font-normal">/100</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ── Loading Skeleton & Spinner ────────────────────────────────────────────────

export function SkeletonRow() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-16" />
      </div>
      <div className="h-3 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
    </div>
  );
}

export function LoadingSpinner({ label = 'Retrieving intelligence…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="status" aria-label={label}>
      <div className="relative w-8 h-8">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin" />
      </div>
      <span className="text-xs font-medium text-slate-500 tracking-wide">{label}</span>
    </div>
  );
}

// ── ErrorAlert ────────────────────────────────────────────────────────────────

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 bg-red-50/90 border border-red-200/90 rounded-xl text-sm text-red-900 shadow-sm animate-fade-in"
    >
      <div className="p-1 rounded-lg bg-red-100 text-red-700 shrink-0">
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="flex-1 text-xs sm:text-sm">
        <p className="font-semibold text-red-950 mb-0.5">Operation Alert</p>
        <p>{message}</p>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = FileQuestion, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-14 px-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className="font-semibold text-slate-800 text-sm">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── FieldError ────────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium animate-fade-in">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: string;
}

export function PageHeader({ title, subtitle, action, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── SafetyNotice ──────────────────────────────────────────────────────────────

export function SafetyNotice() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
      <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
      <span>
        <strong>Notice:</strong> Prioritisation indicators reflect evidence completeness and severity heuristics. They do not represent physical flood forecasts. In an emergency, dial local emergency services.
      </span>
    </div>
  );
}
