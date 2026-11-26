// Phase 4B increment 2: emergency information and AI safety. No network calls; Gemini is mocked.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const geminiMock = { models: [] };
const sdkPath = require.resolve('@google/generative-ai');
require.cache[sdkPath] = {
  id: sdkPath,
  filename: sdkPath,
  loaded: true,
  exports: {
    GoogleGenerativeAI: class {
      getGenerativeModel(opts) {
        geminiMock.models.push(opts);
        return { startChat: () => ({ sendMessage: async () => ({ response: Promise.resolve({ text: () => 'ok' }) }) }) };
      }
    },
  },
};

const { createApp } = require('../app');
const chat = require('../routes/chat');
const facts = require('../data/facts');

const ENV_KEYS = ['GEMINI_API_KEY', 'DEMO_MODE', 'NODE_ENV', 'RATE_LIMIT_MAX'];
let saved;
beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  process.env.RATE_LIMIT_MAX = '1000';
  geminiMock.models = [];
});
afterEach(() => {
  for (const k of ENV_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
});

// Removed values in every common format (plain, dashes, spaces, tel: form).
const REMOVED = [
  /0734[\s-]?2551234/,
  /1800[\s-]?180[\s-]?5522/,
  /(^|\D)1090(\D|$)/,
  /011[\s-]?24363260/,
];
const hasRemoved = (text) => REMOVED.some((re) => re.test(text));
const scan = (value) => JSON.stringify(value);

async function collectPublic(app) {
  const out = {};
  for (const p of ['/api/emergency', '/api/faq', '/api/services', '/api/health']) out[p] = (await request(app).get(p)).body;
  const svc = out['/api/services'].services;
  for (const s of svc) out[`/api/services/${s.id}`] = (await request(app).get(`/api/services/${s.id}`)).body;
  out['/api/faq?search=helpline'] = (await request(app).get('/api/faq?search=helpline')).body;
  out['chat:not-configured'] = (await request(app).post('/api/chat').send({ message: 'hi' })).body;
  out['chat:bad-body'] = (await request(app).post('/api/chat').send({ message: '' })).body;
  out['chat:bad-lang'] = (await request(app).post('/api/chat').send({ message: 'hi', language: 'xx' })).body;
  out['404'] = (await request(app).get('/api/nope')).body;
  return out;
}

test('emergency API: 112 is first and flagged primary, labels map to the right numbers', async () => {
  const res = await request(createApp()).get('/api/emergency');
  assert.equal(res.status, 200);
  const { contacts } = res.body;
  assert.equal(contacts[0].number, '112');
  assert.equal(contacts[0].primary, true);
  assert.equal(contacts.filter((c) => c.primary).length, 1);
  const byNumber = Object.fromEntries(contacts.map((c) => [c.number, c.name]));
  assert.equal(byNumber['100'], 'Police');
  assert.equal(byNumber['101'], 'Fire');
  assert.equal(byNumber['102'], 'Ambulance');
  assert.equal(byNumber['1091'], 'Women in Distress');
  assert.equal(byNumber['1098'], 'Child Helpline');
  assert.match(byNumber['1363'], /Tourist/);
  assert.equal(byNumber['108'], undefined, '108 is hidden pending a second authoritative source');
  assert.deepEqual(Object.keys(byNumber).sort(), ['0734-2527130', '100', '101', '102', '1091', '1098', '112', '1363']);
  assert.equal(new Set(contacts.map((c) => c.number)).size, contacts.length, 'no number served twice');
});

const NUM_108 = /(^|[^\d])108([^\d]|$)/;
test('108 is hidden (awaiting a second source) and absent from every public output; never labelled ambulance', async () => {
  const rec = facts.getFact('emergency.disaster.108');
  assert.equal(rec.verificationStatus, 'awaiting_confirmation');
  assert.equal(rec.displayPolicy, 'hide');
  assert.ok(!facts.getPublicFacts().some((r) => r.id === rec.id));
  assert.ok(!facts.getPromptFacts().some((r) => r.id === rec.id));
  const pub = await collectPublic(createApp());
  assert.ok(!NUM_108.test(scan(pub)), 'a public response contains 108');
  assert.ok(!NUM_108.test(chat.SYSTEM_PROMPT));
  for (const m of chat.MOCK_RESPONSES) assert.ok(!NUM_108.test(m));
  assert.ok(!/108[^.\n]{0,20}ambulance|ambulance[^.\n]{0,20}\b108\b/i.test(scan(pub) + chat.SYSTEM_PROMPT + chat.MOCK_RESPONSES.join(' ')));
});

test('removed numbers appear in no public API response, in any format', async () => {
  const pub = await collectPublic(createApp());
  for (const [name, body] of Object.entries(pub)) {
    const text = scan(body);
    assert.ok(!hasRemoved(text), `${name} contains a removed number`);
    assert.ok(!/bhasmarti\.com/i.test(text), `${name} contains bhasmarti.com`);
    assert.ok(!/control room/i.test(text.replace(/Police Control Room/gi, '')), `${name} mentions a control room`);
  }
  // sanity: the scanner does catch the variants
  for (const v of ['0734-2551234', '0734 2551234', '07342551234', 'tel:07342551234', '1800-180-5522', '1800 180 5522', 'tel:18001805522', '1090', '011-24363260', 'tel:01124363260']) {
    assert.ok(hasRemoved(`x ${v} y`), v);
  }
});

test('emergency API: no NDRF, no retired values, no future date, source metadata kept', async () => {
  const res = await request(createApp()).get('/api/emergency');
  const text = scan(res.body);
  assert.ok(!/NDRF/i.test(text));
  assert.equal(res.body.lastUpdated, undefined);
  assert.ok(!text.includes('2028-03-01'));
  const today = new Date().toISOString().slice(0, 10);
  assert.match(res.body.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(res.body.lastVerified <= today, 'lastVerified is not in the future');
  for (const c of res.body.contacts) {
    assert.match(c.source.url, /^https:\/\//);
    assert.ok(c.source.issuingBody);
    assert.match(c.source.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(c.source.status, 'officially_listed');
    assert.equal(c.clickable, true);
    assert.ok(c.source.lastVerified <= today);
  }
  const ujjain = res.body.contacts.find((c) => c.number === '102');
  assert.equal(ujjain.source.pageLastUpdated, '2019-06-29', 'Ujjain helpline page date recorded');
  assert.ok(!/call-tested|verified working|confirmed working/i.test(text.replace(/not (been )?independently call-tested/g, '')));
});

test('SP office is a labelled local directory contact, not an emergency action', async () => {
  const res = await request(createApp()).get('/api/emergency');
  const sp = res.body.contacts.find((c) => c.number === '0734-2527130');
  assert.ok(sp);
  assert.equal(sp.group, 'local_directory');
  assert.equal(sp.primary, false);
  assert.match(sp.name, /Superintendent of Police office/);
  assert.equal(res.body.contacts.filter((c) => c.group === 'emergency').length, 7);
});

test('temple helpdesk is not in the emergency API', async () => {
  const res = await request(createApp()).get('/api/emergency');
  assert.ok(!scan(res.body).includes('1800-233-1008'));
});

test('awaiting_confirmation and retired records are never public or prompt facts', () => {
  const ids = (list) => list.map((r) => r.id);
  for (const list of [facts.getPublicFacts(), facts.getPromptFacts()]) {
    assert.ok(list.every((r) => ['officially_listed', 'proposed', 'verified'].includes(r.verificationStatus)));
    assert.ok(list.every((r) => r.displayPolicy === 'show' || r.displayPolicy === 'show_labelled'));
  }
  const retiredIds = facts.getRetiredForAudit().map((r) => r.id);
  assert.ok(retiredIds.length > 0);
  assert.ok(!ids(facts.getPublicFacts()).some((id) => retiredIds.includes(id)));
  assert.ok(!ids(facts.getPromptFacts()).some((id) => retiredIds.includes(id)));
  assert.ok(!ids(facts.getPromptFacts()).includes('emergency.disaster.108'));
  assert.ok(!ids(facts.getPromptFacts()).includes('ndrf.hq.011_24363260'));
});

test('awaiting_confirmation records are never clickable', () => {
  const data = JSON.parse(JSON.stringify(require('../data/facts.json')));
  for (const r of data.records.filter((x) => x.verificationStatus === 'awaiting_confirmation')) {
    assert.equal(facts.isClickable(r), false, r.id);
  }
});

test('facts.json: no value is served under two ids', () => {
  const seen = new Map();
  for (const r of facts.getPublicFacts()) {
    const key = JSON.stringify(r.value);
    assert.ok(!seen.has(key), `${r.id} duplicates ${seen.get(key)}`);
    seen.set(key, r.id);
  }
});

test('system prompt: approved facts only, labels exact, not-verified rule present', () => {
  const p = chat.SYSTEM_PROMPT;
  assert.ok(!hasRemoved(p));
  assert.ok(!NUM_108.test(p));
  assert.ok(!/bhasmarti/i.test(p));
  for (const line of ['112: National emergency', '100: Police', '101: Fire', '102: Ambulance', '1091: Women in Distress', '1098: Child Helpline', '1363: Tourist helpline']) {
    assert.ok(p.includes(line), line);
  }
  assert.ok(p.includes('https://www.shrimahakaleshwar.mp.gov.in/services/bhasmaarti'));
  assert.ok(p.includes('Temple assistance (Shri Mahakaleshwar Temple helpdesk)'));
  assert.match(p, /not currently verified/);
  assert.match(p, /Never guess or invent phone numbers, dates, costs, distances/);
  assert.ok(p.includes('https://ujjain.nic.in'));
  assert.match(p, /MPINFO/);
  assert.match(p, /27 March 2028 to 27 May 2028 \(proposed, not officially confirmed\)/);
  assert.match(p, /9 April to 8 May \(proposed, not officially confirmed\)/);
  // five individual dates, five-ghat claim, attendance figures and heat ranges are not supplied
  assert.ok(!/Apr(il)? 13|Apr 27|May 12|Mar 27|Mesh Sankranti \(Apr/.test(p));
  assert.ok(!/Triveni|Mangalnath Ghat|Siddhavat Ghat|Narsinh/.test(p));
  assert.ok(!/crore|tens of millions|62 days|43/.test(p));
});

test('system prompt is built from getPromptFacts only', () => {
  const rec = facts.getFact('emergency.police.100');
  const only = chat.buildSystemPrompt([rec]);
  assert.ok(only.includes('100: Police'));
  assert.ok(!only.includes('1091'));
});

test('mock replies: no removed numbers, no old URL, no key or .env hints, DEMO_MODE served', async () => {
  for (const m of chat.MOCK_RESPONSES) {
    assert.ok(!hasRemoved(m));
    assert.ok(!/bhasmarti/i.test(m));
  }
  process.env.DEMO_MODE = 'true';
  const app = createApp();
  const langs = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa'];
  for (let i = 0; i < chat.MOCK_RESPONSES.length * 2; i++) {
    const res = await request(app).post('/api/chat').send({ message: 'hello', language: langs[i % langs.length] });
    assert.equal(res.body.mock, true);
    assert.ok(!hasRemoved(res.body.reply));
    assert.ok(!/GEMINI_API_KEY|\.env|bhasmarti/i.test(res.body.reply));
  }
  const emergencyMock = chat.MOCK_RESPONSES.find((m) => m.includes('112'));
  assert.ok(emergencyMock.indexOf('112') < emergencyMock.indexOf('100'));
});

test('Gemini receives the generated system prompt', async () => {
  process.env.GEMINI_API_KEY = 'AIzaFAKEKEYFORTESTSONLY1234567890';
  const res = await request(createApp()).post('/api/chat').send({ message: 'hi' });
  assert.equal(res.status, 200);
  assert.equal(geminiMock.models[0].systemInstruction, chat.SYSTEM_PROMPT);
});

test('proposed dates are labelled proposed; the five bathing dates are not served as confirmed', async () => {
  const period = facts.getFact('calendar.simhastha2028.period');
  assert.equal(period.verificationStatus, 'proposed');
  assert.equal(period.sourcePublishedAt, '2024-03-11');
  assert.equal(facts.getFact('calendar.simhastha2028.snan_plan').verificationStatus, 'proposed');
  assert.equal(facts.getFact('calendar.simhastha2028.bathing_dates'), undefined, 'unconfirmed dates are not active records');
  assert.ok(facts.getRetiredForAudit().some((r) => r.id === 'retired.calendar.simhastha2028_bathing_dates'));
  const faq = (await request(createApp()).get('/api/faq')).body;
  const text = scan(faq);
  assert.ok(!/Mar 27, Apr 13|Apr 13, Apr 27|Chaitra Purnima - March 27|April 13, 2028/.test(text));
  assert.ok(!/crore|tens of millions|62 days/i.test(text));
  const dates = faq.faqs.find((f) => /Amrit Snan dates/.test(f.question)).answer;
  assert.match(dates, /not been officially confirmed/);
  assert.match(dates, /proposed/);
});

test('overdue reviewBy is soft (no validation error); future lastVerified is still an error', () => {
  const data = JSON.parse(JSON.stringify(require('../data/facts.json')));
  assert.deepEqual(facts.validateFacts(data), []);
  const future = JSON.parse(JSON.stringify(data));
  future.records[0].lastVerified = '2999-01-01';
  assert.ok(facts.validateFacts(future).some((e) => /future/.test(e)));
  assert.deepEqual(facts.validateFacts(data, { today: '2999-01-01' }), []);
  assert.ok(facts.createRegistry({ today: '2999-01-01', warn() {} }).listStaleFacts().length > 0);
});

test('services and faq carry an unverified_inherited verification field and no official-confirmation claims', async () => {
  const app = createApp();
  const svc = (await request(app).get('/api/services')).body;
  const faq = (await request(app).get('/api/faq')).body;
  const one = (await request(app).get(`/api/services/${svc.services[0].id}`)).body;
  for (const b of [svc, faq, one]) {
    assert.equal(b.verification.status, 'unverified_inherited');
    assert.match(b.verification.note, /not officially confirmed/);
  }
  assert.equal(svc.services.length, svc.total);
  for (const b of [svc, faq]) assert.ok(!/officially (verified|confirmed by)|verified by|confirmed working/i.test(scan(b).replace(/not officially confirmed/g, '')));
});

test('emergency/chat error responses keep Phase 1 shapes', async () => {
  const app = createApp();
  const nc = await request(app).post('/api/chat').send({ message: 'hi' });
  assert.equal(nc.status, 503);
  assert.equal(nc.body.code, 'CHAT_NOT_CONFIGURED');
  const bad = await request(app).post('/api/chat').send({ message: 'hi', language: 'xx' });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.code, 'INVALID_REQUEST');
});
