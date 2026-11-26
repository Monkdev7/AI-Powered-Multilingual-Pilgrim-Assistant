// Central API client for GET requests to the backend.
// Empty/unset VITE_API_URL keeps relative paths (Vite dev proxy or same-origin hosting).

import en from '../i18n/locales/en.js';
import { errorKeyForCode } from './errorCodes.js';

const DEFAULT_TIMEOUT_MS = 15000;

export function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

export const API_BASE = normalizeBaseUrl(import.meta.env?.VITE_API_URL);

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

// Stable client error kind: 'network' | 'timeout' | 'parse' | '404' | '429' | '5xx' | 'unknown'.
// Never derived from backend error text.
export function getErrorCode(err) {
    if (err instanceof ApiError) {
        if (err.kind === 'network' || err.kind === 'timeout' || err.kind === 'parse') return err.kind;
        if (err.kind === 'http') {
            if (err.status === 404) return '404';
            if (err.status === 429) return '429';
            if (err.status >= 500) return '5xx';
        }
    }
    return 'unknown';
}

// Translation key for an error. The component calls t(getErrorKey(err)).
export function getErrorKey(err) {
    return errorKeyForCode(getErrorCode(err));
}

// Safe, user-facing text. Never includes backend error bodies or internal details.
// Pass the translator from useT() to localize; without it the English catalog text is returned.
export function getErrorMessage(err, t) {
    const key = getErrorKey(err);
    return typeof t === 'function' ? t(key) : en.messages[key];
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
