import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderServiceWorker, assetsFromHtml, buildPrecacheList } from '../pwa/swPlugin.js';
import { NATIONAL_EMERGENCY_NUMBER } from '../src/constants/facts.js';
import { isOnline, subscribeOnlineStatus } from '../src/utils/onlineStatus.js';
import { LANGUAGE_CODES } from '../src/i18n/languages.js';
import { loadLocale } from '../src/i18n/index.js';
import en from '../src/i18n/locales/en.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const facts = JSON.parse(readFileSync(join(ROOT, '..', 'backend', 'data', 'facts.json'), 'utf8'));
const manifest = JSON.parse(read('public', 'manifest.json'));
const html = read('index.html');
const template = read('pwa', 'sw.template.js');

// ---------- manifest and icons ----------
function pngSize(file) {
    const b = readFileSync(file);
    assert.deepEqual([...b.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${file} PNG signature`);
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

test('manifest has the required installability fields', () => {
    assert.equal(manifest.id, '/');
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.lang, 'en');
    assert.ok(manifest.name && manifest.short_name && manifest.description);
    assert.match(manifest.theme_color, /^#[0-9a-fA-F]{6}$/);
    assert.match(manifest.background_color, /^#[0-9a-fA-F]{6}$/);
    assert.equal(manifest.theme_color.toLowerCase(), '#ff6b00');
    const meta = html.match(/<meta name="theme-color" content="([^"]+)"/);
    assert.equal(meta[1].toLowerCase(), manifest.theme_color.toLowerCase());
});

test('manifest icons are real PNG files with the declared size, include a maskable icon, no data: URIs', () => {
    assert.ok(!/data:/i.test(read('public', 'manifest.json')));
    const any = (size) => manifest.icons.find((i) => i.sizes === size && i.purpose === 'any');
    assert.ok(any('192x192') && any('512x512'));
    assert.ok(manifest.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'));
    for (const icon of manifest.icons) {
        assert.equal(icon.type, 'image/png');
        const file = join(ROOT, 'public', icon.src);
        assert.ok(existsSync(file), icon.src);
        const [w, h] = icon.sizes.split('x').map(Number);
        assert.deepEqual(pngSize(file), { w, h }, icon.src);
    }
});

test('apple-touch-icon (180) and favicon exist and are linked from index.html', () => {
    const apple = html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/);
    assert.ok(apple, 'apple-touch-icon link');
    assert.deepEqual(pngSize(join(ROOT, 'public', apple[1])), { w: 180, h: 180 });
    const icons = [...html.matchAll(/<link rel="icon"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(icons.length >= 1);
    for (const href of icons) {
        assert.ok(!href.startsWith('data:'), 'favicon is a file');
        assert.ok(existsSync(join(ROOT, 'public', href)), href);
    }
    assert.deepEqual(pngSize(join(ROOT, 'public', 'icons', 'favicon-32.png')), { w: 32, h: 32 });
});

test('index.html links the manifest and PWA metas, and keeps title/description', () => {
    assert.match(html, /<link rel="manifest" href="\/manifest\.json"/);
    assert.match(html, /<meta name="theme-color"/);
    assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes"/);
    assert.match(html, /<meta name="apple-mobile-web-app-title"/);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description"/);
    assert.match(html, /<html lang="en">/);
});

// ---------- registration ----------
test('main.jsx registers the service worker in production builds only', () => {
    const main = read('src', 'main.jsx');
    assert.match(main, /if \(import\.meta\.env\.PROD\) registerServiceWorker\(\)/);
    assert.ok(!/serviceWorker/.test(main.replace(/registerServiceWorker/g, '')));
});

test('registerServiceWorker waits for window load and registers /sw.js at root scope', async () => {
    const { registerServiceWorker } = await import('../src/pwa/register.js');
    const calls = [];
    const nav = { serviceWorker: { register: (u, o) => (calls.push([u, o]), Promise.resolve()) } };
    let loadCb;
    const win = { document: { readyState: 'loading' }, addEventListener: (e, cb) => { if (e === 'load') loadCb = cb; } };
    registerServiceWorker(win, nav);
    assert.equal(calls.length, 0, 'not before load');
    loadCb();
    assert.deepEqual(calls, [['/sw.js', { scope: '/', updateViaCache: 'none' }]]);
    registerServiceWorker({ document: { readyState: 'complete' }, addEventListener() {} }, nav);
    assert.equal(calls.length, 2);
    assert.doesNotThrow(() => registerServiceWorker({}, {}));
});

// ---------- service worker (template evaluated in a vm sandbox) ----------
const CONFIG = {
    version: 'testver',
    precache: ['/', '/assets/index-abc.js', '/assets/index-abc.css', '/manifest.json', '/icons/icon-192.png'],
    apiBase: 'https://api.example.org',
};
const ORIGIN = 'https://app.example.org';
const res = (status = 200, type = 'basic', body = 'x') => ({ status, type, body, clone() { return { ...this }; } });
const req = (path, o = {}) => ({
    url: path.startsWith('http') ? path : ORIGIN + path,
    method: o.method || 'GET',
    mode: o.mode || 'cors',
    headers: { has: (h) => h.toLowerCase() === 'range' && !!o.range },
});

function loadSw({ config = CONFIG, existingCaches = [], fetchImpl } = {}) {
    const stores = new Map(existingCaches.map((n) => [n, new Map()]));
    const listeners = {};
    const fetched = [];
    const key = (r) => (typeof r === 'string' ? new URL(r, ORIGIN).href : r.url);
    const caches = {
        open: async (name) => {
            if (!stores.has(name)) stores.set(name, new Map());
            const s = stores.get(name);
            return { put: async (r, v) => void s.set(key(r), v), match: async (r) => s.get(key(r)) };
        },
        keys: async () => [...stores.keys()],
        delete: async (n) => stores.delete(n),
    };
    const state = { skipWaiting: 0, claimed: 0 };
    const sandbox = {
        self: {
            location: { origin: ORIGIN },
            addEventListener: (t, cb) => (listeners[t] = cb),
            skipWaiting: () => (state.skipWaiting++, Promise.resolve()),
            clients: { claim: () => (state.claimed++, Promise.resolve()) },
        },
        caches,
        URL,
        Promise,
        setTimeout,
        clearTimeout,
        Request: class { constructor(url) { this.url = new URL(url, ORIGIN).href; } },
        Response: { error: () => ({ status: 0, type: 'error' }) },
        fetch: (r) => (fetched.push(typeof r === 'string' ? r : r.url), (fetchImpl || (async () => res()))(r)),
    };
    vm.createContext(sandbox);
    vm.runInContext(renderServiceWorker(template, config), sandbox);
    const fetchEvent = (request) => {
        let responded;
        const event = { request, respondWith: (p) => (responded = p) };
        listeners.fetch(event);
        return { handled: responded !== undefined, response: responded };
    };
    const lifecycle = async (type) => {
        let p;
        listeners[type]({ waitUntil: (x) => (p = x) });
        await p;
    };
    return { sandbox, stores, fetched, fetchEvent, lifecycle, state, caches };
}

test('template renders a valid worker with the config embedded', () => {
    const code = renderServiceWorker(template, CONFIG);
    assert.ok(code.includes('"version":"testver"'));
    assert.doesNotThrow(() => new vm.Script(code));
    assert.throws(() => renderServiceWorker('no marker', CONFIG));
});

test('decideRequest: /api/ is never handled, with any API origin or query string', () => {
    const { sandbox } = loadSw();
    const d = (r, cfg) => sandbox.decideRequest(r, ORIGIN, cfg || CONFIG);
    const mk = (u, o = {}) => ({ url: u, method: 'GET', mode: 'cors', hasRange: false, ...o });
    assert.equal(d(mk(`${ORIGIN}/api/emergency`)), null);
    assert.equal(d(mk(`${ORIGIN}/api/emergency?lang=hi&x=1`)), null);
    assert.equal(d(mk(`${ORIGIN}/api/faq`, { mode: 'navigate' })), null);
    assert.equal(d(mk(`${ORIGIN}/api`)), null);
    assert.equal(d(mk(`${ORIGIN}/api/`, { mode: 'navigate' })), null);
    assert.equal(d(mk('https://api.example.org/api/faq')), null);
    assert.equal(d(mk('https://api.example.org/anything')), null);
    // API served under a path of the same origin
    const same = { ...CONFIG, apiBase: `${ORIGIN}/backend` };
    assert.equal(d(mk(`${ORIGIN}/backend/emergency`), same), null);
    assert.equal(d(mk(`${ORIGIN}/backend/emergency`), CONFIG), null, 'not allow-listed either');
});

test('decideRequest: non-GET, Range, cross-origin and unlisted paths are not handled', () => {
    const { sandbox } = loadSw();
    const d = (r) => sandbox.decideRequest(r, ORIGIN, CONFIG);
    const mk = (u, o = {}) => ({ url: u, method: 'GET', mode: 'cors', hasRange: false, ...o });
    assert.equal(d(mk(`${ORIGIN}/assets/a.js`, { method: 'POST' })), null);
    assert.equal(d(mk(`${ORIGIN}/assets/a.js`, { method: 'HEAD' })), null);
    assert.equal(d(mk(`${ORIGIN}/fonts/a.woff2`, { hasRange: true })), null);
    assert.equal(d(mk('https://fonts.googleapis.com/css2?family=Inter')), null);
    assert.equal(d(mk('https://fonts.gstatic.com/s/inter/x.woff2')), null);
    assert.equal(d(mk(`${ORIGIN}/something/else.json`)), null);
    assert.equal(d(mk(`${ORIGIN}/sw.js`)), null);
    assert.equal(d(mk('not a url')), null);
    assert.equal(d(mk(`${ORIGIN}/assets/a.js`)), 'static');
    assert.equal(d(mk(`${ORIGIN}/fonts/a.woff2`)), 'static');
    assert.equal(d(mk(`${ORIGIN}/icons/icon-192.png`)), 'static');
    assert.equal(d(mk(`${ORIGIN}/manifest.json`)), 'static');
    assert.equal(d(mk(`${ORIGIN}/`, { mode: 'navigate' })), 'navigate');
    assert.equal(d(mk(`${ORIGIN}/some/deep/path`, { mode: 'navigate' })), 'navigate');
});

test('fetch handler does not call respondWith for /api, POST, cross-origin or Range requests', () => {
    const sw = loadSw();
    for (const r of [
        req('/api/emergency'),
        req('/api/faq?lang=hi'),
        req('/api/chat', { method: 'POST' }),
        req('/assets/index-abc.js', { method: 'POST' }),
        req('https://api.example.org/api/services'),
        req('https://fonts.googleapis.com/css2?family=Inter'),
        req('/fonts/NotoSansTamil-v31.woff2', { range: true }),
    ]) {
        assert.equal(sw.fetchEvent(r).handled, false, r.url);
    }
    assert.deepEqual(sw.fetched, []);
    assert.equal(sw.stores.size, 0);
});

test('install precaches exactly the list (only 200 same-origin responses) and activates immediately', async () => {
    const sw = loadSw();
    await sw.lifecycle('install');
    const store = sw.stores.get('simhastha-shell-testver');
    assert.deepEqual([...store.keys()].sort(), CONFIG.precache.map((p) => ORIGIN + p).sort());
    assert.equal(sw.state.skipWaiting, 1);
    assert.ok(!sw.fetched.some((u) => u.includes('/api')));
    const bad = loadSw({ fetchImpl: async () => res(404) });
    await assert.rejects(bad.lifecycle('install'), /Precache failed/);
    const opaque = loadSw({ fetchImpl: async () => res(200, 'opaque') });
    await assert.rejects(opaque.lifecycle('install'), /Precache failed/);
});

test('activate deletes old simhastha caches, keeps the current and unrelated ones, and claims clients', async () => {
    const sw = loadSw({ existingCaches: ['simhastha-shell-old1', 'simhastha-shell-testver', 'simhastha-shell-old2', 'other-app-cache'] });
    await sw.lifecycle('activate');
    assert.deepEqual([...sw.stores.keys()].sort(), ['other-app-cache', 'simhastha-shell-testver']);
    assert.equal(sw.state.claimed, 1);
});

test('static: only 200 basic responses are stored; others are returned but never cached', async () => {
    const cases = [
        [res(200, 'basic'), true],
        [res(404, 'basic'), false],
        [res(500, 'basic'), false],
        [res(206, 'basic'), false],
        [res(200, 'opaque'), false],
        [res(200, 'cors'), false],
    ];
    for (const [response, stored] of cases) {
        const sw = loadSw({ fetchImpl: async () => response });
        const out = await sw.fetchEvent(req('/assets/chunk-1.js')).response;
        assert.equal(out, response);
        const store = sw.stores.get('simhastha-shell-testver');
        assert.equal(store.has(ORIGIN + '/assets/chunk-1.js'), stored, `${response.status}/${response.type}`);
    }
});

test('static: cached hashed asset is served without touching the network; offline uncached asset fails', async () => {
    const sw = loadSw();
    await sw.lifecycle('install');
    sw.fetched.length = 0;
    const out = await sw.fetchEvent(req('/assets/index-abc.js')).response;
    assert.equal(out.status, 200);
    assert.deepEqual(sw.fetched, []);
    const offline = loadSw({ fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    await assert.rejects(offline.fetchEvent(req('/assets/never-seen.js')).response);
});

test('navigation: network first; falls back to the cached shell offline, on 5xx, and on a slow network', async () => {
    const online = loadSw({ fetchImpl: async () => res(200, 'basic', 'fresh') });
    await online.lifecycle('install');
    assert.equal((await online.fetchEvent(req('/', { mode: 'navigate' })).response).body, 'fresh');

    let fail = true;
    const sw = loadSw({ fetchImpl: async (r) => { if (fail) throw new TypeError('offline'); return res(200, 'basic', 'net'); } });
    fail = false;
    await sw.lifecycle('install');
    fail = true;
    for (const path of ['/', '/some/deep/link?x=1']) {
        const out = await sw.fetchEvent(req(path, { mode: 'navigate' })).response;
        assert.equal(out.status, 200);
        assert.equal(out.body, 'net', `${path} served from the cached shell`);
    }
    const down = loadSw({ fetchImpl: async () => res(503) });
    down.stores.set('simhastha-shell-testver', new Map([[ORIGIN + '/', res(200, 'basic', 'shell')]]));
    assert.equal((await down.fetchEvent(req('/', { mode: 'navigate' })).response).body, 'shell');
    const empty = loadSw({ fetchImpl: async () => { throw new TypeError('offline'); } });
    assert.equal((await empty.fetchEvent(req('/', { mode: 'navigate' })).response).type, 'error');
});

test('navigation to /api/ paths is never handled', () => {
    const sw = loadSw();
    assert.equal(sw.fetchEvent(req('/api/emergency', { mode: 'navigate' })).handled, false);
});

test('worker source has no /api caching branch: /api appears only in the deny rule', () => {
    const code = renderServiceWorker(template, CONFIG);
    const lines = code.split('\n').filter((l) => /\/api/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l) && !/^var SW_CONFIG/.test(l));
    assert.equal(lines.length, 1, lines.join('\n'));
    assert.ok(lines.every((l) => /pathname/.test(l)), 'only used in isApiPath');
    assert.ok(!/importScripts|XMLHttpRequest|sync|push/i.test(code.replace(/\/\*[\s\S]*?\*\//g, '')));
});

// ---------- build plugin helpers and build output ----------
test('assetsFromHtml and buildPrecacheList list same-origin built files only', () => {
    const built = '<script type="module" crossorigin src="/assets/index-1.js"></script><link rel="modulepreload" href="/assets/v-2.js"><link rel="stylesheet" href="/assets/index-3.css"><link href="https://fonts.googleapis.com/css2?x" rel="stylesheet">';
    assert.deepEqual(assetsFromHtml(built), ['/assets/index-1.js', '/assets/index-3.css', '/assets/v-2.js']);
    const list = buildPrecacheList({ html: built, publicDir: join(ROOT, 'public') });
    assert.equal(list[0], '/');
    assert.ok(list.includes('/manifest.json') && list.includes('/icons/icon-192.png'));
    assert.ok(list.includes('/fonts/NotoSansDevanagari-Mantra-v2.007.woff'));
    assert.ok(!list.some((u) => /^https?:|\/api/.test(u)));
    assert.ok(!list.some((u) => /NotoSansTamil/.test(u)), 'big script fonts are runtime cached');
});

test('built dist/sw.js (when a build exists) has the precache list, version and no /api caching', { skip: !existsSync(join(ROOT, 'dist', 'sw.js')) }, () => {
    const code = readFileSync(join(ROOT, 'dist', 'sw.js'), 'utf8');
    const m = code.match(/var SW_CONFIG = (\{.*\});/);
    const cfg = JSON.parse(m[1]);
    assert.match(cfg.version, /^[0-9a-f]{12}$/);
    assert.equal(cfg.precache[0], '/');
    assert.ok(cfg.precache.some((u) => /^\/assets\/index-.*\.js$/.test(u)));
    assert.ok(cfg.precache.some((u) => /^\/assets\/index-.*\.css$/.test(u)));
    assert.ok(!cfg.precache.some((u) => u.includes('/api')));
    for (const u of cfg.precache) if (u !== '/') assert.ok(existsSync(join(ROOT, 'dist', u)), u);
});

// ---------- offline UX ----------
test('offline status helpers', () => {
    assert.equal(isOnline({ onLine: true }), true);
    assert.equal(isOnline({ onLine: false }), false);
    assert.equal(isOnline(undefined) && isOnline(null), true);
    const target = new EventTarget();
    let n = 0;
    const off = subscribeOnlineStatus(() => n++, target);
    target.dispatchEvent(new Event('offline'));
    target.dispatchEvent(new Event('online'));
    off();
    target.dispatchEvent(new Event('offline'));
    assert.equal(n, 2);
    assert.equal(typeof subscribeOnlineStatus(() => {}, undefined), 'function');
});

test('the 112 offline action uses the registry value and a tel:112 link', () => {
    const rec = facts.records.find((r) => r.id === 'emergency.national.112');
    assert.equal(NATIONAL_EMERGENCY_NUMBER, rec.value);
    assert.equal(NATIONAL_EMERGENCY_NUMBER, '112');
    const link = read('src', 'components', 'OfflineEmergencyLink.jsx');
    assert.match(link, /href=\{`tel:\$\{NATIONAL_EMERGENCY_NUMBER\}`\}/);
});

test('offline UI code and locale strings contain no phone number other than the 112 constant', () => {
    const files = ['OfflineEmergencyLink.jsx', 'OfflineBanner.jsx', 'ApiStates.jsx'].map((f) => read('src', 'components', f));
    for (const src of files) assert.ok(!/\d{3,}/.test(src.replace(/\/\/.*$/gm, '').replace(/className=(\{`[^`]*`\}|"[^"]*")/g, '')), 'no number literal in offline components');
    const OFFLINE_KEYS = ['offline.banner', 'offline.callEmergency', 'offline.unavailable', 'offline.chat'];
    return (async () => {
        for (const c of LANGUAGE_CODES) {
            const cat = c === 'en' ? en : await loadLocale(c);
            for (const k of OFFLINE_KEYS) {
                const v = cat.messages[k];
                assert.ok(v && v.trim().length > 5, `${c}:${k}`);
                assert.ok(!/\d{2,}|tel:|https?:/.test(v), `${c}:${k} has a number or URL`);
            }
            assert.ok(cat.messages['offline.callEmergency'].includes('{number}'), c);
            if (c !== 'en') {
                assert.equal(cat._meta.status, 'needs-review', c);
                assert.equal(cat._meta.reviewer, '', c);
            }
        }
    })();
});

