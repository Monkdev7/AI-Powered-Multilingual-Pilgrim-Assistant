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
- Mahakaleshwar Temple: one of 12 Jyotirlingas of Lord Shiva; Bhasma Aarti at 4 AM daily — must visit
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

async function getGeminiResponse(message, language, history) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: SYSTEM_PROMPT,
    });

    // Build chat history for context
    const formattedHistory = (history || []).map((msg) => ({
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

    const langName = LANGUAGE_NAMES[language] || 'English';
    const prompt = `[Please respond in ${langName}]\n\n${message}`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
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

// POST /api/chat
router.post('/', async (req, res) => {
    try {
        const { message, language = 'en', history = [] } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        let reply;
        let isMock = false;

        if (!isValidKey(process.env.GEMINI_API_KEY)) {
            // No valid key — pure mock mode, no API call attempted
            isMock = true;
            reply = getMockResponse(message, language);
        } else {
            try {
                reply = await getGeminiResponse(message.trim(), language, history);
            } catch (aiError) {
                console.error('Gemini API error:', aiError.message);
                isMock = true;
                reply = `⚠️ AI service temporarily unavailable.\n\n${getMockResponse(message, language)}`;
            }
        }

        res.json({
            reply,
            language,
            timestamp: new Date().toISOString(),
            mock: isMock,
        });
    } catch (err) {
        console.error('Chat route error:', err);
        res.status(500).json({ error: 'Failed to process message', details: err.message });
    }
});

module.exports = router;
