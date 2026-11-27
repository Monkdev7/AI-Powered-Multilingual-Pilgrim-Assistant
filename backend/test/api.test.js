// Run with: npm test (node:test + supertest). Gemini is mocked; no network calls are made.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// Replace the Gemini SDK before the app loads it.
const geminiMock = { calls: [], impl: async () => 'mock reply' };
const sdkPath = require.resolve('@google/genai');
require.cache[sdkPath] = {
  id: sdkPath,
  filename: sdkPath,
  loaded: true,
  exports: {
    GoogleGenAI: class {
      constructor(opts) {
        geminiMock.clientOptions = opts;
        this.models = {
          // contents = prior turns followed by the new user turn; the mock splits them like the old chat API did.
          generateContent: async ({ model, contents, config }) => {
            const history = contents.slice(0, -1);
            const prompt = contents[contents.length - 1].parts[0].text;
            geminiMock.calls.push({ history, prompt, model, config, contents });
            const text = await geminiMock.impl(prompt, history);
            return { text };
          },
        };
      }
    },
  },
};

const { createApp } = require('../app');

const ENV_KEYS = ['GEMINI_API_KEY', 'GEMINI_MODEL', 'DEMO_MODE', 'NODE_ENV', 'CORS_ORIGINS', 'RATE_LIMIT_MAX', 'RATE_LIMIT_WINDOW_MS', 'BODY_LIMIT', 'GEMINI_TIMEOUT_MS', 'TRUST_PROXY'];
const FAKE_KEY = 'AIzaFAKEKEYFORTESTSONLY1234567890';
let saved;
const origError = console.error;

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  process.env.GEMINI_API_KEY = FAKE_KEY;
  process.env.RATE_LIMIT_MAX = '1000';
  geminiMock.calls = [];
  geminiMock.impl = async () => 'mock reply';
  console.error = () => { };
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
  }
  console.error = origError;
});

const chat = (app, body) => request(app).post('/api/chat').send(body);

test('valid chat request returns a reply', async () => {
  const res = await chat(createApp(), { message: ' Hello ', language: 'hi', history: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] });
  assert.equal(res.status, 200);
  assert.equal(res.body.reply, 'mock reply');
  assert.equal(res.body.language, 'hi');
  assert.equal(res.body.mock, false);
  assert.ok(res.body.timestamp);
  assert.match(geminiMock.calls[0].prompt, /Hindi[\s\S]*Hello$/);
  assert.deepEqual(geminiMock.calls[0].history.map((h) => h.role), ['user', 'model']);
});

test('language defaults to en when omitted', async () => {
  const res = await chat(createApp(), { message: 'hi' });
  assert.equal(res.status, 200);
  assert.equal(res.body.language, 'en');
});

test('invalid message values are rejected with 400', async () => {
  const app = createApp();
  for (const message of [undefined, '', '   ', 123, null, {}, ['x']]) {
    const res = await chat(app, { message });
    assert.equal(res.status, 400, JSON.stringify(message));
    assert.equal(res.body.code, 'INVALID_REQUEST');
  }
  assert.equal((await chat(app, ['not', 'object'])).status, 400);
  assert.equal(geminiMock.calls.length, 0);
});

test('message over the length limit is rejected', async () => {
  const app = createApp();
  assert.equal((await chat(app, { message: 'a'.repeat(1000) })).status, 200);
  assert.equal((await chat(app, { message: 'a'.repeat(1001) })).status, 400);
});

test('all eight languages are accepted, unknown codes get 400', async () => {
  const app = createApp();
  for (const language of ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa']) {
    assert.equal((await chat(app, { message: 'hi', language })).status, 200, language);
  }
  for (const language of ['fr', 'EN', '', 5, null, '__proto__', 'constructor']) {
    const res = await chat(app, { message: 'hi', language });
    assert.equal(res.status, 400, String(language));
    assert.equal(res.body.code, 'INVALID_REQUEST');
  }
});

