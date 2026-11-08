/**
 * SENTINEL — Root Application
 * Top-level routing, accessible skip-link, and unified telemetry shell
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QuickReportFAB } from './components/QuickReportFAB';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import MapPage from './pages/MapPage';
import SystemInfo from './pages/SystemInfo';
import IncidentDetail from './pages/IncidentDetail';
import { ShieldAlert, Compass, ArrowLeft } from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

function MainRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page-enter">
      <Routes location={location}>
        <Route path="/"                 element={<Dashboard />} />
        <Route path="/report"           element={<ReportIncident />} />
        <Route path="/reports"          element={<Reports />} />
        <Route path="/reports/:id"      element={<ReportDetail />} />
        <Route path="/map"              element={<MapPage />} />
        <Route path="/system-info"      element={<SystemInfo />} />
        <Route path="/incidents/:id"    element={<IncidentDetail />} />
        
        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="text-center py-24 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                <Compass className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Endpoint Unresolved</h1>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                The requested route does not correspond to an active intelligence view or incident record.
              </p>
              <Link
                to="/"
                viewTransition
                className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-teal-500 transition-colors shadow-sm btn-press"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Overview Dashboard</span>
              </Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Accessible skip-to-content navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navigation />

        <main
          id="main-content"
          className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        >
          <ErrorBoundary>
            <MainRoutes />
          </ErrorBoundary>
        </main>

        <QuickReportFAB />

        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 px-4 sm:px-8 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="font-semibold text-slate-300">
                SENTINEL — AI-Assisted Urban Waterlogging Intelligence Platform
              </p>
              <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Decision-support platform · Does not replace emergency dispatch services.</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Link to="/system-info" className="text-teal-400 hover:text-teal-300 underline font-medium">
                System Specifications & Methodology
              </Link>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500 font-mono text-[11px]">Milestone 2 · Layout v3</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
