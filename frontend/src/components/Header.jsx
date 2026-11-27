import React from 'react';
import LanguageSelector from './LanguageSelector';
import { useT } from '../i18n/useT.js';
import { SIMHASTHA_START_ISO, SIMHASTHA_END_ISO } from '../constants/event.js';
import ProposedLabel from './ProposedLabel.jsx';
export default function Header({ selectedLanguage, onLanguageChange }) {
    const { t, formatDate } = useT();
    return (
        <header className="bg-gradient-to-r from-orange-800 via-orange-700 to-amber-700 shadow-lg sm:sticky sm:top-0 z-50">
            {/* Om pattern strip: fixed Devanagari mantra in every UI language. Not translated. */}
            <div className="bg-orange-700/30 text-center px-3 py-1 text-xs text-orange-50 tracking-wide font-medium leading-relaxed">
                <span lang="hi" className="font-mantra">🔱 &nbsp; ॐ नमः शिवाय &nbsp; 🙏 &nbsp; जय महाकाल &nbsp; 🕉️ &nbsp; हर हर महादेव &nbsp; 🔱 &nbsp; ॐ नमः शिवाय &nbsp; 🙏 &nbsp; जय महाकाल &nbsp; 🕉️ &nbsp; हर हर महादेव</span>
            </div>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                {/* Logo and Title */}
                <div className="flex min-w-[14rem] flex-1 items-center gap-3">
                    <div className="text-3xl flex-shrink-0 drop-shadow-sm" aria-hidden="true">🕉️</div>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-xl font-bold text-white leading-tight drop-shadow-sm break-words">
                            {t('header.title')}
                        </h1>
                        <p className="text-orange-50 text-xs sm:text-sm font-medium">
                            {t('header.subtitle', { start: formatDate(SIMHASTHA_START_ISO), end: formatDate(SIMHASTHA_END_ISO) })}
                        </p>
                        <ProposedLabel className="text-orange-50" />
                    </div>
                </div>
                {/* Right side */}
                <div className="ml-auto flex flex-shrink-0 items-center gap-2">
                    {/* Live badge */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-green-500/20 border border-green-300/30 rounded-full px-2.5 py-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                        <span className="text-white text-xs font-medium">{t('header.live')}</span>
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
