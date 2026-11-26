import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTranslator, findIncompletePluralGroups, pluralCategoriesFor } from '../src/i18n/index.js';

const MARK = (s) => `⟦${s}⟧`;
const en = {
    _meta: { status: 'source' },
    messages: {
        'n.items.one': '{count} item',
        'n.items.other': '{count} items',
        'n.call': 'Call {phone} in {year}',
    },
};
// Arabic-style locales are not supported, so incomplete groups are simulated by omitting 'one'.
const hiComplete = {
    _meta: { status: 'needs-review' },
    messages: { 'n.items.one': '{count} वस्तु', 'n.items.other': '{count} वस्तुएं' },
};
const hiIncomplete = {
    _meta: { status: 'needs-review' },
    messages: { 'n.items.other': '{count} वस्तुएं' },
};
const hiDraft = { _meta: { status: 'draft' }, messages: {} };

function make(hi, opts = {}) {
    const warnings = [];
    const t = createTranslator({ lang: 'hi', catalogs: { en, hi }, warn: (m) => warnings.push(m), ...opts });
    return { t, warnings };
}

test('PluralRules categories for supported locales are one and other', () => {
    for (const l of ['en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'mr-IN', 'gu-IN', 'pa-IN']) {
        assert.deepEqual([...pluralCategoriesFor(l)].sort(), ['one', 'other'], l);
    }
});

test('complete plural group passes and selects by category', () => {
    assert.deepEqual(findIncompletePluralGroups(hiComplete.messages, 'hi-IN'), []);
    const { t, warnings } = make(hiComplete, { dev: true });
    assert.equal(t('n.items', { count: 1 }), '1 वस्तु');
    assert.equal(t('n.items', { count: 5 }), '5 वस्तुएं');
    assert.equal(warnings.length, 0);
});

test('missing category falls back to English (not .other), with dev marker and one warning', () => {
    assert.deepEqual(findIncompletePluralGroups(hiIncomplete.messages, 'hi-IN'), [{ base: 'n.items', missing: ['one'] }]);
    const { t, warnings } = make(hiIncomplete, { dev: true });
    assert.equal(t('n.items', { count: 1 }), MARK('1 item'));
    assert.equal(t('n.items', { count: 1 }), MARK('1 item'));
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /plural category "one"/);
    // the category that exists still works
    assert.equal(t('n.items', { count: 5 }), '5 वस्तुएं');
});

test('missing category in production falls back to English silently, unmarked', () => {
    const { t, warnings } = make(hiIncomplete, { dev: false });
    assert.equal(t('n.items', { count: 1 }), '1 item');
    assert.equal(warnings.length, 0);
});

test('draft stubs with empty messages still pass and show English', () => {
    assert.deepEqual(findIncompletePluralGroups(hiDraft.messages, 'hi-IN'), []);
    const { t } = make(hiDraft, { dev: false });
    assert.equal(t('n.items', { count: 2 }), '2 items');
});

test('t.plural selects the category from the raw count and groups the displayed count', () => {
    const { t } = make(hiComplete);
    assert.equal(t.plural('n.items', 1), '1 वस्तु');
    assert.equal(t.plural('n.items', 100000), '1,00,000 वस्तुएं');
    assert.equal(t.plural('n.items', 1234567), '12,34,567 वस्तुएं');
    const e = createTranslator({ lang: 'en', catalogs: { en } });
    assert.equal(e.plural('n.items', 1), '1 item');
    assert.equal(e.plural('n.items', 100000), '1,00,000 items');
});

test('plain interpolation never regroups numbers; non-count params are unchanged', () => {
    const { t } = make(hiComplete);
    assert.equal(t('n.call', { phone: 7342551234, year: 2028 }), 'Call 7342551234 in 2028');
    assert.equal(t.plural('n.call', 100000, { phone: '0734-2551234', year: 2028 }), 'Call 0734-2551234 in 2028');
    assert.equal(t('n.items', { count: 100000 }), '100000 वस्तुएं');
});

test('warnings are deduplicated per language+key across translator instances sharing a tracker', () => {
    const warned = new Set();
    const warnings = [];
    const mk = (lang) =>
        createTranslator({ lang, catalogs: { en, hi: hiDraft, ta: hiDraft }, dev: true, warn: (m) => warnings.push(m), warned });
    const hi1 = mk('hi');
    hi1('n.call', { phone: 1, year: 2 });
    assert.equal(warnings.length, 1);
    mk('ta')('n.call', { phone: 1, year: 2 });
    assert.equal(warnings.length, 2); // different language warns once
    mk('hi')('n.call', { phone: 1, year: 2 }); // switch back, new instance
    mk('ta')('n.call', { phone: 1, year: 2 });
    assert.equal(warnings.length, 2);
    mk('hi')('n.other.key', {}); // different key
    assert.equal(warnings.length, 3);
});

test('LanguageProvider keeps one tracker across language changes', () => {
    const src = readFileSync(new URL('../src/i18n/LanguageProvider.jsx', import.meta.url), 'utf8');
    assert.match(src, /useRef\(new Set\(\)\)/);
    assert.match(src, /warned: warnedRef\.current/);
});
