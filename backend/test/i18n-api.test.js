// Phase 5: backend content localization (FAQ, emergency, services) for en hi bn ta te mr gu pa.
// Run with: npm test (node:test + supertest). No network calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const request = require('supertest');
const { createApp } = require('../app');
const facts = require('../data/facts');
const { createI18n, validateOverlay, DOMAINS } = require('../i18n');
const { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } = require('../i18n/languages');
const { factTokens, checkString } = require('./helpers/overlay-checks');
const golden = require('./fixtures/english-api-snapshot.json');

const LANGS = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa'];
const NON_EN = LANGS.filter((l) => l !== 'en');
const TODAY = golden.today;
const FAR = '2040-01-01';
const quiet = () => {};
const app = createApp({ today: TODAY, warn: quiet });
const get = (url, a = app) => request(a).get(url);
const I18N_DIR = path.join(__dirname, '..', 'i18n');
const readOverlay = (lang, domain) => JSON.parse(fs.readFileSync(path.join(I18N_DIR, lang, `${domain}.json`), 'utf8'));
const stringsOf = (o) => Object.entries(o).filter(([k]) => k !== '_meta');

// Additive fields that the English (no ?lang) responses gained in Phase 5. Everything else must equal the golden.
const ADDITIVE = {
    '/api/faq*': ['faqs[].categoryId', 'categoryOptions'],
    '/api/services': ['services[].items[].id'],
    '/api/services/:id': ['items[].id'],
};
function stripAdditive(body) {
    const b = JSON.parse(JSON.stringify(body));
    if (Array.isArray(b.faqs)) {
        b.faqs.forEach((f) => delete f.categoryId);
        delete b.categoryOptions;
    }
    if (Array.isArray(b.services)) b.services.forEach((s) => s.items.forEach((i) => delete i.id));
    else if (Array.isArray(b.items)) b.items.forEach((i) => delete i.id);
    return b;
}

const KEPT_FAQ = ['faq.18.answer', 'faq.19.answer', 'faq.20.answer', 'faq.21.answer', 'faq.22.answer', 'faq.24.answer'];
const KEPT_EMERGENCY = [
    ...['lost-found', 'medical'].flatMap((c) => [0, 1, 2, 3, 4].map((i) => `infoCard.${c}.details.${i}`)),
    'note.none',
    'event',
];

// ---------- shared language list ----------
test('backend supported languages are exactly en hi bn ta te mr gu pa and match chat.js', () => {
    assert.deepEqual([...SUPPORTED_LANGUAGES], LANGS);
    assert.deepEqual(Object.keys(LANGUAGE_NAMES), LANGS);
    const chatSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'chat.js'), 'utf8');
    assert.match(chatSource, /require\('\.\.\/i18n\/languages'\)/);
});

// ---------- overlay files ----------
test('overlay files: _meta rules (needs-review, empty reviewer/date, never reviewed; en is source)', () => {
    for (const lang of LANGS) {
        for (const domain of DOMAINS) {
            const meta = readOverlay(lang, domain)._meta;
            assert.ok(meta, `${lang}/${domain}`);
            if (lang === 'en') {
                assert.equal(meta.status, 'source');
            } else {
                assert.equal(meta.status, 'needs-review', `${lang}/${domain}`);
                assert.equal(meta.reviewer, '', `${lang}/${domain}`);
                assert.equal(meta.date, '', `${lang}/${domain}`);
                assert.ok(typeof meta.notes === 'string' && meta.notes.length > 0);
            }
            assert.notEqual(meta.status, 'reviewed');
        }
    }
});

test('overlay key parity: every non-English overlay has the English keys (minus declared keptEnglish), no empty values, placeholder parity', () => {
    for (const domain of DOMAINS) {
        const en = readOverlay('en', domain);
        const enKeys = Object.keys(en).filter((k) => k !== '_meta').sort();
        for (const lang of NON_EN) {
            const over = readOverlay(lang, domain);
            assert.deepEqual(validateOverlay(lang, domain, over, en), [], `${lang}/${domain}`);
            const kept = over._meta.keptEnglish || [];
            const own = Object.keys(over).filter((k) => k !== '_meta');
            assert.deepEqual([...own, ...kept].sort(), enKeys, `${lang}/${domain} keys + keptEnglish must equal the English keys`);
            assert.equal(own.filter((k) => kept.includes(k)).length, 0, 'kept keys must not be translated');
            for (const [k, v] of stringsOf(over)) assert.ok(v.trim() !== '', `${lang}:${k} empty`);
        }
    }
});

