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
for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\b(?:t|tk)\(\s*['"]([^'"]+)['"]/g)) USED.add(m[1]);
}

const hasKey = (key) =>
    key in en.messages || `${key}.one` in en.messages || `${key}.other` in en.messages;

test('every key used in source exists in English', () => {
    const missing = [...USED].filter((k) => !hasKey(k));
    assert.deepEqual(missing, []);
});

test('every English key is referenced in source', () => {
    const base = (k) => k.replace(/\.(one|other)$/, '');
    const unused = Object.keys(en.messages).filter((k) => !USED.has(k) && !USED.has(base(k)));
    assert.deepEqual(unused, []);
});