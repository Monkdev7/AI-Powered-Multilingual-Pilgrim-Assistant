import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDocumentMetadata } from '../src/i18n/metadata.js';
import { createTranslator } from '../src/i18n/index.js';
import { LANGUAGE_CODES } from '../src/i18n/languages.js';
import en from '../src/i18n/locales/en.js';

function stubDocument({ withMeta = true } = {}) {
    const metas = [];
    const makeMeta = () => ({
        attrs: {},
        setAttribute(k, v) {
            this.attrs[k] = v;
        },
    });
    if (withMeta) {
        const m = makeMeta();
        m.attrs.name = 'description';
        metas.push(m);
    }
    return {
        documentElement: { lang: 'en' },
        title: '',
        head: { appendChild: (m) => metas.push(m) },
        createElement: makeMeta,
        querySelector: (sel) => (sel === 'meta[name="description"]' ? metas.find((m) => m.attrs.name === 'description') || null : null),
        metas,
    };
}

test('lang, title and description update for every language', () => {
    for (const code of LANGUAGE_CODES) {
        const doc = stubDocument();
        const t = createTranslator({ lang: code, catalogs: { en }, markers: false });
        applyDocumentMetadata(code, t, doc);
        assert.equal(doc.documentElement.lang, code);
        assert.equal(doc.title, en.messages['meta.title']);
        assert.equal(doc.metas[0].attrs.content, en.messages['meta.description']);
    }
});

test('creates the description tag when absent', () => {
    const doc = stubDocument({ withMeta: false });
    applyDocumentMetadata('en', createTranslator({ lang: 'en' }), doc);
    assert.equal(doc.metas.length, 1);
    assert.equal(doc.metas[0].attrs.name, 'description');
    assert.ok(doc.metas[0].attrs.content.length > 0);
});

test('title never contains dev markers even in dev mode with a clean translator', () => {
    const doc = stubDocument();
    const t = createTranslator({ lang: 'hi', catalogs: { en, hi: { _meta: {}, messages: {} } }, dev: true, markers: false, warn: () => {} });
    applyDocumentMetadata('hi', t, doc);
    assert.ok(!doc.title.includes('⟦'));
});

test('no-op without a document', () => {
    assert.doesNotThrow(() => applyDocumentMetadata('en', () => '', undefined));
});