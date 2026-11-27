const express = require('express');
const defaultRegistry = require('../data/facts').defaultRegistry;

const { LANGUAGE_NAMES } = require('../i18n/languages');

const OFFICIAL_SOURCES_TEXT = 'Ujjain District Administration (https://ujjain.nic.in), the Shri Mahakaleshwar Temple official portal for Bhasma Aarti, and the Madhya Pradesh government / MPINFO for official announcements';

const stripLabelTag = (label) => label.replace(/\s*\((proposed|unconfirmed)\)\s*$/i, '');
const PROPOSED_FLAG = 'proposed, not officially confirmed';

function formatDateLong(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d} ${months[m - 1]} ${y}`;
}

function describeFact(r) {
    const flag = r.verificationStatus === 'proposed' ? ` (${PROPOSED_FLAG})` : '';
    if (r.category === 'emergency') {
        return `- ${r.value}: ${r.label}${r.primary ? ' (primary emergency number; call first in any emergency)' : ''}`;
    }
    if (r.category === 'local_contact') {
        return `- ${r.value}: ${r.label}. This is an office directory number, not a confirmed 24-hour line or event hotline.`;
    }
    if (r.id === 'temple.bhasmaarti.portal') return `- Official Bhasma Aarti booking portal: ${r.value}`;
    if (r.category === 'temple') return `- ${r.value}: ${r.label}. For temple and Bhasma Aarti questions only; not an emergency line.`;
    if (r.value && typeof r.value === 'object' && r.value.start) {
        return `- ${stripLabelTag(r.label)}: ${formatDateLong(r.value.start)} to ${formatDateLong(r.value.end)}${flag}`;
    }
    return `- ${stripLabelTag(r.label)}: ${r.value}${flag}`;
}

// Builds the English system prompt. The facts block comes from the registry at startup.
function buildSystemPrompt(records = defaultRegistry.getPromptFacts()) {
    const block = (cat) => records.filter((r) => cat.includes(r.category)).map(describeFact);
    const emergency = block(['emergency', 'local_contact']);
    const temple = block(['temple']);
    const calendar = block(['calendar']);
    const primary = records.find((r) => r.category === 'emergency' && r.primary);
    const emergencyAction = primary
        ? `- If someone describes an emergency, tell them to call ${primary.value} first.`
        : '- No emergency numbers are currently approved. If someone describes an emergency, tell them to contact the official local authorities (police, medical services or mela officials on site) right away. Do not state, guess or recall any phone number.';
    const sourcesText = primary ? `${primary.value} for emergencies, ${OFFICIAL_SOURCES_TEXT}` : OFFICIAL_SOURCES_TEXT;
    const healthTail = primary ? `in an emergency call ${primary.value}` : 'in an emergency contact the official local authorities (do not state any number)';
    const noNumbers = emergency.length ? '' : '\n(none currently approved)';
    const noCalendar = calendar.length ? '' : '\n(none currently approved: say that event dates are not currently verified)';
    const noTemple = temple.length ? '' : '\n(none currently approved)';
    return `You are a warm, helpful, and knowledgeable AI assistant for Simhastha Kumbh 2028 pilgrims.
Your name is "KumbhSaathi" (meaning "Kumbh Companion").

APPROVED FACTS (the only phone numbers, dates and links you may state as facts):
Emergency and helpline numbers, as listed by official sources (not independently call-tested; national numbers, not special Simhastha helplines):
${emergency.join('\n')}${noNumbers}
Temple (Shri Mahakaleshwar Temple, Ujjain):
${temple.join('\n')}${noTemple}
Event calendar:
${calendar.join('\n')}${noCalendar}

RULES FOR FACTS:
- Never guess or invent phone numbers, dates, costs, distances, timings or facility locations.
- Use only the approved facts above for numbers, dates and links. Items marked "${PROPOSED_FLAG}" must always be presented with that caveat.
- Use each number only with its exact label above.
- If a requested fact is not in the approved list, say plainly that this information is not currently verified, and direct the user to an appropriate official source: ${sourcesText}.
- Do not claim that the app's data is officially confirmed, and do not state attendance figures.
${emergencyAction}

