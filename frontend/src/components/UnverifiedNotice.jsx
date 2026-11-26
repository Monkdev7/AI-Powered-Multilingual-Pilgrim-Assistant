import React from 'react';
import { Info } from 'lucide-react';
import { useT } from '../i18n/useT.js';

// Shared notice for sections whose details (prices, timings, distances, facilities) are inherited and not officially confirmed.
export default function UnverifiedNotice() {
    const { t } = useT();
    return (
        <div
            role="note"
            data-testid="unverified-notice"
            className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl px-3 py-2"
        >
            <Info size={14} className="flex-shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
            <p>{t('notice.unverifiedDetails')}</p>
        </div>
    );
}