import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_CODES, SUPPORTED_LANGUAGES } from '../src/i18n/languages.js';
import { loadLocale, createTranslator } from '../src/i18n/index.js';
import en from '../src/i18n/locales/en.js';
import { BACKEND_ERROR_CODES, CLIENT_ERROR_KINDS, ERROR_KEYS, errorKeyForCode } from '../src/utils/errorCodes.js';
import { EMERGENCY_NUMBERS, buildChatErrorText, classifyChatError, emergencyFooter } from '../src/utils/chatErrors.js';
import {
    STORAGE_KEY,
    createErrorMessage,
    createWelcomeMessage,
    isWelcomeMessage,
    normalizeStoredMessages,
    resolveMessageText,
    toApiHistory,
    trimForStorage,
} from '../src/utils/chatHistory.js';
import { API_BASE, ApiError, getErrorCode, getErrorKey, getErrorMessage, normalizeBaseUrl } from '../src/utils/api.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const NON_EN = LANGUAGE_CODES.filter((c) => c !== 'en');
const catalogs = { en };
for (const c of NON_EN) catalogs[c] = await loadLocale(c);
const translators = Object.fromEntries(LANGUAGE_CODES.map((c) => [c, createTranslator({ lang: c, catalogs, markers: false })]));
const emoji = (s) => [...s].filter((ch) => ch.codePointAt(0) > 0x2000 && ch !== '\u2022').map((ch) => ch.codePointAt(0).toString(16));

