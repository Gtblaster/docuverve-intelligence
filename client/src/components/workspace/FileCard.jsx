import { formatBytes } from '../../utils/format';

const STATUS_STYLES = {
  queued:     'text-white/40 bg-white/5',
  processing: 'text-amber-400 bg-amber-400/10',
  done:       'text-emerald-400 bg-emerald-400/10',
  error:      'text-red-400 bg-red-400/10',
};

/**
 * File queue item card with drag handle, metadata, status badge, and remove button.
 * @param {object} item - Queue item { id, name, size, pageCount, status }
 * @param {number} index - Position in the list (0-indexed)
 * @param {(id: string) => void} onRemove - Remove callback
 * @param {object} dragHandleProps - dnd-kit drag handle props to spread
 */
export default function FileCard({ item, index, onRemove, dragHandleProps = {} }) {
  return (
    <div className="file-card flex items-center gap-3 px-4 py-3 animate-fade-in">
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 transition-colors flex-shrink-0"
        title="Drag to reorder"
      >
        <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true">
          <circle cx="4"  cy="4"  r="2" />
          <circle cx="4"  cy="10" r="2" />
          <circle cx="4"  cy="16" r="2" />
          <circle cx="10" cy="4"  r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="10" cy="16" r="2" />
        </svg>
      </div>

      {/* Index badge */}
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/40 flex-shrink-0">
        {index + 1}
      </div>

      {/* File icon */}
      <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Filename and metadata */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-white/35">{formatBytes(item.size)}</span>
          {item.pageCount != null && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/35">
                {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          STATUS_STYLES[item.status] || STATUS_STYLES.queued
        }`}
      >
        {item.status}
      </span>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
        title="Remove file"
        aria-label={`Remove ${item.name}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
