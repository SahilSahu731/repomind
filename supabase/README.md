# Supabase setup

RepoMind uses Supabase Auth for email/password accounts and the Supabase REST API for workspace data.

## 1. Create the database schema

Open the Supabase project dashboard, select **SQL Editor**, create a new query, paste the full contents of [`schema.sql`](./schema.sql), and run it once. The script is idempotent and can be run again when it gains additive migrations.

## 2. Configure the server

Add these values to the root `.env.local` file:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

The service-role key must never use a `NEXT_PUBLIC_` prefix or be sent to the browser. Find it under the project's API keys/settings area in Supabase.

Restart the Next.js development server after changing `.env.local`. The `/status` page should then report **Supabase** storage after its live database probe succeeds.

## 3. Migrate an existing local workspace

First run a read-only preflight:

```bash
npm run supabase:migrate-local
```

If the connection, schema, and displayed record counts are correct, apply the migration:

```bash
npm run supabase:migrate-local -- --apply
```

The command upserts users, repositories, jobs, and analysis results in dependency order. It does not delete `.repomind/`, so the local files remain available as a backup.

Local email/password hashes cannot be imported as usable Supabase Auth passwords. Existing local password users must create or recover their account through Supabase Auth. GitHub OAuth remains independent.
