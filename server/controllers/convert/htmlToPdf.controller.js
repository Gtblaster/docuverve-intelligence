'use strict';
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { createError } = require('../../middleware/errorHandler');

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
    if (code === 0x26a0) return '[!]';
    return '';
  }).join('');
};

/**
 * Generates a clean PDF containing the raw HTML code formatted like an IDE.
 */
async function generateCodePdf(htmlContent, filename) {
  const doc = await PDFDocument.create();
  const courierFont = await doc.embedFont(StandardFonts.Courier);
  const helveticaFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 9.5;
  const A4_W = 595.28, A4_H = 841.89;
  const linesPerPage = 48;
  
  const rawLines = htmlContent.split(/\r?\n/);
  const lines = [];
  const maxChars = 78;
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    if (line.length === 0) {
      lines.push({ num: i + 1, text: '' });
    } else {
      let isFirstChunk = true;
      while (line.length > 0) {
        const chunk = line.substring(0, maxChars);
        lines.push({ num: isFirstChunk ? i + 1 : '', text: chunk });
        line = line.substring(maxChars);
        isFirstChunk = false;
      }
    }
  }

  const totalPages = Math.ceil(lines.length / linesPerPage) || 1;

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const page = doc.addPage([A4_W, A4_H]);
    const { width, height } = page.getSize();
    
    // Draw Dark Theme Editor Background
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      color: rgb(0.08, 0.09, 0.12),
      borderColor: rgb(0.18, 0.20, 0.25),
      borderWidth: 1.5,
    });

    // Draw Editor Window controls (Mac style)
    const headerY = height - 45;
    page.drawCircle({ x: 40, y: headerY, size: 5, color: rgb(0.95, 0.35, 0.35) });
    page.drawCircle({ x: 55, y: headerY, size: 5, color: rgb(0.95, 0.75, 0.25) });
    page.drawCircle({ x: 70, y: headerY, size: 5, color: rgb(0.35, 0.75, 0.35) });

    page.drawText(filename || 'source.html', {
      x: 95,
      y: headerY - 3,
      font: helveticaFont,
      size: 9,
      color: rgb(0.5, 0.6, 0.7),
    });

    page.drawLine({
      start: { x: 20, y: headerY - 15 },
      end: { x: width - 20, y: headerY - 15 },
      color: rgb(0.18, 0.20, 0.25),
      thickness: 1,
    });

    // Draw line numbers column background
    page.drawRectangle({
      x: 21,
      y: 21,
      width: 40,
      height: headerY - 36,
      color: rgb(0.12, 0.13, 0.17),
    });

    const startIdx = pageNum * linesPerPage;
    const endIdx = Math.min(startIdx + linesPerPage, lines.length);
    let currentY = headerY - 35;

    for (let idx = startIdx; idx < endIdx; idx++) {
      const lineItem = lines[idx];

      if (lineItem.num) {
        page.drawText(String(lineItem.num).padStart(4, ' '), {
          x: 25,
          y: currentY,
          font: courierFont,
          size: fontSize - 1,
          color: rgb(0.3, 0.4, 0.5),
        });
      }

      page.drawText(cleanForWinAnsi(lineItem.text), {
        x: 75,
        y: currentY,
        font: courierFont,
        size: fontSize,
        color: rgb(0.85, 0.88, 0.95),
      });

      currentY -= fontSize * 1.5;
    }
  }

  return await doc.save();
}

/**
 * Generates a visual, structured mockup representing the HTML elements running inside a browser.
 */
