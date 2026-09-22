import {
  randomUUID,
} from "node:crypto";

import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";

import path from "node:path";

import { env } from "@/lib/env";

import {
  shouldUseLocalWorkspaceDatabase,
} from "@/lib/runtimeMode";

import {
  ensureUserExists,
  type Plan,
} from "@/lib/supabaseDb";

import {
  decryptServerSecret,
  encryptServerSecret,
} from "@/lib/secretBox";

import {
  refreshGitHubUserAccessToken,
} from "@/lib/github/app";

import type {
  GitHubInstallation,
  GitHubRepository,
} from "@/lib/github/types";

export interface GitHubIdentityRow {
  userId: string;

  githubUserId: string;

  login: string;

  name: string | null;
  email: string | null;

  avatarUrl: string | null;

  accessTokenCiphertext?:
    | string
    | null;

  accessTokenExpiresAt?:
    | string
    | null;

  refreshTokenCiphertext?:
    | string
    | null;

  refreshTokenExpiresAt?:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
}

export interface GitHubAuthUser {
  id: string;

  email: string | null;

  name: string | null;

  image: string | null;

  githubUsername: string;
  githubUserId: string;

  plan: Plan;

  creditsRemaining: number;
}

export interface GitHubInstallationRow {
  id: number;

  accountId: string;
  accountLogin: string;
  accountType: string;

  repositorySelection: string;

  permissions:
    Record<string, string>;

  events: string[];

  suspendedAt:
    | string
    | null;

  deletedAt:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
}

export interface GitHubInstallationRepositoryRow {
  installationId: number;

  githubRepositoryId: string;

  owner: string;

  name: string;

  fullName: string;

  isPrivate: boolean;

  htmlUrl: string;

  defaultBranch: string;

  archived: boolean;

  pushedAt:
    | string
    | null;

  active: boolean;

  createdAt: string;
  updatedAt: string;
}

interface GitHubLocalData {
  identities:
    GitHubIdentityRow[];

  installations:
    GitHubInstallationRow[];

  installationUsers:
    Array<{
      installationId: number;
      userId: string;
      createdAt: string;
    }>;

  repositories:
    GitHubInstallationRepositoryRow[];

  deliveries:
    Array<{
      deliveryId: string;
      event: string;

      status:
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED";

      updatedAt: string;
    }>;
}

const localFile =
  path.join(
    process.cwd(),
    ".repomind",
    "github.json",
  );

let localMutation:
  Promise<void> =
    Promise.resolve();

function emptyLocalData():
  GitHubLocalData {
  return {
    identities: [],
    installations: [],
    installationUsers: [],
    repositories: [],
    deliveries: [],
  };
}

async function readLocalData():
  Promise<GitHubLocalData> {
  try {
    const raw =
      await readFile(
        localFile,
        "utf8",
      );

    const parsed =
      JSON.parse(raw) as
        Partial<GitHubLocalData>;

    return {
      identities:
        parsed.identities ?? [],

      installations:
        parsed.installations ?? [],

      installationUsers:
        parsed.installationUsers ??
        [],

      repositories:
        parsed.repositories ?? [],

      deliveries:
        parsed.deliveries ?? [],
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return emptyLocalData();
    }

    throw error;
  }
}

async function mutateLocal<T>(
  fn: (
    data: GitHubLocalData,
  ) => Promise<T> | T,
): Promise<T> {
  const operation =
    localMutation.then(
      async () => {
        const data =
          await readLocalData();

        const value =
          await fn(data);

        await mkdir(
          path.dirname(
            localFile,
          ),
          {
            recursive: true,
          },
        );

        const temp =
          `${localFile}.` +
          `${process.pid}.` +
          `${randomUUID()}.tmp`;

        await writeFile(
          temp,
          JSON.stringify(
            data,
            null,
            2,
          ),
          {
            mode: 0o600,
          },
        );

        await rename(
          temp,
          localFile,
        );

        return value;
      },
    );

  localMutation =
    operation.then(
      () => undefined,
      () => undefined,
    );

  return operation;
}