test('keptEnglish lists are exactly the unreviewed medical/emergency strings, and the content is not translated', () => {
    for (const lang of NON_EN) {
        assert.deepEqual([...readOverlay(lang, 'faq')._meta.keptEnglish].sort(), [...KEPT_FAQ].sort(), lang);
        assert.deepEqual([...readOverlay(lang, 'emergency')._meta.keptEnglish].sort(), [...KEPT_EMERGENCY].sort(), lang);
        assert.deepEqual(readOverlay(lang, 'services')._meta.keptEnglish, []);
    }
});

test('script and token checks: translated strings carry exactly the English numbers/prices/times/URLs/emoji, native script, Latin only for allow-listed brands', () => {
    const problems = [];
    for (const domain of DOMAINS) {
        const en = readOverlay('en', domain);
        for (const lang of NON_EN) {
            for (const [k, v] of stringsOf(readOverlay(lang, domain))) problems.push(...checkString(lang, `${domain}:${k}`, v, en[k]));
        }
    }
    assert.deepEqual(problems, []);
});

test('token checker catches a changed price, time, URL, phone number, missing emoji and Latin text', () => {
    assert.deepEqual(factTokens('₹20 – ₹150, 7 AM – 10 PM, 0734-2527130 https://ujjain.nic.in'), ['0734', '10', '2527130', '7', 'AM', 'PM', 'https://ujjain.nic.in', '₹150', '₹20'].sort());
    assert.ok(checkString('hi', 'k', '₹20 – ₹160', '₹20 – ₹150').length > 0);
    assert.ok(checkString('hi', 'k', '7 बजे – 10 PM', '7 AM – 10 PM').length > 0);
    assert.ok(checkString('hi', 'k', 'देखें http://ujjain.nic.in', 'See https://ujjain.nic.in').length > 0);
    assert.ok(checkString('hi', 'k', 'सुझाव', '💡 Tip').length > 0);
    assert.ok(checkString('hi', 'k', 'Free', 'Free').length > 0);
    assert.deepEqual(checkString('hi', 'k', '24 घंटे', '24 hours'), []);
});

test('English emergency overlay labels equal the facts registry labels (drift guard); English FAQ/services text is the canonical text', () => {
    const en = readOverlay('en', 'emergency');
    for (const [k, v] of stringsOf(en)) {
        const m = /^contact\.(.+)\.name$/.exec(k);
        if (m) assert.equal(v, facts.getFact(m[1]).label, k);
    }
});

test('glossary terms used in backend overlays agree with the frontend glossary per language (Tamil/Telugu compared by stem)', async () => {
    const { GLOSSARY } = await import(pathToFileURL(path.join(__dirname, '..', '..', 'frontend', 'src', 'i18n', 'glossary.js')).href);
    const TERMS = [
        ['ujjain', /\bUjjain\b/], ['simhastha', /\bSimhastha\b/], ['kumbh', /\bKumbh\b/], ['mahakaleshwar', /\bMahakaleshwar\b/],
        ['kshipra', /\bKshipra\b/], ['bhasmaAarti', /\bBhasma Aarti\b/], ['amritSnan', /\bAmrit Snan\b/], ['ramGhat', /\bRam Ghat\b/], ['ghat', /\b[Gg]hats?\b/],
    ];
    // Agglutinating scripts change the final consonant+virama of a stem when suffixes are added.
    const stem = (s) => (/[\u0BCD\u0C4D]$/.test(s) ? [...s].slice(0, -2).join('') : s);
    const problems = [];
    let checked = 0;
    for (const domain of DOMAINS) {
        const en = readOverlay('en', domain);
        for (const lang of NON_EN) {
            for (const [k, v] of stringsOf(readOverlay(lang, domain))) {
                if (k.startsWith('month.')) continue;
                const english = en[k].replace(/\bRam Ghat\b/g, 'RAMGHAT');
                for (const [id, re] of TERMS) {
                    const text = id === 'ramGhat' ? en[k] : english;
                    if (!re.test(text)) continue;
                    checked += 1;
                    if (!v.includes(stem(GLOSSARY[id][lang]))) problems.push(`${lang}:${domain}:${k} lacks glossary "${id}" (${GLOSSARY[id][lang]})`);
                }
            }
        }
    }
    assert.ok(checked > 100, `glossary checks ran: ${checked}`);
    assert.deepEqual(problems, []);
});

