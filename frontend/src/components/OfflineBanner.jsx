import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { useT } from '../i18n/useT.js';
import OfflineEmergencyLink from './OfflineEmergencyLink.jsx';

// The live region is always mounted so screen readers announce the banner when it appears.
// Nothing is rendered inside it while online, so it takes no space.
export default function OfflineBanner() {
    const { t } = useT();
    const online = useOnlineStatus();
    return (
        <div role="status" aria-live="polite">
            {!online && (
                <div className="mx-4 mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col gap-3" data-testid="offline-banner">
                    <p className="text-sm font-medium text-amber-900 flex items-start gap-2">
                        <WifiOff size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{t('offline.banner')}</span>
                    </p>
                    <OfflineEmergencyLink className="w-full sm:w-auto sm:self-start" />
                </div>
            )}
        </div>
    );
}