'use strict';
const { Router } = require('express');
const { uploadMultiple, uploadSingle } = require('../middleware/multer');
const { mergePdfs } = require('../controllers/organize/merge.controller');
const { splitPdf } = require('../controllers/organize/split.controller');
const { removePages } = require('../controllers/organize/removePages.controller');
const { extractPages } = require('../controllers/organize/extractPages.controller');
const { reorderPages } = require('../controllers/organize/reorder.controller');

const router = Router();

router.post('/merge', uploadMultiple, mergePdfs);
router.post('/split', uploadSingle, splitPdf);
router.post('/remove-pages', uploadSingle, removePages);
router.post('/extract-pages', uploadSingle, extractPages);
router.post('/reorder', uploadSingle, reorderPages);

module.exports = router;
