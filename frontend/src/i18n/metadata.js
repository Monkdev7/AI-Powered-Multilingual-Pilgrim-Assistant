// Updates <html lang>, document title and meta description from the selected locale.
// Manifest and og tags stay static English. All supported languages are LTR.
export function applyDocumentMetadata(lang, t, doc = globalThis.document) {
    if (!doc) return;
    if (doc.documentElement) doc.documentElement.lang = lang;
    doc.title = t('meta.title');
    if (typeof doc.querySelector !== 'function') return;
    let meta = doc.querySelector('meta[name="description"]');
    if (!meta && typeof doc.createElement === 'function' && doc.head) {
        meta = doc.createElement('meta');
        meta.setAttribute('name', 'description');
        doc.head.appendChild(meta);
    }
    if (meta) meta.setAttribute('content', t('meta.description'));
}
