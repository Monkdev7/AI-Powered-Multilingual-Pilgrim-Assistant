import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { useT } from '../i18n/useT.js';
import { getLanguageOptions, indexOfLanguage, nextMenuIndex } from '../utils/languageMenu.js';
/*
 * Custom listbox instead of a native <select>: the native-name options only exist in the DOM while the
 * menu is open, so a page does not fetch every Indic font at load just to measure hidden option text.
 * Each option carries lang=<code> so the matching Noto face applies. Opening the menu shows all eight
 * scripts, so it may fetch the other fonts then (one-off, on demand).
 */
export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
    const { t } = useT();
    const options = useMemo(() => getLanguageOptions(), []);
    const current = options[indexOfLanguage(options, selectedLanguage)];
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const rootRef = useRef(null);
    const buttonRef = useRef(null);
    const listRef = useRef(null);
    const openMenu = () => {
        setActive(indexOfLanguage(options, selectedLanguage));
        setOpen(true);
    };
    const closeMenu = (returnFocus = true) => {
        setOpen(false);
        if (returnFocus) buttonRef.current?.focus();
    };
    const choose = (index) => {
        const option = options[index];
        if (option) onLanguageChange(option.code);
        closeMenu();
    };
    useEffect(() => {
        if (open) listRef.current?.focus();
    }, [open]);
    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [open]);
    const onButtonKeyDown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openMenu();
        }
    };
    const onListKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Home':
            case 'End':
                e.preventDefault();
                setActive((i) => nextMenuIndex(i, e.key, options.length));
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                choose(active);
                break;
            case 'Escape':
                e.preventDefault();
                closeMenu();
                break;
            case 'Tab':
                // Let focus move on naturally; just close the menu.
                setOpen(false);
                break;
            default:
        }
    };
    return (
        <div className="relative" ref={rootRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => (open ? closeMenu(false) : openMenu())}
                onKeyDown={onButtonKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? 'language-menu' : undefined}
                aria-label={`${t('language.select')}: ${current.nativeName}`}
                className="flex min-h-[44px] items-center gap-1.5 bg-black/20 hover:bg-black/30 rounded-lg px-3 py-2 border border-white/40 text-white text-sm font-semibold cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-600"
            >
                <Globe size={15} className="text-white flex-shrink-0" aria-hidden="true" />
                <span lang={current.code}>
                    {current.nativeName}
                </span>
                <svg
                    className="w-3 h-3 text-white flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <ul
                    id="language-menu"
                    ref={listRef}
                    role="listbox"
                    tabIndex={-1}
                    aria-label={t('language.select')}
                    aria-activedescendant={`language-option-${options[active].code}`}
                    onKeyDown={onListKeyDown}
                    className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white text-gray-900 rounded-xl shadow-raised border border-orange-200 py-1 z-50 focus:outline-none"
                >
                    {options.map((o, i) => {
                        const selected = o.code === selectedLanguage;
                        return (
                            <li
                                key={o.code}
                                id={`language-option-${o.code}`}
                                role="option"
                                lang={o.code}
                                aria-selected={selected}
                                onClick={() => choose(i)}
                                onMouseEnter={() => setActive(i)}
                                className={`flex min-h-[44px] items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${i === active ? 'bg-orange-100' : ''} ${selected ? 'font-semibold text-orange-800' : ''}`}
                            >
                                <span>{o.nativeName}</span>
                                <span lang="en" className="text-xs text-gray-600">{o.englishName}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}