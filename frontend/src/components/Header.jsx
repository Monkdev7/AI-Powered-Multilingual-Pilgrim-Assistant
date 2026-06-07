import React from 'react';
import LanguageSelector from './LanguageSelector';

export default function Header({ selectedLanguage, onLanguageChange }) {
    return (
        <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 shadow-lg sticky top-0 z-50">
            {/* Om pattern strip */}
            <div className="bg-orange-700/30 text-center py-0.5 text-xs text-orange-100 tracking-widest font-medium overflow-hidden">
                <span>🔱 &nbsp; ॐ नमः शिवाय &nbsp; 🙏 &nbsp; जय महाकाल &nbsp; 🕉️ &nbsp; हर हर महादेव &nbsp; 🔱 &nbsp; ॐ नमः शिवाय &nbsp; 🙏 &nbsp; जय महाकाल &nbsp; 🕉️ &nbsp; हर हर महादेव</span>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                {/* Logo and Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="text-3xl flex-shrink-0 drop-shadow-sm">🕉️</div>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold text-white leading-tight drop-shadow-sm truncate">
                            Simhastha Pilgrim Assistant
                        </h1>
                        <p className="text-orange-100 text-xs sm:text-sm font-medium">
                            Simhastha Kumbh 2028 · Ujjain, MP · Mar 27 – May 27
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Live badge */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-green-500/20 border border-green-300/30 rounded-full px-2.5 py-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                        <span className="text-green-100 text-xs font-medium">Live</span>
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
