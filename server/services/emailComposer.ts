import type { ColdEmailRequest, ColdEmailResponse, VerifiedPublication } from "../../shared/types.ts";
import { generateJSON, Type } from "./llm/index.ts";

export async function composePersonalizedEmail(req: ColdEmailRequest): Promise<ColdEmailResponse> {
  const { professor, studentProfile, matchReasons, studentName, studentEmail, studentInstitute, tone = "formal" } = req;

  const pubs = professor.publications?.slice(0, 2) || [];

  const prompt = `Write a personalized cold email from a student to a professor requesting a research internship.

Student:
- Name: ${studentName || "Student"}
- Email: ${studentEmail || ""}
- Institute: ${studentInstitute || ""}
- Profile: ${JSON.stringify(studentProfile)}

Professor (verified):
${JSON.stringify(professor)}

Match reasons:
${(matchReasons || []).map((r) => `- ${r}`).join("\n")}

Publications to potentially cite (only if relevant):
${pubs.map((p) => `- ${p.title}${p.year ? ` (${p.year})` : ""}${p.venue ? ` — ${p.venue}` : ""}`).join("\n")}

Requirements:
1. Subject line: specific, concise, mentions research area and student name.
2. Salutation: "Dear Prof. [LastName],".
3. Opening: 1-2 sentences showing you know the professor's actual work. Cite 1-2 publication titles ONLY if they genuinely connect to the student's interests.
4. Body: Connect the student's specific projects/experience to the professor's verified research interests. Be concrete, not generic.
5. Closing: politely ask about internship opportunities, mention resume attached, thank them.
6. Tone: ${tone}.
7. Do not invent facts. If publications are irrelevant, do not cite them.
8. Output JSON with keys: subject (string), body (string), citedPublications (array of {title, year, venue, url}), alignmentSummary (string).`;

  return generateJSON<ColdEmailResponse>(
    prompt,
    {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
        citedPublications: {
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
        alignmentSummary: { type: Type.STRING },
      },
      required: ["subject", "body", "citedPublications", "alignmentSummary"],
    },
    0.4
  );
}

export function sanitizeEmail(email: string): string {
  return email.replace(/\s+/g, "").trim();
}

export function buildMailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(sanitizeEmail(email))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
