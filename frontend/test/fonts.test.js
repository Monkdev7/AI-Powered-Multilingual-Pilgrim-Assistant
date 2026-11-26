import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages.js';

const read = (p) => readFileSync(new URL(p, import.meta.url));
const css = read('../src/index.css').toString('utf8');
const notice = read('../public/fonts/NOTICE.md').toString('utf8');

const FACE_RE = /@font-face\s*\{([^}]*)\}/g;
const faces = [...css.matchAll(FACE_RE)].map((m) => m[1]);

test('six @font-face rules, each swap + unicode-range + one variable weight range', () => {
    assert.equal(faces.length, 6);
    for (const f of faces) {
        assert.match(f, /font-display:\s*swap/);
        assert.match(f, /unicode-range:\s*U\+/);
        assert.match(f, /font-weight:\s*400 700/);
        assert.match(f, /format\('woff2'\)/);
    }
});

test('every referenced font file exists, is real WOFF2 (wOF2) and is listed in NOTICE', () => {
    for (const f of faces) {
        const file = f.match(/url\('\/fonts\/([^']+)'\)/)[1];
        const url = new URL(`../public/fonts/${file}`, import.meta.url);
        assert.ok(existsSync(url), file);
        assert.ok(statSync(url).size > 10000, `${file} too small`);
        assert.equal(readFileSync(url).subarray(0, 4).toString('ascii'), 'wOF2', file);
        assert.ok(notice.includes(file), `${file} missing from NOTICE.md`);
        assert.ok(notice.includes(String(statSync(url).size)), `${file} size missing from NOTICE.md`);
    }
});

test('each script has an OFL licence file with a copyright line', () => {
    for (const s of ['devanagari', 'bengali', 'tamil', 'telugu', 'gujarati', 'gurmukhi']) {
        const txt = read(`../public/fonts/OFL-${s}.txt`).toString('utf8');
        assert.match(txt, /^Copyright 20\d\d The Noto Project Authors/m, s);
        assert.match(txt, /SIL OPEN FONT LICENSE Version 1\.1/i, s);
    }
});

test('CSS defines a lang rule with the right script font first for every non-English language', () => {
    const familyOf = { Devanagari: 'Noto Sans Devanagari', Bengali: 'Noto Sans Bengali', Tamil: 'Noto Sans Tamil', Telugu: 'Noto Sans Telugu', Gujarati: 'Noto Sans Gujarati', Gurmukhi: 'Noto Sans Gurmukhi' };
    for (const l of SUPPORTED_LANGUAGES) {
        if (l.code === 'en') continue;
        const rule = css.split('\n').find((line) => new RegExp(`:lang\\(${l.code}\\)[^{]*\\{`).test(line) && line.includes('--font-stack'));
        assert.ok(rule, `${l.code} lang rule`);
        assert.ok(rule.includes(`--font-stack: '${familyOf[l.script]}'`), `${l.code} stack starts with ${familyOf[l.script]}`);
        assert.ok(css.includes(`:lang(${l.code})`) && /line-height:\s*1\.6/.test(css), `${l.code} line-height`);
        assert.ok(faces.some((f) => f.includes(`font-family: '${familyOf[l.script]}'`)), `${l.code} @font-face`);
    }
});

test('tailwind sans stack lists every script font; no npm font dependency', () => {
    const tw = read('../tailwind.config.js').toString('utf8');
    for (const n of ['Inter', 'Noto Sans Devanagari', 'Noto Sans Bengali', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Gujarati', 'Noto Sans Gurmukhi']) {
        assert.ok(tw.includes(`'${n}'`), n);
    }
    const pkg = JSON.parse(read('../package.json').toString('utf8'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    assert.deepEqual(deps.filter((d) => /font|noto/i.test(d)), []);
});
