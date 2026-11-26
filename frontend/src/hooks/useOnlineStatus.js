import { useSyncExternalStore } from 'react';
import { isOnline, subscribeOnlineStatus } from '../utils/onlineStatus.js';

// true while the browser reports a connection. Works without a service worker (dev too).
export function useOnlineStatus() {
    return useSyncExternalStore(subscribeOnlineStatus, () => isOnline(), () => true);
}
