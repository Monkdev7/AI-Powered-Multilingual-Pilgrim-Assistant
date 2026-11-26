// Pure online/offline helpers (Node-safe, no React). navigator.onLine === false is the only "offline" signal;
// a missing navigator counts as online.
export function isOnline(nav = globalThis.navigator) {
    return !nav || nav.onLine !== false;
}

// Subscribes to the window online/offline events. Returns an unsubscribe function.
export function subscribeOnlineStatus(callback, target = globalThis.window) {
    if (!target || typeof target.addEventListener !== 'function') return () => {};
    target.addEventListener('online', callback);
    target.addEventListener('offline', callback);
    return () => {
        target.removeEventListener('online', callback);
        target.removeEventListener('offline', callback);
    };
}
