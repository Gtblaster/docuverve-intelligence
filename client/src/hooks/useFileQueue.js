import { useState, useCallback } from 'react';

/**
 * Reads the page count from a PDF file using pdf-lib (lazy import).
 * @param {File} file
 * @returns {Promise<number|null>}
 */
async function getPageCount(file) {
  try {
    if (file.type !== 'application/pdf') return null;
    const { PDFDocument } = await import('pdf-lib');
    const buffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch (_) {
    return null;
  }
}

/**
 * Manages the file queue for the workspace.
 * Each queue item has shape: { id, file, name, size, pageCount, status }
 *
 * @returns {{
 *   queue: object[],
 *   loading: boolean,
 *   addFiles: (files: File[]) => Promise<void>,
 *   removeFile: (id: string) => void,
 *   reorderFiles: (fromIndex: number, toIndex: number) => void,
 *   clearQueue: () => void,
 *   updateStatus: (id: string, status: string) => void
 * }}
 */
export function useFileQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  /** Add new files to the queue, skipping duplicates by name+size. */
  const addFiles = useCallback(async (newFiles) => {
    setLoading(true);
    const enriched = await Promise.all(
      newFiles.map(async (file) => {
        const pageCount = await getPageCount(file);
        return {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          pageCount,
          status: 'queued',
        };
      }),
    );

    setQueue(prev => {
      const existingKeys = new Set(prev.map(f => f.name + f.size));
      const fresh = enriched.filter(f => !existingKeys.has(f.name + f.size));
      return [...prev, ...fresh];
    });
    setLoading(false);
  }, []);

  /** Remove a file from the queue by its ID. */
  const removeFile = useCallback((id) => {
    setQueue(prev => prev.filter(f => f.id !== id));
  }, []);

  /** Reorder the queue by moving an item from one index to another. */
  const reorderFiles = useCallback((fromIndex, toIndex) => {
    setQueue(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  /** Clear all files from the queue. */
  const clearQueue = useCallback(() => setQueue([]), []);

  /** Update the status of a specific file item. */
  const updateStatus = useCallback((id, status) => {
    setQueue(prev => prev.map(f => (f.id === id ? { ...f, status } : f)));
  }, []);

  return { queue, loading, addFiles, removeFile, reorderFiles, clearQueue, updateStatus };
}
