import { z } from "zod";

export const githubUrlSchema = z
  .string()
  .url()
  .regex(
    /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/tree\/[\w./-]+)?$/,
    "Must be a valid GitHub repository URL"
  );

export const analyzeSchema = z.object({
  githubUrl: githubUrlSchema,
});

export type AnalyzeRequest = z.infer<typeof analyzeSchema>;
