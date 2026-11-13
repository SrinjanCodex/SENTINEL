/**
 * SENTINEL — System Architecture Specification
 * Live technical audit explaining matching logic, prioritisation scoring, and Missing-Signal rules
 */
import type { ReactNode } from 'react';
import { Card, PageHeader, SafetyNotice } from '../components/ui';
import {
  Info,
  Sliders,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Database,
  Code2,
} from 'lucide-react';

function Section({
  title,
  icon: Icon,
  stagger = 'stagger-3',
  summary,
  children,
}: {
  title: string;
  icon?: typeof Info;
  stagger?: string;
  summary?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card tilt={false} className={`p-6 sm:p-8 overflow-hidden animate-card-rise ${stagger} border-slate-200/90 dark:border-slate-800/90 shadow-xs`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Heading, Icon & Executive Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0 border border-teal-200/60 dark:border-teal-800/60">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h2>
          </div>
          {summary && (
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              {summary}
            </div>
          )}
        </div>

        {/* Right Column: Algorithmic Details, Formulations & Tables */}
        <div className="lg:col-span-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
          {children}
        </div>
      </div>
    </Card>
  );
}

function ParamTable({
  rows,
}: {
  rows: { param: string; value: string; note: string }[];
}) {
  return (
    <div className="overflow-x-auto mt-3 border border-slate-200/80 dark:border-slate-800 rounded-xl">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-3.5 py-2.5">Parameter Token</th>
            <th className="px-3.5 py-2.5">Initial Default</th>
            <th className="px-3.5 py-2.5">Algorithmic Function</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
          {rows.map(({ param, value, note }) => (
            <tr key={param} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-3.5 py-2 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                {param}
              </td>
              <td className="px-3.5 py-2 font-semibold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                {value}
              </td>
              <td className="px-3.5 py-2 text-slate-500 dark:text-slate-400">
                {note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SystemInfo() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8 animate-page-enter">
      <div className="animate-card-rise stagger-1">
        <PageHeader
          title="System Specifications & Methodology"
          subtitle="Transparent algorithmic principles, multi-factor correlation weights, and Missing-Signal rules."
          badge="Specification Engine"
        />
      </div>

      <div
        role="note"
        className="flex items-start gap-3 p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 rounded-xl text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-2xs animate-fade-in stagger-2"
      >
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Milestone 1 Architecture Placeholder:</strong> The parameters and weights displayed below represent our planned specification constants. In Milestone 5, these values will be queried directly from the live backend configuration endpoint (<code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">/api/system/info</code>).
        </div>
      </div>

      <Section
        title="What is SENTINEL?"
        icon={Info}
        stagger="stagger-3"
        summary={
          <p>
            AI-assisted civic decision support platform designed specifically for urban waterlogging and stormwater infrastructure triage.
          </p>
        }
      >
        <p>
          SENTINEL is an <strong>AI-assisted civic intelligence and decision-support platform</strong> designed specifically for urban waterlogging and stormwater infrastructure failures. Rather than functioning as a standard grievance portal, SENTINEL correlates noisy, fragmentary citizen reports to detect systemic drainage blockages before catastrophic ponding occurs.
        </p>
        <p>
          SENTINEL produces <strong>incident prioritisation indicators</strong>, not statistical physical flood forecasts. It operates as a decision-support copilot for civic engineers and municipal emergency response units.
        </p>
        <SafetyNotice />
      </Section>

      <Section
        title="Report Classification Baseline"
        icon={Code2}
        stagger="stagger-4"
        summary={
          <p>
            Transparent deterministic keyword classifier categorizing raw citizen descriptions into discrete infrastructure failure classes.
          </p>
        }
      >
        <p>
          Submitted observations are processed through a transparent, deterministic keyword matching classifier. Incoming descriptions are matched against categorized phrase tokens (e.g., <em>"road flooded"</em>, <em>"blocked drain"</em>, <em>"water entering building"</em>, <em>"standing water"</em>).
        </p>
        <p>
          If no category achieves sufficient score separation, or if no waterlogging keywords are detected, the system explicitly returns <strong>"uncertain / unclassified"</strong>. SENTINEL never forces an arbitrary category when evidence is inadequate.
        </p>
        <p className="text-slate-500 italic text-xs">
          In Milestone 3, a Sentence Transformers embedding classifier will be benchmarked on a synthetic evaluation split against this transparent keyword baseline.
        </p>
      </Section>

      <Section
        title="Report Pair Matching Architecture"
        icon={Sliders}
        stagger="stagger-5"
        summary={
          <p>
            Multi-factor scoring algorithm assessing semantic similarity, geographic distance decay, and temporal proximity between report pairs.
          </p>
        }
      >
        <p>
          Potential correlation between two distinct reports is assessed by computing a multi-factor pair match score:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Semantic Similarity:</strong> Cosine similarity between description vectors (Sentence Transformers in Milestone 3, keyword fallback currently).
          </li>
          <li>
            <strong>Geographic Proximity:</strong> Distance decay calculated using the great-circle Haversine formula. Reports lacking GPS coordinates receive a penalized score and are flagged.
          </li>
          <li>
            <strong>Temporal Decay:</strong> Linear decay over a configurable 72-hour window.
          </li>
          <li>
            <strong>Category Compatibility:</strong> Semantic cross-compatibility matrix (e.g., street ponding and clogged grates frequently co-occur).
          </li>
        </ul>
        
        <ParamTable
          rows={[
            { param: 'semantic_weight', value: '0.40', note: 'Weight allocated to text semantic similarity' },
            { param: 'geographic_weight', value: '0.30', note: 'Weight allocated to spatial proximity' },
            { param: 'time_weight', value: '0.15', note: 'Decay weight across temporal window' },
            { param: 'category_weight', value: '0.15', note: 'Cross-category compatibility coefficient' },
            { param: 'candidate_radius_m', value: '300 m', note: 'Maximum spatial radius for candidate edge formation' },
            { param: 'time_window_hours', value: '72 hrs', note: 'Temporal horizon for related incident candidate search' },
            { param: 'link_threshold', value: '0.60', note: 'Minimum aggregate score required to link two reports' },
          ]}
        />
      </Section>

      <Section
        title="Prioritisation Scoring Formula"
        icon={Cpu}
        stagger="stagger-6"
        summary={
          <p>
            Standardized 0–100 index ranking correlated incident clusters by corroborated evidence weight, independent reporters, and severity heuristics.
          </p>
        }
      >
        <p>
          Correlated incident clusters receive a <strong>Prioritisation Index from 0 to 100</strong>. This score ranks incidents by corroborated evidence weight and potential civic hazard:
        </p>
        <ParamTable
          rows={[
            { param: 'Reported severity', value: 'weight 0.25', note: "Mean of independent reports' subjective severity ratings" },
            { param: 'Independent report count', value: 'weight 0.25', note: 'Saturating logarithmic curve; duplicates from same token count as one' },
            { param: 'Supporting evidence strength', value: 'weight 0.15', note: 'Photo presence and municipal historical recurrence records' },
            { param: 'Historical recurrence', value: 'weight 0.15', note: 'Excluded and flagged if municipal data is unavailable' },
            { param: 'Environmental context', value: 'weight 0.10', note: 'Rainfall intensity from official weather services' },
            { param: 'Recency decay', value: 'weight 0.10', note: 'Decays exponentially from time of most recent observation' },
          ]}
        />
        <p className="text-[11px] text-slate-400 italic mt-2">
          Weights are heuristic defaults and will be tuned transparently against the labelled evaluation dataset.
        </p>
      </Section>

      <Section
        title="Missing-Signal Detector (Signature Feature)"
        icon={AlertTriangle}
        stagger="stagger-7"
        summary={
          <p>
            Automated gap detection engine evaluating the evidence graph and surfacing actionable verification requests when data is absent, coarse, or conflicting.
          </p>
        }
      >
        <p>
          The Missing-Signal Detector systematically evaluates the evidence graph and flags critical information gaps. A rule fires <strong>only when data is genuinely absent, stale, or conflicting</strong>:
        </p>
        <div className="overflow-x-auto mt-3 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-2.5">Rule ID</th>
                <th className="px-3.5 py-2.5">Trigger Condition</th>
                <th className="px-3.5 py-2.5">Recommended Municipal Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
              {[
                { rule: 'MS-LOC', trigger: 'Coordinates missing or location coarse', action: 'Dispatch verification request for precise coordinates' },
                { rule: 'MS-TIME', trigger: 'Observation timestamp missing from contributing report', action: 'Request temporal observation window' },
                { rule: 'MS-CONFLICT', trigger: 'Descriptions report opposing water levels or severity', action: 'Schedule immediate fresh observation' },
                { rule: 'MS-INDEP', trigger: 'Fewer independent tokens than configured minimum', action: 'Seek corroboration from nearby independent observers' },
                { rule: 'MS-VERIFY', trigger: 'No human inspection recorded, or inspection stale', action: 'Schedule on-site municipal engineering inspection' },
                { rule: 'MS-HIST', trigger: 'No historical flood/drainage records for local grid', action: 'Query municipal historical infrastructure records' },
                { rule: 'MS-WX', trigger: 'Rainfall/precipitation telemetry unavailable or stale', action: 'Pull current precipitation data from official meteorological API' },
                { rule: 'MS-PHOTO', trigger: 'No photographic evidence uploaded (low severity)', action: 'Request citizen photo if safe to take' },
              ].map(({ rule, trigger, action }) => (
                <tr key={rule} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{rule}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300">{trigger}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Status Verification Protocol"
        icon={ShieldCheck}
        stagger="stagger-8"
        summary={
          <p>
            Deterministic verification pipeline ensuring unverified citizen inputs never masquerade as confirmed infrastructure facts.
          </p>
        }
      >
        <ul className="space-y-2.5 list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded text-[11px]">Suspected:</span>
            <span>Algorithmic hypothesis formed by automated cluster correlation. Unverified by humans.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded text-[11px]">Under Verification:</span>
            <span>Assigned to municipal field team for physical triage.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">Verified:</span>
            <span>Confirmed by recorded human inspection. Only human action can promote to this status.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[11px]">Dismissed:</span>
            <span>Investigated and determined to be non-actionable or false alarm.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[11px]">Resolved:</span>
            <span>Physical drainage issue corrected by civic works.</span>
          </li>
        </ul>
      </Section>

      <Section
        title="Data Source Attribution"
        icon={Database}
        stagger="stagger-8"
        summary={
          <p>
            Transparent provenance tracking separating synthetic demonstration callouts from live community observations.
          </p>
        }
      >
        <p>In Milestone 1, intelligence is derived strictly from:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Demonstration Dataset:</strong> 8 synthetic reports and 3 synthetic incidents (labelled ⚠️ DEMO).</li>
          <li><strong>Local Browser Storage:</strong> Submissions committed during this browser session.</li>
        </ul>
        <p className="text-xs text-slate-500 italic mt-2">
          Notice: SENTINEL will never substitute fabricated data for missing live telemetry. Missing external sources automatically trigger MS-rules.
        </p>
      </Section>

    </div>
  );
}
