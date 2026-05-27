'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/convert/pdf-to-pdfa
 * Applies PDF/A-compatible metadata and save flags.
 * Full PDF/A validation (color profiles, embedded fonts) requires iText7 or VeraPDF.
 * Returns: Best-effort PDF/A-compatible document
 */
async function pdfToPdfa(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });

    doc.setTitle(req.file.originalname.replace(/\.pdf$/i, ''));
    doc.setCreator('DocuVerve Intelligence — PDF/A Export');
    doc.setProducer('DocuVerve Intelligence v1.0');
    doc.setCreationDate(new Date());
    doc.setModificationDate(new Date());

    const bytes = await doc.save({ useObjectStreams: false }); // PDF/A requires no object streams
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="output-pdfa.pdf"')
      .set('X-Standard', 'PDF/A-1b (best-effort)')
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { pdfToPdfa };
