// Values mirrored from backend/data/facts.json. test/facts-sync.test.js fails if they drift.
// This is a build-time snapshot of the approved set. It is NOT filtered by staleness (reviewBy): hiding a
// record here needs a rebuild after facts.json changes.
export const TEMPLE_PORTAL_URL = 'https://www.shrimahakaleshwar.mp.gov.in/services/bhasmaarti';
// Proposed (not confirmed) bathing-day plan: 3 Shahi Snan and 7 Parv Snan between 9 April and 8 May 2028.
// Mirrors calendar.simhastha2028.snan_plan.valueParts. Individual dates are not published here.
export const PROPOSED_SNAN_PLAN = Object.freeze({ shahi: 3, parv: 7, from: '2028-04-09', to: '2028-05-08' });
