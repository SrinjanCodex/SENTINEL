/**
 * SENTINEL — Application Navigation Command Bar
 * Production SaaS header with telemetry indicator, active pill states & mobile drawer
 */
import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Waves,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Map,
  Info,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/reports',     label: 'Reports',     icon: FileText },
  { to: '/map',         label: 'Live Map',    icon: Map },
  { to: '/system-info', label: 'System Spec', icon: Info },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-slate-900 border-b border-slate-800/90 sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Telemetry Indicator */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-1"
              aria-label="SENTINEL Home"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-600/30 group-hover:border-teal-400/50 transition-all">
                <Waves className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  SENTINEL
                  <span className="text-[10px] font-mono tracking-wider font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-teal-400 border border-slate-700/80 uppercase">
                    v0.1
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight hidden sm:block">
                  Urban Waterlogging Intelligence
                </span>
              </div>
            </Link>

            {/* Telemetry Status Chip */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-slate-300">Telemetry Online</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-300 font-normal">Demo Data</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-teal-400 border border-slate-700/70 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Action Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs hover:shadow-teal-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 btn-press"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Incident</span>
            </Link>

            <button
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div id="mobile-navigation" className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-4 space-y-1 animate-fade-in">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-teal-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`
              }
              onClick={() => setOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Status: Synthetic Demo Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      )}
    </header>
  );
}
