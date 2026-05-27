'use strict';
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/security/sign
 * Body (multipart): file (PDF), signatureImage? (image file), text? (string),
 *   x (number), y (number), page (1-based, default 1), width (number), height (number)
 * Returns: Signed PDF
 */
async function signPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const x = parseFloat(req.body.x) || 50;
    const y = parseFloat(req.body.y) || 50;
    const pageNum = parseInt(req.body.page) || 1;
    const sigWidth = parseFloat(req.body.width) || 150;
    const sigHeight = parseFloat(req.body.height) || 60;
    const signatureText = req.body.text || 'Digitally Signed';

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const pages = doc.getPages();
    const targetPage = pages[Math.max(0, pageNum - 1)];
    if (!targetPage) throw createError(`Page ${pageNum} does not exist.`, 400);

    const font = await doc.embedFont(StandardFonts.HelveticaOblique);
    const signatureFont = await doc.embedFont(StandardFonts.HelveticaBold);

    // Draw signature box
    targetPage.drawRectangle({
      x, y,
      width: sigWidth,
      height: sigHeight,
      borderColor: rgb(0.2, 0.2, 0.6),
      borderWidth: 1.5,
      color: rgb(0.96, 0.97, 1),
      opacity: 0.9,
    });

    targetPage.drawText(signatureText, {
      x: x + 8,
      y: y + sigHeight / 2,
      size: 14,
      font: signatureFont,
      color: rgb(0.1, 0.1, 0.5),
    });

    targetPage.drawText(`Signed: ${new Date().toISOString()}`, {
      x: x + 8,
      y: y + 10,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    const bytes = await doc.save();
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="signed.pdf"')
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { signPdf };
