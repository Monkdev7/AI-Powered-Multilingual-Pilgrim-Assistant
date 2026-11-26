const express = require('express');
const { getDefaultI18n } = require('../i18n');
const VERIFICATION = {
    status: 'unverified_inherited',
    note: 'Prices, timings, distances, facilities and other details are inherited and not officially confirmed. Check official sources before relying on them.',
};

// Neutral structure only: stable ids, icons and which categories carry a warning or tip. Every visible string
// (category name, warning, tip, item name/detail/location/timing/cost) lives in backend/i18n/<lang>/services.json
// under "category.<id>.<field>" and "item.<categoryId>.<slug>.<field>"; English is canonical in i18n/en.
// The item id is "<categoryId>.<slug>" (lowercase slug of the English item name) and never changes across languages.
// INHERITED, NOT independently verified: prices, timings, distances and facilities. Mobile Canteens, Mobile Toilet
// Vans, Currency Exchange, Phone Charging and Local Accommodation were restored verbatim from the pre-Phase-2
// frontend (LocalServices.jsx), including the warning/tip text with its original leading symbols.
const services = [
    { id: 'food', icon: '🍚', items: ['government-food-camps', 'akhara-langars', 'mela-food-courts', 'mobile-canteens'] },
    { id: 'water', icon: '💧', warning: true, items: ['drinking-water-kiosks', 'packaged-water'] },
    { id: 'sanitation', icon: '🚻', tip: true, items: ['community-toilet-blocks', 'mobile-toilet-vans', 'pink-toilets-women'] },
    { id: 'banking', icon: '🏧', tip: true, items: ['atms', 'upi-digital-payments', 'currency-exchange'] },
    { id: 'charging', icon: '🔋', warning: true, items: ['phone-charging-stations', 'power-banks'] },
    { id: 'accommodation-nearby', icon: '🏕', tip: true, items: ['kumbh-tent-cities', 'dharamshalas', 'indore-hotels-overflow'] },
];
const ITEM_FIELDS = ['name', 'detail', 'location', 'timing', 'cost'];

function buildService(def, scope) {
    const { t } = scope;
    return {
        id: def.id,
        category: t(`category.${def.id}.name`),
        icon: def.icon,
        ...(def.warning ? { warning: t(`category.${def.id}.warning`) } : {}),
        ...(def.tip ? { tip: t(`category.${def.id}.tip`) } : {}),
        items: def.items.map((slug) => {
            const item = {};
            for (const f of ITEM_FIELDS) item[f] = t(`item.${def.id}.${slug}.${f}`);
            item.id = `${def.id}.${slug}`;
            return item;
        }),
    };
}

function translationFor(i18n, lang, scopes) {
    const fallbacks = new Set();
    scopes.forEach((s) => s.addFallbackTo(fallbacks));
    return i18n.translationMeta(lang, scopes, fallbacks);
}

function createRouter(i18n = getDefaultI18n()) {
    const router = express.Router();
    const verificationFor = (lang, scope) => (lang ? { ...VERIFICATION, note: scope.t('verification.note') } : VERIFICATION);

    // GET /api/services[?lang=xx]
    router.get('/', i18n.langMiddleware, (req, res) => {
        const lang = req.lang;
        const scope = i18n.scope(lang || 'en', 'services');
        const list = services.map((def) => buildService(def, scope));
        const body = { services: list, total: list.length, verification: verificationFor(lang, scope) };
        if (lang) {
            body.lang = lang;
            body.translation = translationFor(i18n, lang, [scope]);
        }
        res.json(body);
    });

    // GET /api/services/:id[?lang=xx]
    router.get('/:id', i18n.langMiddleware, (req, res) => {
        const def = services.find((s) => s.id === req.params.id);
        if (!def) {
            return res.status(404).json({ error: 'Service category not found' });
        }
        const lang = req.lang;
        const scope = i18n.scope(lang || 'en', 'services');
        const body = { ...buildService(def, scope), verification: verificationFor(lang, scope) };
        if (lang) {
            body.lang = lang;
            body.translation = translationFor(i18n, lang, [scope]);
        }
        res.json(body);
    });
    return router;
}

module.exports = createRouter();
module.exports.createRouter = createRouter;
module.exports.SERVICE_DEFS = services;