import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import requestRoutes from './routes/request.routes.js';
import healthRoutes from './routes/health.routes.js';
import { notFound, errorHandler } from './middleware/error.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin.split(',').map(x => x.trim()), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }), authRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/requests', requestRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
