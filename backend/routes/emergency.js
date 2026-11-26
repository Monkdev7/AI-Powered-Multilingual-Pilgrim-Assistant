const express = require('express');
const defaultRegistry = require('../data/facts').defaultRegistry;
const { getDefaultI18n } = require('../i18n');

// Presentation only (icon/colour). Numbers, labels and sources come from facts.json; the visible text
// (designation labels, descriptions, info-card text, notes) comes from backend/i18n/<lang>/emergency.json.
const PRESENTATION = {
    'emergency.national.112': { icon: 'alert', color: 'red' },
    'emergency.police.100': { icon: 'shield', color: 'blue' },
    'emergency.fire.101': { icon: 'flame', color: 'orange' },
    'emergency.ambulance.102': { icon: 'ambulance', color: 'red' },
    'emergency.women.1091': { icon: 'user', color: 'pink' },
    'emergency.child.1098': { icon: 'heart', color: 'yellow' },
    'emergency.tourist.1363': { icon: 'info', color: 'green' },
    'local.sp_office.0734_2527130': { icon: 'shield', color: 'blue' },
};

function sourceOf(r) {
    const extra = (r.additionalSources || []).find((s) => s.sourceLastUpdatedOnPage);
    return {
        url: r.sourceUrl,
        issuingBody: r.issuingBody,
        lastVerified: r.lastVerified,
        status: r.verificationStatus,
        ...(r.sourcePublishedAt ? { sourcePublishedAt: r.sourcePublishedAt } : {}),
        ...(extra ? { pageLastUpdated: extra.sourceLastUpdatedOnPage, pageUrl: extra.url } : {}),
    };
}

// Public emergency contacts: only records the registry allows to be shown. Retired, hidden,
// awaiting_confirmation (NDRF, 108) and stale (review overdue) records never reach this list.
// `scope` (optional) localizes the label and description; numbers, ids, flags and sources never change.
function buildContacts(facts = defaultRegistry, scope = getDefaultI18n().scope('en', 'emergency')) {
    const list = facts.getPublicFacts()
        .filter((r) => (r.category === 'emergency' || r.category === 'local_contact') && PRESENTATION[r.id])
        .map((r) => ({
            id: r.id,
            name: scope.t(`contact.${r.id}.name`),
            number: r.value,
            icon: PRESENTATION[r.id].icon,
            color: PRESENTATION[r.id].color,
            description: scope.t(`contact.${r.id}.description`),
            primary: r.primary === true,
            group: r.group || 'emergency',
            clickable: facts.isClickable(r),
            source: sourceOf(r),
        }));
    return list.sort((a, b) => Number(b.primary) - Number(a.primary));
}
const INFO_CARDS = [
    { id: 'lost-found', icon: 'search', color: 'amber', detailCount: 5 },
    { id: 'medical', icon: 'cross', color: 'red', detailCount: 5 },
];
// Detail lines (lost-and-found and medical/heatstroke instructions) stay English in every language until a human
// reviewer approves a translation: the non-English overlays list them in _meta.keptEnglish.
function buildInfoCards(scope) {
    return INFO_CARDS.map((c) => ({
        id: c.id,
        title: scope.t(`infoCard.${c.id}.title`),
        icon: c.icon,
        color: c.color,
        details: Array.from({ length: c.detailCount }, (_, i) => scope.t(`infoCard.${c.id}.details.${i}`)),
    }));
}

// GET /api/emergency[?lang=xx]
function createRouter(facts = defaultRegistry, i18n = getDefaultI18n()) {
    const router = express.Router();
    router.get('/', i18n.langMiddleware, (req, res) => {
        const lang = req.lang;
        const scope = i18n.scope(lang || 'en', 'emergency');
        const contacts = buildContacts(facts, scope);
        // Latest source-check date over the served records. Never a future date (registry validation).
        const lastVerified = contacts.map((c) => c.source.lastVerified).sort().pop() || null;
        const body = {
            contacts,
            infoCards: buildInfoCards(scope),
            lastVerified,
            note: scope.t(contacts.length ? 'note.available' : 'note.none'),
            event: scope.t('event'),
        };
        if (lang) {
            body.lang = lang;
            body.translation = i18n.translationMeta(lang, [scope], new Set(scope.fallbackIds()));
        }
        res.json(body);
    });
    return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
module.exports.buildContacts = buildContacts;