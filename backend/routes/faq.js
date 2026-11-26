const express = require('express');
const defaultRegistry = require('../data/facts').defaultRegistry;
const { getDefaultI18n } = require('../i18n');
const VERIFICATION = {
    status: 'unverified_inherited',
    note: 'Prices, timings, distances, facilities and other details are inherited and not officially confirmed. Check official sources before relying on them.',
};

// Neutral structure only. All text (questions, answers, category labels) lives in backend/i18n/<lang>/faq.json,
// keyed by "faq.<id>.question" / "faq.<id>.answer" / "category.<categoryId>". English is canonical in i18n/en.
const CATEGORY_IDS = ['getting-there', 'accommodation', 'religious-events', 'health-safety', 'general'];
const FAQ_CATEGORY = {
    1: 'getting-there', 2: 'getting-there', 3: 'getting-there', 4: 'getting-there', 5: 'getting-there', 6: 'getting-there',
    7: 'accommodation', 8: 'accommodation', 9: 'accommodation', 10: 'accommodation', 11: 'accommodation',
    12: 'religious-events', 13: 'religious-events', 14: 'religious-events', 15: 'religious-events', 16: 'religious-events', 17: 'religious-events',
    18: 'health-safety', 19: 'health-safety', 20: 'health-safety', 21: 'health-safety', 22: 'health-safety',
    23: 'general', 24: 'general', 25: 'general', 26: 'general', 27: 'general', 28: 'general',
};
const FAQ_IDS = Object.keys(FAQ_CATEGORY).map(Number);

const PERIOD_ID = 'calendar.simhastha2028.period';
const PLAN_ID = 'calendar.simhastha2028.snan_plan';
const isIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

// "9 April" / "8 May 2028": day number, localized month name (overlay keys month.1-12), Latin-digit year.
function dayMonth(iso, t, withYear) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${t(`month.${m}`)}${withYear ? ` ${y}` : ''}`;
}

// Calendar facts in answers 12 and 23 come from the registry; they are shown only while the calendar records are
// public (not stale), otherwise the answer says the information is not currently verified.
function calendarParams(facts) {
    const ids = new Set(facts.getPublicFacts().map((r) => r.id));
    const period = ids.has(PERIOD_ID) ? facts.getFact(PERIOD_ID) : null;
    const plan = ids.has(PLAN_ID) ? facts.getFact(PLAN_ID) : null;
    const periodOk = !!period && period.value && isIso(period.value.start) && isIso(period.value.end);
    const planOk = !!plan && plan.valueParts && isIso(plan.valueParts.from) && isIso(plan.valueParts.to)
        && Number.isInteger(plan.valueParts.shahi) && Number.isInteger(plan.valueParts.parv);
    return { period: periodOk ? period.value : null, plan: planOk ? plan.valueParts : null };
}

function buildFaq(id, scope, cal) {
    const { t } = scope;
    const categoryId = FAQ_CATEGORY[id];
    let answer;
    if (id === 12 && !(cal.period && cal.plan)) {
        answer = t('faq.12.answer.noDates');
    } else if (id === 12) {
        answer = t('faq.12.answer', {
            shahi: cal.plan.shahi,
            parv: cal.plan.parv,
            planFrom: dayMonth(cal.plan.from, t, false),
            planTo: dayMonth(cal.plan.to, t, true),
        });
    } else if (id === 23 && !cal.period) {
        answer = t('faq.23.answer.noPeriod');
    } else if (id === 23) {
        answer = t('faq.23.answer', {
            periodFrom: dayMonth(cal.period.start, t, false),
            periodTo: dayMonth(cal.period.end, t, true),
        });
    } else {
        answer = t(`faq.${id}.answer`);
    }
    return {
        id,
        category: t(`category.${categoryId}`),
        question: t(`faq.${id}.question`),
        answer,
        categoryId,
    };
}

// GET /api/faq[?lang=xx&category=<id|English name|localized label|All>&search=<text>]
// Without ?lang the English response keeps its original shape (plus the additive categoryId / categoryOptions).
function createRouter(facts = defaultRegistry, i18n = getDefaultI18n()) {
    const router = express.Router();
    router.get('/', i18n.langMiddleware, (req, res) => {
        const { category, search } = req.query;
        const lang = req.lang;
        const code = lang || 'en';
        const cal = calendarParams(facts);
        const englishFaqs = FAQ_IDS.map((id) => buildFaq(id, i18n.scope('en', 'faq'), cal));
        const localized = FAQ_IDS.map((id) => {
            const scope = i18n.scope(code, 'faq');
            return { item: buildFaq(id, scope, cal), scope };
        });
        const categoryScope = i18n.scope(code, 'faq');
        const categoryOptions = CATEGORY_IDS.map((id) => ({ id, label: categoryScope.t(`category.${id}`) }));
        const englishLabel = (id) => i18n.scope('en', 'faq').t(`category.${id}`);

        let rows = localized.map((l, i) => ({ ...l, english: englishFaqs[i] }));
        if (category && category !== 'All') {
            rows = rows.filter(({ item }) => typeof category === 'string' && (
                item.categoryId === category
                || englishLabel(item.categoryId) === category
                || item.category === category
            ));
        }
        if (typeof search === 'string' && search.trim() !== '') {
            const q = search.toLowerCase();
            const hit = (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
            rows = rows.filter(({ item, english }) => hit(item) || hit(english));
        }

        const body = {
            faqs: rows.map((r) => r.item),
            categories: categoryOptions.map((c) => c.label),
            total: rows.length,
            verification: VERIFICATION,
            categoryOptions,
        };
        if (lang) {
            const verificationScope = i18n.scope(code, 'faq');
            body.verification = { ...VERIFICATION, note: verificationScope.t('verification.note') };
            const fallbacks = new Set();
            const scopes = [categoryScope, verificationScope];
            rows.forEach((r) => { scopes.push(r.scope); });
            scopes.forEach((s) => s.addFallbackTo(fallbacks));
            body.lang = lang;
            body.translation = i18n.translationMeta(lang, scopes, fallbacks);
        }
        res.json(body);
    });
    return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
module.exports.CATEGORY_IDS = CATEGORY_IDS;
module.exports.FAQ_IDS = FAQ_IDS;
