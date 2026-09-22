import {
  getServerSession,
} from "next-auth";

import type {
  NextRequest,
} from "next/server";

import {
  NextResponse,
} from "next/server";

import {
  authOptions,
} from "@/lib/auth";

import {
  userCanAccessGitHubInstallation,
} from "@/lib/github/app";

import {
  getValidGitHubUserAccessToken,
} from "@/lib/github/db";

import {
  verifyGitHubInstallState,
} from "@/lib/github/installState";

import {
  syncGitHubInstallationForUser,
} from "@/lib/github/sync";

function dashboardUrl(
  req: NextRequest,
  params:
    Record<string, string>,
): URL {
  const url =
    new URL(
      "/user/dashboard",
      req.url,
    );

  for (
    const [key, value]
    of Object.entries(
      params,
    )
  ) {
    url.searchParams.set(
      key,
      value,
    );
  }

  return url;
}

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
    const login =
      new URL(
        "/login",
        req.url,
      );

    login.searchParams.set(
      "callbackUrl",
      "/user/dashboard",
    );

    return NextResponse.redirect(
      login,
    );
  }

  const installationId =
    Number(
      req.nextUrl.searchParams.get(
        "installation_id",
      ),
    );

  const state =
    req.nextUrl.searchParams.get(
      "state",
    ) ?? "";

  if (
    !Number.isSafeInteger(
      installationId,
    ) ||
    installationId <= 0
  ) {
    return NextResponse.redirect(
      dashboardUrl(
        req,
        {
          github:
            "invalid_installation",
        },
      ),
    );
  }

  if (
    !verifyGitHubInstallState(
      state,
      session.user.id,
    )
  ) {
    return NextResponse.redirect(
      dashboardUrl(
        req,
        {
          github:
            "invalid_state",
        },
      ),
    );
  }

  try {
    /*
     * Do not trust installation_id alone.
     * GitHub explicitly warns setup URLs can be spoofed.
     */
    const userToken =
      await getValidGitHubUserAccessToken(
        session.user.id,
      );

    if (!userToken) {
      return NextResponse.redirect(
        dashboardUrl(
          req,
          {
            github:
              "github_reauthorization_required",
          },
        ),
      );
    }

    const verified =
      await userCanAccessGitHubInstallation(
        userToken,
        installationId,
      );

    if (!verified) {
      return NextResponse.redirect(
        dashboardUrl(
          req,
          {
            github:
              "installation_not_authorized",
          },
        ),
      );
    }

    await syncGitHubInstallationForUser(
      session.user.id,
      installationId,
    );

    return NextResponse.redirect(
      dashboardUrl(
        req,
        {
          github:
            "connected",

          installationId:
            String(
              installationId,
            ),
        },
      ),
    );
  } catch (error) {
    console.error(
      "GitHub installation callback failed",
      error,
    );

    return NextResponse.redirect(
      dashboardUrl(
        req,
        {
          github:
            "connection_failed",
        },
      ),
    );
  }
}
