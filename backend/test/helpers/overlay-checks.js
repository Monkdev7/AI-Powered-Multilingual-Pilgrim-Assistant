'use strict';
// Shared checks for translation overlays (used by i18n-api.test.js).
// A "fact token" is anything numeric or addressable in a string: URLs, domains, amounts, numbers, AM/PM.
// Translated strings must carry exactly the English tokens (same Latin digits and grouping), nothing extra.

const URL_RE = /https?:\/\/[^\s)]+/g;
const DOMAIN_RE = /\b[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+\b/g;
const NUMBER_RE = /₹?\d+(?:,\d{2,3})*(?:\.\d+)?/g;
const MERIDIEM_RE = /\b(?:AM|PM)\b/g;
const PLACEHOLDER_RE = /\{[A-Za-z][A-Za-z0-9]*\}/g;
const EMOJI_RE = /\p{Extended_Pictographic}\uFE0F?/gu;

function factTokens(s) {
    let rest = String(s).replace(PLACEHOLDER_RE, ' ');
    const urls = rest.match(URL_RE) || [];
    rest = rest.replace(URL_RE, ' ');
    const domains = rest.match(DOMAIN_RE) || [];
    rest = rest.replace(DOMAIN_RE, ' ');
    const meridiem = rest.match(MERIDIEM_RE) || [];
    const numbers = rest.match(NUMBER_RE) || [];
    return [...urls, ...domains, ...meridiem, ...numbers].sort();
}
const emojiTokens = (s) => (String(s).match(EMOJI_RE) || []).sort();

// Latin words allowed inside translated text: brand names, acronyms, units and official proper names.
const LATIN_ALLOW = new Set([
    'am', 'pm', 'sbi', 'hdfc', 'icici', 'pnb', 'upi', 'google', 'pay', 'phonepe', 'paytm', 'irctc', 'mp', 'tourism',
    'state', 'roadways', 'rbi', 'isi', 'ro', 'iskcon', 'iata', 'idr', 'indigo', 'air', 'india', 'spicejet', 'nh',
    'atm', 'atms', 'mah', 'my', 'spf', 'ors',
]);

const SCRIPT_RANGES = {
    hi: [0x0900, 0x097f], mr: [0x0900, 0x097f], bn: [0x0980, 0x09ff], ta: [0x0b80, 0x0bff],
    te: [0x0c00, 0x0c7f], gu: [0x0a80, 0x0aff], pa: [0x0a00, 0x0a7f],
};
const INDIC_RANGES = [[0x0900, 0x097f], [0x0980, 0x09ff], [0x0a00, 0x0a7f], [0x0a80, 0x0aff], [0x0b80, 0x0bff], [0x0c00, 0x0c7f]];
const inRange = (cp, [lo, hi]) => cp >= lo && cp <= hi;

function latinWords(s) {
    const rest = String(s).replace(PLACEHOLDER_RE, ' ').replace(URL_RE, ' ').replace(DOMAIN_RE, ' ');
    return rest.match(/[A-Za-z]+/g) || [];
}

// Returns error strings for one translated string against its English source.
function checkString(lang, key, translated, english) {
    const errors = [];
    const where = `${lang}:${key}`;
    if (typeof translated !== 'string' || translated.trim() === '') return [`${where}: empty`];
    const a = factTokens(english);
    const b = factTokens(translated);
    if (JSON.stringify(a) !== JSON.stringify(b)) errors.push(`${where}: fact tokens differ. en=${JSON.stringify(a)} tr=${JSON.stringify(b)}`);
    const ea = emojiTokens(english);
    const eb = emojiTokens(translated);
    if (JSON.stringify(ea) !== JSON.stringify(eb)) errors.push(`${where}: emoji differ`);
    if (english.startsWith('\u26A0\uFE0F') && !translated.startsWith('\u26A0\uFE0F')) errors.push(`${where}: must keep the leading U+26A0 U+FE0F`);
    for (const w of latinWords(translated)) if (!LATIN_ALLOW.has(w.toLowerCase())) errors.push(`${where}: unexpected Latin word "${w}"`);
    const range = SCRIPT_RANGES[lang];
    const cps = [...translated].map((c) => c.codePointAt(0));
    const hasScript = cps.some((cp) => inRange(cp, range));
    // U+0964/U+0965 (danda) is shared by all Indic scripts.
    const otherIndic = cps.some((cp) => cp !== 0x0964 && cp !== 0x0965 && INDIC_RANGES.some((r) => inRange(cp, r)) && !inRange(cp, range));
    if (otherIndic) errors.push(`${where}: contains another Indic script`);
    const plain = latinWords(english).some((w) => !LATIN_ALLOW.has(w.toLowerCase()));
    if (plain && !hasScript) errors.push(`${where}: no ${lang} script characters`);
    return errors;
}

module.exports = { factTokens, emojiTokens, checkString, LATIN_ALLOW, SCRIPT_RANGES, latinWords };
