'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/organize/reorder
 * Body: file (PDF), newOrder (JSON array of 0-based indices representing the new page sequence)
 * Returns: Reordered PDF
 */
async function reorderPages(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    let newOrder = [];
    if (req.body.newOrder) {
      let rawInput = String(req.body.newOrder).trim();
      
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

      // Parse comma-separated values and ranges (1-based to 0-based)
      const indices = [];
      const parts = rawInput.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [aStr, bStr] = part.split('-');
          const a = Number(aStr.trim());
          const b = Number(bStr.trim());
          if (!isNaN(a) && !isNaN(b) && a > 0 && b >= a) {
            for (let i = a; i <= b; i++) {
              indices.push(i - 1); // convert to 0-based
            }
          } else {
            throw createError(`Invalid page range: ${part}`, 400);
          }
        } else {
          const n = Number(part);
          if (!isNaN(n) && n > 0) {
            indices.push(n - 1); // convert to 0-based
          } else {
            throw createError(`Invalid page number: ${part}`, 400);
          }
        }
      }
      newOrder = indices;
    }

    const srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    if (newOrder.length !== totalPages) {
      throw createError(`newOrder must contain exactly ${totalPages} page numbers.`, 400);
    }

    for (const idx of newOrder) {
      if (idx < 0 || idx >= totalPages) {
        throw createError(`Page number out of bounds. Must be between 1 and ${totalPages}.`, 400);
      }
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, newOrder);
    copiedPages.forEach(p => newDoc.addPage(p));

    const bytes = await newDoc.save();
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="reordered.pdf"')
      .set('X-Page-Count', String(newDoc.getPageCount()))
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { reorderPages };
