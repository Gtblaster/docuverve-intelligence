import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-docuverve-500 to-purple-600 flex items-center justify-center shadow-lg shadow-docuverve-500/30 group-hover:shadow-docuverve-500/50 transition-all">
              <span className="text-white text-sm font-black">V</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-white text-sm tracking-wide">DocuVerve</span>
              <span className="text-[10px] text-docuverve-400 font-medium tracking-widest uppercase">Intelligence</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[['/', 'Dashboard'], ['/workspace/merge', 'Tools']].map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === href
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API Online
            </span>

            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-slide-up">
            {[['/', 'Dashboard'], ['/workspace/merge', 'Tools']].map(([href, label]) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === href
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
