'use strict';
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/security/watermark
 * Body: file (PDF), text (string), opacity (0-1), fontSize (number), position ("center"|"diagonal"|"top"|"bottom")
 * Returns: Watermarked PDF
 */
async function watermarkPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const text = req.body.text || 'CONFIDENTIAL';
    const opacity = parseFloat(req.body.opacity) || 0.15;
    const fontSize = parseInt(req.body.fontSize) || 48;
    const position = req.body.position || 'diagonal';

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x, y, rotation;
      switch (position) {
        case 'diagonal':
          x = (width - textWidth) / 2;
          y = height / 2 - fontSize / 2;
          rotation = degrees(45);
          break;
        case 'top':
          x = (width - textWidth) / 2;
          y = height - 80;
          rotation = degrees(0);
          break;
        case 'bottom':
          x = (width - textWidth) / 2;
          y = 40;
          rotation = degrees(0);
          break;
        default:
          x = (width - textWidth) / 2;
          y = height / 2;
          rotation = degrees(0);
      }

      page.drawText(text, {
        x, y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
        rotate: rotation,
      });
    }

    const bytes = await doc.save();
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="watermarked.pdf"')
      .set('X-Watermark-Text', encodeURIComponent(text))
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { watermarkPdf };
