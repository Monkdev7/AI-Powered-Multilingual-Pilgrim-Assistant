import { getLanguage } from './languages.js';

export const TIME_ZONE = 'Asia/Kolkata';

// Latin digits ("nu-latn") and Indian grouping (1,00,000) for every language.
function numberTag(code) {
    return `${getLanguage(code).code}-IN-u-nu-latn`;
}

// English dates keep the existing "Mar 27, 2028" order.
function dateTag(code) {
    return code === 'en' ? 'en-US-u-nu-latn' : numberTag(code);
}

// Date-only ISO strings are parsed as UTC noon so the Asia/Kolkata date cannot shift.
function toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T12:00:00Z`);
    }
    return new Date(value);
}

export function createFormatter(code) {
    const numberLocale = numberTag(code);
    const dateLocale = dateTag(code);
    return {
        formatNumber(n, opts) {
            return new Intl.NumberFormat(numberLocale, opts).format(n);
        },
        formatDate(value, opts = { month: 'short', day: 'numeric' }) {
            return new Intl.DateTimeFormat(dateLocale, { timeZone: TIME_ZONE, ...opts }).format(toDate(value));
        },
        formatTime(value) {
            return new Intl.DateTimeFormat(dateLocale, {
                timeZone: TIME_ZONE,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }).format(toDate(value));
        },
        formatDateTime(value, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
            return new Intl.DateTimeFormat(dateLocale, { timeZone: TIME_ZONE, hour12: true, ...opts }).format(toDate(value));
        },
    };
}
