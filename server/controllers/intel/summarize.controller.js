'use strict';
const pdfParse = require('pdf-parse');
const { createError } = require('../../middleware/errorHandler');

/**
 * Produces a simple extractive summary from raw text.
 * Ranks sentences by word frequency (TF-style heuristic).
 * @param {string} text - Full document text
 * @param {number} maxSentences - How many sentences to include in summary
 * @returns {string} Summary text
 */
function extractiveSummarize(text, maxSentences = 5) {
  // Tokenize into sentences
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length <= maxSentences) return sentences.join(' ');

  // Build word frequency map
  const wordFreq = {};
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'this',
    'that', 'with', 'have', 'from', 'they', 'will', 'been', 'has', 'was',
    'had', 'its', 'our', 'your', 'their', 'which', 'about', 'into', 'more',
    'also', 'any', 'than', 'then', 'when', 'there', 'these', 'those', 'such',
  ]);
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  // Score sentences by sum of word frequencies
  const scored = sentences.map(sentence => {
    const sentWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const score = sentWords.reduce((sum, w) => sum + (wordFreq[w] || 0), 0) / (sentWords.length || 1);
    return { sentence, score };
  });

  // Sort by score descending, take top N, then restore original order
  const topIndices = new Set(
    [...scored]
      .map((item, idx) => ({ ...item, idx }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .map(item => item.idx)
  );

  return sentences.filter((_, idx) => topIndices.has(idx)).join(' ');
}

/**
 * POST /api/v1/pdf/intel/summarize
 * Body: file (PDF), maxSentences? (number, default 5), includeStats? (bool)
 * Returns: JSON with extractive summary and document statistics
 */
async function summarizePdf(req, res, next) {
  const startTime = Date.now();
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const maxSentences = Math.min(parseInt(req.body.maxSentences) || 5, 20);
    const includeStats = req.body.includeStats !== 'false';

    const parsed = await pdfParse(req.file.buffer);
    const rawText = parsed.text || '';

    if (rawText.trim().length < 100) {
      return res.json({
        success: true,
        summary: '[Insufficient text content — document may be scanned or image-based.]',
        pageCount: parsed.numpages,
        wordCount: 0,
        charCount: rawText.length,
        processingTimeMs: Date.now() - startTime,
      });
    }

    const summary = extractiveSummarize(rawText, maxSentences);

    const wordCount = (rawText.match(/\b\w+\b/g) || []).length;
    const charCount = rawText.length;
    const paragraphCount = rawText.split(/\n{2,}/).filter(p => p.trim().length > 0).length;
    const sentenceCount = (rawText.match(/[.!?]+\s/g) || []).length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

    // Top 10 keywords by frequency
    const wordFreq = {};
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'this',
      'that', 'with', 'have', 'from', 'they', 'will', 'been', 'has', 'was',
      'had', 'its', 'our', 'your', 'their', 'which', 'about', 'into', 'more',
      'also', 'any', 'than', 'then', 'when', 'there', 'these', 'those', 'such',
      'pdf', 'page', 'figure', 'table',
    ]);
    for (const word of (rawText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])) {
      if (!stopWords.has(word)) wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const response = {
      success: true,
      summary,
      pageCount: parsed.numpages,
      processingTimeMs: Date.now() - startTime,
    };

    if (includeStats) {
      response.stats = {
        wordCount,
        charCount,
        paragraphCount,
        sentenceCount,
        avgWordsPerSentence,
        topKeywords,
      };
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
}

module.exports = { summarizePdf };
