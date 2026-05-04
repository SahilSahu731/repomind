-- RepoMind bootstrap schema for Supabase Postgres
-- Run in Supabase SQL Editor once.

create extension if not exists pgcrypto;

-- User table (optional but used for plan/credit tracking)
create table if not exists public."User" (
  id text primary key,
  email text,
  name text,
  image text,
  "githubUsername" text,
  plan text not null default 'FREE' check (plan in ('FREE', 'PRO', 'ENTERPRISE')),
  "creditsRemaining" integer not null default 3,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Repo submissions
create table if not exists public."Repo" (
  id text primary key default gen_random_uuid()::text,
  "userId" text not null,
  "githubUrl" text not null,
  owner text not null,
  name text not null,
  branch text not null default 'main',
  status text not null default 'QUEUED' check (status in ('QUEUED', 'CLONING', 'PARSING', 'ANALYZING', 'COMPLETE', 'FAILED')),
  "shareSlug" text,
  "totalFiles" integer,
  "totalLines" integer,
  "defaultLanguage" text,
  "analyzedAt" timestamptz,
  "expiresAt" timestamptz,
  "errorMessage" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint repo_user_fk foreign key ("userId") references public."User"(id) on delete cascade
);

-- Analysis jobs
create table if not exists public."Job" (
  id text primary key default gen_random_uuid()::text,
  "repoId" text not null,
  status text not null default 'QUEUED' check (status in ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'TIMEOUT')),
  progress integer not null default 0,
  "currentStep" text,
  "errorLog" text,
  "startedAt" timestamptz,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint job_repo_fk foreign key ("repoId") references public."Repo"(id) on delete cascade
);

-- Persisted analysis output
create table if not exists public."AnalysisResult" (
  id text primary key default gen_random_uuid()::text,
  "repoId" text not null unique,
  summary text not null,
  architecture jsonb not null,
  "fileTree" jsonb not null,
  "dependencyGraph" jsonb not null,
  "entryPoints" jsonb not null,
  "startGuide" text not null,
  "fileSummaries" jsonb not null,
  "techStack" jsonb not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint analysis_repo_fk foreign key ("repoId") references public."Repo"(id) on delete cascade
);

create index if not exists repo_user_created_idx on public."Repo" ("userId", "createdAt" desc);
create index if not exists repo_lookup_idx on public."Repo" ("githubUrl", branch);
create index if not exists repo_status_idx on public."Repo" (status);

create index if not exists job_repo_created_idx on public."Job" ("repoId", "createdAt" desc);
create index if not exists job_status_idx on public."Job" (status);

create index if not exists user_plan_idx on public."User" (plan);

-- Keep updatedAt fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

-- Triggers (drop first to avoid duplicate trigger errors)
drop trigger if exists user_set_updated_at on public."User";
create trigger user_set_updated_at
before update on public."User"
for each row execute function public.set_updated_at();

drop trigger if exists repo_set_updated_at on public."Repo";
create trigger repo_set_updated_at
before update on public."Repo"
for each row execute function public.set_updated_at();

drop trigger if exists job_set_updated_at on public."Job";
create trigger job_set_updated_at
before update on public."Job"
for each row execute function public.set_updated_at();

drop trigger if exists analysis_result_set_updated_at on public."AnalysisResult";
create trigger analysis_result_set_updated_at
before update on public."AnalysisResult"
for each row execute function public.set_updated_at();
