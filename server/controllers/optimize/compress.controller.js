'use strict';
const sharp = require('sharp');
const { PDFDocument, PDFName, PDFRawStream, PDFNumber } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

const COMPRESSION_TIERS = {
  low:    { quality: 80, maxDimension: 2048, useObjectStreams: false, objectsPerTick: 50 },
  medium: { quality: 65, maxDimension: 1200, useObjectStreams: true,  objectsPerTick: 20 },
  high:   { quality: 45, maxDimension: 800,  useObjectStreams: true,  objectsPerTick: 5  },
};

/**
 * POST /api/v1/pdf/optimize/compress
 * Body: file (PDF), tier ("low"|"medium"|"high")
 * Returns: Compressed PDF with X-Original-Size and X-Compressed-Size headers
 */
async function compressPdf(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const tier = (req.body.tier || 'medium').toLowerCase();
    const tierConfig = COMPRESSION_TIERS[tier] || COMPRESSION_TIERS.medium;
    const originalSize = req.file.size;

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });

    // Process and compress each image object in the PDF
    const objects = doc.context.enumerateIndirectObjects();
    for (const [ref, pdfObject] of objects) {
      if (!(pdfObject instanceof PDFRawStream)) continue;

      const subtype = pdfObject.dict.get(PDFName.of('Subtype'));
      if (subtype !== PDFName.of('Image')) continue;

      try {
        const rawBytes = pdfObject.contents;
        let img = sharp(rawBytes);
        const metadata = await img.metadata();

        if (metadata && metadata.width && metadata.height) {
          const maxDim = tierConfig.maxDimension;
          let newWidth = metadata.width;
          let newHeight = metadata.height;

          // Resize if width or height exceeds maximum dimension
          if (metadata.width > maxDim || metadata.height > maxDim) {
            if (metadata.width > metadata.height) {
              newWidth = maxDim;
              newHeight = Math.round((metadata.height * maxDim) / metadata.width);
            } else {
              newHeight = maxDim;
              newWidth = Math.round((metadata.width * maxDim) / metadata.height);
            }
            img = img.resize(newWidth, newHeight);
          }

          let compressedBytes;
          if (metadata.hasAlpha) {
            // Compress transparent images as PNG with palette optimization
            compressedBytes = await img
              .png({ compressionLevel: 9, palette: true })
              .toBuffer();
            pdfObject.dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
          } else {
            // Compress other images as MozJPEG
            compressedBytes = await img
              .jpeg({ quality: tierConfig.quality, mozjpeg: true })
              .toBuffer();
            pdfObject.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
          }

          pdfObject.contents = compressedBytes;
          pdfObject.dict.set(PDFName.of('Width'), PDFNumber.of(newWidth));
          pdfObject.dict.set(PDFName.of('Height'), PDFNumber.of(newHeight));
          pdfObject.dict.set(PDFName.of('Length'), PDFNumber.of(compressedBytes.length));
        }
      } catch (err) {
        // Fall back gracefully for unsupported image formats or parsing failures
      }
    }

    const compressedBytes = await doc.save({
      useObjectStreams: tierConfig.useObjectStreams,
      addDefaultPage: false,
      objectsPerTick: tierConfig.objectsPerTick,
    });

    const compressedBuffer = Buffer.from(compressedBytes);
    const compressedSize = compressedBuffer.length;
    const savingsBytes = originalSize - compressedSize;
    const savingsPct = ((savingsBytes / originalSize) * 100).toFixed(1);

    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', `attachment; filename="compressed-${tier}.pdf"`)
      .set('X-Original-Size', String(originalSize))
      .set('X-Compressed-Size', String(compressedSize))
      .set('X-Savings-Bytes', String(savingsBytes))
      .set('X-Savings-Percent', savingsPct)
      .set('X-Compression-Tier', tier)
      .set('X-Processing-Time', `${Date.now() - startTime}ms`)
      .send(compressedBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { compressPdf };
