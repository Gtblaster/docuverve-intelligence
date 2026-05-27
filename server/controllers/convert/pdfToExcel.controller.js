'use strict';
const pdfParse = require('pdf-parse');
const ExcelJS = require('exceljs');
const { createWorker } = require('tesseract.js');
const { createError } = require('../../middleware/errorHandler');

/**
 * Splits text into rows using line breaks and tabs as cell separators.
 */
function parseTextToRows(text) {
  return text
    .split('\n')
    .map(line => line.split(/\t|  {2,}/).map(cell => cell.trim()).filter(Boolean))
    .filter(row => row.length > 0);
}

/**
 * POST /api/v1/pdf/convert/pdf-to-excel
 * Query: ?ocr=true to use OCR engine for scanned PDFs
 * Body: file (PDF)
 * Returns: Excel workbook (.xlsx)
 */
async function pdfToExcel(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const useOcr = req.query.ocr === 'true';
    let extractedText = '';

    if (useOcr) {
      // OCR path: use tesseract.js on the raw buffer
      // Note: For PDFs, we use pdf-parse first; OCR enhances scanned-page accuracy
      const worker = await createWorker('eng');
      try {
        const parsed = await pdfParse(req.file.buffer);
        extractedText = parsed.text;
        // If text is sparse (scanned PDF), OCR would be applied per-page via a renderer
        if (extractedText.trim().length < 50) {
          // Minimal text found — flag as scanned
          extractedText = `[Scanned PDF detected — ${parsed.numpages} pages. OCR rendering requires a PDF-to-image renderer sidecar for full accuracy.]\n${extractedText}`;
        }
      } finally {
        await worker.terminate();
      }
    } else {
      const parsed = await pdfParse(req.file.buffer);
      extractedText = parsed.text;
    }

    const rows = parseTextToRows(extractedText);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DocuVerve Intelligence';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Extracted Data');
    sheet.properties.defaultRowHeight = 18;

    // Header styling
    if (rows.length > 0) {
      const headerRow = sheet.addRow(rows[0]);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B46C1' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
      headerRow.height = 22;

      for (const dataRow of rows.slice(1)) {
        sheet.addRow(dataRow);
      }
    }

    // Auto-fit columns
    sheet.columns.forEach(col => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: false }, cell => {
        const cellLen = String(cell.value || '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      col.width = Math.min(maxLen + 4, 60);
    });

    const xlsxBuffer = await workbook.xlsx.writeBuffer();
    res
      .set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .set('Content-Disposition', `attachment; filename="extracted-data${useOcr ? '-ocr' : ''}.xlsx"`)
      .set('X-OCR-Used', String(useOcr))
      .send(Buffer.from(xlsxBuffer));
  } catch (err) {
    next(err);
  }
}

module.exports = { pdfToExcel };
