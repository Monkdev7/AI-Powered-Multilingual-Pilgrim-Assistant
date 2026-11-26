import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, tk } from '../src/i18n/index.js';

const catalogs = {
    en: {
        _meta: { status: 'source' },
        messages: {
            'a.hello': 'Hello {name}',
            'a.only.en': 'Only English',
            'a.count.one': '{count} item',
            'a.count.other': '{count} items',
            'a.place': 'In {g:ujjain}',
        },
    },
    hi: {
        _meta: { status: 'draft' },
        messages: {
            'a.hello': 'नमस्ते {name}',
            'a.count.one': '{count} वस्तु',
            'a.count.other': '{count} वस्तुएं',
        },
    },
    ta: {
        _meta: { status: 'draft' },
        messages: { 'a.count.one': '{count} பொருள்', 'a.count.other': '{count} பொருட்கள்' },
    },
};

function make(opts) {
    const warnings = [];
    const t = createTranslator({ catalogs, warn: (m) => warnings.push(m), ...opts });
    return { t, warnings };
}

test('English fallback per key, with dev marker and one warning per lang:key', () => {
    const { t, warnings } = make({ lang: 'hi', dev: true });
    assert.equal(t('a.only.en'), '⟦Only English⟧');
    assert.equal(t('a.only.en'), '⟦Only English⟧');
    assert.equal(warnings.filter((w) => w.includes('a.only.en')).length, 1);
    assert.equal(t('a.hello', { name: 'X' }), 'नमस्ते X');
});

test('production fallback is silent and unmarked', () => {
    const { t, warnings } = make({ lang: 'hi', dev: false });
    assert.equal(t('a.only.en'), 'Only English');
    assert.equal(warnings.length, 0);
});

test('markers:false never wraps text', () => {
    const { t } = make({ lang: 'hi', dev: true, markers: false });
    assert.equal(t('a.only.en'), 'Only English');
});

test('catalog still loading shows English silently', () => {
    const { t, warnings } = make({ lang: 'bn', dev: true });
    assert.equal(t('a.hello', { name: 'Ram' }), 'Hello Ram');
    assert.equal(warnings.length, 0);
});

test('failed catalog (null) falls back to English', () => {
    const { t } = make({ lang: 'te', catalogs: { ...catalogs, te: null }, dev: false });
    assert.equal(t('a.hello', { name: 'Ram' }), 'Hello Ram');
});

test('missing key everywhere: marker in dev, key in production', () => {
    assert.equal(make({ dev: true }).t('nope.key'), '⟦missing:nope.key⟧');
    assert.equal(make({ dev: false }).t('nope.key'), 'nope.key');
});

test('unsupported language code behaves as English', () => {
    assert.equal(make({ lang: 'xx' }).t('a.hello', { name: 'A' }), 'Hello A');
});

test('interpolation, missing param and glossary tokens', () => {
    const { t, warnings } = make({ lang: 'en', dev: true });
    assert.equal(t('a.hello', { name: 'Sita' }), 'Hello Sita');
    assert.equal(t('a.hello'), 'Hello {name}');
    assert.equal(warnings.length, 1);
    assert.equal(t('a.place'), 'In Ujjain');
    assert.equal(make({ lang: 'hi' }).t('a.place'), 'In उज्जैन');
});

test('params are inserted as plain text', () => {
    assert.equal(make().t('a.hello', { name: '<b>x</b>' }), 'Hello <b>x</b>');
});

test('plural: English treats 0 as other', () => {
    const { t } = make({ lang: 'en' });
    assert.equal(t('a.count', { count: 0 }), '0 items');
    assert.equal(t('a.count', { count: 1 }), '1 item');
    assert.equal(t('a.count', { count: 2 }), '2 items');
    assert.equal(t('a.count', { count: 5 }), '5 items');
});

test('plural: Hindi treats 0 as one, Tamil 0 as other', () => {
    const hi = make({ lang: 'hi' }).t;
    assert.equal(hi('a.count', { count: 0 }), '0 वस्तु');
    assert.equal(hi('a.count', { count: 1 }), '1 वस्तु');
    assert.equal(hi('a.count', { count: 5 }), '5 वस्तुएं');
    const ta = make({ lang: 'ta' }).t;
    assert.equal(ta('a.count', { count: 0 }), '0 பொருட்கள்');
    assert.equal(ta('a.count', { count: 1 }), '1 பொருள்');
    assert.equal(ta('a.count', { count: 2 }), '2 பொருட்கள்');
});

test('tk is the identity function', () => {
    assert.equal(tk('x.y'), 'x.y');
});