// ---------- API: all eight languages ----------
test('GET /api/faq for all eight languages: 28 ids 1-28, 5 category ids, same order, localized labels, status needs-review', async () => {
    const base = (await get('/api/faq?lang=en')).body;
    assert.deepEqual(base.faqs.map((f) => f.id), Array.from({ length: 28 }, (_, i) => i + 1));
    const catIds = base.categoryOptions.map((c) => c.id);
    assert.deepEqual(catIds, ['getting-there', 'accommodation', 'religious-events', 'health-safety', 'general']);
    for (const lang of LANGS) {
        const res = await get(`/api/faq?lang=${lang}`);
        assert.equal(res.status, 200, lang);
        const b = res.body;
        assert.equal(b.lang, lang);
        assert.equal(b.total, 28);
        assert.deepEqual(b.faqs.map((f) => f.id), base.faqs.map((f) => f.id));
        assert.deepEqual(b.faqs.map((f) => f.categoryId), base.faqs.map((f) => f.categoryId));
        assert.deepEqual(b.categoryOptions.map((c) => c.id), catIds);
        assert.deepEqual(b.categories, b.categoryOptions.map((c) => c.label));
        b.faqs.forEach((f, i) => {
            assert.equal(typeof f.question, 'string');
            assert.equal(typeof f.answer, 'string');
            assert.equal(f.category, b.categoryOptions.find((c) => c.id === f.categoryId).label);
            assert.ok(!/[{}]/.test(f.question + f.answer), `unfilled placeholder in ${lang} faq ${f.id}`);
            if (lang !== 'en') assert.notEqual(f.question, base.faqs[i].question, `${lang} faq ${f.id} question is translated`);
        });
        assert.equal(b.verification.status, 'unverified_inherited');
        if (lang === 'en') {
            assert.deepEqual(b.translation, { status: 'source', fallbackIds: [] });
        } else {
            assert.equal(b.translation.status, 'needs-review');
            assert.deepEqual([...b.translation.fallbackIds].sort(), [...KEPT_FAQ].sort(), `${lang} fallbacks are exactly the kept-English answers`);
            for (const id of [18, 19, 20, 21, 22, 24]) assert.equal(b.faqs[id - 1].answer, base.faqs[id - 1].answer, `${lang} faq ${id} answer stays English`);
            for (const c of b.categoryOptions) assert.notEqual(c.label, base.categoryOptions.find((x) => x.id === c.id).label);
        }
    }
});

test('GET /api/emergency for all eight languages: identical contact ids, numbers and order; 112 first and primary; metadata preserved', async () => {
    const base = (await get('/api/emergency')).body;
    const ids = base.contacts.map((c) => c.id);
    assert.equal(ids[0], 'emergency.national.112');
    for (const lang of LANGS) {
        const res = await get(`/api/emergency?lang=${lang}`);
        assert.equal(res.status, 200, lang);
        const b = res.body;
        assert.equal(b.lang, lang);
        assert.deepEqual(b.contacts.map((c) => c.id), ids);
        assert.deepEqual(b.contacts.map((c) => c.number), base.contacts.map((c) => c.number));
        assert.equal(b.contacts[0].id, 'emergency.national.112');
        assert.equal(b.contacts[0].number, '112');
        assert.equal(b.contacts[0].primary, true);
        assert.deepEqual(b.contacts.filter((c) => c.primary).map((c) => c.id), ['emergency.national.112']);
        b.contacts.forEach((c, i) => {
            const e = base.contacts[i];
            for (const f of ['id', 'number', 'icon', 'color', 'primary', 'group', 'clickable', 'source']) assert.deepEqual(c[f], e[f], `${lang} ${c.id}.${f}`);
            assert.equal(typeof c.name, 'string');
            assert.equal(typeof c.description, 'string');
            if (lang !== 'en') assert.notEqual(c.name, e.name, `${lang} ${c.id} name is localized`);
        });
        assert.equal(b.lastVerified, base.lastVerified);
        assert.deepEqual(b.infoCards.map((c) => [c.id, c.icon, c.color]), base.infoCards.map((c) => [c.id, c.icon, c.color]));
        for (const [i, card] of b.infoCards.entries()) {
            assert.deepEqual(card.details, base.infoCards[i].details, `${lang} ${card.id} instructions stay English`);
            if (lang !== 'en') assert.notEqual(card.title, base.infoCards[i].title);
        }
        assert.equal(b.event, base.event);
        if (lang !== 'en') {
            assert.equal(b.translation.status, 'needs-review');
            assert.ok(b.translation.fallbackIds.includes('infoCard.medical.details.0'));
            assert.ok(!b.translation.fallbackIds.includes('contact.emergency.national.112.name'));
        }
    }
});

