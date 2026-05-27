/**
 * Animated progress bar with optional label and percentage.
 * @param {number} value - Progress value (0–100)
 * @param {string} [label] - Optional label displayed above the bar
 * @param {string} [className] - Additional CSS classes for wrapper
 */
export default function ProgressBar({ value = 0, label, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-white/50">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: 'linear-gradient(90deg, #6060ef, #8b5cf6)',
            boxShadow: '0 0 10px rgba(96,96,239,0.5)',
          }}
        />
      </div>
    </div>
  );
}
