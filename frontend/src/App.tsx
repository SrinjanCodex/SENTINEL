/**
 * SENTINEL — Root Application
 * Top-level routing, accessible skip-link, and unified telemetry shell
 */
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QuickReportFAB } from './components/QuickReportFAB';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import MapPage from './pages/MapPage';
import SystemInfo from './pages/SystemInfo';
import IncidentDetail from './pages/IncidentDetail';
import { ShieldAlert, Compass, ArrowLeft } from 'lucide-react';

const GlowCursor = lazy(() => import('./components/GlowCursor'));
const LiquidChrome = lazy(() => import('./components/LiquidChrome'));

function GlobalBackground() {
  const { isDark } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check WebGL2 availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2');
      if (!gl) {
        setIsSupported(false);
        return;
      }
    } catch {
      setIsSupported(false);
      return;
    }

    const check = () => {
      const isMobile = window.innerWidth < 640;
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setEnabled(!isMobile && !reduced);
    };

    check();
    window.addEventListener('resize', check);
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    mq?.addEventListener('change', check);

    return () => {
      window.removeEventListener('resize', check);
      mq?.removeEventListener('change', check);
    };
  }, []);

  // Static tinted gradient fallback when WebGL is unavailable, on mobile, or reduced motion
  if (!enabled || !isSupported) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-[-1] transition-colors duration-500 bg-slate-50 dark:bg-[#070b12]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 via-transparent to-blue-500/5 dark:from-teal-900/10 dark:via-transparent dark:to-blue-900/15" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#070b12]"
      aria-hidden="true"
    >
      {/* High-contrast surface gradient ensuring full readability */}
      <div className="absolute inset-0 bg-slate-50/70 dark:bg-[#070b12]/80 z-[1] transition-colors duration-500" />

      {/* Single full-page WebGL canvas with low intensity & capped resolution */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30 z-0">
        <Suspense fallback={null}>
          <LiquidChrome
            color={isDark ? [0.03, 0.14, 0.20] : [0.72, 0.88, 0.94]}
            speed={0.07}
            amplitude={0.12}
            interactive={true}
            maxDevicePixelRatio={1}
            lightMode={!isDark}
            className="w-full h-full"
          />
        </Suspense>
      </div>
    </div>
  );
}

function GlobalGlowCursor() {
  const { isDark } = useTheme();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const check = () => {
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setEnabled(fine && !reduced);
    };
    check();
    const mqHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    mqHover.addEventListener('change', check);
    mqMotion.addEventListener('change', check);
    return () => {
      mqHover.removeEventListener('change', check);
      mqMotion.removeEventListener('change', check);
    };
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden" aria-hidden="true">
        <GlowCursor
          color={isDark ? '#2dd4bf' : '#0d9488'}
          secondaryColor={isDark ? '#38bdf8' : '#0284c7'}
          intensity={isDark ? 0.2 : 0.25}
          glow={0.3}
          trailWidth={14}
          linger={0.5}
          theme={isDark ? 'dark' : 'light'}
          blendMode="screen"
        />
      </div>
    </Suspense>
  );
}

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

function AppShell() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Global full-viewport single WebGL background */}
      <GlobalBackground />
      <GlobalGlowCursor />

      {/* Accessible skip-to-content navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-200">
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

        <footer className="bg-slate-900/95 dark:bg-[#090d16]/95 border-t border-slate-800 text-slate-400 text-xs py-6 px-4 sm:px-8 mt-auto backdrop-blur-md">
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
              <span className="text-slate-500 font-mono text-[11px]">Milestone 2 · Motion & 3D</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
