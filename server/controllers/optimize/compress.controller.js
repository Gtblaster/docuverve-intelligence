'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

const COMPRESSION_TIERS = {
  low:    { objectsPerTick: 50,  useObjectStreams: false },
  medium: { objectsPerTick: 20,  useObjectStreams: true  },
  high:   { objectsPerTick: 5,   useObjectStreams: true  },
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
