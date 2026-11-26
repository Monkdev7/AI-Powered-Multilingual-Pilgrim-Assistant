'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const facts = require('../data/facts');

const TODAY = '2026-11-26';
const raw = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facts.json'), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const check = (data, opts = {}) => facts.validateFacts(data, { today: TODAY, ...opts });
const base = () => ({
  records: [{
    id: 'emergency.test.1', category: 'emergency', value: '1', label: 'T',
    sourceUrl: 'https://example.gov.in/x', issuingBody: 'Body', sourcePublishedAt: null,
    lastVerified: '2026-11-01', verificationStatus: 'officially_listed', operationallyConfirmed: false,
    verifiedBy: null, reviewBy: '2027-01-01', displayPolicy: 'show',
  }],
  retired: [],
});
const mutate = (fn) => { const d = base(); fn(d.records[0], d); return check(d); };
const has = (errs, re) => assert.ok(errs.some((e) => re.test(e)), `expected ${re} in ${JSON.stringify(errs)}`);

test('baseline fixture is valid', () => assert.deepEqual(check(base()), []));

test('real registry is valid with no human verification', () => {
  const data = raw();
  assert.deepEqual(check(data), []);
  [...data.records, ...data.retired].forEach((r) => {
    assert.equal(r.operationallyConfirmed, false, r.id);
    assert.equal(r.verifiedBy, null, r.id);
    assert.notEqual(r.verificationStatus, 'verified', r.id);
  });
});

test('missing source information is rejected', () => {
  has(mutate((r) => { r.sourceUrl = null; }), /sourceUrl is required/);
  has(mutate((r) => { r.issuingBody = ''; }), /issuingBody is required/);
  has(mutate((r) => { r.lastVerified = null; }), /lastVerified is required/);
  has(mutate((r) => { r.verificationStatus = 'proposed'; r.displayPolicy = 'show_labelled'; r.sourceUrl = null; }), /sourceUrl is required/);
});

test('sourceUrl must be https', () => {
  has(mutate((r) => { r.sourceUrl = 'http://example.gov.in'; }), /https/);
  has(mutate((r) => { r.sourceUrl = 'not a url'; }), /https/);
});

test('invalid status and displayPolicy are rejected', () => {
  has(mutate((r) => { r.verificationStatus = 'confirmed'; }), /invalid verificationStatus/);
  has(mutate((r) => { r.displayPolicy = 'public'; }), /invalid displayPolicy/);
});

test('duplicate ids are rejected, including across the retired section', () => {
  const d = base(); d.records.push(clone(d.records[0]));
  has(check(d), /duplicate id/);
  const d2 = base();
  d2.retired.push({ ...clone(d2.records[0]), verificationStatus: 'retired', displayPolicy: 'never', retiredReason: 'x' });
  has(check(d2), /duplicate id/);
});

test('stale and future dates are rejected with injectable today', () => {
  has(mutate((r) => { r.lastVerified = '2026-11-27'; }), /in the future/);
  assert.deepEqual(mutate((r) => { r.reviewBy = '2026-11-25'; }), [], 'overdue reviewBy is not a validation error');
  assert.ok(facts.isStale(base().records[0], '2027-01-02'));
  assert.ok(!facts.isStale(base().records[0], '2027-01-01'));
  assert.deepEqual(mutate((r) => { r.reviewBy = TODAY; }), []);
  const d = base();
  assert.deepEqual(facts.validateFacts(d, { today: '2026-12-01' }), []);
  assert.deepEqual(facts.validateFacts(d, { today: '2027-01-02' }), []);
  has(facts.validateFacts(d, { today: '2026-10-31' }), /in the future/);
  has(mutate((r) => { r.lastVerified = '2026-02-30'; }), /ISO date/);
});

test('operationallyConfirmed, verifiedBy and verified status are rejected unless fixture allows', () => {
  has(mutate((r) => { r.operationallyConfirmed = true; }), /operationallyConfirmed must be false/);
  has(mutate((r) => { r.verifiedBy = 'someone'; }), /verifiedBy must be null/);
  has(mutate((r) => { r.verificationStatus = 'verified'; }), /reserved/);
  const d = base(); Object.assign(d.records[0], { verificationStatus: 'verified', operationallyConfirmed: true, verifiedBy: 'fixture-human' });
  assert.deepEqual(check(d, { allowHumanVerification: true }), []);
});

