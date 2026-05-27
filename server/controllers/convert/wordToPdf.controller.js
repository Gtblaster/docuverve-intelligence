'use strict';
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/convert/word-to-pdf
 * Note: Full DOCX→PDF rendering requires LibreOffice or Microsoft Word COM.
 * This stub returns a structured 501 with integration instructions.
 */
async function wordToPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No file provided.', 400);
    return res.status(501).json({
      success: false,
      error: 'DOCX→PDF conversion requires a LibreOffice sidecar or cloud API integration.',
      endpoint: '/api/v1/pdf/convert/word-to-pdf',
      integration: 'Mount a LibreOffice sidecar container and pipe the in-memory buffer through `soffice --convert-to pdf --outdir /tmp`.',
      file: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { wordToPdf };
