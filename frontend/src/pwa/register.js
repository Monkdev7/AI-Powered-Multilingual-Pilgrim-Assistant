// Registers the service worker. Called from main.jsx in production builds only (import.meta.env.PROD),
// so Vite dev/HMR never sees a worker. Registration waits for window load so it cannot compete with first paint.
export function registerServiceWorker(win = globalThis.window, nav = globalThis.navigator) {
    if (!win || !nav || !('serviceWorker' in nav)) return;
    const register = () => {
        nav.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch((err) => {
            console.warn('Service worker registration failed', err);
        });
    };
    if (win.document?.readyState === 'complete') register();
    else win.addEventListener('load', register, { once: true });
}
