import { z } from "zod";

const optionalString = (minimumLength = 1) =>
  z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().min(minimumLength).optional(),
  );

const optionalPositiveInteger = z.preprocess(
  (value) => value === "" || value === undefined ? undefined : value,
  z.coerce.number().int().positive().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // GitHub App
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_APP_ID: optionalPositiveInteger,
    GITHUB_APP_SLUG: optionalString(),
    GITHUB_APP_PRIVATE_KEY: optionalString(),
    GITHUB_WEBHOOK_SECRET: optionalString(16),

    // Auth + encryption
    NEXTAUTH_SECRET: z.string().min(32),
    SERVER_ENCRYPTION_KEY: optionalString(32),
    NEXTAUTH_URL: z.string().url(),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

    EXTENSION_ALLOWED_ORIGINS: z.string().optional(),
    EXTENSION_TOKEN_SECRET: z.string().min(32).optional(),

    // Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    WORKSPACE_DATABASE_MODE: z
      .enum(["local", "supabase"])
      .default("local"),

    DATABASE_URL: z.string().optional(),
    DIRECT_URL: z.string().optional(),

    // Optional distributed API rate limiting
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Analysis queue
    ANALYSIS_EXECUTION_MODE: z
      .enum(["inline", "bullmq"])
      .default("inline"),

    REDIS_URL: z.string().url().optional(),

    REDIS_HOST: z.string().min(1).default("127.0.0.1"),

    REDIS_PORT: z.coerce
      .number()
      .int()
      .positive()
      .default(6379),

    REDIS_PASSWORD: z.string().optional(),

    ANALYSIS_WORKER_CONCURRENCY: z.coerce
      .number()
      .int()
      .min(1)
      .max(16)
      .default(2),

    ANALYSIS_JOB_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(5)
      .default(3),

    // AI
    GEMINI_API_KEY: z.string().optional(),

    // Future billing
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

    // Monitoring/support
    SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

    NEXT_PUBLIC_SUPPORT_EMAIL: z
      .string()
      .email()
      .optional(),

    RESEND_API_KEY: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== "production") {
      return;
    }

    if (!values.SERVER_ENCRYPTION_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SERVER_ENCRYPTION_KEY"],
        message: "A separate server encryption key is required in production",
      });
    }

    if (!values.SUPABASE_SERVICE_ROLE_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SUPABASE_SERVICE_ROLE_KEY"],
        message: "The Supabase service role key is required in production",
      });
    }

    const authUrl = new URL(values.NEXTAUTH_URL);

    const isLoopbackOrigin = [
      "localhost",
      "127.0.0.1",
      "::1",
    ].includes(authUrl.hostname);

    const isHostedDeployment = process.env.VERCEL === "1";

    if (
      (isHostedDeployment && isLoopbackOrigin) ||
      (!isLoopbackOrigin && authUrl.protocol !== "https:")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXTAUTH_URL"],
        message:
          "Non-local production authentication requires the canonical HTTPS site origin",
      });
    }

    if (values.NEXT_PUBLIC_SITE_URL) {
      const siteUrl = new URL(values.NEXT_PUBLIC_SITE_URL);

      if (siteUrl.origin !== authUrl.origin) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NEXT_PUBLIC_SITE_URL"],
          message:
            "Must use the same production origin as NEXTAUTH_URL",
        });
      }
    }

    // Critical:
    // Never perform long repository analysis inside Vercel/serverless.
    if (values.ANALYSIS_EXECUTION_MODE !== "bullmq") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ANALYSIS_EXECUTION_MODE"],
        message:
          "Production analysis must run through BullMQ, never inline inside the web process",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map(
      (issue) =>
        `${issue.path.join(".")}: ${issue.message}`,
    )
    .join("\n");

  throw new Error(
    `Invalid environment configuration:\n${issues}`,
  );
}

export const env = parsed.data;
