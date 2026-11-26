// Pure request-parameter helpers for the localized content APIs (Node-safe, no React).
// The selected UI language is always sent as ?lang=<code>. useApiGet re-requests when the params object changes
// (it keys on JSON.stringify(params)), so a language switch refetches and aborts the stale request.

// Value of the FAQ "all categories" filter. Never sent to the API.
export const ALL_CATEGORIES = 'All';

// category is a stable category id (for example "health-safety"), never a translated label.
export function faqParams({ lang, category, search } = {}) {
    return {
        lang,
        category: category && category !== ALL_CATEGORIES ? category : undefined,
        search: search || undefined,
    };
}

export const emergencyParams = (lang) => ({ lang });
export const servicesParams = (lang) => ({ lang });

// [{ id, label }] from an FAQ response. Uses categoryOptions (ids + localized labels); an older backend that only
// sends category names yields id === label so filtering still works with the English category names.
export function categoryOptionsFrom(data) {
    if (Array.isArray(data?.categoryOptions) && data.categoryOptions.every((c) => c && typeof c.id === 'string' && typeof c.label === 'string')) {
        return data.categoryOptions.map((c) => ({ id: c.id, label: c.label }));
    }
    if (Array.isArray(data?.categories)) return data.categories.filter((c) => typeof c === 'string').map((c) => ({ id: c, label: c }));
    return [];
}

// The key useApiGet derives from params; two params objects trigger the same request only if the keys are equal.
export const paramsKey = (params) => JSON.stringify(params || {});
