import {
  getServerSession,
} from "next-auth";

import type {
  NextRequest,
} from "next/server";

import {
  authOptions,
} from "@/lib/auth";

import {
  fail,
  ok,
} from "@/lib/api";

import {
  getApiError,
} from "@/lib/errors";

import {
  listGitHubUserInstallationRepositories,
} from "@/lib/github/app";

import {
  getValidGitHubUserAccessToken,
  userHasGitHubInstallationAccess,
} from "@/lib/github/db";

import {
  syncGitHubInstallationRepositories,
} from "@/lib/github/sync";

export async function GET(
  req: NextRequest,
) {
  const session =
    await getServerSession(
      authOptions,
    );

  if (
    !session?.user?.id
  ) {
    const error =
      getApiError(
        "UNAUTHORIZED",
      );

    return fail(
      error.code,
      error.message,
      error.status,
    );
  }

  const installationId =
    Number(
      req.nextUrl.searchParams.get(
        "installationId",
      ),
    );

  if (
    !Number.isSafeInteger(
      installationId,
    ) ||
    installationId <= 0
  ) {
    const error =
      getApiError(
        "INVALID_INPUT",
        "A valid GitHub installation is required",
      );

    return fail(
      error.code,
      error.message,
      error.status,
    );
  }

  if (
    !(
      await userHasGitHubInstallationAccess(
        session.user.id,
        installationId,
      )
    )
  ) {
    const error =
      getApiError(
        "UNAUTHORIZED",
        "You do not have access to this GitHub installation",
      );

    return fail(
      error.code,
      error.message,
      403,
    );
  }

  try {
    const userToken =
      await getValidGitHubUserAccessToken(
        session.user.id,
      );

    if (!userToken) {
      const error =
        getApiError(
          "UNAUTHORIZED",
          "GitHub authorization expired. Continue with GitHub again to refresh access.",
        );

      return fail(
        error.code,
        error.message,
        401,
      );
    }

    if (
      req.nextUrl.searchParams.get(
        "refresh",
      ) === "1"
    ) {
      /*
       * Refresh installation-wide mirror.
       *
       * Do NOT return that mirror blindly.
       * The actual response below is user-filtered by GitHub.
       */
      await syncGitHubInstallationRepositories(
        installationId,
      );
    }

    /*
     * Critical authorization boundary:
     *
     * GitHub gives only repositories accessible to BOTH:
     * - the GitHub App
     * - this user
     */
    const githubRepositories =
      await listGitHubUserInstallationRepositories(
        userToken,
        installationId,
      );

    const now =
      new Date()
        .toISOString();

    const repositories =
      githubRepositories.map(
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

    return ok({
      repositories,
    });
  } catch (error) {
    console.error(
      "Could not list GitHub repositories",
      error,
    );

    const apiError =
      getApiError(
        "ANALYSIS_FAILED",
        "GitHub repositories could not be loaded",
      );

    return fail(
      apiError.code,
      apiError.message,
      apiError.status,
    );
  }
}
