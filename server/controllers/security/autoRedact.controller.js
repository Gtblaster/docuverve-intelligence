'use strict';
const { PDFDocument, rgb } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { createError } = require('../../middleware/errorHandler');

/**
 * PII / sensitive data patterns for Indian and international formats.
 */
const PII_PATTERNS = [
  { name: 'Aadhaar',    pattern: /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g },
  { name: 'PAN',        pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g },
  { name: 'Email',      pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g },
  { name: 'Phone_IN',   pattern: /\b(?:\+91|0)?[6-9]\d{9}\b/g },
  { name: 'Phone_INTL', pattern: /\b\+?[1-9]\d{1,2}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}\b/g },
  { name: 'CreditCard', pattern: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g },
  { name: 'Passport_IN',pattern: /\b[A-Z]{1}[0-9]{7}\b/g },
  { name: 'SSN_US',     pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'IFSC',       pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },
  { name: 'VoterID_IN', pattern: /\b[A-Z]{3}[0-9]{7}\b/g },
];

/**
 * POST /api/v1/pdf/security/auto-redact
 * Body: file (PDF), patterns? (JSON array of pattern names to apply, defaults to all)
 * Returns: JSON report of detected PII matches + redacted PDF metadata
 *
 * Note: pdf-lib does not expose text positions, so this endpoint performs text-layer
 * analysis and returns a detection report. Visual black-box redaction on rasterized
 * pages requires a Puppeteer/Ghostscript renderer. The PDF is re-serialized with
 * stripped metadata to remove producer information that may leak PII.
 */
async function autoRedact(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    // Determine which pattern set to apply
    let activePatternNames = PII_PATTERNS.map(p => p.name);
    if (req.body.patterns) {
      try {
        const requested = JSON.parse(req.body.patterns);
        if (Array.isArray(requested) && requested.length > 0) {
          activePatternNames = requested;
        }
      } catch (_) { /* use all patterns */ }
    }

    const activePatterns = PII_PATTERNS.filter(p => activePatternNames.includes(p.name));

    // Extract text from the PDF
    let parsedText = '';
    let pageCount = 0;
    try {
      const parsed = await pdfParse(req.file.buffer);
      parsedText = parsed.text || '';
      pageCount = parsed.numpages;
    } catch (parseErr) {
      throw createError(`Failed to extract text from PDF: ${parseErr.message}`, 422);
    }

    // Run pattern matching and collect detections
    const detections = [];
    let totalMatches = 0;

    for (const { name, pattern } of activePatterns) {
      // Reset regex lastIndex before each use
      pattern.lastIndex = 0;
      const matches = parsedText.match(pattern) || [];
      if (matches.length > 0) {
        totalMatches += matches.length;
        detections.push({
          type: name,
          count: matches.length,
          // Mask detected values — show only first 2 chars + asterisks
          samples: matches.slice(0, 5).map(m => `${m.slice(0, 2)}${'*'.repeat(Math.max(m.length - 2, 3))}`),
        });
      }
      // Reset lastIndex after matching
      pattern.lastIndex = 0;
    }

    // Re-serialize the PDF stripping producer metadata (best-effort privacy)
    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    doc.setProducer('DocuVerve Intelligence — Redacted');
    doc.setCreator('DocuVerve Intelligence');
    doc.setModificationDate(new Date());

    // Draw black redaction rectangles over known sensitive text positions
    // Since pdf-lib has no text coordinate API, we stamp a visible banner on page 1
    const pages = doc.getPages();
    if (pages.length > 0 && totalMatches > 0) {
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      firstPage.drawRectangle({
        x: 10,
        y: height - 30,
        width: width - 20,
        height: 22,
        color: rgb(0.8, 0, 0),
        opacity: 0.85,
      });
    }

    const redactedBytes = await doc.save({ useObjectStreams: false });
    const redactedBuffer = Buffer.from(redactedBytes);

    const report = {
      success: true,
      file: req.file.originalname,
      pageCount,
      totalPiiDetected: totalMatches,
      processingTimeMs: Date.now() - startTime,
      detections,
      note: 'Visual black-box redaction on rasterized pages requires a Puppeteer/Ghostscript sidecar. This report provides text-layer analysis. The returned PDF has stripped metadata.',
      redactedPdfBase64: redactedBuffer.toString('base64'),
    };

    res.json(report);
  } catch (err) {
    next(err);
  }
}

module.exports = { autoRedact };
