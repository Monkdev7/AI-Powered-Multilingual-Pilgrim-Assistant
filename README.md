# Simhastha Pilgrim Assistant 2028

A multilingual, installable web app for pilgrims planning to attend Simhastha Kumbh 2028 in Ujjain, Madhya Pradesh. It combines an AI chat assistant with FAQs, emergency contacts, a navigation guide and local-service information, and keeps the emergency action available offline.

The planned event period is **27 March to 27 May 2028**. This period is proposed and awaiting official confirmation. The five individual bathing dates have not been officially confirmed, so the app does not list them.

## Features

- **AI chat** (Google Gemini `gemini-2.5-flash-lite`) that answers in the selected language. Conversation history is kept in the browser's `localStorage`.
- **Eight languages**: English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati and Punjabi (`en hi bn ta te mr gu pa`).
- **FAQ** with search and category filters, **Local services**, and **Emergency** contacts with one-tap `tel:` links and source attribution.
- **Navigation guide**: ghats, proposed event period, transport options and an embedded map.
- **Countdown** to the proposed start date and a link to the official Bhasma Aarti portal.
- **PWA**: installable, with an offline app shell (see [Offline behaviour](#offline-behaviour)).

## Languages and translation status

The interface strings in all non-English languages are **AI-drafted, marked as needing review, and have not received native-speaker review**. The app shows a notice to that effect when a non-English language is selected.

FAQ, emergency and services content is localized by the backend through the `?lang=` query parameter and falls back to English. Some safety and medical answers intentionally stay in English until they have been reviewed by people qualified to do so.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Lucide icons, self-hosted Noto Sans (Indic scripts), Inter via Google Fonts |
| Service worker | Hand-written (`frontend/pwa/sw.template.js`), emitted at build time by a small Vite plugin (`frontend/pwa/swPlugin.js`) |
| Backend | Node.js >= 20, Express 4, Helmet, express-rate-limit, `@google/generative-ai` |
| Tests | `node:test` in both packages |

## Quick start

Requires Node.js 20 or newer and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/Monkdev7/AI-Powered-Multilingual-Pilgrim-Assistant.git
cd AI-Powered-Multilingual-Pilgrim-Assistant
```

Use two terminals.

```bash
# Terminal 1: backend on http://localhost:5000
cd backend
npm install
cp .env.example .env      # then set GEMINI_API_KEY
npm start                 # or: npm run dev (nodemon)
```

```bash
# Terminal 2: frontend on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on port 5000, so leave `VITE_API_URL` empty in development. Without a valid key, `/api/chat` returns `503 CHAT_NOT_CONFIGURED`, unless you set `DEMO_MODE=true` for canned demo answers (ignored when `NODE_ENV=production`).

### Production preview

```bash
cd frontend
VITE_API_URL=http://localhost:5000 npm run build     # PowerShell: $env:VITE_API_URL='http://localhost:5000'; npm run build
npm run preview                                       # http://localhost:4173
```

The backend only accepts browser origins listed in `CORS_ORIGINS`, so include the preview origin, for example `CORS_ORIGINS=http://localhost:4173`. The service worker is only registered in production builds.

## Configuration

Backend (`backend/.env`; `backend/.env.example` lists every variable):

| Variable | Purpose | Default |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API key. Never commit it. | none |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | `production` removes the default CORS origins and ignores `DEMO_MODE` | unset |
| `CORS_ORIGINS` | Comma-separated allowed browser origins | `http://localhost:5173`, `http://127.0.0.1:5173` (none in production) |
| `TRUST_PROXY` | Proxy hops to trust for client IPs (for example `1` on a proxying host) | off |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | Chat requests per client IP per window | `20` per `60000` ms |
| `BODY_LIMIT` | Maximum request body size | `128kb` |
| `CHAT_MAX_MESSAGE_LENGTH`, `CHAT_MAX_HISTORY`, `CHAT_MAX_HISTORY_CONTENT_LENGTH` | Chat request limits | `1000`, `20`, `4000` |
| `GEMINI_TIMEOUT_MS` | Gemini request timeout | `25000` |
| `DEMO_MODE` | `true` serves canned answers when no valid key is set | `false` |

Frontend (`frontend/.env`, read at **build time**):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL without a trailing slash, for example `https://api.example.com`. Leave empty to use relative `/api` paths (Vite proxy or same-origin hosting). |

## Testing

```bash
cd backend && npm test
cd frontend && npm test
```

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Chat reply from Gemini (`{ message, language, history }`) |
| `GET` | `/api/faq?lang=&search=&category=` | FAQs with search and category filter |
| `GET` | `/api/emergency?lang=` | Emergency contacts and info cards |
| `GET` | `/api/services?lang=` | Local services |
| `GET` | `/api/health` | Health check |

Errors return `{ error, code }`.

## Offline behaviour

- The service worker caches the app shell (HTML, built assets, icons, manifest) so the app opens without a connection.
- No `/api` responses are cached. Offline, FAQ, Services and Emergency show an offline message instead of stale lists.
- Offline, the Emergency tab and the banner show only the **112** call action (`tel:112`). Chat shows an offline note and sends no request.
- When the connection returns, the data is fetched again.

## Safety and data verification

Emergency numbers and other facts live in `backend/data/facts.json`, with official sources, status, review dates and hidden or retired records (schema: `backend/data/facts.schema.md`). A record whose `reviewBy` date has passed is hidden from the API, the chat prompt and mock replies, and `GET /api/health` reports an overdue count.

The app shows **112** first, and then 100, 101, 102, 1091, 1098 and 1363, with source attribution. These numbers are **as listed by the cited official sources and have not been independently call-tested**. They are not special Simhastha helplines. Prices, timings, distances and facility details in Services, FAQ and the Navigation Guide are inherited and not officially confirmed; the app labels them as unverified.

## Deployment

Nothing in this repository is deployed by default.

- **Frontend**: build with `VITE_API_URL` set to the public backend URL and serve `frontend/dist` at the site root of a static host. `frontend/public/_headers` (Cloudflare Pages style) sets caching: `sw.js`, `index.html` and `manifest.json` must not be cached long, while hashed assets and fonts are immutable. The service worker requires HTTPS.
- **Backend**: run `npm start` on a Node.js 20+ host with `NODE_ENV=production`, `GEMINI_API_KEY`, `CORS_ORIGINS=<frontend origin>` and, behind a proxying host, `TRUST_PROXY=1`. Use `/api/health` as the health check.

## Structure

```
backend/    Express API (app.js, server.js, routes/), data/facts.json, i18n/<lang>/ content, test/
frontend/   React app (src/), pwa/ (service worker template and Vite plugin), public/, test/
```

## Links

- [Bhasma Aarti (official portal)](https://www.shrimahakaleshwar.mp.gov.in/services/bhasmaarti)
- [MHA Emergency Response Support System](https://www.mha.gov.in/emergency-response-support-system-erss)
