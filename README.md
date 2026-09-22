# ResearchMatch v2

> **Verified Academic Professor Discovery, Personalized Cold Emails & Vibe-Coding Hackathon Matching**

ResearchMatch v2 helps students find research internship advisors at Indian premier institutes (IITs, IIITs, NITs, IISc) with a strict anti-hallucination verification pipeline. Every professor is cross-checked through a secondary web search before being surfaced, and cold-email drafts cite real publications from the verified profile.

It also includes a **Hackathon Match Finder** that surfaces online, vibe-coding-friendly hackathons matched to your skills.

---

## What's new in v2

- **Secondary verification search**: After an initial professor candidate is discovered, the system runs an independent search for that exact name + institute, fetches fresh sources, and cross-validates identity, department, and research domain. Low-confidence or mismatched candidates are rejected.
- **Real publication citations**: Verified profiles include up to 3 recent publications; the email composer cites only titles that genuinely connect with your background.
- **Fully personalized cold emails**: No static templates. Emails are generated from your projects, the professor's verified interests, and selected publications.
- **Layered backend architecture**: Routes → Services → Utilities. External SDK calls (Gemini) are isolated and mockable.
- **Distinctive UI**: A fresh indigo/slate/amber visual identity with improved hierarchy and accessibility.
- **Hackathon match finder** (new module): Discover online hackathons that allow vibe-coding / AI-assisted development, ranked by relevance to your profile.

---

## Architecture

```text
researchmatch-v2/
├── server/
│   ├── index.ts                    # Express entry point + error middleware
│   ├── routes/
│   │   ├── profile.ts              # Resume parsing endpoint
│   │   ├── professors.ts           # Discovery, verification & matching endpoint
│   │   ├── email.ts                # Personalized cold email endpoint
│   │   └── hackathons.ts           # Hackathon finder endpoint
│   ├── services/
│   │   ├── gemini.ts               # Gemini client wrapper
│   │   ├── search.ts               # DuckDuckGo search + page scraping
│   │   ├── profileParser.ts        # Resume → StudentProfile
│   │   ├── professorDiscovery.ts   # Primary web discovery
│   │   ├── professorVerification.ts# Secondary verification + publication extraction
│   │   ├── matcher.ts              # AI ranking + fallback keyword matcher
│   │   ├── emailComposer.ts        # Personalized email generation
│   │   └── hackathonFinder.ts      # Online vibe-coding hackathon discovery
│   ├── utils/
│   │   ├── config.ts               # Env-driven configuration
│   │   └── errors.ts               # Centralized error shapes
│   └── data/
│       └── seed-professors.ts      # Curated fallback faculty directory
├── shared/
│   ├── types.ts                    # Shared TypeScript contracts
│   └── utils/
│       └── instituteMatcher.ts     # Isomorphic institute normalization
├── src/                            # React frontend
│   ├── App.tsx
│   ├── components/
│   │   ├── ResumeUploader.tsx
│   │   ├── ProfileViewer.tsx
│   │   ├── TargetInstitutesStep.tsx
│   │   ├── SearchProgress.tsx
│   │   ├── ProfessorCard.tsx
│   │   ├── EmailComposer.tsx
│   │   ├── HackathonFinder.tsx
│   │   └── HackathonCard.tsx
│   └── ...
├── package.json
├── vite.config.ts
└── .env.example
```

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite, Motion, Lucide React
- **Backend**: Express 4, TypeScript, tsx, esbuild
- **AI**: Swappable LLM provider — Gemini (Google Gen AI SDK) or Groq (OpenAI-compatible, higher free-tier limits)
- **Search & scrape**: DuckDuckGo HTML search + Cheerio

---

## Getting Started

### Prerequisites

- Node.js v18+ (v20+ recommended)
- npm v9+
- API key from **Groq** (recommended, higher free-tier limits) at [console.groq.com](https://console.groq.com/) and/or **Gemini** at [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone or open the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your preferred provider:

   **Groq (recommended):**
   ```env
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_groq_key
   GEMINI_API_KEY=your_gemini_key  # only needed if you want PDF upload support
   ```

   **Gemini only:**
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_key
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

---

## Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | `gemini` or `groq`. |
| `GROQ_API_KEY` | — | Required when `LLM_PROVIDER=groq`. Free tier at console.groq.com. |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Model ID for Groq. Use a model available on your key that supports `response_format`. |
| `GEMINI_API_KEY` | — | Required when `LLM_PROVIDER=gemini`; also required for PDF parsing with Groq. |
| `APP_URL` | `http://localhost:3000` | Hosted app URL. |
| `PORT` | `3000` | Server port. |
| `SEARCH_TIMEOUT_MS` | `5000` | DuckDuckGo search timeout. |
| `SCRAPE_TIMEOUT_MS` | `4000` | Page fetch timeout. |
| `MAX_SEARCH_URLS` | `8` | URLs to evaluate per search query. |
| `MAX_RESULTS` | `24` | Max professor results returned. |

---

## License

MIT
