import { SUPPORTED_LANGUAGES } from '../i18n/languages.js';
// Pure helpers for the language menu (kept out of the component so node:test can cover them).
export function getLanguageOptions(languages = SUPPORTED_LANGUAGES) {
    return languages.map(({ code, nativeName, englishName }) => ({ code, nativeName, englishName }));
}
export function indexOfLanguage(options, code) {
    const i = options.findIndex((o) => o.code === code);
    return i === -1 ? 0 : i;
}
// Next highlighted index for a listbox key. Moves are clamped (no wrap); unknown keys keep `current`.
export function nextMenuIndex(current, key, length) {
    if (length <= 0) return -1;
    switch (key) {
        case 'ArrowDown':
            return Math.min(current + 1, length - 1);
        case 'ArrowUp':
            return Math.max(current - 1, 0);
        case 'Home':
            return 0;
        case 'End':
            return length - 1;
        default:
            return current;
    }
}