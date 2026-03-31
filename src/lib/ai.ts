import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const AI_CONFIG = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  maxInputTokens: 50_000,
};
