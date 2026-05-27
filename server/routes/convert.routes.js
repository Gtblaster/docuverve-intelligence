'use strict';
const { Router } = require('express');
const { uploadSingle } = require('../middleware/multer');
const { wordToPdf } = require('../controllers/convert/wordToPdf.controller');
const { excelToPdf } = require('../controllers/convert/excelToPdf.controller');
const { imageToPdf } = require('../controllers/convert/imageToPdf.controller');
const { htmlToPdf } = require('../controllers/convert/htmlToPdf.controller');
const { pdfToWord } = require('../controllers/convert/pdfToWord.controller');
const { pdfToExcel } = require('../controllers/convert/pdfToExcel.controller');
const { pdfToJpg } = require('../controllers/convert/pdfToJpg.controller');
const { pdfToPdfa } = require('../controllers/convert/pdfToPdfa.controller');

const router = Router();

// To-PDF
router.post('/word-to-pdf', uploadSingle, wordToPdf);
router.post('/excel-to-pdf', uploadSingle, excelToPdf);
router.post('/image-to-pdf', uploadSingle, imageToPdf);
router.post('/html-to-pdf', uploadSingle, htmlToPdf);

// From-PDF
router.post('/pdf-to-word', uploadSingle, pdfToWord);
router.post('/pdf-to-excel', uploadSingle, pdfToExcel);
router.post('/pdf-to-jpg', uploadSingle, pdfToJpg);
router.post('/pdf-to-pdfa', uploadSingle, pdfToPdfa);

module.exports = router;
