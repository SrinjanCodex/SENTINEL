/**
 * SENTINEL — Floating Quick-Action Panel (FAB)
 * Persistent bottom-right floating intake trigger providing instant access
 * to observation submission. Automatically hides on /report page.
 */
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export function QuickReportFAB() {
  const location = useLocation();

  // Hide the floating button when already on the report intake page
  if (location.pathname === '/report') {
    return null;
  }

  return (
    <aside
      aria-label="Quick Action Panel"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group animate-fade-in"
    >
      <Link
        to="/report"
        className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl border border-slate-700/80 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 btn-press"
        aria-label="File a new waterlogging observation (Quick Action)"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
        </span>
        <PlusCircle className="w-4 h-4 text-teal-400" />
        <span className="text-xs font-semibold tracking-tight">Report Incident</span>
      </Link>
    </aside>
  );
}
