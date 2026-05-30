'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/organize/remove-pages
 * Body: file (PDF), pageIndices (JSON array of 1-based page numbers to remove)
 * Returns: PDF with specified pages removed
 */
async function removePages(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    let pagesToRemove = [];
    if (req.body.pageIndices) {
      let rawInput = String(req.body.pageIndices).trim();
      
      // Attempt to parse if it's a JSON array format (e.g. [1, 2, 3])
      if (rawInput.startsWith('[') && rawInput.endsWith(']')) {
        try {
          const parsed = JSON.parse(rawInput);
          if (Array.isArray(parsed)) {
            rawInput = parsed.join(',');
          }
        } catch (_) {
          // Fall back to treating it as raw string
        }
      }

      // Parse comma-separated values and ranges
      const indices = new Set();
      const parts = rawInput.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [aStr, bStr] = part.split('-');
          const a = Number(aStr.trim());
          const b = Number(bStr.trim());
          if (!isNaN(a) && !isNaN(b) && a > 0 && b >= a) {
            for (let i = a; i <= b; i++) {
              indices.add(i - 1); // convert to 0-based
            }
          } else {
            throw createError(`Invalid page range: ${part}`, 400);
          }
        } else {
          const n = Number(part);
          if (!isNaN(n) && n > 0) {
            indices.add(n - 1); // convert to 0-based
          } else {
            throw createError(`Invalid page number: ${part}`, 400);
          }
        }
      }
      pagesToRemove = Array.from(indices);
    }

    const srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    const keepIndices = Array.from({ length: totalPages }, (_, i) => i)
      .filter(i => !pagesToRemove.includes(i));

    if (keepIndices.length === 0) throw createError('Cannot remove all pages from a PDF.', 400);

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, keepIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    const bytes = await newDoc.save();
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="pages-removed.pdf"')
      .set('X-Page-Count', String(newDoc.getPageCount()))
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { removePages };
