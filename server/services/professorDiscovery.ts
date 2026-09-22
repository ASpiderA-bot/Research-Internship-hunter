import type { ProfessorProfile, SearchQuery, StudentProfile } from "../../shared/types.ts";
import { generateJSON, Type } from "./llm/index.ts";
import { searchDuckDuckGo, fetchPageText } from "./search.ts";
import { CONFIG } from "../utils/config.ts";
import { categorizeInstitute, inferConversionPotential, matchesAnyTarget } from "../../shared/utils/instituteMatcher.ts";
import { SEED_PROFESSORS } from "../data/seed-professors.ts";

interface RawProfessor {
  name: string;
  institute: string;
  department: string;
  researchInterests: string[];
  email?: string;
  facultyPage?: string;
  labPage?: string;
  designation?: string;
}

export async function generateSearchQueries(
  studentProfile: StudentProfile,
  targetInstitutes: string[],
  isTargeted: boolean
): Promise<SearchQuery[]> {
  const prompt = isTargeted
    ? `The student has explicitly requested targeted searching at these specific institutions: ${targetInstitutes.join(", ")}.
Given the student's profile, generate 4 to 5 highly focused academic search queries specifically to find active professors, research labs, or faculty directories at these targeted institutions.
In each query, pair one of the targeted institutions with the student's primary research domains and core skills.
Do NOT include punctuation or boolean operators like AND/OR.
Return the query and which focus area of the student it maps to.`
    : `Given the student's profile, generate 4 to 5 highly focused academic search queries to discover active professors, labs, or faculty members across Indian universities.
Ensure broad reach across Newer IITs, IIITs, Established IITs, and NITs.
Focus heavily on the student's core skills and primary research topics.
Do NOT include punctuation or boolean operators like AND/OR.
Return the query and which focus area of the student it maps to.`;

  return generateJSON<SearchQuery[]>(
    `${prompt}\n\nStudent Profile:\n${JSON.stringify(studentProfile)}`,
    {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: "E.g. 'Deep Learning professor IIT Gandhinagar faculty CSE'" },
          focusArea: { type: Type.STRING, description: "The skill or domain of the student this targets." },
        },
        required: ["query", "focusArea"],
      },
    },
    0.3
  );
}

export async function discoverProfessorsFromWeb(
  studentProfile: StudentProfile,
  targetInstitutes: string[],
  isTargeted: boolean
): Promise<{ professors: ProfessorProfile[]; queries: SearchQuery[]; scrapedCount: number }> {
  const queries = await generateSearchQueries(studentProfile, targetInstitutes, isTargeted);

  const urlSet = new Set<string>();
  for (const q of queries) {
    const urls = await searchDuckDuckGo(q.query, CONFIG.MAX_SEARCH_URLS);
    urls.forEach((u) => urlSet.add(u));
  }

  // If targeted, add direct faculty-directory guesses to increase coverage.
  if (isTargeted) {
    for (const inst of targetInstitutes) {
      const norm = inst.toLowerCase().replace(/\s+/g, " ");
      urlSet.add(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${inst} faculty directory CSE`)}`);
      if (norm.includes("iit")) {
        urlSet.add(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:${inst.toLowerCase().replace(/\s+/g, "")}.ac.in faculty cse`)}`);
      }
    }
  }

  const uniqueUrls = Array.from(urlSet).slice(0, CONFIG.MAX_SEARCH_URLS * 2);
  const pageTexts: { url: string; text: string; title: string }[] = [];

  await Promise.all(
    uniqueUrls.map(async (url) => {
      const page = await fetchPageText(url);
      if (page) pageTexts.push(page);
    })
  );

  if (pageTexts.length === 0) {
    return { professors: [], queries, scrapedCount: 0 };
  }

  const raw = await generateJSON<RawProfessor[]>(
    `You are an academic web scraper. Analyze the extracted text of the crawled web pages below.
For each page, extract the details of the university professor or faculty member described.
If a page does not describe a specific professor, faculty member, or research lab profile, or lacks research interest details, simply do not include it in the returned array.
Prefer official .ac.in / .edu / faculty pages. Infer the institute name accurately from the page title or URL if not explicitly stated.

Crawled Web Pages:
${pageTexts.map((p, idx) => `--- PAGE ${idx + 1} (URL: ${p.url} | TITLE: ${p.title}) ---\n${p.text}\n`).join("\n")}`,
    {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          institute: { type: Type.STRING },
          department: { type: Type.STRING },
          researchInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
          email: { type: Type.STRING },
          facultyPage: { type: Type.STRING },
          labPage: { type: Type.STRING },
          designation: { type: Type.STRING },
        },
        required: ["name", "institute", "department", "researchInterests"],
      },
    },
    0.2
  );

  const professors: ProfessorProfile[] = raw
    .filter((p) => p.name && !p.name.toLowerCase().includes("unknown") && p.researchInterests?.length > 0)
    .map((p) => ({
      ...p,
      email: p.email || "",
      facultyPage: p.facultyPage || "",
      instituteCategory: categorizeInstitute(p.institute),
      conversionPotential: inferConversionPotential(p.institute),
    }))
    .filter((p) => {
      if (!isTargeted) return true;
      return matchesAnyTarget(p.institute, targetInstitutes);
    });

  return { professors, queries, scrapedCount: professors.length };
}

export function mergeWithSeedProfessors(scraped: ProfessorProfile[]): ProfessorProfile[] {
  const normalizedName = (n: string) => n.toLowerCase().replace(/prof\.|dr\./g, "").trim();
  const all = [...scraped];

  for (const seed of SEED_PROFESSORS) {
    const isDuplicate = all.some(
      (c) => normalizedName(c.name) === normalizedName(seed.name)
    );
    if (!isDuplicate) {
      all.push({
        ...seed,
        verificationConfidence: "High",
        verificationSources: ["curated seed database"],
      });
    }
  }

  return all;
}

export function deduplicateProfessors(profs: ProfessorProfile[]): ProfessorProfile[] {
  const seen = new Map<string, ProfessorProfile>();
  for (const p of profs) {
    const key = `${normalizeName(p.name)}|${normalizeName(p.institute)}`;
    if (!seen.has(key)) {
      seen.set(key, p);
    }
  }
  return Array.from(seen.values());
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "").trim();
}
