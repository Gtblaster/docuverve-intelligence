/**
 * Small inline badge chip with color variants.
 * @param {'default'|'purple'|'green'|'amber'|'red'} variant - Color variant
 * @param {React.ReactNode} children - Badge label content
 */
export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-white/5 text-white/60 border-white/10',
    purple:  'bg-docuverve-500/20 text-docuverve-300 border-docuverve-500/30',
    green:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
    red:     'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
        variants[variant] || variants.default
      }`}
    >
      {children}
    </span>
  );
}