function getSupabaseConfig() {
  if (
    !env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for GitHub account persistence",
    );
  }

  return {
    baseUrl:
      env.SUPABASE_URL,

    serviceKey:
      env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function dbRequest<T>(
  pathName: string,
  options: {
    method?:
      | "GET"
      | "POST"
      | "PATCH";

    body?: unknown;

    prefer?: string;
  } = {},
): Promise<T> {
  const {
    baseUrl,
    serviceKey,
  } = getSupabaseConfig();

  const response = await fetch(
    `${baseUrl}/rest/v1/${pathName}`,
    {
      method:
        options.method ??
        "GET",

      headers: {
        apikey:
          serviceKey,

        Authorization:
          `Bearer ${serviceKey}`,

        "Content-Type":
          "application/json",

        ...(options.prefer
          ? {
              Prefer:
                options.prefer,
            }
          : {}),
      },

      body:
        options.body ===
        undefined
          ? undefined
          : JSON.stringify(
              options.body,
            ),

      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail =
      await response
        .text()
        .catch(() => "");

    throw new Error(
      `Supabase GitHub persistence failed (${response.status}): ${detail}`,
    );
  }

  return (
    await response
      .json()
      .catch(() => [])
  ) as T;
}

export async function upsertGitHubUserIdentity(
  input: {
    githubUserId: string;

    login: string;

    name:
      | string
      | null;

    email:
      | string
      | null;

    avatarUrl:
      | string
      | null;
  },
): Promise<GitHubAuthUser> {
  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    return mutateLocal(
      async (data) => {
        const now =
          new Date()
            .toISOString();

        const existing =
          data.identities.find(
            (row) =>
              row.githubUserId ===
              input.githubUserId,
          );

        const userId =
          existing?.userId ??
          randomUUID();

        const identity:
          GitHubIdentityRow = {
          userId,

          githubUserId:
            input.githubUserId,

          login:
            input.login,

          name:
            input.name,

          email:
            input.email,

          avatarUrl:
            input.avatarUrl,

          accessTokenCiphertext:
            existing?.accessTokenCiphertext ??
            null,

          accessTokenExpiresAt:
            existing?.accessTokenExpiresAt ??
            null,

          refreshTokenCiphertext:
            existing?.refreshTokenCiphertext ??
            null,

          refreshTokenExpiresAt:
            existing?.refreshTokenExpiresAt ??
            null,

          createdAt:
            existing?.createdAt ??
            now,

          updatedAt:
            now,
        };

        data.identities =
          data.identities.filter(
            (row) =>
              row.githubUserId !==
              input.githubUserId,
          );

        data.identities.push(
          identity,
        );

        await ensureUserExists({
          id:
            userId,

          email:
            input.email,

          name:
            input.name,

          image:
            input.avatarUrl,

          githubUsername:
            input.login,

          plan:
            "FREE",

          creditsRemaining:
            3,
        });

        return {
          id:
            userId,

          email:
            input.email,

          name:
            input.name,

          image:
            input.avatarUrl,

          githubUsername:
            input.login,

          githubUserId:
            input.githubUserId,

          plan:
            "FREE" as const,

          creditsRemaining:
            3,
        };
      },
    );
  }

  const rows =
    await dbRequest<
      Array<{
        id: string;

        email:
          | string
          | null;

        name:
          | string
          | null;

        image:
          | string
          | null;

        githubUsername:
          string;

        githubUserId:
          string;

        plan:
          Plan;

        creditsRemaining:
          number;
      }>
    >(
      "rpc/upsert_github_user",
      {
        method: "POST",

        body: {
          p_github_user_id:
            input.githubUserId,

          p_login:
            input.login,

          p_name:
            input.name,

          p_email:
            input.email,

          p_avatar_url:
            input.avatarUrl,
        },
      },
    );

  const user =
    rows[0];

  if (!user) {
    throw new Error(
      "GitHub account could not be persisted",
    );
  }

  return user;
}

export async function getGitHubIdentityByUserId(
  userId: string,
): Promise<
  GitHubIdentityRow | null
> {
  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    const data =
      await readLocalData();

    return (
      data.identities.find(
        (row) =>
          row.userId ===
          userId,
      ) ?? null
    );
  }

  const rows =
    await dbRequest<
      GitHubIdentityRow[]
    >(
      `GitHubIdentity?select=*&userId=eq.${encodeURIComponent(
        userId,
      )}&limit=1`,
    );

  return rows[0] ?? null;
}

