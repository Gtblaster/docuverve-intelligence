'use strict';
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/security/compare
 * Body: fileA (PDF), fileB (PDF)
 * Returns: JSON differential layout map
 */
async function comparePdfs(req, res, next) {
  try {
    const fileA = req.files?.fileA?.[0];
    const fileB = req.files?.fileB?.[0];
    if (!fileA || !fileB) throw createError('Both fileA and fileB are required.', 400);

    const [docA, docB] = await Promise.all([
      PDFDocument.load(fileA.buffer, { ignoreEncryption: true }),
      PDFDocument.load(fileB.buffer, { ignoreEncryption: true }),
    ]);
    const [parsedA, parsedB] = await Promise.all([
      pdfParse(fileA.buffer),
      pdfParse(fileB.buffer),
    ]);

    const pagesA = docA.getPages();
    const pagesB = docB.getPages();

    const diff = {
      summary: {
        fileA: { name: fileA.originalname, pages: docA.getPageCount(), size: fileA.size },
        fileB: { name: fileB.originalname, pages: docB.getPageCount(), size: fileB.size },
        pageCountDelta: docB.getPageCount() - docA.getPageCount(),
        sizeDeltaBytes: fileB.size - fileA.size,
        textLengthDelta: parsedB.text.length - parsedA.text.length,
      },
      pageDiffs: [],
    };

    const maxPages = Math.max(pagesA.length, pagesB.length);
    for (let i = 0; i < maxPages; i++) {
      const pageA = pagesA[i];
      const pageB = pagesB[i];
      const pageDiff = { page: i + 1, status: 'compared', changes: [] };

      if (!pageA) {
        pageDiff.status = 'added_in_B';
        pageDiff.changes.push({ type: 'page_added', description: `Page ${i + 1} exists only in fileB` });
      } else if (!pageB) {
        pageDiff.status = 'removed_from_B';
        pageDiff.changes.push({ type: 'page_removed', description: `Page ${i + 1} exists only in fileA` });
      } else {
        const sizeA = pageA.getSize();
        const sizeB = pageB.getSize();
        if (sizeA.width !== sizeB.width || sizeA.height !== sizeB.height) {
          pageDiff.changes.push({
            type: 'size_change',
            from: sizeA,
            to: sizeB,
          });
        } else {
          pageDiff.status = 'unchanged_layout';
        }
      }
      diff.pageDiffs.push(pageDiff);
    }

    res.json({ success: true, differential: diff });
  } catch (err) {
    next(err);
  }
}

module.exports = { comparePdfs };