test('retired records need displayPolicy never, a reason, and the retired section', () => {
  const mk = (over) => { const d = base(); d.retired.push({ ...clone(d.records[0]), id: 'retired.test.1', verificationStatus: 'retired', displayPolicy: 'never', retiredReason: 'old', ...over }); d.records.length = 1; return check(d); };
  assert.deepEqual(mk({}), []);
  has(mk({ displayPolicy: 'hide' }), /retired records must have displayPolicy never/);
  has(mk({ retiredReason: '' }), /retiredReason/);
  has(mutate((r) => { r.verificationStatus = 'retired'; r.displayPolicy = 'never'; r.retiredReason = 'x'; }), /retired section/);
});

test('awaiting_confirmation and proposed must not use displayPolicy show', () => {
  has(mutate((r) => { r.verificationStatus = 'awaiting_confirmation'; r.displayPolicy = 'show'; }), /awaiting_confirmation must not/);
  has(mutate((r) => { r.verificationStatus = 'proposed'; r.displayPolicy = 'show'; }), /show_labelled/);
});

test('loadFacts fails fast with a clear error on invalid file', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'facts-')), 'bad.json');
  const d = base(); d.records[0].verificationStatus = 'nope';
  fs.writeFileSync(f, JSON.stringify(d));
  assert.throws(() => facts.loadFacts({ file: f, today: TODAY }), /Facts registry invalid[\s\S]*invalid verificationStatus/);
  fs.writeFileSync(f, '{bad');
  assert.throws(() => facts.loadFacts({ file: f }), /could not be read/);
});

test('loaded registry is deeply frozen', () => {
  const r = facts.getFact('emergency.national.112');
  assert.ok(Object.isFrozen(r));
  assert.throws(() => { r.value = '999'; }, TypeError);
  assert.ok(Object.isFrozen(facts.getFact('calendar.simhastha2028.period').value));
});

test('helpers: 112 primary, labels, public and prompt sets', () => {
  const national = facts.getFact('emergency.national.112');
  assert.equal(national.primary, true);
  assert.equal(national.sourceDesignation, 'ONE INDIA ONE EMERGENCY NUMBER 112');
  assert.equal(facts.getFact('emergency.ambulance.102').label, 'Ambulance');
  assert.equal(facts.getFact('emergency.disaster.108').label, 'Disaster Management');
  assert.equal(facts.getFact('emergency.disaster.108').verificationStatus, 'awaiting_confirmation');
  assert.equal(facts.getFact('emergency.disaster.108').displayPolicy, 'hide');
  assert.equal(facts.getFact('emergency.women.1091').value, '1091');
  assert.equal(facts.getFact('retired.emergency.women_1090'), undefined);

  const pub = facts.getPublicFacts();
  const prompt = facts.getPromptFacts();
  assert.ok(pub.every(facts.isPublic));
  assert.ok(prompt.length > 0 && prompt.every((r) => facts.isPublic(r)));
  const json = JSON.stringify(pub) + JSON.stringify(prompt);
  ['0734-2551234', '1800-180-5522', '011-24363260', '14 crore', '"1090"'].forEach((s) => assert.ok(!json.includes(s), s));
  assert.ok(!pub.some((r) => ['awaiting_confirmation', 'retired'].includes(r.verificationStatus)));
  assert.ok(pub.some((r) => r.id === 'calendar.simhastha2028.period' && r.displayPolicy === 'show_labelled'));
  assert.ok(!facts.isClickable(facts.getFact('calendar.simhastha2028.period')));
  assert.ok(!facts.isClickable(facts.getFact('ndrf.hq.011_24363260')));
  assert.ok(facts.isClickable(national));
  assert.equal(facts.getFact('local.sp_office.0734_2527130').group, 'local_directory');
  ['calendar.simhastha2028.bathing_dates', 'calendar.simhastha2028.attendance_claim', 'claim.attendance.30_crore'].forEach((id) => assert.equal(facts.getFact(id), undefined, id));
});

test('retired audit section holds the removed values and links replacements', () => {
  const ret = facts.getRetiredForAudit();
  const vals = ret.map((r) => r.value);
  ['0734-2551234', '1800-180-5522', '1090', '14 crore', '30 crore'].forEach((v) => assert.ok(vals.includes(v), v));
  assert.ok(vals.some((v) => Array.isArray(v) && v.length === 5), 'five unconfirmed bathing dates are kept for audit only');
  ret.forEach((r) => { assert.equal(r.displayPolicy, 'never'); assert.ok(r.retiredReason); });
  assert.equal(ret.find((r) => r.value === '1090').replacedBy, 'emergency.women.1091');
});

test('Ujjain 2019 page date is preserved where that page is a source', () => {
  const r = facts.getFact('emergency.ambulance.102');
  const uj = r.additionalSources.find((s) => s.url === 'https://ujjain.nic.in/en/helpline/');
  assert.equal(uj.sourceLastUpdatedOnPage, '2019-06-29');
});
