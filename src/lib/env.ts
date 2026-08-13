import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  EXTENSION_TOKEN_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  EXTENSION_ALLOWED_ORIGINS: z.string().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ANALYSIS_EXECUTION_MODE: z.enum(["inline", "bullmq"]).default("inline"),
  REDIS_HOST: z.string().min(1).default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),
}).superRefine((values, context) => {
  if (values.NODE_ENV !== "production") return;

  const authUrl = new URL(values.NEXTAUTH_URL);
  const isLoopbackOrigin = ["localhost", "127.0.0.1", "::1"].includes(authUrl.hostname);
  const isHostedDeployment = process.env.VERCEL === "1";

  // `next build` always uses NODE_ENV=production, including local builds.
  // Permit HTTP only for a local loopback origin; hosted deployments and all
  // non-local production origins must still use canonical HTTPS.
  if (
    (isHostedDeployment && isLoopbackOrigin) ||
    (!isLoopbackOrigin && authUrl.protocol !== "https:")
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["NEXTAUTH_URL"],
      message: "Non-local production authentication requires the canonical HTTPS site origin",
    });
  }

  if (values.NEXT_PUBLIC_SITE_URL) {
    const siteUrl = new URL(values.NEXT_PUBLIC_SITE_URL);
    if (siteUrl.origin !== authUrl.origin) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "Must use the same production origin as NEXTAUTH_URL",
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
