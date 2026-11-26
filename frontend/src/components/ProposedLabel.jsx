import React from 'react';
import { useT } from '../i18n/useT.js';

// Small visible label for planned dates that are not yet officially confirmed.
export default function ProposedLabel({ className = '' }) {
    const { t } = useT();
    return (
        <p data-testid="proposed-label" className={`text-xs italic ${className}`}>
            {t('status.proposed')}
        </p>
    );
}