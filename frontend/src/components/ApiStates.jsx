import React from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../utils/api';
import { useT } from '../i18n/useT.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import OfflineEmergencyLink from './OfflineEmergencyLink.jsx';

export function LoadingState({ label }) {
    const { t } = useT();
    return (
        <div className="text-center py-12 text-gray-600" role="status" aria-live="polite">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin text-orange-500" aria-hidden="true" />
            <p className="text-sm font-medium">{label ?? t('common.loading')}</p>
        </div>
    );
}

export function ErrorState({ error, onRetry, showEmergency = false }) {
    const { t } = useT();
    const online = useOnlineStatus();
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center" role="alert">
            <AlertTriangle size={28} className="mx-auto mb-2 text-red-500" aria-hidden="true" />
            <p className="text-sm text-red-800 mb-3">{online ? getErrorMessage(error, t) : t('offline.unavailable')}</p>
            {showEmergency && <OfflineEmergencyLink className="mb-3 w-full sm:w-auto" />}
            <button
                type="button"
                onClick={onRetry}
                className="btn-primary"
            >
                <RefreshCw size={14} aria-hidden="true" />
                {t('common.tryAgain')}
            </button>
        </div>
    );
}
