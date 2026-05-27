'use strict';
const pdfParse = require('pdf-parse');
const { createError } = require('../../middleware/errorHandler');

/**
 * Supported target languages and their display names.
 */
const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  it: 'Italian',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
};

/**
 * POST /api/v1/pdf/intel/translate
 * Body: file (PDF), targetLang (ISO 639-1 code, default "en"), sourceLang? (ISO 639-1)
 *
 * Note: This endpoint extracts the PDF text layer and returns a structured response
 * ready for integration with a translation API (Google Translate, DeepL, LibreTranslate, etc.).
 * Full translation requires wiring to an external translation service.
 * Returns: JSON with extracted text and integration instructions
 */
async function translatePdf(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const targetLang = (req.body.targetLang || 'en').toLowerCase();
    const sourceLang = (req.body.sourceLang || 'auto').toLowerCase();

    if (targetLang !== 'auto' && !SUPPORTED_LANGUAGES[targetLang]) {
      throw createError(
        `Unsupported target language: "${targetLang}". Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
        400,
      );
    }

    const parsed = await pdfParse(req.file.buffer);
    const rawText = parsed.text || '';

    if (rawText.trim().length < 10) {
      return res.json({
        success: false,
        error: 'Insufficient text content — document may be scanned or image-based. Use OCR preprocessing first.',
        pageCount: parsed.numpages,
      });
    }

    // Split text into chunks ≤ 5000 chars (typical API limit)
    const CHUNK_SIZE = 5000;
    const chunks = [];
    for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
      chunks.push(rawText.slice(i, i + CHUNK_SIZE));
    }

    res.json({
      success: true,
      file: req.file.originalname,
      pageCount: parsed.numpages,
      sourceLang,
      targetLang,
      targetLanguageName: SUPPORTED_LANGUAGES[targetLang] || targetLang,
      charCount: rawText.length,
      chunkCount: chunks.length,
      processingTimeMs: Date.now() - startTime,
      extractedChunks: chunks,
      integrationNote: 'Wire each chunk to your preferred translation API (Google Translate v3, DeepL, LibreTranslate) and reassemble the translated chunks in order.',
      exampleIntegration: {
        googleTranslate: 'POST https://translation.googleapis.com/language/translate/v2?key=YOUR_KEY',
        deepL: 'POST https://api-free.deepl.com/v2/translate',
        libreTranslate: 'POST https://libretranslate.com/translate',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { translatePdf };
