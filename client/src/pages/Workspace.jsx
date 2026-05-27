import { useState, useCallback, useReducer } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getToolById } from '../constants/tools';
import { processFiles } from '../lib/api';
import { useFileQueue } from '../hooks/useFileQueue';
import { useWasm } from '../hooks/useWasm';
import DropZone from '../components/workspace/DropZone';
import FileQueueCanvas from '../components/workspace/FileQueueCanvas';
import ConfigPanel from '../components/workspace/ConfigPanel';
import ResultPanel from '../components/workspace/ResultPanel';
import ToolSidebar from '../components/workspace/ToolSidebar';
import ProgressBar from '../components/ui/ProgressBar';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';

/** Build initial config values from a tool's configSchema */
function buildInitialConfig(schema = []) {
  return schema.reduce((acc, field) => {
    acc[field.key] = field.default ?? '';
    return acc;
  }, {});
}

/** Config reducer for granular key updates */
function configReducer(state, { key, value }) {
  return { ...state, [key]: value };
}

export default function Workspace() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const tool = getToolById(toolId);

  const { queue, loading: queueLoading, addFiles, removeFile, reorderFiles, clearQueue } = useFileQueue();
  const { isWasm, toggleWasm, processWasm } = useWasm(toolId, tool?.wasmEligible || false);

  const [config, dispatchConfig] = useReducer(
    configReducer,
    null,
    () => buildInitialConfig(tool?.configSchema),
  );

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Tool not found
  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="text-6xl">🔍</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Tool not found</h2>
          <p className="text-white/50">The tool "{toolId}" does not exist in DocuVerve.</p>
        </div>
        <Link to="/" className="btn-primary">← Back to Dashboard</Link>
      </div>
    );
  }

  /** Handle config field changes */
  const handleConfigChange = useCallback((key, value) => {
    dispatchConfig({ key, value });
  }, []);

  /** Submit processing job */
  const handleProcess = useCallback(async () => {
    if (queue.length === 0) {
      setError('Please add at least one file before processing.');
      return;
    }
    if (tool.maxFiles && queue.length > tool.maxFiles) {
      setError(`This tool accepts a maximum of ${tool.maxFiles} files.`);
      return;
    }

    setError(null);
    setResult(null);
    setProcessing(true);
    setProgress(0);

    try {
      const files = queue.map(f => f.file);

      let output;
      if (isWasm) {
        output = await processWasm(files, config);
      } else {
        // Strip leading '/api/v1/pdf' from endpoint to get the relative path
        const relativePath = tool.endpoint.replace('/api/v1/pdf', '');
        output = await processFiles(relativePath, files, config, setProgress);
      }

      setResult(output);
    } catch (err) {
      const msg =
        err?.response?.data instanceof Blob
          ? await err.response.data.text().then(t => {
              try { return JSON.parse(t).error || t; } catch { return t; }
            })
          : err.message || 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  }, [queue, tool, config, isWasm, processWasm]);

  /** Reset workspace to initial state */
  const handleReset = useCallback(() => {
    clearQueue();
    setResult(null);
    setError(null);
    setProgress(0);
  }, [clearQueue]);

  const hasFiles = queue.length > 0;
  const canProcess = hasFiles && !processing;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex flex-col lg:flex-row">
      <ToolSidebar currentToolId={tool.id} />
      
      <div className="flex-1 min-w-0">
        {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-8">
        <Link to="/" className="hover:text-white/70 transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-white/70">{tool.title}</span>
      </nav>

      {/* ── Tool Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${tool.accent}33, ${tool.accent}66)`,
            border: `1px solid ${tool.accent}44`,
            boxShadow: `0 10px 40px ${tool.accent}33`,
          }}
        >
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display text-white">{tool.title}</h1>
            {tool.badge && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{ color: tool.accent, borderColor: `${tool.accent}44`, background: `${tool.accent}11` }}
              >
                {tool.badge}
              </span>
            )}
            {/* WASM toggle */}
            {tool.wasmEligible && (
              <button
                onClick={toggleWasm}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-all ${
                  isWasm
                    ? 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10'
                    : 'text-white/30 border-white/10 hover:text-white/50'
                }`}
                title={isWasm ? 'Processing in-browser (WASM mode)' : 'Click to enable WASM in-browser processing'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isWasm ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                {isWasm ? 'WASM: On' : 'WASM: Off'}
              </button>
            )}
          </div>
          <p className="text-white/50 text-sm mt-1.5 max-w-xl">{tool.description}</p>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: drop zone + file queue */}
        <div className="lg:col-span-2 space-y-4">
          {!result && (
            <>
              <DropZone
                onFiles={addFiles}
                acceptedFiles={tool.acceptedFiles}
                multiple={tool.multiFile}
                loading={queueLoading}
                tool={tool}
              />

              {hasFiles && (
                <div className="glass rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/60">
                      {queue.length} file{queue.length !== 1 ? 's' : ''} queued
                    </span>
                    <button
                      onClick={clearQueue}
                      className="text-xs text-white/30 hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <FileQueueCanvas
                    queue={queue}
                    onRemove={removeFile}
                    onReorder={reorderFiles}
                  />
                </div>
              )}
            </>
          )}

          {/* Result panel */}
          {result && (
            <div className="glass rounded-2xl p-5">
              <ResultPanel result={result} tool={tool} onReset={handleReset} />
            </div>
          )}
        </div>

        {/* Right column: config + actions */}
        <div className="space-y-4">
          {/* Config panel */}
          {!result && (
            <div className="glass rounded-2xl p-5 space-y-5">
              <ConfigPanel tool={tool} values={config} onChange={handleConfigChange} />

              {/* Error alert */}
              {error && (
                <Alert type="error" message={error} onClose={() => setError(null)} />
              )}

              {/* Progress bar */}
              {processing && (
                <ProgressBar value={progress} label="Uploading…" />
              )}

              {/* Process button */}
              <button
                onClick={handleProcess}
                disabled={!canProcess}
                className={`btn-primary w-full flex items-center justify-center gap-2 ${
                  !canProcess ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Processing…
                  </>
                ) : (
                  <>
                    <span>{tool.icon}</span>
                    {tool.title}
                  </>
                )}
              </button>

              {/* Privacy hint */}
              {isWasm && (
                <p className="text-center text-[10px] text-emerald-400/60 font-medium">
                  🔒 Running in-browser — your file never leaves this device
                </p>
              )}
            </div>
          )}

          {/* Info card */}
          {!result && (
            <div className="glass rounded-2xl p-4 space-y-3 text-xs text-white/35">
              <p className="font-semibold text-white/50 uppercase tracking-wider">How it works</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-docuverve-400 mt-0.5">1.</span>
                  Drop your {tool.multiFile ? 'files' : 'file'} in the upload zone
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-docuverve-400 mt-0.5">2.</span>
                  {tool.configSchema?.length > 0 ? 'Configure options and click process' : 'Click the process button'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-docuverve-400 mt-0.5">3.</span>
                  Download your result instantly
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
