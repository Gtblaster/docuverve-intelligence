'use strict';
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { createError } = require('../../middleware/errorHandler');

/**
 * POST /api/v1/pdf/intel/forms-detector
 * Body: file (PDF)
 * Returns: JSON with detected form fields and interactive elements with bounding boxes
 */
async function detectForms(req, res, next) {
  try {
    if (!req.file) throw createError('No PDF file provided.', 400);

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const form = doc.getForm();
    const fields = form.getFields();

    const detectedFields = fields.map(field => {
      const fieldType = field.constructor.name;
      const widgets = field.acroField.getWidgets();
      const widgetData = widgets.map(widget => {
        try {
          const rect = widget.getRectangle();
          return { x: rect?.x, y: rect?.y, width: rect?.width, height: rect?.height };
        } catch (_) {
          return { x: null, y: null, width: null, height: null };
        }
      });
      return { name: field.getName(), type: fieldType, widgets: widgetData };
    });

    // Heuristic text-based field detection (labels with colons / underlines / brackets)
    const parsed = await pdfParse(req.file.buffer);
    const textPatterns = [];
    const lines = parsed.text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/:\s*$/.test(trimmed) || /_{3,}/.test(trimmed) || /\[\s{3,}\]/.test(trimmed) || /\(\s{3,}\)/.test(trimmed)) {
        textPatterns.push({
          pattern: trimmed,
          fieldType: /_{3,}/.test(trimmed) ? 'text_input' : /\[/.test(trimmed) ? 'checkbox' : 'label_colon',
          confidence: 'medium',
        });
      }
    }

    res.json({
      success: true,
      formsDetection: {
        filename: req.file.originalname,
        pageCount: doc.getPageCount(),
        nativeFormFields: detectedFields,
        nativeFieldCount: detectedFields.length,
        textPatternFields: textPatterns.slice(0, 50),
        textPatternCount: textPatterns.length,
        isInteractiveForm: detectedFields.length > 0,
        hasTextPatterns: textPatterns.length > 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { detectForms };
