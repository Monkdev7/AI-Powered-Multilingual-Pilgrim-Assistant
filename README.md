# 🔱 Simhastha Pilgrim Assistant 2028

> An AI-powered multilingual assistant for Simhastha Kumbh 2028 pilgrims — built for the **AI-Powered Product Build Hackathon**.

**Live Event:** Simhastha Kumbh 2028 · Ujjain, Madhya Pradesh · March 27 – May 27, 2028

---

## 📸 What It Does

Pilgrims visiting Simhastha Kumbh 2028 in Ujjain come from diverse linguistic and cultural backgrounds. This app helps them with:

- Getting answers about the event in their **own language** via AI chat
- Finding **ghats, bathing dates, and transport** to Ujjain
- Accessing **emergency contacts** with one-tap calling
- Locating **food, water, sanitation, and ATMs** on the mela grounds
- **Booking Bhasma Aarti** at Mahakaleshwar Jyotirlinga
- Staying safe in Ujjain's intense **April–May heat** (40–43°C)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🤖 **AI Chat Assistant** | Powered by Google Gemini 2.5 Flash Lite. Multilingual, context-aware, Simhastha-specific knowledge |
| 🌐 **8 Languages** | English, हिंदी, বাংলা, தமிழ், తెలుగు, मराठी, ગુજરાતી, ਪੰਜਾਬੀ — UI labels + AI responses |
| ⏳ **Live Countdown Timer** | Real-time countdown to the planned start (27 March 2028, proposed) with a link to the official Shri Mahakaleshwar Temple Bhasma Aarti portal |
| 🆘 **Emergency Panel** | 112 national emergency number shown first, official secondary numbers with sources · WhatsApp share · Heat emergency warnings |
| ❓ **FAQ Section** | 28 questions · Search + category filter · WhatsApp share on answers |
| 🗺️ **Navigation Guide** | Ujjain ghats · Planned snan schedule (proposed) · Transport options · Embedded map |
| 📍 **Ujjain Map** | Google Maps embed of Ram Ghat + key locations with direct Maps links |
| 🏘️ **Local Services** | Food camps, water kiosks, toilets, ATMs, phone charging, accommodation |
| 💾 **Chat Persistence** | Conversation history saved to localStorage — restored on next visit |
| 📲 **PWA Ready** | Installable on mobile devices via manifest.json |
| 📝 **Markdown Rendering** | AI responses render bold, bullets, headers properly in the chat UI |
| 🔌 **Mock Fallback** | Works without an API key — mock responses for demo/offline use |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| AI Model | Google Gemini 2.5 Flash Lite (free tier) |
| Icons | Lucide React |
| Font | Inter (Google Fonts) |
| Deployment | Vite build → any static host · Express on Node |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A free Google Gemini API key (see below)

### 1. Clone the repo

```bash
git clone https://github.com/Monkdev7/AI-Powered-Multilingual-Pilgrim-Assistant.git
cd AI-Powered-Multilingual-Pilgrim-Assistant
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
GEMINI_API_KEY=AIzaSy...your_key_here
PORT=5000
```

### 3. Set up the Frontend

```bash
cd frontend
npm install
```

### 4. Run both servers