async function generateGuiPdf(htmlContent, filename) {
  const doc = await PDFDocument.create();
  const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const A4_W = 595.28, A4_H = 841.89;
  
  let title = 'Web Page';
  const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  } else if (filename) {
    title = filename.replace(/\.html?$/i, '').replace(/[-_]/g, ' ');
  }

  const cleanHtml = htmlContent
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '');

  const elements = [];
  const tableRegex = /<table[^>]*>(.*?)<\/table>/gis;
  let tableMatch;
  const tablePlaceholder = '___TABLE_PLACEHOLDER_';
  let cleanWithPlaceholders = cleanHtml;
  const tables = [];
  
  while ((tableMatch = tableRegex.exec(cleanHtml)) !== null) {
    const tableHtml = tableMatch[1];
    const rows = [];
    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowContent = rowMatch[1];
      const cells = [];
      const thRegex = /<th[^>]*>(.*?)<\/th>/gis;
      let thMatch;
      while ((thMatch = thRegex.exec(rowContent)) !== null) {
        cells.push({ text: stripTags(thMatch[1]), isHeader: true });
      }
      const tdRegex = /<td[^>]*>(.*?)<\/td>/gis;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        cells.push({ text: stripTags(tdMatch[1]), isHeader: false });
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    if (rows.length > 0) {
      tables.push(rows);
      cleanWithPlaceholders = cleanWithPlaceholders.replace(tableMatch[0], ` ${tablePlaceholder}${tables.length - 1} `);
    }
  }

  function stripTags(str) {
    return str
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const rawLines = cleanWithPlaceholders.split(/<h[1-6][^>]*>|<p[^>]*>|<li[^>]*>|<\/h[1-6]>|<\/p>|<\/li>|<br\s*\/?>/gi);
  for (const line of rawLines) {
    const text = stripTags(line);
    if (!text) continue;
    if (text.startsWith(tablePlaceholder)) {
      const idx = parseInt(text.replace(tablePlaceholder, ''), 10);
      elements.push({ type: 'table', data: tables[idx] });
    } else {
      const isHeading = cleanWithPlaceholders.indexOf(`<h`) !== -1 && cleanHtml.includes(text);
      elements.push({ type: isHeading ? 'heading' : 'paragraph', text });
    }
  }

  if (elements.length === 0) {
    elements.push({ type: 'paragraph', text: stripTags(cleanHtml) });
  }

  let page = doc.addPage([A4_W, A4_H]);
  let { width, height } = page.getSize();
  
  function drawBrowserChrome(p, docTitle) {
    p.drawRectangle({
      x: 20,
      y: height - 55,
      width: width - 40,
      height: 35,
      color: rgb(0.92, 0.93, 0.95),
      borderColor: rgb(0.8, 0.82, 0.85),
      borderWidth: 1,
    });
    p.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 75,
      borderColor: rgb(0.8, 0.82, 0.85),
      borderWidth: 1,
    });

    const dotY = height - 37;
    p.drawCircle({ x: 40, y: dotY, size: 4, color: rgb(0.95, 0.35, 0.35) });
    p.drawCircle({ x: 50, y: dotY, size: 4, color: rgb(0.95, 0.75, 0.25) });
    p.drawCircle({ x: 60, y: dotY, size: 4, color: rgb(0.35, 0.75, 0.35) });

    // Draw Back Arrow
    p.drawLine({
      start: { x: 78, y: dotY },
      end: { x: 88, y: dotY },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1.5,
    });
    p.drawLine({
      start: { x: 78, y: dotY },
      end: { x: 82, y: dotY + 3.5 },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1.5,
    });
    p.drawLine({
      start: { x: 78, y: dotY },
      end: { x: 82, y: dotY - 3.5 },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1.5,
    });

    // Draw Forward Arrow
    p.drawLine({
      start: { x: 96, y: dotY },
      end: { x: 106, y: dotY },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1.5,
    });
    p.drawLine({
      start: { x: 106, y: dotY },
      end: { x: 102, y: dotY + 3.5 },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1.5,
    });
    p.drawLine({
      start: { x: 106, y: dotY },
      end: { x: 102, y: dotY - 3.5 },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1.5,
    });

    // Draw Refresh Icon (Circle outline)
    p.drawCircle({
      x: 120,
      y: dotY,
      size: 3.5,
      color: rgb(0.5, 0.55, 0.6),
    });
    // Draw a small inner circle to simulate an arc/ring
    p.drawCircle({
      x: 120,
      y: dotY,
      size: 2.2,
      color: rgb(0.92, 0.93, 0.95), // matches browser chrome background color
    });
    // Refresh arrow tip
    p.drawLine({
      start: { x: 121, y: dotY + 2 },
      end: { x: 123.5, y: dotY + 3.5 },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1,
    });
    p.drawLine({
      start: { x: 121, y: dotY + 2 },
      end: { x: 123.5, y: dotY + 0.5 },
      color: rgb(0.5, 0.55, 0.6),
      thickness: 1,
    });

    p.drawRectangle({
      x: 145,
      y: height - 48,
      width: width - 180,
      height: 20,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.87, 0.9),
      borderWidth: 1,
    });

    p.drawText(`https://localhost/${filename || 'index.html'}`, {
      x: 155,
      y: height - 42,
      font: helveticaFont,
      size: 9,
      color: rgb(0.4, 0.45, 0.5),
    });
  }

  drawBrowserChrome(page, title);
  
  let currentY = height - 80;
  const contentWidth = width - 80;
  const startX = 40;

  for (const el of elements) {
    if (currentY < 60) {
      page = doc.addPage([A4_W, A4_H]);
      drawBrowserChrome(page, title);
      currentY = height - 80;
    }

    if (el.type === 'heading') {
      currentY -= 15;
      page.drawText(cleanForWinAnsi(el.text), {
        x: startX,
        y: currentY,
        font: boldFont,
        size: 15,
        color: rgb(0.1, 0.15, 0.25),
      });
      page.drawLine({
        start: { x: startX, y: currentY - 5 },
        end: { x: startX + 100, y: currentY - 5 },
        color: rgb(0.95, 0.45, 0.1),
        thickness: 1.5,
      });
      currentY -= 25;
    } else if (el.type === 'paragraph') {
      const words = el.text.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = helveticaFont.widthOfTextAtSize(testLine, 10);
        if (testWidth > contentWidth) {
          page.drawText(cleanForWinAnsi(currentLine), {
            x: startX,
            y: currentY,
            font: helveticaFont,
            size: 10,
            color: rgb(0.25, 0.3, 0.35),
          });
          currentY -= 14;
          if (currentY < 60) {
            page = doc.addPage([A4_W, A4_H]);
            drawBrowserChrome(page, title);
            currentY = height - 80;
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        page.drawText(cleanForWinAnsi(currentLine), {
          x: startX,
          y: currentY,
          font: helveticaFont,
          size: 10,
          color: rgb(0.25, 0.3, 0.35),
        });
        currentY -= 20;
      }
    } else if (el.type === 'table') {
      const rows = el.data;
      const numCols = rows[0].length;
      const targetColWidth = Math.floor(contentWidth / numCols);
      
      currentY -= 10;
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        const isHeader = row.some(c => c.isHeader) || rIdx === 0;
        const rowHeight = 22;
        
        if (currentY - rowHeight < 60) {
          page = doc.addPage([A4_W, A4_H]);
          drawBrowserChrome(page, title);
          currentY = height - 80;
        }

        if (isHeader) {
          page.drawRectangle({
            x: startX,
            y: currentY - rowHeight,
            width: contentWidth,
            height: rowHeight,
            color: rgb(0.12, 0.2, 0.3),
          });
        } else if (rIdx % 2 === 0) {
          page.drawRectangle({
            x: startX,
            y: currentY - rowHeight,
            width: contentWidth,
            height: rowHeight,
            color: rgb(0.96, 0.97, 0.99),
          });
        }

        let currentX = startX;
        for (let cIdx = 0; cIdx < row.length; cIdx++) {
          const cell = row[cIdx];
          
          page.drawRectangle({
            x: currentX,
            y: currentY - rowHeight,
            width: targetColWidth,
            height: rowHeight,
            borderColor: rgb(0.85, 0.88, 0.9),
            borderWidth: 0.5,
          });

          const displayTxt = cleanForWinAnsi(cell.text).substring(0, Math.floor(targetColWidth / 6));
          page.drawText(displayTxt, {
            x: currentX + 6,
            y: currentY - 15,
            font: isHeader ? boldFont : helveticaFont,
            size: isHeader ? 9 : 8.5,
            color: isHeader ? rgb(1, 1, 1) : rgb(0.25, 0.25, 0.25),
          });

          currentX += targetColWidth;
        }
        currentY -= rowHeight;
      }
      currentY -= 15;
    }
  }

  return await doc.save();
}

