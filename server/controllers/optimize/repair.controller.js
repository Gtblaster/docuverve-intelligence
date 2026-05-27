'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/optimize/repair
 * Body: file (PDF — possibly corrupted)
 * Strategy: Load with ignoreEncryption + capnp recovery flags, then re-serialize
 * to rebuild cross-reference tables (XREFs).
 * Returns: Repaired PDF
 */
async function repairPdf(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    let doc;
    try {
      doc = await PDFDocument.load(req.file.buffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false,
        capnp: false,
      });
    } catch (loadErr) {
      throw createError(
        `Could not parse PDF structure: ${loadErr.message}. The file may be severely corrupted.`,
        422,
      );
    }

    // Re-serializing rebuilds the XREF table and cleans object streams
    const repairedBytes = await doc.save({ useObjectStreams: true });
    const repairedBuffer = Buffer.from(repairedBytes);

    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="repaired.pdf"')
      .set('X-Page-Count', String(doc.getPageCount()))
      .set('X-Processing-Time', `${Date.now() - startTime}ms`)
      .send(repairedBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { repairPdf };