test('GET /api/services and /api/services/:id for all eight languages: 6 categories, 17 stable item ids, same order', async () => {
    const base = (await get('/api/services')).body;
    const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const baseIds = base.services.flatMap((s) => s.items.map((i) => i.id));
    assert.equal(base.services.length, 6);
    assert.equal(baseIds.length, 17);
    // ids are "<category id>.<slug of the English item name>"; the English names come from the golden, not from the overlays.
    const englishNames = golden.cases['/api/services'].body.services.flatMap((s) => s.items.map((i) => `${s.id}.${slug(i.name)}`));
    assert.deepEqual(baseIds, englishNames);
    for (const lang of LANGS) {
        const res = await get(`/api/services?lang=${lang}`);
        assert.equal(res.status, 200, lang);
        const b = res.body;
        assert.equal(b.lang, lang);
        assert.equal(b.total, 6);
        assert.deepEqual(b.services.map((s) => s.id), base.services.map((s) => s.id));
        assert.deepEqual(b.services.flatMap((s) => s.items.map((i) => i.id)), baseIds);
        assert.deepEqual(b.services.map((s) => s.icon), base.services.map((s) => s.icon));
        assert.deepEqual(b.verification.status, 'unverified_inherited');
        if (lang !== 'en') assert.deepEqual(b.translation, { status: 'needs-review', fallbackIds: [] });
        for (const s of b.services) {
            const one = await get(`/api/services/${s.id}?lang=${lang}`);
            assert.equal(one.status, 200);
            assert.deepEqual({ ...one.body, verification: undefined, lang: undefined, translation: undefined }, { ...s, verification: undefined, lang: undefined, translation: undefined });
            assert.equal(one.body.verification.status, 'unverified_inherited');
            assert.equal(one.body.lang, lang);
        }
    }
});

// ---------- preservation ----------
test('services: every translated field carries the same number/price/time tokens as English; charging warning keeps U+26A0 U+FE0F; unverified status kept', async () => {
    const base = (await get('/api/services')).body;
    const flat = (b) => b.services.flatMap((s) => [s.warning, s.tip, ...s.items.flatMap((i) => [i.name, i.detail, i.location, i.timing, i.cost])]);
    const english = flat(base);
    for (const lang of NON_EN) {
        const b = (await get(`/api/services?lang=${lang}`)).body;
        const tr = flat(b);
        assert.equal(tr.length, english.length);
        english.forEach((e, i) => {
            assert.deepEqual(factTokens(tr[i] ?? ''), factTokens(e ?? ''), `${lang} #${i}`);
        });
        const charging = b.services.find((s) => s.id === 'charging');
        assert.ok(charging.warning.startsWith('\u26A0\uFE0F'), lang);
        assert.equal(Buffer.from(charging.warning).subarray(0, 6).toString('hex'), 'e29aa0efb88f', 'U+26A0 U+FE0F bytes');
        assert.equal(b.services.find((s) => s.id === 'accommodation-nearby').tip.startsWith('💡'), true);
        assert.equal(b.verification.status, 'unverified_inherited');
    }
});

