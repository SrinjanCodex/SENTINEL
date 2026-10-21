/**
 * SENTINEL — React Error Boundaries
 * Graceful error containment preventing full-page white screens.
 * Provides application-level and map-level isolation.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ── Application-Level Error Boundary ──────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SENTINEL Application ErrorBoundary]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="p-8 my-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center max-w-lg mx-auto animate-fade-in"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-4 shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
            {this.props.fallbackMessage ||
              'An unexpected rendering issue occurred. Your stored reports and observations remain safe.'}
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left mb-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Diagnostic Trace:
              </p>
              <p className="text-xs font-mono text-rose-700 break-words">
                {this.state.error.message}
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all btn-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Map-Level Isolated Error Boundary ─────────────────────────────────────────

interface MapErrorBoundaryProps {
  children: ReactNode;
  height?: string;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SENTINEL MapErrorBoundary]:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ height: this.props.height || '340px' }}
          className="w-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center border border-slate-200 rounded-lg"
          role="region"
          aria-label="Map loading error"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Spatial Telemetry Map Unavailable
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-3 leading-relaxed">
            The map container encountered an initialization error. The rest of the intelligence platform remains fully operational.
          </p>
          {this.state.error && (
            <p className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 mb-3 max-w-sm truncate">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-2 rounded-lg font-medium transition-colors btn-press shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Map</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
