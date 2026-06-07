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
| ⏳ **Live Countdown Timer** | Real-time countdown to March 27, 2028 with Bhasma Aarti booking link |
| 🆘 **Emergency Panel** | One-tap call buttons · WhatsApp share · Heat emergency warnings |
| ❓ **FAQ Section** | 28 questions · Search + category filter · WhatsApp share on answers |
| 🗺️ **Navigation Guide** | 6 Ujjain ghats · 5 Amrit Snan dates · Transport options · Embedded map |
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

| Date | Occasion | Significance |
|------|----------|-------------|
| **March 27** | Chaitra Purnima | Opening bath — event begins |
| **April 13** | Mesh Sankranti | **Most sacred** — Sun enters Aries; primary Amrit Snan |
| **April 27** | Vaishakhi Amavasya | New moon — silence (maun) observed |
| **May 12** | Vaisakh Purnima / Buddha Purnima | Full moon bath |
| **May 27** | Closing Snan | Final bath — 62-day event concludes |

> ⚠️ Arrive at ghats by 4–5 AM on Amrit Snan days. Expect tens of millions of pilgrims.

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

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| Bhasma Aarti Booking | [bhasmarti.com](https://www.bhasmarti.com) |
| Gemini API Key | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| GitHub Repo | [github.com/Monkdev7/AI-Powered-Multilingual-Pilgrim-Assistant](https://github.com/Monkdev7/AI-Powered-Multilingual-Pilgrim-Assistant) |

---

## 🤝 Built With AI Assistance

This project was built using **Kiro** (AI-assisted development) as part of the AI-Powered Product Build Hackathon. AI tools were used throughout — from scaffolding the project structure, writing components, updating multilingual content, debugging API integration, and iterating on features.

---

*🔱 Jai Mahakal! May Simhastha Kumbh 2028 be a blessed experience for all pilgrims.*
