import {
  createHmac,
  createSign,
  timingSafeEqual,
} from "node:crypto";

import { env } from "@/lib/env";

import type {
  GitHubInstallation,
  GitHubInstallationAccessTokenResponse,
  GitHubInstallationRepositoriesResponse,
  GitHubRepository,
  GitHubUserInstallationsResponse,
} from "@/lib/github/types";

const GITHUB_API =
  "https://api.github.com";

const GITHUB_API_VERSION =
  "2026-03-10";

export function isGitHubAppConfigured(): boolean {
  return Boolean(
    env.GITHUB_APP_ID &&
    env.GITHUB_APP_SLUG &&
    env.GITHUB_APP_PRIVATE_KEY &&
    env.GITHUB_WEBHOOK_SECRET,
  );
}

function requireGitHubAppConfiguration() {
  if (!isGitHubAppConfigured()) {
    throw new Error(
      "GITHUB_APP_NOT_CONFIGURED: Add GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY, and GITHUB_WEBHOOK_SECRET",
    );
  }

  return {
    slug: env.GITHUB_APP_SLUG!,
    privateKey: env.GITHUB_APP_PRIVATE_KEY!,
    webhookSecret: env.GITHUB_WEBHOOK_SECRET!,
  };
}

function encodeBase64Url(
  value: string | Buffer,
): string {
  return Buffer.from(value)
    .toString("base64url");
}

function normalizePrivateKey(
  value: string,
): string {
  const normalized = value
    .replace(/\\n/g, "\n")
    .trim();

  if (
    !normalized.includes("BEGIN") ||
    !normalized.includes("PRIVATE KEY")
  ) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY is not a valid PEM private key",
    );
  }

  return normalized;
}

export function createGitHubAppJwt(): string {
  const { privateKey } = requireGitHubAppConfiguration();
  const now =
    Math.floor(Date.now() / 1000);

  const header = encodeBase64Url(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    }),
  );

  const payload = encodeBase64Url(
    JSON.stringify({
      iat: now - 60,

      // GitHub App JWTs should be short-lived.
      exp: now + 9 * 60,

      // Current GitHub guidance allows the App client ID
      // as the JWT issuer.
      iss: env.GITHUB_CLIENT_ID,
    }),
  );

  const unsignedToken =
    `${header}.${payload}`;

  const signer =
    createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(
    normalizePrivateKey(
      privateKey,
    ),
  );

  return (
    `${unsignedToken}.` +
    encodeBase64Url(signature)
  );
}

interface GitHubRequestOptions {
  method?:
    | "GET"
    | "POST"
    | "PATCH"
    | "DELETE";

  token?: string;

  body?: unknown;
}

