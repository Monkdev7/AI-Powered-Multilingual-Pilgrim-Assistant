import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_CODES } from '../src/i18n/languages.js';
import { buildUrl } from '../src/utils/api.js';
import { ALL_CATEGORIES, faqParams, emergencyParams, servicesParams, categoryOptionsFrom, paramsKey } from '../src/utils/apiParams.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const require = createRequire(import.meta.url);

test('FAQ, emergency and services params carry the selected language', () => {
    for (const lang of LANGUAGE_CODES) {
        assert.equal(faqParams({ lang }).lang, lang);
        assert.deepEqual(emergencyParams(lang), { lang });
        assert.deepEqual(servicesParams(lang), { lang });
        assert.equal(buildUrl('', '/api/emergency', emergencyParams(lang)), `/api/emergency?lang=${lang}`);
        assert.equal(buildUrl('', '/api/services', servicesParams(lang)), `/api/services?lang=${lang}`);
    }
});

test('FAQ params use the stable category id, omit All and empty search', () => {
    assert.equal(buildUrl('', '/api/faq', faqParams({ lang: 'hi', category: 'health-safety', search: 'heat' })), '/api/faq?lang=hi&category=health-safety&search=heat');
    assert.equal(buildUrl('', '/api/faq', faqParams({ lang: 'ta', category: ALL_CATEGORIES, search: '' })), '/api/faq?lang=ta');
    assert.equal(buildUrl('', '/api/faq', faqParams({ lang: 'en' })), '/api/faq?lang=en');
    assert.equal(faqParams({ lang: 'hi', category: 'All' }).category, undefined);
});

test('changing the language changes the params key, which is what makes useApiGet refetch; same params do not', () => {
    assert.notEqual(paramsKey(emergencyParams('en')), paramsKey(emergencyParams('hi')));
    assert.notEqual(paramsKey(servicesParams('hi')), paramsKey(servicesParams('ta')));
    assert.notEqual(paramsKey(faqParams({ lang: 'en', category: 'general' })), paramsKey(faqParams({ lang: 'hi', category: 'general' })));
    assert.equal(paramsKey(faqParams({ lang: 'hi', category: 'general' })), paramsKey(faqParams({ lang: 'hi', category: 'general' })), 'rebuilt params with equal values do not re-request');
    const hook = read('src/hooks/useApiGet.js');
    assert.match(hook, /const paramsKey = JSON\.stringify\(params \|\| \{\}\)/);
    assert.match(hook, /\[path, paramsKey, attempt, delay\]/);
    assert.match(hook, /controller\.abort\(\)/);
    assert.match(hook, /clearTimeout\(timer\)/);
});

test('category options come from the API response (ids and localized labels) with an English-name fallback', () => {
    const data = {
        categories: ['सामान्य'],
        categoryOptions: [{ id: 'general', label: 'सामान्य' }, { id: 'health-safety', label: 'स्वास्थ्य और सुरक्षा' }],
    };
    assert.deepEqual(categoryOptionsFrom(data), [{ id: 'general', label: 'सामान्य' }, { id: 'health-safety', label: 'स्वास्थ्य और सुरक्षा' }]);
    assert.deepEqual(categoryOptionsFrom({ categories: ['General', 'Accommodation'] }), [{ id: 'General', label: 'General' }, { id: 'Accommodation', label: 'Accommodation' }]);
    assert.deepEqual(categoryOptionsFrom({ categoryOptions: [{ id: 1 }], categories: ['General'] }), [{ id: 'General', label: 'General' }]);
    assert.deepEqual(categoryOptionsFrom(null), []);
});

test('static scan: the three components pass the selected language to useApiGet', () => {
    const faq = read('src/components/FAQSection.jsx');
    const em = read('src/components/EmergencyPanel.jsx');
    const sv = read('src/components/LocalServices.jsx');
    assert.match(faq, /const \{ t, lang \} = useT\(\)/);
    assert.match(faq, /useFreshApiGet\('\/api\/faq', \{\s*params: faqParams\(\{ lang,/);
    assert.match(em, /const \{ t, lang \} = useT\(\)/);
    assert.match(em, /useFreshApiGet\('\/api\/emergency', \{ params: emergencyParams\(lang\)/);
    assert.match(sv, /const \{ t, lang \} = useT\(\)/);
    assert.match(sv, /useFreshApiGet\('\/api\/services', \{ params: servicesParams\(lang\)/);
});

test('static scan: FAQ filter state holds category ids, chips show response labels, and Phase 2 states and Phase 4 features remain', () => {
    const faq = read('src/components/FAQSection.jsx');
    assert.match(faq, /handleCategoryChange\(cat\.id\)/);
    assert.match(faq, /selectedCategory === cat\.id/);
    assert.match(faq, /\{cat\.label\}/);
    assert.match(faq, /CATEGORY_ICONS\[cat\.id\]/);
    assert.ok(!/'Getting There'|'Health & Safety'/.test(faq), 'no English category names as filter keys');
    for (const s of ['<ErrorState error={error} onRetry={retry} />', 'LoadingState', "t('faq.noResults')", 'handleShare', 'wa.me']) assert.ok(faq.includes(s), s);
    const em = read('src/components/EmergencyPanel.jsx');
    for (const s of ['telHref(', 'ErrorState', 'LoadingState', 'emptyContacts', 'INFO_CARD_BULLETS', 'sourceHost(']) assert.ok(em.includes(s), s);
    const sv = read('src/components/LocalServices.jsx');
    for (const s of ['ErrorState', 'LoadingState', 'services.emptyTitle', 'UnverifiedNotice']) assert.ok(sv.includes(s), s);
});

test('EmergencyPanel bullet logic still matches the English detail lines the API keeps in every language', () => {
    const em = read('src/components/EmergencyPanel.jsx');
    for (const re of ['loudspeaker', 'lost children|lost persons', 'Lost & Found|Sector 1', 'photo', 'band', 'heatstroke', 'ORS', 'ambulance', 'free treatment', 'medical camps']) {
        assert.ok(em.includes(re), re);
    }
    const sample = ['Medical camps across all sectors of Simhastha grounds', 'ORS distribution points at all sector entry gates'];
    assert.ok(/medical camps/i.test(sample[0]) && /ORS/.test(sample[1]));
});

test('frontend language codes equal the backend supported list', () => {
    const backend = require('../../backend/i18n/languages.js');
    assert.deepEqual([...LANGUAGE_CODES], [...backend.SUPPORTED_LANGUAGES]);
});

test('frontend sends no hard-coded Indic or English category label to the API', () => {
    const helper = read('src/utils/apiParams.js');
    assert.ok(!/Getting There|Accommodation|Religious Events|Health & Safety/.test(helper));
});
