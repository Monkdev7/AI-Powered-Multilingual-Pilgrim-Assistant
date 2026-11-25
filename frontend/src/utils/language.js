import { UI_LABELS } from '../data/uiLabels';

// Namespaced like 'simhastha_chat_history'
export const LANGUAGE_STORAGE_KEY = 'simhastha_language';
export const DEFAULT_LANGUAGE = 'en';

// Supported codes are the keys of UI_LABELS (en, hi, bn, ta, te, mr, gu, pa)
export function isSupportedLanguage(code) {
    return typeof code === 'string' && Object.prototype.hasOwnProperty.call(UI_LABELS, code);
}

function getStorage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

export function loadLanguage(storage = getStorage()) {
    try {
        const saved = storage?.getItem(LANGUAGE_STORAGE_KEY);
        return isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE;
    } catch {
        return DEFAULT_LANGUAGE;
    }
}

export function saveLanguage(code, storage = getStorage()) {
    if (!isSupportedLanguage(code)) return false;
    try {
        storage?.setItem(LANGUAGE_STORAGE_KEY, code);
        return !!storage;
    } catch {
        return false;
    }
}
