import React from 'react';
import { Info } from 'lucide-react';
import { useT } from '../i18n/useT.js';
// Shown for every language whose catalog has not been reviewed by a native speaker. English shows nothing.
export default function TranslationNotice() {
    const { lang, status, ready, t } = useT();
    if (lang === 'en' || !ready || status === 'reviewed') return null;
    return (
        <div
            role="note"
            data-testid="translation-notice"
            className="flex-shrink-0 flex items-start gap-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2"
        >
            <Info size={14} className="flex-shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
            <p>{t('notice.underReview')}</p>
        </div>
    );
}
