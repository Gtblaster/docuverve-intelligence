'use strict';
const { Router } = require('express');
const { uploadSingle, uploadTwo } = require('../middleware/multer');
const { protectPdf } = require('../controllers/security/protect.controller');
const { unlockPdf } = require('../controllers/security/unlock.controller');
const { watermarkPdf } = require('../controllers/security/watermark.controller');
const { comparePdfs } = require('../controllers/security/compare.controller');
const { signPdf } = require('../controllers/security/sign.controller');
const { autoRedact } = require('../controllers/security/autoRedact.controller');

const router = Router();

router.post('/protect', uploadSingle, protectPdf);
router.post('/unlock', uploadSingle, unlockPdf);
router.post('/watermark', uploadSingle, watermarkPdf);
router.post('/compare', uploadTwo, comparePdfs);
router.post('/sign', uploadSingle, signPdf);
router.post('/auto-redact', uploadSingle, autoRedact);

module.exports = router;
