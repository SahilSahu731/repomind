import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function cloneRepo(
  url: string,
  branch: string,
  targetDir: string
): Promise<void> {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  try {
    const normalizedBranch = branch.trim();
    const useDefaultBranch = normalizedBranch === "" || normalizedBranch === "HEAD";
    const args = ["clone", "--depth", "1"];

    if (!useDefaultBranch) {
      args.push("--single-branch", "--branch", normalizedBranch);
    }

    args.push("--", url, targetDir);

    await execFileAsync("git", args, {
      timeout: 60_000,
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
