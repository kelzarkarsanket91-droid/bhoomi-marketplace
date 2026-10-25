import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { prisma } from './services/db.js';

const app = express();

// Secure HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Standard rate limiter: 300 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP address. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Specific stricter rate limiter for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { error: 'Too many OTP requests. Please wait 5 minutes before trying again.' },
});
app.use('/api/v1/auth/send-otp', otpLimiter);

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Mount API router
app.use('/api/v1', apiRouter);

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
});

// Central error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = config.env === 'production' ? 'An unexpected server error occurred.' : err.message;
  res.status(status).json({ error: message });
});

// Server startup (only start standalone HTTP listener when not in Vercel serverless runtime)
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const server = app.listen(config.port, () => {
    console.log(`[Bhoomi API] Server active on port ${config.port} in ${config.env} mode`);
    console.log(`[Bhoomi API] Health endpoint: http://localhost:${config.port}/api/v1/health`);
  });

  const shutdown = async () => {
    console.log('[Bhoomi API] Initiating graceful shutdown...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[Bhoomi API] Database disconnected. Process exiting.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
