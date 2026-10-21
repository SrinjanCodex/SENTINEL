/**
 * SENTINEL — System Information page
 *
 * Explains how SENTINEL works: classification, matching, scoring, missing signals.
 * In Milestone 1, this is static text, clearly labelled as such.
 * In Milestone 5+, the parameters and weights will be read from the live configuration.
 */
import type { ReactNode } from 'react';
import { Card, PageHeader, SafetyNotice } from '../components/ui';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-navy-800 mb-3 pb-2 border-b border-slate-100">
        {title}
      </h2>
      <div className="prose prose-sm text-slate-600 max-w-none space-y-3">
        {children}
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
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-600">
              Parameter
            </th>
            <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-600">
              Value
            </th>
            <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-600">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ param, value, note }) => (
            <tr key={param} className="hover:bg-slate-50/50">
              <td className="px-3 py-2 border border-slate-200 font-mono text-xs">
                {param}
              </td>
              <td className="px-3 py-2 border border-slate-200 font-semibold">
                {value}
              </td>
              <td className="px-3 py-2 border border-slate-200 text-slate-500">
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
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="System Information"
        subtitle="How SENTINEL works — matching logic, scoring, missing-signal rules, and limitations."
      />

      <div
        role="note"
        className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3"
      >
        ⚠️ <strong>Milestone 1 placeholder.</strong> In a later milestone, the parameters
        and weights shown below will be read from the live backend configuration rather
        than this static page. Until then, these values are the planned defaults — they
        are not yet being used in live analysis.
      </div>

      <Section title="What is SENTINEL?">
        <p>
          SENTINEL is an <strong>AI-assisted decision-support tool</strong> for urban
          waterlogging intelligence. It connects community reports, geographic data,
          historical records, and environmental context to identify potential drainage
          incidents that may need human inspection.
        </p>
        <p>
          SENTINEL does <strong>not</strong> replace official emergency services, human
          engineers, or authoritative flood prediction systems. It produces
          <em> prioritisation indicators</em> — not flood forecasts.
        </p>
        <SafetyNotice />
      </Section>

      <Section title="Report Classification">
        <p>
          When you submit a report, SENTINEL automatically assigns a category using
          a keyword-matching classifier. It looks for phrases associated with each
          category (e.g., "blocked drain", "standing water", "water entering building").
        </p>
        <p>
          If no category scores clearly ahead — or if the text contains very few
          signal phrases — the result is marked <strong>"uncertain / unclassified"</strong>.
          SENTINEL never forces a category when the evidence is insufficient.
        </p>
        <p>
          In a later milestone, a machine-learning classifier (Sentence Transformers)
          will be added and evaluated against the keyword baseline. The UI will always
          show whether a classification is from the keyword baseline or the trained
          model.
        </p>
      </Section>

      <Section title="How Reports Are Matched">
        <p>
          SENTINEL compares report descriptions to find pairs that might describe the
          same real-world event. It combines four signals:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Semantic similarity</strong> — how similar the descriptions are in
            meaning (using sentence embeddings in Milestone 3).
          </li>
          <li>
            <strong>Geographic proximity</strong> — distance between report locations,
            using the Haversine formula. Reports without coordinates receive a capped
            score and are labelled "location-unconfirmed".
          </li>
          <li>
            <strong>Time difference</strong> — how close the observation times are.
          </li>
          <li>
            <strong>Category compatibility</strong> — whether the categories are
            compatible (e.g., drainage blockage and standing water often co-occur).
          </li>
        </ul>
        <p>
          Text similarity alone is <strong>not</strong> proof of a shared incident. A
          combined score must exceed a threshold before reports are linked. Every match
          includes a structured explanation of which signals contributed.
        </p>
        <ParamTable
          rows={[
            { param: 'semantic_weight', value: '0.40', note: 'Planned default — not yet active' },
            { param: 'geographic_weight', value: '0.30', note: 'Planned default — not yet active' },
            { param: 'time_weight', value: '0.15', note: 'Planned default — not yet active' },
            { param: 'category_weight', value: '0.15', note: 'Planned default — not yet active' },
            { param: 'candidate_radius_m', value: '300', note: 'Maximum distance for geographic match candidates' },
            { param: 'time_window_hours', value: '72', note: 'Reports further apart in time are not candidates' },
            { param: 'link_threshold', value: '0.60', note: 'Minimum combined score to link two reports' },
          ]}
        />
      </Section>

      <Section title="Incident Prioritisation Score">
        <p>
          When multiple reports are grouped into a potential incident, SENTINEL
          computes a <strong>prioritisation score from 0 to 100</strong>. A higher
          score means the incident has more corroborating evidence and should be
          inspected sooner — it is <strong>not</strong> a probability of flooding.
        </p>
        <p>
          The score is a weighted sum of normalised factors. Each factor contributes
          independently and is shown transparently in the Incident Investigation page.
        </p>
        <ParamTable
          rows={[
            { param: 'Reported severity', value: 'weight 0.25', note: "Average of independent reports' severity ratings" },
            { param: 'Independent report count', value: 'weight 0.25', note: 'Saturating curve — duplicates do not count' },
            { param: 'Supporting evidence strength', value: 'weight 0.15', note: 'Includes photo, historical records' },
            { param: 'Historical recurrence', value: 'weight 0.15', note: 'Excluded and flagged if data unavailable' },
            { param: 'Environmental context', value: 'weight 0.10', note: 'Rainfall data if available; excluded if not' },
            { param: 'Recency', value: 'weight 0.10', note: 'Decays since latest observation' },
          ]}
        />
        <p className="text-xs italic text-slate-500 mt-2">
          These weights are heuristic defaults. They will only be tuned against a
          labelled evaluation dataset (Milestone 3) and the results reported honestly.
          No accuracy claims are made until evaluation has been run.
        </p>
      </Section>

      <Section title="Missing-Signal Detector">
        <p>
          For each potential incident, SENTINEL checks a set of rules to identify gaps
          in the evidence. A gap is flagged <strong>only when information is genuinely
          absent, outdated, or inconsistent</strong> — never when it is available.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-600">Rule</th>
                <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-600">Triggers when…</th>
                <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-600">Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rule: 'MS-LOC', trigger: 'Location missing or only approximate', action: 'Confirm a precise location' },
                { rule: 'MS-TIME', trigger: 'Observation time missing for any contributing report', action: 'Request observation time' },
                { rule: 'MS-CONFLICT', trigger: 'Reports give contradictory information', action: 'Request a fresh observation' },
                { rule: 'MS-INDEP', trigger: 'Fewer independent reports than minimum', action: 'Seek additional independent confirmation' },
                { rule: 'MS-VERIFY', trigger: 'No human verification, or verification outdated', action: 'Schedule a field inspection' },
                { rule: 'MS-HIST', trigger: 'No historical incident data available for area', action: 'Check municipal records' },
                { rule: 'MS-WX', trigger: 'Weather/rainfall data unavailable or outdated', action: 'Obtain current rainfall data from official source' },
                { rule: 'MS-PHOTO', trigger: 'No photo evidence (low severity — photos do not prove depth)', action: 'Request a photo if safe' },
              ].map(({ rule, trigger, action }) => (
                <tr key={rule} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 border border-slate-200 font-mono text-xs font-bold">{rule}</td>
                  <td className="px-3 py-2 border border-slate-200">{trigger}</td>
                  <td className="px-3 py-2 border border-slate-200 text-slate-500">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Verification Status Definitions">
        <p>
          SENTINEL uses distinct status labels to make uncertainty visible:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Suspected</strong> — the system generated this potential incident
            from report clustering. It is a machine hypothesis, not a confirmed event.
          </li>
          <li>
            <strong>Under Verification</strong> — a human has started reviewing it.
          </li>
          <li>
            <strong>Verified</strong> — a human field inspector has confirmed the
            incident. Only a recorded human action can set this status.
          </li>
          <li>
            <strong>Dismissed</strong> — investigation found no real incident.
          </li>
          <li>
            <strong>Resolved</strong> — the drainage issue was corrected.
          </li>
        </ul>
      </Section>

      <Section title="Data Sources">
        <p>
          In Milestone 1, all data comes from:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Demonstration data</strong> — 8 synthetic reports and 3 synthetic
            incidents, clearly labelled ⚠️ DEMO. Created to illustrate features only.
          </li>
          <li>
            <strong>Browser-stored reports</strong> — reports you submit in this browser,
            stored in localStorage. Not sent to any server.
          </li>
        </ul>
        <p>
          Future milestones will add optional integration with:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Official rainfall / weather data (provider to be verified and documented)</li>
          <li>Municipal historical incident records (via secure import)</li>
        </ul>
        <p className="text-xs italic text-slate-500">
          SENTINEL will never silently use fabricated data for missing live data.
          All external data is shown with its source and retrieval timestamp.
        </p>
      </Section>

      <Section title="Known Limitations (Milestone 1)">
        <ul className="list-disc pl-5 space-y-1">
          <li>No backend — reports are not sent to a server (Milestone 2 adds this)</li>
          <li>No real classification ML model (Milestone 3 adds Sentence Transformers)</li>
          <li>No report matching or incident detection (Milestone 3–4)</li>
          <li>Priority scores on demo incidents are illustrative, not computed</li>
          <li>No photo upload (Milestone 2+)</li>
          <li>No authentication — verification actions are not production-ready</li>
          <li>No map location picker in the report form (Milestone 4)</li>
          <li>System Information page shows planned configuration, not live values</li>
        </ul>
      </Section>
    </div>
  );
}
