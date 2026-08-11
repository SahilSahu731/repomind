# RepoMind

RepoMind analyzes public GitHub repositories and turns their structure, dependencies, entry points, technology choices, and contribution signals into a navigable engineering report.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and replace the development values you need.
3. Run the web application with `npm run dev`.

When Supabase is intentionally left at the example URL outside production, account and workspace data use the ignored `.repomind/` development store and analysis runs inline. Production fails closed instead of using that fallback.

## Production architecture

RepoMind is not a static export. A production deployment needs:

- the Next.js web process (`npm run build`, then `npm run start`);
- Supabase Auth and the schema in `supabase/schema.sql` using a server-only service-role key;
- Git, outbound network access, and writable temporary storage on the process running analysis;
- optionally, a Gemini API key for richer AI-generated report explanations.

The first-release default, `ANALYSIS_EXECUTION_MODE=inline`, serializes jobs inside one long-running web process and needs no Redis. This mode is not reliable on serverless hosting because the host may stop work after the API response. For later scaling, set the mode to `bullmq`, configure TCP Redis, and run `npm run worker` as a separate long-running process.

Upstash is also optional for the first release. Without it, RepoMind applies a bounded in-memory rate limiter suitable for one application instance. Configure Upstash before adding multiple web instances because memory limits are not shared across processes.

## Security and operations

- Never expose `NEXTAUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, Redis credentials, Gemini keys, or Sentry credentials to client code.
- Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin.
- Set `EXTENSION_ALLOWED_ORIGINS` to exact comma-separated extension origins. Wildcards are not accepted.
- API requests use Upstash when configured and otherwise fall back to per-instance memory limits.
- Sentry error monitoring is enabled only in production when its DSNs are configured. Default personal-information collection and session replay are disabled.
- The application intentionally contains no placeholder analytics collector. Add a reviewed, consent-aware analytics provider only when there is a real measurement requirement.

## Release checks

```bash
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

After deployment, test email and GitHub authentication, a complete repository analysis, credit deduction, report persistence, invalid-repository handling, extension CORS, rate-limit responses, error reporting, and all legal/support routes.
