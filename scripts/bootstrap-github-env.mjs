import { randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");

function parseKeys(contents) {
  return new Set(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.slice(0, line.indexOf("="))),
  );
}

function secret() {
  return randomBytes(48).toString("base64url");
}

let contents = await readFile(envPath, "utf8").catch((error) => {
  if (error?.code === "ENOENT") return "";
  throw error;
});

const keys = parseKeys(contents);
const additions = [];

if (!keys.has("SERVER_ENCRYPTION_KEY")) {
  additions.push(`SERVER_ENCRYPTION_KEY=${secret()}`);
}

if (!keys.has("GITHUB_WEBHOOK_SECRET")) {
  additions.push(`GITHUB_WEBHOOK_SECRET=${secret()}`);
}

if (!keys.has("WORKSPACE_DATABASE_MODE")) {
  additions.push("WORKSPACE_DATABASE_MODE=local");
}

if (!keys.has("ANALYSIS_EXECUTION_MODE")) {
  additions.push("ANALYSIS_EXECUTION_MODE=inline");
}

if (additions.length > 0) {
  const separator = contents.length > 0 && !contents.endsWith("\n") ? "\n" : "";
  contents += `${separator}\n# GitHub-only RepoMind foundation\n${additions.join("\n")}\n`;
  await writeFile(envPath, contents, { encoding: "utf8", mode: 0o600 });
  await chmod(envPath, 0o600);
}

const finalKeys = parseKeys(contents);
const externalKeys = [
  "GITHUB_APP_ID",
  "GITHUB_APP_SLUG",
  "GITHUB_APP_PRIVATE_KEY",
];
const missingExternal = externalKeys.filter((key) => !finalKeys.has(key));

console.log(
  additions.length > 0
    ? `Generated ${additions.length} missing local setting(s) without printing secret values.`
    : "Local generated settings were already present.",
);

if (missingExternal.length > 0) {
  console.log(`Still requires GitHub-issued values: ${missingExternal.join(", ")}`);
}
