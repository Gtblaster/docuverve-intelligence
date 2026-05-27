'use strict';
const { Router } = require('express');
const { uploadSingle } = require('../middleware/multer');
const { compressPdf } = require('../controllers/optimize/compress.controller');
const { repairPdf } = require('../controllers/optimize/repair.controller');

const router = Router();

router.post('/compress', uploadSingle, compressPdf);
router.post('/repair', uploadSingle, repairPdf);

module.exports = router;
