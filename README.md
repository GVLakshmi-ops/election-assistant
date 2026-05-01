# ElectionAssist — AI-Powered Civic Guide

> **Chosen Vertical:** Civic Engagement & Voter Education  
> **Google Service:** Google Gemini 2.0 Flash (via `@google/genai`)

An interactive, production-ready full-stack web application that helps citizens navigate the Indian election process. The core is a **context-aware conversational assistant** powered by Google Gemini AI, supported by an interactive election step guide and a searchable FAQ section.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React + Vite)            │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐ │
│  │  Timeline   │  │   FAQ    │  │    Chatbot     │ │
│  │ (stepper +  │  │(search + │  │ (multi-turn +  │ │
│  │  progress)  │  │  filter) │  │ context-aware) │ │
│  └──────┬──────┘  └────┬─────┘  └───────┬────────┘ │
│         │              │                │           │
└─────────┼──────────────┼────────────────┼───────────┘
          │   REST API   │                │
┌─────────▼──────────────▼────────────────▼───────────┐
│                Express.js Backend                    │
│                                                     │
│  GET /api/steps  ──►  Static election phases        │
│  GET /api/faq    ──►  Structured FAQ data           │
│  GET /api/health ──►  Health + AI status            │
│  POST /api/chat  ──►  Rate limited + sanitised      │
│        │                                            │
│        ▼                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │         Google Gemini 2.0 Flash             │   │
│  │  • Singleton client (initialised once)      │   │
│  │  • Context-aware system instruction         │   │
│  │  • Multi-turn conversation history          │   │
│  │  • First-time voter mode                    │   │
│  │  • Graceful fallback on error               │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Features

### Smart Dynamic Assistant
- Powered by **Google Gemini 2.0 Flash** with a purpose-built civic system instruction
- **Multi-turn memory**: full conversation history sent on each request
- **Logical context awareness**: auto-detects first-time voter intent from message content; personalises tone, depth, and suggestions accordingly
- **History trimming**: capped at 10 turns (20 entries) to manage token costs efficiently
- Graceful degradation to keyword fallback when Gemini is unavailable

### Election Guide (Timeline)
- 5-phase interactive stepper with progress bar
- Phase-specific deadlines, key requirements, and official ECI resource links
- Keyboard navigation (`←` `→` `Home` `End`) with full ARIA `tablist` semantics
- Retry button on error; `aria-current="step"` for screen readers

### FAQ
- **Full-text search** across questions and answers
- **Tag-based filtering** (registration, nota, ballot, id, etc.)
- Animated accordion with correct `aria-expanded` / `aria-controls` / `role="region"` pattern
- Live result count with `aria-live="polite"`

### Accessibility (WCAG 2.1 AA)
- Skip-navigation link in `index.html`
- All interactive elements have `aria-label`, focus rings, and keyboard support
- `role="log"` with `aria-live="polite"` on the chat message stream
- `<time datetime="...">` for message timestamps
- Decorative icons are `aria-hidden="true"`

---

## Google Services Used

| Service | Integration |
|---|---|
| **Google Gemini 2.0 Flash** | Powers the chatbot via `@google/genai`. Singleton client, multi-turn, context-aware system instruction |
| **ECI Voter Portal** | Deep-linked from Timeline steps and chatbot footer (`voters.eci.gov.in`, `electoralsearch.eci.gov.in`, `results.eci.gov.in`) |
| **cVIGIL / 1950 Helpline** | Referenced in FAQ and chatbot for official violation reporting |

---

## Security

| Control | Implementation |
|---|---|
| API key isolation | `GEMINI_API_KEY` read only on server; never sent to browser |
| Input sanitisation | `sanitise()`: trims, truncates to 500 chars, strips `<>` |
| Rate limiting | `express-rate-limit`: 30 requests/min/IP on `/api/chat` |
| Payload size cap | `express.json({ limit: "10kb" })` |
| Security header | `x-powered-by` disabled |
| External links | All use `rel="noopener noreferrer"` |

---

## Testing

**39 tests across 3 suites — all passing.**

```
src/__tests__/
├── server.test.ts      # 19 tests — REST endpoints, validation, XSS, edge cases
├── utils.test.ts       # 12 tests — sanitise(), trimHistory(), createMessageId()
└── faq.logic.test.ts   #  8 tests — FAQ filter (tag + search, AND logic, case-insensitive)
```

Run tests:
```bash
npm test              # single run
npm run test:watch    # watch mode
```

---

## Local Setup

```bash
# 1. Clone your repo
git clone <repository-url>
cd election-assistant

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env → set GEMINI_API_KEY=your_key_here

# 4. Start development server
npm run dev
# App available at http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key. Without it, the chatbot uses keyword fallback. |
| `PORT` | Optional | Server port (default: 3000) |
| `NODE_ENV` | Optional | Set to `production` to serve built static files |

---

## Project Structure

```
election-assistant/
├── server.ts                    # Express backend — Gemini, rate limiting, sanitisation
├── src/
│   ├── App.tsx                  # Root layout, tab routing, sticky sidebar
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Global styles (Tailwind v4)
│   ├── components/
│   │   ├── Chatbot.tsx          # Gemini multi-turn chatbot with context awareness
│   │   ├── Timeline.tsx         # Interactive election phase stepper
│   │   ├── FAQ.tsx              # Searchable, filterable accordion
│   │   ├── Navbar.tsx           # Accessible navigation with ARIA tablist
│   │   └── Footer.tsx           # Disclaimer + links
│   └── __tests__/
│       ├── server.test.ts       # API endpoint tests
│       ├── utils.test.ts        # Pure function tests
│       └── faq.logic.test.ts    # FAQ filtering logic tests
├── index.html                   # Entry point with skip-nav link
├── vite.config.ts               # Vite + Tailwind config
├── vitest.config.ts             # Test runner config
├── tsconfig.json                # TypeScript strict mode
├── package.json
└── .env.example
```

---

## Deployment (Google Cloud Run)

```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/election-assist

# Deploy with secret
gcloud run deploy election-assist \
  --image gcr.io/YOUR_PROJECT_ID/election-assist \
  --platform managed \
  --region asia-south1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets GEMINI_API_KEY=gemini-key:latest \
  --allow-unauthenticated
```

---

## Assumptions

- The election process is modelled on the **Election Commission of India (ECI)** framework, applicable to general and state elections.
- Gemini AI neutrality is enforced via system instruction; the app does not attempt post-processing filtering.
- The `GEMINI_API_KEY` is always server-side only; the `vite.config.ts` `define` block for `process.env.GEMINI_API_KEY` is retained for compatibility but is not used by any frontend component.
- Conversation history is trimmed client-side before sending to avoid unbounded payload growth.

---

## License

Apache-2.0
