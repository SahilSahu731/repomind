import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { extract } from "tar";

const execFileAsync = promisify(execFile);
const MAX_ARCHIVE_BYTES = 75 * 1024 * 1024;
const CLONE_TIMEOUT_MS = 60_000;

export async function cloneRepo(
  url: string,
  branch: string,
  targetDir: string
): Promise<void> {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  try {
    if (process.env.VERCEL === "1") {
      await downloadGitHubArchive(url, branch, targetDir);
      return;
    }

    const normalizedBranch = branch.trim();
    const useDefaultBranch = normalizedBranch === "" || normalizedBranch === "HEAD";
    const args = ["clone", "--depth", "1"];

    if (!useDefaultBranch) {
      args.push("--single-branch", "--branch", normalizedBranch);
    }

    args.push("--", url, targetDir);

    await execFileAsync("git", args, {
      timeout: CLONE_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
  } catch (error: unknown) {
    if (isCloneTimeout(error)) {
      throw new Error("CLONE_TIMEOUT: GitHub did not finish cloning within 60 seconds");
    }

    const message = getCloneErrorMessage(error, url);

    if (/couldn't find remote ref|could not find remote branch|remote branch .* not found/i.test(message)) {
      throw new Error(`BRANCH_NOT_FOUND: Branch '${branch}' does not exist`);
    }

    if (/repository(?: .*?)? not found|authentication failed|access denied|could not read username/i.test(message)) {
      throw new Error("REPO_NOT_FOUND: Repository does not exist or is private");
    }

    throw new Error(`CLONE_FAILED: ${message}`);
  }
}

async function downloadGitHubArchive(
  repositoryUrl: string,
  branch: string,
  targetDir: string
): Promise<void> {
  const repository = parseGitHubRepository(repositoryUrl);
  const ref = branch.trim() || "HEAD";
  const archiveUrl = new URL(
    `/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/tar.gz/${encodeURIComponent(ref)}`,
    "https://codeload.github.com"
  );
  const archivePath = path.join(os.tmpdir(), `repomind-${crypto.randomUUID()}.tar.gz`);

  try {
    const response = await fetch(archiveUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "RepoMind/1.0",
      },
      signal: AbortSignal.timeout(CLONE_TIMEOUT_MS),
      redirect: "follow",
    });

    if (response.status === 404) {
      throw new Error(
        ref === "HEAD"
          ? "REPO_NOT_FOUND: Repository does not exist or is private"
          : `BRANCH_NOT_FOUND: Branch '${branch}' does not exist`
      );
    }

    if (!response.ok || !response.body) {
      throw new Error(`CLONE_FAILED: GitHub archive request returned ${response.status}`);
    }

    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_ARCHIVE_BYTES) {
      throw new Error("CLONE_FAILED: Repository archive is too large to analyze safely");
    }

    const reader = response.body.getReader();
    const archive = fs.createWriteStream(archivePath, { flags: "wx", mode: 0o600 });
    let downloadedBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        downloadedBytes += value.byteLength;
        if (downloadedBytes > MAX_ARCHIVE_BYTES) {
          await reader.cancel();
          throw new Error("CLONE_FAILED: Repository archive is too large to analyze safely");
        }

        if (!archive.write(Buffer.from(value))) {
          await new Promise<void>((resolve, reject) => {
            archive.once("drain", resolve);
            archive.once("error", reject);
          });
        }
      }

      await new Promise<void>((resolve, reject) => {
        archive.end(resolve);
        archive.once("error", reject);
      });
    } catch (error) {
      archive.destroy();
      throw error;
    }

    fs.mkdirSync(targetDir, { recursive: true });
    await extract({
      cwd: targetDir,
      file: archivePath,
      gzip: true,
      strip: 1,
      preservePaths: false,
      strict: true,
    });
  } catch (error: unknown) {
    if (error instanceof Error && /^(REPO_NOT_FOUND|BRANCH_NOT_FOUND|CLONE_FAILED):/.test(error.message)) {
      throw error;
    }

    if (isCloneTimeout(error)) {
      throw new Error("CLONE_TIMEOUT: GitHub did not finish downloading within 60 seconds");
    }

    throw new Error(`CLONE_FAILED: ${getCloneErrorMessage(error, repositoryUrl)}`);
  } finally {
    fs.rmSync(archivePath, { force: true });
  }
}

function parseGitHubRepository(repositoryUrl: string): { owner: string; repo: string } {
  const parsed = new URL(repositoryUrl);
  const [owner, rawRepo] = parsed.pathname.split("/").filter(Boolean);
  const repo = rawRepo?.replace(/\.git$/i, "");

  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || !owner || !repo) {
    throw new Error("REPO_NOT_FOUND: Repository URL is not a supported GitHub repository");
  }

  return { owner, repo };
}

function isCloneTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const processError = error as Error & {
    code?: string | number;
    killed?: boolean;
    signal?: string;
  };

  return (
    processError.code === "ETIMEDOUT" ||
    processError.killed === true ||
    processError.signal === "SIGTERM" ||
    /timed?\s*out/i.test(processError.message)
  );
}

function getCloneErrorMessage(error: unknown, repositoryUrl: string): string {
  if (!(error instanceof Error)) {
    return "Clone failed";
  }

  const processError = error as Error & { stderr?: string | Buffer; stdout?: string | Buffer };
  const details = [processError.stderr, processError.stdout, processError.message]
    .filter(Boolean)
    .map((value) => String(value))
    .join("\n")
    .replaceAll(repositoryUrl, "[repository]")
    .trim();

  return details.slice(0, 1_000) || "Clone failed";
}

export async function cleanupRepo(dir: string): Promise<void> {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup failures.
  }
}
