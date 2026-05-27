import { useState } from 'react';

/**
 * Renders the config form for a tool based on its configSchema definition.
 * @param {object} tool - Tool definition with configSchema array
 * @param {object} values - Current config values { [key]: value }
 * @param {(key: string, value: unknown) => void} onChange - Change handler
 */
export default function ConfigPanel({ tool, values, onChange }) {
  if (!tool.configSchema || tool.configSchema.length === 0) return null;

  // Filter out hidden fields
  const visibleFields = tool.configSchema.filter(f => f.type !== 'hidden');
  if (visibleFields.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-4 rounded-full" style={{ background: tool.accent }} />
        Options
      </h3>

      <div className="space-y-3">
        {visibleFields.map(field => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={values[field.key] ?? field.default}
            onChange={(val) => onChange(field.key, val)}
            accent={tool.accent}
          />
        ))}
      </div>
    </div>
  );
}

/** Renders the correct input for each field type. */
function FieldRenderer({ field, value, onChange, accent }) {
  switch (field.type) {
    case 'text':
    case 'password':
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50">{field.label}</label>
          <input
            type={field.type}
            className="input-dark"
            placeholder={field.placeholder || ''}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            autoComplete={field.type === 'password' ? 'new-password' : 'off'}
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50">{field.label}</label>
          <input
            type="number"
            className="input-dark"
            min={field.min}
            max={field.max}
            value={value ?? field.default}
            onChange={e => onChange(Number(e.target.value))}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50">{field.label}</label>
          <select
            className="input-dark cursor-pointer"
            value={value ?? field.default}
            onChange={e => onChange(e.target.value)}
          >
            {field.options.map(opt => (
              <option key={opt} value={opt} className="bg-[#1a1a2e]">
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case 'toggle':
      return (
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-medium text-white/50 flex-1">{field.label}</label>
          <button
            type="button"
            role="switch"
            aria-checked={!!value}
            onClick={() => onChange(!value)}
            className={`relative w-10 h-5.5 h-[22px] rounded-full transition-all duration-200 focus:outline-none ${
              value ? 'bg-docuverve-500' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200 ${
                value ? 'translate-x-[18px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      );

    case 'slider':
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-white/50">{field.label}</label>
            <span className="text-xs text-white/40">{value ?? field.default}</span>
          </div>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step || 0.01}
            value={value ?? field.default}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full accent-docuverve-500 cursor-pointer"
          />
        </div>
      );

    case 'multicheck':
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50">{field.label}</label>
          <div className="flex flex-wrap gap-2">
            {field.options.map(opt => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const current = Array.isArray(value) ? value : [];
                    onChange(
                      checked ? current.filter(v => v !== opt) : [...current, opt],
                    );
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    checked
                      ? 'text-white border-transparent'
                      : 'text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
                  }`}
                  style={checked ? { background: accent + '33', borderColor: accent + '66' } : {}}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );

    default:
      return null;
  }
}
