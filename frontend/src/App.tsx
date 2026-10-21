/**
 * SENTINEL — Root application with routing
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import MapPage from './pages/MapPage';
import SystemInfo from './pages/SystemInfo';
import IncidentDetail from './pages/IncidentDetail';

export default function App() {
  return (
    <BrowserRouter>
      {/* Skip-to-content for keyboard / screen reader users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main
          id="main-content"
          className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6"
        >
          <Routes>
            <Route path="/"                 element={<Dashboard />} />
            <Route path="/report"           element={<ReportIncident />} />
            <Route path="/reports"          element={<Reports />} />
            <Route path="/reports/:id"      element={<ReportDetail />} />
            <Route path="/map"              element={<MapPage />} />
            <Route path="/system-info"      element={<SystemInfo />} />
            <Route path="/incidents/:id"    element={<IncidentDetail />} />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="text-center py-24">
                  <p className="text-6xl mb-4" aria-hidden="true">🌊</p>
                  <h1 className="text-2xl font-bold text-navy-800 mb-2">Page Not Found</h1>
                  <p className="text-slate-500 mb-6">
                    The page you're looking for doesn't exist.
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    ← Back to Dashboard
                  </a>
                </div>
              }
            />
          </Routes>
        </main>

        <footer className="bg-navy-900 text-slate-400 text-xs text-center py-4 px-6 mt-8">
          <p>
            SENTINEL — AI-Assisted Urban Waterlogging Intelligence Platform ·
            Decision-support tool only · Not a replacement for emergency services ·
            <a
              href="/system-info"
              className="ml-1 text-teal-400 hover:text-teal-300 underline"
            >
              How it works
            </a>
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