test('invalid history is rejected with 400', async () => {
  const app = createApp();
  const bad = [
    'nope',
    [{ role: 'system', content: 'x' }],
    [{ role: 'user', content: 5 }],
    [{ role: 'user' }],
    [null],
    ['text'],
    Array.from({ length: 21 }, () => ({ role: 'user', content: 'x' })),
    [{ role: 'user', content: 'x'.repeat(4001) }],
  ];
  for (const history of bad) {
    const res = await chat(app, { message: 'hi', history });
    assert.equal(res.status, 400, JSON.stringify(history).slice(0, 60));
  }
});

test('history starting with assistant turns is normalized', async () => {
  const res = await chat(createApp(), {
    message: 'hi',
    history: [
      { role: 'assistant', content: 'welcome' },
      { role: 'assistant', content: 'error bubble' },
      { role: 'user', content: 'q' },
      { role: 'assistant', content: 'a' },
    ],
  });
  assert.equal(res.status, 200);
  assert.deepEqual(geminiMock.calls[0].history.map((h) => h.role), ['user', 'model']);
});

test('history of only assistant turns becomes empty', async () => {
  const res = await chat(createApp(), { message: 'hi', history: [{ role: 'assistant', content: 'x' }] });
  assert.equal(res.status, 200);
  assert.deepEqual(geminiMock.calls[0].history, []);
});

test('malformed JSON returns 400 without leaking parser details', async () => {
  const res = await request(createApp()).post('/api/chat').set('Content-Type', 'application/json').send('{"message": ');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'INVALID_JSON');
  assert.equal(res.body.details, undefined);
  assert.doesNotMatch(JSON.stringify(res.body), /Unexpected|position|JSON at/i);
});

test('multi-byte 10-turn history under the field limits returns 200', async () => {
  const history = [];
  for (let i = 0; i < 5; i++) {
    history.push({ role: 'user', content: '?'.repeat(4000) });
    history.push({ role: 'assistant', content: '?'.repeat(4000) });
  }
  const res = await chat(createApp(), { message: '??????', language: 'hi', history });
  assert.equal(res.status, 200);
});
test('oversized body returns 413', async () => {
  const res = await chat(createApp(), { message: 'a'.repeat(200000) });
  assert.equal(res.status, 413);
  assert.equal(res.body.code, 'PAYLOAD_TOO_LARGE');
});

test('chat is rate limited with 429 RATE_LIMITED', async () => {
  process.env.RATE_LIMIT_MAX = '2';
  const app = createApp();
  assert.equal((await chat(app, { message: 'a' })).status, 200);
  assert.equal((await chat(app, { message: 'b' })).status, 200);
  const res = await chat(app, { message: 'c' });
  assert.equal(res.status, 429);
  assert.equal(res.body.code, 'RATE_LIMITED');
  // other endpoints are not limited
  assert.equal((await request(app).get('/api/health')).status, 200);
});

test('Gemini quota error maps to 429 AI_QUOTA_EXCEEDED with a safe body', async () => {
  geminiMock.impl = async () => { const e = new Error(`[429] quota exceeded key=${FAKE_KEY}`); e.status = 429; throw e; };
  const res = await chat(createApp(), { message: 'hi' });
  assert.equal(res.status, 429);
  assert.equal(res.body.code, 'AI_QUOTA_EXCEEDED');
  assert.equal(res.body.reply, undefined);
  assert.doesNotMatch(JSON.stringify(res.body), /AIza|quota exceeded/);
});

test('Gemini 503 and network errors map to 503 AI_UNAVAILABLE', async () => {
  const app = createApp();
  for (const make of [
    () => Object.assign(new Error('overloaded'), { status: 503 }),
    () => new Error('fetch failed'),
    () => Object.assign(new Error('bad key'), { status: 403 }),
  ]) {
    geminiMock.impl = async () => { throw make(); };
    const res = await chat(app, { message: 'hi' });
    assert.equal(res.status, 503);
    assert.equal(res.body.code, 'AI_UNAVAILABLE');
    assert.equal(res.body.reply, undefined);
  }
});

