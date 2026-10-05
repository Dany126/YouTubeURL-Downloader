import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import generationRoutes from './routes/generation.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { GENERATED_DIRECTORY } from './utils/generated-file.utils.js';

const app = express();
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5501').split(',').map((item) => item.trim());
app.disable('x-powered-by');
app.use(cors({ origin: origins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '10kb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait before trying again.' } } }));
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api', generationRoutes);
app.use('/generated', express.static(GENERATED_DIRECTORY, { index: false, dotfiles: 'deny', fallthrough: true }));
app.use(notFound);
app.use(errorHandler);
export default app;
