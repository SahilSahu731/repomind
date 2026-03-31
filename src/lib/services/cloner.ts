import { execSync } from "node:child_process";
import fs from "node:fs";

export async function cloneRepo(
  url: string,
  branch: string,
  targetDir: string
): Promise<void> {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  try {
    execSync(
      `git clone --depth 1 --single-branch --branch ${branch} ${url} ${targetDir}`,
      { timeout: 60_000, stdio: "pipe" }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Clone failed";

    if (message.includes("Repository not found")) {
      throw new Error("REPO_NOT_FOUND: Repository does not exist or is private");
    }

    if (message.includes("could not find remote branch")) {
      throw new Error(`BRANCH_NOT_FOUND: Branch '${branch}' does not exist`);
    }

    throw new Error(`CLONE_FAILED: ${message}`);
  }
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
