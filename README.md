# ResearchMatch Lite

> **AI-Powered Academic Research Professor Discovery & Tailored Cold Email Generator**

ResearchMatch Lite bridges the gap between ambitious students seeking research internships and leading faculty members across India's premier technical institutes (**IITs, IIITs, NITs, and IISc**). 

By analyzing your resume, skills, and project portfolio, ResearchMatch Lite identifies professors whose active research agendas closely align with your background, and automatically crafts individualized, high-converting cold email drafts.

---

## 🌟 Key Features

### 1. 📄 Intelligent Resume Profiling
- **Skill & Domain Extraction**: Ingests your resume to identify technical competencies, past internships, academic projects, and primary research domains (NLP, Computer Vision, Speech Processing, Biomedical AI, Systems, etc.).
- **Instant Preload Option**: Includes a realistic reference student profile to test and explore the recommendation engine immediately.

### 2. 🏛️ Strict Target Institute Filtering
- **Tier-Categorized Selection**: Target faculty across **Top Old IITs** (Bombay, Delhi, Madras, Kanpur, Kharagpur, Roorkee, Guwahati), **Newer IITs** (Ropar, Hyderabad, Gandhinagar, Indore, Bhilai, Palakkad, Tirupati, Mandi, Patna), **Top IIITs** (Hyderabad, Bangalore, Delhi, Allahabad, Sri City, Gwalior), and **Top NITs** (Trichy, Surathkal, Calicut, Warangal, Rourkela, SVNIT Surat).
- **Exact Boundary Isolation**: Employs normalized boundary matching to eliminate false-positive collisions (strictly distinguishing IIT vs. IIIT, and SVNIT Surat vs. NIT Surathkal).
- **Interactive Multi-View Tabs**: Switch seamlessly between all selected institutions or drill down into per-institute recommendations with live match counts.

### 3. 🔍 Dual-Engine Faculty Discovery & Ranking
- **Comprehensive Seed Faculty Database**: Pre-indexed profiles of professors with lab affiliations, designations, official websites, and research keywords.
- **Dynamic Web Directory Aggregator**: Queries live faculty portals to surface active lab heads and newly recruited tenure-track faculty.
- **Gemini-Powered Semantic Scoring**: Leverages Google Gemini AI to analyze overlap between candidate research publications and student technical experience, scoring each match with explicit rationale.

### 4. ✉️ Professor-Specific Tailored Cold Email Generator
- **Personalized Professor Intro**: Addresses each professor by title, department, institution, and their exact research focus.
- **Proven Model Mail Body**: Seamlessly incorporates core student highlights:
  - Summer research internship at **IIT Ropar** with **annam.ai** (*"Krishi Darshan"* speech-to-text pipeline processing 74 Hindi agricultural videos).
  - **FLN Assessment & Personalized Worksheet Platform** for Classes 2–4.
  - Research poster presentation on **Multispectral Wound Diagnostics** at *Innovación 2026* (IEM Kolkata).
- **Dynamic Alignment Connector**: Adapts Paragraph 2 based on the professor's exact domain:
  - *NLP & Speech*: Connects Indic speech datasets, ASR automation, and model formatting.
  - *Biomedical AI & Health*: Highlights spectral tissue diagnostics and clinical imaging data.
  - *Computer Vision*: Highlights multi-modal pipelines and large-scale video processing.
  - *IIT Ropar Faculty*: Leverages on-campus familiarity with IIT Ropar computing clusters and lab ecosystem.
  - *Distributed Systems & Cloud*: Emphasizes pipeline throughput, data ingestion, and scalable workflows.
- **One-Click Actions**: Copy subject line, copy full body, or open directly in your desktop/web mail client with prefilled `mailto:` headers.

### 5. 📊 Export & Workflow Management
- Export matched faculty lists with research keywords, match scores, and contact emails to **CSV**.
- Filter results dynamically by minimum match score, institute tier, and target university.

---

## 🛠️ Architecture & Tech Stack

```text
researchmatch-lite/
├── src/
│   ├── components/
│   │   ├── ProfessorCard.tsx        # Faculty card with match rationale & email generator modal
│   │   ├── ProfileViewer.tsx        # Student resume profile overview and editable fields
│   │   ├── ResumeUploader.tsx       # Resume text/file ingest and parsing trigger
│   │   ├── SearchProgress.tsx       # Live status indicators during discovery & ranking
│   │   └── TargetInstitutesStep.tsx # Interactive multi-select institute selection grid
│   ├── data/
│   │   └── seed-professors.ts       # Curated faculty directory across premier institutes
│   ├── utils/
│   │   ├── coldEmailGenerator.ts    # Faculty-tailored cold email synthesis logic
│   │   └── instituteMatcher.ts      # Type-aware institution string matching & normalization
│   ├── App.tsx                      # Main single-page application workflow & filters
│   ├── main.tsx                     # React root entry point
│   ├── types.ts                     # TypeScript data contracts & schemas
│   └── index.css                    # Tailwind CSS v4 entry point
├── server.ts                        # Express backend proxy for Gemini AI & web directory discovery
├── metadata.json                    # Application metadata and runtime permissions
├── vite.config.ts                   # Vite build configuration
└── package.json                     # Scripts & dependencies
```

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend**: [Express 4](https://expressjs.com/), [Cheerio](https://cheerio.js.org/), [tsx](https://github.com/privatenumber/tsx), [esbuild](https://esbuild.github.io/)
- **AI Intelligence**: [Google Gen AI SDK (`@google/genai`)](https://github.com/google/generative-ai-js) powered by Gemini models

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/your-username/researchmatch-lite.git
   cd researchmatch-lite
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   APP_URL="http://localhost:3000"
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Production Build & Deployment

To compile the React frontend and bundle the Express backend into a standalone distribution:

```bash
# Build client and server bundle
npm run build

# Start production server
npm start
```

---

## 📤 Exporting to GitHub from Google AI Studio

If you are running this project inside **Google AI Studio**:
1. Click the **Export** or **Settings** menu at the top right of the workspace.
2. Select **Export to GitHub** (or Download ZIP).
3. Authenticate with your GitHub account and choose your target repository.
4. AI Studio will automatically commit this complete codebase together with this `README.md`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
