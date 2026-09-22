import {
  NextResponse,
} from "next/server";

import {
  verifyGitHubWebhookSignature,
} from "@/lib/github/app";

import {
  claimGitHubWebhookDelivery,
  clearGitHubUserCredentials,
  finishGitHubWebhookDelivery,
  getUserIdByGitHubUserId,
  linkGitHubInstallationToUser,
  markGitHubInstallationDeleted,
  upsertGitHubInstallation,
} from "@/lib/github/db";

import {
  syncGitHubInstallationRepositories,
} from "@/lib/github/sync";

import type {
  GitHubInstallation,
} from "@/lib/github/types";

interface InstallationWebhookPayload {
  action: string;

  installation:
    GitHubInstallation;

  sender?: {
    id: number;
  };
}

export async function POST(
  req: Request,
) {
  /*
   * Must read exact raw request body before parsing JSON.
   * GitHub signature is calculated over raw bytes.
   */
  const rawBody =
    await req.text();

  const signature =
    req.headers.get(
      "x-hub-signature-256",
    );

  if (
    !verifyGitHubWebhookSignature(
      rawBody,
      signature,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "invalid_signature",
      },
      {
        status: 401,
      },
    );
  }

  const event =
    req.headers.get(
      "x-github-event",
    ) ?? "";

  const delivery =
    req.headers.get(
      "x-github-delivery",
    ) ?? "";

  if (!delivery) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "missing_delivery_id",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * Webhook deliveries can be retried.
   * Never process the same successful delivery twice.
   */
  const claimed =
    await claimGitHubWebhookDelivery(
      delivery,
      event,
    );

  if (!claimed) {
    return NextResponse.json(
      {
        ok: true,

        duplicate:
          true,

        delivery,
      },
      {
        status: 202,
      },
    );
  }

  try {
    if (
      event === "ping"
    ) {
      await finishGitHubWebhookDelivery(
        delivery,
        "COMPLETED",
      );

      return NextResponse.json({
        ok: true,
        delivery,
      });
    }

    if (
      event ===
      "installation"
    ) {
      const payload =
        JSON.parse(
          rawBody,
        ) as InstallationWebhookPayload;

      const installationId =
        payload.installation.id;

      if (
        payload.action ===
        "deleted"
      ) {
        await markGitHubInstallationDeleted(
          installationId,
        );
      } else {
        await upsertGitHubInstallation(
          payload.installation,
        );

        if (
          payload.sender?.id
        ) {
          const userId =
            await getUserIdByGitHubUserId(
              String(
                payload.sender.id,
              ),
            );

          if (userId) {
            await linkGitHubInstallationToUser(
              installationId,
              userId,
            );
          }
        }

        if (
          [
            "created",
            "unsuspend",
            "new_permissions_accepted",
          ].includes(
            payload.action,
          )
        ) {
          await syncGitHubInstallationRepositories(
            installationId,
          );
        }
      }

      await finishGitHubWebhookDelivery(
        delivery,
        "COMPLETED",
      );

      return NextResponse.json(
        {
          ok: true,
          delivery,
        },
        {
          status: 202,
        },
      );
    }

    if (
      event ===
      "installation_repositories"
    ) {
      const payload =
        JSON.parse(
          rawBody,
        ) as InstallationWebhookPayload;

      await upsertGitHubInstallation(
        payload.installation,
      );

      await syncGitHubInstallationRepositories(
        payload.installation.id,
      );

      await finishGitHubWebhookDelivery(
        delivery,
        "COMPLETED",
      );

      return NextResponse.json(
        {
          ok: true,
          delivery,
        },
        {
          status: 202,
        },
      );
    }

    /*
     * GitHub sends github_app_authorization when a user
     * revokes authorization. Clear the server-side user token.
     */
    if (
      event ===
      "github_app_authorization"
    ) {
      const payload =
        JSON.parse(
          rawBody,
        ) as {
          action:
            string;

          sender?: {
            id: number;
          };
        };

      if (
        payload.action ===
          "revoked" &&
        payload.sender?.id
      ) {
        const userId =
          await getUserIdByGitHubUserId(
            String(
              payload.sender.id,
            ),
          );

        if (userId) {
          await clearGitHubUserCredentials(
            userId,
          );
        }
      }

      await finishGitHubWebhookDelivery(
        delivery,
        "COMPLETED",
      );

      return NextResponse.json(
        {
          ok: true,
          delivery,
        },
        {
          status: 202,
        },
      );
    }

    await finishGitHubWebhookDelivery(
      delivery,
      "COMPLETED",
    );

    return NextResponse.json(
      {
        ok: true,
        ignored: true,
        delivery,
      },
      {
        status: 202,
      },
    );
  } catch (error) {
    await finishGitHubWebhookDelivery(
      delivery,
      "FAILED",
    ).catch(
      () => undefined,
    );

    console.error(
      `GitHub webhook ${delivery} failed`,
      error,
    );

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      },
    );
  }
}
