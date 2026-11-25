require('dotenv').config();
const { createApp } = require('./app');
const { isValidKey, isDemoMode } = require('./routes/chat');
const app = createApp();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const keyValid = isValidKey(process.env.GEMINI_API_KEY);
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Simhastha Pilgrim Assistant API running on port ${PORT}`);
  if (keyValid) {
    console.log('   Gemini API: configured');
  } else if (isDemoMode()) {
    console.warn('   WARNING: Gemini API key not configured. DEMO_MODE=true: chat returns canned demo answers.');
  } else {
    console.warn('   WARNING: Gemini API key not configured. /api/chat will return 503 CHAT_NOT_CONFIGURED.');
    console.warn('   Get a free key at https://aistudio.google.com and set GEMINI_API_KEY in backend/.env');
    console.warn('   (for local demos without a key, set DEMO_MODE=true)');
  }
  if (isProd && process.env.DEMO_MODE === 'true') {
    console.warn('   WARNING: DEMO_MODE is ignored when NODE_ENV=production.');
  }
  if (isProd && !(process.env.CORS_ORIGINS || '').trim()) {
    console.warn('   WARNING: CORS_ORIGINS is not set; cross-origin browser requests will be blocked.');
  }
});