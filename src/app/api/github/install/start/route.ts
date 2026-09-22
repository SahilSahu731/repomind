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
  getGitHubAppInstallUrl,
  isGitHubAppConfigured,
} from "@/lib/github/app";

import {
  createGitHubInstallState,
} from "@/lib/github/installState";

export async function POST() {
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

  if (!isGitHubAppConfigured()) {
    return fail(
      "GITHUB_APP_NOT_CONFIGURED",
      "GitHub repository access is not configured yet. Add the GitHub App credentials to the server environment.",
      503,
    );
  }

  const state =
    createGitHubInstallState(
      session.user.id,
    );

  return ok({
    url:
      getGitHubAppInstallUrl(
        state,
      ),
  });
}
