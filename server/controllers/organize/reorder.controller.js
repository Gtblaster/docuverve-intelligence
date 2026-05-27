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
      try {
        newOrder = JSON.parse(req.body.newOrder);
      } catch (_) {
        throw createError('newOrder must be a valid JSON array.', 400);
      }
    }

    const srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    if (newOrder.length !== totalPages) {
      throw createError(`newOrder must contain exactly ${totalPages} indices.`, 400);
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
