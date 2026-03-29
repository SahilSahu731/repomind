# RepoMind Coding Standards

## API Response Envelope

ALL API responses must follow this EXACT structure:

### Success Response (2xx)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_CONSTANT",
    "message": "Human-readable error message"
  }
}
```

## Error Codes Registry

Every error response must use one of these standardized codes:

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_URL` | 400 | URL format or GitHub path invalid |
| `UNAUTHORIZED` | 401 | No session or insufficient permissions |
| `CREDITS_EXHAUSTED` | 402 | User out of free analysis credits |
| `RATE_LIMITED` | 429 | Too many requests |
| `REPO_NOT_FOUND` | 404 | Repository doesn't exist or is private |
| `BRANCH_NOT_FOUND` | 404 | Specified branch doesn't exist |
| `CLONE_TIMEOUT` | 504 | Git clone exceeded 60 seconds |
| `CLONE_FAILED` | 500 | Git clone other failure |
| `INVALID_SIGNATURE` | 400 | Payment/webhook signature mismatch |
| `ANALYSIS_FAILED` | 500 | Async job failed to complete |
| `TIMEOUT` | 504 | Job exceeded max duration |
| `PAYMENT_NOT_FOUND` | 404 | Payment record not found |
| `INVALID_PLAN` | 400 | Plan type doesn't exist |

## File Naming Conventions

### Components (React/TSX)
- **Format**: `PascalCase.tsx`
- **Examples**: `RepoInput.tsx`, `DashboardSidebar.tsx`, `DependencyGraph.tsx`
- **Exports**: Default export of component, named exports for types/utils

### Utilities & Services (TypeScript)
- **Format**: `camelCase.ts`
- **Examples**: `dbUtils.ts`, `ratelimit.ts`, `cloner.ts`
- **Exports**: Named exports, no default exports

### API Routes
- **Format**: `lowercase-with-hyphens`
- **Examples**: `/api/repos/analyze` → `route.ts`, `/api/payments/create-order` → `route.ts`
- **Exports**: `GET`, `POST`, `PATCH`, `DELETE` as needed

### Configuration Files
- **Format**: `camelCase.ts` or `.config.ts`
- **Examples**: `site.ts`, `plans.ts`, `next.config.ts`

## TypeScript Standards

1. **Explicit Return Types**
   ```typescript
   // ✅ Good
   export async function cloneRepo(url: string): Promise<void> { }
   
   // ❌ Bad
   export async function cloneRepo(url: string) { }
   ```

2. **No `any` Type**
   - Use `unknown` then narrow with type guards
   - Use generics for flexible typing
   - Use `@ts-expect-error` only with comment explaining why

3. **Interfaces Over Types for Objects**
   ```typescript
   // ✅ Good
   interface FileNode {
     path: string;
     type: "file" | "dir";
   }
   
   // Acceptable
   type FileNode = {
     path: string;
     type: "file" | "dir";
   };
   ```

4. **Strict Null Checks**
   - Always check for null/undefined
   - Use optional chaining `?.`
   - Use nullish coalescing `??`

## Git Commit Format

```bash
[PHASE-N] Brief description of what was completed

Longer explanation if needed. Reference the phase and main deliverables.
Example: [PHASE-1] Install all dependencies and verify build
```

### Commit Frequency
- **Minimum**: After each phase completion
- **Recommended**: Multiple commits per phase if working on distinct sections
- **Key points**: After database setup, after auth is working, after major API section

## Code Organization

### Folder Structure (src/)
```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # React components (ui, layout, features)
├── hooks/            # Custom React hooks
├── lib/             # Utilities, services, and business logic
├── types/           # TypeScript type definitions
├── config/          # Configuration files
├── middleware.ts    # Next.js middleware
└── worker.ts        # BullMQ worker process
```

### Import Path Aliases
- Use `@/*` alias for all imports: `import { db } from "@/lib/db"`
- Never use relative imports like `../../../`

## Testing & Quality Gates

### Build Gates (Before commit)
```bash
npm run lint          # ESLint must pass
npm run typecheck     # TypeScript strict mode
npm run build         # Next.js build must complete
```

