// Central API client for GET requests to the backend.
// Empty/unset VITE_API_URL keeps relative paths (Vite dev proxy or same-origin hosting).

const DEFAULT_TIMEOUT_MS = 15000;

export function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

export const API_BASE = normalizeBaseUrl(import.meta.env.VITE_API_URL);

// kind: 'network' | 'timeout' | 'http' | 'parse' | 'aborted'
export class ApiError extends Error {
    constructor(kind, status) {
        super(`API request failed (${kind}${status ? ` ${status}` : ''})`);
        this.name = 'ApiError';
        this.kind = kind;
        this.status = status;
    }
}

export function isAbortedError(err) {
    return err instanceof ApiError && err.kind === 'aborted';
}

// Safe, user-facing text. Never includes backend error bodies or internal details.
export function getErrorMessage(err) {
    if (err instanceof ApiError) {
        if (err.kind === 'network') return 'Could not reach the server. Please check your connection and try again.';
        if (err.kind === 'timeout') return 'The server took too long to respond. Please try again.';
        if (err.kind === 'parse') return 'The server sent an unexpected response. Please try again.';
        if (err.kind === 'http') {
            if (err.status === 404) return 'This information could not be found.';
            if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
            if (err.status >= 500) return 'The server is having trouble right now. Please try again shortly.';
        }
    }
    return 'Something went wrong. Please try again.';
}

export function buildUrl(baseUrl, path, params) {
    const cleanPath = `/${String(path).replace(/^\/+/, '')}`;
    const query = new URLSearchParams();
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') query.append(key, String(value));
        }
    }
    const qs = query.toString();
    return `${baseUrl}${cleanPath}${qs ? `?${qs}` : ''}`;
}

export function createApiClient({ baseUrl = API_BASE, fetchImpl, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const base = normalizeBaseUrl(baseUrl);
    const doFetch = fetchImpl || ((...args) => globalThis.fetch(...args));

    async function get(path, { params, signal, timeout = timeoutMs } = {}) {
        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, timeout);
        const onCallerAbort = () => controller.abort();
        if (signal) {
            if (signal.aborted) controller.abort();
            else signal.addEventListener('abort', onCallerAbort, { once: true });
        }

        const abortError = () => {
            if (signal?.aborted) return new ApiError('aborted');
            if (timedOut) return new ApiError('timeout');
            return null;
        };

        try {
            let response;
            try {
                response = await doFetch(buildUrl(base, path, params), {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
            } catch {
                throw abortError() || new ApiError('network');
            }

            if (!response.ok) throw new ApiError('http', response.status);

            try {
                return await response.json();
            } catch {
                throw abortError() || new ApiError('parse');
            }
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onCallerAbort);
        }
    }

    return { get };
}

const defaultClient = createApiClient();

export const apiGet = defaultClient.get;
