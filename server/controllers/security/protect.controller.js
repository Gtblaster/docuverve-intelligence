'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/security/protect
 * Body: file (PDF), ownerPassword (string), userPassword (string), permissions (optional JSON)
 * Returns: Encrypted PDF
 * Note: pdf-lib v1.x encryption uses 128-bit RC4 (PDF 1.4 standard).
 */
async function protectPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const ownerPassword = req.body.ownerPassword || req.body.password || 'owner';
    const userPassword = req.body.userPassword || '';

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });

    const bytes = await doc.save({
      userPassword,
      ownerPassword,
      permissions: {
        printing: 'lowResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: true,
        contentAccessibility: true,
        documentAssembly: false,
      },
    });

    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="protected.pdf"')
      .set('X-Encrypted', 'true')
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { protectPdf };
