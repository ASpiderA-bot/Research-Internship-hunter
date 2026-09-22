import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || "development",

  LLM_PROVIDER: (process.env.LLM_PROVIDER || "gemini").toLowerCase(),
  GEMINI_API_KEY: cleanKey(process.env.GEMINI_API_KEY),
  GROQ_API_KEY: cleanKey(process.env.GROQ_API_KEY),
  GROQ_MODEL: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

  APP_URL: process.env.APP_URL || "http://localhost:3000",
  SEARCH_TIMEOUT_MS: Number(process.env.SEARCH_TIMEOUT_MS || 5000),
  SCRAPE_TIMEOUT_MS: Number(process.env.SCRAPE_TIMEOUT_MS || 4000),
  MAX_SEARCH_URLS: Number(process.env.MAX_SEARCH_URLS || 8),
  MAX_RESULTS: Number(process.env.MAX_RESULTS || 24),
  REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
} as const;

function cleanKey(key: string | undefined): string {
  if (!key) return "";
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export function validateGeminiKey(): void {
  const key = CONFIG.GEMINI_API_KEY;
  if (
    !key ||
    key === "MY_GEMINI_API_KEY" ||
    key === "YOUR_GEMINI_API_KEY" ||
    key === "GEMINI_API_KEY" ||
    key.toLowerCase().includes("placeholder")
  ) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Create a .env file and set GEMINI_API_KEY=your_actual_key."
    );
  }
}
