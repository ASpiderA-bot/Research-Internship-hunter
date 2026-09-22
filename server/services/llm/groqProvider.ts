import OpenAI from "openai";
import type { LLMProvider } from "./types.ts";
import { cleanJSONResponse, injectSchemaHint } from "./types.ts";

export class GroqProvider implements LLMProvider {
  name = "groq";
  supportsPDF = false;
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "llama-3.3-70b-versatile") {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    this.model = model;
  }

  async generateJSON<T>(
    prompt: string,
    schema: Record<string, unknown>,
    temperature = 0.2
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that always returns valid JSON matching the requested schema.",
        },
        { role: "user", content: injectSchemaHint(prompt, schema) },
      ],
      response_format: { type: "json_object" },
      temperature,
    });
    const text = cleanJSONResponse(response.choices[0]?.message?.content || "{}");
    return JSON.parse(text) as T;
  }

  async generateText(prompt: string, temperature = 0.4): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    });
    return response.choices[0]?.message?.content?.trim() || "";
  }
}
