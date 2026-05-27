import { useState, useMemo } from 'react';
import { CATEGORIES, TOOLS } from '../constants/tools';
import ToolCard from '../components/dashboard/ToolCard';

const STATS = [
  { label: 'Tools Available', value: TOOLS.length, icon: '⚡', color: 'text-docuverve-400' },
  { label: 'WASM Eligible',   value: TOOLS.filter(t => t.wasmEligible).length, icon: '🔒', color: 'text-emerald-400' },
  { label: 'AI Powered',      value: TOOLS.filter(t => t.badge === 'AI Powered').length, icon: '🧠', color: 'text-purple-400' },
  { label: 'File Formats',    value: '15+', icon: '📄', color: 'text-amber-400' },
];

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    let tools = activeCategory === 'all' ? TOOLS : TOOLS.filter(t => t.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tools = tools.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }
    return tools;
  }, [activeCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="text-center mb-16 animate-fade-in">
        {/* Grid background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(96,96,239,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,96,239,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
          }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 text-xs text-white/50 font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-docuverve-400 animate-pulse" />
            Document Intelligence Platform
          </div>

          <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl text-white mb-6 leading-none tracking-tight">
            DocuVerve{' '}
            <span className="gradient-text">Intelligence</span>
          </h1>

          <p className="text-lg text-white/45 max-w-2xl mx-auto leading-relaxed">
            Enterprise-grade document processing. Merge, split, convert, protect, and analyze PDFs
            with server-side power or client-side privacy.
          </p>
        </div>
      </section>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {STATS.map(stat => (
          <div key={stat.label} className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/35 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ── Search + Filters ─────────────────────────────────────────────────── */}
      <section className="mb-8 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tools…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-dark pl-9"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
              {cat.id !== 'all' && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({TOOLS.filter(t => t.category === cat.id).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Tool Grid ────────────────────────────────────────────────────────── */}
      <section>
        {filteredTools.length > 0 ? (
          <>
            <p className="text-xs text-white/30 mb-4">
              Showing {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-white/50 font-medium">No tools match your search</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-4 btn-ghost text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
