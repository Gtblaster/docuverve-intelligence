'use strict';
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/convert/html-to-pdf
 * Body: html (string in req.body) OR file (HTML file)
 * For full rendering, Puppeteer is recommended. This provides a text-extraction fallback.
 */
async function htmlToPdf(req, res, next) {
  try {
    const htmlContent = req.body.html || (req.file ? req.file.buffer.toString('utf8') : null);
    if (!htmlContent) throw createError('No HTML content provided. Send `html` in body or upload an HTML file.', 400);

    // Strip HTML tags to extract text
    const textContent = htmlContent
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const margin = 50;
    const A4_W = 595.28, A4_H = 841.89;
    const maxWidth = A4_W - margin * 2;
    const lineHeight = fontSize * 1.5;

    const words = textContent.split(' ');
    let lines = [], currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    let page = doc.addPage([A4_W, A4_H]);
    let y = A4_H - margin;

    for (const line of lines) {
      if (y < margin + lineHeight) {
        page = doc.addPage([A4_W, A4_H]);
        y = A4_H - margin;
      }
      page.drawText(line, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }

    const bytes = await doc.save();
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', 'attachment; filename="html-converted.pdf"')
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { htmlToPdf };
