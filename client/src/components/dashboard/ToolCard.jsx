import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';

/**
 * Tool card for the dashboard grid.
 * Navigates to /workspace/:tool.id on click.
 *
 * @param {object} tool - Tool definition from TOOLS constant
 */
export default function ToolCard({ tool }) {
  return (
    <Link to={`/workspace/${tool.id}`} className="block">
      <div className="tool-card group h-full">
        {/* Gradient glow overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${tool.accent}18 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full gap-3">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${tool.accent}22, ${tool.accent}44)`,
              border: `1px solid ${tool.accent}33`,
            }}
          >
            {tool.icon}
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-sm leading-tight">{tool.title}</h3>
            {tool.badge && (
              <Badge variant={tool.badge === 'AI Powered' ? 'purple' : 'amber'}>
                {tool.badge}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-white/45 leading-relaxed flex-1">{tool.description}</p>

          {/* Footer row */}
          <div className="flex items-center justify-between pt-1">
            {tool.wasmEligible && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400/70 font-medium">
                <span className="w-1 h-1 rounded-full bg-emerald-400/70" />
                WASM ready
              </span>
            )}
            <span className="ml-auto text-docuverve-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Open →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
