'use strict';
// Canonical facts registry: loader, validator and read helpers.
// Schema: see facts.schema.md. Data: facts.json (only place factual records are written).

const fs = require('fs');
const path = require('path');

const STATUSES = ['officially_listed', 'proposed', 'awaiting_confirmation', 'verified', 'retired'];
const POLICIES = ['show', 'show_labelled', 'hide', 'never'];
const SCOPES = ['national', 'state', 'district', 'event'];
const SOURCE_REQUIRED = ['officially_listed', 'proposed', 'verified'];
const ID_RE = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/;
const DEFAULT_FILE = path.join(__dirname, 'facts.json');

function localToday() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function isIsoDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const isHttps = (u) => {
  if (typeof u !== 'string') return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};
const isText = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Validate a registry document. Returns an array of error strings (empty = valid).
 * Structural problems are errors. An overdue reviewBy is NOT an error: it is reported by staleFactIds()\n * and handled softly by the registry (stale records are hidden, the server still starts).\n * options.today: 'YYYY-MM-DD' (injectable for tests)
 * options.allowHumanVerification: permit operationallyConfirmed/verifiedBy/'verified' (test fixtures only)
 */
function validateFacts(data, options = {}) {
  const today = options.today || localToday();
  const allowHuman = options.allowHumanVerification === true;
  const errors = [];
  if (!data || typeof data !== 'object' || !Array.isArray(data.records) || !Array.isArray(data.retired)) {
    return ['registry must be an object with "records" and "retired" arrays'];
  }
  if (!isIsoDate(today)) return [`invalid today value: ${today}`];

  const seen = new Set();
  const all = [
    ...data.records.map((r) => ({ r, section: 'records' })),
    ...data.retired.map((r) => ({ r, section: 'retired' })),
  ];
  all.forEach(({ r }) => { if (r && typeof r.id === 'string') seen.add(r.id); });
  const ids = new Set();

  all.forEach(({ r, section }, idx) => {
    if (!r || typeof r !== 'object') { errors.push(`${section}[${idx}]: not an object`); return; }
    const where = r.id || `${section}[${idx}]`;
    const err = (m) => errors.push(`${where}: ${m}`);

    if (!isText(r.id) || !ID_RE.test(r.id)) err('id must be a stable dotted lowercase id');
    else if (ids.has(r.id)) err('duplicate id');
    else ids.add(r.id);

    ['category', 'label'].forEach((k) => { if (!isText(r[k])) err(`${k} is required`); });
    if (!('value' in r) || r.value === undefined) err('value is required');
    else if (r.value === null && !['awaiting_confirmation', 'retired'].includes(r.verificationStatus)) {
      err('value may be null only for awaiting_confirmation or retired');
    }

    const status = r.verificationStatus;
    if (!STATUSES.includes(status)) err(`invalid verificationStatus: ${status}`);
    if (!POLICIES.includes(r.displayPolicy)) err(`invalid displayPolicy: ${r.displayPolicy}`);
    if (r.scope !== undefined && !SCOPES.includes(r.scope)) err(`invalid scope: ${r.scope}`);

    // Source information
    if (SOURCE_REQUIRED.includes(status)) {
      if (!isText(r.sourceUrl)) err('sourceUrl is required');
      if (!isText(r.issuingBody)) err('issuingBody is required');
      if (!isText(r.lastVerified)) err('lastVerified is required');
    }
    if (r.sourceUrl !== null && r.sourceUrl !== undefined && !isHttps(r.sourceUrl)) err('sourceUrl must be an https URL');
    if (r.sourceUrl === undefined) err('sourceUrl key is required (null when no source)');
    if (r.additionalSources !== undefined) {
      if (!Array.isArray(r.additionalSources)) err('additionalSources must be an array');
      else r.additionalSources.forEach((s, i) => {
        if (!s || !isHttps(s.url)) err(`additionalSources[${i}].url must be an https URL`);
      });
    }

    // Dates
    ['sourcePublishedAt', 'lastVerified', 'reviewBy', 'retiredOn', 'sourceLastUpdatedOnPage'].forEach((k) => {
      const v = r[k];
      if (v !== null && v !== undefined && !isIsoDate(v)) err(`${k} must be an ISO date (YYYY-MM-DD) or null`);
    });
    if (!isIsoDate(r.reviewBy)) err('reviewBy is required (ISO date)');
    if (!('sourcePublishedAt' in r)) err('sourcePublishedAt key is required (null when undated)');
    if (isIsoDate(r.lastVerified) && r.lastVerified > today) err(`lastVerified ${r.lastVerified} is in the future`);

    // Human verification
    if (typeof r.operationallyConfirmed !== 'boolean') err('operationallyConfirmed must be a boolean');
    if (!('verifiedBy' in r)) err('verifiedBy key is required (null unless a human verified)');
    if (!allowHuman) {
      if (r.operationallyConfirmed === true) err('operationallyConfirmed must be false (no human call-test)');
      if (r.verifiedBy !== null && r.verifiedBy !== undefined) err('verifiedBy must be null');
      if (status === 'verified') err("status 'verified' is reserved for direct human verification");
    } else if (status === 'verified' && !isText(r.verifiedBy)) {
      err('verified records need verifiedBy');
    }

    // Status / policy consistency
    if (status === 'retired') {
      if (r.displayPolicy !== 'never') err('retired records must have displayPolicy never');
      if (!isText(r.retiredReason)) err('retired records need retiredReason');
      if (section !== 'retired') err('retired records belong in the retired section');
    } else if (section === 'retired') {
      err('records in the retired section must have status retired');
    }
    if (status === 'awaiting_confirmation' && r.displayPolicy === 'show') err('awaiting_confirmation must not have displayPolicy show');
    if (status === 'proposed' && r.displayPolicy === 'show') err('proposed records must use show_labelled, not show');
    if (r.displayPolicy === 'never' && status !== 'retired') err('displayPolicy never is for retired records');
    if (r.displayPolicy === 'show_labelled' && !['proposed', 'officially_listed', 'verified', 'awaiting_confirmation'].includes(status)) err('show_labelled not allowed for this status');
    if (r.replacedBy !== undefined && !seen.has(r.replacedBy)) err(`replacedBy references unknown id ${r.replacedBy}`);
  });
  return errors;
}

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o).forEach(deepFreeze);
  }
  return o;
}

