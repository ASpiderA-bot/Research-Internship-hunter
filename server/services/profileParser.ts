import type { StudentProfile } from "../../shared/types.ts";
import { generateJSON, Type, getPDFProvider } from "./llm/index.ts";

const STUDENT_SCHEMA = {
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
};

const PROMPT = `You are an expert career counselor and academic matchmaker. Analyze the provided resume. Extract the skills, broad domains (e.g., Computer Vision, Distributed Systems), deep interests/research topics (e.g., Large Language Models, Generative Adversarial Networks), academic/technical projects, and work/research experiences. Ensure you extract actual technologies mentioned. Return strictly conforming to the requested JSON schema.`;

export async function parseProfileFromText(textContent: string): Promise<StudentProfile> {
  return generateJSON<StudentProfile>(
    `Parse this resume text and convert it into a structured student profile.\n\nResume Text:\n${textContent}\n\n${PROMPT}`,
    STUDENT_SCHEMA,
    0.2
  );
}

export async function parseProfileFromPDF(pdfBase64: string): Promise<StudentProfile> {
  const provider = getPDFProvider();
  if (!provider.generateWithPDF) {
    throw new Error("Configured LLM provider does not support PDF parsing. Please paste resume text instead.");
  }
  return provider.generateWithPDF<StudentProfile>(pdfBase64, PROMPT, STUDENT_SCHEMA, 0.2);
}