export async function getUserIdByGitHubUserId(
  githubUserId: string,
): Promise<string | null> {
  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    const data =
      await readLocalData();

    return (
      data.identities.find(
        (row) =>
          row.githubUserId ===
          githubUserId,
      )?.userId ?? null
    );
  }

  const rows =
    await dbRequest<
      Array<{
        userId: string;
      }>
    >(
      `GitHubIdentity?select=userId&githubUserId=eq.${encodeURIComponent(
        githubUserId,
      )}&limit=1`,
    );

  return (
    rows[0]?.userId ??
    null
  );
}

function installationToRow(
  installation:
    GitHubInstallation,
): GitHubInstallationRow {
  return {
    id:
      installation.id,

    accountId:
      String(
        installation.account.id,
      ),

    accountLogin:
      installation.account.login,

    accountType:
      installation.account.type,

    repositorySelection:
      installation.repository_selection,

    permissions:
      installation.permissions,

    events:
      installation.events,

    suspendedAt:
      installation.suspended_at,

    deletedAt:
      null,

    createdAt:
      installation.created_at,

    updatedAt:
      installation.updated_at,
  };
}

export async function upsertGitHubInstallation(
  installation:
    GitHubInstallation,
): Promise<GitHubInstallationRow> {
  const row =
    installationToRow(
      installation,
    );

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    return mutateLocal(
      (data) => {
        const existing =
          data.installations.find(
            (item) =>
              item.id === row.id,
          );

        const merged = {
          ...row,

          createdAt:
            existing?.createdAt ??
            row.createdAt,

          deletedAt:
            null,
        };

        data.installations =
          data.installations.filter(
            (item) =>
              item.id !== row.id,
          );

        data.installations.push(
          merged,
        );

        return merged;
      },
    );
  }

  const rows =
    await dbRequest<
      GitHubInstallationRow[]
    >(
      "GitHubInstallation?on_conflict=id",
      {
        method:
          "POST",

        body:
          row,

        prefer:
          "resolution=merge-duplicates,return=representation",
      },
    );

  return rows[0] ?? row;
}

export async function markGitHubInstallationDeleted(
  installationId: number,
): Promise<void> {
  const deletedAt =
    new Date()
      .toISOString();

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    await mutateLocal(
      (data) => {
        data.installations =
          data.installations.map(
            (row) =>
              row.id ===
              installationId
                ? {
                    ...row,
                    deletedAt,
                    updatedAt:
                      deletedAt,
                  }
                : row,
          );

        data.repositories =
          data.repositories.map(
            (row) =>
              row.installationId ===
              installationId
                ? {
                    ...row,
                    active: false,
                    updatedAt:
                      deletedAt,
                  }
                : row,
          );
      },
    );

    return;
  }

  await Promise.all([
    dbRequest(
      `GitHubInstallation?id=eq.${installationId}`,
      {
        method: "PATCH",

        body: {
          deletedAt,
        },
      },
    ),

    dbRequest(
      `GitHubInstallationRepository?installationId=eq.${installationId}`,
      {
        method: "PATCH",

        body: {
          active: false,
        },
      },
    ),
  ]);
}

export async function linkGitHubInstallationToUser(
  installationId: number,
  userId: string,
): Promise<void> {
  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    await mutateLocal(
      (data) => {
        const exists =
          data.installationUsers.some(
            (row) =>
              row.installationId ===
                installationId &&
              row.userId === userId,
          );

        if (!exists) {
          data.installationUsers.push({
            installationId,
            userId,

            createdAt:
              new Date()
                .toISOString(),
          });
        }
      },
    );

    return;
  }

  await dbRequest(
    "GitHubInstallationUser?on_conflict=installationId,userId",
    {
      method:
        "POST",

      body: {
        installationId,
        userId,
      },

      prefer:
        "resolution=ignore-duplicates,return=minimal",
    },
  );
}

