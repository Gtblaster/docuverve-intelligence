'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/security/unlock
 * Body: file (PDF), password (string)
 * Returns: Decrypted PDF with no permission flags
 */
async function unlockPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const password = req.body.password || '';

    let doc;
    try {
      doc = await PDFDocument.load(req.file.buffer, {
        ignoreEncryption: true,
        password,
      });
    } catch (e) {
      throw createError('Failed to unlock PDF. The password may be incorrect.', 401);
    }

    // Re-save without any encryption
    const bytes = await doc.save({ userPassword: undefined, ownerPassword: undefined });
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="unlocked.pdf"')
      .set('X-Encrypted', 'false')
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { unlockPdf };