test('offline wiring: banner in the app shell, chat blocks sending, ErrorState says unavailable offline', () => {
    assert.match(read('src', 'App.jsx'), /<OfflineBanner \/>/);
    const banner = read('src', 'components', 'OfflineBanner.jsx');
    assert.match(banner, /role="status"/);
    assert.match(banner, /aria-live="polite"/);
    const chat = read('src', 'components', 'ChatInterface.jsx');
    assert.match(chat, /!isLoading \|\| !online|isLoading \|\| !online/);
    assert.match(chat, /maxLength=\{1000\}/);
    assert.match(chat, /offline\.chat/);
    const states = read('src', 'components', 'ApiStates.jsx');
    assert.match(states, /offline\.unavailable/);
    assert.match(read('src', 'components', 'EmergencyPanel.jsx'), /<ErrorState error=\{error\} onRetry=\{retry\} showEmergency \/>/);
});

test('no service worker file or registration exists outside the production gate', () => {
    const walk = (d) => readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(jsx?)$/.test(n) ? [p] : [];
    });
    const users = walk(join(ROOT, 'src')).filter((f) => /serviceWorker\.register|navigator\.serviceWorker/.test(readFileSync(f, 'utf8')));
    assert.deepEqual(users.map((f) => f.replace(/\\/g, '/').split('/src/')[1]), ['pwa/register.js']);
});
