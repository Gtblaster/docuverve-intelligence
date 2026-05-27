'use strict';
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/convert/excel-to-pdf
 * Note: Full XLSX→PDF rendering requires LibreOffice or Microsoft Excel COM.
 * This stub returns a structured 501 with integration instructions.
 */
async function excelToPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No file provided.', 400);
    return res.status(501).json({
      success: false,
      error: 'XLSX→PDF conversion requires a LibreOffice sidecar or cloud API integration.',
      endpoint: '/api/v1/pdf/convert/excel-to-pdf',
      integration: 'Mount a LibreOffice sidecar and pipe the buffer through soffice CLI.',
      file: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { excelToPdf };
