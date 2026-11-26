import React from 'react';
import LanguageSelector from './LanguageSelector';
import { useT } from '../i18n/useT.js';
import { SIMHASTHA_START_ISO, SIMHASTHA_END_ISO } from '../constants/event.js';
export default function Header({ selectedLanguage, onLanguageChange }) {
    const { t, formatDate } = useT();
    return (
        <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 shadow-lg sticky top-0 z-50">
            {/* Om pattern strip: fixed Devanagari mantra in every UI language. Not translated. */}
            <div className="bg-orange-700/30 text-center py-0.5 text-xs text-orange-100 tracking-widest font-medium leading-relaxed overflow-hidden">
                <span lang="hi" className="font-mantra">🔱 &nbsp; ॐ नमः शिवाय &nbsp; 🙏 &nbsp; जय महाकाल &nbsp; 🕉️ &nbsp; हर हर महादेव &nbsp; 🔱 &nbsp; ॐ नमः शिवाय &nbsp; 🙏 &nbsp; जय महाकाल &nbsp; 🕉️ &nbsp; हर हर महादेव</span>
            </div>
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                {/* Logo and Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="text-3xl flex-shrink-0 drop-shadow-sm">🕉️</div>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-xl font-bold text-white leading-tight drop-shadow-sm break-words sm:truncate">
                            {t('header.title')}
                        </h1>
                        <p className="text-orange-100 text-xs sm:text-sm font-medium">
                            {t('header.subtitle', { start: formatDate(SIMHASTHA_START_ISO), end: formatDate(SIMHASTHA_END_ISO) })}
                        </p>
                    </div>
                </div>
                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Live badge */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-green-500/20 border border-green-300/30 rounded-full px-2.5 py-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                        <span className="text-green-100 text-xs font-medium">{t('header.live')}</span>
                    </div>
                    <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={onLanguageChange}
                    />
                </div>
            </div>
        </header>
    );
}
