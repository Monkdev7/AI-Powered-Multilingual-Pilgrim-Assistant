'use strict';
// Content localization for the FAQ, emergency and services APIs.
//
// Overlay files: backend/i18n/<lang>/<domain>.json, flat { "<stable key>": "text" } plus "_meta".
// English (en) is the canonical text. Other languages hold TRANSLATABLE TEXT ONLY: factual values
// (phone numbers, URLs, planned dates, icons, flags, source metadata) come from the facts registry or the
// route structure and are injected through {placeholders}.
//
// Missing keys fall back to English per key. Keys listed in _meta.keptEnglish are deliberately not
// translated (unreviewed emergency/medical content); they are also reported as fallbacks.
const fs = require('fs');
const path = require('path');
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('./languages');

const DOMAINS = Object.freeze(['faq', 'emergency', 'services']);
const META_STATUSES = ['source', 'needs-review', 'reviewed'];
const PLACEHOLDER_RE = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

const placeholdersOf = (s) => [...String(s).matchAll(PLACEHOLDER_RE)].map((m) => m[1]).sort();
const samePlaceholders = (a, b) => JSON.stringify(placeholdersOf(a)) === JSON.stringify(placeholdersOf(b));
const isText = (v) => typeof v === 'string' && v.trim() !== '';

function fill(template, params) {
    if (!params) return template;
    return template.replace(PLACEHOLDER_RE, (m, name) => (params[name] === undefined || params[name] === null ? m : String(params[name])));
}

// Structural validation of one overlay. Returns an array of error strings (empty = valid).
function validateOverlay(lang, domain, overlay, english) {
    const errors = [];
    const where = `${lang}/${domain}`;
    if (!overlay || typeof overlay !== 'object' || Array.isArray(overlay)) return [`${where}: overlay must be an object`];
    const meta = overlay._meta;
    if (!meta || typeof meta !== 'object') errors.push(`${where}: _meta is required`);
    else {
        if (!META_STATUSES.includes(meta.status)) errors.push(`${where}: _meta.status must be one of ${META_STATUSES.join(', ')}`);
        if ((lang === DEFAULT_LANGUAGE) !== (meta.status === 'source')) errors.push(`${where}: only en may have status "source"`);
        if (meta.keptEnglish !== undefined && !(Array.isArray(meta.keptEnglish) && meta.keptEnglish.every((k) => typeof k === 'string'))) {
            errors.push(`${where}: _meta.keptEnglish must be an array of keys`);
        }
    }
    for (const [key, value] of Object.entries(overlay)) {
        if (key === '_meta') continue;
        if (typeof value !== 'string') errors.push(`${where}: ${key} must be a string`);
        else if (english && lang !== DEFAULT_LANGUAGE) {
            if (!(key in english)) errors.push(`${where}: unknown key ${key}`);
            else if (value.trim() === '') errors.push(`${where}: ${key} is empty`);
            else if (!samePlaceholders(value, english[key])) errors.push(`${where}: ${key} placeholders differ from English`);
        }
    }
    if (english && lang !== DEFAULT_LANGUAGE && meta && Array.isArray(meta.keptEnglish)) {
        for (const k of meta.keptEnglish) if (!(k in english)) errors.push(`${where}: keptEnglish references unknown key ${k}`);
    }
    return errors;
}

function readOverlay(dir, lang, domain) {
    const file = path.join(dir, lang, `${domain}.json`);
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        throw new Error(`i18n overlay could not be read (${file}): ${e.message}`);
    }
}

function deepFreeze(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) {
        Object.freeze(o);
        Object.values(o).forEach(deepFreeze);
    }
    return o;
}

/**
 * options.dir: overlay directory (default backend/i18n).
 * options.overlays: { [lang]: { [domain]: overlay } } used instead of files (tests). A missing domain falls
 *   back to English entirely.
 * options.warn: sink for dev warnings about missing keys; default console.warn only when NODE_ENV=development.
 */
