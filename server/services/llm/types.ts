export interface LLMProvider {
  name: string;
  supportsPDF: boolean;

  generateJSON<T>(prompt: string, schema: Record<string, unknown>, temperature?: number): Promise<T>;
  generateText(prompt: string, temperature?: number): Promise<string>;
  generateWithPDF?<T>(pdfBase64: string, prompt: string, schema: Record<string, unknown>, temperature?: number): Promise<T>;
}

export function cleanJSONResponse(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export function injectSchemaHint(prompt: string, schema: Record<string, unknown>): string {
  return `${prompt}\n\nReturn your response as a single JSON object matching this schema:\n${JSON.stringify(schema, null, 2)}\n\nDo not include markdown code fences or any text outside the JSON object.`;
}
