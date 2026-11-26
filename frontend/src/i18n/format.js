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

// Some Chrome builds lack month names for a locale (Punjabi) and return placeholders such as "M03"
// in a root-locale order ("2028 M03 27"). Detect that generically and substitute explicit
// Gregorian month names. Punjabi names are AI-checked against CLDR and need native review.
const EN_MONTHS = {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const PA_MONTHS = ['ਜਨਵਰੀ', 'ਫ਼ਰਵਰੀ', 'ਮਾਰਚ', 'ਅਪ੍ਰੈਲ', 'ਮਈ', 'ਜੂਨ', 'ਜੁਲਾਈ', 'ਅਗਸਤ', 'ਸਤੰਬਰ', 'ਅਕਤੂਬਰ', 'ਨਵੰਬਰ', 'ਦਸੰਬਰ'];
// Per-language Gregorian month names used only when Intl returns a placeholder. Languages without an
// entry fall back to English month names.
export const FALLBACK_MONTH_NAMES = Object.freeze({
    pa: Object.freeze({ short: PA_MONTHS, long: PA_MONTHS }),
});
const SCRIPT_RE = {};
function scriptRegex(code) {
    const { script } = getLanguage(code);
    return (SCRIPT_RE[script] ||= new RegExp(`\\p{Script=${script}}`, 'u'));
}
// A month part is a placeholder when it looks like "M03" or has no letters of the language's script.
// Purely numeric months ("03") are valid output for numeric month styles.
export function isPlaceholderMonth(value, code) {
    if (/^\d+$/.test(value)) return false;
    return /^M\d+$/.test(value) || !scriptRegex(code).test(value);
}
export function fallbackMonthName(code, monthIndex, style = 'short') {
    const names = FALLBACK_MONTH_NAMES[getLanguage(code).code] || EN_MONTHS;
    return names[style === 'long' ? 'long' : 'short'][monthIndex];
}
function monthStyle(opts) {
    if (opts.month) return opts.month === 'long' ? 'long' : 'short';
    return opts.dateStyle === 'long' || opts.dateStyle === 'full' ? 'long' : 'short';
}
const DATE_FIELDS = ['weekday', 'day', 'month', 'year'];
// Formats with `DateTimeFormat`; if the month part is a placeholder, rebuilds the string as
// "[weekday] day month [year][, time]" with an explicit month name. The month is read from the
// same instant in Asia/Kolkata so the date cannot shift.
export function formatDateWithFallback(DateTimeFormat, locale, code, opts, date) {
    const options = { timeZone: TIME_ZONE, ...opts };
    const dtf = new DateTimeFormat(locale, options);
    const parts = typeof dtf.formatToParts === 'function' ? dtf.formatToParts(date) : null;
    const month = parts && parts.find((p) => p.type === 'month');
    if (!month || !isPlaceholderMonth(month.value, code)) return dtf.format(date);
    const monthIndex = Number(
        new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'numeric' }).format(date),
    ) - 1;
    const name = fallbackMonthName(code, monthIndex, monthStyle(options));
    const field = (type) => {
        const p = parts.find((x) => x.type === type);
        return p ? (type === 'month' ? name : p.value) : null;
    };
    const dateText = DATE_FIELDS.map(field).filter(Boolean).join(' ');
    const rest = parts.filter((p) => !DATE_FIELDS.includes(p.type)).map((p) => p.value).join('').replace(/^[\s,.\-/]+/, '').trim();
    return rest ? `${dateText}, ${rest}` : dateText;
}
export function createFormatter(code, DateTimeFormat = Intl.DateTimeFormat) {
    const numberLocale = numberTag(code);
    const dateLocale = dateTag(code);
    return {
        formatNumber(n, opts) {
            return new Intl.NumberFormat(numberLocale, opts).format(n);
        },
        formatDate(value, opts = { month: 'short', day: 'numeric' }) {
            return formatDateWithFallback(DateTimeFormat, dateLocale, code, opts, toDate(value));
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
            return formatDateWithFallback(DateTimeFormat, dateLocale, code, { hour12: true, ...opts }, toDate(value));
        },
    };
}
