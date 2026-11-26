import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages.js';
const read = (p) => readFileSync(new URL(p, import.meta.url));
const css = read('../src/index.css').toString('utf8');
const notice = read('../public/fonts/NOTICE.md').toString('utf8');
const header = read('../src/components/Header.jsx').toString('utf8');
const FACE_RE = /@font-face\s*\{([^}]*)\}/g;
const faces = [...css.matchAll(FACE_RE)].map((m) => m[1]);
const MANTRA_FAMILY = 'Noto Sans Devanagari Mantra';
const fullFaces = faces.filter((f) => !f.includes(MANTRA_FAMILY));
const mantraFace = faces.find((f) => f.includes(MANTRA_FAMILY));
test('six full @font-face rules (woff2, swap, unicode-range, one variable weight range) plus one mantra subset', () => {
    assert.equal(faces.length, 7);
    assert.equal(fullFaces.length, 6);
    assert.ok(mantraFace, 'mantra subset face');
    for (const f of faces) {
        assert.match(f, /font-display:\s*swap/);
        assert.match(f, /unicode-range:\s*U\+/);
        assert.match(f, /font-weight:\s*400 700/);
    }
    for (const f of fullFaces) assert.match(f, /format\('woff2'\)/);
});
test('every referenced font file exists, has the right magic bytes and is listed in NOTICE with size', () => {
    for (const f of faces) {
        const file = f.match(/url\('\/fonts\/([^']+)'\)/)[1];
        const url = new URL(`../public/fonts/${file}`, import.meta.url);
        assert.ok(existsSync(url), file);
        const isMantra = f.includes(MANTRA_FAMILY);
        assert.ok(statSync(url).size > (isMantra ? 1000 : 10000), `${file} too small`);
        assert.equal(readFileSync(url).subarray(0, 4).toString('ascii'), isMantra ? 'wOFF' : 'wOF2', file);
        assert.ok(notice.includes(file), `${file} missing from NOTICE.md`);
        assert.ok(notice.includes(String(statSync(url).size)), `${file} size missing from NOTICE.md`);
        assert.ok(notice.includes(createHash('sha256').update(readFileSync(url)).digest('hex')), `${file} SHA-256 missing from NOTICE.md`);
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
        assert.ok(fullFaces.some((f) => f.includes(`font-family: '${familyOf[l.script]}'`)), `${l.code} @font-face`);
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

// ---- Devanagari mantra subset (finding 1) ----
const mantraSpan = header.match(/<span lang="hi" className="([^"]*)">(.*?)<\/span>/s);
const mantraCodepoints = [...new Set([...mantraSpan[2]].map((c) => c.codePointAt(0)).filter((cp) => cp >= 0x0900 && cp <= 0x097f))].sort((a, b) => a - b);
function parseUnicodeRange(text) {
    return text.split(',').map((p) => p.trim().replace(/^U\+/, '')).flatMap((p) => {
        const [a, b] = p.split('-').map((h) => parseInt(h, 16));
        return b === undefined ? [a] : Array.from({ length: b - a + 1 }, (_, i) => a + i);
    });
}
function woffTables(buf) {
    const n = buf.readUInt16BE(12);
    const tables = {};
    for (let i = 0; i < n; i++) {
        const o = 44 + i * 20;
        const tag = buf.toString('latin1', o, o + 4);
        const off = buf.readUInt32BE(o + 4);
        const comp = buf.readUInt32BE(o + 8);
        const orig = buf.readUInt32BE(o + 12);
        const raw = buf.subarray(off, off + comp);
        tables[tag] = comp < orig ? inflateSync(raw) : raw;
    }
    return tables;
}
function cmapCodepoints(cmap) {
    const out = new Set();
    const nTables = cmap.readUInt16BE(2);
    for (let i = 0; i < nTables; i++) {
        const sub = cmap.readUInt32BE(4 + i * 8 + 4);
        const format = cmap.readUInt16BE(sub);
        if (format === 4) {
            const segX2 = cmap.readUInt16BE(sub + 6);
            const ends = sub + 14;
            const starts = ends + segX2 + 2;
            for (let s = 0; s < segX2 / 2; s++) {
                const end = cmap.readUInt16BE(ends + s * 2);
                const start = cmap.readUInt16BE(starts + s * 2);
                if (start === 0xffff) continue;
                for (let c = start; c <= end; c++) out.add(c);
            }
        } else if (format === 12) {
            const groups = cmap.readUInt32BE(sub + 12);
            for (let g = 0; g < groups; g++) {
                const o = sub + 16 + g * 12;
                for (let c = cmap.readUInt32BE(o); c <= cmap.readUInt32BE(o + 4); c++) out.add(c);
            }
        }
    }
    return out;
}
test('mantra subset: unicode-range is exactly the Devanagari code points of the fixed header mantra', () => {
    assert.ok(mantraCodepoints.length >= 10);
    const range = parseUnicodeRange(mantraFace.match(/unicode-range:\s*([^;]+);/)[1]);
    assert.deepEqual([...new Set(range)].sort((a, b) => a - b), mantraCodepoints);
});
test('mantra subset file contains every mantra code point and keeps the layout tables', () => {
    const file = mantraFace.match(/url\('\/fonts\/([^']+)'\)/)[1];
    const tables = woffTables(read(`../public/fonts/${file}`));
    const have = cmapCodepoints(tables.cmap);
    for (const cp of mantraCodepoints) assert.ok(have.has(cp), `U+${cp.toString(16)} missing from subset cmap`);
    for (const tag of ['GSUB', 'GPOS', 'GDEF', 'glyf', 'gvar', 'fvar']) assert.ok(tables[tag], `${tag} dropped from subset`);
});
test('mantra subset has the OFL notice, tool, command and source hash recorded', () => {
    assert.match(notice, /pyftsubset/);
    assert.match(notice, /--unicodes=/);
    assert.match(notice, /NotoSansDevanagari\[wdth,wght\]\.ttf/);
    assert.match(notice, /OFL-devanagari\.txt/);
    assert.match(notice, /[0-9a-f]{64}/);
});
test('header mantra uses the subset-first stack; the class rule follows the :lang rules and stays Devanagari-first', () => {
    assert.match(mantraSpan[1], /\bfont-mantra\b/);
    const rule = css.match(/\.font-mantra\s*\{([^}]*)\}/);
    assert.ok(rule, '.font-mantra rule');
    assert.match(rule[1], new RegExp(`font-family:\\s*'${MANTRA_FAMILY}', 'Noto Sans Devanagari'`));
    assert.ok(css.indexOf('.font-mantra') > css.indexOf(':lang(pa)'), '.font-mantra must come after the :lang() rules');
});
test('Devanagari glyphs outside the mantra are not covered by the subset face (hi/mr text uses the full file)', () => {
    const range = new Set(parseUnicodeRange(mantraFace.match(/unicode-range:\s*([^;]+);/)[1]));
    assert.ok(!range.has(0x0915 + 1), 'subset must not claim U+0916');
    assert.ok(range.size < 30);
});
