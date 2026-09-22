"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  signIn,
} from "next-auth/react";

import {
  ArrowRight,
  Github,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import type {
  GitHubInstallationRepositoryRow,
  GitHubInstallationRow,
} from "@/lib/github/db";

interface Success<T> {
  success: true;
  data: T;
}

interface Failure {
  success: false;

  error: {
    code: string;
    message: string;
  };
}

export function GitHubRepositoryPicker() {
  const router =
    useRouter();

  const [
    installations,
    setInstallations,
  ] = useState<
    GitHubInstallationRow[]
  >([]);

  const [
    installationId,
    setInstallationId,
  ] = useState<
    number | null
  >(null);

  const [
    repositories,
    setRepositories,
  ] = useState<
    GitHubInstallationRepositoryRow[]
  >([]);

  const [
    repositoryId,
    setRepositoryId,
  ] = useState("");

  const [
    loadingConnections,
    setLoadingConnections,
  ] = useState(true);

  const [
    loadingRepos,
    setLoadingRepos,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    connecting,
    setConnecting,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    needsReauthorization,
    setNeedsReauthorization,
  ] = useState(false);

  const selectedRepository =
    useMemo(
      () =>
        repositories.find(
          (repo) =>
            repo.githubRepositoryId ===
            repositoryId,
        ) ?? null,
      [
        repositories,
        repositoryId,
      ],
    );

  const loadInstallations =
    useCallback(
      async () => {
        setLoadingConnections(
          true,
        );

        setError(null);

        try {
          const response =
            await fetch(
              "/api/github/installations",
              {
                cache:
                  "no-store",
              },
            );

          const payload =
            (await response.json()) as
              | Success<{
                  installations:
                    GitHubInstallationRow[];
                }>
              | Failure;

          if (
            !response.ok ||
            !payload.success
          ) {
            setError(
              payload.success
                ? "Could not load GitHub connections."
                : payload.error
                    .message,
            );

            return;
          }

          setInstallations(
            payload.data
              .installations,
          );

          setInstallationId(
            (current) => {
              if (
                current &&
                payload.data
                  .installations
                  .some(
                    (item) =>
                      item.id ===
                      current,
                  )
              ) {
                return current;
              }

              return (
                payload.data
                  .installations[0]
                  ?.id ??
                null
              );
            },
          );
        } catch {
          setError(
            "Could not reach GitHub connections. Please try again.",
          );
        } finally {
          setLoadingConnections(
            false,
          );
        }
      },
      [],
    );

  const loadRepositories =
    useCallback(
      async (
        id: number,
        refresh = false,
      ) => {
        setLoadingRepos(true);

        setError(null);

        setNeedsReauthorization(
          false,
        );

        try {
          const response =
            await fetch(
              `/api/github/repositories?installationId=${id}${
                refresh
                  ? "&refresh=1"
                  : ""
              }`,
              {
                cache:
                  "no-store",
              },
            );

          const payload =
            (await response.json()) as
              | Success<{
                  repositories:
                    GitHubInstallationRepositoryRow[];
                }>
              | Failure;

          if (
            !response.ok ||
            !payload.success
          ) {
            if (
              response.status ===
              401
            ) {
              setNeedsReauthorization(
                true,
              );
            }

            setError(
              payload.success
                ? "Could not load repositories."
                : payload.error
                    .message,
            );

            return;
          }

          setRepositories(
            payload.data
              .repositories,
          );

          setRepositoryId(
            (current) => {
              if (
                payload.data
                  .repositories
                  .some(
                    (repo) =>
                      repo.githubRepositoryId ===
                      current,
                  )
              ) {
                return current;
              }

              return (
                payload.data
                  .repositories[0]
                  ?.githubRepositoryId ??
                ""
              );
            },
          );
        } catch {
          setError(
            "Could not load repositories from GitHub.",
          );
        } finally {
          setLoadingRepos(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    void loadInstallations();
  }, [loadInstallations]);

  useEffect(() => {
    if (!installationId) {
      setRepositories([]);

      setRepositoryId("");

      return;
    }

    void loadRepositories(
      installationId,
    );
  }, [
    installationId,
    loadRepositories,
  ]);

  async function connectGitHub() {
    setConnecting(true);

    setError(null);

    try {
      const response =
        await fetch(
          "/api/github/install/start",
          {
            method:
              "POST",
          },
        );

      const payload =
        (await response.json()) as
          | Success<{
              url: string;
            }>
          | Failure;

      if (
        !response.ok ||
        !payload.success
      ) {
        setError(
          payload.success
            ? "Could not start GitHub installation."
            : payload.error
                .message,
        );

        setConnecting(false);

        return;
      }

      window.location.assign(
        payload.data.url,
      );
    } catch {
      setError(
        "Could not open GitHub. Please try again.",
      );

      setConnecting(false);
    }
  }

  async function analyzeConnectedRepository() {
    if (
      !installationId ||
      !repositoryId ||
      !selectedRepository
    ) {
      return;
    }

    setSubmitting(true);

    setError(null);

    try {
      const response =
        await fetch(
          "/api/repos/analyze",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                installationId,

                githubRepositoryId:
                  repositoryId,
              }),
          },
        );

      const payload =
        (await response.json()) as
          | Success<{
              repoId?: string;
            }>
          | Failure;

      if (
        !response.ok ||
        !payload.success ||
        !payload.data.repoId
      ) {
        if (
          response.status ===
          401
        ) {
          setNeedsReauthorization(
            true,
          );
        }

        setError(
          payload.success
            ? "The analysis could not be started."
            : payload.error
                .message,
        );

        return;
      }

      router.push(
        `/user/dashboard?repoId=${
          encodeURIComponent(
            payload.data.repoId,
          )
        }&repo=${
          encodeURIComponent(
            selectedRepository.fullName,
          )
        }`,
      );
    } catch {
      setError(
        "Could not start repository analysis.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  if (
    loadingConnections
  ) {
    return (
      <div className="flex h-28 items-center justify-center border border-[#292721]/25 bg-[#f7f2e7] text-sm text-[#6d675f]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />

        Loading GitHub connections
      </div>
    );
  }

  if (
    installations.length ===
    0
  ) {
    return (
      <div className="border border-[#292721] bg-[#f7f2e7] p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#292721] text-[#f7f2e7]">
            <Github className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Connect your repositories
            </p>

            <p className="mt-1 text-xs leading-5 text-[#6d675f]">
              Install RepoMind on
              GitHub and choose exactly
              which repositories it may
              read. Private repositories
              remain read-only.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            connectGitHub
          }
          disabled={
            connecting
          }
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 bg-[#292721] px-4 text-sm font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f] disabled:opacity-60"
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}

          {connecting
            ? "Opening GitHub"
            : "Install RepoMind on GitHub"}

          {!connecting ? (
            <ArrowRight className="h-4 w-4" />
          ) : null}
        </button>

        {error ? (
          <p className="mt-3 text-xs text-[#82331f]">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">
            GitHub account
          </span>

          <select
            value={
              installationId ??
              ""
            }
            onChange={(
              event,
            ) =>
              setInstallationId(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            className="h-11 w-full border border-[#292721]/40 bg-[#f7f2e7] px-3 text-sm outline-none focus:border-[#292721]"
          >
            {installations.map(
              (
                installation,
              ) => (
                <option
                  key={
                    installation.id
                  }
                  value={
                    installation.id
                  }
                >
                  {
                    installation.accountLogin
                  }{" "}
                  ·{" "}
                  {
                    installation.accountType
                  }
                </option>
              ),
            )}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between font-mono text-[8px] uppercase tracking-[.14em] text-[#6d675f]">
            Repository

            {installationId ? (
              <button
                type="button"
                onClick={() =>
                  void loadRepositories(
                    installationId,
                    true,
                  )
                }
                className="inline-flex items-center gap-1 normal-case tracking-normal hover:text-[#292721]"
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    loadingRepos
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Sync
              </button>
            ) : null}
          </span>

          <select
            value={
              repositoryId
            }
            onChange={(
              event,
            ) =>
              setRepositoryId(
                event.target
                  .value,
              )
            }
            disabled={
              loadingRepos ||
              repositories.length ===
                0
            }
            className="h-11 w-full border border-[#292721]/40 bg-[#f7f2e7] px-3 text-sm outline-none focus:border-[#292721] disabled:opacity-60"
          >
            {repositories.length ===
            0 ? (
              <option value="">
                No repositories available
              </option>
            ) : null}

            {repositories.map(
              (repo) => (
                <option
                  key={
                    repo.githubRepositoryId
                  }
                  value={
                    repo.githubRepositoryId
                  }
                >
                  {
                    repo.fullName
                  }

                  {repo.isPrivate
                    ? " · private"
                    : ""}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {selectedRepository ? (
        <div className="flex items-center gap-2 text-xs text-[#6d675f]">
          {selectedRepository.isPrivate ? (
            <LockKeyhole className="h-3.5 w-3.5" />
          ) : (
            <Github className="h-3.5 w-3.5" />
          )}

          {selectedRepository.isPrivate
            ? "Private"
            : "Public"}{" "}
          · default branch{" "}
          {
            selectedRepository.defaultBranch
          }
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={
            analyzeConnectedRepository
          }
          disabled={
            !selectedRepository ||
            submitting
          }
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 bg-[#292721] px-4 text-sm font-medium text-[#f7f2e7] transition hover:bg-[#d75c3f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}

          {submitting
            ? "Starting analysis"
            : "Analyze selected repository"}

          {!submitting ? (
            <ArrowRight className="h-4 w-4" />
          ) : null}
        </button>

        <button
          type="button"
          onClick={
            connectGitHub
          }
          disabled={
            connecting
          }
          className="inline-flex h-11 items-center justify-center gap-2 border border-[#292721] px-4 text-xs font-semibold transition hover:bg-[#292721] hover:text-[#f7f2e7]"
        >
          <Github className="h-3.5 w-3.5" />

          Change access
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-l-2 border-[#a33f2b] pl-3 text-xs leading-5 text-[#82331f]"
        >
          {error}
        </p>
      ) : null}

      {needsReauthorization ? (
        <button
          type="button"
          onClick={() =>
            void signIn(
              "github",
              {
                callbackUrl:
                  "/user/dashboard",
              },
            )
          }
          className="inline-flex h-10 items-center gap-2 bg-[#d75c3f] px-4 text-xs font-semibold text-white transition hover:bg-[#b84830]"
        >
          <Github className="h-3.5 w-3.5" />

          Reauthorize GitHub
        </button>
      ) : null}
    </div>
  );
}
