import { formatBytes } from '../../utils/format';

/**
 * Displays the result of a processing operation.
 * Handles: binary download, multiple file downloads, and JSON intel results.
 *
 * @param {object} result - Result object from processFiles or processWasm
 * @param {Blob} [result.blob] - Single output blob
 * @param {object[]} [result.results] - Multiple { blob, filename } results (split)
 * @param {object} [result.json] - JSON data for intel tools
 * @param {object} result.headers - Response headers (for content-disposition)
 * @param {object} tool - Tool definition (for filename fallback and accent)
 * @param {() => void} onReset - Callback to reset the workspace
 */
export default function ResultPanel({ result, tool, onReset }) {
  if (!result) return null;

  // ── Multiple files (split tool) ───────────────────────────────────────────
  if (result.results && Array.isArray(result.results)) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <span>✅</span>
            {result.results.length} files ready
          </h3>
          <button onClick={onReset} className="btn-ghost text-sm">Process another</button>
        </div>

        <div className="space-y-2">
          {result.results.map((r, i) => (
            <div key={i} className="file-card flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{r.filename}</p>
                <p className="text-xs text-white/35 mt-0.5">{formatBytes(r.blob.size)}</p>
              </div>
              <a
                href={URL.createObjectURL(r.blob)}
                download={r.filename}
                className="btn-primary text-sm py-2 px-4"
                onClick={() => setTimeout(() => URL.revokeObjectURL(URL.createObjectURL(r.blob)), 5000)}
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── JSON intel result ─────────────────────────────────────────────────────
  if (result.json) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <span>✅</span> Analysis complete
          </h3>
          <button onClick={onReset} className="btn-ghost text-sm">Process another</button>
        </div>
        <div className="glass rounded-xl p-4 overflow-auto max-h-[500px]">
          <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(result.json, null, 2)}
          </pre>
        </div>
        <a
          href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result.json, null, 2))}`}
          download={`${tool.id}-result.json`}
          className="btn-primary inline-block text-center text-sm w-full"
        >
          Download JSON
        </a>
      </div>
    );
  }

  // ── Single blob download ──────────────────────────────────────────────────
  if (result.blob) {
    const disposition = result.headers?.['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `${tool.id}-output.pdf`;
    const objectUrl = URL.createObjectURL(result.blob);

    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <span>✅</span> Ready to download
          </h3>
          <button onClick={onReset} className="btn-ghost text-sm">Process another</button>
        </div>

        {/* File preview card */}
        <div className="glass rounded-xl p-5 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${tool.accent}22`, border: `1px solid ${tool.accent}44` }}
          >
            {tool.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{filename}</p>
            <p className="text-sm text-white/40 mt-0.5">{formatBytes(result.blob.size)}</p>
          </div>
        </div>

        {/* Download button */}
        <a
          href={objectUrl}
          download={filename}
          className="btn-primary flex items-center justify-center gap-2 w-full text-center"
          onClick={() => setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download {filename}
        </a>
      </div>
    );
  }

  return null;
}
