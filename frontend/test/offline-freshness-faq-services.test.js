import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFreshController } from '../src/utils/freshData.js';
import { faqParams, servicesParams, categoryOptionsFrom } from '../src/utils/apiParams.js';
import { renderServiceWorker } from '../pwa/swPlugin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(root, ...p), 'utf8');

const faqPayload = (tag = 'old') => ({
    faqs: [{ id: 1, question: `Q ${tag}`, answer: 'A' }, { id: 2, question: `Q2 ${tag}`, answer: 'A2' }],
    categories: [{ id: 'health-safety', label: `Health ${tag}` }],
});
const servicesPayload = (tag = 'old') => ({
    services: [{ id: 'food', category: `Food ${tag}`, icon: 'x', items: [{ name: 'n' }] }],
});
const validators = {
    faq: (d) => Array.isArray(d?.faqs) && Array.isArray(d?.categories),
    services: (d) => Array.isArray(d?.services) && d.services.every((s) => s && typeof s.category === 'string' && Array.isArray(s.items)),
};
const payloads = { faq: faqPayload, services: servicesPayload };
const errors = { offline: () => ({ kind: 'offline' }), parse: () => ({ kind: 'parse' }) };
const tick = () => new Promise((r) => setTimeout(r, 5));
const defer = () => {
    let resolve, reject;
    const promise = new Promise((a, b) => ((resolve = a), (reject = b)));
    return { promise, resolve, reject };
};

// Mirrors the hook's wiring (lastRef + seed) around the production controller.
function harness(kind, { online = true, keepPrevious = false } = {}) {
    const h = { online, calls: [], states: [], last_: null };
    h.make = (params = {}) => {
        h.ctl?.dispose();
        h.ctl = createFreshController({
            load: (signal) => {
                const d = defer();
                h.calls.push({ ...d, signal, params });
                return d.promise;
            },
            validate: validators[kind],
            isOnline: () => h.online,
            onChange: (s) => {
                h.last_ = s.data;
                h.states.push(s);
            },
            seed: keepPrevious ? () => h.last_ : undefined,
            errors,
        });
        h.ctl.refresh({ keepData: true });
    };
    h.last = () => h.states[h.states.length - 1];
    h.setOnline = (v) => {
        h.online = v;
        return v ? h.ctl.refresh() : h.ctl.goOffline();
    };
    h.make();
    return h;
}
// What each tab can show for a state.
const shownFaq = (s) => ({ faqs: s.data?.faqs || [], chips: s.data ? categoryOptionsFrom(s.data) : [] });
const shownServices = (s) => s.data?.services || [];
const KINDS = ['faq', 'services'];

async function loadOnline(h, kind) {
    await tick();
    h.calls[0].resolve(payloads[kind]());
    await tick();
    assert.ok(h.last().data);
}

test('(a) going offline clears FAQ list/categories and services in the same transition', async () => {
    for (const kind of KINDS) {
        const h = harness(kind, { keepPrevious: kind === 'faq' });
        await loadOnline(h, kind);
        h.setOnline(false);
        const s = h.last();
        assert.equal(s.data, null);
        assert.equal(s.loading, false);
        assert.deepEqual(s.error, { kind: 'offline' });
        if (kind === 'faq') assert.deepEqual(shownFaq(s), { faqs: [], chips: [] });
        else assert.deepEqual(shownServices(s), []);
    }
});

test('(b) opened offline: nothing shown, no request, retry offline sends nothing', async () => {
    for (const kind of KINDS) {
        const h = harness(kind, { online: false, keepPrevious: true });
        await tick();
        assert.equal(h.calls.length, 0);
        assert.equal(h.last().data, null);
        assert.deepEqual(h.last().error, { kind: 'offline' });
        h.ctl.refresh();
        h.make({ search: 'heat' }); // search typed offline: param change sends nothing
        await tick();
        assert.equal(h.calls.length, 0);
        assert.equal(h.last().data, null);
    }
});

