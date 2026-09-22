import { GoogleGenAI, Type } from "@google/genai";
import type { LLMProvider } from "./types.ts";

export class GeminiProvider implements LLMProvider {
  name = "gemini";
  supportsPDF = true;
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "researchmatch-v2" } },
    });
  }

  async generateJSON<T>(
    prompt: string,
    schema: Record<string, unknown>,
    temperature = 0.2,
    model = "gemini-2.0-flash-lite"
  ): Promise<T> {
    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature,
      },
    });
    const text = response.text?.trim() || "{}";
    return JSON.parse(text) as T;
  }

  async generateText(prompt: string, temperature = 0.4, model = "gemini-2.0-flash-lite"): Promise<string> {
    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: { temperature },
    });
    return response.text?.trim() || "";
  }

  async generateWithPDF<T>(
    pdfBase64: string,
    prompt: string,
    schema: Record<string, unknown>,
    temperature = 0.2,
    model = "gemini-2.0-flash-lite"
  ): Promise<T> {
    const response = await this.client.models.generateContent({
      model,
      contents: [
        { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature,
      },
    });
    const text = response.text?.trim() || "{}";
    return JSON.parse(text) as T;
  }
}

export { Type };