// ---------- error-code localization ----------
test('the backend error codes in this client match the codes the backend source can send', () => {
    const src = `${readFileSync(join(ROOT, '..', 'backend', 'routes', 'chat.js'), 'utf8')}\n${readFileSync(join(ROOT, '..', 'backend', 'app.js'), 'utf8')}`;
    const found = new Set([...src.matchAll(/code:\s*'([A-Z_]+)'/g), ...src.matchAll(/sendError\(res,\s*\d+,\s*'([A-Z_]+)'/g)].map((m) => m[1]));
    assert.deepEqual([...found].sort(), [...BACKEND_ERROR_CODES].sort());
});

test('every backend code and client kind has a message key in all 8 languages', () => {
    for (const id of [...BACKEND_ERROR_CODES, ...CLIENT_ERROR_KINDS]) {
        const key = errorKeyForCode(id);
        assert.ok(key.startsWith('err.'), id);
        for (const c of LANGUAGE_CODES) {
            const text = catalogs[c].messages[key];
            assert.equal(typeof text, 'string', `${c}:${key} (${id})`);
            assert.ok(text.trim().length > 5, `${c}:${key} empty`);
            assert.equal(translators[c](key), text, `${c}:${key} resolves without fallback`);
        }
    }
});

test('non-English error messages are translated, not English copies', () => {
    for (const key of new Set(Object.values(ERROR_KEYS))) {
        for (const c of NON_EN) assert.notEqual(catalogs[c].messages[key], en.messages[key], `${c}:${key}`);
    }
});

test('distinct situations have distinct messages', () => {
    const ids = ['AI_QUOTA_EXCEEDED', 'AI_UNAVAILABLE', 'CHAT_NOT_CONFIGURED', 'AI_INVALID_REQUEST', 'AI_ERROR', 'RATE_LIMITED', 'INVALID_JSON', 'PAYLOAD_TOO_LARGE', 'INTERNAL_ERROR', 'INVALID_REQUEST', 'network', 'timeout', 'parse', '404', '5xx', 'unknown'];
    for (const c of LANGUAGE_CODES) {
        const texts = ids.map((id) => catalogs[c].messages[errorKeyForCode(id)]);
        assert.equal(new Set(texts).size, ids.length, c);
    }
    assert.equal(errorKeyForCode('429'), errorKeyForCode('RATE_LIMITED'));
    assert.equal(errorKeyForCode('SOMETHING_NEW'), errorKeyForCode('unknown'));
    assert.equal(errorKeyForCode(undefined), errorKeyForCode('unknown'));
});

test('classifyChatError maps thrown errors to stable codes and kinds', () => {
    const abort = Object.assign(new Error('x'), { name: 'AbortError' });
    assert.equal(classifyChatError(abort), 'timeout');
    for (const code of BACKEND_ERROR_CODES) assert.equal(classifyChatError(Object.assign(new Error('x'), { code, status: 400 })), code);
    assert.equal(classifyChatError(Object.assign(new Error('x'), { status: 404 })), '404');
    assert.equal(classifyChatError(Object.assign(new Error('x'), { status: 429 })), '429');
    assert.equal(classifyChatError(Object.assign(new Error('x'), { status: 503 })), 'AI_UNAVAILABLE');
    assert.equal(classifyChatError(Object.assign(new Error('x'), { status: 502 })), '5xx');
    assert.equal(classifyChatError(Object.assign(new Error('x'), { kind: 'parse' })), 'parse');
    assert.equal(classifyChatError(new SyntaxError('bad json')), 'parse');
    assert.equal(classifyChatError(new TypeError('Failed to fetch')), 'network');
    assert.equal(classifyChatError(new Error('NetworkError when attempting to fetch resource')), 'network');
    assert.equal(classifyChatError(new Error('boom')), 'unknown');
    assert.equal(classifyChatError(null), 'unknown');
    assert.equal(classifyChatError('str'), 'unknown');
});

test('error text never contains raw server text; stable key is used for every classified error', () => {
    const err = Object.assign(new Error('Internal stack trace at /srv/app.js GEMINI_API_KEY'), { status: 500, code: 'INTERNAL_ERROR' });
    for (const c of LANGUAGE_CODES) {
        const text = buildChatErrorText(classifyChatError(err), translators[c]);
        assert.ok(!/stack|srv|GEMINI|backend|\.env/i.test(text), c);
    }
});

// ---------- emergency numbers ----------
test('emergency numbers: one constant, exact values, English footer identical in every language', () => {
    assert.deepEqual({ ...EMERGENCY_NUMBERS }, { police: '100', ambulance: '108', controlRoom: '0734-2551234' });
    const src = read('src/utils/chatErrors.js');
    for (const n of ['100', '108', '0734-2551234']) assert.equal(src.split(`'${n}'`).length - 1, 1, `${n} defined once`);
    const footer = emergencyFooter('AI_ERROR');
    assert.match(footer, /Police: 100/);
    assert.match(footer, /Ambulance: 108/);
    assert.match(footer, /Simhastha Control Room: 0734-2551234/);
    assert.match(emergencyFooter('RATE_LIMITED'), /^For immediate help:/);
    assert.equal(emergencyFooter('timeout'), '');
    for (const c of LANGUAGE_CODES) {
        const text = buildChatErrorText('AI_QUOTA_EXCEEDED', translators[c]);
        assert.ok(text.endsWith(emergencyFooter('AI_QUOTA_EXCEEDED')), c);
        assert.ok(text.startsWith('\u26A0 '), c);
    }
    assert.ok(buildChatErrorText('timeout', translators.hi).startsWith('\u23F1\uFE0F '));
    assert.ok(buildChatErrorText('network', translators.en).startsWith('\u{1F4E1} '));
});

test('catalogs contain no phone numbers or {number} slots for chat strings; placeholders match English', () => {
    const tokens = (s) => (s.match(/\{(?!g:)[^}]+\}/g) || []).sort();
    for (const c of NON_EN) {
        for (const [k, v] of Object.entries(catalogs[c].messages)) {
            if (!/^(chat|err)\./.test(k)) continue;
            assert.deepEqual(tokens(v), tokens(en.messages[k]), `${c}:${k}`);
            assert.ok(!/\d{3,}/.test(v.replace(/\b2028\b/g, '')), `${c}:${k} embeds a number`);
            assert.ok(!/GEMINI|AIza|\.env/i.test(v), `${c}:${k}`);
        }
    }
});