test('(c) reconnect: old data never reappears, loading while pending, data only after fresh success', async () => {
    for (const kind of KINDS) {
        const h = harness(kind, { keepPrevious: true });
        await loadOnline(h, kind);
        h.setOnline(false);
        h.setOnline(true);
        assert.equal(h.last().loading, true);
        assert.equal(h.last().data, null, 'loading state holds no old data');
        await tick();
        assert.equal(h.calls.length, 2);
        const afterOffline = h.states.slice(h.states.findIndex((s) => s.error));
        assert.ok(afterOffline.every((s) => s.data === null));
        h.calls[1].resolve(payloads[kind]('fresh'));
        await tick();
        assert.ok(JSON.stringify(h.last().data).includes('fresh'));
    }
});

test('(c2) a param change after offline/reconnect does not seed old data', async () => {
    const h = harness('faq', { keepPrevious: true });
    await loadOnline(h, 'faq');
    h.setOnline(false);
    h.setOnline(true);
    h.make({ category: 'x' }); // new params while the reconnect fetch is pending
    assert.equal(h.last().data, null);
    assert.equal(h.last().loading, true);
});

test('(d) failed refresh keeps data hidden; retry fetches fresh', async () => {
    for (const kind of KINDS) {
        for (const fail of [
            (c) => c.reject(Object.assign(new Error('net'), { kind: 'network' })),
            (c) => c.reject(Object.assign(new Error('http'), { kind: 'http', status: 500 })),
            (c) => c.resolve({ nonsense: true }),
            (c) => c.reject(Object.assign(new Error('timeout'), { kind: 'timeout' })),
        ]) {
            const h = harness(kind, { keepPrevious: true });
            await loadOnline(h, kind);
            h.setOnline(false);
            h.setOnline(true);
            await tick();
            fail(h.calls[1]);
            await tick();
            assert.equal(h.last().data, null);
            assert.ok(h.last().error);
            assert.equal(h.last().loading, false);
            h.ctl.refresh();
            assert.equal(h.last().data, null);
            assert.equal(h.last().loading, true);
            await tick();
            h.calls[2].resolve(payloads[kind]('retry'));
            await tick();
            assert.ok(JSON.stringify(h.last().data).includes('retry'));
        }
    }
});

test('(e) late response from a pre-offline request is ignored and aborted', async () => {
    for (const kind of KINDS) {
        const h = harness(kind, { keepPrevious: true });
        await tick();
        const early = h.calls[0];
        h.setOnline(false);
        assert.equal(early.signal.aborted, true);
        early.resolve(payloads[kind]('early'));
        await tick();
        assert.equal(h.last().data, null);
        h.setOnline(true);
        await tick();
        early.resolve(payloads[kind]('early-again'));
        await tick();
        assert.equal(h.last().data, null);
        assert.equal(h.last().loading, true);
    }
});

test('(e2) online param changes: refetch with the new params; previous result kept (dimmed) only online', async () => {
    const h = harness('faq', { keepPrevious: true });
    h.make(faqParams({ lang: 'en', category: 'All', search: '' }));
    await loadOnline(h, 'faq');
    h.make(faqParams({ lang: 'en', category: 'health-safety', search: 'heat' }));
    assert.equal(h.last().loading, true);
    assert.equal(h.last().data.faqs.length, 2, 'previous result stays while refetching online');
    await tick();
    assert.deepEqual(h.calls.at(-1).params, faqParams({ lang: 'en', category: 'health-safety', search: 'heat' }));
    h.calls.at(-1).resolve(faqPayload('new'));
    await tick();
    assert.equal(h.last().data.faqs[0].question, 'Q new');
    // language change for services refetches with lang
    const s = harness('services');
    s.make(servicesParams('hi'));
    await tick();
    assert.deepEqual(s.calls.at(-1).params, servicesParams('hi'));
});

test('(e3) default controller options are unchanged: refresh() never keeps data', async () => {
    const h = harness('faq');
    await loadOnline(h, 'faq');
    h.ctl.refresh({ keepData: true }); // no seed supplied (Emergency): still no data
    assert.equal(h.last().data, null);
});

