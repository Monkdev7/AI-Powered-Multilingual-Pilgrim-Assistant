import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import en from '../src/i18n/locales/en.js';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
function walk(dir) {
    return readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) return name === 'locales' ? [] : walk(p);
        return /\.(js|jsx)$/.test(name) ? [p] : [];
    });
}
const USED = new Set();
// t('key'), tk('key') and t.plural('key', ...)
const CALL_RE = /\b(?:t|tk)\(\s*['"]([^'"]+)['"]|\bt\.plural\(\s*['"]([^'"]+)['"]/g;
for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(CALL_RE)) USED.add(m[1] || m[2]);
}
const hasKey = (key) =>
    key in en.messages || `${key}.one` in en.messages || `${key}.other` in en.messages;
test('every key used in source exists in English', () => {
    const missing = [...USED].filter((k) => !hasKey(k));
    assert.deepEqual(missing, []);
});
test('every English key is referenced in source', () => {
    const base = (k) => k.replace(/\.(one|other)$/, '');
    const unused = Object.keys(en.messages).filter(
        (k) => !USED.has(k) && !USED.has(base(k)),
    );
    assert.deepEqual(unused, []);
});
test('plural keys are used through t.plural, never plain t()', () => {
    const pluralBases = new Set(Object.keys(en.messages).filter((k) => /\.(one|other)$/.test(k)).map((k) => k.replace(/\.(one|other)$/, '')));
    const offenders = [];
    for (const file of walk(SRC)) {
        const text = readFileSync(file, 'utf8');
        for (const m of text.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) if (pluralBases.has(m[1])) offenders.push(`${file}: ${m[1]}`);
    }
    assert.deepEqual(offenders, []);
});
