import {
  getServerSession,
} from "next-auth";

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
  getValidGitHubUserAccessToken,
  listGitHubInstallationsForUser,
} from "@/lib/github/db";

import {
  syncAccessibleGitHubInstallationsForUser,
} from "@/lib/github/sync";

export async function GET() {
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

  try {
    const userToken =
      await getValidGitHubUserAccessToken(
        session.user.id,
      );

    /*
     * Refresh accessible installations whenever possible.
     *
     * If GitHub auth temporarily expired, the DB copy can still
     * render basic account connection state, but repository access
     * will remain blocked until live GitHub authorization succeeds.
     */
    if (userToken) {
      try {
        await syncAccessibleGitHubInstallationsForUser(
          session.user.id,
          userToken,
        );
      } catch (error) {
        console.warn(
          "Could not refresh user-visible GitHub installations",
          error,
        );
      }
    }

    const installations =
      await listGitHubInstallationsForUser(
        session.user.id,
      );

    return ok({
      installations,
    });
  } catch (error) {
    console.error(
      "Could not list GitHub installations",
      error,
    );

    const apiError =
      getApiError(
        "ANALYSIS_FAILED",
        "GitHub connections could not be loaded",
      );

    return fail(
      apiError.code,
      apiError.message,
      apiError.status,
    );
  }
}
