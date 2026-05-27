'use strict';
const cors = require('cors');

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

/**
 * Returns configured CORS middleware.
 */
function configureCors() {
  return cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Original-Size', 'X-Compressed-Size', 'X-Processing-Time'],
    credentials: true,
  });
}

module.exports = { configureCors };
