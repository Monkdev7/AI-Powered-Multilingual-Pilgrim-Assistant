// Pure helpers for the Emergency tab. Node-safe (no React).
// API contact shape: { id, name, number, primary, group, clickable, source: { url, ... } }.
export function groupContacts(contacts) {
    const list = Array.isArray(contacts) ? contacts : [];
    const primary = list.find((c) => c.primary === true) || null;
    const rest = list.filter((c) => c !== primary);
    return {
        primary,
        secondary: rest.filter((c) => c.group !== 'local_directory'),
        local: rest.filter((c) => c.group === 'local_directory'),
    };
}
// tel: link only for contacts the API marks clickable.
export function telHref(contact) {
    if (!contact || contact.clickable !== true || typeof contact.number !== 'string') return null;
    return `tel:${contact.number.replace(/[-\s]/g, '')}`;
}
// Short source label (the host name) for attribution; null when the URL is missing or invalid.
export function sourceHost(contact) {
    try {
        return new URL(contact.source.url).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}