async function githubRequest<T>(
  path: string,
  options: GitHubRequestOptions = {},
): Promise<T> {
  const response = await fetch(
    `${GITHUB_API}${path}`,
    {
      method:
        options.method ?? "GET",

      headers: {
        Accept:
          "application/vnd.github+json",

        "X-GitHub-Api-Version":
          GITHUB_API_VERSION,

        "User-Agent":
          "RepoMind/1.0",

        ...(options.token
          ? {
              Authorization:
                `Bearer ${options.token}`,
            }
          : {}),

        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },

      body:
        options.body !== undefined
          ? JSON.stringify(
              options.body,
            )
          : undefined,

      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = (
      await response
        .text()
        .catch(() => "")
    ).slice(0, 500);

    throw new Error(
      `GITHUB_API_${response.status}: ` +
        (
          details ||
          response.statusText
        ),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (
    await response.json()
  ) as T;
}

export async function getGitHubInstallation(
  installationId: number,
): Promise<GitHubInstallation> {
  return githubRequest<GitHubInstallation>(
    `/app/installations/${installationId}`,
    {
      token: createGitHubAppJwt(),
    },
  );
}

export async function createGitHubInstallationToken(
  installationId: number,
  repositoryId?: string,
): Promise<GitHubInstallationAccessTokenResponse> {
  return githubRequest<GitHubInstallationAccessTokenResponse>(
    `/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",

      token:
        createGitHubAppJwt(),

      body: {
        permissions: {
          contents: "read",
        },

        ...(repositoryId
          ? {
              repository_ids: [
                Number(repositoryId),
              ],
            }
          : {}),
      },
    },
  );
}

export async function listGitHubInstallationRepositories(
  installationId: number,
): Promise<GitHubRepository[]> {
  const token =
    await createGitHubInstallationToken(
      installationId,
    );

  const repositories:
    GitHubRepository[] = [];

  for (
    let page = 1;
    page <= 20;
    page += 1
  ) {
    const result =
      await githubRequest<GitHubInstallationRepositoriesResponse>(
        `/installation/repositories?per_page=100&page=${page}`,
        {
          token: token.token,
        },
      );

    repositories.push(
      ...result.repositories,
    );

    if (
      result.repositories.length <
        100 ||
      repositories.length >=
        result.total_count
    ) {
      break;
    }
  }

  return repositories;
}

export async function listGitHubUserInstallations(
  userAccessToken: string,
): Promise<GitHubInstallation[]> {
  const installations:
    GitHubInstallation[] = [];

  for (
    let page = 1;
    page <= 20;
    page += 1
  ) {
    const result =
      await githubRequest<GitHubUserInstallationsResponse>(
        `/user/installations?per_page=100&page=${page}`,
        {
          token:
            userAccessToken,
        },
      );

    installations.push(
      ...result.installations,
    );

    if (
      result.installations.length <
        100 ||
      installations.length >=
        result.total_count
    ) {
      break;
    }
  }

  return installations;
}

export async function listGitHubUserInstallationRepositories(
  userAccessToken: string,
  installationId: number,
): Promise<GitHubRepository[]> {
  const repositories:
    GitHubRepository[] = [];

  for (
    let page = 1;
    page <= 20;
    page += 1
  ) {
    const result =
      await githubRequest<GitHubInstallationRepositoriesResponse>(
        `/user/installations/${installationId}/repositories?per_page=100&page=${page}`,
        {
          token:
            userAccessToken,
        },
      );

    repositories.push(
      ...result.repositories,
    );

    if (
      result.repositories.length <
        100 ||
      repositories.length >=
        result.total_count
    ) {
      break;
    }
  }

  return repositories;
}

export async function userCanAccessGitHubRepository(
  userAccessToken: string,
  installationId: number,
  githubRepositoryId: string,
): Promise<boolean> {
  const repositories =
    await listGitHubUserInstallationRepositories(
      userAccessToken,
      installationId,
    );

  return repositories.some(
    (repository) =>
      String(repository.id) ===
      githubRepositoryId,
  );
}

export async function userCanAccessGitHubInstallation(
  userAccessToken: string,
  installationId: number,
): Promise<boolean> {
  const installations =
    await listGitHubUserInstallations(
      userAccessToken,
    );

  return installations.some(
    (installation) =>
      installation.id ===
      installationId,
  );
}

export async function refreshGitHubUserAccessToken(
  refreshToken: string,
): Promise<{
  accessToken: string;

  expiresAt: number | null;

  refreshToken: string | null;

  refreshTokenExpiresAt:
    | number
    | null;
}> {
  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",

      headers: {
        Accept:
          "application/json",

        "Content-Type":
          "application/x-www-form-urlencoded",

        "User-Agent":
          "RepoMind/1.0",
      },

      body:
        new URLSearchParams({
          client_id:
            env.GITHUB_CLIENT_ID,

          client_secret:
            env.GITHUB_CLIENT_SECRET,

          grant_type:
            "refresh_token",

          refresh_token:
            refreshToken,
        }),

      cache: "no-store",
    },
  );

  const payload =
    (await response.json()) as {
      access_token?: string;
      expires_in?: number;

      refresh_token?: string;
      refresh_token_expires_in?:
        number;

      error?: string;
      error_description?: string;
    };

  if (
    !response.ok ||
    !payload.access_token
  ) {
    throw new Error(
      "GITHUB_TOKEN_REFRESH_FAILED: " +
        (
          payload.error_description ??
          payload.error ??
          response.statusText
        ),
    );
  }

  const now =
    Math.floor(Date.now() / 1000);

  return {
    accessToken:
      payload.access_token,

    expiresAt:
      payload.expires_in
        ? now +
          payload.expires_in
        : null,

    refreshToken:
      payload.refresh_token ??
      null,

    refreshTokenExpiresAt:
      payload.refresh_token_expires_in
        ? now +
          payload.refresh_token_expires_in
        : null,
  };
}

export function verifyGitHubWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!env.GITHUB_WEBHOOK_SECRET) {
    return false;
  }

  if (
    !signature?.startsWith(
      "sha256=",
    )
  ) {
    return false;
  }

  const expected =
    `sha256=${
      createHmac(
        "sha256",
        env.GITHUB_WEBHOOK_SECRET,
      )
        .update(rawBody)
        .digest("hex")
    }`;

  const providedBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expected);

  return (
    providedBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      providedBuffer,
      expectedBuffer,
    )
  );
}

export function getGitHubAppInstallUrl(
  state: string,
): string {
  const { slug } = requireGitHubAppConfiguration();

  const url = new URL(
    `https://github.com/apps/${slug}/installations/new`,
  );

  url.searchParams.set(
    "state",
    state,
  );

  return url.toString();
}
