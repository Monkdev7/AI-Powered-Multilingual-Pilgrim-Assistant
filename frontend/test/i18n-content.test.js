import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_CODES, SUPPORTED_LANGUAGES } from '../src/i18n/languages.js';
import { loadLocale, createTranslator } from '../src/i18n/index.js';
import { GLOSSARY } from '../src/i18n/glossary.js';
import { createFormatter } from '../src/i18n/format.js';
import en from '../src/i18n/locales/en.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NON_EN = LANGUAGE_CODES.filter((c) => c !== 'en');
const catalogs = { en };
for (const c of NON_EN) catalogs[c] = await loadLocale(c);

const glossTokens = (s) => (s.match(/\{g:[A-Za-z]\w*\}/g) || []).sort();
// URLs, prices, 2+ digit numbers (phones, years, counts) and dotted/dashed numbers must survive unchanged.
const literals = (s) => (s.replace(/\{[^}]+\}/g, '').match(/https?:\/\/\S+|[\u20B9$]\s?[\d,]+\+?|\d[\d,\-/:.]*\d\+?|\b\d\b/g) || []).sort();

test('all non-English locales are needs-review with empty reviewer/date and never reviewed', () => {
    for (const c of NON_EN) {
        const m = catalogs[c]._meta;
        assert.equal(m.status, 'needs-review', c);
        assert.equal(m.reviewer, '', `${c} reviewer`);
        assert.equal(m.date, '', `${c} date`);
        assert.ok(!/native[- ]speaker (review(ed)?|approved)/i.test(m.notes.replace(/no native-speaker review/i, '')), `${c} notes must not claim review`);
    }
});

test('key parity: every locale has exactly the English keys', () => {
    for (const c of NON_EN) assert.deepEqual(Object.keys(catalogs[c].messages).sort(), Object.keys(en.messages).sort(), c);
});

test('glossary tokens are identical to English in every locale, and all ids exist', () => {
    for (const c of NON_EN) {
        for (const [k, v] of Object.entries(catalogs[c].messages)) {
            const ids = glossTokens(v).map((t) => t.slice(3, -1));
            for (const id of ids) assert.ok(GLOSSARY[id], `${c}:${k} unknown glossary id ${id}`);
        }
    }
});

test('numbers, prices, dates and URLs in English text are preserved in every locale', () => {
    for (const c of NON_EN) {
        for (const [k, v] of Object.entries(catalogs[c].messages)) {
            const want = literals(en.messages[k]);
            const got = literals(v);
            for (const lit of want) assert.ok(got.includes(lit), `${c}:${k} lost ${lit}`);
            assert.equal(/[\u0966-\u096F\u09E6-\u09EF\u0BE6-\u0BEF\u0C66-\u0C6F\u0AE6-\u0AEF\u0A66-\u0A6F]/.test(v), false, `${c}:${k} has non-Latin digits`);
        }
    }
});

test('no emergency number literals in locale files (numbers come from the API through placeholders)', () => {
    const numbers = ['1800-180-5522', '0734-2551234', '011-24363260'];
    for (const c of LANGUAGE_CODES) {
        const src = readFileSync(join(ROOT, 'src/i18n/locales', `${c}.js`), 'utf8');
        for (const n of numbers) assert.ok(!src.includes(n), `${c} contains ${n}`);
        for (const [k, v] of Object.entries(catalogs[c].messages)) {
            assert.ok(!/(^|[^\d])(100|101|108|1090|1098)([^\d]|$)/.test(v.replace(/\{[^}]+\}/g, '')), `${c}:${k} embeds an emergency number`);
        }
    }
});

test('locale files and shipped JSX contain no secret references outside the dev-only demo banner (DevDemoBanner.jsx)', () => {
    const SECRET = /GEMINI_API_KEY|AIza|[\/\s]\.env\b/;
    for (const c of LANGUAGE_CODES) assert.ok(!SECRET.test(readFileSync(join(ROOT, 'src/i18n/locales', `${c}.js`), 'utf8')), c);
    const walk = (d) => readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(jsx?)$/.test(n) ? [p] : [];
    });
    const offenders = walk(join(ROOT, 'src'))
        .filter((f) => !/[\\/]data[\\/]/.test(f) && !/DevDemoBanner\.jsx$/.test(f)) // dev-only banner, loaded only when import.meta.env.DEV (see chat-inc4.test.js)
        .filter((f) => SECRET.test(readFileSync(f, 'utf8')));
    assert.deepEqual(offenders, []);
});

test('translation notice key exists everywhere; English UI text has no notice component output path', () => {
    for (const c of NON_EN) assert.ok(catalogs[c].messages['notice.underReview']);
    const comp = readFileSync(join(ROOT, 'src/components/TranslationNotice.jsx'), 'utf8');
    assert.match(comp, /lang === 'en'/);
});

test('unreviewed emergency, heat and safety content is not in any locale', () => {
    for (const c of NON_EN) {
        for (const k of Object.keys(catalogs[c].messages)) assert.ok(!/heat|safetyTip\d|heatstroke|ors\b/i.test(k.replace('emergency.safetyTips', '')), `${c}:${k}`);
    }
});

test('rendered strings: glossary terms resolve and no raw tokens remain', () => {
    for (const c of NON_EN) {
        const t = createTranslator({ lang: c, catalogs, markers: false });
        for (const k of ['app.footer', 'header.subtitle', 'countdown.live', 'nav.liveMap.description']) {
            const out = t(k, { start: 'x', end: 'y' });
            assert.ok(!/\{g:/.test(out), `${c}:${k}`);
            assert.ok(out.includes(GLOSSARY.ujjain[c]) || k === 'header.subtitle' || k === 'countdown.live' || out.includes(GLOSSARY.ujjain[c]), `${c}:${k} ujjain`);
        }
    }
});

test('plural results line uses Indian grouping and Latin digits in every language', () => {
    for (const c of LANGUAGE_CODES) {
        const t = createTranslator({ lang: c, catalogs, markers: false });
        assert.match(t.plural('services.available', 100000), /1,00,000/, c);
        assert.match(t.plural('faq.results', 1), /\b1\b/, c);
    }
});

test('dates: Asia/Kolkata, Latin digits, no day shift for 2028-03-27 in every language', () => {
    for (const l of SUPPORTED_LANGUAGES) {
        const f = createFormatter(l.code);
        const out = f.formatDate('2028-03-27', { year: 'numeric', month: 'short', day: 'numeric' });
        assert.match(out, /\b27\b/, l.code);
        assert.match(out, /2028/, l.code);
        assert.ok(!/[^\u0000-\u007F\u0900-\u0DFF\u2000-\u206F\s]/.test(out), l.code);
    }
    assert.equal(createFormatter('en').formatDate('2028-03-27', { year: 'numeric', month: 'short', day: 'numeric' }), 'Mar 27, 2028');
});

test('component static scan: stat values and bhasmarti URL unchanged, English-keyed filter value kept', () => {
    const ls = readFileSync(join(ROOT, 'src/components/LocalServices.jsx'), 'utf8');
    for (const v of ["'500+'", "'1,00,000+'", "'40+'"]) assert.ok(ls.includes(v), v);
    assert.ok(readFileSync(join(ROOT, 'src/components/CountdownTimer.jsx'), 'utf8').includes('https://www.bhasmarti.com'));
    const faq = readFileSync(join(ROOT, 'src/components/FAQSection.jsx'), 'utf8');
    assert.match(faq, /useState\('All'\)/);
    assert.match(faq, /selectedCategory !== 'All' \? selectedCategory : undefined/);
});
