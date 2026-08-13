import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const extensionRoot = resolve(import.meta.dirname, "..");
const outputDirectory = process.argv[2] || "dist";
const distRoot = resolve(extensionRoot, outputDirectory);
const manifest = JSON.parse(await readFile(resolve(distRoot, "manifest.json"), "utf8"));

const failures = [];
if (manifest.manifest_version !== 3) failures.push("manifest_version must be 3");
if (!manifest.side_panel?.default_path) failures.push("side_panel.default_path is missing");
if (!manifest.permissions?.includes("sidePanel")) failures.push("sidePanel permission is missing");
if (!manifest.permissions?.includes("storage")) failures.push("storage permission is missing");
if ((manifest.description ?? "").length > 132) failures.push("description exceeds 132 characters");

const referencedFiles = [
  manifest.side_panel?.default_path,
  manifest.background?.service_worker,
  ...Object.values(manifest.icons ?? {}),
  ...(manifest.content_scripts ?? []).flatMap((entry) => [
    ...(entry.js ?? []),
    ...(entry.css ?? []),
  ]),
].filter(Boolean);

for (const file of referencedFiles) {
  try {
    await access(resolve(distRoot, file));
  } catch {
    failures.push(`manifest references missing file: ${file}`);
  }
}

const panelHtml = await readFile(
  resolve(distRoot, manifest.side_panel.default_path),
  "utf8"
);
if (/https?:\/\/fonts\.(googleapis|gstatic)\.com/.test(panelHtml)) {
  failures.push("panel loads a remote font");
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Verified RepoMind extension ${manifest.version} in ${outputDirectory} (${referencedFiles.length} packaged assets).`);
