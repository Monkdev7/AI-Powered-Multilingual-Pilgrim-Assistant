// Chat error classification and display text. Pure and Node-safe.
import { errorKeyForCode, isBackendErrorCode } from './errorCodes.js';

// Emergency numbers shown under chat errors. Single source for this file; values must not change
// without a factual-verification pass. The English wording is deliberate: unreviewed emergency
// content is not translated yet (see inc4-notes.md).
export const EMERGENCY_NUMBERS = Object.freeze({
    police: '100',
    ambulance: '108',
    controlRoom: '0734-2551234',
});

const FOOTER_LINES = Object.freeze([
    ['Police: {number}', 'police'],
    ['Ambulance: {number}', 'ambulance'],
    ['Simhastha Control Room: {number}', 'controlRoom'],
]);

// Emoji prefixes are decoration, not text, so they live outside the catalogs.
const ICON_TIMEOUT = '\u23F1\uFE0F';
const ICON_WARN = '\u26A0';
const ICON_WARN_EMOJI = '\u26A0\uFE0F';
const ICON_NETWORK = '\u{1F4E1}';

const WARN_BARE = new Set(['AI_QUOTA_EXCEEDED', 'AI_UNAVAILABLE', 'CHAT_NOT_CONFIGURED']);

export function chatErrorIcon(code) {
    if (code === 'timeout') return ICON_TIMEOUT;
    if (code === 'network') return ICON_NETWORK;
    if (WARN_BARE.has(code)) return ICON_WARN;
    return ICON_WARN_EMOJI;
}

// Maps whatever the fetch layer threw to a stable code or kind.
export function classifyChatError(err) {
    if (!err || typeof err !== 'object') return 'unknown';
    if (err.name === 'AbortError') return 'timeout';
    if (isBackendErrorCode(err.code)) return err.code;
    const status = Number(err.status);
    if (status === 404) return '404';
    if (status === 429) return '429';
    if (status === 503) return 'AI_UNAVAILABLE';
    if (status >= 500 && status < 600) return '5xx';
    if (err.kind === 'parse' || err instanceof SyntaxError) return 'parse';
    const msg = String(err.message || '');
    if (err instanceof TypeError || /Failed to fetch|NetworkError|Load failed|network/i.test(msg)) return 'network';
    return 'unknown';
}

// English emergency footer. Returns '' for timeouts (matches Phase 1/2 behaviour).
export function emergencyFooter(code) {
    if (code === 'timeout') return '';
    const heading = code === 'RATE_LIMITED' || code === '429' ? 'For immediate help:' : 'For emergencies:';
    const lines = FOOTER_LINES.map(([tpl, id]) => `\u2022 ${tpl.replace('{number}', EMERGENCY_NUMBERS[id])}`);
    return `${heading}\n${lines.join('\n')}`;
}

// t is the translator from useT(). The message text is translated; the footer stays English.
export function buildChatErrorText(code, t) {
    const body = `${chatErrorIcon(code)} ${t(errorKeyForCode(code))}`;
    const footer = emergencyFooter(code);
    return footer ? `${body}\n\n${footer}` : body;
}
