import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_STORAGE_KEY, loadLanguage, saveLanguage } from '../src/utils/language.js';

function stubStorage(initial = {}) {
    const data = { ...initial };
    return {
        data,
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => {
            data[k] = String(v);
        },
    };
}

test('saved language persists and loads back', () => {
    const s = stubStorage();
    assert.equal(saveLanguage('ta', s), true);
    assert.equal(s.data[LANGUAGE_STORAGE_KEY], 'ta');
    assert.equal(loadLanguage(s), 'ta');
});

test('storage key is unchanged', () => {
    assert.equal(LANGUAGE_STORAGE_KEY, 'simhastha_language');
});

test('invalid, missing or throwing storage falls back to en', () => {
    assert.equal(loadLanguage(stubStorage({ [LANGUAGE_STORAGE_KEY]: 'xx' })), 'en');
    assert.equal(loadLanguage(stubStorage()), 'en');
    assert.equal(loadLanguage(null), 'en');
    const throwing = {
        getItem() {
            throw new Error('denied');
        },
        setItem() {
            throw new Error('denied');
        },
    };
    assert.equal(loadLanguage(throwing), 'en');
    assert.equal(saveLanguage('hi', throwing), false);
});

test('saveLanguage rejects unsupported codes', () => {
    const s = stubStorage();
    assert.equal(saveLanguage('xx', s), false);
    assert.deepEqual(s.data, {});
});