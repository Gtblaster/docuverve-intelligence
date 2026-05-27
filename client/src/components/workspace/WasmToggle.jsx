export default function WasmToggle({ isWasm, onToggle, eligible }) {
  if (!eligible) return null;

  return (
    <button
      id="wasm-toggle"
      onClick={onToggle}
      aria-pressed={isWasm}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 text-left ${
        isWasm
          ? 'border-emerald-500/40 bg-emerald-500/8 shadow-lg shadow-emerald-500/10'
          : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all ${
          isWasm ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/20' : 'bg-white/5'
        }`}
      >
        {isWasm ? '🔒' : '🌐'}
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold transition-colors ${isWasm ? 'text-emerald-400' : 'text-white/60'}`}>
          {isWasm ? 'Local WASM Mode' : 'Server Mode'}
        </p>
        <p className="text-xs text-white/30 mt-0.5 leading-relaxed">
          {isWasm
            ? 'Files never leave your browser · Maximum privacy'
            : 'Backend API processing · Toggle for full privacy'}
        </p>
      </div>

      {/* Toggle pill */}
      <div
        className={`relative inline-flex h-5 w-9 items-center rounded-full flex-shrink-0 transition-colors ${
          isWasm ? 'bg-emerald-500' : 'bg-white/15'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            isWasm ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
}