// ---------- welcome, emoji, suggestions, language indicator ----------
test('welcome message: emoji (incl. U+FE0F) preserved exactly in every language', () => {
    const want = emoji(en.messages['chat.welcome']);
    assert.deepEqual(want, ['1f64f', '1f5d3', 'fe0f', '1f5fa', 'fe0f', '1f3d5', 'fe0f', '1f682', '1f6d5', '1f198']);
    for (const c of NON_EN) assert.deepEqual(emoji(catalogs[c].messages['chat.welcome']), want, c);
    for (const c of NON_EN) {
        const out = translators[c]('chat.welcome');
        assert.match(out, /KumbhSaathi/, c);
        assert.match(out, /2028/, c);
        assert.ok(!/\{g:/.test(out), c);
        assert.equal(out.split('\n').length, en.messages['chat.welcome'].split('\n').length, `${c} line count`);
    }
});

test('suggested questions: six stable ids, all keys present and translated', () => {
    const src = read('src/components/ChatInterface.jsx');
    const ids = [...src.matchAll(/\{ id: '(\w+)', key: tk\('(chat\.suggest\.\w+)'\) \}/g)];
    assert.deepEqual(ids.map((m) => m[1]), ['amritSnan', 'reach', 'stay', 'pack', 'mahakal', 'emergency']);
    for (const [, id, key] of ids) {
        assert.equal(key, `chat.suggest.${id}`);
        for (const c of NON_EN) assert.notEqual(catalogs[c].messages[key], en.messages[key], `${c}:${key}`);
    }
});

test('language indicator uses native names and a {language} slot in every language', () => {
    for (const c of LANGUAGE_CODES) assert.match(catalogs[c].messages['chat.respondingIn'], /\{language\}/, c);
    for (const l of SUPPORTED_LANGUAGES) assert.ok(l.nativeName && l.nativeName.length > 0);
    const src = read('src/components/ChatInterface.jsx');
    assert.match(src, /language\.nativeName/);
    assert.ok(!/englishName/.test(src));
    const out = translators.hi('chat.respondingIn', { language: 'X' });
    assert.ok(out.includes('X') && !out.includes('{'));
});

test('plural message count is complete for every language', () => {
    for (const c of LANGUAGE_CODES) {
        assert.match(translators[c].plural('chat.messageCount', 1), /\b1\b/, c);
        assert.match(translators[c].plural('chat.messageCount', 12345), /12,345/, c);
    }
});

// ---------- legacy history ----------
const LEGACY_WELCOME = {
    id: 'welcome',
    role: 'assistant',
    content: 'Jai Mahakal! \u{1F64F} I am KumbhSaathi, your Simhastha Kumbh 2028 assistant.\n\nAsk me anything in your preferred language!',
    timestamp: '2026-01-01T10:00:00.000Z',
};
const LEGACY_ERROR = {
    id: '1700000000001',
    role: 'assistant',
    content: '\u26A0 The AI assistant is temporarily unavailable. Please try again in a few minutes.\n\nFor emergencies:\n\u2022 Police: 100',
    timestamp: '2026-01-01T10:01:00.000Z',
    isError: true,
};

test('legacy stored history loads: old welcome and old error bubbles are kept', () => {
    const stored = JSON.stringify([LEGACY_WELCOME, { id: '1', role: 'user', content: 'hi', timestamp: '2026-01-01T10:00:30.000Z' }, LEGACY_ERROR]);
    const out = normalizeStoredMessages(stored);
    assert.equal(out.length, 3);
    assert.equal(out[0].id, 'welcome');
    assert.ok(isWelcomeMessage(out[0]));
    assert.deepEqual(out[2], LEGACY_ERROR);
    for (const c of LANGUAGE_CODES) {
        const t = translators[c];
        assert.equal(resolveMessageText(out[0], t), t('chat.welcome'), c);
        assert.equal(resolveMessageText(out[2], t), LEGACY_ERROR.content, `${c} legacy error renders as stored`);
        assert.equal(resolveMessageText(out[1], t), 'hi');
    }
});

test('a legacy welcome without an id is recognised by its marker text and not sent to the API', () => {
    const { id, ...noId } = LEGACY_WELCOME;
    const out = normalizeStoredMessages([noId, { id: '5', role: 'user', content: 'Q', timestamp: '2026-01-01T10:02:00.000Z' }]);
    assert.equal(out[0].id, 'welcome');
    assert.deepEqual(toApiHistory(out), [{ role: 'user', content: 'Q' }]);
});

test('normalizeStoredMessages never throws and drops unusable entries', () => {
    for (const bad of [null, undefined, 42, 'not json', '{"a":1}', '[]', {}, [null, 1, 'x', [], { role: 'system', content: 'x' }, { role: 'user' }]]) {
        const out = normalizeStoredMessages(bad);
        assert.ok(Array.isArray(out) && out.length === 1 && out[0].id === 'welcome', JSON.stringify(bad));
    }
    const out = normalizeStoredMessages([
        { id: 7, role: 'user', content: 'a', timestamp: 'garbage' },
        { role: 'assistant', content: 'b' },
        { id: '7', role: 'user', content: 'dup' },
    ]);
    assert.equal(out.length, 3);
    assert.equal(new Set(out.map((m) => m.id)).size, 3);
    assert.equal(out[0].timestamp, '');
    assert.ok(out.every((m) => typeof m.content === 'string'));
});

test('new error bubbles store the code, not translated text, and retranslate on language change', () => {
    const msg = createErrorMessage('AI_QUOTA_EXCEEDED', '99');
    assert.equal(msg.isError, true);
    assert.equal(msg.errorCode, 'AI_QUOTA_EXCEEDED');
    assert.equal(msg.content, '');
    const stored = JSON.stringify([createWelcomeMessage(), msg]);
    assert.ok(!stored.includes(en.messages['err.aiQuota']), 'translated text is not persisted');
    const back = normalizeStoredMessages(stored);
    assert.deepEqual(back[1], msg);
    const rendered = LANGUAGE_CODES.map((c) => resolveMessageText(back[1], translators[c]));
    assert.equal(new Set(rendered).size, 8);
    assert.ok(rendered[0].includes(en.messages['err.aiQuota']));
    assert.ok(rendered[1].includes(catalogs.hi.messages['err.aiQuota']));
    // an unknown future code still renders the generic message
    assert.ok(resolveMessageText(createErrorMessage('NEW_CODE', '1'), translators.ta).includes(catalogs.ta.messages['err.unknown']));
});

test('stored welcome keeps the legacy shape (id, role, English content, timestamp)', () => {
    const w = createWelcomeMessage(new Date('2026-02-03T04:05:06.000Z'));
    assert.deepEqual(Object.keys(w).sort(), ['content', 'id', 'role', 'timestamp']);
    assert.equal(w.id, 'welcome');
    assert.equal(w.content, en.messages['chat.welcome']);
    assert.equal(STORAGE_KEY, 'simhastha_chat_history');
});

test('API history excludes welcome and error bubbles, drops empty turns and keeps the last 10', () => {
    const msgs = [createWelcomeMessage(), LEGACY_ERROR, createErrorMessage('network', 'e1')];
    for (let i = 0; i < 14; i++) msgs.push({ id: `m${i}`, role: i % 2 ? 'assistant' : 'user', content: `msg ${i}`, timestamp: '2026-01-01T10:00:00.000Z' });
    msgs.push({ id: 'blank', role: 'user', content: '   ', timestamp: '' });
    const h = toApiHistory(msgs);
    assert.equal(h.length, 10);
    assert.deepEqual(h[9], { role: 'assistant', content: 'msg 13' });
    assert.ok(h.every((m) => Object.keys(m).join() === 'role,content'));
    assert.equal(trimForStorage(Array.from({ length: 80 }, (_, i) => i)).length, 50);
});

// ---------- api util under Node ----------
test('api.js loads under Node (no import.meta.env) and keeps its public surface', () => {
    assert.equal(API_BASE, '');
    assert.equal(normalizeBaseUrl(' https://x.example/// '), 'https://x.example');
    assert.match(read('src/utils/api.js'), /import\.meta\.env\?\.VITE_API_URL/);
});

test('api error mapping: kinds and statuses map to stable keys', () => {
    const cases = [
        [new ApiError('network'), 'network', 'err.network'],
        [new ApiError('timeout'), 'timeout', 'err.timeout'],
        [new ApiError('parse'), 'parse', 'err.parse'],
        [new ApiError('http', 404), '404', 'err.notFound'],
        [new ApiError('http', 429), '429', 'err.rateLimited'],
        [new ApiError('http', 500), '5xx', 'err.server'],
        [new ApiError('http', 503), '5xx', 'err.server'],
        [new ApiError('http', 400), 'unknown', 'err.unknown'],
        [new ApiError('aborted'), 'unknown', 'err.unknown'],
        [new Error('raw server exception: secret'), 'unknown', 'err.unknown'],
        [undefined, 'unknown', 'err.unknown'],
    ];
    for (const [err, code, key] of cases) {
        assert.equal(getErrorCode(err), code);
        assert.equal(getErrorKey(err), key);
        for (const c of LANGUAGE_CODES) assert.equal(getErrorMessage(err, translators[c]), catalogs[c].messages[key], `${c} ${key}`);
    }
});

test('getErrorMessage without a translator returns the original English texts (compatible)', () => {
    assert.equal(getErrorMessage(new ApiError('network')), 'Could not reach the server. Please check your connection and try again.');
    assert.equal(getErrorMessage(new ApiError('timeout')), 'The server took too long to respond. Please try again.');
    assert.equal(getErrorMessage(new ApiError('parse')), 'The server sent an unexpected response. Please try again.');
    assert.equal(getErrorMessage(new ApiError('http', 404)), 'This information could not be found.');
    assert.equal(getErrorMessage(new ApiError('http', 429)), 'Too many requests. Please wait a moment and try again.');
    assert.equal(getErrorMessage(new ApiError('http', 502)), 'The server is having trouble right now. Please try again shortly.');
    assert.equal(getErrorMessage(new Error('x')), 'Something went wrong. Please try again.');
    assert.match(read('src/components/ApiStates.jsx'), /getErrorMessage\(error, t\)/);
});

// ---------- component scans, secrets, uiLabels ----------
const walk = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(n) ? [p] : [];
});