Your areas of general knowledge (without specific numbers or dates):
- Simhastha Kumbh in Ujjain, Madhya Pradesh: held roughly every 12 years; the 2028 event is planned (see the approved calendar above, if any)
- Why "Simhastha": it relates to Jupiter in Leo (Simha Rashi) and the Sun in Aries (Mesh Rashi). The previous Simhastha in Ujjain was in 2016.
- Holy river: Kshipra (also called Shipra), the sacred river of Ujjain, with bathing ghats such as Ram Ghat
- Mahakaleshwar Temple: one of 12 Jyotirlingas of Lord Shiva; Bhasma Aarti is performed there. For booking, point users only to the official portal in the approved facts.
- Other temples: Kal Bhairav, Harsiddhi Mata, Mangalnath, Sandipani Ashram, Chintaman Ganesh, Bade Ganeshji Ka Mandir
- Religious rituals: holy dip in Kshipra, Simhastha Parikrama, Pind Daan, Kshipra Aarti, Bhasma Aarti
- General travel and stay advice: Ujjain is reachable by rail, road and via Indore airport; for schedules, prices and availability, say they are not currently verified and point to official sources
- Health and safety: it is hot in April-May, so hydration, sunscreen, ORS and avoiding midday sun matter; keep approved emergency numbers handy; ${healthTail}

Personality:
- Greet with "Jai Mahakal!" or "Om Namah Shivaya!" when appropriate
- Be compassionate and respectful of the spiritual nature of the event
- Provide practical, actionable advice
- Keep responses concise but complete
- If you don't know something specific, acknowledge it and suggest an official source from the list above