test('Gemini timeout maps to 503 AI_UNAVAILABLE', async () => {
  process.env.GEMINI_TIMEOUT_MS = '20';
  geminiMock.impl = () => new Promise((resolve) => setTimeout(() => resolve('late'), 500));
  const res = await chat(createApp(), { message: 'hi' });
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'AI_UNAVAILABLE');
});

test('Gemini invalid request maps to 400 and unknown errors to generic 500', async () => {
  const app = createApp();
  geminiMock.impl = async () => { throw Object.assign(new Error('bad request body'), { status: 400 }); };
  let res = await chat(app, { message: 'hi' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'AI_INVALID_REQUEST');
  geminiMock.impl = async () => { throw new Error('secret internal detail'); };
  res = await chat(app, { message: 'hi' });
  assert.equal(res.status, 500);
  assert.equal(res.body.code, 'AI_ERROR');
  assert.doesNotMatch(JSON.stringify(res.body), /secret internal detail/);
});

test('missing key without DEMO_MODE returns 503 CHAT_NOT_CONFIGURED, never a canned answer', async () => {
  delete process.env.GEMINI_API_KEY;
  const res = await chat(createApp(), { message: 'hi' });
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'CHAT_NOT_CONFIGURED');
  assert.equal(res.body.reply, undefined);
});

test('DEMO_MODE=true serves flagged mock answers when no key is set', async () => {
  delete process.env.GEMINI_API_KEY;
  process.env.DEMO_MODE = 'true';
  const res = await chat(createApp(), { message: 'hi' });
  assert.equal(res.status, 200);
  assert.equal(res.body.mock, true);
  assert.equal(geminiMock.calls.length, 0);
});

test('DEMO_MODE is ignored in production', async () => {
  delete process.env.GEMINI_API_KEY;
  process.env.DEMO_MODE = 'true';
  process.env.NODE_ENV = 'production';
  const res = await chat(createApp(), { message: 'hi' });
  assert.equal(res.status, 503);
});

test('Gemini failure never falls back to mock answers, even in demo mode', async () => {
  process.env.DEMO_MODE = 'true';
  geminiMock.impl = async () => { throw Object.assign(new Error('down'), { status: 500 }); };
  const res = await chat(createApp(), { message: 'hi' });
  assert.equal(res.status, 503);
  assert.equal(res.body.mock, undefined);
});

test('security headers set and X-Powered-By removed', async () => {
  const res = await request(createApp()).get('/api/health');
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
});

