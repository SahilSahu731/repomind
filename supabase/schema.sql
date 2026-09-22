-- RepoMind
-- Phase 1-3 schema:
-- GitHub-only identity
-- GitHub App installations
-- GitHub repository access
-- durable/cancellable analysis jobs
-- webhook replay protection

create extension if not exists pgcrypto;

-- =========================================================
-- USER
-- =========================================================

create table if not exists public."User" (
  id text primary key default gen_random_uuid()::text,

  -- GitHub users may hide email, so this must be nullable.
  email text,

  name text,
  image text,
  "githubUsername" text,

  plan text not null default 'FREE'
    check (
      plan in (
        'FREE',
        'PRO',
        'ENTERPRISE'
      )
    ),

  "creditsRemaining" integer not null default 3,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public."User"
  alter column id
  set default gen_random_uuid()::text;

alter table public."User"
  alter column email
  drop not null;

-- =========================================================
-- GITHUB IDENTITY
-- =========================================================

create table if not exists public."GitHubIdentity" (
  "userId" text primary key,

  "githubUserId" text not null unique,
  login text not null,

  name text,
  email text,
  "avatarUrl" text,

  -- Server-only encrypted credentials.
  "accessTokenCiphertext" text,
  "accessTokenExpiresAt" timestamptz,

  "refreshTokenCiphertext" text,
  "refreshTokenExpiresAt" timestamptz,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  constraint github_identity_user_fk
    foreign key ("userId")
    references public."User"(id)
    on delete cascade
);

alter table public."GitHubIdentity"
  add column if not exists
  "accessTokenCiphertext" text;

alter table public."GitHubIdentity"
  add column if not exists
  "accessTokenExpiresAt" timestamptz;

alter table public."GitHubIdentity"
  add column if not exists
  "refreshTokenCiphertext" text;

alter table public."GitHubIdentity"
  add column if not exists
  "refreshTokenExpiresAt" timestamptz;

-- =========================================================
-- GITHUB APP INSTALLATION
-- =========================================================

create table if not exists public."GitHubInstallation" (
  id bigint primary key,

  "accountId" text not null,
  "accountLogin" text not null,
  "accountType" text not null,

  "repositorySelection" text not null
    check (
      "repositorySelection"
      in ('all', 'selected')
    ),

  permissions jsonb
    not null
    default '{}'::jsonb,

  events jsonb
    not null
    default '[]'::jsonb,

  "suspendedAt" timestamptz,
  "deletedAt" timestamptz,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Users who GitHub says can interact with an installation.
create table if not exists public."GitHubInstallationUser" (
  "installationId" bigint not null,
  "userId" text not null,

  "createdAt" timestamptz not null default now(),

  primary key (
    "installationId",
    "userId"
  ),

  constraint github_installation_user_installation_fk
    foreign key ("installationId")
    references public."GitHubInstallation"(id)
    on delete cascade,

  constraint github_installation_user_user_fk
    foreign key ("userId")
    references public."User"(id)
    on delete cascade
);

-- Installation-wide mirror.
-- IMPORTANT:
-- This is NOT by itself sufficient authorization for a user.
-- User repository access is also verified using GitHub's
-- user-access-token API before displaying/analyzing private code.
create table if not exists public."GitHubInstallationRepository" (
  "installationId" bigint not null,

  "githubRepositoryId" text not null,

  owner text not null,
  name text not null,
  "fullName" text not null,

  "isPrivate" boolean not null default false,

  "htmlUrl" text not null,
  "defaultBranch" text not null,

  archived boolean not null default false,

  "pushedAt" timestamptz,

  active boolean not null default true,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  primary key (
    "installationId",
    "githubRepositoryId"
  ),

  constraint github_installation_repo_installation_fk
    foreign key ("installationId")
    references public."GitHubInstallation"(id)
    on delete cascade
);

-- =========================================================
-- WEBHOOK IDEMPOTENCY
-- =========================================================

create table if not exists public."GitHubWebhookDelivery" (
  "deliveryId" text primary key,

  event text not null,

  status text not null
    check (
      status in (
        'PROCESSING',
        'COMPLETED',
        'FAILED'
      )
    ),

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- =========================================================
-- REPOSITORY
-- =========================================================

create table if not exists public."Repo" (
  id text primary key
    default gen_random_uuid()::text,

  "userId" text not null,

  "githubUrl" text not null,

  "githubInstallationId" bigint,
  "githubRepositoryId" text,

  "isPrivate" boolean not null default false,

  owner text not null,
  name text not null,

  branch text not null default 'HEAD',

  status text not null default 'QUEUED'
    check (
      status in (
        'QUEUED',
        'CLONING',
        'PARSING',
        'ANALYZING',
        'COMPLETE',
        'FAILED',
        'CANCELLED'
      )
    ),

  "shareSlug" text,

  "totalFiles" integer,
  "totalLines" integer,

  "defaultLanguage" text,

  "analyzedAt" timestamptz,
  "expiresAt" timestamptz,

  "errorMessage" text,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  constraint repo_user_fk
    foreign key ("userId")
    references public."User"(id)
    on delete cascade,

  constraint repo_installation_fk
    foreign key ("githubInstallationId")
    references public."GitHubInstallation"(id)
    on delete set null
);

-- Existing DB migration support.
alter table public."Repo"
  add column if not exists
  "githubInstallationId" bigint;

alter table public."Repo"
  add column if not exists
  "githubRepositoryId" text;

alter table public."Repo"
  add column if not exists
  "isPrivate" boolean not null default false;

-- Existing databases won't get the FK from CREATE TABLE IF NOT EXISTS.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where
      conname = 'repo_installation_fk'
      and conrelid = 'public."Repo"'::regclass
  ) then
    alter table public."Repo"
      add constraint repo_installation_fk
      foreign key ("githubInstallationId")
      references public."GitHubInstallation"(id)
      on delete set null;
  end if;
end
$$;

-- Replace old status constraints so CANCELLED becomes valid.
alter table public."Repo"
  drop constraint if exists "Repo_status_check";

alter table public."Repo"
  drop constraint if exists repo_status_check;

alter table public."Repo"
  add constraint repo_status_check
  check (
    status in (
      'QUEUED',
      'CLONING',
      'PARSING',
      'ANALYZING',
      'COMPLETE',
      'FAILED',
      'CANCELLED'
    )
  );

-- =========================================================
-- JOB
-- =========================================================

create table if not exists public."Job" (
  id text primary key
    default gen_random_uuid()::text,

  "repoId" text not null,

  status text not null default 'QUEUED'
    check (
      status in (
        'QUEUED',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'TIMEOUT',
        'CANCELLED'
      )
    ),

  progress integer
    not null
    default 0
    check (
      progress between 0 and 100
    ),

  "currentStep" text,

  "errorLog" text,

  "startedAt" timestamptz,
  "completedAt" timestamptz,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  constraint job_repo_fk
    foreign key ("repoId")
    references public."Repo"(id)
    on delete cascade
);

alter table public."Job"
  drop constraint if exists "Job_status_check";

alter table public."Job"
  drop constraint if exists job_status_check;

alter table public."Job"
  add constraint job_status_check
  check (
    status in (
      'QUEUED',
      'PROCESSING',
      'COMPLETED',
      'FAILED',
      'TIMEOUT',
      'CANCELLED'
    )
  );

-- =========================================================
-- ANALYSIS
-- =========================================================

create table if not exists public."AnalysisResult" (
  id text primary key
    default gen_random_uuid()::text,

  "repoId" text not null unique,

  summary text not null,

  architecture jsonb not null,

  "fileTree" jsonb not null,

  "dependencyGraph" jsonb not null,

  "entryPoints" jsonb not null,

  "startGuide" text not null,

  "fileSummaries" jsonb not null,

  "techStack" jsonb not null,

  "contributionScore" jsonb,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  constraint analysis_repo_fk
    foreign key ("repoId")
    references public."Repo"(id)
    on delete cascade
);

alter table public."AnalysisResult"
  add column if not exists
  "contributionScore" jsonb;

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists github_identity_login_idx
  on public."GitHubIdentity"(login);

create index if not exists github_installation_account_idx
  on public."GitHubInstallation"("accountLogin");

create index if not exists github_installation_user_user_idx
  on public."GitHubInstallationUser"("userId");

create index if not exists github_installation_repo_name_idx
  on public."GitHubInstallationRepository"(
    "installationId",
    "fullName"
  );

create index if not exists repo_user_created_idx
  on public."Repo"(
    "userId",
    "createdAt" desc
  );

create index if not exists repo_lookup_idx
  on public."Repo"(
    "githubUrl",
    branch
  );

create index if not exists repo_status_idx
  on public."Repo"(status);

create index if not exists repo_installation_idx
  on public."Repo"(
    "githubInstallationId",
    "githubRepositoryId"
  );

create index if not exists job_repo_created_idx
  on public."Job"(
    "repoId",
    "createdAt" desc
  );

create index if not exists job_status_idx
  on public."Job"(status);

create index if not exists user_plan_idx
  on public."User"(plan);

-- =========================================================
-- UPDATED AT
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

-- =========================================================
-- GITHUB USER UPSERT
-- =========================================================

create or replace function public.upsert_github_user(
  p_github_user_id text,
  p_login text,
  p_name text,
  p_email text,
  p_avatar_url text
)
returns table (
  id text,
  email text,
  name text,
  image text,
  "githubUsername" text,
  "githubUserId" text,
  plan text,
  "creditsRemaining" integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text;
begin
  select gi."userId"
  into v_user_id
  from public."GitHubIdentity" gi
  where
    gi."githubUserId" = p_github_user_id;

  if v_user_id is null then
    v_user_id := gen_random_uuid()::text;

    insert into public."User" (
      id,
      email,
      name,
      image,
      "githubUsername",
      plan,
      "creditsRemaining"
    )
    values (
      v_user_id,
      p_email,
      p_name,
      p_avatar_url,
      p_login,
      'FREE',
      3
    );

    insert into public."GitHubIdentity" (
      "userId",
      "githubUserId",
      login,
      name,
      email,
      "avatarUrl"
    )
    values (
      v_user_id,
      p_github_user_id,
      p_login,
      p_name,
      p_email,
      p_avatar_url
    );
  else

    update public."User"
    set
      email = p_email,
      name = p_name,
      image = p_avatar_url,
      "githubUsername" = p_login
    where
      public."User".id = v_user_id;

    update public."GitHubIdentity"
    set
      login = p_login,
      name = p_name,
      email = p_email,
      "avatarUrl" = p_avatar_url
    where
      public."GitHubIdentity"."githubUserId"
        = p_github_user_id;

  end if;

  return query

  select
    u.id,
    u.email,
    u.name,
    u.image,
    u."githubUsername",
    gi."githubUserId",
    u.plan,
    u."creditsRemaining"

  from public."User" u

  join public."GitHubIdentity" gi
    on gi."userId" = u.id

  where
    u.id = v_user_id;
end;
$$;

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists user_set_updated_at
  on public."User";

create trigger user_set_updated_at
before update on public."User"
for each row
execute function public.set_updated_at();

drop trigger if exists github_identity_set_updated_at
  on public."GitHubIdentity";

create trigger github_identity_set_updated_at
before update on public."GitHubIdentity"
for each row
execute function public.set_updated_at();

drop trigger if exists github_installation_set_updated_at
  on public."GitHubInstallation";

create trigger github_installation_set_updated_at
before update on public."GitHubInstallation"
for each row
execute function public.set_updated_at();

drop trigger if exists github_installation_repo_set_updated_at
  on public."GitHubInstallationRepository";

create trigger github_installation_repo_set_updated_at
before update on public."GitHubInstallationRepository"
for each row
execute function public.set_updated_at();

drop trigger if exists github_webhook_delivery_set_updated_at
  on public."GitHubWebhookDelivery";

create trigger github_webhook_delivery_set_updated_at
before update on public."GitHubWebhookDelivery"
for each row
execute function public.set_updated_at();

drop trigger if exists repo_set_updated_at
  on public."Repo";

create trigger repo_set_updated_at
before update on public."Repo"
for each row
execute function public.set_updated_at();

drop trigger if exists job_set_updated_at
  on public."Job";

create trigger job_set_updated_at
before update on public."Job"
for each row
execute function public.set_updated_at();

drop trigger if exists analysis_result_set_updated_at
  on public."AnalysisResult";

create trigger analysis_result_set_updated_at
before update on public."AnalysisResult"
for each row
execute function public.set_updated_at();

-- =========================================================
-- RLS
--
-- The browser does not query these tables directly.
-- Server uses SUPABASE_SERVICE_ROLE_KEY.
-- =========================================================

alter table public."User"
  enable row level security;

alter table public."GitHubIdentity"
  enable row level security;

alter table public."GitHubInstallation"
  enable row level security;

alter table public."GitHubInstallationUser"
  enable row level security;

alter table public."GitHubInstallationRepository"
  enable row level security;

alter table public."GitHubWebhookDelivery"
  enable row level security;

alter table public."Repo"
  enable row level security;

alter table public."Job"
  enable row level security;

alter table public."AnalysisResult"
  enable row level security;

revoke all on table public."User"
  from anon, authenticated;

revoke all on table public."GitHubIdentity"
  from anon, authenticated;

revoke all on table public."GitHubInstallation"
  from anon, authenticated;

revoke all on table public."GitHubInstallationUser"
  from anon, authenticated;

revoke all on table public."GitHubInstallationRepository"
  from anon, authenticated;

revoke all on table public."GitHubWebhookDelivery"
  from anon, authenticated;

revoke all on table public."Repo"
  from anon, authenticated;

revoke all on table public."Job"
  from anon, authenticated;

revoke all on table public."AnalysisResult"
  from anon, authenticated;

revoke all on function public.upsert_github_user(
  text,
  text,
  text,
  text,
  text
)
from public, anon, authenticated;

grant execute
on function public.upsert_github_user(
  text,
  text,
  text,
  text,
  text
)
to service_role;

grant all on table public."User"
  to service_role;

grant all on table public."GitHubIdentity"
  to service_role;

grant all on table public."GitHubInstallation"
  to service_role;

grant all on table public."GitHubInstallationUser"
  to service_role;

grant all on table public."GitHubInstallationRepository"
  to service_role;

grant all on table public."GitHubWebhookDelivery"
  to service_role;

grant all on table public."Repo"
  to service_role;

grant all on table public."Job"
  to service_role;

grant all on table public."AnalysisResult"
  to service_role;
