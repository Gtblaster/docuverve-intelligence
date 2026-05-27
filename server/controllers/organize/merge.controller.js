'use strict';
const { PDFDocument } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/organize/merge
 * Body: multipart/form-data — files[] (2-20 PDFs), orderIndices[] (optional JSON array)
 * Returns: merged PDF as application/pdf stream
 */
async function mergePdfs(req, res, next) {
  const startTime = Date.now();
  try {
    const files = req.files;
    if (!files || files.length < 2) {
      throw createError('At least 2 PDF files are required for merging.', 400);
    }

    // Parse optional index ordering array
    let order = files.map((_, i) => i);
    if (req.body.orderIndices) {
      try {
        const parsed = JSON.parse(req.body.orderIndices);
        if (Array.isArray(parsed) && parsed.length === files.length) {
          order = parsed;
        }
      } catch (_) { /* use default order */ }
    }

    const mergedDoc = await PDFDocument.create();

    for (const idx of order) {
      const file = files[idx];
      if (!file) throw createError(`Invalid order index: ${idx}`, 400);

      let srcDoc;
      try {
        srcDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      } catch (e) {
        throw createError(`Could not parse "${file.originalname}": ${e.message}`, 422);
      }

      const pageIndices = srcDoc.getPageIndices();
      const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach(p => mergedDoc.addPage(p));
    }

    const mergedBytes = await mergedDoc.save();
    const processingTime = Date.now() - startTime;

    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="merged.pdf"')
      .set('X-Processing-Time', `${processingTime}ms`)
      .set('X-Page-Count', String(mergedDoc.getPageCount()))
      .send(Buffer.from(mergedBytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { mergePdfs };
