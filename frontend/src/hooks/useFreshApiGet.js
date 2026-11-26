import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, ApiError } from '../utils/api';
import { createFreshController } from '../utils/freshData.js';
import { isOnline, subscribeOnlineStatus } from '../utils/onlineStatus.js';
import { useOnlineStatus } from './useOnlineStatus.js';
// GET for data that must never be shown stale (Emergency tab). Going offline clears the data and aborts
// the request; reconnecting, retrying and remounting always fetch fresh. Nothing is kept in a ref, cache or storage.
const errors = { offline: () => new ApiError('network'), parse: () => new ApiError('parse') };
const OFFLINE_STATE = { data: null, error: errors.offline(), loading: false };
export function useFreshApiGet(path, { params, validate } = {}) {
    const paramsKey = JSON.stringify(params || {});
    const online = useOnlineStatus();
    const [state, setState] = useState({ data: null, error: null, loading: true });
    const validateRef = useRef(validate);
    validateRef.current = validate;
    const controllerRef = useRef(null);
    useEffect(() => {
        const controller = createFreshController({
            load: (signal) => apiGet(path, { params: JSON.parse(paramsKey), signal }),
            validate: (d) => (validateRef.current ? validateRef.current(d) : true),
            isOnline,
            onChange: setState,
            errors,
        });
        controllerRef.current = controller;
        controller.refresh();
        const unsubscribe = subscribeOnlineStatus(() => (isOnline() ? controller.refresh() : controller.goOffline()));
        return () => {
            unsubscribe();
            controller.dispose();
            controllerRef.current = null;
        };
    }, [path, paramsKey]);
    const retry = useCallback(() => controllerRef.current?.refresh(), []);
    // Render-level guard: the render that sees "offline" never exposes data, whatever the state holds.
    return { ...(online ? state : OFFLINE_STATE), retry };
}
