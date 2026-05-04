import { env } from "@/lib/env";

export const AI_CONFIG = {
  model: "gemini-2.5-flash",
  maxOutputTokens: 8192,
  temperature: 0.2,
} as const;

interface GeminiRequest {
  prompt: string;
  responseMimeType?: "application/json" | "text/plain";
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export function hasGeminiKey(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

export async function generateWithGemini({
  prompt,
  responseMimeType = "application/json",
}: GeminiRequest): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_KEY_MISSING");
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent` +
    `?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: AI_CONFIG.temperature,
        maxOutputTokens: AI_CONFIG.maxOutputTokens,
        responseMimeType,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GEMINI_REQUEST_FAILED:${response.status}:${body}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("GEMINI_EMPTY_RESPONSE");
  }

  return text;
}
