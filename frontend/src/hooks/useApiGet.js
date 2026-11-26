import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, ApiError, isAbortedError } from '../utils/api';
import { useOnlineStatus } from './useOnlineStatus.js';

// GET a backend resource with loading/error state, abort of stale requests and retry.
// The request starts in a timer (default 0 ms) so React StrictMode's immediate
// mount/cleanup/mount in development does not send a duplicate request.
// On failure `data` is null: stale data is never shown as if it were current.
export function useApiGet(path, { params, validate, delay = 0 } = {}) {
    const paramsKey = JSON.stringify(params || {});
    const [state, setState] = useState({ data: null, error: null, loading: true });
    const [attempt, setAttempt] = useState(0);
    const validateRef = useRef(validate);
    validateRef.current = validate;
    // Reload once when the connection returns (offline -> online). Going offline does not clear data already loaded.
    const online = useOnlineStatus();
    const wasOnline = useRef(online);
    useEffect(() => {
        if (online && !wasOnline.current) setAttempt((a) => a + 1);
        wasOnline.current = online;
    }, [online]);

    useEffect(() => {
        const controller = new AbortController();
        setState((s) => (s.loading && !s.error ? s : { data: s.data, error: null, loading: true }));

        const timer = setTimeout(async () => {
            try {
                const data = await apiGet(path, { params: JSON.parse(paramsKey), signal: controller.signal });
                if (validateRef.current && !validateRef.current(data)) throw new ApiError('parse');
                setState({ data, error: null, loading: false });
            } catch (err) {
                if (controller.signal.aborted || isAbortedError(err)) return;
                setState({ data: null, error: err, loading: false });
            }
        }, delay);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [path, paramsKey, attempt, delay]);

    const retry = useCallback(() => setAttempt((a) => a + 1), []);

    return { ...state, retry };
}
