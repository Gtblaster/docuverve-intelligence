import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

/**
 * WASM Merge — runs entirely in the browser using pdf-lib.
 * Combines multiple PDF files in the specified order.
 * @param {File[]} files - PDF files to merge
 * @param {number[]|null} orderIndices - Optional reorder array (indices into files[])
 * @returns {Promise<Blob>} Merged PDF as a Blob
 */
export async function wasmMerge(files, orderIndices = null) {
  const order = orderIndices || files.map((_, i) => i);
  const mergedDoc = await PDFDocument.create();

  for (const idx of order) {
    const file = files[idx];
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach(p => mergedDoc.addPage(p));
  }

  const bytes = await mergedDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * WASM Split — runs entirely in the browser using pdf-lib.
 * Splits a PDF by range string or into individual pages.
 * @param {File} file - Source PDF file
 * @param {'range'|'all'} mode - Split mode
 * @param {string} ranges - Page range string e.g. "1-3, 5, 7-9"
 * @returns {Promise<{blob: Blob, filename: string}[]>} Array of split PDF blobs
 */
export async function wasmSplit(file, mode = 'range', ranges = '') {
  const buffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const results = [];

  if (mode === 'all') {
    for (let i = 0; i < totalPages; i++) {
      const doc = await PDFDocument.create();
      const [page] = await doc.copyPages(srcDoc, [i]);
      doc.addPage(page);
      const bytes = await doc.save();
      results.push({
        blob: new Blob([bytes], { type: 'application/pdf' }),
        filename: `page-${i + 1}.pdf`,
      });
    }
  } else {
    const indices = parseRanges(ranges, totalPages);
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(srcDoc, indices);
    pages.forEach(p => doc.addPage(p));
    const bytes = await doc.save();
    results.push({
      blob: new Blob([bytes], { type: 'application/pdf' }),
      filename: 'split-result.pdf',
    });
  }

  return results;
}

/**
 * WASM Watermark — runs entirely in the browser using pdf-lib.
 * Stamps a text watermark on every page of the PDF.
 * @param {File} file - Source PDF file
 * @param {object} options - Watermark options
 * @param {string} [options.text='CONFIDENTIAL'] - Watermark text
 * @param {number} [options.opacity=0.15] - Text opacity (0–1)
 * @param {number} [options.fontSize=48] - Font size in points
 * @param {'diagonal'|'center'|'top'|'bottom'} [options.position='diagonal'] - Position preset
 * @returns {Promise<Blob>} Watermarked PDF as a Blob
 */
export async function wasmWatermark(
  file,
  { text = 'CONFIDENTIAL', opacity = 0.15, fontSize = 48, position = 'diagonal' } = {},
) {
  const buffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    let x = (width - textWidth) / 2;
    let y = height / 2;
    let rotation = degrees(0);

    if (position === 'diagonal') {
      rotation = degrees(45);
    } else if (position === 'top') {
      y = height - 80;
    } else if (position === 'bottom') {
      y = 40;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: rotation,
    });
  }

  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * WASM Remove Pages — runs entirely in the browser using pdf-lib.
 * Removes specified pages (1-indexed) from the PDF.
 * @param {File} file - Source PDF file
 * @param {number[]} pageIndices - 1-indexed page numbers to remove
 * @returns {Promise<Blob>} Modified PDF as a Blob
 */
export async function wasmRemovePages(file, pageIndices = []) {
  const buffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  // Convert 1-indexed to 0-indexed, then compute which pages to keep
  const zeroIdx = pageIndices.map(n => n - 1);
  const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
    i => !zeroIdx.includes(i),
  );

  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, keepIndices);
  pages.forEach(p => newDoc.addPage(p));
  const bytes = await newDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// ── Internal helper ──────────────────────────────────────────────────────────

/**
 * Parses a human-readable range string into a sorted array of 0-indexed page numbers.
 * @param {string} str - e.g. "1-3, 5, 7-9"
 * @param {number} max - Total pages (upper bound)
 * @returns {number[]} Sorted 0-indexed page indices
 */
function parseRanges(str, max) {
  const indices = new Set();
  str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(part => {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        for (let i = Math.max(1, a); i <= Math.min(max, b); i++) {
          indices.add(i - 1);
        }
      } else {
        const n = Number(part);
        if (n >= 1 && n <= max) indices.add(n - 1);
      }
    });
  return Array.from(indices).sort((a, b) => a - b);
}