/**
 * Generates an executive structure summary report of the HTML file.
 */
async function generateSummaryPdf(htmlContent, filename) {
  const doc = await PDFDocument.create();
  const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const A4_W = 595.28, A4_H = 841.89;
  const page = doc.addPage([A4_W, A4_H]);
  const { width, height } = page.getSize();

  // Draw Premium Executive Background Card border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(0.12, 0.24, 0.45),
    borderWidth: 2,
  });

  // Top header block
  page.drawRectangle({
    x: 31,
    y: height - 120,
    width: width - 62,
    height: 88,
    color: rgb(0.12, 0.24, 0.45),
  });

  page.drawText('HTML CODE SUMMARY REPORT', {
    x: 50,
    y: height - 75,
    font: boldFont,
    size: 18,
    color: rgb(1, 1, 1),
  });

  page.drawText(`File: ${filename || 'index.html'}  |  Date Generated: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: height - 100,
    font: helveticaFont,
    size: 10,
    color: rgb(0.8, 0.88, 1),
  });

  // Calculate statistics
  const numHeadings = (htmlContent.match(/<h[1-6][^>]*>/gi) || []).length;
  const numParagraphs = (htmlContent.match(/<p[^>]*>/gi) || []).length;
  const numTables = (htmlContent.match(/<table[^>]*>/gi) || []).length;
  const numScripts = (htmlContent.match(/<script[^>]*>/gi) || []).length;
  const numStyles = (htmlContent.match(/<style[^>]*>/gi) || []).length;
  const totalCharacters = htmlContent.length;

  let summaryY = height - 160;

  // Executive Stats Panel
  page.drawText('Document Specifications', {
    x: 50,
    y: summaryY,
    font: boldFont,
    size: 13,
    color: rgb(0.12, 0.24, 0.45),
  });

  summaryY -= 20;

  // Grid background for stats
  page.drawRectangle({
    x: 50,
    y: summaryY - 80,
    width: width - 100,
    height: 75,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  const stats = [
    { label: 'File Size (bytes):', val: String(totalCharacters) },
    { label: 'Total Headings (H1-H6):', val: String(numHeadings) },
    { label: 'Paragraph blocks (P):', val: String(numParagraphs) },
    { label: 'Tabular structures (Table):', val: String(numTables) },
    { label: 'Stylesheets (Style):', val: String(numStyles) },
    { label: 'Scripts (Javascript):', val: String(numScripts) }
  ];

  let statY = summaryY - 20;
  for (let i = 0; i < stats.length; i++) {
    const col = i % 2;
    const xPos = col === 0 ? 70 : 320;
    
    page.drawText(stats[i].label, {
      x: xPos,
      y: statY,
      font: boldFont,
      size: 9.5,
      color: rgb(0.2, 0.25, 0.35),
    });

    page.drawText(stats[i].val, {
      x: xPos + 140,
      y: statY,
      font: helveticaFont,
      size: 9.5,
      color: rgb(0.1, 0.6, 0.3),
    });

    if (col === 1) statY -= 20;
  }

  summaryY -= 110;

  // Document Outline
  page.drawText('Structural Outline & Content Analysis', {
    x: 50,
    y: summaryY,
    font: boldFont,
    size: 13,
    color: rgb(0.12, 0.24, 0.45),
  });

  summaryY -= 20;

  // Render parsed outlines
  const outlineItems = [];
  const hMatchRegex = /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gis;
  let hMatch;
  while ((hMatch = hMatchRegex.exec(htmlContent)) !== null && outlineItems.length < 15) {
    const level = hMatch[1].toUpperCase();
    const text = hMatch[2].replace(/<[^>]+>/g, '').trim().substring(0, 50);
    outlineItems.push(`${level}: ${text}`);
  }

  if (outlineItems.length === 0) {
    outlineItems.push('No visual headings detected in the HTML document.');
  }

  for (const item of outlineItems) {
    if (summaryY < 80) break;
    
    // Draw bullet
    page.drawCircle({ x: 60, y: summaryY + 3, size: 2.5, color: rgb(0.95, 0.45, 0.1) });
    
    page.drawText(cleanForWinAnsi(item), {
      x: 75,
      y: summaryY,
      font: helveticaFont,
      size: 9.5,
      color: rgb(0.25, 0.3, 0.35),
    });
    summaryY -= 18;
  }

  return await doc.save();
}

/**
 * POST /api/v1/pdf/convert/html-to-pdf
 * Body: html (string) OR file (HTML file)
 * Options: conversionMode ('Code PDF', 'GUI Output PDF', 'Summary Output PDF')
 */
async function htmlToPdf(req, res, next) {
  try {
    const htmlContent = req.body.html || (req.file ? req.file.buffer.toString('utf8') : null);
    if (!htmlContent) throw createError('No HTML content provided. Send `html` in body or upload an HTML file.', 400);

    const conversionMode = req.body.conversionMode || 'GUI Output PDF';
    const filename = req.file ? req.file.originalname : 'raw-string.html';

    let bytes;
    if (conversionMode === 'Code PDF') {
      bytes = await generateCodePdf(htmlContent, filename);
    } else if (conversionMode === 'Summary Output PDF') {
      bytes = await generateSummaryPdf(htmlContent, filename);
    } else {
      bytes = await generateGuiPdf(htmlContent, filename);
    }

    res
      .set('Content-Type', 'application/pdf')
      .set('Content-Disposition', `attachment; filename="html-converted.pdf"`)
      .send(Buffer.from(bytes));
  } catch (err) {
    next(err);
  }
}

module.exports = { htmlToPdf };
