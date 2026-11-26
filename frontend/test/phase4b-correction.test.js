import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_CODES } from '../src/i18n/languages.js';
import { loadLocale, createTranslator } from '../src/i18n/index.js';
import { createFormatter } from '../src/i18n/format.js';
import en from '../src/i18n/locales/en.js';
import { PROPOSED_SNAN_PLAN } from '../src/constants/facts.js';
import { isUnsourcedArrivalAdvice, withoutUnsourcedArrivalAdvice } from '../src/utils/arrivalAdvice.js';
import { ghats, navigationTips } from '../src/data/navigationData.js';
import { groupContacts } from '../src/utils/emergencyGroups.js';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const facts = JSON.parse(readFileSync(join(ROOT, '..', 'backend', 'data', 'facts.json'), 'utf8'));
const NON_EN = LANGUAGE_CODES.filter((c) => c !== 'en');
const catalogs = { en };
for (const c of NON_EN) catalogs[c] = await loadLocale(c);
// facts-sync compares against the full approved set in facts.json (all active records, stale or not):
// the frontend snapshot cannot hide records by staleness without a rebuild.
test('proposed snan plan constants equal facts.json valueParts (proposed, labelled)', () => {
    const plan = facts.records.find((r) => r.id === 'calendar.simhastha2028.snan_plan');
    assert.deepEqual({ ...PROPOSED_SNAN_PLAN }, plan.valueParts);
    assert.equal(plan.verificationStatus, 'proposed');
    assert.equal(plan.displayPolicy, 'show_labelled');
    assert.equal(plan.value, `${PROPOSED_SNAN_PLAN.shahi} Shahi Snan and ${PROPOSED_SNAN_PLAN.parv} Parv Snan during 9 April to 8 May`);
});
test('facts.json: 108 hidden; five dates and attendance figures are retired, not active', () => {
    const r108 = facts.records.find((r) => r.id === 'emergency.disaster.108');
    assert.equal(r108.verificationStatus, 'awaiting_confirmation');
    assert.equal(r108.displayPolicy, 'hide');
    const active = JSON.stringify(facts.records);
    for (const s of ['2028-04-13', '2028-04-27', '2028-05-12', 'crore']) assert.ok(!active.includes(s), s);
    assert.equal(facts.retired.filter((r) => /bathing_dates|attendance/.test(r.id)).length, 3);
});
test('date notice and crowd notice keys exist in all eight locales, translated, same placeholders', () => {
    for (const k of ['nav.dates.crowdNotice', 'nav.dates.proposedNotice', 'status.proposed', 'notice.unverifiedDetails']) {
        assert.ok(en.messages[k], `en:${k}`);
        for (const c of NON_EN) {
            const v = catalogs[c].messages[k];
            assert.ok(v && v !== en.messages[k], `${c}:${k} missing or still English`);
        }
    }
    const ph = (s) => (s.match(/\{[^}]+\}/g) || []).sort().join(',');
    for (const c of LANGUAGE_CODES) {
        assert.equal(ph(catalogs[c].messages['nav.dates.proposedNotice']), '{fromDate},{parv},{shahi},{toDate}', c);
        assert.equal(ph(catalogs[c].messages['nav.dates.crowdNotice']), '', c);
        if (c !== 'en') {
            assert.equal(catalogs[c]._meta.status, 'needs-review');
            assert.equal(catalogs[c]._meta.reviewer, '');
        }
    }
});
test('rendered notice per language: proposed plan numbers exactly as in facts, no confirmed dates, no crowd figures', () => {
    for (const c of LANGUAGE_CODES) {
        const t = createTranslator({ lang: c, catalogs, markers: false });
        const f = createFormatter(c);
        const notice = t('nav.dates.proposedNotice', {
            shahi: PROPOSED_SNAN_PLAN.shahi,
            parv: PROPOSED_SNAN_PLAN.parv,
            fromDate: f.formatDate(PROPOSED_SNAN_PLAN.from, { day: 'numeric', month: 'long' }),
            toDate: f.formatDate(PROPOSED_SNAN_PLAN.to, { day: 'numeric', month: 'long', year: 'numeric' }),
        });
        assert.ok(!/\{[^}]+\}/.test(notice), `${c} has unresolved placeholders: ${notice}`);
        assert.match(notice, /\b3\b/, c);
        assert.match(notice, /\b7\b/, c);
        assert.match(notice, /\b9\b/, c);
        assert.match(notice, /\b8\b/, c);
        assert.match(notice, /2028/, c);
        assert.ok(!/\b(13|27|12)\b/.test(notice.replace(/2028/g, '')), `${c} mentions an unconfirmed individual date`);
        const crowd = t('nav.dates.crowdNotice');
        assert.ok(!/crore|million|\d/.test(crowd), `${c} crowd notice has a figure`);
    }
    const enNotice = en.messages['nav.dates.proposedNotice'];
    assert.match(enNotice, /not been officially confirmed/);
    assert.match(enNotice, /proposed schedule/);
    assert.ok(!/tens of millions|crore/i.test(en.messages['nav.dates.crowdNotice']));
    assert.ok(!/confirmed/i.test(en.messages['nav.dates.crowdNotice']));
});
test('NavigationGuide: no hard-coded notice text, no 4-5 AM advice, notice values from the facts constant', () => {
    const src = readFileSync(join(ROOT, 'src/components/NavigationGuide.jsx'), 'utf8');
    assert.ok(!/4-5 AM|Arrive at ghats/i.test(src));
    assert.ok(!/very large crowds|have not been officially confirmed|Shahi Snan/.test(src));
    assert.match(src, /PROPOSED_SNAN_PLAN/);
    assert.match(src, /<ProposedLabel/);
});
test('unsourced arrival-time advice is not served: not in components, README or filtered data text', () => {
    const walk = (d) => readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|html)$/.test(n) ? [p] : [];
    });
    for (const f of walk(join(ROOT, 'src')).filter((p) => !/[\\/]src[\\/]data[\\/]/.test(p))) {
        assert.ok(!/4-5 AM/i.test(readFileSync(f, 'utf8')), f);
    }
    assert.ok(!/4-5 AM/i.test(readFileSync(join(ROOT, '..', 'README.md'), 'utf8')));
    // the pinned dataset still contains the advice; the component filters it before rendering
    assert.ok(ghats.some((g) => isUnsourcedArrivalAdvice(g.tips)));
    assert.ok(navigationTips.some((x) => isUnsourcedArrivalAdvice(x.tip)));
    for (const g of ghats) assert.ok(!isUnsourcedArrivalAdvice(withoutUnsourcedArrivalAdvice(g.tips)), g.id);
    const shown = navigationTips.filter((x) => !isUnsourcedArrivalAdvice(x.tip)).map((x) => x.tip).join(' ')
        + ghats.map((g) => withoutUnsourcedArrivalAdvice(g.tips)).join(' ');
    assert.ok(!/Arrive (by 4 AM|at Ram Ghat 2-3 hours)/i.test(shown));
    assert.equal(withoutUnsourcedArrivalAdvice('Arrive by 4 AM on Amrit Snan days. Boat rides available across Kshipra.'), 'Boat rides available across Kshipra.');
    assert.equal(withoutUnsourcedArrivalAdvice('Book Bhasma Aarti passes online months in advance.'), 'Book Bhasma Aarti passes online months in advance.');
});
test('empty emergency list (stale or failed API) groups to nothing without throwing', () => {
    assert.deepEqual(groupContacts([]), { primary: null, secondary: [], local: [] });
    assert.deepEqual(groupContacts(null), { primary: null, secondary: [], local: [] });
    const panel = readFileSync(join(ROOT, 'src/components/EmergencyPanel.jsx'), 'utf8');
    assert.match(panel, /emergencyContacts\.length === 0 \?/);
    assert.match(panel, /emergency\.emptyContacts/);
});
