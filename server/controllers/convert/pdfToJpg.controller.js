'use strict';
const archiver = require('archiver');
const pdfParse = require('pdf-parse');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/convert/pdf-to-jpg
 * Note: Full rasterization requires a headless renderer (e.g., Puppeteer + pdf.js or
 * Ghostscript). This endpoint provides metadata extraction and a structured response.
 * A placeholder ZIP with page info is returned. For full production rendering,
 * mount a Puppeteer or Ghostscript sidecar service.
 * Returns: ZIP with page metadata JSON + status note
 */
async function pdfToJpg(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const parsed = await pdfParse(req.file.buffer);
    const pageCount = parsed.numpages;

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="pdf-pages-info.zip"');

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => next(err));
    archive.pipe(res);

    const manifest = {
      filename: req.file.originalname,
      pageCount,
      note: 'Full JPG rendering requires a Puppeteer/Ghostscript sidecar. This response contains the page manifest.',
      pages: Array.from({ length: pageCount }, (_, i) => ({ pageNumber: i + 1, status: 'pending_render' })),
    };

    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
    await archive.finalize();
  } catch (err) {
    next(err);
  }
}

module.exports = { pdfToJpg };