/** Load, validate (throws a clear error), and deep-freeze. */
function loadFacts(options = {}) {
  const file = options.file || DEFAULT_FILE;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Facts registry could not be read (${file}): ${e.message}`);
  }
  const errors = validateFacts(data, options);
  if (errors.length) {
    throw new Error(`Facts registry invalid (${errors.length} error(s)):\n- ${errors.join('\n- ')}`);
  }
  return deepFreeze(data);
}

/** Display policy and status only (staleness is handled by the registry). */
function isPublic(record) {
  return !!record
    && (record.displayPolicy === 'show' || record.displayPolicy === 'show_labelled')
    && ['officially_listed', 'proposed', 'verified'].includes(record.verificationStatus);
}
/** Only officially_listed/verified with policy show may be clickable. */
function isClickable(record) {
  return !!record
    && record.displayPolicy === 'show'
    && ['officially_listed', 'verified'].includes(record.verificationStatus);
}
/** Safe for Gemini: public records only (labelled ones must be presented with their label). */
function isPromptSafe(record) {
  return isPublic(record);
}
/**
 * The national emergency number is exempt from automatic hiding when its review is overdue: hiding 112 would
 * leave users with no emergency action. It is still reported as overdue (startup warning, /api/health).
 * No other record is exempt.
 */
const REVIEW_EXEMPT_IDS = Object.freeze(['emergency.national.112']);
/** Review overdue: reviewBy is before today. Retired records are never stale (never served anyway). */
function isStale(record, today = localToday()) {
  return !!record
    && record.verificationStatus !== 'retired'
    && isIsoDate(record.reviewBy)
    && record.reviewBy < today;
}
/**
 * A registry instance. Structural errors throw here (fail fast). Overdue reviewBy dates only mark
 * records as stale: stale records stay in the registry but are excluded from public/prompt output.
 * options.today: 'YYYY-MM-DD' string or () => string. Default is the live local date, evaluated on every
 * call, so a long-running server hides a record the day it becomes overdue.
 * options.warn: startup warning sink (default console.warn).
 */
function createRegistry(options = {}) {
  const todayOpt = options.today;
  const today = () => (typeof todayOpt === 'function' ? todayOpt() : todayOpt || localToday());
  const data = loadFacts({ ...options, today: today() });
  const records = data.records;
  const byId = new Map(records.map((r) => [r.id, r]));
  const stale = (r) => isStale(r, today());
  // Overdue records are all reported via listStaleFacts(); only the non-exempt ones are hidden from output.
  const hiddenByStale = (r) => stale(r) && !REVIEW_EXEMPT_IDS.includes(r.id);
  const listStaleFacts = () => records.filter(stale);
  const registry = {
    today,
    isStale: (r) => stale(r),
    listStaleFacts,
    getFact: (id) => byId.get(id),
    getAllFacts: () => records,
    getPublicFacts: () => records.filter((r) => isPublic(r) && !hiddenByStale(r)),
    getPromptFacts: () => records.filter((r) => isPromptSafe(r) && !hiddenByStale(r)),
    getRetiredForAudit: () => data.retired,
    isPublic, isClickable,
  };
  const overdue = listStaleFacts();
  if (overdue.length) {
    const warn = options.warn || console.warn;
    warn(`Facts registry: ${overdue.length} record(s) are past their reviewBy date. They are hidden from public output until re-reviewed, `
      + `except ${REVIEW_EXEMPT_IDS.join(', ')} (kept visible, still overdue): `
      + overdue.map((r) => `${r.id} (reviewBy ${r.reviewBy})`).join(', '));
  }
  return registry;
}
// Fail fast at startup on a structurally invalid registry. Overdue reviews only log a warning.
const defaultRegistry = createRegistry();
module.exports = {
  STATUSES, POLICIES, SCOPES,
  validateFacts, loadFacts, deepFreeze, createRegistry, defaultRegistry,
  isPublic, isClickable, isPromptSafe, isStale,
  getFact: defaultRegistry.getFact,
  getAllFacts: defaultRegistry.getAllFacts,
  getPublicFacts: defaultRegistry.getPublicFacts,
  getPromptFacts: defaultRegistry.getPromptFacts,
  listStaleFacts: defaultRegistry.listStaleFacts,
  getRetiredForAudit: defaultRegistry.getRetiredForAudit,
};