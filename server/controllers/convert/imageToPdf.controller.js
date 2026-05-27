'use strict';
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/convert/image-to-pdf
 * Body: file (image: jpg, png, webp, tiff)
 * Returns: Single-page PDF embedding the image
 */
async function imageToPdf(req, res, next) {
  try {
    if (!req.file) throw createError('No image file provided.', 400);

    const mime = req.file.mimetype;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/gif'];
    if (!validTypes.includes(mime)) {
      throw createError(`Unsupported image type: ${mime}. Accepted: JPEG, PNG, WebP, TIFF, GIF.`, 415);
    }

    // Normalize to PNG for pdf-lib compatibility
    const pngBuffer = await sharp(req.file.buffer)
      .png({ compressionLevel: 6 })
      .toBuffer();

    const meta = await sharp(req.file.buffer).metadata();
    const imgWidth = meta.width || 595;
    const imgHeight = meta.height || 842;

    const doc = await PDFDocument.create();
    const pngImage = await doc.embedPng(pngBuffer);

    // Scale image to A4 proportions if needed
    const A4_W = 595.28, A4_H = 841.89;
    const scale = Math.min(A4_W / imgWidth, A4_H / imgHeight, 1);
    const scaledW = imgWidth * scale;
    const scaledH = imgHeight * scale;

    const page = doc.addPage([A4_W, A4_H]);
    page.drawImage(pngImage, {
      x: (A4_W - scaledW) / 2,
      y: (A4_H - scaledH) / 2,
      width: scaledW,
      height: scaledH,
    });

    const bytes = await doc.save();
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', `attachment; filename="${req.file.originalname.replace(/\.[^.]+$/, '')}.pdf"`)
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { imageToPdf };
