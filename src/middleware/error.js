import mongoose from 'mongoose';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
}

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || (err instanceof mongoose.Error.ValidationError ? 400 : 500);
  const payload = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'Internal server error' : err.message
    }
  };
  if (err.details && status < 500) payload.error.details = err.details;
  if (env.nodeEnv !== 'production' && status >= 500) payload.error.debug = err.message;
  console.error(`[${status}] ${req.method} ${req.originalUrl}`, err);
  res.status(status).json(payload);
}
