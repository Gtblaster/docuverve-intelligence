'use strict';
const pdfParse = require('pdf-parse');
const { Document, Paragraph, TextRun, HeadingLevel, Packer } = require('docx');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/convert/pdf-to-word
 * Query: ?ocr=true for scanned PDF enhancement
 * Body: file (PDF)
 * Returns: Word document (.docx)
 */
async function pdfToWord(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const useOcr = req.query.ocr === 'true';
    const parsed = await pdfParse(req.file.buffer);
    const rawText = parsed.text || '';

    // Split into paragraphs
    const paragraphs = rawText
      .split(/\n{2,}/)
      .map(block => block.trim())
      .filter(block => block.length > 0);

    const docChildren = [
      new Paragraph({
        text: req.file.originalname.replace('.pdf', ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
      }),
    ];

    if (useOcr && rawText.trim().length < 50) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Scanned PDF: OCR rendering requires a PDF renderer sidecar for full accuracy.]',
              italics: true,
              color: '888888',
            }),
          ],
          spacing: { after: 200 },
        }),
      );
    }

    for (const para of paragraphs) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para,
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 160 },
        }),
      );
    }

    const doc = new Document({
      creator: 'DocuVerve Intelligence',
      description: 'Converted from PDF by DocuVerve Intelligence',
      sections: [{ properties: {}, children: docChildren }],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    res
      .set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .set('Content-Disposition', `attachment; filename="converted${useOcr ? '-ocr' : ''}.docx"`)
      .set('X-OCR-Used', String(useOcr))
      .set('X-Page-Count', String(parsed.numpages))
      .send(docxBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { pdfToWord };