export async function userHasGitHubInstallationAccess(
  userId: string,
  installationId: number,
): Promise<boolean> {
  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    const data =
      await readLocalData();

    return data.installationUsers.some(
      (row) =>
        row.userId ===
          userId &&
        row.installationId ===
          installationId,
    );
  }

  const rows =
    await dbRequest<
      Array<{
        installationId:
          number;
      }>
    >(
      `GitHubInstallationUser?select=installationId&userId=eq.${encodeURIComponent(
        userId,
      )}&installationId=eq.${installationId}&limit=1`,
    );

  return rows.length > 0;
}

export async function listGitHubInstallationsForUser(
  userId: string,
): Promise<
  GitHubInstallationRow[]
> {
  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    const data =
      await readLocalData();

    const ids =
      new Set(
        data.installationUsers
          .filter(
            (row) =>
              row.userId ===
              userId,
          )
          .map(
            (row) =>
              row.installationId,
          ),
      );

    return data.installations.filter(
      (row) =>
        ids.has(row.id) &&
        !row.deletedAt,
    );
  }

  const links =
    await dbRequest<
      Array<{
        installationId:
          number;
      }>
    >(
      `GitHubInstallationUser?select=installationId&userId=eq.${encodeURIComponent(
        userId,
      )}`,
    );

  if (
    links.length === 0
  ) {
    return [];
  }

  const ids =
    links
      .map(
        (row) =>
          row.installationId,
      )
      .join(",");

  return dbRequest<
    GitHubInstallationRow[]
  >(
    `GitHubInstallation?select=*&id=in.(${ids})&deletedAt=is.null&order=accountLogin.asc`,
  );
}

export async function replaceGitHubInstallationRepositories(
  installationId: number,
  repositories:
    GitHubRepository[],
): Promise<void> {
  const now =
    new Date()
      .toISOString();

  const rows:
    GitHubInstallationRepositoryRow[] =
    repositories.map(
      (repo) => ({
        installationId,

        githubRepositoryId:
          String(repo.id),

        owner:
          repo.owner.login,

        name:
          repo.name,

        fullName:
          repo.full_name,

        isPrivate:
          repo.private,

        htmlUrl:
          repo.html_url,

        defaultBranch:
          repo.default_branch,

        archived:
          repo.archived,

        pushedAt:
          repo.pushed_at,

        active:
          true,

        createdAt:
          now,

        updatedAt:
          now,
      }),
    );

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    await mutateLocal(
      (data) => {
        data.repositories =
          data.repositories.map(
            (row) =>
              row.installationId ===
              installationId
                ? {
                    ...row,

                    active:
                      false,

                    updatedAt:
                      now,
                  }
                : row,
          );

        for (
          const row of rows
        ) {
          const existing =
            data.repositories.find(
              (candidate) =>
                candidate.installationId ===
                  installationId &&
                candidate.githubRepositoryId ===
                  row.githubRepositoryId,
            );

          data.repositories =
            data.repositories.filter(
              (candidate) =>
                !(
                  candidate.installationId ===
                    installationId &&
                  candidate.githubRepositoryId ===
                    row.githubRepositoryId
                ),
            );

          data.repositories.push({
            ...row,

            createdAt:
              existing?.createdAt ??
              row.createdAt,
          });
        }
      },
    );

    return;
  }

  await dbRequest(
    `GitHubInstallationRepository?installationId=eq.${installationId}`,
    {
      method:
        "PATCH",

      body: {
        active:
          false,
      },
    },
  );

  if (
    rows.length > 0
  ) {
    await dbRequest(
      "GitHubInstallationRepository?on_conflict=installationId,githubRepositoryId",
      {
        method:
          "POST",

        body:
          rows,

        prefer:
          "resolution=merge-duplicates,return=minimal",
      },
    );
  }
}

export async function listGitHubRepositoriesForUser(
  userId: string,
  installationId: number,
): Promise<
  GitHubInstallationRepositoryRow[]
> {
  if (
    !(
      await userHasGitHubInstallationAccess(
        userId,
        installationId,
      )
    )
  ) {
    return [];
  }

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    const data =
      await readLocalData();

    return data.repositories
      .filter(
        (row) =>
          row.installationId ===
            installationId &&
          row.active,
      )
      .sort(
        (a, b) =>
          a.fullName.localeCompare(
            b.fullName,
          ),
      );
  }

  return dbRequest<
    GitHubInstallationRepositoryRow[]
  >(
    `GitHubInstallationRepository?select=*&installationId=eq.${installationId}&active=eq.true&order=fullName.asc`,
  );
}

