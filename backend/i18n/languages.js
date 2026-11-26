'use strict';
// Single backend list of supported languages (shared by the chat route and the content localization).
// Keep in step with frontend/src/i18n/languages.js (a frontend test compares the codes).
const LANGUAGE_NAMES = Object.freeze({
    en: 'English',
    hi: 'Hindi',
    bn: 'Bengali',
    ta: 'Tamil',
    te: 'Telugu',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
});
const SUPPORTED_LANGUAGES = Object.freeze(Object.keys(LANGUAGE_NAMES));
const DEFAULT_LANGUAGE = 'en';

module.exports = { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };
