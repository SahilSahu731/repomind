import {
  getGitHubInstallation,
  listGitHubInstallationRepositories,
  listGitHubUserInstallations,
} from "@/lib/github/app";

import {
  linkGitHubInstallationToUser,
  replaceGitHubInstallationRepositories,
  upsertGitHubInstallation,
} from "@/lib/github/db";

export async function syncGitHubInstallationRepositories(
  installationId: number,
): Promise<void> {
  const repositories =
    await listGitHubInstallationRepositories(
      installationId,
    );

  await replaceGitHubInstallationRepositories(
    installationId,
    repositories,
  );
}

export async function syncGitHubInstallationForUser(
  userId: string,
  installationId: number,
): Promise<void> {
  const installation =
    await getGitHubInstallation(
      installationId,
    );

  await upsertGitHubInstallation(
    installation,
  );

  await linkGitHubInstallationToUser(
    installationId,
    userId,
  );

  await syncGitHubInstallationRepositories(
    installationId,
  );
}

export async function syncAccessibleGitHubInstallationsForUser(
  userId: string,
  userAccessToken: string,
): Promise<number[]> {
  const installations =
    await listGitHubUserInstallations(
      userAccessToken,
    );

  for (
    const installation
    of installations
  ) {
    await upsertGitHubInstallation(
      installation,
    );

    await linkGitHubInstallationToUser(
      installation.id,
      userId,
    );
  }

  return installations.map(
    (installation) =>
      installation.id,
  );
}
