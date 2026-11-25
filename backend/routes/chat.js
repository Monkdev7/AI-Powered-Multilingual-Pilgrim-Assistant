const express = require('express');
const router = express.Router();

const LANGUAGE_NAMES = {
    en: 'English',
    hi: 'Hindi',
    bn: 'Bengali',
    ta: 'Tamil',
    te: 'Telugu',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
};

const SYSTEM_PROMPT = `You are a warm, helpful, and knowledgeable AI assistant for Simhastha Kumbh 2028 pilgrims.
Your name is "KumbhSaathi" (meaning "Kumbh Companion").

Your areas of expertise:
- Simhastha Kumbh 2028 event details (held in Ujjain, Madhya Pradesh, March 27 – May 27, 2028)
- Amrit Snan (sacred bathing) dates: Chaitra Purnima (Mar 27), Mesh Sankranti (Apr 13 — most important), Vaishakhi Amavasya (Apr 27), Vaisakh Purnima (May 12 / Buddha Purnima), Closing Snan (May 27)
- Why "Simhastha": occurs when Jupiter enters Leo (Simha Rashi) and Sun enters Aries (Mesh Rashi) — held every 12 years in Ujjain. Last was 2016.
- Ghats in Ujjain: Ram Ghat (principal bathing ghat on Kshipra river), Triveni Ghat, Mangalnath Ghat, Siddhavat Ghat, Narsinh Ghat
- Holy river: Kshipra (also called Shipra) — the sacred river of Ujjain
- Mahakaleshwar Temple: one of 12 Jyotirlingas of Lord Shiva; Bhasma Aarti at 4 AM daily — must visit; book passes at https://www.bhasmarti.com
- Other temples: Kal Bhairav, Harsiddhi Mata (Shakti Peeth), Mangalnath, Sandipani Ashram, Chintaman Ganesh, Bade Ganeshji Ka Mandir
- Accommodation: Tent cities near Ram Ghat, dharamshalas, IRCTC packages, akhara camps, Indore hotels (55 km)
- Transportation: Trains to Ujjain Junction, MP Roadways buses, Indore airport (55 km) + taxi transfer
- Religious rituals: Amrit Snan (holy dip in Kshipra), Simhastha Parikrama, Pind Daan at Siddhavat, Kshipra Aarti at Ram Ghat, Bhasma Aarti at Mahakaleshwar
- Health warnings: Ujjain in April-May is extremely hot (30-43°C) — hydration, sunscreen, ORS, avoid midday sun are critical
- Safety tips: Crowd management, heat safety, staying hydrated, keeping emergency numbers handy
- Emergency: Simhastha Control Room: 0734-2551234, Police: 100, Ambulance: 108, Tourist Helpline: 1800-180-5522
- Food: Government food camps, akhara langars (free), certified mela food courts

Personality:
- Greet with "Jai Mahakal!" or "Om Namah Shivaya!" when appropriate
- Be compassionate and respectful of the spiritual nature of the event
- Provide practical, actionable advice
- Keep responses concise but complete
- If you don't know something specific, acknowledge it and suggest contacting the Simhastha Authority

IMPORTANT: Always respond in the language specified. If asked to respond in Hindi, respond in Hindi script (Devanagari). If Tamil, use Tamil script. Always match the requested language.`;

const MOCK_RESPONSES = [
    "Jai Mahakal! 🙏 Welcome to Simhastha Kumbh 2028! The grand Simhastha Kumbh Mela is being held in Ujjain, Madhya Pradesh from March 27 to May 27, 2028 — 62 days on the banks of the sacred Kshipra river. The most auspicious Amrit Snan dates are: Chaitra Purnima (Mar 27), Mesh Sankranti (Apr 13), Vaishakhi Amavasya (Apr 27), Vaisakh Purnima (May 12), and Closing Snan (May 27). How can I assist you?",
    "Om Namah Shivaya! 🚂 To reach Ujjain, take a train to Ujjain Junction — it is the main station, just 2 km from Ram Ghat. Indian Railways will operate special Simhastha Kumbh trains from Delhi, Mumbai, Bhopal, Indore, and Ahmedabad. The nearest airport is Devi Ahilya Bai Holkar Airport in Indore (55 km), from where a taxi takes about 1-1.5 hours.",
    "🏕️ Accommodation options for Simhastha 2028: 1) Government tent cities near Ram Ghat, 2) Private tent cities (budget to luxury), 3) Dharamshalas & akhara camps (some free), 4) Hotels in Ujjain city — book 2-3 months early, 5) Hotels in Indore (55 km away) as an overflow option. Prices triple close to Amrit Snan dates, so book early!",
    "🆘 Emergency contacts for Simhastha 2028: Police: 100, Ambulance: 108, Simhastha Control Room: 0734-2551234, Tourist Helpline: 1800-180-5522, Women Helpline: 1090. 🌡️ Important: Ujjain in April-May is very hot (up to 43°C). Carry ORS, water, sunscreen and avoid going out between 11 AM-4 PM.",
    "🔱 Ram Ghat on the Kshipra river is the most sacred bathing spot for Simhastha 2028. Before or after your bath, visit the Mahakaleshwar Jyotirlinga — one of the 12 Jyotirlingas of Lord Shiva. The Bhasma Aarti at Mahakaleshwar at 4 AM is a once-in-a-lifetime spiritual experience. Book your Bhasma Aarti passes online well in advance!",
];

let mockIndex = 0;

const GEMINI_TIMEOUT_MS = () => parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 25000;

async function getGeminiResponse(message, language, history) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: SYSTEM_PROMPT,
    });
    // Build chat history for context (already validated and normalized)
    const formattedHistory = history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));
    const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7,
        },
    });
    const langName = LANGUAGE_NAMES[language];
    const prompt = `[Please respond in ${langName}]\n\n${message}`;
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const e = new Error('Gemini request timed out');
            e.code = 'ETIMEDOUT';
            reject(e);
        }, GEMINI_TIMEOUT_MS());
    });
    try {
        return await Promise.race([
            (async () => {
                const result = await chat.sendMessage(prompt);
                const response = await result.response;
                return response.text();
            })(),
            timeout,
        ]);
    } finally {
        clearTimeout(timer);
    }
}

function getMockResponse(message, language) {
    const response = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
    mockIndex++;

    const langPrefixes = {
        hi: '🙏 नमस्ते! (Mock mode - API key not configured)\n\n',
        bn: '🙏 নমস্কার! (Mock mode - API key not configured)\n\n',
        ta: '🙏 வணக்கம்! (Mock mode - API key not configured)\n\n',
        te: '🙏 నమస్కారం! (Mock mode - API key not configured)\n\n',
        mr: '🙏 नमस्कार! (Mock mode - API key not configured)\n\n',
        gu: '🙏 નમસ્તે! (Mock mode - API key not configured)\n\n',
        pa: '🙏 ਸਤ ਸ੍ਰੀ ਅਕਾਲ! (Mock mode - API key not configured)\n\n',
    };

    const prefix = langPrefixes[language] || '🙏 Hello! (Mock mode - add GEMINI_API_KEY to .env for real AI responses)\n\n';
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

// POST /api/chat
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
        reply = getMockResponse(message, language);
    } else {
        try {
            reply = await getGeminiResponse(message, language, history);
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

module.exports = router;
module.exports.isValidKey = isValidKey;
module.exports.isDemoMode = isDemoMode;
module.exports.redact = redact;