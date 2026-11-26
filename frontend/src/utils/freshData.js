// Framework-free controller for data that must never be shown stale (the Emergency payload).
// Nothing is kept across offline/refresh: every transition replaces the whole state, and a generation
// token plus AbortController make late responses from earlier requests harmless.
// States: { data, error, loading }. `data` is non-null only after a fresh, validated response.
export function createFreshController({ load, validate, isOnline, onChange, errors, delay = 0, seed }) {
    let gen = 0;
    let timer = null;
    let abort = null;
    let disposed = false;
    let state = { data: null, error: null, loading: true };
    const set = (next) => {
        if (disposed) return;
        state = next;
        onChange(next);
    };
    const cancel = () => {
        gen++;
        clearTimeout(timer);
        timer = null;
        abort?.abort();
        abort = null;
    };
    const offlineState = () => ({ data: null, error: errors.offline(), loading: false });
    // keepData (optional, used only by the first fetch for new params while online): show `seed()` as the loading-state data.
    function refresh({ keepData = false } = {}) {
        cancel();
        if (disposed) return;
        if (!isOnline()) return set(offlineState());
        set({ data: keepData && seed ? seed() ?? null : null, error: null, loading: true });
        const mine = gen;
        const ac = new AbortController();
        abort = ac;
        timer = setTimeout(async () => {
            const stale = () => disposed || mine !== gen || ac.signal.aborted || !isOnline();
            try {
                const data = await load(ac.signal);
                if (stale()) return;
                if (validate && !validate(data)) throw errors.parse();
                set({ data, error: null, loading: false });
            } catch (err) {
                if (stale()) return;
                set({ data: null, error: err, loading: false });
            }
        }, delay);
    }
    function goOffline() {
        cancel();
        set(offlineState());
    }
    function dispose() {
        cancel();
        disposed = true;
    }
    return { refresh, goOffline, dispose, getState: () => state };
}