export async function getGitHubRepositoryForUser(
  userId: string,
  installationId: number,
  githubRepositoryId: string,
): Promise<
  GitHubInstallationRepositoryRow | null
> {
  if (
    !(
      await userHasGitHubInstallationAccess(
        userId,
        installationId,
      )
    )
  ) {
    return null;
  }

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    const data =
      await readLocalData();

    return (
      data.repositories.find(
        (row) =>
          row.installationId ===
            installationId &&
          row.githubRepositoryId ===
            githubRepositoryId &&
          row.active,
      ) ?? null
    );
  }

  const rows =
    await dbRequest<
      GitHubInstallationRepositoryRow[]
    >(
      `GitHubInstallationRepository?select=*&installationId=eq.${installationId}&githubRepositoryId=eq.${encodeURIComponent(
        githubRepositoryId,
      )}&active=eq.true&limit=1`,
    );

  return rows[0] ?? null;
}

export async function claimGitHubWebhookDelivery(
  deliveryId: string,
  event: string,
): Promise<boolean> {
  const now =
    new Date()
      .toISOString();

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    return mutateLocal(
      (data) => {
        const existing =
          data.deliveries.find(
            (row) =>
              row.deliveryId ===
              deliveryId,
          );

        if (
          existing &&
          existing.status !==
            "FAILED"
        ) {
          return false;
        }

        data.deliveries =
          data.deliveries.filter(
            (row) =>
              row.deliveryId !==
              deliveryId,
          );

        data.deliveries.push({
          deliveryId,
          event,
          status:
            "PROCESSING",
          updatedAt:
            now,
        });

        return true;
      },
    );
  }

  try {
    await dbRequest(
      "GitHubWebhookDelivery",
      {
        method:
          "POST",

        body: {
          deliveryId,
          event,
          status:
            "PROCESSING",
        },

        prefer:
          "return=minimal",
      },
    );

    return true;
  } catch (error) {
    if (
      !(
        error instanceof
        Error
      ) ||
      !error.message.includes(
        "23505",
      )
    ) {
      throw error;
    }

    const rows =
      await dbRequest<
        Array<{
          status: string;
        }>
      >(
        `GitHubWebhookDelivery?select=status&deliveryId=eq.${encodeURIComponent(
          deliveryId,
        )}&limit=1`,
      );

    if (
      rows[0]?.status !==
      "FAILED"
    ) {
      return false;
    }

    await dbRequest(
      `GitHubWebhookDelivery?deliveryId=eq.${encodeURIComponent(
        deliveryId,
      )}`,
      {
        method:
          "PATCH",

        body: {
          event,
          status:
            "PROCESSING",
        },
      },
    );

    return true;
  }
}

export async function finishGitHubWebhookDelivery(
  deliveryId: string,
  status:
    | "COMPLETED"
    | "FAILED",
): Promise<void> {
  const now =
    new Date()
      .toISOString();

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    await mutateLocal(
      (data) => {
        data.deliveries =
          data.deliveries.map(
            (row) =>
              row.deliveryId ===
              deliveryId
                ? {
                    ...row,
                    status,
                    updatedAt:
                      now,
                  }
                : row,
          );
      },
    );

    return;
  }

  await dbRequest(
    `GitHubWebhookDelivery?deliveryId=eq.${encodeURIComponent(
      deliveryId,
    )}`,
    {
      method:
        "PATCH",

      body: {
        status,
      },
    },
  );
}

const GITHUB_ACCESS_TOKEN_PURPOSE =
  "github-user-access-token";

const GITHUB_REFRESH_TOKEN_PURPOSE =
  "github-user-refresh-token";

