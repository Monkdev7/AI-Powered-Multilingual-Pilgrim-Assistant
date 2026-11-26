import test from 'node:test';
import assert from 'node:assert/strict';
import { getLanguageOptions, indexOfLanguage, nextMenuIndex } from '../src/utils/languageMenu.js';
import { SUPPORTED_LANGUAGES, LANGUAGE_CODES } from '../src/i18n/languages.js';
test('menu options list all eight languages with native and English names', () => {
    const options = getLanguageOptions();
    assert.equal(options.length, 8);
    assert.deepEqual(options.map((o) => o.code), LANGUAGE_CODES);
    options.forEach((o, i) => {
        assert.equal(o.nativeName, SUPPORTED_LANGUAGES[i].nativeName);
        assert.equal(o.englishName, SUPPORTED_LANGUAGES[i].englishName);
    });
});
test('indexOfLanguage finds the selected option and defaults to 0', () => {
    const options = getLanguageOptions();
    assert.equal(indexOfLanguage(options, 'pa'), 7);
    assert.equal(indexOfLanguage(options, 'xx'), 0);
});
test('nextMenuIndex handles ArrowDown/ArrowUp/Home/End with clamping', () => {
    assert.equal(nextMenuIndex(0, 'ArrowDown', 8), 1);
    assert.equal(nextMenuIndex(7, 'ArrowDown', 8), 7);
    assert.equal(nextMenuIndex(3, 'ArrowUp', 8), 2);
    assert.equal(nextMenuIndex(0, 'ArrowUp', 8), 0);
    assert.equal(nextMenuIndex(4, 'Home', 8), 0);
    assert.equal(nextMenuIndex(4, 'End', 8), 7);
    assert.equal(nextMenuIndex(4, 'a', 8), 4);
    assert.equal(nextMenuIndex(0, 'ArrowDown', 0), -1);
});