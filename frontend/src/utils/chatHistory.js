// Pure helpers for the persisted chat history (localStorage key 'simhastha_chat_history').
// The stored format is unchanged: an array of { id, role, content, timestamp, isError? }.
// New in INC4: error bubbles also carry `errorCode` (stable code/kind) instead of translated text.
import en from '../i18n/locales/en.js';
import { buildChatErrorText } from './chatErrors.js';

export const STORAGE_KEY = 'simhastha_chat_history';
export const WELCOME_ID = 'welcome';
export const MAX_STORED_MESSAGES = 50;
export const MAX_API_HISTORY = 10;

// Every welcome ever stored (and the one written today) contains this phrase.
const LEGACY_WELCOME_MARKER = 'I am KumbhSaathi, your Simhastha Kumbh 2028 assistant';

export function createWelcomeMessage(now = new Date()) {
    // English text is stored for format compatibility; the UI renders t('chat.welcome') instead.
    return { id: WELCOME_ID, role: 'assistant', content: en.messages['chat.welcome'], timestamp: now.toISOString() };
}

export function isWelcomeMessage(m) {
    if (!m || typeof m !== 'object') return false;
    if (m.id === WELCOME_ID) return true;
    return m.role === 'assistant' && !m.isError && typeof m.content === 'string' && m.content.includes(LEGACY_WELCOME_MARKER);
}

export function isErrorMessage(m) {
    return Boolean(m && m.isError === true);
}

export function createErrorMessage(code, id, now = new Date()) {
    return { id, role: 'assistant', content: '', timestamp: now.toISOString(), isError: true, errorCode: String(code) };
}

function validTimestamp(value) {
    return typeof value === 'string' && !Number.isNaN(new Date(value).getTime()) ? value : '';
}

// Accepts whatever JSON.parse returned (or a raw string) and returns a safe, renderable array.
// Never throws. Unknown extra fields are preserved. Empty or unusable input yields [welcome].
export function normalizeStoredMessages(raw, now = new Date()) {
    let data = raw;
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            data = null;
        }
    }
    if (!Array.isArray(data)) return [createWelcomeMessage(now)];

    const seen = new Set();
    const out = [];
    data.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        if (item.role !== 'user' && item.role !== 'assistant') return;
        const hasCode = item.isError === true && typeof item.errorCode === 'string' && item.errorCode !== '';
        if (typeof item.content !== 'string' && !hasCode) return;

        let id = typeof item.id === 'string' && item.id ? item.id : typeof item.id === 'number' ? String(item.id) : `restored-${index}`;
        const welcome = isWelcomeMessage({ ...item, id });
        if (welcome) id = WELCOME_ID;
        while (seen.has(id)) id = `${id}-${index}`;
        seen.add(id);

        out.push({
            ...item,
            id,
            content: typeof item.content === 'string' ? item.content : '',
            timestamp: validTimestamp(item.timestamp),
        });
    });
    return out.length > 0 ? out : [createWelcomeMessage(now)];
}

export function trimForStorage(messages) {
    return messages.slice(-MAX_STORED_MESSAGES);
}

// History sent to the API: no welcome, no error bubbles, no empty turns, last 10 messages.
export function toApiHistory(messages) {
    return messages
        .filter((m) => !isWelcomeMessage(m) && !isErrorMessage(m) && typeof m.content === 'string' && m.content.trim() !== '')
        .slice(-MAX_API_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));
}

// Text to display for a message in the current language.
// - welcome: always the localized welcome
// - new error bubble (errorCode): rebuilt from the code, so it follows language changes
// - legacy error bubble or normal message: exactly the stored text
export function resolveMessageText(message, t) {
    if (isWelcomeMessage(message)) return t('chat.welcome');
    if (isErrorMessage(message) && typeof message.errorCode === 'string' && message.errorCode) {
        return buildChatErrorText(message.errorCode, t);
    }
    return message.content;
}