function createI18n(options = {}) {
    const dir = options.dir || __dirname;
    const warn = options.warn || ((m) => { if (process.env.NODE_ENV === 'development') console.warn(m); });
    const warned = new Set();
    const overlays = {};
    for (const lang of SUPPORTED_LANGUAGES) {
        overlays[lang] = {};
        for (const domain of DOMAINS) {
            const fromOptions = options.overlays && options.overlays[lang] && options.overlays[lang][domain];
            if (options.overlays && !fromOptions && lang !== DEFAULT_LANGUAGE) continue;
            overlays[lang][domain] = deepFreeze(fromOptions || readOverlay(dir, lang, domain));
        }
    }
    const english = overlays[DEFAULT_LANGUAGE];
    if (!options.overlays) {
        // Fail fast on a structurally invalid shipped overlay.
        const errors = [];
        for (const lang of SUPPORTED_LANGUAGES) {
            for (const domain of DOMAINS) {
                if (overlays[lang][domain]) errors.push(...validateOverlay(lang, domain, overlays[lang][domain], english[domain]));
            }
        }
        if (errors.length) throw new Error(`i18n overlays invalid (${errors.length} error(s)):\n- ${errors.join('\n- ')}`);
    }

    // Normalized language from a raw query value. undefined => legacy English (no localization metadata).
    function parseLang(raw) {
        if (raw === undefined) return { ok: true, lang: null };
        if (typeof raw !== 'string') return { ok: false };
        const code = raw.trim().toLowerCase();
        return SUPPORTED_LANGUAGES.includes(code) ? { ok: true, lang: code } : { ok: false };
    }

    // Express middleware: sets req.lang (null when ?lang is absent) or answers 400.
    function langMiddleware(req, res, next) {
        const parsed = parseLang(req.query.lang);
        if (!parsed.ok) {
            return res.status(400).json({ error: 'Unsupported language', code: 'INVALID_REQUEST', supported: [...SUPPORTED_LANGUAGES] });
        }
        req.lang = parsed.lang;
        return next();
    }

    // A translator for one language and domain. t(key, params) returns the text; fallbackIds() lists the keys
    // that were served in English although the requested language is not English.
    function scope(lang, domain) {
        const code = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
        const base = english[domain];
        const over = code === DEFAULT_LANGUAGE ? base : overlays[code][domain];
        const kept = new Set((over && over._meta && over._meta.keptEnglish) || []);
        const fallback = new Set();
        function t(key, params) {
            const source = base[key];
            if (typeof source !== 'string' || key === '_meta') throw new Error(`i18n: unknown key ${domain}:${key}`);
            if (code === DEFAULT_LANGUAGE) return fill(source, params);
            const own = over && !kept.has(key) ? over[key] : undefined;
            if (isText(own) && samePlaceholders(own, source)) return fill(own, params);
            fallback.add(key);
            if (!kept.has(key)) {
                const id = `${code}:${domain}:${key}`;
                if (!warned.has(id)) {
                    warned.add(id);
                    warn(`[i18n] missing or invalid translation ${id}, using English`);
                }
            }
            return fill(source, params);
        }
        return {
            lang: code,
            t,
            fallbackIds: () => [...fallback],
            addFallbackTo: (set) => fallback.forEach((k) => set.add(k)),
            status: () => {
                if (code === DEFAULT_LANGUAGE) return 'source';
                const s = over && over._meta && over._meta.status;
                return s === 'reviewed' && fallback.size === 0 ? 'reviewed' : 'needs-review';
            },
        };
    }

    // Response metadata. `fallbacks` is a Set of "<domain>.<key>" ids. A language is 'reviewed' only if every
    // involved overlay says so and nothing fell back to English.
    function translationMeta(lang, scopes, fallbacks) {
        if (lang === DEFAULT_LANGUAGE) return { status: 'source', fallbackIds: [] };
        const allReviewed = scopes.length > 0 && scopes.every((s) => s.status() === 'reviewed');
        return { status: allReviewed && fallbacks.size === 0 ? 'reviewed' : 'needs-review', fallbackIds: [...fallbacks] };
    }

    return {
        supported: SUPPORTED_LANGUAGES,
        overlays,
        parseLang,
        langMiddleware,
        scope,
        translationMeta,
    };
}

let shared;
// Shared instance (loads and validates the shipped overlays once, on first use).
function getDefaultI18n() {
    if (!shared) shared = createI18n();
    return shared;
}

module.exports = {
    DOMAINS,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    createI18n,
    getDefaultI18n,
    validateOverlay,
    placeholdersOf,
    samePlaceholders,
    fill,
};
