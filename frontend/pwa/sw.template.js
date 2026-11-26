/* Simhastha Pilgrim Assistant service worker. Generated into dist/sw.js by pwa/swPlugin.js.
 *
 * Scope: the app shell and versioned static files only.
 *  - /api/* and the configured API origin are NEVER handled: no respondWith, so emergency contacts, FAQs,
 *    services and the facts registry always come from the network and are never cached or served stale.
 *  - Only same-origin GET requests without Range are handled; only status 200 "basic" responses are stored.
 *  - Navigations: network first, cached shell ('/') when the network fails or is slow.
 *  - /assets/*, /fonts/*, /icons/* and the precached files: cache first. Unhashed files are refreshed in the
 *    background.
 * skipWaiting + clients.claim are safe here because HTML is network first and hashed assets are keyed by URL,
 * so an old shell and new assets are never mixed. The shell and its assets are precached together.
 */
var SW_CONFIG = /*__SW_CONFIG__*/ { version: 'dev', precache: ['/'], apiBase: '' };

var CACHE_PREFIX = 'simhastha-shell-';
var CACHE_NAME = CACHE_PREFIX + SW_CONFIG.version;
var SHELL_URL = '/';
var NAVIGATION_TIMEOUT_MS = 4000;
var STATIC_PREFIXES = ['/assets/', '/fonts/', '/icons/'];

function isApiPath(pathname) {
    return pathname === '/api' || pathname.indexOf('/api/') === 0;
}

// Pure decision. req: { url, method, mode, hasRange }. Returns 'navigate', 'static' or null (do not handle).
function decideRequest(req, origin, config) {
    var cfg = config || SW_CONFIG;
    var url;
    try {
        url = new URL(req.url);
    } catch (e) {
        return null;
    }
    if (req.method !== 'GET' || req.hasRange) return null;
    if (url.origin !== origin) return null;
    if (isApiPath(url.pathname)) return null;
    if (cfg.apiBase && req.url.indexOf(cfg.apiBase) === 0) return null;
    if (url.pathname === '/sw.js') return null;
    if (req.mode === 'navigate') {
        for (var i = 0; i < STATIC_PREFIXES.length; i++) {
            if (url.pathname.indexOf(STATIC_PREFIXES[i]) === 0) return null;
        }
        return 'navigate';
    }
    for (var j = 0; j < STATIC_PREFIXES.length; j++) {
        if (url.pathname.indexOf(STATIC_PREFIXES[j]) === 0) return 'static';
    }
    if (cfg.precache.indexOf(url.pathname) !== -1 && url.pathname !== SHELL_URL) return 'static';
    return null;
}

// Only complete, same-origin, 200 responses are ever stored.
function isCacheable(response) {
    return !!response && response.status === 200 && response.type === 'basic';
}

function isHashedPath(pathname) {
    return pathname.indexOf('/assets/') === 0 || pathname.indexOf('/fonts/') === 0;
}

function precacheAll() {
    return caches.open(CACHE_NAME).then(function (cache) {
        return Promise.all(
            SW_CONFIG.precache.map(function (path) {
                return fetch(new Request(path, { cache: 'reload' })).then(function (res) {
                    if (!isCacheable(res)) throw new Error('Precache failed: ' + path);
                    return cache.put(path, res);
                });
            })
        );
    });
}

function deleteOldCaches() {
    return caches.keys().then(function (keys) {
        return Promise.all(
            keys
                .filter(function (k) {
                    return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_NAME;
                })
                .map(function (k) {
                    return caches.delete(k);
                })
        );
    });
}

function shellFallback() {
    return caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(SHELL_URL);
    });
}

function handleNavigation(request) {
    return new Promise(function (resolve) {
        var settled = false;
        var timer = setTimeout(function () {
            shellFallback().then(function (cached) {
                if (cached && !settled) {
                    settled = true;
                    resolve(cached);
                }
            });
        }, NAVIGATION_TIMEOUT_MS);
        fetch(request).then(
            function (res) {
                clearTimeout(timer);
                if (settled) return;
                if (res.status < 500) {
                    settled = true;
                    resolve(res);
                    return;
                }
                shellFallback().then(function (cached) {
                    settled = true;
                    resolve(cached || res);
                });
            },
            function (err) {
                clearTimeout(timer);
                if (settled) return;
                shellFallback().then(function (cached) {
                    settled = true;
                    if (cached) resolve(cached);
                    else resolve(Response.error());
                });
            }
        );
    });
}

function fetchAndStore(cache, request) {
    return fetch(request).then(function (res) {
        if (isCacheable(res)) cache.put(request, res.clone());
        return res;
    });
}

function handleStatic(request) {
    var pathname = new URL(request.url).pathname;
    return caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(request).then(function (cached) {
            if (cached) {
                if (!isHashedPath(pathname)) fetchAndStore(cache, request).catch(function () {});
                return cached;
            }
            return fetchAndStore(cache, request);
        });
    });
}

self.addEventListener('install', function (event) {
    event.waitUntil(precacheAll().then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
    event.waitUntil(deleteOldCaches().then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
    var request = event.request;
    var kind = decideRequest(
        { url: request.url, method: request.method, mode: request.mode, hasRange: request.headers.has('range') },
        self.location.origin,
        SW_CONFIG
    );
    if (!kind) return; // not handled: the browser goes straight to the network
    event.respondWith(kind === 'navigate' ? handleNavigation(request) : handleStatic(request));
});
