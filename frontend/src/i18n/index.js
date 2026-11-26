import en from './locales/en.js';
import { DEFAULT_LANGUAGE, getLanguage, isSupportedLanguage } from './languages.js';
import { glossaryTerm } from './glossary.js';

export { SUPPORTED_LANGUAGES, LANGUAGE_CODES, DEFAULT_LANGUAGE, isSupportedLanguage, getLanguage } from './languages.js';
import { createFormatter } from './format.js';
export { createFormatter, TIME_ZONE } from './format.js';

const TOKEN_RE = /\{([A-Za-z][\w.]*|g:[A-Za-z]\w*)\}/g;

// Explicit loader map so Vite code-splits one chunk per locale.
const LOADERS = {
    hi: () => import('./locales/hi.js'),
    bn: () => import('./locales/bn.js'),
    ta: () => import('./locales/ta.js'),
    te: () => import('./locales/te.js'),
    mr: () => import('./locales/mr.js'),
    gu: () => import('./locales/gu.js'),
    pa: () => import('./locales/pa.js'),
};

export const ENGLISH_CATALOG = en;

export async function loadLocale(code) {
    if (code === 'en') return en;
    if (!isSupportedLanguage(code) || !LOADERS[code]) {
        throw new Error(`Unsupported language: ${code}`);
    }
    const mod = await LOADERS[code]();
    return mod.default;
}

// Identity helper that lets a static scan see keys used through lookup tables.
export function tk(key) {
    return key;
}

export function interpolate(template, params = {}, lang = DEFAULT_LANGUAGE, onMissing) {
    return template.replace(TOKEN_RE, (match, name) => {
        if (name.startsWith('g:')) {
            const term = glossaryTerm(name.slice(2), lang);
            if (term === undefined) {
                if (onMissing) onMissing(name);
                return match;
            }
            return term;
        }
        if (params[name] === undefined || params[name] === null) {
            if (onMissing) onMissing(name);
            return match;
        }
        return String(params[name]);
    });
}

export function pluralCategoriesFor(locale) {
    try {
        return new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
    } catch {
        return ['one', 'other'];
    }
}

// Returns [{ base, missing: [categories] }] for plural groups (keys ending in a plural
// category) that lack a category the locale's PluralRules can return.
export function findIncompletePluralGroups(messages, locale) {
    const needed = pluralCategoriesFor(locale);
    const groups = {};
    for (const k of Object.keys(messages || {})) {
        const m = k.match(/^(.*)\.(zero|one|two|few|many|other)$/);
        if (m) (groups[m[1]] ||= new Set()).add(m[2]);
    }
    return Object.entries(groups)
        .map(([base, have]) => ({ base, missing: needed.filter((c) => !have.has(c)) }))
        .filter((g) => g.missing.length > 0);
}

const PLURAL_SUFFIX_RE = /\.(zero|one|two|few|many|other)$/;

// Result: { text } found, { incomplete: category } when the key is a plural group that lacks
// the needed category (never falls back to '.other' silently), or {} when absent.
function resolveKey(messages, key, count, locale, allowOtherFallback = false) {
    if (!messages) return {};
    if (typeof count === 'number') {
        let category = 'other';
        try {
            category = new Intl.PluralRules(locale).select(count);
        } catch {
            // keep 'other'
        }
        if (typeof messages[`${key}.${category}`] === 'string') return { text: messages[`${key}.${category}`] };
        const isGroup = Object.keys(messages).some((k) => k.startsWith(`${key}.`) && PLURAL_SUFFIX_RE.test(k) && k.slice(key.length + 1).search(/\./) === -1);
        if (isGroup) {
            if (allowOtherFallback && typeof messages[`${key}.other`] === 'string') return { text: messages[`${key}.other`] };
            return { incomplete: category };
        }
    }
    return typeof messages[key] === 'string' ? { text: messages[key] } : {};
}

/**
 * catalogs: { en, [code]: {_meta, messages} | null }. A missing entry means the catalog is
 * still loading (English is shown silently). null means loading failed.
 * `warned` is the once-per-session tracker; pass one shared Set (the provider does) so
 * translators rebuilt on language/catalog change never re-warn the same lang:key.
 */
export function createTranslator({
    lang = DEFAULT_LANGUAGE,
    catalogs = { en },
    dev = false,
    warn = (...args) => console.warn(...args),
    markers = true,
    warned = new Set(),
} = {}) {
    const code = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
    const locale = getLanguage(code).locale;
    const { formatNumber } = createFormatter(code);
    const englishMessages = (catalogs.en || en).messages;
    const selected = code === 'en' ? catalogs.en || en : catalogs[code];
    const warnOnce = (id, message) => {
        if (warned.has(id)) return;
        warned.add(id);
        warn(message);
    };
    function translate(key, params, count) {
        const found = resolveKey(selected?.messages, key, count, locale);
        let text = found.text;
        let fellBack = false;
        if (text === undefined) {
            if (found.incomplete && dev) {
                warnOnce(`${code}:${key}:plural:${found.incomplete}`, `[i18n] "${key}" for "${code}" has no plural category "${found.incomplete}", using English`);
            }
            text = resolveKey(englishMessages, key, count, 'en-IN', true).text;
            fellBack = code !== 'en' && selected !== undefined && selected !== null;
            if (text === undefined) {
                warnOnce(`${code}:${key}`, `[i18n] missing key "${key}" in English and "${code}"`);
                return dev && markers ? `⟦missing:${key}⟧` : key;
            }
            if (fellBack && dev && !found.incomplete) {
                warnOnce(`${code}:${key}`, `[i18n] missing "${key}" for "${code}"`);
            }
        }
        const out = interpolate(text, params, code, (name) => {
            if (dev) warnOnce(`${code}:${key}:param:${name}`, `[i18n] missing param "${name}" for "${key}"`);
        });
        return fellBack && dev && markers ? `⟦${out}⟧` : out;
    }
    function t(key, params = {}) {
        const count = params && typeof params.count === 'number' ? params.count : undefined;
        return translate(key, params, count);
    }
    // Category comes from the raw count; the displayed {count} is formatNumber(count)
    // (Latin digits, Indian grouping). Other params stay raw.
    t.plural = (key, count, params = {}) => translate(key, { ...params, count: formatNumber(count) }, count);
    return t;
}