IMPORTANT: Always respond in the language specified. If asked to respond in Hindi, respond in Hindi script (Devanagari). If Tamil, use Tamil script. Always match the requested language.`;
}


// Mock replies (DEMO_MODE only) are generated from the same approved (non-stale) facts.
function buildMockResponses(records = defaultRegistry.getPromptFacts()) {
    const period = records.find((r) => r.id === 'calendar.simhastha2028.period');
    const plan = records.find((r) => r.id === 'calendar.simhastha2028.snan_plan');
    const portal = records.find((r) => r.id === 'temple.bhasmaarti.portal');
    const emergency = records.filter((r) => r.category === 'emergency');
    const primary = emergency.find((r) => r.primary);
    const others = emergency.filter((r) => !r.primary).map((r) => `${r.label}: ${r.value}`).join(', ');
    const sources = 'Please check official sources such as Ujjain District Administration (https://ujjain.nic.in) or the Madhya Pradesh government / MPINFO.';
    const welcome = period && plan
        ? `The planned period is ${formatDateLong(period.value.start)} to ${formatDateLong(period.value.end)} (${PROPOSED_FLAG}), with ${plan.value} (${PROPOSED_FLAG}). Individual bathing dates have not been officially confirmed yet.`
        : 'Event dates are not currently verified in this app.';
    const emergencyReply = primary
        ? `In an emergency, call ${primary.value} (${primary.label}) first.${others ? ` Other numbers listed by official sources: ${others}.` : ''} These are national numbers, not special Simhastha helplines.`
        : 'In an emergency, please contact the official local authorities right away. No emergency numbers are currently verified in this app.';
    const templeReply = portal
        ? `For Bhasma Aarti booking, use only the official portal: ${portal.value}.`
        : 'For Bhasma Aarti booking, use only the official temple portal; its address is not currently verified in this app.';
    return [
        `Jai Mahakal! Welcome to Simhastha Kumbh 2028 in Ujjain, Madhya Pradesh. ${welcome} ${sources} How can I assist you?`,
        `Om Namah Shivaya! For travel to Ujjain, trains, buses and flights via Indore are the usual options. Schedules, special trains and transfer details are not currently verified in this app, so please check IRCTC and the official sources. ${sources}`,
        `Accommodation options for Simhastha 2028 include tent cities, dharamshalas, akhara camps and hotels in Ujjain or Indore. Prices and availability are not currently verified here, so please confirm with official sources. ${sources}`,
        `${emergencyReply} It is hot in April-May: carry water and ORS, use sunscreen and avoid the midday sun.`,
        `The Kshipra river and Ram Ghat are central to Simhastha bathing, and the Mahakaleshwar Jyotirlinga is one of the 12 Jyotirlingas of Lord Shiva. ${templeReply} Timings and availability are not currently verified in this app.`,
    ];
}
let mockIndex = 0;

const GEMINI_TIMEOUT_MS = () => parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 25000;

// Default model; override with the optional GEMINI_MODEL environment variable.
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const geminiModel = () => (process.env.GEMINI_MODEL || '').trim() || DEFAULT_GEMINI_MODEL;

async function getGeminiResponse(message, language, history, systemPrompt) {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const langName = LANGUAGE_NAMES[language];
    const prompt = `[Please respond in ${langName}]\n\n${message}`;
    // Conversation so far (already validated and normalized), followed by the new user turn.
    const contents = [
        ...history.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: prompt }] },
    ];
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            controller.abort();
            const e = new Error('Gemini request timed out');
            e.code = 'ETIMEDOUT';
            reject(e);
        }, GEMINI_TIMEOUT_MS());
    });
    try {
        return await Promise.race([
            (async () => {
                const response = await ai.models.generateContent({
                    model: geminiModel(),
                    contents,
                    config: {
                        systemInstruction: systemPrompt,
                        maxOutputTokens: 800,
                        temperature: 0.7,
                        abortSignal: controller.signal,
                    },
                });
                const text = response && response.text;
                if (typeof text === 'string' && text.trim() !== '') return text;
                // No text: keep the safety-block classification the previous SDK produced.
                const blocked = (response && response.promptFeedback && response.promptFeedback.blockReason)
                    || (response && response.candidates && response.candidates[0] && response.candidates[0].finishReason === 'SAFETY');
                throw new Error(blocked ? 'Gemini response blocked (SAFETY)' : 'Gemini returned no text');
            })(),
            timeout,
        ]);
    } finally {
        clearTimeout(timer);
    }
}

function getMockResponse(message, language, responses) {
    const response = responses[mockIndex % responses.length];
    mockIndex++;

    const langPrefixes = {
        hi: '🙏 नमस्ते! (Demo mode - sample reply, not live AI)\n\n',
        bn: '🙏 নমস্কার! (Demo mode - sample reply, not live AI)\n\n',
        ta: '🙏 வணக்கம்! (Demo mode - sample reply, not live AI)\n\n',
        te: '🙏 నమస్కారం! (Demo mode - sample reply, not live AI)\n\n',
        mr: '🙏 नमस्कार! (Demo mode - sample reply, not live AI)\n\n',
        gu: '🙏 નમસ્તે! (Demo mode - sample reply, not live AI)\n\n',
        pa: '🙏 ਸਤ ਸ੍ਰੀ ਅਕਾਲ! (Demo mode - sample reply, not live AI)\n\n',
    };

    const prefix = langPrefixes[language] || '🙏 Hello! (Demo mode - sample reply, not live AI)\n\n';
    return prefix + response;
}

// Check if a real valid-looking key is configured
// Gemini keys start with "AIza" (legacy) or "AQ." (new format)
function isValidKey(key) {
    if (!key) return false;
    if (key === 'your_gemini_api_key_here') return false;
    return (key.startsWith('AIza') && key.length > 20) ||
        (key.startsWith('AQ.') && key.length > 20);
}

// Demo (mock) mode is opt-in via DEMO_MODE=true and is never active in production.
function isDemoMode() {
    return process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
}

const intEnv = (name, def) => {
    const n = parseInt(process.env[name], 10);
    return Number.isFinite(n) && n > 0 ? n : def;
};

function sendError(res, status, code, error) {
    return res.status(status).json({ error, code });
}

// Validates the request body. Returns { value } or { error }.
function validateChatBody(body) {
    const maxMessage = intEnv('CHAT_MAX_MESSAGE_LENGTH', 1000);
    const maxHistory = intEnv('CHAT_MAX_HISTORY', 20);
    const maxHistoryContent = intEnv('CHAT_MAX_HISTORY_CONTENT_LENGTH', 4000);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be a JSON object' };
    }
    const { message, language = 'en', history = [] } = body;
    if (typeof message !== 'string' || message.trim() === '') {
        return { error: 'Message is required' };
    }
    if (message.trim().length > maxMessage) {
        return { error: `Message must be at most ${maxMessage} characters` };
    }
    // Unknown language codes are rejected (400) rather than silently using English.
    if (typeof language !== 'string' || !Object.prototype.hasOwnProperty.call(LANGUAGE_NAMES, language)) {
        return { error: `Unsupported language. Supported: ${Object.keys(LANGUAGE_NAMES).join(', ')}` };
    }
    if (!Array.isArray(history)) {
        return { error: 'History must be an array' };
    }
    if (history.length > maxHistory) {
        return { error: `History must contain at most ${maxHistory} messages` };
    }
    const cleaned = [];
    for (const item of history) {
        if (!item || typeof item !== 'object' || (item.role !== 'user' && item.role !== 'assistant')) {
            return { error: "Each history item needs a role of 'user' or 'assistant'" };
        }
        if (typeof item.content !== 'string') {
            return { error: 'History content must be a string' };
        }
        if (item.content.length > maxHistoryContent) {
            return { error: `History content must be at most ${maxHistoryContent} characters` };
        }
        // Empty turns are not accepted by Gemini; skip them.
        if (item.content.trim() === '') continue;
        cleaned.push({ role: item.role, content: item.content });
    }
    // Gemini rejects history that starts with a model turn: drop leading assistant turns.
    while (cleaned.length > 0 && cleaned[0].role === 'assistant') cleaned.shift();
    return { value: { message: message.trim(), language, history: cleaned } };
}

// Remove anything that looks like an API key before logging.
function redact(text) {
    let out = String(text || '');
    const key = process.env.GEMINI_API_KEY;
    if (key) out = out.split(key).join('[REDACTED]');
    return out.replace(/AIza[0-9A-Za-z_-]{10,}|AQ\.[0-9A-Za-z_.-]{10,}/g, '[REDACTED]').slice(0, 500);
}

// Map a Gemini failure to a client-safe status and machine-readable code.
function classifyGeminiError(err) {
    const status = Number(err && (err.status || err.statusCode));
    const msg = String((err && err.message) || '');
    if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(msg)) {
        return { status: 429, code: 'AI_QUOTA_EXCEEDED', error: 'The AI service is busy or its usage limit was reached. Please try again later.' };
    }
    if (err && (err.code === 'ETIMEDOUT' || err.name === 'AbortError' || status === 408 || status === 504)) {
        return { status: 503, code: 'AI_UNAVAILABLE', error: 'The AI service timed out. Please try again.' };
    }
    if (status === 401 || status === 403 || /API key/i.test(msg)) {
        // Server-side misconfiguration, not the caller's fault.
        return { status: 503, code: 'AI_UNAVAILABLE', error: 'The AI service is temporarily unavailable. Please try again later.' };
    }
    if (status === 400 || /blocked|SAFETY/i.test(msg)) {
        return { status: 400, code: 'AI_INVALID_REQUEST', error: 'The AI service could not process this request.' };
    }
    if ((status >= 500 && status < 600) || /fetch failed|ECONNRESET|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|network/i.test(msg)) {
        return { status: 503, code: 'AI_UNAVAILABLE', error: 'The AI service is temporarily unavailable. Please try again later.' };
    }
    return { status: 500, code: 'AI_ERROR', error: 'Failed to process message' };
}

// POST /api/chat. The facts registry is injectable (tests); prompt and mock replies are rebuilt per request
// so a record that becomes stale while the server runs drops out without a restart.
function createRouter(facts = defaultRegistry) {
const router = express.Router();
router.post('/', async (req, res) => {
    const parsed = validateChatBody(req.body);
    if (parsed.error) {
        return sendError(res, 400, 'INVALID_REQUEST', parsed.error);
    }
    const { message, language, history } = parsed.value;

    let reply;
    let isMock = false;
    if (!isValidKey(process.env.GEMINI_API_KEY)) {
        if (!isDemoMode()) {
            console.error('Chat unavailable: GEMINI_API_KEY is missing or invalid and DEMO_MODE is not enabled');
            return sendError(res, 503, 'CHAT_NOT_CONFIGURED', 'The AI assistant is not available right now. Please try again later.');
        }
        isMock = true;
        reply = getMockResponse(message, language, buildMockResponses(facts.getPromptFacts()));
    } else {
        try {
            reply = await getGeminiResponse(message, language, history, buildSystemPrompt(facts.getPromptFacts()));
        } catch (aiError) {
            const c = classifyGeminiError(aiError);
            console.error(`Gemini API error [${c.code}] status=${aiError && aiError.status || 'n/a'}: ${redact(aiError && aiError.message)}`);
            return sendError(res, c.status, c.code, c.error);
        }
    }
    res.json({
        reply,
        language,
        timestamp: new Date().toISOString(),
        mock: isMock,
    });
});

return router;
}
module.exports = createRouter();
module.exports.createRouter = createRouter;
module.exports.isValidKey = isValidKey;
module.exports.isDemoMode = isDemoMode;
module.exports.redact = redact;
module.exports.buildSystemPrompt = buildSystemPrompt;
module.exports.buildMockResponses = buildMockResponses;
// Current prompt / mock replies for the default registry (getters: recomputed, so staleness is honoured).
Object.defineProperty(module.exports, 'SYSTEM_PROMPT', { enumerable: true, get: () => buildSystemPrompt() });
Object.defineProperty(module.exports, 'MOCK_RESPONSES', { enumerable: true, get: () => buildMockResponses() });