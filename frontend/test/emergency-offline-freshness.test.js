import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFreshController } from '../src/utils/freshData.js';
import { groupContacts, telHref } from '../src/utils/emergencyGroups.js';
import { renderServiceWorker } from '../pwa/swPlugin.js';
import { NATIONAL_EMERGENCY_NUMBER } from '../src/constants/facts.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(root, ...p), 'utf8');

const payload = (tag = 'old') => ({
    contacts: [
        { id: 'police', name: 'Police', number: '100', primary: false, group: 'national', clickable: true },
        { id: 'nat', name: 'National emergency number', number: '112', primary: true, group: 'national', clickable: true },
        { id: 'local', name: `Local ${tag}`, number: '0734-2527130', primary: false, group: 'local_directory', clickable: false },
    ],
    infoCards: [{ id: 'medical', title: `Medical ${tag}`, details: ['ORS'] }],
});
const validate = (d) => Array.isArray(d?.contacts) && Array.isArray(d?.infoCards);
const errors = { offline: () => ({ kind: 'offline' }), parse: () => ({ kind: 'parse' }) };
const tick = () => new Promise((r) => setTimeout(r, 5));
const defer = () => {
    let resolve, reject;
    const promise = new Promise((a, b) => ((resolve = a), (reject = b)));
    return { promise, resolve, reject };
};

// Harness: every load() call is recorded and settled by the test.
function harness({ online = true } = {}) {
    const h = { online, calls: [], states: [] };
    h.ctl = createFreshController({
        load: (signal) => {
            const d = defer();
            h.calls.push({ ...d, signal });
            return d.promise;
        },
        validate,
        isOnline: () => h.online,
        onChange: (s) => h.states.push(s),
        errors,
    });
    h.last = () => h.states[h.states.length - 1];
    h.setOnline = (v) => {
        h.online = v;
        return v ? h.ctl.refresh() : h.ctl.goOffline();
    };
    return h;
}
// Everything the tab could render from a state, mirroring EmergencyPanel's gating.
const rendered = (s) => {
    const { primary, secondary, local } = groupContacts(s.data?.contacts);
    return { numbers: [primary, ...secondary, ...local].filter(Boolean).map((c) => c.number), cards: s.data?.infoCards || [] };
};

async function loadOnline(h) {
    h.ctl.refresh();
    await tick();
    h.calls[0].resolve(payload());
    await tick();
    assert.equal(h.last().data.contacts.length, 3);
}

test('(a) going offline clears contacts and info cards in the same transition', async () => {
    const h = harness();
    await loadOnline(h);
    h.setOnline(false);
    const s = h.last();
    assert.equal(s.data, null);
    assert.equal(s.loading, false);
    assert.deepEqual(s.error, { kind: 'offline' });
    assert.deepEqual(rendered(s), { numbers: [], cards: [] });
});

test('(b) opening while offline: no list, no request', async () => {
    const h = harness({ online: false });
    h.ctl.refresh();
    await tick();
    assert.equal(h.calls.length, 0);
    assert.equal(h.last().data, null);
    assert.deepEqual(h.last().error, { kind: 'offline' });
    h.ctl.refresh(); // Retry while offline sends nothing either
    await tick();
    assert.equal(h.calls.length, 0);
});

test('(c) reconnect: old list never reappears; contacts only after a fresh success', async () => {
    const h = harness();
    await loadOnline(h);
    h.setOnline(false);
    h.setOnline(true);
    assert.equal(h.last().loading, true);
    assert.equal(h.last().data, null);
    await tick();
    assert.equal(h.calls.length, 2, 'a fresh request is sent');
    assert.ok(h.states.slice(h.states.findIndex((s) => s.error) ).every((s) => s.data === null), 'no state after offline holds data');
    h.calls[1].resolve(payload('fresh'));
    await tick();
    assert.equal(h.last().data.infoCards[0].title, 'Medical fresh');
    assert.equal(h.last().data.contacts[2].name, 'Local fresh');
});

test('(d) refresh failures keep contacts hidden; retry fetches fresh', async () => {
    for (const fail of [
        (c) => c.reject(Object.assign(new Error('net'), { kind: 'network' })),
        (c) => c.reject(Object.assign(new Error('http'), { kind: 'http', status: 500 })),
        (c) => c.resolve({ nonsense: true }), // malformed / invalid payload
    ]) {
        const h = harness();
        await loadOnline(h);
        h.setOnline(false);
        h.setOnline(true);
        await tick();
        fail(h.calls[1]);
        await tick();
        assert.equal(h.last().data, null);
        assert.ok(h.last().error);
        assert.equal(h.last().loading, false);
        h.ctl.refresh(); // Retry
        assert.equal(h.last().data, null);
        assert.equal(h.last().loading, true);
        await tick();
        assert.equal(h.calls.length, 3);
        h.calls[2].resolve(payload('retry'));
        await tick();
        assert.equal(h.last().data.infoCards[0].title, 'Medical retry');
    }
});

test('(e) responses from before the offline event or reconnect are ignored and aborted', async () => {
    const h = harness();
    h.ctl.refresh();
    await tick();
    const early = h.calls[0];
    h.setOnline(false);
    assert.equal(early.signal.aborted, true);
    early.resolve(payload('early')); // arrives while offline
    await tick();
    assert.equal(h.last().data, null);
    h.setOnline(true);
    await tick();
    early.resolve(payload('early-again')); // arrives after reconnect, still pending fresh request
    await tick();
    assert.equal(h.last().data, null);
    assert.equal(h.last().loading, true);
    h.calls[1].resolve(payload('fresh'));
    await tick();
    assert.equal(h.last().data.infoCards[0].title, 'Medical fresh');
    // an old response resolving even later cannot overwrite the fresh data
    early.resolve(payload('late'));
    await tick();
    assert.equal(h.last().data.infoCards[0].title, 'Medical fresh');
    // a late failure from an old request cannot hide fresh data either
    const h2 = harness();
    h2.ctl.refresh();
    await tick();
    h2.ctl.refresh();
    await tick();
    h2.calls[1].resolve(payload('b'));
    await tick();
    h2.calls[0].reject(new Error('late'));
    await tick();
    assert.equal(h2.last().data.infoCards[0].title, 'Medical b');
});

