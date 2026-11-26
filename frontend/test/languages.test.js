import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGUAGES, LANGUAGE_CODES, DEFAULT_LANGUAGE, isSupportedLanguage, getLanguage } from '../src/i18n/languages.js';

const EXPECTED = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa'];

test('exactly eight supported language codes in order', () => {
    assert.deepEqual([...LANGUAGE_CODES], EXPECTED);
    assert.equal(SUPPORTED_LANGUAGES.length, 8);
    assert.equal(new Set(LANGUAGE_CODES).size, 8);
    assert.equal(DEFAULT_LANGUAGE, 'en');
});

test('isSupportedLanguage accepts only the eight codes', () => {
    for (const code of EXPECTED) assert.equal(isSupportedLanguage(code), true);
    for (const bad of ['xx', 'EN', '', null, undefined, 5, 'toString', '__proto__', ['en']]) {
        assert.equal(isSupportedLanguage(bad), false);
    }
});

test('native names use the declared script', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
        const re = new RegExp(`^[\\p{Script=${lang.script}}\\p{Script=Common}\\p{M}\\s]+$`, 'u');
        assert.match(lang.nativeName, re, lang.code);
    }
});

test('getLanguage falls back to English', () => {
    assert.equal(getLanguage('hi').englishName, 'Hindi');
    assert.equal(getLanguage('xx').code, 'en');
});