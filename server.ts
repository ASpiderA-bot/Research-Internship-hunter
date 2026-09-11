import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as cheerio from "cheerio";
import { SEED_PROFESSORS } from "./src/data/seed-professors";
import { StudentProfile, ProfessorProfile, MatchResult } from "./src/types";
import { matchInstitute, matchesAnyTarget } from "./src/utils/instituteMatcher";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a larger limit to support base64 uploads
app.use(express.json({ limit: "25mb" }));

// Lazy-initialize Gemini client to handle missing keys gracefully and prevent startup crashes
let aiClient: GoogleGenAI | null = null;

function cleanAndValidateKey(key: string | undefined): string {
  if (!key) return "";
  let cleanKey = key.trim();
  // Strip outer quotes if present (e.g. "key" or 'key')
  if (
    (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
    (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
  ) {
    cleanKey = cleanKey.slice(1, -1).trim();
  }
  return cleanKey;
}

function getGeminiClient(): GoogleGenAI {
  const rawKey = process.env.GEMINI_API_KEY;
  const key = cleanAndValidateKey(rawKey);

  if (
    !key || 
    key === "MY_GEMINI_API_KEY" || 
    key === "YOUR_GEMINI_API_KEY" || 
    key === "GEMINI_API_KEY" || 
    key.toLowerCase().includes("placeholder")
  ) {
    throw new Error(
      "GEMINI_API_KEY is not configured or is still set to the default placeholder. " +
      "To resolve this, please create a '.env' file in the root folder of this project (or edit the existing one) " +
      "and set: GEMINI_API_KEY=your_actual_gemini_api_key (Gemini API keys typically start with 'AIzaSy' and are 39 characters long)."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper function to fetch web pages with a strict timeout
async function fetchWithTimeout(url: string, timeoutMs: number = 4000): Promise<string | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    clearTimeout(id);
    if (!response.ok) return null;
    return await response.text();
  } catch (err) {
    clearTimeout(id);
    return null;
  }
}

// Scrape DuckDuckGo HTML for search results
async function searchDuckDuckGo(query: string): Promise<string[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const html = await fetchWithTimeout(url, 5000);
    if (!html) return [];

    const $ = cheerio.load(html);
    const urls: string[] = [];

    $(".result__url").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        let actualUrl = href;
        if (href.includes("uddg=")) {
          const match = href.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            actualUrl = decodeURIComponent(match[1]);
          }
        }

        const lower = actualUrl.toLowerCase();
        // Filter relevant academic/profile sites and exclude common noises
        if (
          !lower.includes("linkedin") &&
          !lower.includes("facebook") &&
          !lower.includes("twitter") &&
          !lower.includes("quora") &&
          !lower.includes("wikipedia") &&
          !lower.includes("youtube") &&
          !lower.includes("news") &&
          !lower.includes("blog") &&
          !lower.includes("advertisement") &&
          (lower.includes(".ac.in") || lower.includes(".edu") || lower.includes(".res.in") || lower.includes("faculty") || lower.includes("professor") || lower.includes("people") || lower.includes("dept") || lower.includes("research"))
        ) {
          urls.push(actualUrl);
        }
      }
    });

    return [...new Set(urls)].slice(0, 8);
  } catch (err) {
    console.error(`DuckDuckGo search error for query "${query}":`, err);
    return [];
  }
}

// Clean HTML to extract readable text
function cleanHtmlText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, iframe, nav, footer, header, form, svg, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 4500);
}

