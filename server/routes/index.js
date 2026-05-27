'use strict';
const { Router } = require('express');
const organizeRoutes = require('./organize.routes');
const optimizeRoutes = require('./optimize.routes');
const convertRoutes = require('./convert.routes');
const securityRoutes = require('./security.routes');
const intelRoutes = require('./intel.routes');

const router = Router();

router.use('/organize', organizeRoutes);
router.use('/optimize', optimizeRoutes);
router.use('/convert', convertRoutes);
router.use('/security', securityRoutes);
router.use('/intel', intelRoutes);

module.exports = router;
