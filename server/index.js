'use strict';

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { configureCors } = require('./middleware/cors');
const { errorHandler } = require('./middleware/errorHandler');
const apiRouter = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Logging ─────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(configureCors());

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'docuverve-api', ts: new Date().toISOString() }));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/pdf', apiRouter);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 DocuVerve Intelligence API`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