// API: Parse Resume to Profile
app.post("/api/profile", async (req, res) => {
  try {
    const { pdfBase64, textContent } = req.body;

    if (!pdfBase64 && !textContent) {
      return res.status(400).json({ error: "Missing resume contents (PDF base64 or text)" });
    }

    let response;
    const prompt = `You are an expert career counselor and academic matchmaker. Analyze the provided resume. Extract the skills, broad domains (e.g., Computer Vision, Distributed Systems), deep interests/research topics (e.g., Large Language Models, Generative Adversarial Networks), academic/technical projects, and work/research experiences. Ensure you extract actual technologies mentioned. Return the results strictly conforming to the requested JSON schema.`;

    if (pdfBase64) {
      // Direct PDF parsing with Gemini
      response = await getGeminiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              domains: { type: Type.ARRAY, items: { type: Type.STRING } },
              interests: { type: Type.ARRAY, items: { type: Type.STRING } },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["title", "description"],
                },
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["role", "organization", "description"],
                },
              },
            },
            required: ["skills", "domains", "interests", "projects"],
          },
        },
      });
    } else {
      // Pasted text parsing
      response = await getGeminiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Parse this resume text and convert it into a structured student profile:
        
Resume Text:
${textContent}

${prompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              domains: { type: Type.ARRAY, items: { type: Type.STRING } },
              interests: { type: Type.ARRAY, items: { type: Type.STRING } },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["title", "description"],
                },
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["role", "organization", "description"],
                },
              },
            },
            required: ["skills", "domains", "interests", "projects"],
          },
        },
      });
    }

    const profileData = JSON.parse(response.text.trim()) as StudentProfile;
    return res.json(profileData);
  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return res.status(500).json({ error: "Failed to parse resume: " + error.message });
  }
});

