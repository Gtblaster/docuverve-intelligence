'use strict';
const multer = require('multer');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const storage = multer.memoryStorage();

/**
 * Single file upload — field name 'file'.
 */
const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('file');

/**
 * Multi-file upload — field name 'files', max 20 files.
 */
const uploadMultiple = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
}).array('files', 20);

/**
 * Two-file upload for comparison — fields 'fileA' and 'fileB'.
 */
const uploadTwo = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([
  { name: 'fileA', maxCount: 1 },
  { name: 'fileB', maxCount: 1 },
]);

module.exports = { uploadSingle, uploadMultiple, uploadTwo };
