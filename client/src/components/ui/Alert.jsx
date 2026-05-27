const VARIANTS = {
  error:   { bg: 'bg-red-500/10 border-red-500/20',         text: 'text-red-400',     icon: '⚠️' },
  success: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: '✅' },
  warning: { bg: 'bg-amber-500/10 border-amber-500/20',     text: 'text-amber-400',   icon: '⚡' },
  info:    { bg: 'bg-blue-500/10 border-blue-500/20',       text: 'text-blue-400',    icon: 'ℹ️' },
};

/**
 * Dismissible alert banner with four severity variants.
 * @param {'error'|'success'|'warning'|'info'} type - Alert severity
 * @param {string} message - Alert body text
 * @param {() => void} [onClose] - If provided, renders a close button
 */
export default function Alert({ type = 'error', message, onClose }) {
  const v = VARIANTS[type] || VARIANTS.error;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 animate-fade-in ${v.bg}`} role="alert">
      <span className="text-base leading-none mt-0.5 flex-shrink-0" aria-hidden="true">{v.icon}</span>
      <p className={`flex-1 text-sm font-medium ${v.text}`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`${v.text} opacity-60 hover:opacity-100 transition-opacity leading-none`}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