// API: Discover & Match Professors
app.post("/api/search", async (req, res) => {
  try {
    const { studentProfile, targetInstitutes = [] } = req.body;
    if (!studentProfile) {
      return res.status(400).json({ error: "Missing student profile" });
    }

    const isTargeted = Array.isArray(targetInstitutes) && targetInstitutes.length > 0;
    console.log(`Search requested. Mode: ${isTargeted ? `Targeted (${targetInstitutes.join(", ")})` : "Pan-India Broad"}`);

    let searchQueries = [];
    let scrapedProfessors: ProfessorProfile[] = [];

    try {
      // 1. Generate focused search queries with deep reach across targeted or broader Indian universities
      const queryPrompt = isTargeted
        ? `The student has explicitly requested targeted searching at these specific institutions: ${targetInstitutes.join(", ")}.
Given the student's profile, generate 4 to 5 highly focused academic search queries specifically to find active professors, research labs, or faculty directories at these targeted institutions: ${targetInstitutes.join(", ")}.
In each query, pair one of the targeted institutions with the student's primary research domains and core skills.
Do NOT include punctuation or boolean operators like AND/OR.
Return the query and which focus area of the student it maps to.`
        : `Given the student's profile, generate 4 to 5 highly focused academic search queries to discover active professors, labs, or faculty members across Indian universities.
Ensure broad reach across:
- Newer Generation IITs (IIT Gandhinagar, IIT Jodhpur, IIT Ropar, IIT Mandi, IIT Patna, IIT Indore, IIT Hyderabad, IIT Tirupati, IIT Palakkad, IIT Bhilai)
- Top IIITs (IIIT Delhi, IIIT Hyderabad, IIIT Bangalore, IIIT Allahabad, IIIT Sri City, IIIT Gwalior)
- Established IITs (IIT Bombay, IIT Delhi, IIT Madras, IIT Kanpur, IIT Kharagpur, IIT Roorkee, IIT Guwahati)
- National Institutes of Technology (NIT Trichy, NIT Surathkal, NIT Warangal, NIT Calicut, SVNIT)

Focus heavily on the student's core skills and primary research topics.
Do NOT include punctuation or boolean operators like AND/OR.
Return the query and which focus area of the student it maps to.`;

      const queriesResponse = await getGeminiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${queryPrompt}

Student Profile:
${JSON.stringify(studentProfile)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
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
        },
      });

      searchQueries = JSON.parse(queriesResponse.text.trim());
      console.log("Generated Search Queries:", searchQueries);

      // 2. Execute DuckDuckGo Searches and gather unique academic URLs
      const urlSet = new Set<string>();
      for (const q of searchQueries) {
        const urls = await searchDuckDuckGo(q.query);
        urls.forEach((u) => urlSet.add(u));
      }

      const uniqueUrls = Array.from(urlSet).slice(0, 6); // Up to 6 unique URLs
      console.log("Found Faculty URLs to Scrape:", uniqueUrls);

      // 3. Scrape pages and extract professor details using Gemini batching
      const pagesToExtract: Array<{ url: string; text: string }> = [];

      await Promise.all(
        uniqueUrls.map(async (url) => {
          try {
            const html = await fetchWithTimeout(url, 4000);
            if (!html) return;
            const text = cleanHtmlText(html);
            if (text.length < 150) return;
            pagesToExtract.push({ url, text: text.slice(0, 3000) });
          } catch (err) {
            console.error(`Error fetching URL "${url}":`, err);
          }
        })
      );

      if (pagesToExtract.length > 0) {
        console.log(`Sending ${pagesToExtract.length} crawled pages to Gemini for batch extraction...`);
        const extractResponse = await getGeminiClient().models.generateContent({
          model: "gemini-3.5-flash",
          contents: `You are an academic web scraper. Analyze the extracted text of the crawled web pages below.
For each page, extract the details of the university professor or faculty member described.
If a page does not describe a specific professor, faculty member, or research lab profile, or lacks research interest details, simply do not include it in the returned array.

Crawled Web Pages:
${pagesToExtract.map((p, idx) => `--- PAGE ${idx + 1} (URL: ${p.url}) ---\n${p.text}\n`).join("\n")}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Full name (e.g. Prof. Arnab Roy)." },
                  institute: { type: Type.STRING, description: "Name of institute (e.g. IIT Gandhinagar, IIIT Delhi)." },
                  department: { type: Type.STRING, description: "Department name (e.g. Computer Science and Engineering)." },
                  researchInterests: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific research topics listed." },
                  email: { type: Type.STRING, description: "Faculty email address, if present." },
                  facultyPage: { type: Type.STRING, description: "URL of this profile page." },
                  labPage: { type: Type.STRING, description: "Lab or group webpage, if mentioned." },
                  instituteCategory: { type: Type.STRING, description: "Newer IIT, Established IIT, IIIT, NIT, or Premier Research Inst" },
                  conversionPotential: { type: Type.STRING, description: "Very High, High, or Moderate" },
                },
                required: ["name", "institute", "department", "researchInterests", "email", "facultyPage"],
              },
            },
          },
        });

        const batchProfessors = JSON.parse(extractResponse.text.trim()) as ProfessorProfile[];
        batchProfessors.forEach((prof) => {
          if (prof.name && !prof.name.toLowerCase().includes("unknown") && prof.researchInterests && prof.researchInterests.length > 0) {
            scrapedProfessors.push(prof);
          }
        });
      }
    } catch (apiError: any) {
      console.warn("API pre-processing or scraping limit reached, falling back to database: ", apiError.message);
    }

    // 4. Combine Scraped Professors with SEED_PROFESSORS
    // Filter duplicates by name + institute similarity
    const allCandidates = [...scrapedProfessors];
    for (const seed of SEED_PROFESSORS) {
      const isDuplicate = allCandidates.some(
        (c) => c.name.toLowerCase().replace(/prof\.|dr\./g, "").trim() === seed.name.toLowerCase().replace(/prof\.|dr\./g, "").trim()
      );
      if (!isDuplicate) {
        allCandidates.push(seed);
      }
    }

    // 5. Build Candidate Pool based on whether targeted search is active
    const studentInterestsLower = [
      ...studentProfile.skills,
      ...studentProfile.domains,
      ...studentProfile.interests
    ].map(s => s.toLowerCase());

    let prioritizedCandidates: ProfessorProfile[] = [];

    if (isTargeted) {
      // STRICT FILTERING: Only include candidates that actually match one of the target institutes
      let targetedPool = allCandidates.filter(c => matchesAnyTarget(c.institute, targetInstitutes));

      // Guarantee at least 2 candidates for EVERY selected institute
      for (const targetInst of targetInstitutes) {
        const matchesForInst = targetedPool.filter(c => matchInstitute(c.institute, targetInst));
        if (matchesForInst.length < 2) {
          try {
            console.log(`Deepening faculty pool for targeted institute: ${targetInst}...`);
            const targetGenResponse = await getGeminiClient().models.generateContent({
              model: "gemini-3.5-flash",
              contents: `You are an academic database specialist for Indian engineering universities.
The student is targeting research internships at: "${targetInst}".
Student Profile:
Domains: ${(studentProfile.domains || []).join(", ")}
Skills: ${(studentProfile.skills || []).join(", ")}
Interests: ${(studentProfile.interests || []).join(", ")}

Generate 2 to 3 real or representative active faculty members (Professors, Associate Professors, or Assistant Professors) currently at "${targetInst}" in Computer Science & Engineering, Artificial Intelligence, Data Science, or related departments whose research interests overlap with the student's background.`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      institute: { type: Type.STRING },
                      department: { type: Type.STRING },
                      designation: { type: Type.STRING },
                      researchInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
                      email: { type: Type.STRING },
                      facultyPage: { type: Type.STRING },
                      instituteCategory: { type: Type.STRING },
                      conversionPotential: { type: Type.STRING },
                    },
                    required: ["name", "institute", "department", "researchInterests", "email", "facultyPage"],
                  },
                },
              },
            });

            const genProfs = JSON.parse(targetGenResponse.text.trim()) as ProfessorProfile[];
            genProfs.forEach(p => {
              p.institute = targetInst;
              if (!p.instituteCategory) {
                p.instituteCategory = targetInst.toLowerCase().includes("iiit") ? "IIIT" : targetInst.toLowerCase().includes("nit") ? "NIT" : "Newer IIT";
              }
              if (!p.conversionPotential) {
                p.conversionPotential = "Very High";
              }
              targetedPool.push(p);
            });
          } catch (genErr: any) {
            console.warn(`Could not generate supplemental faculty for ${targetInst}:`, genErr.message);
          }
        }
      }

      // Balanced selection across all selected target institutes so no single institute dominates
      const perInstQuota = Math.max(3, Math.ceil(24 / targetInstitutes.length));
      const seenProfKeys = new Set<string>();

      for (const targetInst of targetInstitutes) {
        const instCandidates = targetedPool
          .filter(c => matchInstitute(c.institute, targetInst))
          .map(c => {
            let score = 0;
            c.researchInterests.forEach(ri => {
              const riLower = ri.toLowerCase();
              studentInterestsLower.forEach(si => {
                if (riLower.includes(si) || si.includes(riLower)) {
                  score += 4;
                }
              });
            });
            if (c.conversionPotential === 'Very High') score += 3;
            return { prof: c, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, perInstQuota);

        for (const item of instCandidates) {
          const key = `${item.prof.name.toLowerCase()}-${item.prof.institute.toLowerCase()}`;
          if (!seenProfKeys.has(key)) {
            seenProfKeys.add(key);
            prioritizedCandidates.push(item.prof);
          }
        }
      }
    } else {
      // Broad mode: rank all candidates
      prioritizedCandidates = allCandidates.map(c => {
        let overlapCount = 0;
        c.researchInterests.forEach(ri => {
          const riLower = ri.toLowerCase();
          studentInterestsLower.forEach(si => {
            if (riLower.includes(si) || si.includes(riLower)) {
              overlapCount += 3;
            }
          });
        });

        // Bonus weighting for high conversion institutes (Newer IITs, IIITs, NITs)
        if (c.conversionPotential === 'Very High') overlapCount += 4;
        else if (c.conversionPotential === 'High') overlapCount += 2;
        
        if (c.instituteCategory === 'Newer IIT' || c.instituteCategory === 'IIIT') {
          overlapCount += 3;
        }

        return { prof: c, score: overlapCount };
      })
      .sort((a, b) => b.score - a.score)
      .map(x => x.prof)
      .slice(0, 24);
    }

    try {
      console.log(`Evaluating ${prioritizedCandidates.length} candidate professors against student profile...`);

      // 6. Ask Gemini to match, score, and compute Conversion Opportunity insights
      const rankingResponse = await getGeminiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert academic research advisor and matchmaker. Compare the student's profile with the list of candidate professor profiles.
Evaluate how well each professor matches the student, and evaluate the "conversion opportunity" (i.e., the likelihood of the professor actively recruiting interns/collaborators, especially at fast-growing Newer IITs, IIITs, and specialized labs).
${isTargeted ? `CRITICAL TARGETING NOTE: The student explicitly requested targeted faculty discovery at: ${targetInstitutes.join(", ")}. Ensure candidates from these institutes are clearly evaluated and prioritize them.` : ""}

Use this EXACT scoring formula:
- Research Domain Overlap: 40%
- Project Similarity (student's projects mapped to professor's research topics): 25%
- Technical Skill Match: 20%
- Academic Interest Overlap: 15%

For each candidate:
1. matchScore: Calculate a score from 0 to 100 based on technical and domain overlap.
2. reason: Exactly 3-4 precise, personalized bullet points referencing specific experiences or projects (such as their research internship at IIT Ropar with Annam.ai on Krishi Darshan video transcription or FLN adaptive learning, or other technical skills) and explaining the exact alignment with the professor's research.
3. confidence: 'High', 'Medium', or 'Low'.
4. conversionOpportunity: 1 short, high-value sentence explaining why this institute/lab has strong conversion probability (e.g. "Expanding lab with active funded projects in newer IIT ecosystem, with high acceptance for dedicated undergraduate researchers" or "Top research group with high intake of project assistants and summer fellows").

Student Profile:
${JSON.stringify(studentProfile)}

Candidate Professors:
${JSON.stringify(prioritizedCandidates)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Full name of the professor exactly as provided in input." },
                institute: { type: Type.STRING, description: "Institute name." },
                matchScore: { type: Type.INTEGER, description: "Calculated score from 0 to 100 based on matching formula." },
                reason: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3-4 direct explanations starting with 'You' or 'Matches because' describing overlap.",
                },
                confidence: { type: Type.STRING, description: "High, Medium, or Low" },
                conversionOpportunity: { type: Type.STRING, description: "Actionable conversion insight for reaching out to this faculty/institute." },
              },
              required: ["name", "institute", "matchScore", "reason", "confidence", "conversionOpportunity"],
            },
          },
        },
      });

      const rankedData = JSON.parse(rankingResponse.text.trim()) as Array<{
        name: string;
        institute: string;
        matchScore: number;
        reason: string[];
        confidence: 'High' | 'Medium' | 'Low';
        conversionOpportunity?: string;
      }>;

      // 7. Reconstruct the complete MatchResult array
      let results: MatchResult[] = [];
      for (const r of rankedData) {
        const orig = prioritizedCandidates.find(
          (c) => c.name.toLowerCase() === r.name.toLowerCase()
        );
        if (orig) {
          results.push({
            professor: orig,
            matchScore: r.matchScore,
            reason: r.reason,
            confidence: r.confidence,
            conversionOpportunity: r.conversionOpportunity || (
              orig.instituteCategory === 'Newer IIT' ? 'High conversion potential: Newer IIT labs actively hire proactive student researchers for sponsored grants.' :
              orig.instituteCategory === 'IIIT' ? 'High conversion potential: IIIT specialized centers have open research assistant and summer intern cycles.' :
              orig.instituteCategory === 'NIT' ? 'Strong conversion potential: Regular student researcher and project assistant openings.' :
              'Established lab: Highly competitive with formal summer research programs.'
            )
          });
        }
      }

      // If in targeted mode, STRICTLY guarantee that ONLY targeted institutes are included
      if (isTargeted) {
        results = results.filter(r => matchesAnyTarget(r.professor.institute, targetInstitutes));

        // Ensure every targeted institute has at least one professor in results
        for (const targetInst of targetInstitutes) {
          const hasMatch = results.some(r => matchInstitute(r.professor.institute, targetInst));
          if (!hasMatch) {
            const backupProf = prioritizedCandidates.find(p => matchInstitute(p.institute, targetInst));
            if (backupProf) {
              results.push({
                professor: backupProf,
                matchScore: 84,
                reason: [
                  `Faculty member at targeted institution ${backupProf.institute}.`,
                  `Specializes in ${backupProf.researchInterests.slice(0, 2).join(" and ")}.`,
                  `Aligns with your computing background and prospective research internship goals.`
                ],
                confidence: "High",
                conversionOpportunity: backupProf.conversionPotential === "Very High" 
                  ? "High conversion potential: Expanding lab with active student opportunities."
                  : "Targeted institution with active research initiatives."
              });
            }
          }
        }
      }

      // Sort results by match score descending
      results.sort((a, b) => b.matchScore - a.matchScore);

      return res.json({
        searchQueries,
        scrapedCount: scrapedProfessors.length,
        results,
        targetInstitutes: isTargeted ? targetInstitutes : [],
      });
    } catch (rankingError: any) {
      console.warn("Ranking API limits exceeded, using robust local keyword matcher:", rankingError.message);
      
      // Local fallback matching algorithm
      let results: MatchResult[] = [];
      for (const prof of prioritizedCandidates) {
        const reasons: string[] = [];
        let domainScore = 0;
        let skillScore = 0;
        let projectScore = 0;

        // Domain overlap
        const matchingInterests = prof.researchInterests.filter(ri => {
          const riLower = ri.toLowerCase();
          return studentInterestsLower.some(si => riLower.includes(si) || si.includes(riLower));
        });
        if (matchingInterests.length > 0) {
          domainScore = Math.min(40, matchingInterests.length * 15);
          reasons.push(`Matches because both your profile and the professor emphasize: ${matchingInterests.slice(0, 3).join(", ")}.`);
        }

        // Skills match
        const matchingSkills = studentProfile.skills.filter(s => {
          const sLower = s.toLowerCase();
          return prof.researchInterests.some(ri => ri.toLowerCase().includes(sLower));
        });
        if (matchingSkills.length > 0) {
          skillScore = Math.min(20, matchingSkills.length * 10);
          reasons.push(`Your expertise in ${matchingSkills.slice(0, 2).join(", ")} aligns with the professor's core projects.`);
        }

        // Projects match
        studentProfile.projects.forEach(proj => {
          const projText = `${proj.title} ${proj.description} ${(proj.technologies || []).join(" ")}`.toLowerCase();
          const overlapInProj = prof.researchInterests.filter(ri => projText.includes(ri.toLowerCase()));
          if (overlapInProj.length > 0) {
            projectScore = Math.min(25, projectScore + 13);
            reasons.push(`Your project "${proj.title}" directly relates to their research on ${overlapInProj[0]}.`);
          }
        });

        const matchScore = Math.min(100, Math.max(50, domainScore + skillScore + projectScore + 15));
        if (reasons.length === 0) {
          reasons.push("The professor's overall academic profile is closely aligned with your computing domain.");
        }

        const conversionInsight = prof.instituteCategory === 'Newer IIT' 
          ? "High conversion potential: Rapidly growing lab at a Newer IIT with active funding and high acceptance rate for motivated students."
          : prof.instituteCategory === 'IIIT'
          ? "High conversion potential: IIIT research centers actively recruit student project interns and research assistants."
          : prof.instituteCategory === 'NIT'
          ? "High conversion potential: Faculty welcomes inter-institutional collaborative research interns."
          : "Established institute: Strong match; outreach during early cycle is recommended.";

        results.push({
          professor: prof,
          matchScore,
          reason: reasons.slice(0, 3),
          confidence: matchScore >= 75 ? "High" : "Medium",
          conversionOpportunity: conversionInsight,
        });
      }

      // If in targeted mode, STRICTLY guarantee that ONLY targeted institutes are included
      if (isTargeted) {
        results = results.filter(r => matchesAnyTarget(r.professor.institute, targetInstitutes));

        for (const targetInst of targetInstitutes) {
          const hasMatch = results.some(r => matchInstitute(r.professor.institute, targetInst));
          if (!hasMatch) {
            const backupProf = prioritizedCandidates.find(p => matchInstitute(p.institute, targetInst));
            if (backupProf) {
              results.push({
                professor: backupProf,
                matchScore: 80,
                reason: [
                  `Faculty member at targeted institution ${backupProf.institute}.`,
                  `Specializes in ${backupProf.researchInterests.slice(0, 2).join(" and ")}.`,
                  `Aligns with your computing profile.`
                ],
                confidence: "High",
                conversionOpportunity: backupProf.conversionPotential === "Very High" 
                  ? "High conversion potential: Active lab with high summer intern acceptance."
                  : "Targeted institution."
              });
            }
          }
        }
      }

      results.sort((a, b) => b.matchScore - a.matchScore);

      return res.json({
        searchQueries,
        scrapedCount: scrapedProfessors.length,
        results,
        targetInstitutes: isTargeted ? targetInstitutes : [],
      });
    }
  } catch (error: any) {
    console.error("Match search error:", error);
    return res.status(500).json({ error: "Failed to search and match: " + error.message });
  }
});

// Configure Vite integration or static file serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
