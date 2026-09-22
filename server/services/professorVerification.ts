import type { ProfessorProfile, VerifiedPublication } from "../../shared/types.ts";
import { generateJSON, Type } from "./llm/index.ts";
import { searchDuckDuckGo, fetchPageText } from "./search.ts";
import { CONFIG } from "../utils/config.ts";

interface VerificationResult {
  verified: boolean;
  confidence: ProfessorProfile["verificationConfidence"];
  name: string;
  institute: string;
  department: string;
  researchInterests: string[];
  email?: string;
  facultyPage?: string;
  labPage?: string;
  designation?: string;
  publications: VerifiedPublication[];
  sources: string[];
  reason: string;
}

export async function verifyProfessor(candidate: ProfessorProfile): Promise<VerificationResult> {
  const queries = [
    `"${candidate.name}" "${candidate.institute}" faculty research`,
    `"${candidate.name}" "${candidate.institute}" publications`,
    `"${candidate.name}" "${candidate.institute}" google scholar`,
  ];

  const sourceUrls = new Set<string>();
  if (candidate.facultyPage) sourceUrls.add(candidate.facultyPage);
  if (candidate.labPage) sourceUrls.add(candidate.labPage);

  for (const q of queries) {
    const urls = await searchDuckDuckGo(q, 4);
    urls.forEach((u) => sourceUrls.add(u));
  }

  const limitedUrls = Array.from(sourceUrls).slice(0, 6);
  const pages: { url: string; text: string; title: string }[] = [];

  await Promise.all(
    limitedUrls.map(async (url) => {
      const page = await fetchPageText(url);
      if (page) pages.push(page);
    })
  );

  if (pages.length === 0) {
    return {
      verified: false,
      confidence: "Low",
      name: candidate.name,
      institute: candidate.institute,
      department: candidate.department,
      researchInterests: candidate.researchInterests,
      email: candidate.email,
      facultyPage: candidate.facultyPage,
      labPage: candidate.labPage,
      designation: candidate.designation,
      publications: [],
      sources: [],
      reason: "No verifiable sources found during secondary search.",
    };
  }

  const verification = await generateJSON<{
    verified: boolean;
    confidence: "High" | "Medium" | "Low";
    name: string;
    institute: string;
    department: string;
    researchInterests: string[];
    email?: string;
    facultyPage?: string;
    labPage?: string;
    designation?: string;
    publications: Array<{ title: string; year?: string; venue?: string; url?: string }>;
    reason: string;
  }>(
    `You are a strict academic fact-checker. A candidate professor profile was extracted from the web. Your job is to VERIFY it using the secondary sources below.

Rules:
1. Confirm the person is a real faculty member at the stated institute. If name/institute mismatch, set verified=false and confidence=Low.
2. Correct the department if needed based on the sources.
3. Extract a concise list of verified research interests (max 6). Do not invent topics not supported by the sources.
4. Extract up to 3 recent publications (title, year, venue, URL if available). Only include titles clearly attributable to this professor from the sources.
5. Provide a short reason explaining your confidence.
6. If sources are insufficient to confirm identity or research domain, set verified=false and confidence=Low.

Candidate Profile:
${JSON.stringify(candidate)}

Secondary Sources:
${pages.map((p, idx) => `--- SOURCE ${idx + 1} (URL: ${p.url} | TITLE: ${p.title}) ---\n${p.text}\n`).join("\n")}`,
    {
      type: Type.OBJECT,
      properties: {
        verified: { type: Type.BOOLEAN },
        confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
        name: { type: Type.STRING },
        institute: { type: Type.STRING },
        department: { type: Type.STRING },
        researchInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
        email: { type: Type.STRING },
        facultyPage: { type: Type.STRING },
        labPage: { type: Type.STRING },
        designation: { type: Type.STRING },
        publications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              year: { type: Type.STRING },
              venue: { type: Type.STRING },
              url: { type: Type.STRING },
            },
            required: ["title"],
          },
        },
        reason: { type: Type.STRING },
      },
      required: ["verified", "confidence", "name", "institute", "department", "researchInterests", "publications", "reason"],
    },
    0.2
  );

  return {
    ...verification,
    sources: pages.map((p) => p.url),
    publications: verification.publications.map((pub) => ({
      title: pub.title,
      year: pub.year,
      venue: pub.venue,
      url: pub.url,
    })),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function asyncPool<T, R>(concurrency: number, items: T[], fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function verifyProfessorBatch(
  candidates: ProfessorProfile[],
  onProgress?: (done: number, total: number) => void
): Promise<{ verified: ProfessorProfile[]; rejected: ProfessorProfile[] }> {
  const verified: ProfessorProfile[] = [];
  const rejected: ProfessorProfile[] = [];
  let done = 0;

  await asyncPool(4, candidates, async (candidate) => {
    // Skip secondary verification for curated seed entries that are already marked verified.
    if (candidate.verificationConfidence === "High" && candidate.verificationSources?.includes("curated seed database")) {
      verified.push(candidate);
      done++;
      onProgress?.(done, candidates.length);
      return;
    }

    try {
      const result = await withTimeout(verifyProfessor(candidate), 30000, `Verification for ${candidate.name}`);
      done++;
      onProgress?.(done, candidates.length);

      if (!result.verified || result.confidence === "Low") {
        rejected.push(candidate);
        return;
      }

      verified.push({
        name: result.name,
        institute: result.institute,
        department: result.department,
        researchInterests: result.researchInterests,
        email: result.email || candidate.email,
        facultyPage: result.facultyPage || candidate.facultyPage,
        labPage: result.labPage || candidate.labPage,
        designation: result.designation || candidate.designation,
        instituteCategory: candidate.instituteCategory,
        conversionPotential: candidate.conversionPotential,
        verificationConfidence: result.confidence,
        verificationSources: result.sources,
        publications: result.publications.slice(0, 3),
      });
    } catch (err) {
      done++;
      onProgress?.(done, candidates.length);
      console.error(`[verify] failed for ${candidate.name}:`, err);
      rejected.push(candidate);
    }
  });

  return { verified, rejected };
}
