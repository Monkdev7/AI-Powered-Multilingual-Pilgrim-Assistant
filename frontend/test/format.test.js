import test from 'node:test';
import assert from 'node:assert/strict';
import { createFormatter, TIME_ZONE, isPlaceholderMonth, fallbackMonthName, FALLBACK_MONTH_NAMES } from '../src/i18n/format.js';
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

// Chrome 158 renders Punjabi months as placeholders ("2028 M03 27"). The stub reproduces that output.
function placeholderDateTimeFormat(locale, options) {
    const monthNum = (d) => `M${String(Number(new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'numeric' }).format(d))).padStart(2, '0')}`;
    const parts = (d) => {
        const p = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', day: 'numeric' }).formatToParts(d);
        const year = p.find((x) => x.type === 'year').value;
        const day = p.find((x) => x.type === 'day').value;
        const out = [];
        if (options.year) out.push({ type: 'year', value: year }, { type: 'literal', value: ' ' });
        out.push({ type: 'month', value: monthNum(d) }, { type: 'literal', value: ' ' }, { type: 'day', value: day });
        if (options.timeStyle || options.hour) out.push({ type: 'literal', value: ' ' }, { type: 'hour', value: '05' }, { type: 'literal', value: ':' }, { type: 'minute', value: '30' }, { type: 'literal', value: ' ' }, { type: 'dayPeriod', value: 'PM' });
        return out;
    };
    return { formatToParts: parts, format: (d) => parts(d).map((x) => x.value).join('') };
}
test('placeholder month detection is generic', () => {
    assert.equal(isPlaceholderMonth('M03', 'pa'), true);
    assert.equal(isPlaceholderMonth('Mar', 'ta'), true); // Latin letters in a Tamil locale
    assert.equal(isPlaceholderMonth('மார்.', 'ta'), false);
    assert.equal(isPlaceholderMonth('ਮਾਰਚ', 'pa'), false);
    assert.equal(isPlaceholderMonth('03', 'pa'), false);
    assert.equal(isPlaceholderMonth('Mar', 'en'), false);
});
test('all 12 Punjabi months are mapped, non-empty, Gurmukhi, and match Node Intl when it has them', () => {
    const names = FALLBACK_MONTH_NAMES.pa;
    for (const style of ['short', 'long']) {
        assert.equal(names[style].length, 12);
        assert.equal(new Set(names[style]).size, 12);
        for (let m = 0; m < 12; m++) {
            assert.match(fallbackMonthName('pa', m, style), /^\p{Script=Gurmukhi}+$/u);
        }
    }
    const intl = new Intl.DateTimeFormat('pa-IN', { month: 'long', timeZone: 'UTC' });
    const real = intl.format(new Date(Date.UTC(2028, 2, 15)));
    if (/\p{Script=Gurmukhi}/u.test(real)) {
        for (let m = 0; m < 12; m++) assert.equal(names.long[m], intl.format(new Date(Date.UTC(2028, m, 15))), `month ${m}`);
    }
});
test('placeholder Intl output falls back to the Punjabi mapping, keeping date and Latin digits', () => {
    const f = createFormatter('pa', placeholderDateTimeFormat);
    assert.equal(f.formatDate('2028-03-27'), '27 ਮਾਰਚ');
    assert.equal(f.formatDate('2028-03-27', { year: 'numeric', month: 'short', day: 'numeric' }), '27 ਮਾਰਚ 2028');
    assert.equal(f.formatDate('2028-05-27', { year: 'numeric', month: 'short', day: 'numeric' }), '27 ਮਈ 2028');
    assert.equal(f.formatDate('2028-05-27', { year: 'numeric', month: 'long', day: 'numeric' }), '27 ਮਈ 2028');
    assert.match(f.formatDateTime('2028-03-27T10:05:00Z', { dateStyle: 'medium', timeStyle: 'short' }), /^27 ਮਾਰਚ, 05:30 PM$/);
});
test('the Punjabi fallback does not shift the Asia/Kolkata date', () => {
    const f = createFormatter('pa', placeholderDateTimeFormat);
    // 20:00 UTC on 31 Mar is 01:30 on 1 Apr in Kolkata
    assert.equal(f.formatDate('2028-03-31T20:00:00Z'), '1 ਅਪ੍ਰੈਲ');
    assert.equal(f.formatDate('2028-12-31'), '31 ਦਸੰਬਰ');
});
test('locales without a mapping fall back to English month names', () => {
    const f = createFormatter('ta', placeholderDateTimeFormat);
    assert.equal(f.formatDate('2028-03-27', { year: 'numeric', month: 'short', day: 'numeric' }), '27 Mar 2028');
    assert.equal(f.formatDate('2028-03-27', { month: 'long', day: 'numeric' }), '27 March');
});
test('valid Intl output is kept unchanged', () => {
    const f = createFormatter('hi');
    assert.equal(f.formatDate('2028-03-27'), new Intl.DateTimeFormat('hi-IN-u-nu-latn', { timeZone: TIME_ZONE, month: 'short', day: 'numeric' }).format(new Date('2028-03-27T12:00:00Z')));
    assert.equal(createFormatter('en').formatDate('2028-03-27'), 'Mar 27');
});
test('real Punjabi output (whatever Intl provides here) has a Gurmukhi month, day, year and Latin digits', () => {
    const f = createFormatter('pa');
    for (const [iso, day, name] of [['2028-03-27', '27', 'ਮਾਰਚ'], ['2028-05-27', '27', 'ਮਈ']]) {
        const out = f.formatDate(iso, { year: 'numeric', month: 'short', day: 'numeric' });
        assert.ok(out.includes(day) && out.includes('2028'), out);
        assert.ok(out.includes(name), out);
        assert.doesNotMatch(out, /M\d/);
        assert.match(out.replace(/\p{Script=Gurmukhi}/gu, ''), /^[\x00-\x7F]*$/);
    }
});