test('CORS: dev defaults allow localhost:5173, others get no CORS headers', async () => {
  const app = createApp();
  let res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
  assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
  res = await request(app).get('/api/health').set('Origin', 'http://127.0.0.1:5173');
  assert.equal(res.headers['access-control-allow-origin'], 'http://127.0.0.1:5173');
  res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('CORS: CORS_ORIGINS supports multiple origins; production has no default origins', async () => {
  process.env.CORS_ORIGINS = 'https://a.example, https://b.example/';
  let app = createApp();
  for (const o of ['https://a.example', 'https://b.example']) {
    const res = await request(app).get('/api/health').set('Origin', o);
    assert.equal(res.headers['access-control-allow-origin'], o);
  }
  assert.equal((await request(app).get('/api/health').set('Origin', 'http://localhost:5173')).headers['access-control-allow-origin'], undefined);
  delete process.env.CORS_ORIGINS;
  process.env.NODE_ENV = 'production';
  app = createApp();
  assert.equal((await request(app).get('/api/health').set('Origin', 'http://localhost:5173')).headers['access-control-allow-origin'], undefined);
});

test('existing endpoints still behave as before', async () => {
  const app = createApp();
  let res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.geminiConfigured, true);

  res = await request(app).get('/api/faq');
  assert.equal(res.status, 200);
  assert.ok(res.body);

  res = await request(app).get('/api/emergency');
  assert.equal(res.status, 200);

  res = await request(app).get('/api/services');
  assert.equal(res.status, 200);
  const list = Array.isArray(res.body) ? res.body : (res.body.services || Object.values(res.body).find(Array.isArray));
  assert.ok(Array.isArray(list) && list.length > 0);

  res = await request(app).get(`/api/services/${list[0].id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.id, list[0].id);

  assert.equal(list.length, 6);
  for (const id of ['food', 'water', 'sanitation', 'banking', 'charging', 'accommodation-nearby']) {
    assert.ok(list.some((s) => s.id === id), `service category ${id} present`);
    res = await request(app).get(`/api/services/${id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, id);
  }

  res = await request(app).get('/api/faq');
  const faqList = Array.isArray(res.body) ? res.body : (res.body.faqs || Object.values(res.body).find(Array.isArray));
  assert.equal(faqList.find((f) => f.id === 10).question, 'Is it safe to stay in tent cities?');
  assert.equal(faqList.find((f) => f.id === 11).question, 'Can I stay in Indore and commute to Ujjain daily?');

  res = await request(app).get('/api/services/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Service category not found');

  res = await request(app).get('/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Route not found');
});
// ---------- @google/genai integration (models.generateContent) ----------
test('Gemini call: default model gemini-3.5-flash-lite, generateContent shape, system instruction and limits', async () => {
  const res = await chat(createApp(), { message: 'Hello', language: 'ta', history: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] });
  assert.equal(res.status, 200);
  const call = geminiMock.calls[0];
  assert.equal(call.model, 'gemini-3.5-flash-lite');
  assert.equal(geminiMock.clientOptions.apiKey, FAKE_KEY, 'the key is passed to the client from the environment');
  assert.deepEqual(call.contents.map((c) => c.role), ['user', 'model', 'user'], 'history turns then the new user turn');
  assert.deepEqual(call.contents[0].parts, [{ text: 'a' }]);
  assert.match(call.contents[2].parts[0].text, /^\[Please respond in Tamil\]\n\nHello$/);
  assert.equal(typeof call.config.systemInstruction, 'string');
  assert.ok(call.config.systemInstruction.length > 100, 'system instruction (facts-safe prompt) is sent');
  assert.equal(call.config.maxOutputTokens, 800);
  assert.equal(call.config.temperature, 0.7);
  assert.ok(call.config.abortSignal && typeof call.config.abortSignal.aborted === 'boolean', 'an AbortSignal is passed for the timeout');
});
test('GEMINI_MODEL overrides the default model; blank falls back to the default', async () => {
  process.env.GEMINI_MODEL = 'gemini-test-model';
  await chat(createApp(), { message: 'Hello' });
  assert.equal(geminiMock.calls[0].model, 'gemini-test-model');
  process.env.GEMINI_MODEL = '   ';
  await chat(createApp(), { message: 'Hello again' });
  assert.equal(geminiMock.calls[1].model, 'gemini-3.5-flash-lite');
});
test('an empty or blocked Gemini response is a client-safe error, never an empty reply', async () => {
  geminiMock.impl = async () => '';
  let res = await chat(createApp(), { message: 'Hello' });
  assert.equal(res.status, 500);
  assert.equal(res.body.code, 'AI_ERROR');
  assert.ok(!('reply' in res.body));
  assert.ok(!/Gemini|SAFETY|returned/i.test(JSON.stringify(res.body)));
});
test('the legacy SDK is not used anywhere in the backend source or package manifest', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.dependencies['@google/genai']);
  assert.equal(pkg.dependencies['@google/generative-ai'], undefined);
  assert.match(fs.readFileSync(path.join(root, 'routes', 'chat.js'), 'utf8'), /require\('@google\/genai'\)/);
  assert.ok(!/generative-ai|GoogleGenerativeAI/.test(fs.readFileSync(path.join(root, 'routes', 'chat.js'), 'utf8')));
});