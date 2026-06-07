import React from 'react';
import { Globe } from 'lucide-react';

const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
    const current = languages.find((l) => l.code === selectedLanguage) || languages[0];

    return (
        <div className="relative">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-2 border border-white/30">
                <Globe size={15} className="text-white flex-shrink-0" />
                <select
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium appearance-none cursor-pointer outline-none pr-4"
                    aria-label="Select language"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-orange-600 text-white">
                            {lang.native} ({lang.label})
                        </option>
                    ))}
                </select>
                <svg
                    className="w-3 h-3 text-white pointer-events-none -ml-3 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}

export { languages };
