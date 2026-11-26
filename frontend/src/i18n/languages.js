// Single source of truth for supported UI languages.
// `script` is the Unicode script name and drives script tests and fonts.
export const SUPPORTED_LANGUAGES = Object.freeze([
    { code: 'en', englishName: 'English', nativeName: 'English', script: 'Latin', locale: 'en-IN' },
    { code: 'hi', englishName: 'Hindi', nativeName: 'हिंदी', script: 'Devanagari', locale: 'hi-IN' },
    { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', locale: 'bn-IN' },
    { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', locale: 'ta-IN' },
    { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', locale: 'te-IN' },
    { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', locale: 'mr-IN' },
    { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', locale: 'gu-IN' },
    { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', locale: 'pa-IN' },
].map((lang) => Object.freeze(lang)));

export const LANGUAGE_CODES = Object.freeze(SUPPORTED_LANGUAGES.map((l) => l.code));
export const DEFAULT_LANGUAGE = 'en';

export function isSupportedLanguage(code) {
    return typeof code === 'string' && LANGUAGE_CODES.includes(code);
}

export function getLanguage(code) {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
