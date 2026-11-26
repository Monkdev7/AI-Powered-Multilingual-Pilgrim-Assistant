import React from 'react';
import { Phone } from 'lucide-react';
import { NATIONAL_EMERGENCY_NUMBER } from '../constants/facts.js';
import { useT } from '../i18n/useT.js';

// The only emergency action available offline: a tel: link to the national number (112, from constants/facts.js).
export default function OfflineEmergencyLink({ className = '' }) {
    const { t } = useT();
    return (
        <a
            href={`tel:${NATIONAL_EMERGENCY_NUMBER}`}
            className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm active:scale-95 transition-all ${className}`}
        >
            <Phone size={16} aria-hidden="true" />
            {t('offline.callEmergency', { number: NATIONAL_EMERGENCY_NUMBER })}
        </a>
    );
}