test('(f) FAQ and services keep their search/filter/expand functionality', () => {
    const faq = read('src', 'components', 'FAQSection.jsx');
    const sv = read('src', 'components', 'LocalServices.jsx');
    assert.match(faq, /const SEARCH_DEBOUNCE_MS = 300/);
    assert.match(faq, /setTimeout\(\(\) => setDebouncedSearch\(q\), SEARCH_DEBOUNCE_MS\)/);
    assert.match(faq, /params: faqParams\(\{ lang, category: selectedCategory, search: debouncedSearch \}\)/);
    assert.match(faq, /useState\('All'\)/);
    assert.match(faq, /handleCategoryChange\(cat\.id\)/);
    assert.match(faq, /t\.plural\(resultsKey/);
    assert.match(faq, /faq\.clearFilters/);
    assert.match(faq, /wa\.me/);
    assert.match(faq, /aria-expanded=\{isOpen\}/);
    assert.match(faq, /faq\.noResults/);
    assert.match(faq, /<ErrorState error=\{error\} onRetry=\{retry\} \/>/);
    assert.match(faq, /<LoadingState/);
    assert.doesNotMatch(faq, /setCategories/, 'categories are derived from data, not kept in state');
    assert.match(sv, /params: servicesParams\(lang\)/);
    assert.match(sv, /CATEGORY_COLORS/);
    assert.match(sv, /<UnverifiedNotice \/>/);
    assert.match(sv, /setExpanded\(!expanded\)/);
    assert.match(sv, /services\.stat\.food/);
    assert.match(sv, /<ErrorState error=\{error\} onRetry=\{retry\} \/>/);
    assert.match(sv, /<LoadingState/);
    assert.match(sv, /services\.emptyTitle/);
});

test('(g) tabs use the fresh hook; no FAQ/services/emergency payload is persisted', () => {
    const files = {
        faq: read('src', 'components', 'FAQSection.jsx'),
        sv: read('src', 'components', 'LocalServices.jsx'),
        hook: read('src', 'hooks', 'useFreshApiGet.js'),
        ctl: read('src', 'utils', 'freshData.js'),
    };
    assert.match(files.faq, /useFreshApiGet\('\/api\/faq'/);
    assert.match(files.sv, /useFreshApiGet\('\/api\/services'/);
    assert.doesNotMatch(files.faq + files.sv, /useApiGet/);
    for (const [name, src] of Object.entries(files)) {
        assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB|\bcaches\b|CacheStorage|serviceWorker/, name);
    }
    assert.doesNotMatch(files.ctl, /^(let|var)\s/m);
    assert.doesNotMatch(files.hook, /^(let|var)\s/m);
});

const CONFIG = { version: 't', precache: ['/', '/assets/a.js'], apiBase: 'https://api.example.org' };
const ORIGIN = 'https://app.example.org';
test('(g2) service worker never handles /api/faq or /api/services', () => {
    const code = renderServiceWorker(read('pwa', 'sw.template.js'), CONFIG);
    const sandbox = {
        self: { location: { origin: ORIGIN }, addEventListener() {}, skipWaiting() {}, clients: { claim() {} } },
        caches: {}, URL, Promise, setTimeout, clearTimeout, Request: class {}, Response: {}, fetch() {},
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    const d = sandbox.decideRequest;
    const mk = (u, o = {}) => ({ url: u, method: 'GET', mode: 'cors', hasRange: false, ...o });
    for (const p of ['/api/faq', '/api/services']) {
        for (const u of [`${ORIGIN}${p}`, `${ORIGIN}${p}?lang=hi&search=heat&category=health-safety`, `https://api.example.org${p}?lang=ta`, `https://other.example.net${p}`]) {
            assert.equal(d(mk(u)), null, u);
        }
    }
    assert.doesNotMatch(code, /\/api\/(faq|services)/);
});
