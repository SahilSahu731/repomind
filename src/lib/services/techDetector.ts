import fs from "node:fs";
import path from "node:path";
import type { FileNode, TechStack } from "@/types";

const FRAMEWORK_DEPS: Record<string, string> = {
  react: "React",
  "react-dom": "React",
  next: "Next.js",
  express: "Express",
  "@nestjs/core": "NestJS",
  "@prisma/client": "Prisma",
  tailwindcss: "Tailwind CSS",
  d3: "D3.js",
};

export async function detectTechStack(
  rootDir: string,
  flatFiles: FileNode[]
): Promise<TechStack> {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const databases = new Set<string>();
  const tools = new Set<string>();
  const cicd = new Set<string>();
  const testing = new Set<string>();
  const dependencies: Record<string, string> = {};

  for (const file of flatFiles) {
    if (file.language) {
      languages.add(file.language);
    }

    if (file.path === "prisma/schema.prisma") {
      tools.add("Prisma");
      databases.add("PostgreSQL");
    }

    if (file.path === "next.config.ts" || file.path === "next.config.js") {
      frameworks.add("Next.js");
    }

    if (file.path.endsWith(".github/workflows")) {
      cicd.add("GitHub Actions");
    }
  }

  const packageFile = flatFiles.find((f) => f.path === "package.json");
  if (packageFile) {
    const fullPath = path.join(rootDir, packageFile.path);
    const packageJson = JSON.parse(fs.readFileSync(fullPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    for (const [dep, version] of Object.entries(packageJson.dependencies ?? {})) {
      dependencies[dep] = version;
      const mapped = FRAMEWORK_DEPS[dep];
      if (mapped) {
        frameworks.add(mapped);
      }
    }

    for (const dep of Object.keys(packageJson.devDependencies ?? {})) {
      if (dep.includes("jest") || dep.includes("vitest")) {
        testing.add(dep.includes("jest") ? "Jest" : "Vitest");
      }
    }
  }

  return {
    languages: [...languages],
    frameworks: [...frameworks],
    databases: [...databases],
    tools: [...tools],
    cicd: [...cicd],
    testing: [...testing],
    dependencies,
  };
}