test('uiLabels.js is deleted and nothing imports it', () => {
    assert.equal(existsSync(join(ROOT, 'src/data/uiLabels.js')), false);
    const offenders = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'test'))]
        .filter((f) => !/chat-inc4\.test\.js$/.test(f))
        .filter((f) => /uiLabels|useLabels|UI_LABELS/.test(readFileSync(f, 'utf8')));
    assert.deepEqual(offenders, []);
});

test('ChatInterface keeps Phase 1/2 behaviour: maxLength, 30 s timeout, language in body, no labels prop', () => {
    const src = read('src/components/ChatInterface.jsx');
    assert.match(src, /maxLength=\{1000\}/);
    assert.match(src, /setTimeout\(\(\) => controller\.abort\(\), 30000\)/);
    assert.match(src, /\$\{API_BASE\}\/api\/chat/);
    assert.match(src, /language: selectedLanguage/);
    assert.match(src, /toApiHistory\(messages\)/);
    assert.ok(!/labels/.test(src));
    assert.ok(!/labels=/.test(read('src/App.jsx')));
});

test('demo banner: secrets only in the dev-only file, which is loaded only when import.meta.env.DEV', () => {
    const SECRET = /GEMINI_API_KEY|AIza|[\/\s]\.env\b/;
    const chat = read('src/components/ChatInterface.jsx');
    assert.ok(!SECRET.test(chat));
    assert.match(chat, /const DevDemoBanner = import\.meta\.env\.DEV \? lazy\(\(\) => import\('\.\/DevDemoBanner\.jsx'\)\) : null;/);
    assert.ok(!/from '\.\/DevDemoBanner/.test(chat), 'no static import');
    assert.match(read('src/components/DevDemoBanner.jsx'), SECRET);
    const offenders = walk(join(ROOT, 'src'))
        .filter((f) => !/[\\/]data[\\/]/.test(f) && !/DevDemoBanner\.jsx$/.test(f))
        .filter((f) => SECRET.test(readFileSync(f, 'utf8')));
    assert.deepEqual(offenders, []);
    for (const c of LANGUAGE_CODES) assert.ok(!SECRET.test(JSON.stringify(catalogs[c].messages)), c);
});

test('neutral demo notice is localized and says nothing about keys or backend', () => {
    for (const c of LANGUAGE_CODES) assert.ok(catalogs[c].messages['chat.demoNotice'].length > 10, c);
    assert.ok(!/key|backend|env|gemini/i.test(en.messages['chat.demoNotice']));
    for (const c of NON_EN) assert.notEqual(catalogs[c].messages['chat.demoNotice'], en.messages['chat.demoNotice'], c);
});