**Terminal 1 — Backend (port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## ⚙️ Configuration

Backend (`backend/.env`, see `backend/.env.example` for every variable):

| Variable | Purpose | Default |
|---|---|---|
| `GEMINI_API_KEY` | Gemini key. Without it `/api/chat` returns 503 `CHAT_NOT_CONFIGURED` | none |
| `NODE_ENV` | `production` disables default CORS origins and ignores `DEMO_MODE` | unset |
| `CORS_ORIGINS` | Comma-separated allowed browser origins | localhost:5173 and 127.0.0.1:5173 (none in production) |
| `TRUST_PROXY` | Proxy hops to trust (e.g. `1` on Render/Railway); keep unset locally | off |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | Chat requests per IP per window | 20 per 60000 ms |
| `BODY_LIMIT`, `CHAT_MAX_MESSAGE_LENGTH`, `CHAT_MAX_HISTORY`, `CHAT_MAX_HISTORY_CONTENT_LENGTH`, `GEMINI_TIMEOUT_MS` | Request and timeout limits | 128kb, 1000, 20, 4000, 25000 |
| `DEMO_MODE` | `true` serves canned demo answers when no key is set (never in production) | false |

Frontend (`frontend/.env`): `VITE_API_URL` is the backend base URL, for example `https://api.example.com`. Leave it empty in development so the Vite proxy is used. Chat errors return `{ error, code }` with codes `INVALID_REQUEST`, `INVALID_JSON`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `AI_QUOTA_EXCEEDED`, `AI_UNAVAILABLE`, `AI_INVALID_REQUEST`, `AI_ERROR`, `CHAT_NOT_CONFIGURED`. Run backend tests with `cd backend && npm test`.
## 🔑 Getting a Free Gemini API Key

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Sign in with your Google account
3. Click **"Create API key"** → **"Create API key in new project"**
4. Copy the key — it starts with **`AIzaSy...`**
5. Paste it in `backend/.env`

> **Note:** The app runs in demo mode without a key — pre-written Simhastha responses are returned so you can still demo all features.

---

## 📁 Project Structure

```
mahakumbh-pilgrim-assistant/
├── backend/
│   ├── server.js                 # Express server, CORS, routes
│   ├── .env.example              # Environment variable template
│   ├── package.json
│   └── routes/
│       ├── chat.js               # Gemini AI chat with Simhastha system prompt
│       ├── emergency.js          # Emergency contacts API
│       ├── faq.js                # FAQ search & filter API
│       └── services.js           # Local services API
└── frontend/
    ├── index.html                # PWA meta, title, manifest link
    ├── public/
    │   └── manifest.json         # PWA manifest for installability
    ├── vite.config.js            # Dev proxy → backend:5000
    └── src/
        ├── App.jsx               # Tab navigation, multilingual labels
        ├── main.jsx
        ├── index.css             # Tailwind + custom animations
        ├── components/
        │   ├── ChatInterface.jsx      # AI chat, markdown renderer, localStorage
        │   ├── CountdownTimer.jsx     # Live countdown + Bhasma Aarti booking
        │   ├── EmergencyPanel.jsx     # Contacts, heat warning, WhatsApp share
        │   ├── FAQSection.jsx         # Searchable FAQ with WhatsApp share
        │   ├── Header.jsx             # App header with language selector
        │   ├── LanguageSelector.jsx   # 8-language dropdown
        │   ├── LocalServices.jsx      # Food, water, toilets, ATMs
        │   └── NavigationGuide.jsx    # Ghats, dates, transport, map
        └── data/
            ├── faqs.js                # 28 Simhastha 2028 FAQs
            ├── emergencyContacts.js   # Ujjain emergency contacts
            ├── navigationData.js      # Ghats, Amrit Snan dates, transport
            └── uiLabels.js            # UI translations for 8 languages
```

---

## 🗓️ Amrit Snan Dates — Simhastha Kumbh 2028, Ujjain

The planned event period is 27 March to 27 May 2028, with 3 Shahi Snan and 7 Parv Snan during 9 April to 8 May. These are **proposed** and awaiting official confirmation (source: Madhya Pradesh MPINFO publication dated 11-17 March 2024). Individual bathing dates have not been officially confirmed, so none are listed here. Attendance estimates have varied and there is no official figure.

> ⚠ Arrive at ghats early on major bathing days and expect very large crowds.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message, get Gemini AI response |
| `GET` | `/api/faq?search=&category=` | Get FAQs with search and category filter |
| `GET` | `/api/emergency` | Get emergency contacts and info cards |
| `GET` | `/api/services` | Get local services (food, water, ATMs etc.) |
| `GET` | `/api/health` | Health check — confirms API key status |

### Chat API Example

```json
POST /api/chat
{
  "message": "What are the Amrit Snan dates?",
  "language": "hi",
  "history": []
}
```

```json
{
  "reply": "ॐ नमः शिवाय! अमृत स्नान की तिथियाँ...",
  "language": "hi",
  "timestamp": "2028-03-27T04:00:00.000Z",
  "mock": false
}
```

---

## 🌡️ Important: Heat Safety for Simhastha 2028

Ujjain in April–May regularly hits **40–43°C**. The app includes dedicated heat safety guidance:
- ORS distribution points at all sector entry gates (free)
- Heatstroke treatment centres at every major medical camp
- Hydration reminders and sun-avoidance tips (avoid 11 AM – 4 PM)
- Sunscreen and umbrella advisories

---

## Emergency numbers and facts

The app shows **112** (national emergency number, source: [MHA ERSS](https://www.mha.gov.in/emergency-response-support-system-erss)) first, then secondary numbers listed by official sources (100 Police, 101 Fire, 102 Ambulance, 1091 Women in Distress, 1098 Child Helpline, 1363 Tourist Helpline). The number 108 is hidden until a second authoritative source confirms it. They have not been independently call-tested and are not special Simhastha helplines. Prices, timings, distances and facility details in Services and FAQ are inherited and not officially confirmed. All facts live in `backend/data/facts.json` (schema: `backend/data/facts.schema.md`). A record whose `reviewBy` date has passed is hidden from the API, the chat prompt and mock replies (the server still starts and logs a warning); `GET /api/health` reports `factsReviewOverdue` and a count.

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| Bhasma Aarti (official portal) | [shrimahakaleshwar.mp.gov.in](https://www.shrimahakaleshwar.mp.gov.in/services/bhasmaarti) |
| Gemini API Key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| GitHub Repo | [github.com/Monkdev7/AI-Powered-Multilingual-Pilgrim-Assistant](https://github.com/Monkdev7/AI-Powered-Multilingual-Pilgrim-Assistant) |

---

## 🤝 Built With AI Assistance

This project was built using **Kiro** (AI-assisted development) as part of the AI-Powered Product Build Hackathon. AI tools were used throughout — from scaffolding the project structure, writing components, updating multilingual content, debugging API integration, and iterating on features.

---

*🔱 Jai Mahakal! May Simhastha Kumbh 2028 be a blessed experience for all pilgrims.*
