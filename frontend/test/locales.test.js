import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_CODES, SUPPORTED_LANGUAGES } from '../src/i18n/languages.js';
import { loadLocale, findIncompletePluralGroups } from '../src/i18n/index.js';
import { GLOSSARY } from '../src/i18n/glossary.js';
import en from '../src/i18n/locales/en.js';

const STATUSES = ['source', 'draft', 'needs-review', 'reviewed'];
const tokens = (s) => (s.match(/\{[^}]+\}/g) || []).sort();
const catalogs = {};
for (const code of LANGUAGE_CODES) catalogs[code] = await loadLocale(code);

test('every locale module loads and has the _meta shape', () => {
    for (const code of LANGUAGE_CODES) {
        const { _meta, messages } = catalogs[code];
        assert.ok(STATUSES.includes(_meta.status), `${code} status`);
        for (const f of ['reviewer', 'date', 'notes']) assert.equal(typeof _meta[f], 'string', `${code} ${f}`);
        assert.equal(typeof messages, 'object');
        if (code === 'en') assert.equal(_meta.status, 'source');
        else assert.notEqual(_meta.status, 'source');
    }
});

test('reviewed status needs a reviewer and a date', () => {
    for (const code of LANGUAGE_CODES) {
        const { _meta } = catalogs[code];
        if (_meta.status === 'reviewed') {
            assert.ok(_meta.reviewer && _meta.date, `${code} reviewed without reviewer/date`);
        }
    }
});

test('no locale has keys that English lacks', () => {
    for (const code of LANGUAGE_CODES) {
        const extra = Object.keys(catalogs[code].messages).filter((k) => !(k in en.messages));
        assert.deepEqual(extra, [], code);
    }
});

test('needs-review and reviewed locales have exactly the English keys', () => {
    for (const code of LANGUAGE_CODES) {
        if (!['needs-review', 'reviewed'].includes(catalogs[code]._meta.status)) continue;
        assert.deepEqual(Object.keys(catalogs[code].messages).sort(), Object.keys(en.messages).sort(), code);
    }
});

test('no empty or whitespace-only translations', () => {
    for (const code of LANGUAGE_CODES) {
        for (const [k, v] of Object.entries(catalogs[code].messages)) {
            assert.equal(typeof v, 'string', `${code}:${k}`);
            assert.ok(v.trim().length > 0, `${code}:${k} is empty`);
        }
    }
});

test('placeholder parity with English', () => {
    for (const code of LANGUAGE_CODES) {
        for (const [k, v] of Object.entries(catalogs[code].messages)) {
            assert.deepEqual(tokens(v), tokens(en.messages[k] ?? ''), `${code}:${k}`);
        }
    }
});

test('plural groups are complete for every PluralRules category (needs-review and reviewed)', () => {
    for (const code of LANGUAGE_CODES) {
        if (!['needs-review', 'reviewed'].includes(catalogs[code]._meta.status)) continue;
        const locale = SUPPORTED_LANGUAGES.find((l) => l.code === code).locale;
        assert.deepEqual(findIncompletePluralGroups(catalogs[code].messages, locale), [], code);
    }
});
test('translations use the language script', () => {
    const scriptOf = Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l.code, l.script]));
    for (const code of LANGUAGE_CODES) {
        if (code === 'en') continue;
        for (const [k, v] of Object.entries(catalogs[code].messages)) {
            const letters = v.replace(/\{[^}]+\}/g, '').replace(/KumbhSaathi|WhatsApp|FAQ|AI/g, '').match(/\p{L}/gu) || [];
            if (letters.length < 8) continue;
            const inScript = letters.filter((c) => new RegExp(`\\p{Script=${scriptOf[code]}}`, 'u').test(c)).length;
            assert.ok(inScript / letters.length >= 0.6, `${code}:${k}`);
        }
    }
});

test('glossary has all eight languages in the right script', () => {
    const scriptOf = Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l.code, l.script]));
    for (const [id, entry] of Object.entries(GLOSSARY)) {
        for (const code of LANGUAGE_CODES) {
            assert.ok(entry[code], `${id}.${code}`);
            if (code === 'en') continue;
            assert.match(entry[code], new RegExp(`^[\\p{Script=${scriptOf[code]}}\\p{Script=Common}\\p{M}\\s.]+$`, 'u'), `${id}.${code}`);
        }
    }
});