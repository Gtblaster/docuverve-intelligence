import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Spinner from '../ui/Spinner';

/**
 * Drag-and-drop file upload zone.
 * @param {(files: File[]) => void} onFiles - Callback when files are dropped/selected
 * @param {object} acceptedFiles - react-dropzone accept map
 * @param {boolean} multiple - Allow multiple files
 * @param {boolean} loading - Show loading state
 * @param {object} tool - Tool definition (for icon and accent color)
 */
export default function DropZone({ onFiles, acceptedFiles, multiple = true, loading = false, tool }) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (accepted) => {
      setDragActive(false);
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFiles,
    multiple,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const isActive = isDragActive || dragActive;

  return (
    <div
      {...getRootProps()}
      className={`drop-zone p-10 flex flex-col items-center justify-center gap-5 text-center min-h-[220px] ${
        isActive ? 'active' : ''
      } ${loading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input {...getInputProps()} />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-docuverve-400" />
          <p className="text-sm text-white/50">Reading file metadata…</p>
        </div>
      ) : (
        <>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-2xl transition-transform duration-300"
            style={{
              background: `linear-gradient(135deg, ${tool?.accent || '#6060ef'}33, ${tool?.accent || '#6060ef'}66)`,
              border: `1px solid ${tool?.accent || '#6060ef'}44`,
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {isActive ? '📂' : (tool?.icon || '📄')}
          </div>

          <div>
            <p className="text-white font-semibold text-lg">
              {isActive ? 'Drop your files here' : `Drop ${multiple ? 'files' : 'a file'} here`}
            </p>
            <p className="text-white/40 text-sm mt-1.5">
              or <span className="text-docuverve-400 font-medium">click to browse</span>
              {multiple && ' · multiple files supported'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/25">
            <span className="w-1 h-1 rounded-full bg-emerald-400/60" />
            Files processed in-memory · Privacy protected
          </div>
        </>
      )}
    </div>
  );
}
