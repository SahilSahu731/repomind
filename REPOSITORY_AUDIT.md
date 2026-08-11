# RepoMind Repository and Website Audit

Audit date: August 11, 2026  
Scope: 115 authored application, extension, configuration, schema, and public-asset files; 9,136 authored source lines. Generated extension bundles were inspected as build artifacts. Third-party `node_modules` source was not treated as project-authored code.

## Executive summary

RepoMind has a credible product core: a Next.js application, Supabase-backed persistence, a BullMQ worker, deterministic repository parsing, AI-assisted architectural synthesis, and a feature-rich Chrome side panel. The main application type-checks and builds successfully. The redesigned landing page now communicates that core with a clear, original, Anthropic-inspired editorial system.

The repository is not production-ready yet. The most serious blockers are:

1. The browser extension authentication contract is incomplete and internally inconsistent.
2. Untrusted repositories are cloned and parsed on the worker host without symlink isolation or a process sandbox.
3. Free credits can be reset from stale JWT values, making enforcement unreliable.
4. Several signed-in pages display invented billing, activity, security, and settings data.
5. The root production dependency audit reports 21 advisories, including one critical and eight high-severity findings.
6. There are no automated tests or CI workflows.

## What was improved in this pass

### Landing page

- Reordered the page around a proper conversion story: promise → evidence → workflow → analyzer → pricing CTA.
- Replaced the dark SaaS-card visual language with a warm editorial system influenced by the current [Anthropic homepage](https://www.anthropic.com/): large idea-led typography, generous space, strong rules, restrained coral/green accents, and an intentionally quiet navigation.
- Created an original RepoMind system-map illustration based on real output types: repository tree, dependency graph, contribution score, and onboarding route.
- Removed fabricated “live” scan counts and confidence percentages.
- Removed the false “no signup required” statement; the analyze endpoint requires authentication.
- Removed the broken trust strip referencing nonexistent `/icons/vercel.svg`, `/icons/github.svg`, and `/icons/stripe.svg` files.
- Replaced dead `href="#"` footer links with routes that exist.
- Added responsive mobile navigation, Escape-key dismissal, correct expanded-state semantics, a skip link, visible focus treatment, and reduced-motion handling.
- Grounded all landing-page claims in implemented repository behavior.

### Discoverability and sharing

- Corrected Metadata API usage and removed placeholder `repomind.example` URLs.
- Added a title template, keywords, Open Graph data, Twitter metadata, JSON-LD, `robots.txt`, and `sitemap.xml`.
- Rebuilt the Open Graph SVG in the new visual language.
- Added an on-brand, accessible 404 page.
- Updated Proxy handling so metadata, public assets, and unknown routes can resolve instead of redirecting anonymous visitors to login.

### Quality gates

- Excluded generated extension bundles from ESLint.
- Removed unsafe `any` usage from the D3 graph implementation and corrected its misleading “click for details” instruction.
- Fixed extension effect dependency warnings and Vite-specific image lint handling.
- Preserved and made the existing analytics scaffold type-safe.
- Verified the main app with full lint, TypeScript, and production build.
- Installed extension dependencies and verified its TypeScript + Vite production build.

## Severity-ranked findings

### P0 — launch blockers

#### 1. Extension authentication cannot complete reliably

Files: `src/app/api/ext/auth/callback/route.ts`, `src/app/api/ext/auth/login/route.ts`, `extension/background/worker.ts`, `extension/background/api.ts`, `src/app/api/ext/**`, `src/proxy.ts`

- The callback creates `redirectUrl` with a token but never redirects to it; it returns HTML at the callback URL instead.
- The background worker waits for a callback URL containing `?token=...`, so it normally receives nothing to store.
- The “token” is only base64-encoded JSON containing `userId` and a timestamp. It is unsigned, unverifiable, and has no expiry enforcement.
- Extension API routes call `getServerSession()`, not bearer-token verification. A stored extension token therefore does not authenticate extension requests.
- Cross-origin extension requests do not automatically share the browser’s NextAuth cookie under the current fetch configuration.
- `manifest.json` grants GitHub host access but not `https://repomind.vercel.app/*`, even though the background service worker calls that origin.

Needed: define a single extension-auth protocol using a signed, short-lived server-issued JWT or a Supabase access token; validate it in every extension endpoint; add the API origin to host permissions; implement refresh/revocation; test the complete Chrome login round trip.

#### 2. Repository processing is not isolated from the worker host

Files: `src/lib/services/cloner.ts`, `parser.ts`, `graphBuilder.ts`, `techDetector.ts`, `src/worker.ts`

- A public repository is untrusted input. Git symlinks are preserved, and the parser uses filesystem calls that follow symlinks.
- A malicious repository can point a file or README/package path at host-readable files. Even where content is not returned directly, it can enter parsing or AI context paths.
- Cloning and parsing run directly on the worker host without a container, seccomp profile, mount namespace, read-only filesystem, egress restriction, or per-job resource limit.
- `execSync()` constructs a shell command. Current URL validation restricts metacharacters, but `execFile()`/`spawn()` with argument arrays is still the correct defense-in-depth boundary.

Needed: process each repository in a disposable sandbox; reject symlinks and paths escaping the clone root using realpath checks; use `execFile`; apply CPU, memory, file-count, disk, duration, and network limits; run as an unprivileged user.

#### 3. Signed-in product surfaces present fictional customer data

Files: `src/app/(user)/user/activity/page.tsx`, `billing/page.tsx`, `profile/page.tsx`, `settings/page.tsx`

- Activity shows four hard-coded repository events.
- Billing shows a fixed renewal date, US-dollar invoices, and a fixed 72% progress bar, while configured plans use INR and no payment endpoints exist.
- Profile claims an owner role, recommends 2FA, and shows a fixed last-login date without backing data.
- Settings present preferences and automation guardrails that cannot be changed and are not persisted.

This is a trust and compliance risk, not harmless placeholder copy. Replace with real data, explicit empty states, or clearly labeled previews before any public launch.

#### 4. Production dependencies include critical/high advisories

Files: `package.json`, `package-lock.json`

`npm audit --omit=dev` reports 21 vulnerabilities: 1 low, 11 moderate, 8 high, and 1 critical. Notable direct dependency surfaces include Next.js 16.2.1, NextAuth 4.24.13, Nano ID 4.0.2, BullMQ 5.71.1, Sentry 10.46.0, Razorpay’s Axios chain, and the unused Anthropic SDK 0.80.0.

Needed: remove unused dependencies first; apply non-breaking transitive fixes; plan and test the Next.js, NextAuth/Auth.js, Nano ID, BullMQ, Sentry, and Anthropic SDK upgrades. Do not use `npm audit fix --force` without migration review.

### P1 — high priority

#### 5. Credit and plan enforcement can be reset from stale sessions

Files: `src/lib/auth.ts`, `UserSessionSync.tsx`, `src/app/api/repos/analyze/route.ts`, `src/app/api/ext/analyze/route.ts`, `src/lib/supabaseDb.ts`, `src/worker.ts`

- JWT/session callbacks hard-code `plan = "FREE"` and initialize three credits.
- `ensureUserExists()` updates the database with the session’s plan and credits on analysis requests.
- After the worker decrements a database credit, a later request can write the stale session value back, restoring credits.
- Plan changes in the database do not become the session source of truth.
- Credit check and decrement are separated, so concurrent jobs can overspend.

Needed: read plan/credits from the database server-side; never write entitlement state from a client-derived session; atomically reserve/decrement a credit when accepting a job; refund on qualifying failures through a transaction or stored procedure.

#### 6. Data ownership boundaries are inconsistent

Files: `src/lib/supabaseDb.ts`, `src/app/api/repos/[repoId]/route.ts`, `src/app/api/ext/results/[repoId]/route.ts`, `status/[jobId]/route.ts`, `chat/route.ts`, `compare/route.ts`

- Web repo detail correctly filters by user ownership.
- Extension results and status look up IDs without checking the requesting user owns the repo/job.
- Chat accepts any `repoId` and loads its analysis without an ownership check.
- Compare finds cached repos globally, not for the current user.
- Cache lookup is global. It can return another user’s repo ID; the web detail endpoint then correctly rejects it, creating a broken cache-hit experience.

Needed: centralize authorization helpers and require user ownership (or an explicit, revocable share grant) for every read. Separate deduplicated analysis artifacts from user-owned repository records.

#### 7. Supabase schema lacks row-level security

Files: `supabase/schema.sql`, `src/lib/supabaseDb.ts`

- RLS is not enabled and no policies are defined.
- The data layer falls back from `SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_ANON_KEY`; with no appropriate policies, this is either unsafe or nonfunctional depending on project defaults.
- Table-name fallback across multiple legacy naming schemes increases ambiguity and hides migration drift.
- Credit decrement is a read-then-write race rather than an atomic database operation.

Needed: settle one schema, add migrations, enable RLS, define owner policies, keep service-role usage server-only, add atomic entitlement functions, and generate database types.

#### 8. API validation and rate limiting are uneven

Files: all `src/app/api/**/route.ts`, `src/lib/validations/**`, `src/lib/ratelimit.ts`

- Main signup/analyze routes use Zod; several extension routes cast arbitrary JSON directly.
- Chat message/history length is unbounded and has no explicit rate limit.
- Results/status IDs are checked only for presence.
- When Upstash is not configured, all rate limit functions fail open.
- CORS returns `*` for unrecognized or absent origins, and `next.config.ts` independently adds wildcard CORS to all extension routes.
- Some extension routes use hard-coded error codes outside the central registry.

Needed: Zod schemas for every body/query/param; request and prompt size limits; fail-closed production rate limiting; one CORS implementation with exact extension IDs; consistent error envelopes.

#### 9. There is no test or CI safety net

Files: repository-wide

- No unit, integration, component, end-to-end, accessibility, Proxy, worker, or extension tests exist.
- No `.github/workflows` or equivalent CI configuration exists.
- Critical flows—signup, auth callback, analysis queueing, ownership, credit consumption, malicious repo handling, and extension messaging—are unverified.

Minimum gate: lint, main typecheck/build, extension typecheck/build, route integration tests, worker fixture tests, Playwright landing/auth/dashboard tests, and dependency audit reporting.

#### 10. Payment architecture is declared but not implemented

Files: `src/config/plans.ts`, `src/lib/razorpay.ts`, `src/lib/validations/payment.ts`, billing page

- Razorpay configuration and validation types exist, but create-order, verify-payment, subscription, and webhook routes do not.
- There is no payment/subscription schema, invoice source, idempotency handling, webhook replay protection, or entitlement update transaction.
- `razorpay.ts` reads environment variables directly with non-null assertions instead of the validated `env` object.

Until implemented, pricing should be treated as positioning, not an operable checkout.

### P2 — product and engineering quality

#### 11. “AI analysis” sees limited source content

Files: `src/lib/services/analyzer.ts`, `src/lib/ai.ts`

The AI prompt includes README, package.json, file paths, line counts, entry points, dependency degrees, and detected stack. It does not include representative source bodies. The result can provide useful structural synthesis but cannot deeply reason about most implementation logic, function behavior, or vulnerabilities. File summaries are therefore inferred primarily from names and graph position.

Needed: secure source chunk selection, secret scanning/redaction, token budgeting, retrieval by architectural importance, provenance/citations to files, and confidence indicators.

#### 12. Static analysis is JavaScript/TypeScript-centric and contains accuracy bugs

Files: `parser.ts`, `graphBuilder.ts`, `techDetector.ts`, `entryDetector.ts`, `contributionScore.ts`

- Dependency parsing supports JS/TS import forms only; Python and other advertised languages get nodes but not dependency edges.
- `@/` aliases are resolved relative to the importing file rather than the repository root, so many Next.js edges are missed.
- Graph component count is hard-coded to `1`.
- Duplicate edges are possible across patterns.
- Primary language is selected by file count, not lines or bytes.
- Tech detection focuses on one package manifest and will under-report monorepos.
- Framework detection and contribution scoring use filename heuristics rather than parsed configuration/API evidence.

#### 13. Documentation contradicts the implementation

Files: `README.md`, `IMPLEMENTATION.md`, `STANDARDS.md`, `CLAUDE.md`, `AGENTS.md`

- README is still the create-next-app template and points to the wrong source path.
- IMPLEMENTATION is a long initial plan containing obsolete Prisma-oriented examples and code that differs from the current Supabase REST implementation.
- STANDARDS requires `.env.example`, complete quality gates, explicit return types, and no `any`; several were previously unmet and `.env.example` is absent.
- STANDARDS describes Prisma conventions although Prisma is not installed.
- AGENTS/CLAUDE correctly route contributors to the local Next.js documentation rule.

Needed: replace README with product architecture, setup, worker, extension, environment, migration, and operations instructions; mark the implementation plan historical or rewrite it as current architecture decisions.

#### 14. Environment and deployment readiness are incomplete

Files: `.gitignore`, `src/lib/env.ts`, `next.config.ts`, `src/config/site.ts`, package scripts

- `.env.local` is correctly ignored, but `.env.example` is missing.
- No Dockerfile, worker deployment definition, Redis/Supabase local stack, or health/readiness split exists.
- No Content Security Policy, HSTS, frame restriction, Referrer-Policy, or Permissions-Policy is configured.
- Sentry packages and DSNs exist, but no instrumentation files initialize Sentry.
- Analytics currently pushes to an in-memory `dataLayer`; no provider consumes it.
- `NEXTAUTH_URL` doubles as the canonical marketing URL, which is workable but couples auth and site metadata.

#### 15. The signed-in web app is much thinner than the extension

Files: `src/app/(user)/**`, `src/components/UserWorkspaceLayout.tsx`

- Dashboard is a single long page; the extension has richer architecture, graph, guide, files, chat, and compare tabs.
- The web dashboard calculates hotspot bars but does not render an interactive graph or file tree.
- The repository-list API exists, but there is no repository library/history UI.
- Profile/settings have no forms or mutations.
- There are no route-level loading/error boundaries.
- Large client components increase hydration cost and complicate testing.

#### 16. Extension maintainability needs consolidation

Files: `extension/background/**`, `content/**`, `panel/**`, `shared/types.ts`, `dist/**`

- API base URL is hard-coded; local development requires source editing.
- Source and generated `dist` are both tracked, which creates noisy diffs and stale-bundle risk.
- Root and extension React/type versions differ.
- Panel CSS is a large global stylesheet with inline styles layered on top.
- The rebuilt panel bundle is about 458 kB (142 kB gzip); D3 and Markdown are major candidates for lazy-loading by tab.
- `innerHTML` is used in the GitHub content script. Current interpolated values should remain strictly escaped/controlled.

### P3 — polish and growth

- Add real product screenshots or interactive result samples once backed by stable fixtures.
- Add customer evidence only after customers explicitly approve names/logos.
- Add docs, changelog, privacy, terms, security, contact, and responsible-disclosure pages before public launch.
- Add a real pricing comparison and FAQ after entitlements and checkout exist.
- Add event analytics for hero CTA, analyzer validation, auth conversion, job completion, and return usage.
- Add localization/currency strategy if INR is intentional for a broader audience.

## File coverage map

Every authored area was inspected. The most important disposition by group is below.

| Area | Files reviewed | Disposition |
| --- | --- | --- |
| Root configuration | `package*.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `tailwind.config.js`, `.gitignore` | Builds; dependency/security, duplicate Tailwind-era config, and deployment gaps noted |
| Contributor docs | `README.md`, `IMPLEMENTATION.md`, `STANDARDS.md`, `AGENTS.md`, `CLAUDE.md` | README/plan materially stale; rules reviewed before Next.js edits |
| Root app shell | `layout.tsx`, `globals.css`, `proxy.ts`, providers, analytics, structured data | Improved metadata, public routing, accessibility, analytics typing |
| Marketing route | `(home)/**`, Navbar, Footer, all `components/landing/**`, public OG asset | Fully redesigned and verified at desktop/mobile sizes |
| Auth UI/API | `(auth)/**`, `AuthFrame`, signup route, NextAuth route, auth validation/types/helpers | Functional baseline; entitlement source and extension auth need redesign |
| User UI | `(user)/**`, workspace layout/session sync/store | Dashboard has real report data; activity/billing/profile/settings contain placeholders |
| Core APIs | repo list/detail/analyze, health, response/error helpers | Ownership good in web detail; validation/rate-limit consistency gaps remain |
| Extension APIs | all `api/ext/**` routes | Auth contract and ownership are launch blockers |
| Persistence | `supabase/schema.sql`, `supabaseDb.ts`, `db.ts` | REST layer works structurally; needs one schema, RLS, migrations, atomic operations |
| Queue/worker | `queue.ts`, `redis.ts`, `worker.ts`, job types | Coherent pipeline; sandboxing, retry/idempotency, and ops controls missing |
| Analysis services | cloner, parser, tech/entry detection, graph, analyzer, contribution score, constants | Useful MVP heuristics; security and accuracy limitations documented above |
| AI | `ai.ts`, analyzer prompt/fallback | Gemini integration works by contract; source-depth and provenance are limited |
| Billing | plans, Razorpay wrapper, payment validation, billing page | Configuration stubs only; no checkout lifecycle |
| Extension background | API client, cache, worker | Typed messaging/cache foundation; auth and host permission issues block production |
| Extension content | detector and CSS | GitHub integration is substantial; DOM injection should stay tightly controlled |
| Extension panel | App/store/styles and all nine view components | Richest product UI; now lints/builds; bundle and hook architecture can improve |
| Public/generated assets | favicon, default SVGs, OG SVG, extension icons/dist | OG updated; unused create-next-app SVGs can be removed; dist rebuilt |

## Verification results

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass; 23 routes generated including robots/sitemap |
| `extension: npm run build` | Pass; TypeScript and Vite production bundle |
| Desktop rendered inspection | Pass at 1440 × 1100 |
| Mobile rendered inspection | Pass at 390 × 844; responsive hero/navigation confirmed |
| Extension production dependency audit | Pass; 0 production advisories |
| Root production dependency audit | Fail; 21 advisories (1 critical, 8 high) |

## Recommended delivery order

### Before any external beta

1. Sandbox repository processing and reject symlinks.
2. Replace the extension auth protocol end to end.
3. Fix ownership checks on every extension API.
4. Remove all fabricated account/workspace data.
5. Fix credit atomicity and database-sourced entitlements.
6. Upgrade/remove vulnerable production dependencies.
7. Add minimum integration and end-to-end tests in CI.

### Before paid launch

1. Implement the complete payment/webhook/entitlement lifecycle.
2. Enable RLS and move to versioned database migrations.
3. Add security headers, Sentry instrumentation, structured logs, alerts, and worker health checks.
4. Add real repository history, billing history, profile/settings mutations, and empty states.
5. Add legal/security/support pages and a documented data-retention policy.

### Product quality after safety

1. Improve graph accuracy, multi-language support, monorepo handling, and component calculation.
2. Add secure representative source retrieval with citations and confidence.
3. Bring extension navigation (graph/files/chat/compare) to the web workspace.
4. Add honest fixture-backed product demos and measurable conversion analytics.
