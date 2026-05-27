'use strict';
const { Router } = require('express');
const { uploadSingle } = require('../middleware/multer');
const { summarizePdf } = require('../controllers/intel/summarize.controller');
const { translatePdf } = require('../controllers/intel/translate.controller');
const { detectForms } = require('../controllers/intel/formsDetector.controller');

const router = Router();

router.post('/summarize', uploadSingle, summarizePdf);
router.post('/translate', uploadSingle, translatePdf);
router.post('/forms-detector', uploadSingle, detectForms);

module.exports = router;