export async function saveGitHubUserCredentials(
  input: {
    userId: string;

    accessToken: string;

    accessTokenExpiresAt:
      | number
      | null;

    refreshToken:
      | string
      | null;

    refreshTokenExpiresAt:
      | number
      | null;
  },
): Promise<void> {
  const patch = {
    accessTokenCiphertext:
      encryptServerSecret(
        input.accessToken,
        GITHUB_ACCESS_TOKEN_PURPOSE,
      ),

    accessTokenExpiresAt:
      input.accessTokenExpiresAt
        ? new Date(
            input.accessTokenExpiresAt *
              1000,
          ).toISOString()
        : null,

    ...(input.refreshToken
      ? {
          refreshTokenCiphertext:
            encryptServerSecret(
              input.refreshToken,
              GITHUB_REFRESH_TOKEN_PURPOSE,
            ),

          refreshTokenExpiresAt:
            input.refreshTokenExpiresAt
              ? new Date(
                  input.refreshTokenExpiresAt *
                    1000,
                ).toISOString()
              : null,
        }
      : {}),
  };

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    await mutateLocal(
      (data) => {
        data.identities =
          data.identities.map(
            (identity) =>
              identity.userId ===
              input.userId
                ? {
                    ...identity,
                    ...patch,

                    updatedAt:
                      new Date()
                        .toISOString(),
                  }
                : identity,
          );
      },
    );

    return;
  }

  await dbRequest(
    `GitHubIdentity?userId=eq.${encodeURIComponent(
      input.userId,
    )}`,
    {
      method:
        "PATCH",

      body:
        patch,
    },
  );
}

export async function clearGitHubUserCredentials(
  userId: string,
): Promise<void> {
  const patch = {
    accessTokenCiphertext:
      null,

    accessTokenExpiresAt:
      null,

    refreshTokenCiphertext:
      null,

    refreshTokenExpiresAt:
      null,
  };

  if (
    shouldUseLocalWorkspaceDatabase()
  ) {
    await mutateLocal(
      (data) => {
        data.identities =
          data.identities.map(
            (identity) =>
              identity.userId ===
              userId
                ? {
                    ...identity,
                    ...patch,

                    updatedAt:
                      new Date()
                        .toISOString(),
                  }
                : identity,
          );
      },
    );

    return;
  }

  await dbRequest(
    `GitHubIdentity?userId=eq.${encodeURIComponent(
      userId,
    )}`,
    {
      method:
        "PATCH",

      body:
        patch,
    },
  );
}

export async function getValidGitHubUserAccessToken(
  userId: string,
): Promise<string | null> {
  const identity =
    await getGitHubIdentityByUserId(
      userId,
    );

  if (
    !identity?.accessTokenCiphertext
  ) {
    return null;
  }

  const accessToken =
    decryptServerSecret(
      identity.accessTokenCiphertext,
      GITHUB_ACCESS_TOKEN_PURPOSE,
    );

  const expiresAt =
    identity.accessTokenExpiresAt
      ? Math.floor(
          new Date(
            identity.accessTokenExpiresAt,
          ).getTime() /
            1000,
        )
      : null;

  const now =
    Math.floor(
      Date.now() / 1000,
    );

  // Non-expiring GitHub token or still healthy.
  if (
    !expiresAt ||
    expiresAt -
      5 * 60 >
      now
  ) {
    return accessToken;
  }

  if (
    !identity.refreshTokenCiphertext
  ) {
    await clearGitHubUserCredentials(
      userId,
    );

    return null;
  }

  if (
    identity.refreshTokenExpiresAt &&
    new Date(
      identity.refreshTokenExpiresAt,
    ).getTime() <= Date.now()
  ) {
    await clearGitHubUserCredentials(
      userId,
    );

    return null;
  }

  try {
    const refreshToken =
      decryptServerSecret(
        identity.refreshTokenCiphertext,
        GITHUB_REFRESH_TOKEN_PURPOSE,
      );

    const refreshed =
      await refreshGitHubUserAccessToken(
        refreshToken,
      );

    await saveGitHubUserCredentials({
      userId,

      accessToken:
        refreshed.accessToken,

      accessTokenExpiresAt:
        refreshed.expiresAt,

      refreshToken:
        refreshed.refreshToken,

      refreshTokenExpiresAt:
        refreshed.refreshTokenExpiresAt,
    });

    return refreshed.accessToken;
  } catch {
    /*
     * Important concurrency behavior:
     *
     * GitHub rotates refresh tokens.
     * If two requests try to refresh simultaneously,
     * one may succeed and make the other's refresh token invalid.
     *
     * Therefore we deliberately DO NOT clear DB credentials here.
     * A concurrent request may already have persisted the new pair.
     */
    return null;
  }
}
