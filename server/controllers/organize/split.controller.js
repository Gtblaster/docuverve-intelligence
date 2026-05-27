'use strict';
const { PDFDocument } = require('pdf-lib');
const archiver = require('archiver');
const { createError } = require('../../middleware/errorHandler');

/**
 * Parses a range string like "1-3,5,7-9" into 0-based page indices.
 */
function parsePageRanges(rangeStr, totalPages) {
  const indices = new Set();
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      if (isNaN(a) || isNaN(b) || a < 1 || b > totalPages || a > b) {
        throw createError(`Invalid range "${part}". Pages must be between 1 and ${totalPages}.`, 400);
      }
      for (let i = a; i <= b; i++) indices.add(i - 1);
    } else {
      const n = Number(part);
      if (isNaN(n) || n < 1 || n > totalPages) {
        throw createError(`Invalid page number "${part}". Must be between 1 and ${totalPages}.`, 400);
      }
      indices.add(n - 1);
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * POST /api/v1/pdf/organize/split
 * Body: file (PDF), ranges (string, e.g. "1-3,5"), mode ("range"|"all")
 * Returns: ZIP archive containing split PDFs
 */
async function splitPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();
    const mode = req.body.mode || 'range';

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="split-pages.zip"');

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => next(err));
    archive.pipe(res);

    if (mode === 'all') {
      for (let i = 0; i < totalPages; i++) {
        const doc = await PDFDocument.create();
        const [page] = await doc.copyPages(srcDoc, [i]);
        doc.addPage(page);
        const bytes = await doc.save();
        archive.append(Buffer.from(bytes), { name: `page-${i + 1}.pdf` });
      }
    } else {
      const rangeStr = req.body.ranges || `1-${totalPages}`;
      const indices = parsePageRanges(rangeStr, totalPages);
      if (indices.length === 0) throw createError('No valid pages selected.', 400);

      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(srcDoc, indices);
      pages.forEach(p => doc.addPage(p));
      const bytes = await doc.save();
      archive.append(Buffer.from(bytes), { name: 'split-result.pdf' });
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
}

module.exports = { splitPdf };
