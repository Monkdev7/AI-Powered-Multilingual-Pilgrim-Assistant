import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMERGENCY_NUMBERS, emergencyFooter } from '../src/utils/chatErrors.js';
import { TEMPLE_PORTAL_URL } from '../src/constants/facts.js';
import { groupContacts, telHref, sourceHost } from '../src/utils/emergencyGroups.js';
import { LANGUAGE_CODES } from '../src/i18n/languages.js';
import { loadLocale } from '../src/i18n/index.js';
import en from '../src/i18n/locales/en.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const facts = JSON.parse(readFileSync(join(ROOT, '..', 'backend', 'data', 'facts.json'), 'utf8'));
const rec = (id) => facts.records.find((r) => r.id === id);
const REMOVED = [/0734[\s-]?2551234/, /1800[\s-]?180[\s-]?5522/, /(^|\D)1090(\D|$)/, /011[\s-]?24363260/, /bhasmarti/i, /(^|\D)108(\D|$)/];

test('chat error footer constant equals facts.json (numbers and labels)', () => {
    assert.equal(EMERGENCY_NUMBERS.national, rec('emergency.national.112').value);
    assert.equal(EMERGENCY_NUMBERS.police, rec('emergency.police.100').value);
    assert.equal(EMERGENCY_NUMBERS.ambulance, rec('emergency.ambulance.102').value);
    assert.equal(rec('emergency.police.100').label, 'Police');
    assert.equal(rec('emergency.ambulance.102').label, 'Ambulance');
    assert.equal(rec('emergency.national.112').primary, true);
    const footer = emergencyFooter('AI_ERROR');
    assert.ok(footer.startsWith('For emergencies:\n\u2022 National emergency: 112'));
    assert.ok(!/108/.test(footer), '108 is hidden pending a second source');
});

test('temple portal constant equals facts.json', () => {
    assert.equal(TEMPLE_PORTAL_URL, rec('temple.bhasmaarti.portal').value);
    assert.equal(TEMPLE_PORTAL_URL, 'https://www.shrimahakaleshwar.mp.gov.in/services/bhasmaarti');
});

test('no removed number or old URL in shipped source, locales or html (data files excluded)', () => {
    const walk = (d) => readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|html|json)$/.test(n) ? [p] : [];
    });
    const files = [...walk(join(ROOT, 'src')), join(ROOT, 'index.html'), join(ROOT, 'public', 'manifest.json')]
        .filter((f) => !/[\\/]src[\\/]data[\\/]/.test(f));
    for (const f of files) {
        const text = readFileSync(f, 'utf8');
        for (const re of REMOVED) assert.ok(!re.test(text), `${f} matches ${re}`);
    }
});

test('locales: new keys exist in every language, no phone numbers or URLs', async () => {
    const keys = ['emergency.source', 'emergency.localHeading', 'emergency.listingNote', 'notice.unverifiedDetails', 'status.proposed'];
    for (const c of LANGUAGE_CODES) {
        const cat = c === 'en' ? en : await loadLocale(c);
        for (const k of keys) {
            const v = cat.messages[k];
            assert.ok(v && v.length > 3, `${c}:${k}`);
            assert.ok(!/\d{3,}|https?:/.test(v), `${c}:${k} has a number or URL`);
        }
        assert.ok(cat.messages['emergency.source'].includes('{source}'), c);
        if (c !== 'en') assert.equal(cat._meta.status, 'needs-review');
    }
});

const apiContacts = [
    { id: 'a', name: 'Police', number: '100', primary: false, group: 'emergency', clickable: true, source: { url: 'https://www.incredibleindia.gov.in/en/emergency' } },
    { id: 'p', name: 'National emergency', number: '112', primary: true, group: 'emergency', clickable: true, source: { url: 'https://www.mha.gov.in/emergency-response-support-system-erss' } },
    { id: 'l', name: 'SP office', number: '0734-2527130', primary: false, group: 'local_directory', clickable: true, source: { url: 'https://ujjain.nic.in/en/divisions/district-administration/' } },
    { id: 'n', name: 'Pending', number: '999', primary: false, group: 'emergency', clickable: false, source: { url: 'https://example.gov.in' } },
];

test('groupContacts: primary 112, secondary emergency, separate local directory group', () => {
    const g = groupContacts(apiContacts);
    assert.equal(g.primary.number, '112');
    assert.deepEqual(g.secondary.map((c) => c.id), ['a', 'n']);
    assert.deepEqual(g.local.map((c) => c.id), ['l']);
    assert.deepEqual(groupContacts(undefined), { primary: null, secondary: [], local: [] });
    assert.equal(groupContacts([apiContacts[0]]).primary, null);
});

test('telHref: only clickable contacts get a tel: link', () => {
    assert.equal(telHref(apiContacts[1]), 'tel:112');
    assert.equal(telHref(apiContacts[2]), 'tel:07342527130');
    assert.equal(telHref(apiContacts[3]), null);
    assert.equal(telHref(null), null);
    assert.equal(telHref({ number: '112' }), null);
});

test('sourceHost: short attribution label from the source URL', () => {
    assert.equal(sourceHost(apiContacts[1]), 'mha.gov.in');
    assert.equal(sourceHost({ source: { url: 'nope' } }), null);
    assert.equal(sourceHost({}), null);
});

test('EmergencyPanel has no hard-coded contact id or numbers', () => {
    const src = readFileSync(join(ROOT, 'src/components/EmergencyPanel.jsx'), 'utf8');
    assert.ok(!/CONTROL_ROOM|c\.id === \d/.test(src));
});
