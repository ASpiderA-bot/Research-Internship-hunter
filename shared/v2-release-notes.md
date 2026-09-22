# ResearchMatch v2 Release Notes

## Version 2.0.0

### Highlights

- **Anti-hallucination professor verification**
  - Every discovered professor is re-checked with a secondary web search.
  - Identity, institute, department, and research domain are cross-validated against fresh sources.
  - Low-confidence or mismatched candidates are rejected before ranking.

- **Truly personalized cold emails**
  - Emails are generated from the student's real projects and the professor's verified research interests.
  - 1–2 recent publication titles are cited when relevant.
  - No static templates; every draft is unique.

- **Swappable LLM provider**
  - Default support for Gemini and Groq.
  - Groq is recommended for higher free-tier rate limits (~30 RPM, 1K RPD). Default model updated to `openai/gpt-oss-120b`.
  - PDF parsing still uses Gemini when Groq is the primary provider.

- **Performance & verification tuning**
  - Curated seed professors are trusted as pre-verified; secondary search only runs on web-discovered candidates.
  - Verification uses a concurrency pool with 30-second timeouts so searches finish in ~30 seconds instead of minutes.
  - Candidates are pre-ranked locally before verification to avoid burning API calls on low-relevance profiles.

- **Layered backend architecture**
  - Routes → Services → Utilities separation.
  - LLM provider, web search, scraping, verification, matching, and email composition are isolated services.
  - Centralized error handling with consistent `{ error: { message, code } }` responses.

- **Hackathon match finder**
  - New module for discovering online hackathons that allow vibe-coding / AI-assisted development.
  - Filters for online/hybrid mode and vibe-coding friendliness.
  - Results ranked by relevance to the student's profile.

- **Refreshed frontend**
  - New indigo/slate/amber visual identity.
  - Improved information hierarchy and accessibility.
  - Tabbed navigation between professor discovery and hackathon finder.

### Breaking changes

- API routes remain backward-compatible in shape, but responses now include verification metadata (`verificationConfidence`, `verificationSources`, `publications`, `rejectedCount`).
- Cold email generation moved from static client-side template to server-side `/api/email` endpoint.

### Tech changes

- Replaced monolithic `server.ts` with `server/` directory structure.
- Added `shared/` for isomorphic types and utilities.
- Updated package name and version to `researchmatch-v2@2.0.0`.

---

*Released from local clone at `~/Research-Internship-hunter`.*
