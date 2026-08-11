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
- a TCP-compatible Redis instance shared by the web process and BullMQ worker;
- a long-running analysis worker with Git, outbound network access, and writable temporary storage;
- Upstash REST credentials for distributed API and analysis rate limiting;
- a Gemini API key for AI-generated report detail.

Run the analysis worker with `npm run worker`. The worker must remain alive independently of the web process.

## Security and operations

- Never expose `NEXTAUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, Redis credentials, Gemini keys, or Sentry credentials to client code.
- Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin.
- Set `EXTENSION_ALLOWED_ORIGINS` to exact comma-separated extension origins. Wildcards are not accepted.
- Production API requests fail closed when the Upstash rate limiter is not configured or unavailable.
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
