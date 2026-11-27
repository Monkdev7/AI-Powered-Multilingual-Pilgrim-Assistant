'use strict';
// Phase 4B correction: overdue reviewBy is a soft condition (records are hidden and flagged),
// structural errors still fail fast. No network calls; Gemini is mocked.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const geminiMock = { models: [] };
const sdkPath = require.resolve('@google/genai');
require.cache[sdkPath] = {
  id: sdkPath,
  filename: sdkPath,
  loaded: true,
  exports: {
    GoogleGenAI: class {
      constructor() {
        this.models = {
          generateContent: async ({ model, config }) => {
            geminiMock.models.push({ model, systemInstruction: config.systemInstruction });
            return { text: 'ok' };
          },
        };
      }
    },
  },
};
const { createApp } = require('../app');
const chat = require('../routes/chat');
const facts = require('../data/facts');
const REAL = path.join(__dirname, '../data/facts.json');
const raw = () => JSON.parse(fs.readFileSync(REAL, 'utf8'));
const TODAY = '2026-11-26';
const FAR = '2999-01-01';
const quiet = () => { };
const ENV_KEYS = ['GEMINI_API_KEY', 'DEMO_MODE', 'NODE_ENV', 'RATE_LIMIT_MAX'];
let saved;
let tmpFiles = [];
beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  process.env.RATE_LIMIT_MAX = '1000';
  geminiMock.models = [];
});
afterEach(() => {
  for (const k of ENV_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  tmpFiles.forEach((f) => fs.rmSync(f, { force: true }));
  tmpFiles = [];
});
function fixture(mutate) {
  const d = raw();
  mutate(d);
  const f = path.join(os.tmpdir(), `facts-fixture-${process.pid}-${tmpFiles.length}.json`);
  fs.writeFileSync(f, JSON.stringify(d));
  tmpFiles.push(f);
  return f;
}
const registryWith = (mutate, today = TODAY, warn = quiet) => facts.createRegistry({ file: fixture(mutate), today, warn });
const NUMBERS = ['112', '100', '101', '102', '1091', '1098', '1363', '0734-2527130', '1800-233-1008'];
const hasNumber = (text) => NUMBERS.some((n) => new RegExp(`(^|[^\\d])${n.replace(/-/g, '[- ]?')}([^\\d]|$)`).test(text));
const scan = (v) => JSON.stringify(v);
test('startup with every reviewBy overdue does not throw; all active records are listed stale', () => {
  const warnings = [];
  const reg = facts.createRegistry({ today: FAR, warn: (m) => warnings.push(m) });
  const active = raw().records.map((r) => r.id).sort();
  assert.deepEqual(reg.listStaleFacts().map((r) => r.id).sort(), active);
  // 112 is the only record exempt from automatic hiding; every other overdue record is hidden.
  assert.deepEqual(reg.getPublicFacts().map((r) => r.id), ['emergency.national.112']);
  assert.deepEqual(reg.getPromptFacts().map((r) => r.id), ['emergency.national.112']);
  assert.ok(reg.getFact('emergency.national.112'), 'stale records stay in the registry');
  assert.equal(reg.isStale(reg.getFact('emergency.national.112')), true);
  assert.equal(warnings.length, 1, 'one startup warning');
  assert.match(warnings[0], /emergency\.national\.112 \(reviewBy 2027-05-26\)/);
  assert.ok(!/GEMINI|AIza|key/i.test(warnings[0]));
});
test('fresh registry: nothing stale, no warning; only the overdue record is hidden', () => {
  const warnings = [];
  const ok = facts.createRegistry({ today: TODAY, warn: (m) => warnings.push(m) });
  assert.equal(ok.listStaleFacts().length, 0);
  assert.equal(warnings.length, 0);
  const reg = registryWith((d) => { d.records.find((r) => r.id === 'emergency.police.100').reviewBy = '2026-11-01'; });
  assert.deepEqual(reg.listStaleFacts().map((r) => r.id), ['emergency.police.100']);
  assert.ok(!reg.getPublicFacts().some((r) => r.id === 'emergency.police.100'));
  assert.ok(!reg.getPromptFacts().some((r) => r.id === 'emergency.police.100'));
  assert.ok(reg.getPublicFacts().some((r) => r.id === 'emergency.fire.101'));
});
test('structural errors still fail fast, even when records are also stale', () => {
  const bad = (mutate, re) => assert.throws(() => registryWith(mutate, FAR), re);
  const rec = (d, id = 'emergency.police.100') => d.records.find((r) => r.id === id);
  bad((d) => { delete rec(d).sourceUrl; }, /sourceUrl/);
  bad((d) => { rec(d).issuingBody = ''; }, /issuingBody is required/);
  bad((d) => { rec(d).verificationStatus = 'bogus'; }, /invalid verificationStatus/);
  bad((d) => { rec(d).displayPolicy = 'bogus'; }, /invalid displayPolicy/);
  bad((d) => { d.records.push({ ...rec(d) }); }, /duplicate id/);
  bad((d) => { rec(d).sourceUrl = 'http://example.gov.in'; }, /https/);
  bad((d) => { rec(d).lastVerified = '2999-02-01'; }, /in the future/);
  bad((d) => { rec(d).operationallyConfirmed = true; }, /operationallyConfirmed must be false/);
  bad((d) => { rec(d).verifiedBy = 'x'; }, /verifiedBy must be null/);
  bad((d) => { delete d.retired[0].retiredReason; }, /retiredReason/);
  bad((d) => { delete rec(d).reviewBy; }, /reviewBy is required/);
});
test('stale records are absent from /api/emergency, /api/faq, /api/services and chat output; others stay', async () => {
  const reg = registryWith((d) => {
    d.records.find((r) => r.id === 'emergency.police.100').reviewBy = '2026-11-01';
    d.records.find((r) => r.id === 'calendar.simhastha2028.snan_plan').reviewBy = '2026-11-01';
  });
  process.env.DEMO_MODE = 'true';
  const app = createApp({ facts: reg });
  const em = (await request(app).get('/api/emergency')).body;
  assert.ok(!em.contacts.some((c) => c.number === '100'));
  assert.equal(em.contacts[0].number, '112');
  assert.ok(em.contacts.some((c) => c.number === '101'));
  const faq = (await request(app).get('/api/faq')).body;
  const dates = faq.faqs.find((f) => /Amrit Snan dates/.test(f.question)).answer;
  assert.match(dates, /not currently verified/);
  assert.ok(!/3 Shahi|7 Parv/.test(scan(faq)));
  assert.equal((await request(app).get('/api/services')).status, 200);
  const prompt = chat.buildSystemPrompt(reg.getPromptFacts());
  assert.ok(!prompt.includes('100: Police'));
  assert.ok(prompt.includes('101: Fire'));
  assert.ok(!/Shahi|Parv/.test(prompt));
  assert.match(prompt, /27 March 2028 to 27 May 2028/, 'the still-fresh period record stays');
  assert.ok(!chat.buildMockResponses(reg.getPromptFacts()).join(' ').includes('Police: 100'));
  process.env.GEMINI_API_KEY = 'AIzaFAKEKEYFORTESTSONLY1234567890';
  const gem = await request(app).post('/api/chat').send({ message: 'hi' });
  assert.equal(gem.status, 200);
  assert.ok(!geminiMock.models[0].systemInstruction.includes('100: Police'));
  const health = (await request(app).get('/api/health')).body;
  assert.equal(health.factsReviewOverdue, true);
  assert.equal(health.factsReviewOverdueCount, 2);
});
test('/api/health exposes only a flag and a count, never ids or values', async () => {
  const stale = (await request(createApp({ today: FAR, warn: quiet })).get('/api/health')).body;
  assert.equal(stale.factsReviewOverdue, true);
  assert.equal(stale.factsReviewOverdueCount, raw().records.length);
  assert.deepEqual(Object.keys(stale).sort(), ['factsReviewOverdue', 'factsReviewOverdueCount', 'geminiConfigured', 'message', 'status']);
  assert.ok(!/emergency\.|reviewBy|2027/.test(scan(stale)));
  const fresh = (await request(createApp({ today: TODAY, warn: quiet })).get('/api/health')).body;
  assert.equal(fresh.factsReviewOverdue, false);
  assert.equal(fresh.factsReviewOverdueCount, 0);
});
test('all records overdue: only 112 stays in /api/emergency (200), everything else and the calendar hidden', async () => {
  process.env.DEMO_MODE = 'true';
  const app = createApp({ today: FAR, warn: quiet });
  const res = await request(app).get('/api/emergency');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.contacts.map((c) => c.number), ['112']);
  const others = NUMBERS.filter((n) => n !== '112');
  assert.ok(!others.some((n) => new RegExp(`(^|[^\\d])${n.replace(/-/g, '[- ]?')}([^\\d]|$)`).test(scan(res.body))));
  const faq = (await request(app).get('/api/faq')).body;
  assert.equal(faq.faqs.find((f) => /Amrit Snan dates/.test(f.question)).answer.includes('Shahi'), false);
  assert.ok(!/27 March|9 April/.test(scan(faq)));
  assert.equal((await request(app).get('/api/services')).status, 200);
});
test('no approved emergency number left: prompt says to contact official local authorities and states no number', async () => {
  // 112 is exempt from staleness hiding, so this fallback path is reached by taking 112 out of public policy.
  const reg = registryWith((d) => {
    const r = d.records.find((x) => x.id === 'emergency.national.112');
    r.verificationStatus = 'awaiting_confirmation';
    r.displayPolicy = 'hide';
  }, FAR);
  const prompt = chat.buildSystemPrompt(reg.getPromptFacts());
  assert.match(prompt, /contact the official local authorities/);
  assert.match(prompt, /Do not state, guess or recall any phone number/);
  assert.match(prompt, /not currently verified/);
  assert.ok(!hasNumber(prompt), 'prompt contains an emergency number');
  assert.ok(!/call 112|112 for emergencies/.test(prompt));
  assert.ok(!/shrimahakaleshwar\.mp\.gov\.in/.test(prompt));
  assert.ok(!/Shahi|Parv|27 March 2028/.test(prompt));
  const mocks = chat.buildMockResponses(reg.getPromptFacts());
  assert.equal(mocks.length, 5);
  mocks.forEach((m) => assert.ok(!hasNumber(m) && !/shrimahakaleshwar/.test(m), m));
  assert.match(mocks[3], /official local authorities/);
  // end to end: the Gemini path receives the same safe prompt, demo mode serves safe replies
  process.env.GEMINI_API_KEY = 'AIzaFAKEKEYFORTESTSONLY1234567890';
  const app = createApp({ facts: reg });
  assert.equal((await request(app).post('/api/chat').send({ message: 'help' })).status, 200);
  assert.match(geminiMock.models[0].systemInstruction, /official local authorities/);
  assert.ok(!hasNumber(geminiMock.models[0].systemInstruction));
  delete process.env.GEMINI_API_KEY;
  process.env.DEMO_MODE = 'true';
  for (let i = 0; i < 5; i++) {
    const r = await request(app).post('/api/chat').send({ message: 'hello' });
    assert.equal(r.status, 200);
    assert.ok(!hasNumber(r.body.reply));
  }
});
test('today can be a function: a record drops out when the clock passes its reviewBy, no restart', async () => {
  let now = TODAY;
  const app = createApp({ today: () => now, warn: quiet });
  assert.ok((await request(app).get('/api/emergency')).body.contacts.length > 0);
  now = FAR;
  assert.deepEqual((await request(app).get('/api/emergency')).body.contacts.map((c) => c.number), ['112']);
});
test('regression: 112 stays public and primary when its reviewBy is overdue, and is still reported overdue', async () => {
  const reg = facts.createRegistry({ today: FAR, warn: quiet });
  const f112 = reg.getFact('emergency.national.112');
  assert.equal(reg.isStale(f112), true, 'still reported as overdue');
  assert.ok(reg.listStaleFacts().some((r) => r.id === 'emergency.national.112'));
  assert.ok(reg.getPublicFacts().some((r) => r.id === 'emergency.national.112'), '112 remains public');
  assert.ok(reg.getPromptFacts().some((r) => r.id === 'emergency.national.112'), '112 remains available to Gemini');
  assert.ok(reg.getPublicFacts().every((r) => r.id === 'emergency.national.112'), 'no other overdue record is exempt');
  const warnings = [];
  facts.createRegistry({ today: FAR, warn: (m) => warnings.push(m) });
  assert.match(warnings[0], /emergency\.national\.112 \(reviewBy 2027-05-26\)/, 'startup warning still names 112');
  const app = createApp({ today: FAR, warn: quiet });
  const em = (await request(app).get('/api/emergency')).body;
  assert.equal(em.contacts[0].number, '112');
  assert.equal(em.contacts[0].primary, true);
  const health = (await request(app).get('/api/health')).body;
  assert.equal(health.factsReviewOverdue, true);
  assert.equal(health.factsReviewOverdueCount, raw().records.length);
});
test('unconfirmed bathing dates and attendance figures are not in any active record or public output', async () => {
  const text = scan(raw().records);
  for (const s of ['2028-04-13', '2028-04-27', '2028-05-12', 'crore']) assert.ok(!text.includes(s), s);
  const retired = raw().retired.filter((r) => /bathing_dates|attendance/.test(r.id));
  assert.equal(retired.length, 3);
  retired.forEach((r) => { assert.equal(r.verificationStatus, 'retired'); assert.equal(r.displayPolicy, 'never'); assert.match(r.retiredReason, /Unconfirmed/); });
  const app = createApp({ today: TODAY, warn: quiet });
  process.env.DEMO_MODE = 'true';
  const out = [scan((await request(app).get('/api/emergency')).body), scan((await request(app).get('/api/faq')).body),
  scan((await request(app).get('/api/services')).body), chat.SYSTEM_PROMPT, chat.MOCK_RESPONSES.join(' '),
  scan(facts.getPublicFacts()), scan(facts.getPromptFacts())].join(' ');
  for (const s of ['2028-04-13', '2028-04-27', '2028-05-12', '14 crore', '30 crore', 'tens of millions']) assert.ok(!out.includes(s), s);
  // the proposed plan and period stay, labelled proposed
  assert.match(chat.SYSTEM_PROMPT, /3 Shahi Snan and 7 Parv Snan during 9 April to 8 May \(proposed, not officially confirmed\)/);
  assert.match(chat.SYSTEM_PROMPT, /27 March 2028 to 27 May 2028 \(proposed, not officially confirmed\)/);
});
test('unsourced arrival-time advice is not served by the backend', async () => {
  const app = createApp({ today: TODAY, warn: quiet });
  const text = scan([(await request(app).get('/api/faq')).body, (await request(app).get('/api/services')).body, (await request(app).get('/api/emergency')).body, chat.SYSTEM_PROMPT]);
  assert.ok(!/4-5 AM|3-4 AM|Arrive (at ghats )?by \d/i.test(text));
});
