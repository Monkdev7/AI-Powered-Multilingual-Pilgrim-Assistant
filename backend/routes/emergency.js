const express = require('express');
const defaultRegistry = require('../data/facts').defaultRegistry;

// Presentation only (icon/colour/description). Numbers, labels and sources come from facts.json.
const PRESENTATION = {
    'emergency.national.112': { icon: 'alert', color: 'red', description: 'National unified emergency number' },
    'emergency.police.100': { icon: 'shield', color: 'blue', description: 'Police' },
    'emergency.fire.101': { icon: 'flame', color: 'orange', description: 'Fire and rescue' },
    'emergency.ambulance.102': { icon: 'ambulance', color: 'red', description: 'Ambulance' },
    'emergency.women.1091': { icon: 'user', color: 'pink', description: 'Women in distress' },
    'emergency.child.1098': { icon: 'heart', color: 'yellow', description: 'Child helpline' },
    'emergency.tourist.1363': { icon: 'info', color: 'green', description: 'National tourist helpline' },
    'local.sp_office.0734_2527130': { icon: 'shield', color: 'blue', description: 'Office directory number (not a confirmed 24-hour line)' },
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
function buildContacts(facts = defaultRegistry) {
    const list = facts.getPublicFacts()
        .filter((r) => (r.category === 'emergency' || r.category === 'local_contact') && PRESENTATION[r.id])
        .map((r) => ({
            id: r.id,
            name: r.label,
            number: r.value,
            ...PRESENTATION[r.id],
            primary: r.primary === true,
            group: r.group || 'emergency',
            clickable: facts.isClickable(r),
            source: sourceOf(r),
        }));
    return list.sort((a, b) => Number(b.primary) - Number(a.primary));
}
const infoCards = [
    {
        id: 'lost-found',
        title: 'Lost & Found Center',
        icon: 'search',
        color: 'amber',
        details: [
            'Main Lost & Found: Sector 1, near Ram Ghat main entrance, Ujjain',
            'Report lost persons at nearest Police Post immediately',
            'Lost children: Announced on loudspeaker at all entry gates',
            'Keep a recent photo of companions on your phone',
            'Tie a distinct band on children\'s wrists with your phone number',
        ],
    },
    {
        id: 'medical',
        title: 'Medical & Heatstroke Centres',
        icon: 'cross',
        color: 'red',
        details: [
            'Medical camps across all sectors of Simhastha grounds',
            'Special heatstroke treatment centres (April-May is 40°C+)',
            'Free treatment at all government medical camps',
            'Ambulances stationed near all major ghats including Ram Ghat',
            'ORS distribution points at all sector entry gates',
        ],
    },
];

// GET /api/emergency
function createRouter(facts = defaultRegistry) {
    const router = express.Router();
    router.get('/', (req, res) => {
        const contacts = buildContacts(facts);
        // Latest source-check date over the served records. Never a future date (registry validation).
        const lastVerified = contacts.map((c) => c.source.lastVerified).sort().pop() || null;
        res.json({
            contacts,
            infoCards,
            lastVerified,
            note: contacts.length
                ? 'Numbers are as listed by the cited official sources. They have not been independently call-tested and are not event-specific Simhastha helplines.'
                : 'No emergency numbers are currently available here. Please contact the official local authorities.',
            event: 'Simhastha Kumbh 2028, Ujjain, MP',
        });
    });
    return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
module.exports.buildContacts = buildContacts;