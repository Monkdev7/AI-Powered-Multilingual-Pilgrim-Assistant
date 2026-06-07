require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat');
const emergencyRoutes = require('./routes/emergency');
const faqRoutes = require('./routes/faq');
const servicesRoutes = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

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

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  const key = process.env.GEMINI_API_KEY;
  const keyValid = key && key.startsWith('AIza') && key.length > 20;
  console.log(`🔱  Simhastha Pilgrim Assistant API running on port ${PORT}`);
  console.log(`   Gemini API: ${keyValid ? '✅ Configured' : '⚠️  Not configured (running in mock mode)'}`);
  if (!keyValid) {
    console.log(`   → Get a free key at: https://aistudio.google.com`);
    console.log(`   → Add it to backend/.env as GEMINI_API_KEY=AIza...`);
  }
});
