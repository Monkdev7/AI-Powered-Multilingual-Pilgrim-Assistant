import { isSupportedLanguage, DEFAULT_LANGUAGE } from '../i18n/languages.js';

export { isSupportedLanguage, DEFAULT_LANGUAGE };

// Namespaced like 'simhastha_chat_history'
export const LANGUAGE_STORAGE_KEY = 'simhastha_language';


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
