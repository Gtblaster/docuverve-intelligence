'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/organize/extract-pages
 * Body: file (PDF), pageIndices (JSON array of 1-based page numbers to keep)
 * Returns: PDF containing only the specified pages
 */
async function extractPages(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    let extractIndices = [];
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
      extractIndices = Array.from(indices);
    }

    const srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    const validIndices = extractIndices.filter(i => i >= 0 && i < totalPages);
    if (validIndices.length === 0) throw createError('No valid page indices provided.', 400);

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    const bytes = await newDoc.save();
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="extracted-pages.pdf"')
      .set('X-Page-Count', String(newDoc.getPageCount()))
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { extractPages };