test('FAQ: numbers/prices/URLs in every rendered answer equal the English ones; proposed dates come from the registry in every language', async () => {
    const base = (await get('/api/faq')).body;
    const plan = facts.getFact('calendar.simhastha2028.snan_plan').valueParts;
    for (const lang of NON_EN) {
        const b = (await get(`/api/faq?lang=${lang}`)).body;
        b.faqs.forEach((f, i) => {
            assert.deepEqual(factTokens(f.question), factTokens(base.faqs[i].question), `${lang} q${f.id}`);
            assert.deepEqual(factTokens(f.answer), factTokens(base.faqs[i].answer), `${lang} a${f.id}`);
        });
        const a12 = b.faqs[11].answer;
        assert.ok(a12.includes(`${plan.shahi}`) && a12.includes(`${plan.parv}`) && a12.includes('2028') && a12.includes('https://ujjain.nic.in'));
        assert.ok(b.faqs[22].answer.includes('27') && b.faqs[22].answer.includes('2028'));
    }
    assert.match(base.faqs[11].answer, /3 Shahi Snan and 7 Parv Snan during 9 April to 8 May 2028 \(proposed, awaiting official confirmation/);
    assert.match(base.faqs[22].answer, /27 March to 27 May 2028 \(planned period, proposed and awaiting official confirmation\)/);
});

test('emergency: official source URLs, status, lastVerified and phone numbers are identical across languages; no retired/hidden numbers in any response', async () => {
    const base = (await get('/api/emergency')).body;
    const retired = [/0734-?2551234/, /1800-?180-?5522/, /(?<!\d)1090(?!\d)/, /(?<!\d)108(?!\d)/, /011-?24363260/, /24363260/];
    for (const lang of LANGS) {
        const raw = (await get(`/api/emergency?lang=${lang}`)).text;
        for (const re of retired) assert.ok(!re.test(raw), `${lang} leaked ${re}`);
        const b = JSON.parse(raw);
        for (const [i, c] of b.contacts.entries()) {
            assert.equal(c.source.url, base.contacts[i].source.url);
            assert.equal(c.source.status, 'officially_listed');
            assert.equal(c.source.lastVerified, base.contacts[i].source.lastVerified);
            assert.equal(c.clickable, base.contacts[i].clickable);
            assert.equal(facts.getFact(c.id).value, c.number);
        }
        for (const ep of ['/api/faq', '/api/services']) {
            const text = (await get(`${ep}?lang=${lang}`)).text;
            for (const re of [/0734-?2551234/, /1800-?180-?5522/, /(?<!\d)1090(?!\d)/, /011-?24363260/]) assert.ok(!re.test(text), `${lang} ${ep} leaked ${re}`);
        }
    }
    const sp = base.contacts.find((c) => c.id === 'local.sp_office.0734_2527130');
    assert.equal(sp.group, 'local_directory');
    assert.equal(sp.primary, false);
});

test('emergency: kept-English notes are not weakened: localized note still says not independently call-tested via the same token set and English fallback exists', async () => {
    const en = (await get('/api/emergency?lang=en')).body;
    assert.match(en.note, /not been independently call-tested/);
    assert.match(en.note, /not event-specific/);
    for (const lang of NON_EN) {
        const b = (await get(`/api/emergency?lang=${lang}`)).body;
        assert.ok(b.note.length > 20 && b.note !== en.note);
        assert.ok(!/\bverified\b|\bconfirmed\b/i.test(b.note));
    }
    const none = createApp({ facts: { ...facts.defaultRegistry, getPublicFacts: () => [] }, warn: quiet });
    const empty = await get('/api/emergency?lang=hi', none);
    assert.equal(empty.body.contacts.length, 0);
    assert.equal(empty.body.note, 'No emergency numbers are currently available here. Please contact the official local authorities.');
});

// ---------- search / filter ----------
test('localized FAQ search: a Hindi query finds the expected FAQ, an English query still works with ?lang=hi', async () => {
    const hi = (await get(`/api/faq?lang=hi&search=${encodeURIComponent('ज्योतिर्लिंग')}`)).body;
    const ids = hi.faqs.map((f) => f.id);
    for (const id of [13, 17, 25]) assert.ok(ids.includes(id), `hindi search finds ${id}`);
    const enHeat = golden.cases['/api/faq?search=heat'].body.faqs.map((f) => f.id);
    for (const lang of NON_EN) {
        const res = (await get(`/api/faq?lang=${lang}&search=heat`)).body;
        assert.deepEqual(res.faqs.map((f) => f.id), enHeat, `${lang} English query`);
        assert.equal(res.total, enHeat.length);
    }
    const none = (await get(`/api/faq?lang=hi&search=${encodeURIComponent('zzzz-no-match')}`)).body;
    assert.equal(none.total, 0);
    assert.deepEqual(none.faqs, []);
    assert.equal(none.categoryOptions.length, 5);
    const blank = (await get('/api/faq?lang=hi&search=%20%20')).body;
    assert.equal(blank.total, 28);
});

test('FAQ category filtering: stable id, old English name, localized label and All', async () => {
    const hs = [18, 19, 20, 21, 22];
    const idsOf = (b) => b.faqs.map((f) => f.id);
    assert.deepEqual(idsOf((await get('/api/faq?category=health-safety')).body), hs);
    assert.deepEqual(idsOf((await get(`/api/faq?category=${encodeURIComponent('Health & Safety')}`)).body), hs);
    for (const lang of LANGS) {
        const label = (await get(`/api/faq?lang=${lang}`)).body.categoryOptions.find((c) => c.id === 'health-safety').label;
        assert.deepEqual(idsOf((await get(`/api/faq?lang=${lang}&category=health-safety`)).body), hs, `${lang} id`);
        assert.deepEqual(idsOf((await get(`/api/faq?lang=${lang}&category=${encodeURIComponent('Health & Safety')}`)).body), hs, `${lang} english name`);
        assert.deepEqual(idsOf((await get(`/api/faq?lang=${lang}&category=${encodeURIComponent(label)}`)).body), hs, `${lang} localized label`);
        assert.equal((await get(`/api/faq?lang=${lang}&category=All`)).body.total, 28);
        assert.equal((await get(`/api/faq?lang=${lang}&category=${encodeURIComponent('Nope')}`)).body.total, 0);
    }
    const combined = (await get('/api/faq?lang=hi&category=general&search=ATM')).body;
    assert.deepEqual(idsOf(combined), [27]);
    // every category id selects exactly its own FAQs
    const all = (await get('/api/faq')).body;
    for (const c of all.categoryOptions) {
        const sel = (await get(`/api/faq?category=${c.id}`)).body;
        assert.ok(sel.total > 0);
        assert.ok(sel.faqs.every((f) => f.categoryId === c.id && f.category === c.label));
    }
});

// ---------- English API compatibility ----------
test('English API compatibility: no-?lang responses equal the golden snapshot except the declared additive fields (and key order is unchanged)', async () => {
    assert.deepEqual(Object.keys(ADDITIVE), ['/api/faq*', '/api/services', '/api/services/:id']);
    for (const [url, expected] of Object.entries(golden.cases)) {
        const res = await get(url);
        assert.equal(res.status, expected.status, url);
        assert.equal(JSON.stringify(stripAdditive(res.body)), JSON.stringify(expected.body), `${url} must equal the golden byte for byte after removing additive fields`);
        // additive fields are present on the success responses
        if (url.startsWith('/api/faq')) {
            assert.ok(res.body.faqs.every((f) => typeof f.categoryId === 'string'));
            assert.equal(res.body.categoryOptions.length, 5);
            assert.ok(!('lang' in res.body) && !('translation' in res.body), 'no localization metadata without ?lang');
        }
        if (url === '/api/services' || url === '/api/services/food') assert.ok(!('lang' in res.body) && !('translation' in res.body));
        if (url === '/api/emergency') assert.deepEqual(res.body, expected.body, 'emergency has no additive fields');
    }
});

test('?lang=en equals the no-?lang response plus lang and translation', async () => {
    for (const url of ['/api/faq', '/api/faq?search=heat', '/api/emergency', '/api/services', '/api/services/food']) {
        const plain = (await get(url)).body;
        const sep = url.includes('?') ? '&' : '?';
        const en = (await get(`${url}${sep}lang=en`)).body;
        assert.deepEqual(en.translation, { status: 'source', fallbackIds: [] }, url);
        assert.equal(en.lang, 'en');
        const { lang, translation, ...rest } = en;
        assert.deepEqual(rest, plain, url);
    }
});

// ---------- errors ----------
test('unsupported or malformed ?lang returns 400 INVALID_REQUEST with the supported list on all three GET endpoints', async () => {
    const bad = ['xx', 'hi-IN', 'english', '', ' ', 'hi%2Cen', 'h', 'lang', '%00', 'hi&lang=en', 'en&lang=hi'];
    const urls = ['/api/faq', '/api/emergency', '/api/services', '/api/services/food', '/api/services/nope'];
    for (const base of urls) {
        for (const v of bad) {
            const sep = base.includes('?') ? '&' : '?';
            const res = await get(`${base}${sep}lang=${v}`);
            assert.equal(res.status, 400, `${base} lang=${JSON.stringify(v)}`);
            assert.deepEqual(res.body, { error: 'Unsupported language', code: 'INVALID_REQUEST', supported: LANGS });
        }
        for (const q of ['lang=hi&lang=en', 'lang[]=hi', 'lang[a]=hi']) {
            const res = await get(`${base}?${q}`);
            assert.equal(res.status, 400, `${base}?${q}`);
            assert.equal(res.body.code, 'INVALID_REQUEST');
        }
    }
});

test('documented ?lang normalization: trim and lowercase are accepted', async () => {
    for (const v of ['HI', 'Hi', '%20hi%20', 'TA']) {
        const res = await get(`/api/emergency?lang=${v}`);
        assert.equal(res.status, 200, v);
        assert.equal(res.body.lang, decodeURIComponent(v).trim().toLowerCase());
    }
});

test('Phase 1 error shapes are unchanged, with and without ?lang', async () => {
    const nf = await get('/api/services/nope');
    assert.equal(nf.status, 404);
    assert.deepEqual(nf.body, { error: 'Service category not found' });
    assert.deepEqual((await get('/api/services/nope?lang=hi')).body, { error: 'Service category not found' });
    const route = await get('/api/nothing-here?lang=hi');
    assert.equal(route.status, 404);
    assert.deepEqual(route.body, { error: 'Route not found' });
    assert.equal((await get('/api/health')).status, 200);
});

// ---------- fallback ----------
test('missing translations fall back to English per key, are listed in fallbackIds, never marked reviewed, and warn once per key', async () => {
    const warnings = [];
    const partial = {
        _meta: { status: 'reviewed', reviewer: 'x', date: '2026-01-01', notes: '', keptEnglish: ['faq.20.answer'] },
        'category.general': 'सामान्य',
        'faq.1.question': 'अनुवादित प्रश्न',
        'faq.2.question': '',
        'faq.3.question': 'bad {extra} placeholder',
    };
    const i18n = createI18n({ overlays: { hi: { faq: partial } }, warn: (m) => warnings.push(m) });
    const a = createApp({ today: TODAY, warn: quiet, i18n });
    const en = (await get('/api/faq')).body;
    const res = (await get('/api/faq?lang=hi', a)).body;
    assert.equal(res.faqs[0].question, 'अनुवादित प्रश्न');
    assert.equal(res.faqs[1].question, en.faqs[1].question, 'empty translation falls back');
    assert.equal(res.faqs[2].question, en.faqs[2].question, 'placeholder mismatch falls back');
    assert.equal(res.faqs[3].question, en.faqs[3].question);
    assert.equal(res.categoryOptions.find((c) => c.id === 'general').label, 'सामान्य');
    assert.equal(res.categoryOptions.find((c) => c.id === 'accommodation').label, 'Accommodation');
    assert.equal(res.translation.status, 'needs-review', 'a partial overlay is never reported as reviewed');
    for (const k of ['faq.2.question', 'faq.3.question', 'faq.4.question', 'faq.20.answer', 'category.accommodation', 'verification.note']) {
        assert.ok(res.translation.fallbackIds.includes(k), k);
    }
    assert.ok(!res.translation.fallbackIds.includes('faq.1.question'));
    assert.ok(!res.translation.fallbackIds.includes('category.general'));
    const first = warnings.length;
    assert.ok(first > 0);
    assert.ok(!warnings.some((w) => w.includes('faq.20.answer')), 'deliberately kept keys do not warn');
    await get('/api/faq?lang=hi', a);
    assert.equal(warnings.length, first, 'warnings fire once per lang:key');
    // the other languages and domains still fall back completely to English without errors
    const other = (await get('/api/emergency?lang=hi', a)).body;
    assert.equal(other.contacts[0].name, 'National emergency');
    assert.equal(other.translation.status, 'needs-review');
});

test('a fully reviewed overlay with no fallbacks is the only way to report reviewed (none of the shipped overlays qualifies)', () => {
    const reviewed = (lang, domain) => ({ ...readOverlay(lang, domain), _meta: { ...readOverlay(lang, domain)._meta, status: 'reviewed', keptEnglish: [] } });
    const overlays = { hi: { faq: reviewed('hi', 'faq'), emergency: reviewed('hi', 'emergency'), services: reviewed('hi', 'services') } };
    const i18n = createI18n({ overlays, warn: quiet });
    const s = i18n.scope('hi', 'services');
    s.t('category.food.name');
    assert.equal(s.status(), 'reviewed');
    const f = i18n.scope('hi', 'faq');
    f.t('faq.18.answer');
    assert.equal(f.status(), 'needs-review');
    for (const lang of NON_EN) for (const d of DOMAINS) assert.notEqual(readOverlay(lang, d)._meta.status, 'reviewed');
});

test('the default i18n instance never warns in a normal run (warnings are dev-only)', async () => {
    const original = console.warn;
    const seen = [];
    console.warn = (...a) => seen.push(a.join(' '));
    try {
        await get('/api/faq?lang=ta');
        await get('/api/emergency?lang=te');
    } finally {
        console.warn = original;
    }
    assert.deepEqual(seen, []);
});

// ---------- stale facts and safety rules in localized responses ----------
test('stale-fact behavior is unchanged in every language: non-exempt records hidden, 112 stays primary, calendar answers fall back to "not verified"', async () => {
    const stale = createApp({ today: FAR, warn: quiet });
    for (const lang of LANGS) {
        const em = (await get(`/api/emergency?lang=${lang}`, stale)).body;
        assert.deepEqual(em.contacts.map((c) => c.id), ['emergency.national.112'], lang);
        assert.equal(em.contacts[0].primary, true);
        assert.equal(em.contacts[0].number, '112');
        const faq = (await get(`/api/faq?lang=${lang}`, stale)).body;
        const fresh = (await get(`/api/faq?lang=${lang}`)).body;
        assert.notEqual(faq.faqs[11].answer, fresh.faqs[11].answer, `${lang} faq 12 uses the no-dates text`);
        assert.notEqual(faq.faqs[22].answer, fresh.faqs[22].answer, `${lang} faq 23 uses the no-period text`);
        assert.ok(!/\d{1,2} (April|May|March)/i.test(faq.faqs[11].answer + faq.faqs[22].answer));
        assert.ok(faq.faqs[11].answer.includes('https://ujjain.nic.in'));
        assert.ok(faq.faqs.every((f) => !/[{}]/.test(f.question + f.answer)));
    }
    const en = (await get('/api/faq', stale)).body;
    assert.match(en.faqs[11].answer, /not currently verified in this app/);
    assert.ok(!/3 Shahi|9 April|8 May/.test(en.faqs[11].answer));
    assert.match(en.faqs[22].answer, /dates are not currently verified in this app/);
});

test('responses never claim verified or call-tested status; English proposed/unconfirmed wording is intact', async () => {
    for (const lang of [null, ...LANGS]) {
        const q = lang ? `?lang=${lang}` : '';
        const faqText = (await get(`/api/faq${q}`)).text;
        const svcText = (await get(`/api/services${q}`)).text;
        for (const text of [faqText, svcText]) {
            assert.ok(!/\bverified\b/i.test(text) || lang !== null, 'no "verified" claim in English output');
            assert.ok(!/call-tested/i.test(text));
        }
        const em = (await get(`/api/emergency${q}`)).body;
        assert.ok(em.contacts.every((c) => c.source.status === 'officially_listed'));
    }
    const en = (await get('/api/faq')).body;
    assert.match(en.faqs[11].answer, /proposed, awaiting official confirmation/);
    assert.match(en.faqs[5].answer, /have not been officially confirmed yet/);
    assert.match(en.faqs[13].answer, /has not been officially confirmed yet/);
});