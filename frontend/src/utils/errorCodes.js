// Stable error codes/kinds -> translation keys. Pure and Node-safe (no DOM, no import.meta).
// Backend codes come from backend/routes/chat.js and the app-level handlers; client kinds are
// produced by the fetch layer. Codes never change; only the catalog text is translated.
import { tk } from '../i18n/index.js';

export const BACKEND_ERROR_CODES = Object.freeze([
    'AI_QUOTA_EXCEEDED',
    'AI_UNAVAILABLE',
    'CHAT_NOT_CONFIGURED',
    'AI_INVALID_REQUEST',
    'AI_ERROR',
    'RATE_LIMITED',
    'INVALID_JSON',
    'PAYLOAD_TOO_LARGE',
    'INTERNAL_ERROR',
    'INVALID_REQUEST',
]);

export const CLIENT_ERROR_KINDS = Object.freeze(['network', 'timeout', 'parse', '404', '429', '5xx', 'unknown']);

export const ERROR_KEYS = Object.freeze({
    AI_QUOTA_EXCEEDED: tk('err.aiQuota'),
    AI_UNAVAILABLE: tk('err.aiUnavailable'),
    CHAT_NOT_CONFIGURED: tk('err.chatNotConfigured'),
    AI_INVALID_REQUEST: tk('err.aiInvalidRequest'),
    AI_ERROR: tk('err.aiError'),
    RATE_LIMITED: tk('err.rateLimited'),
    INVALID_JSON: tk('err.invalidJson'),
    PAYLOAD_TOO_LARGE: tk('err.payloadTooLarge'),
    INTERNAL_ERROR: tk('err.internal'),
    INVALID_REQUEST: tk('err.invalidRequest'),
    network: tk('err.network'),
    timeout: tk('err.timeout'),
    parse: tk('err.parse'),
    404: tk('err.notFound'),
    429: tk('err.rateLimited'),
    '5xx': tk('err.server'),
    unknown: tk('err.unknown'),
});

// Unknown or missing codes (for example from a newer backend) fall back to the generic message.
export function errorKeyForCode(code) {
    const c = String(code ?? '');
    return Object.prototype.hasOwnProperty.call(ERROR_KEYS, c) ? ERROR_KEYS[c] : ERROR_KEYS.unknown;
}

export function isBackendErrorCode(code) {
    return BACKEND_ERROR_CODES.includes(code);
}
