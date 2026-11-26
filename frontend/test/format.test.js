import test from 'node:test';
import assert from 'node:assert/strict';
import { createFormatter, TIME_ZONE } from '../src/i18n/format.js';
import { LANGUAGE_CODES } from '../src/i18n/languages.js';

test('time zone is Asia/Kolkata', () => {
    assert.equal(TIME_ZONE, 'Asia/Kolkata');
});

test('numbers use Indian grouping and Latin digits in every language', () => {
    for (const code of LANGUAGE_CODES) {
        const f = createFormatter(code);
        assert.equal(f.formatNumber(100000), '1,00,000', code);
        assert.equal(f.formatNumber(1234567), '12,34,567', code);
        assert.equal(f.formatNumber(500), '500', code);
        assert.match(f.formatNumber(100000), /^[0-9,]+$/, code);
    }
});

test('dates and times use Latin digits', () => {
    for (const code of LANGUAGE_CODES) {
        const f = createFormatter(code);
        const d = f.formatDate('2028-03-27', { year: 'numeric', month: 'numeric', day: 'numeric' });
        assert.match(d, /^[\x00-\x7F]*$/, `${code}: ${d}`);
        assert.ok(d.includes('27') && d.includes('2028'), `${code}: ${d}`);
        assert.match(f.formatTime('2028-03-27T10:05:00Z').replace(/[^\d]/g, ''), /^\d+$/);
    }
});

test('English date keeps the existing order and date-only strings do not shift', () => {
    const f = createFormatter('en');
    assert.equal(f.formatDate('2028-03-27'), 'Mar 27');
    assert.equal(f.formatDate('2028-03-27', { month: 'short', day: 'numeric', year: 'numeric' }), 'Mar 27, 2028');
    assert.equal(f.formatDate('2028-05-27'), 'May 27');
});

test('time is 12-hour in Asia/Kolkata', () => {
    const f = createFormatter('en');
    // 10:05 UTC is 15:35 in Kolkata
    assert.match(f.formatTime('2028-03-27T10:05:00Z'), /^3:35\s?PM$/i);
});