### Development Gates
- No `console.log()` left in final code (use proper logging)
- No commented-out code blocks
- No TODO comments without a date/person assigned

## Environment Variables

### Rules
1. **Never commit** `.env.local` (in .gitignore)
2. **Always commit** `.env.example` with all keys/no values
3. **Validation**: Use `env.ts` to validate at build time
4. **Prefix**: Public vars must be `NEXT_PUBLIC_` (exposed to browser)

### Required Vars
See `.env.example` for the complete list. Never add a new env var without:
1. Adding it to `.env.example`
2. Documenting it in a comment
3. Validating it in `env.ts`

## API Endpoint Standards

### Request Validation
- **Use Zod** for all request bodies
- **Validate types**: Never trust client input
- **Return 400** for validation failures with specific error

### Response Format
- Always use `successResponse()` and `errorResponse()` helpers
- Never return raw data
- Include metadata (pagination, timestamps) when relevant

### Status Codes
- `200` — Success, response body with result
- `201` — Created (rarely used in SPA, return 200 instead)
- `202` — Accepted (async operations like job submission)
- `400` — Bad request (validation failed)
- `401` — Unauthorized (auth required)
- `402` — Payment required (credits exhausted)
- `404` — Not found
- `429` — Too many requests
- `500` — Server error
- `504` — Gateway timeout (operation took too long)

## Database Standards

### Prisma Schema
- **Naming**: Use `camelCase` for TypeScript, schema uses `PascalCase` for models
- **Indexes**: Add on foreign keys and frequently filtered fields
- **Relations**: Use `onDelete: Cascade` for cleanup, `onDelete: Restrict` for protection
- **Enums**: Use for fixed sets of values (Plan, RepoStatus, etc.)

### Queries
- Use `select()` to only fetch needed fields
- Use `include()` for related data only when necessary
- Always use transactions for multi-step operations

## Component Standards

### React/TypeScript
- Use `"use client"` at top for client components
- Props interface: `interface {ComponentName}Props { ... }`
- No prop drilling deeper than 2 levels (use Context or zustand)
- Always memoize expensive components (`React.memo`)

### Styling
- Use Tailwind utilities, not custom CSS when possible
- Use `cn()` helper to merge Tailwind classes
- Maintain dark mode consistency (CSS variables defined in `globals.css`)

## Error Handling

### API Routes
```typescript
try {
  // Logic here
  return successResponse(data);
} catch (error) {
  console.error("Context:", error);
  return errorResponse("ERROR_CODE", ERROR_MESSAGES.ERROR_CODE);
}
```

### Services
- Throw `Error` with message matching error code
- Let caller handle and map to response

### Frontend
- Wrap mutations with try/catch
- Show toast notifications for errors
- Log to Sentry for production errors

## Security Checklist

Every endpoint must verify:
- [ ] User session exists (auth check)
- [ ] User owns the resource (permission check)
- [ ] Rate limits are enforced
- [ ] Input is validated with Zod
- [ ] No sensitive data in logs
- [ ] SQL injection impossible (Prisma handles)
- [ ] CSRF protected (NextAuth handles)

## Performance Standards

### Target Metrics
- Analyze endpoint: Returns job ID in <1.5s
- Analysis completion: <5 minutes for repos up to 5,000 files
- API responses: <500ms for simple queries
- Frontend page load: <2s (Lighthouse target 80+)

### Optimization Rules
- Use `next/image` for all images
- Code-split large components with `next/dynamic`
- Use React Query for caching
- Memoize heavy computations

## Logging Standards

### Structure (JSON format)
```typescript
console.log(JSON.stringify({
  level: "info",                    // info, warn, error
  timestamp: new Date().toISOString(),
  userId: user?.id,                 // Redact sensitive
  action: "repo_analysis_started",
  context: { repoId, jobId },
}));
```

### What to Log
- Authentication events (login, logout)
- Analysis job lifecycle (started, completed, failed)
- Errors with stack traces
- Performance metrics (job duration)

### What NOT to Log
- Environment variables or secrets
- Full request/response bodies
- Passwords or API keys
- Personal user data beyond IDs

---

**Last Updated**: March 29, 2026
**Version**: 1.0 (MVP Baseline)
