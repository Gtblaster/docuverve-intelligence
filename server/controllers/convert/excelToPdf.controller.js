'use strict';
const { createError } = require('../../middleware/errorHandler');

const CONVERTER_URL = process.env.CONVERTER_URL || 'http://localhost:3000';

/**
 * POST /api/v1/pdf/convert/excel-to-pdf
 * Converts a spreadsheet document (XLSX, XLS) to PDF via the Gotenberg LibreOffice sidecar service.
 */
async function excelToPdf(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No file provided.', 400);

    const endpoint = `${CONVERTER_URL}/forms/libreoffice/convert`;

    // Construct FormData natively in Node 20
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('files', blob, req.file.originalname);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errMsg = await response.text();
      throw createError(`Gotenberg conversion failed: ${errMsg || response.statusText}`, 502);
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    const processingTime = Date.now() - startTime;

    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', `attachment; filename="${req.file.originalname.replace(/\.[^.]+$/, '')}.pdf"`)
      .set('X-Processing-Time', `${processingTime}ms`)
      .send(pdfBuffer);
  } catch (err) {
    if (err.message.includes('fetch failed') || err.code === 'ECONNREFUSED') {
      return next(createError(
        `Gotenberg conversion sidecar is offline at ${CONVERTER_URL}. Please start your Docker container network (docker compose up -d) or ensure Gotenberg is running on this port to enable high-fidelity document conversion.`,
        503
      ));
    }
    next(err);
  }
}

module.exports = { excelToPdf };

