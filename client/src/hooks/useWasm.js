import { useState, useCallback } from 'react';
import { wasmMerge, wasmSplit, wasmWatermark, wasmRemovePages } from '../lib/wasmProcessors';

/** Map of tool IDs to their WASM processor functions. */
const WASM_PROCESSORS = {
  merge: (files, config) => wasmMerge(files, config.orderIndices || null),
  split: (files, config) => wasmSplit(files[0], config.mode || 'range', config.ranges || ''),
  watermark: (files, config) => wasmWatermark(files[0], config),
  'remove-pages': (files, config) => {
    const indices = config.pageIndices ? JSON.parse(config.pageIndices) : [];
    return wasmRemovePages(files[0], indices);
  },
};

/**
 * Abstraction layer for WASM vs. backend processing.
 * Exposes a toggle so the user can switch between privacy-first WASM
 * and server-side processing for supported tools.
 *
 * @param {string} toolId - Tool identifier (e.g. 'merge', 'split')
 * @param {boolean} wasmEligible - Whether this tool has a WASM implementation
 * @returns {{
 *   isWasm: boolean,
 *   toggleWasm: () => void,
 *   processWasm: (files: File[], config: object) => Promise<{blob?: Blob, results?: object[]}>
 * }}
 */
export function useWasm(toolId, wasmEligible) {
  const [isWasm, setIsWasm] = useState(false);

  /** Toggle WASM mode on/off (only has effect if the tool is wasmEligible). */
  const toggleWasm = useCallback(() => {
    if (wasmEligible) setIsWasm(prev => !prev);
  }, [wasmEligible]);

  /**
   * Process files using the in-browser WASM processor for this tool.
   * @param {File[]} files
   * @param {object} config
   * @returns {Promise<{blob?: Blob, results?: object[]}>}
   */
  const processWasm = useCallback(
    async (files, config) => {
      const processor = WASM_PROCESSORS[toolId];
      if (!processor) {
        throw new Error(`No WASM processor available for tool: ${toolId}`);
      }

      const result = await processor(files, config);

      // Split returns an array of { blob, filename }; others return a single Blob
      if (Array.isArray(result)) {
        return { results: result };
      }
      return { blob: result };
    },
    [toolId],
  );

  return { isWasm: isWasm && wasmEligible, toggleWasm, processWasm };
}
