# facts.json schema

`facts.json` is the only place factual records are written. One canonical value per record. Top level: `schemaVersion`, `records` (active), `retired` (internal audit only, never served). Validated at startup by `facts.js`: structural errors (missing source info, invalid enums, duplicate ids, non-https URLs, future `lastVerified`, human-verification fields, retired without reason) stop the server from starting. An overdue `reviewBy` does not (see Stale records).

## Required fields
| field | rule |
|---|---|
| id | unique, stable, dotted lowercase (`emergency.police.100`) |
| category | string (emergency, local_contact, temple, calendar, claim, meta) |
| value | the single canonical value; null only for awaiting_confirmation/retired |
| label | public wording |
| sourceUrl | https URL; required for officially_listed/proposed/verified; null otherwise |
| issuingBody | required for officially_listed/proposed/verified |
| sourcePublishedAt | ISO date, or null when the source is undated (never guessed) |
| lastVerified | ISO date the source was actually checked; not in the future; required for officially_listed/proposed/verified; null if no source was checked |
| verificationStatus | `officially_listed`, `proposed`, `awaiting_confirmation`, `verified`, `retired` |
| operationallyConfirmed | boolean; must be false (no human call-test) |
| verifiedBy | null unless a human verified; must be null now |
| reviewBy | ISO date; once it is past the record is stale (hidden, not an error) |
| displayPolicy | `show`, `show_labelled`, `hide`, `never` |

## Optional fields
`notes`, `scope` (national\|state\|district\|event), `sourceDesignation` (text exactly as printed), `sourceLastUpdatedOnPage`, `retiredReason`, `retiredOn`, `replacedBy` (id), `primary` (boolean, the primary emergency action), `group` (`emergency` or `local_directory`), `additionalSources` (array of `{url, designation, sourcePublishedAt?, sourceLastUpdatedOnPage?, note?}`).

## Rules
- `show`: public, clickable allowed only for officially_listed/verified. `show_labelled`: public with a visible proposed/estimate label, not clickable. `hide`: never public. `never`: retired, never given to API/UI/Gemini.
- retired: section `retired`, displayPolicy `never`, `retiredReason` required.
- awaiting_confirmation: displayPolicy never `show`, never clickable.
- proposed: `show_labelled` (or `hide`), never `show`.
- `verified` is reserved for direct human verification and is rejected until a human does it (tests may allow it via `allowHumanVerification`).

## Helpers (`facts.js`)
`getFact(id)` (active records only), `getPublicFacts()`, `getPromptFacts()` (only records safe for Gemini), `isPublic(record)`, `isClickable(record)`, `getRetiredForAudit()`, `validateFacts(data, {today, allowHumanVerification})`, `loadFacts({file, today})`.
## Stale records
A non-retired record whose `reviewBy` is before today is stale. The only exemption is `emergency.national.112` (`REVIEW_EXEMPT_IDS` in `facts.js`): it is still reported as overdue (startup warning, `/api/health`) but stays public and available to the chat prompt. Every other stale record stays in the registry, flagged, but is excluded from `getPublicFacts()`, `getPromptFacts()`, `/api/emergency`, the FAQ calendar answers, the chat system prompt and mock replies. The loader logs one warning with the stale ids and dates, and `GET /api/health` returns `factsReviewOverdue` (boolean) and `factsReviewOverdueCount`. If no approved emergency number is left (for example 112 itself is set to `hide`), `/api/emergency` returns an empty list and the chat prompt tells the model to direct users to the official local authorities without stating any number. `createRegistry({ file, today, warn })` and `createApp({ today })` accept an injectable date (string or function). Helpers: `listStaleFacts()`, `isStale(record, today)`.
