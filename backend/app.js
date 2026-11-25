const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const chatRoutes = require('./routes/chat');
const emergencyRoutes = require('./routes/emergency');
const faqRoutes = require('./routes/faq');
const servicesRoutes = require('./routes/services');

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// CORS_ORIGINS: comma-separated list. Unset => dev defaults outside production, none in production.
function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (raw && raw.trim()) {
    return raw.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
  }
  return process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS;
}

// TRUST_PROXY: unset/false => off (local dev). A number is the count of proxy hops
// (e.g. 1 on Render/Railway/Heroku); other values are passed to Express as-is.
function getTrustProxy() {
  const v = (process.env.TRUST_PROXY || '').trim();
  if (v === '' || v === 'false') return false;
  if (v === 'true') return true;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  return v;
}

function intEnv(name, def) {
  const n = parseInt(process.env[name], 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.disable('x-powered-by');
  app.set('trust proxy', getTrustProxy());

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));

  const chatLimiter = rateLimit({
    windowMs: intEnv('RATE_LIMIT_WINDOW_MS', 60 * 1000),
    limit: intEnv('RATE_LIMIT_MAX', 20),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED' });
    },
  });

  // Rate limit first so oversized or malformed requests also count.
  app.use('/api/chat', chatLimiter);
  app.use(express.json({ limit: process.env.BODY_LIMIT || '128kb' }));

  // Routes
  app.use('/api/chat', chatRoutes);
  app.use('/api/emergency', emergencyRoutes);
  app.use('/api/faq', faqRoutes);
  app.use('/api/services', servicesRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Simhastha Pilgrim Assistant API is running',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler: never expose internals to the client
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON in request body', code: 'INVALID_JSON' });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' });
    }
    if (err && err.status >= 400 && err.status < 500 && err.expose) {
      return res.status(err.status).json({ error: 'Invalid request', code: 'INVALID_REQUEST' });
    }
    console.error(`Unhandled error on ${req.method} ${req.path}:`, err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  });

  return app;
}

module.exports = { createApp, getAllowedOrigins, getTrustProxy };