test('(e2) a response that settles while the browser is offline is dropped even without an abort', async () => {
    const h = harness();
    h.ctl.refresh();
    await tick();
    h.online = false; // offline flag flipped but event not yet handled
    h.calls[0].resolve(payload());
    await tick();
    assert.equal(h.last().data, null);
});

test('(e3) disposed controllers (remount) emit nothing', async () => {
    const h = harness();
    h.ctl.refresh();
    await tick();
    const n = h.states.length;
    h.ctl.dispose();
    h.calls[0].resolve(payload());
    await tick();
    assert.equal(h.states.length, n);
});

test('(f) no emergency payload is persisted in storage, caches or module memory', () => {
    const files = {
        panel: read('src', 'components', 'EmergencyPanel.jsx'),
        hook: read('src', 'hooks', 'useFreshApiGet.js'),
        ctl: read('src', 'utils', 'freshData.js'),
    };
    for (const [name, src] of Object.entries(files)) {
        assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB|\bcaches\b|CacheStorage|serviceWorker/, name);
    }
    assert.doesNotMatch(files.ctl, /^(let|var)\s/m, 'no module-level mutable state in the controller');
    assert.doesNotMatch(files.hook, /^(let|var)\s/m, 'no module-level mutable state in the hook');
    assert.match(files.panel, /useFreshApiGet\('\/api\/emergency'/);
});

// ---------- service worker policy ----------
const CONFIG = { version: 't', precache: ['/', '/assets/a.js'], apiBase: 'https://api.example.org' };
const ORIGIN = 'https://app.example.org';
function decider(code) {
    const sandbox = {
        self: { location: { origin: ORIGIN }, addEventListener() {}, skipWaiting() {}, clients: { claim() {} } },
        caches: {}, URL, Promise, setTimeout, clearTimeout, Request: class {}, Response: {}, fetch() {},
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.decideRequest;
}
test('(g) service worker never handles /api/emergency', () => {
    const d = decider(renderServiceWorker(read('pwa', 'sw.template.js'), CONFIG));
    const mk = (u, o = {}) => ({ url: u, method: 'GET', mode: 'cors', hasRange: false, ...o });
    for (const u of [
        `${ORIGIN}/api/emergency`,
        `${ORIGIN}/api/emergency?lang=hi`,
        `${ORIGIN}/api/emergency?lang=en&_=1#x`,
        'https://api.example.org/api/emergency?lang=ta',
        'https://other.example.net/api/emergency',
    ]) {
        assert.equal(d(mk(u)), null, u);
        assert.equal(d(mk(u, { mode: 'navigate' })), null, `${u} (navigate)`);
    }
});
test('(g2) generated sw.js has no cache write path for /api', () => {
    const dist = join(root, 'dist', 'sw.js');
    const code = existsSync(dist) ? readFileSync(dist, 'utf8') : renderServiceWorker(read('pwa', 'sw.template.js'), CONFIG);
    assert.doesNotMatch(code, /\/api\/emergency/);
    assert.doesNotMatch(code, /precache[^;]*\/api/i);
    const d = decider(code);
    const cfgApi = 'https://api.example.org';
    assert.equal(d({ url: `${ORIGIN}/api/emergency?lang=en`, method: 'GET', mode: 'cors', hasRange: false }), null);
    assert.equal(d({ url: `${cfgApi}/api/emergency`, method: 'GET', mode: 'cors', hasRange: false }), null);
});

// ---------- ordering and component scans ----------
test('(h) 112 stays first and primary when fresh data arrives', async () => {
    const h = harness();
    await loadOnline(h);
    const { primary, secondary, local } = groupContacts(h.last().data.contacts);
    assert.equal(primary.number, NATIONAL_EMERGENCY_NUMBER);
    assert.equal(NATIONAL_EMERGENCY_NUMBER, '112');
    assert.deepEqual(rendered(h.last()).numbers, ['112', '100', '0734-2527130']);
    assert.deepEqual(secondary.map((c) => c.id), ['police']);
    assert.deepEqual(local.map((c) => c.id), ['local']);
    assert.equal(telHref(primary), 'tel:112');
    assert.equal(telHref(local[0]), null, 'non-clickable contacts get no tel: link');
});

test('(i) offline UI uses the 112 constant and no other tel: literal', () => {
    const link = read('src', 'components', 'OfflineEmergencyLink.jsx');
    const states = read('src', 'components', 'ApiStates.jsx');
    const panel = read('src', 'components', 'EmergencyPanel.jsx');
    assert.match(link, /href=\{`tel:\$\{NATIONAL_EMERGENCY_NUMBER\}`\}/);
    assert.match(link, /import \{ NATIONAL_EMERGENCY_NUMBER \} from '..\/constants\/facts\.js'/);
    for (const [name, src] of Object.entries({ link, states, panel })) {
        const literals = src.match(/tel:[^\s`'"}]*/g) || [];
        assert.deepEqual(literals.filter((l) => l !== 'tel:' && l !== 'tel:${NATIONAL_EMERGENCY_NUMBER'), [], `${name} has no numeric tel: literal`);
    }
    assert.match(states, /\{showEmergency && <OfflineEmergencyLink/);
    assert.match(panel, /<ErrorState error=\{error\} onRetry=\{retry\} showEmergency/);
});
