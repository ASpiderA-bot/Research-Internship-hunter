import type { Hackathon, HackathonSearchRequest, StudentProfile } from "../../shared/types.ts";
import { generateJSON, Type } from "./llm/index.ts";
import { searchDuckDuckGo, fetchPageText } from "./search.ts";
import { CONFIG } from "../utils/config.ts";

const VIBE_CODING_KEYWORDS = [
  "vibe coding",
  "no-code",
  "low-code",
  "ai-assisted",
  "generative ai",
  "chatgpt",
  "claude",
  "copilot",
  "cursor",
  "bolt",
  "lovable",
  "replit",
  "sandbox",
];

function buildQueries(): string[] {
  return [
    "online hackathon 2026 vibe coding allowed",
    "online hackathon 2026 AI assisted no code",
    "virtual hackathon 2026 generative AI",
    "online hackathon India 2026 vibe coding",
    "global online hackathon 2026",
  ];
}

function scoreHackathonRelevance(hack: Hackathon, student: StudentProfile): number {
  const tokens = [
    ...student.skills,
    ...student.domains,
    ...student.interests,
    ...student.projects.flatMap((p) => [p.title, ...(p.technologies || [])]),
  ].map((s) => s.toLowerCase());

  const hackText = `${hack.name} ${hack.theme || ""} ${hack.description} ${(hack.techStack || []).join(" ")}`.toLowerCase();
  let score = hack.relevanceScore || 0;

  for (const token of tokens) {
    if (token.length < 3) continue;
    if (hackText.includes(token)) score += 2;
  }

  if (hack.vibeCodingFriendly) score += 5;
  if (hack.mode === "online") score += 3;
  return score;
}

export async function findHackathons(request: HackathonSearchRequest): Promise<Hackathon[]> {
  const { studentProfile, requireOnline, requireVibeCoding, maxResults = 12 } = request;

  const queries = buildQueries();
  const urlSet = new Set<string>();

  for (const q of queries) {
    const urls = await searchDuckDuckGo(q, CONFIG.MAX_SEARCH_URLS);
    urls.forEach((u) => urlSet.add(u));
  }

  const urls = Array.from(urlSet).slice(0, CONFIG.MAX_SEARCH_URLS * 3);
  const pages: { url: string; text: string; title: string }[] = [];

  await Promise.all(
    urls.map(async (url) => {
      const page = await fetchPageText(url);
      if (page) pages.push(page);
    })
  );

  if (pages.length === 0) return [];

  const extracted = await generateJSON<
    Array<{
      name: string;
      organizer: string;
      startDate?: string;
      endDate?: string;
      mode: "online" | "hybrid" | "in-person";
      registrationUrl?: string;
      prize?: string;
      theme?: string;
      techStack?: string[];
      vibeCodingFriendly: boolean;
      description: string;
    }>
  >(
    `You are a hackathon curator. From the crawled web pages below, extract hackathons that are online or hybrid and friendly to "vibe coding" (AI-assisted / no-code / low-code / rapid prototyping).

For each hackathon extract:
- name, organizer, dates (ISO 8601 or human readable), mode, registrationUrl, prize, theme, techStack, vibeCodingFriendly (boolean), description.

Only include events that are either explicitly online/hybrid or explicitly allow vibe coding / AI-assisted development.
If a page contains multiple events, list them separately.

Crawled Pages:
${pages.map((p, idx) => `--- PAGE ${idx + 1} (URL: ${p.url} | TITLE: ${p.title}) ---\n${p.text}\n`).join("\n")}`,
    {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          organizer: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          mode: { type: Type.STRING, enum: ["online", "hybrid", "in-person"] },
          registrationUrl: { type: Type.STRING },
          prize: { type: Type.STRING },
          theme: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          vibeCodingFriendly: { type: Type.BOOLEAN },
          description: { type: Type.STRING },
        },
        required: ["name", "organizer", "mode", "vibeCodingFriendly", "description"],
      },
    },
    0.3
  );

  let hackathons: Hackathon[] = extracted
    .filter((h) => {
      if (requireOnline && h.mode !== "online" && h.mode !== "hybrid") return false;
      if (requireVibeCoding && !h.vibeCodingFriendly) return false;
      return true;
    })
    .map((h, idx) => ({
      id: `hack-${idx}`,
      ...h,
      sourceUrl: urls[0] || "",
      relevanceScore: 0,
    }));

  // Find source URL per hackathon by best page match.
  hackathons = hackathons.map((h) => {
    const bestPage = pages.find((p) => p.text.toLowerCase().includes(h.name.toLowerCase()));
    return { ...h, sourceUrl: bestPage?.url || urls[0] || "" };
  });

  hackathons = hackathons
    .map((h) => ({ ...h, relevanceScore: scoreHackathonRelevance(h, studentProfile) }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  return hackathons;
}
