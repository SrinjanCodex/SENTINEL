/**
 * SENTINEL — Application Navigation
 *
 * Top-level nav bar with mobile-responsive hamburger menu.
 * Uses React Router's NavLink for active-link highlighting.
 */
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',            label: 'Dashboard' },
  { to: '/report',      label: 'Report Incident' },
  { to: '/reports',     label: 'Reports' },
  { to: '/map',         label: 'Map' },
  { to: '/system-info', label: 'System Info' },
];

export function Navigation() {
  const [open, setOpen] = useState(false);

  const linkBase =
    'px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500';
  const linkActive = 'bg-teal-700 text-white';
  const linkInactive = 'text-slate-200 hover:bg-navy-700 hover:text-white';

  return (
    <nav
      className="bg-navy-900 text-white shadow-lg"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight text-white hover:text-teal-400 transition-colors"
            aria-label="SENTINEL home"
          >
            <span aria-hidden="true">🌊</span>
            SENTINEL
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1" role="list">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                role="listitem"
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-navy-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `block ${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
