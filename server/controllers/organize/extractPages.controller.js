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
      try {
        extractIndices = JSON.parse(req.body.pageIndices).map(n => n - 1);
      } catch (_) {
        throw createError('pageIndices must be a valid JSON array of page numbers.', 400);
      }
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
