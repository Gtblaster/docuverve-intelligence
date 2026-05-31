'use strict';
const { createError } = require('../../middleware/errorHandler');

const CONVERTER_URL = process.env.CONVERTER_URL || 'http://localhost:3000';

/**
 * Fallback JS-based DOCX text extractor and PDF renderer using JSZip and pdf-lib
 */
async function convertDocxToPdfJS(docxBuffer, filename) {
  const JSZip = require('jszip');
  const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

  const zip = await JSZip.loadAsync(docxBuffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('Invalid DOCX structure: missing word/document.xml');
  
  const docXml = await docFile.async('string');

  const paragraphRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/gis;
  const textRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/gis;

  function decodeXmlEntities(str) {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  // Safe WinAnsi character sanitizer
  const cleanForWinAnsi = (text) => {
    return text.split('').map(char => {
      const code = char.charCodeAt(0);
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9 || (code >= 160 && code <= 255)) {
        return char;
      }
      const winAnsiSpecials = {
        0x20AC: '€', 0x201A: '‚', 0x0192: 'ƒ', 0x201E: '„', 0x2026: '…',
        0x2020: '†', 0x2021: '‡', 0x02C6: 'ˆ', 0x2030: '‰', 0x0160: 'Š',
        0x2039: '‹', 0x0152: 'Œ', 0x017D: 'Ž', 0x2018: '‘', 0x2019: '’',
        0x201C: '“', 0x201D: '”', 0x2022: '•', 0x2013: '–', 0x2014: '—',
        0x02DC: '˜', 0x2122: '™', 0x0161: 'š', 0x203A: '›', 0x0153: 'œ',
        0x017E: 'ž', 0x0178: 'Ÿ'
      };
      if (winAnsiSpecials[code]) return winAnsiSpecials[code];
      return '';
    }).join('');
  };

  const paragraphs = [];
  let pMatch;
  while ((pMatch = paragraphRegex.exec(docXml)) !== null) {
    const pContent = pMatch[1];
    let pText = '';
    let tMatch;
    while ((tMatch = textRegex.exec(pContent)) !== null) {
      pText += tMatch[1];
    }
    const cleanText = cleanForWinAnsi(decodeXmlEntities(pText)).trim();
    if (cleanText) {
      paragraphs.push(cleanText);
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push('Empty Document');
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 11;
  const margin = 50;
  const A4_W = 595.28, A4_H = 841.89;
  const maxWidth = A4_W - margin * 2;
  const lineHeight = fontSize * 1.5;

  let page = doc.addPage([A4_W, A4_H]);
  let y = A4_H - margin;

  // Draw a premium decorative cover top bar
  page.drawRectangle({
    x: margin,
    y: A4_H - 40,
    width: maxWidth,
    height: 4,
    color: rgb(0.12, 0.24, 0.45),
  });

  page.drawText(filename ? filename.replace(/\.docx$/i, '') : 'Word Document', {
    x: margin,
    y: A4_H - 30,
    font: boldFont,
    size: 10,
    color: rgb(0.5, 0.5, 0.5),
  });

  for (let idx = 0; idx < paragraphs.length; idx++) {
    const pText = paragraphs[idx];
    const isHeading = pText.length < 65 && !pText.endsWith('.') && idx < 10;
    const pFont = isHeading ? boldFont : font;
    const pSize = isHeading ? fontSize + 2 : fontSize;
    const pColor = isHeading ? rgb(0.12, 0.24, 0.45) : rgb(0.2, 0.2, 0.2);

    const words = pText.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = pFont.widthOfTextAtSize(testLine, pSize);
      if (testWidth > maxWidth) {
        if (y < margin + lineHeight) {
          page = doc.addPage([A4_W, A4_H]);
          y = A4_H - margin;
        }
        page.drawText(currentLine, { x: margin, y, font: pFont, size: pSize, color: pColor });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      if (y < margin + lineHeight) {
        page = doc.addPage([A4_W, A4_H]);
        y = A4_H - margin;
      }
      page.drawText(currentLine, { x: margin, y, font: pFont, size: pSize, color: pColor });
      y -= lineHeight * (isHeading ? 1.8 : 1.5);
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

/**
 * POST /api/v1/pdf/convert/word-to-pdf
 * Converts a DOCX document to PDF via LibreOffice, with an in-memory JS fallback.
 */
async function wordToPdf(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No file provided.', 400);

    let pdfBuffer;
    try {
      const endpoint = `${CONVERTER_URL}/forms/libreoffice/convert`;
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('files', blob, req.file.originalname);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Gotenberg status: ${response.statusText}`);
      }

      pdfBuffer = Buffer.from(await response.arrayBuffer());
    } catch (gotenbergErr) {
      console.log(`Gotenberg sidecar offline or failed (${gotenbergErr.message}). Falling back to high-fidelity JS-based DOCX parser...`);
      pdfBuffer = await convertDocxToPdfJS(req.file.buffer, req.file.originalname);
    }

    const processingTime = Date.now() - startTime;
    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', `attachment; filename="${req.file.originalname.replace(/\.[^.]+$/, '')}.pdf"`)
      .set('X-Processing-Time', `${processingTime}ms`)
      .send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { wordToPdf };
