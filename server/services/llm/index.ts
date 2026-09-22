import { CONFIG } from "../../utils/config.ts";
import { AppError } from "../../utils/errors.ts";
import { GeminiProvider } from "./geminiProvider.ts";
import { GroqProvider } from "./groqProvider.ts";
import type { LLMProvider } from "./types.ts";

export { Type } from "./geminiProvider.ts";

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const provider = CONFIG.LLM_PROVIDER.toLowerCase();

  if (provider === "groq") {
    if (!CONFIG.GROQ_API_KEY) {
      throw new AppError(
        "GROQ_API_KEY is not configured. Set it in your .env file.",
        503,
        "MISSING_GROQ_KEY"
      );
    }
    cachedProvider = new GroqProvider(CONFIG.GROQ_API_KEY, CONFIG.GROQ_MODEL);
  } else if (provider === "gemini") {
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY.includes("placeholder")) {
      throw new AppError(
        "GEMINI_API_KEY is not configured. Set it in your .env file.",
        503,
        "MISSING_GEMINI_KEY"
      );
    }
    cachedProvider = new GeminiProvider(CONFIG.GEMINI_API_KEY);
  } else {
    throw new AppError(
      `Unsupported LLM provider: ${CONFIG.LLM_PROVIDER}. Use 'gemini' or 'groq'.`,
      503,
      "UNSUPPORTED_LLM_PROVIDER"
    );
  }

  return cachedProvider;
}

export function getPDFProvider(): LLMProvider {
  if (CONFIG.GEMINI_API_KEY && !CONFIG.GEMINI_API_KEY.includes("placeholder")) {
    return new GeminiProvider(CONFIG.GEMINI_API_KEY);
  }
  const primary = getLLMProvider();
  if (primary.supportsPDF) return primary;
  throw new AppError(
    "PDF parsing requires GEMINI_API_KEY because the configured provider does not support PDF input. Please paste resume text instead.",
    503,
    "PDF_NOT_SUPPORTED"
  );
}

export async function generateJSON<T>(
  prompt: string,
  schema: Record<string, unknown>,
  temperature?: number
): Promise<T> {
  return getLLMProvider().generateJSON<T>(prompt, schema, temperature);
}

export async function generateText(prompt: string, temperature?: number): Promise<string> {
  return getLLMProvider().generateText(prompt, temperature);
}

export { GeminiProvider, GroqProvider };
export type { LLMProvider };
