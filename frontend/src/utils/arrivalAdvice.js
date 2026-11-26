// Arrival-time advice for bathing days ("Arrive by 4 AM on Amrit Snan days", "Arrive at Ram Ghat 2-3 hours
// before sunrise ...") has no official source, so it is not shown. src/data/navigationData.js is pinned by a
// hash test and cannot be edited; the components stop rendering these sentences instead. Pure and Node-safe.
const ADVICE_RE = /\barrive\b[^.]*\b(?:Amrit Snan|bathing) days\b/i;
export function isUnsourcedArrivalAdvice(text) {
    return typeof text === 'string' && ADVICE_RE.test(text);
}
// Drops the offending sentence(s) from a longer tip and keeps the rest.
export function withoutUnsourcedArrivalAdvice(text) {
    if (typeof text !== 'string') return text;
    return (text.match(/[^.]+\.?\s*/g) || [text])
        .filter((sentence) => !ADVICE_RE.test(sentence))
        .join('')
        .trim();
}
