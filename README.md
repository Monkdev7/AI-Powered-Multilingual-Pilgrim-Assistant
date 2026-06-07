# 🔱 Simhastha Pilgrim Assistant

> An AI-powered multilingual assistant for Simhastha Kumbh 2028 pilgrims — built for the hackathon.

**Live Event:** Simhastha Kumbh 2028 · Ujjain, Madhya Pradesh · March 27 – May 27, 2028

---

## ✨ Features

- 🤖 **AI Chat Assistant** — Powered by Google Gemini 1.5 Flash. Ask anything about Simhastha Kumbh in your language.
- 🌐 **8 Languages** — English, हिंदी, বাংলা, தமிழ், తెలుగు, मराठी, ગુજરાતી, ਪੰਜਾਬੀ
- 🆘 **Emergency Panel** — One-tap call buttons for Police (100), Ambulance (108), Simhastha Control Room, and more.
- ❓ **FAQ Section** — 28+ searchable, categorized FAQs covering travel, accommodation, rituals, and safety.
- 🗺️ **Navigation Guide** — Key ghats in Ujjain, Amrit Snan bathing dates, transport options, and navigation tips.
- 🏘️ **Local Services** — Food camps, drinking water, sanitation, ATMs, phone charging, and accommodation info.
- 📱 **Mobile-first** — Responsive design with bottom navigation on mobile.
- 🔌 **Works offline** — Mock responses work without an API key, so the frontend always functions.

---

## 🛠️ Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS          |
| Backend  | Node.js + Express                       |
| AI       | Google Gemini 1.5 Flash (free tier)     |
| Icons    | Lucide React                            |
| Fonts    | Inter (Google Fonts)                    |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Google Gemini API key (free — see below)

### 1. Set up the Backend

```bash
cd backend
npm install
# Edit .env and add your GEMINI_API_KEY
```

### 2. Set up the Frontend

```bash
cd frontend
npm install
```

### 3. Start both servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Getting a Gemini API Key (Free)

1. Visit [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API Key"**
4. Paste it in `backend/.env`:

```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

---

## 📁 Project Structure

```
mahakumbh-pilgrim-assistant/
├── backend/
│   ├── server.js
│   ├── .env
│   └── routes/
│       ├── chat.js         # Gemini AI chat — Simhastha context
│       ├── emergency.js    # Emergency contacts API
│       ├── faq.js          # FAQ search API
│       └── services.js     # Local services API
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── ChatInterface.jsx
        │   ├── EmergencyPanel.jsx
        │   ├── FAQSection.jsx
        │   ├── Header.jsx
        │   ├── LanguageSelector.jsx
        │   ├── LocalServices.jsx
        │   └── NavigationGuide.jsx
        └── data/
            ├── faqs.js              # Simhastha 2028 FAQs
            ├── emergencyContacts.js # Ujjain emergency contacts
            └── navigationData.js   # Ujjain ghats, Amrit Snan dates
```

---

## 🗓️ Amrit Snan Dates 2028 (Simhastha, Ujjain)

| Date | Occasion | Significance |
|------|----------|-------------|
| March 27 | Chaitra Purnima | Opening bath |
| April 13 | Mesh Sankranti | Most important — Sun enters Aries |
| April 27 | Vaishakhi Amavasya | New moon — silence observed |
| May 12 | Vaisakh Purnima / Buddha Purnima | Full moon bath |
| May 27 | Closing Snan | Final grand bath — 62-day event ends |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message, get AI response |
| GET | `/api/emergency` | Get emergency contacts |
| GET | `/api/faq` | Get FAQs (with search/filter) |
| GET | `/api/services` | Get local services info |
| GET | `/api/health` | Health check |

---

*🔱 Jai Mahakal! May Simhastha Kumbh 2028 be a blessed experience for all pilgrims.*
