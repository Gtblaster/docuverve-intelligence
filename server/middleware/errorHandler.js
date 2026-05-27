'use strict';

/**
 * Global Express error handler.
 * Formats all thrown errors into a consistent JSON response.
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected server error occurred';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

/**
 * Creates a structured API error.
 */
function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, createError };
