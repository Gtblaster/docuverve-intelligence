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
      try {
        pagesToRemove = JSON.parse(req.body.pageIndices).map(n => n - 1); // convert to 0-based
      } catch (_) {
        throw createError('pageIndices must be a valid JSON array of page numbers.', 400);
      }
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
