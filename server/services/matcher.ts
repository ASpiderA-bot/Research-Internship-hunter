import type { MatchResult, ProfessorProfile, StudentProfile } from "../../shared/types.ts";
import { generateJSON, Type } from "./llm/index.ts";
import { matchInstitute, matchesAnyTarget } from "../../shared/utils/instituteMatcher.ts";

function localOverlapScore(prof: ProfessorProfile, student: StudentProfile): number {
  const studentTokens = [
    ...student.skills,
    ...student.domains,
    ...student.interests,
    ...student.projects.flatMap((p) => [p.title, p.description, ...(p.technologies || [])]),
    ...(student.experience?.flatMap((e) => [e.role, e.organization, e.description]) || []),
  ]
    .map((s) => s.toLowerCase())
    .filter((s) => s.length > 2);

  const profTokens = [
    ...prof.researchInterests,
    prof.department,
    prof.institute,
  ].map((s) => s.toLowerCase());

  let score = 0;
  for (const ri of profTokens) {
    for (const si of studentTokens) {
      if (ri.includes(si) || si.includes(ri)) score += 1;
    }
  }

  if (prof.instituteCategory === "Newer IIT" || prof.instituteCategory === "IIIT") score += 2;
  if (prof.conversionPotential === "Very High") score += 2;
  return score;
}

export async function rankMatches(
  studentProfile: StudentProfile,
  candidates: ProfessorProfile[],
  targetInstitutes: string[]
): Promise<MatchResult[]> {
  if (candidates.length === 0) return [];

  const isTargeted = targetInstitutes.length > 0;
  const eligible = isTargeted
    ? candidates.filter((c) => matchesAnyTarget(c.institute, targetInstitutes))
    : candidates;

  // Pre-rank with local overlap so we send the most promising candidates to Gemini.
  const sorted = eligible
    .map((c) => ({ prof: c, score: localOverlapScore(c, studentProfile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 24)
    .map((x) => x.prof);

  const results = await generateJSON<
    Array<{
      name: string;
      institute: string;
      matchScore: number;
      reason: string[];
      confidence: "High" | "Medium" | "Low";
      conversionOpportunity: string;
    }>
  >(
    `You are an expert academic research advisor. Compare the student's profile with the candidate professor profiles.
Evaluate how well each professor matches the student, and evaluate the "conversion opportunity" (likelihood of the professor actively recruiting interns/collaborators).
${isTargeted ? `CRITICAL: The student explicitly targeted: ${targetInstitutes.join(", ")}.` : ""}

Scoring formula:
- Research Domain Overlap: 40%
- Project Similarity: 25%
- Technical Skill Match: 20%
- Academic Interest Overlap: 15%

For each candidate:
1. matchScore: integer 0-100.
2. reason: 3-4 precise bullet points referencing the student's specific projects/experience and the professor's verified research interests. Be factual.
3. confidence: High, Medium, or Low.
4. conversionOpportunity: 1 sentence explaining why this institute/lab has strong conversion probability.

Student Profile:
${JSON.stringify(studentProfile)}

Candidate Professors (verified):
${JSON.stringify(sorted)}`,
    {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          institute: { type: Type.STRING },
          matchScore: { type: Type.INTEGER },
          reason: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          conversionOpportunity: { type: Type.STRING },
        },
        required: ["name", "institute", "matchScore", "reason", "confidence", "conversionOpportunity"],
      },
    },
    0.3
  );

  const matched: MatchResult[] = [];
  for (const r of results) {
    const orig = sorted.find(
      (c) => c.name.toLowerCase() === r.name.toLowerCase() && matchInstitute(c.institute, r.institute)
    );
    if (orig) {
      matched.push({
        professor: orig,
        matchScore: Math.max(0, Math.min(100, r.matchScore)),
        reason: r.reason,
        confidence: r.confidence,
        conversionOpportunity: r.conversionOpportunity,
      });
    }
  }

  return matched.sort((a, b) => b.matchScore - a.matchScore);
}

export function fallbackRank(
  studentProfile: StudentProfile,
  candidates: ProfessorProfile[],
  targetInstitutes: string[]
): MatchResult[] {
  const isTargeted = targetInstitutes.length > 0;
  const eligible = isTargeted
    ? candidates.filter((c) => matchesAnyTarget(c.institute, targetInstitutes))
    : candidates;

  return eligible
    .map((prof) => {
      const reasons: string[] = [];
      const studentTokens = [
        ...studentProfile.skills,
        ...studentProfile.domains,
        ...studentProfile.interests,
      ].map((s) => s.toLowerCase());

      const matchingInterests = prof.researchInterests.filter((ri) => {
        const riLower = ri.toLowerCase();
        return studentTokens.some((si) => riLower.includes(si) || si.includes(riLower));
      });

      let score = 50;
      if (matchingInterests.length > 0) {
        score += Math.min(40, matchingInterests.length * 12);
        reasons.push(`Both your profile and Prof. ${prof.name} emphasize: ${matchingInterests.slice(0, 3).join(", ")}.`);
      }

      for (const proj of studentProfile.projects) {
        const projText = `${proj.title} ${proj.description} ${(proj.technologies || []).join(" ")}`.toLowerCase();
        const overlap = prof.researchInterests.filter((ri) => projText.includes(ri.toLowerCase()));
        if (overlap.length > 0) {
          score += 8;
          reasons.push(`Your project "${proj.title}" connects with their work on ${overlap[0]}.`);
          break;
        }
      }

      if (prof.conversionPotential === "Very High") score += 5;
      else if (prof.conversionPotential === "High") score += 3;

      if (reasons.length === 0) {
        reasons.push(`Prof. ${prof.name}'s research in ${prof.department} aligns broadly with your computing background.`);
      }

      const conversion =
        prof.instituteCategory === "Newer IIT"
          ? "High conversion potential: rapidly growing lab with active funded projects."
          : prof.instituteCategory === "IIIT"
          ? "High conversion potential: specialized research centers with regular intern intakes."
          : prof.instituteCategory === "NIT"
          ? "Strong conversion potential: faculty welcome collaborative research interns."
          : "Established institute: apply through formal summer research programs.";

      return {
        professor: prof,
        matchScore: Math.min(100, score),
        reason: reasons.slice(0, 3),
        confidence: score >= 75 ? "High" : "Medium",
        conversionOpportunity: conversion,
      } as MatchResult;
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 24);
}
