import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nContext } from './useT.js';
import { createTranslator, loadLocale, ENGLISH_CATALOG } from './index.js';
import { createFormatter } from './format.js';
import { SUPPORTED_LANGUAGES, isSupportedLanguage } from './languages.js';
import { applyDocumentMetadata } from './metadata.js';
import { loadLanguage, saveLanguage } from '../utils/language.js';

const DEV = Boolean(import.meta.env?.DEV);

export default function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(loadLanguage);
    // Once-per-session warning tracker shared by every translator; never reset on language change.
    const warnedRef = useRef(new Set());
    const [catalogs, setCatalogs] = useState({ en: ENGLISH_CATALOG });

    const setLang = useCallback((code) => {
        if (!isSupportedLanguage(code)) return;
        setLangState(code);
        saveLanguage(code);
    }, []);

    useEffect(() => {
        if (lang === 'en' || catalogs[lang] !== undefined) return undefined;
        let cancelled = false;
        loadLocale(lang)
            .then((catalog) => {
                if (!cancelled) setCatalogs((prev) => ({ ...prev, [lang]: catalog }));
            })
            .catch(() => {
                console.warn(`[i18n] could not load locale "${lang}", showing English`);
                if (!cancelled) setCatalogs((prev) => ({ ...prev, [lang]: null }));
            });
        return () => {
            cancelled = true;
        };
    }, [lang, catalogs]);

    const catalog = lang === 'en' ? ENGLISH_CATALOG : catalogs[lang];

    const t = useMemo(() => createTranslator({ lang, catalogs, dev: DEV, warned: warnedRef.current }), [lang, catalogs]);
    const tClean = useMemo(() => createTranslator({ lang, catalogs, dev: false, markers: false }), [lang, catalogs]);
    const formatter = useMemo(() => createFormatter(lang), [lang]);

    useEffect(() => {
        applyDocumentMetadata(lang, tClean);
    }, [lang, tClean]);

    const value = useMemo(
        () => ({
            lang,
            setLang,
            t,
            status: catalog?._meta?.status ?? 'draft',
            ready: lang === 'en' || Boolean(catalog),
            languages: SUPPORTED_LANGUAGES,
            ...formatter,
        }),
        [lang, setLang, t, catalog, formatter],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
